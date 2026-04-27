import type { SteadyOptions, SteadyFetch, SteadyEvent } from './types';
import { mergeOptions } from './defaults';
import { shouldRetry, backoffDelay } from './retry';
import { CircuitBreaker } from './circuit-breaker';
import { LRUCache } from './cache';
import { generateIdempotencyKey } from './idempotency';
import { injectKey } from './key-injection';
import { createLogger } from './logger';

export function createSteady(userOptions?: SteadyOptions): SteadyFetch {
  const options = mergeOptions(userOptions);
  const breakers = new Map<string, CircuitBreaker>();
  const cache = new LRUCache(options.cache.maxSize, options.cache.maxBytes ?? 0, options.cache.ttl);
  const log = createLogger(options.log);

  return async (input, init) => {
    const url = typeof input === 'string' ? input : input.url;
    const method = init?.method || 'GET';
    const host = new URL(url).host;

    init = injectKey(url, init, options.keyMap) || init;

    if (options.cache.methods.includes(method)) {
      const cached = cache.get(input, init);
      if (cached) {
        log({ type: 'cache_hit', url, method, attempt: 1, duration: 0 });
        return cached;
      }
    }

    let breaker = breakers.get(host);
    if (!breaker) {
      breaker = new CircuitBreaker(options.circuitBreaker.threshold, options.circuitBreaker.resetTimeout);
      breakers.set(host, breaker);
    }
    if (!breaker.allowRequest()) {
      if (options.circuitBreaker.serveStaleOnOpen) {
        const cached = cache.get(input, init);
        if (cached) {
          log({ type: 'cache_hit', url, method, attempt: 1, duration: 0 });
          return cached;
        }
      }
      throw new Error('Circuit breaker is OPEN');
    }

    if (options.idempotency && (method === 'POST' || method === 'PUT')) {
      const key = await generateIdempotencyKey(input, init);
      const headers = new Headers(init?.headers);
      if (!headers.has('Idempotency-Key')) {
        headers.set('Idempotency-Key', key);
        init = { ...init, headers };
      }
    }

    let lastError: any;
    let response: Response | undefined;
    const maxRetries = options.retry.max;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const start = Date.now();
      try {
        response = await fetch(input, init);
        const duration = Date.now() - start;
        if (response.ok) {
          breaker.success();
          if (options.cache.methods.includes(method)) {
            cache.set(input, init, response.clone());
            log({ type: 'cache_miss', url, method, attempt, duration });
          }
          log({ type: attempt === 1 ? 'request' : 'retry', url, method, attempt, duration, status: response.status });
          return response;
        }
        if (shouldRetry(null, response.status, options.retry.on, options.retry.onNetworkError)) {
          breaker.failure();
          lastError = new Error(`HTTP ${response.status}`);
          if (attempt < maxRetries) {
            const delay = backoffDelay(attempt, options.retry.backoff, options.retry.jitter);
            await new Promise(r => setTimeout(r, delay));
          }
          log({ type: 'retry', url, method, attempt, duration, status: response.status });
          continue;
        }
        breaker.success();
        return response;
      } catch (err: any) {
        const duration = Date.now() - start;
        if (shouldRetry(err, undefined, options.retry.on, options.retry.onNetworkError)) {
          breaker.failure();
          lastError = err;
          if (attempt < maxRetries) {
            const delay = backoffDelay(attempt, options.retry.backoff, options.retry.jitter);
            await new Promise(r => setTimeout(r, delay));
          }
          log({ type: 'retry', url, method, attempt, duration, error: err });
          continue;
        }
        breaker.failure();
        log({ type: 'error', url, method, attempt, duration, error: err });
        throw err;
      }
    }
    log({ type: 'error', url, method, attempt: maxRetries, duration: 0, error: lastError });
    throw lastError;
  };
}
