// src/defaults.ts
var defaults = {
  retry: {
    max: 3,
    backoff: "exponential",
    jitter: "full",
    on: [502, 503, 504, 429],
    onNetworkError: ["ETIMEDOUT", "ECONNRESET", "ECONNREFUSED", "TypeError"]
  },
  circuitBreaker: {
    threshold: 5,
    resetTimeout: 3e4,
    serveStaleOnOpen: true
  },
  cache: {
    ttl: 6e4,
    maxSize: 500,
    maxBytes: void 0,
    methods: ["GET"]
  },
  idempotency: false,
  keyMap: {},
  log: void 0
};
function mergeOptions(user) {
  if (!user) return { ...defaults, cache: { ...defaults.cache }, circuitBreaker: { ...defaults.circuitBreaker }, retry: { ...defaults.retry } };
  return {
    retry: { ...defaults.retry, ...user.retry, on: user.retry?.on ?? defaults.retry.on, onNetworkError: user.retry?.onNetworkError ?? defaults.retry.onNetworkError },
    circuitBreaker: { ...defaults.circuitBreaker, ...user.circuitBreaker },
    cache: { ...defaults.cache, ...user.cache, maxBytes: user.cache?.maxBytes ?? defaults.cache.maxBytes, methods: user.cache?.methods ?? defaults.cache.methods },
    idempotency: user.idempotency ?? defaults.idempotency,
    keyMap: user.keyMap ?? {},
    log: user.log ?? (() => {
    })
  };
}

// src/retry.ts
function backoffDelay(attempt, backoff, jitter) {
  let base;
  if (backoff === "exponential") base = Math.pow(2, attempt) * 1e3;
  else if (backoff === "linear") base = attempt * 1e3;
  else base = 1e3;
  if (!jitter) return base;
  const jitterAmount = jitter === "full" ? Math.random() * base : base / 2 * Math.random();
  return base + jitterAmount;
}
function shouldRetry(error, status, on, onNetworkError) {
  if (status && on.includes(status)) return true;
  if (!status && error) {
    const code = error?.code;
    const message = error?.message || "";
    if (code && onNetworkError.includes(code)) return true;
    if (!code && message.includes("fetch failed") && onNetworkError.includes("TypeError")) return true;
  }
  return false;
}

// src/circuit-breaker.ts
var CircuitBreaker = class {
  state = "CLOSED";
  failures = 0;
  lastFailureTime = 0;
  threshold;
  resetTimeout;
  constructor(threshold, resetTimeout) {
    this.threshold = threshold;
    this.resetTimeout = resetTimeout;
  }
  success() {
    if (this.state === "HALF_OPEN") {
      this.state = "CLOSED";
      this.failures = 0;
    } else if (this.state === "CLOSED") {
      this.failures = 0;
    }
  }
  failure() {
    this.failures++;
    this.lastFailureTime = Date.now();
    if (this.state === "HALF_OPEN" || this.state === "CLOSED" && this.failures >= this.threshold) {
      this.state = "OPEN";
    }
  }
  allowRequest() {
    if (this.state === "CLOSED") return true;
    if (this.state === "OPEN") {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = "HALF_OPEN";
        return true;
      }
      return false;
    }
    return true;
  }
};

// src/cache.ts
var LRUCache = class {
  map = /* @__PURE__ */ new Map();
  maxSize;
  maxBytes;
  ttl;
  constructor(maxSize, maxBytes, ttl) {
    this.maxSize = maxSize;
    this.maxBytes = maxBytes;
    this.ttl = ttl;
  }
  computeKey(input, init) {
    const url = typeof input === "string" ? input : input.url;
    const method = init?.method || "GET";
    const body = init?.body ? String(init.body) : "";
    return `${method}:${url}:${body}`;
  }
  totalBytes() {
    let sum = 0;
    for (const v of this.map.values()) sum += v.size;
    return sum;
  }
  get(input, init) {
    const key = this.computeKey(input, init);
    const entry = this.map.get(key);
    if (!entry) return void 0;
    if (Date.now() - entry.timestamp > this.ttl) {
      this.map.delete(key);
      return void 0;
    }
    this.map.delete(key);
    this.map.set(key, entry);
    return entry.response.clone();
  }
  set(input, init, response) {
    const key = this.computeKey(input, init);
    const cloned = response.clone();
    const size = parseInt(cloned.headers.get("content-length") || "0", 10) || 1024;
    while (this.map.size >= this.maxSize || this.maxBytes > 0 && this.totalBytes() + size > this.maxBytes) {
      const oldest = this.map.keys().next().value;
      if (oldest === void 0) break;
      this.map.delete(oldest);
    }
    this.map.set(key, { response: cloned, timestamp: Date.now(), size });
  }
};

// src/idempotency.ts
async function generateIdempotencyKey(input, init) {
  const url = typeof input === "string" ? input : input.url;
  const method = init?.method || "GET";
  const body = init?.body ? String(init.body) : "";
  const data = `${method}:${url}:${body}`;
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(data));
  return Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// src/key-injection.ts
function injectKey(url, init, keyMap) {
  if (!keyMap || Object.keys(keyMap).length === 0) return init;
  const host = new URL(url).host;
  const key = keyMap[host];
  if (!key) return init;
  const headers = new Headers(init?.headers);
  if (!headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${key}`);
  }
  return { ...init, headers };
}

// src/logger.ts
function createLogger(cb) {
  if (!cb) return () => {
  };
  return (event) => {
    cb(event);
  };
}

// src/pipeline.ts
function createSteady(userOptions) {
  const options = mergeOptions(userOptions);
  const breakers = /* @__PURE__ */ new Map();
  const cache = new LRUCache(options.cache.maxSize, options.cache.maxBytes ?? 0, options.cache.ttl);
  const log = createLogger(options.log);
  return async (input, init) => {
    const url = typeof input === "string" ? input : input.url;
    const method = init?.method || "GET";
    const host = new URL(url).host;
    init = injectKey(url, init, options.keyMap) || init;
    if (options.cache.methods.includes(method)) {
      const cached = cache.get(input, init);
      if (cached) {
        log({ type: "cache_hit", url, method, attempt: 1, duration: 0 });
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
          log({ type: "cache_hit", url, method, attempt: 1, duration: 0 });
          return cached;
        }
      }
      throw new Error("Circuit breaker is OPEN");
    }
    if (options.idempotency && (method === "POST" || method === "PUT")) {
      const key = await generateIdempotencyKey(input, init);
      const headers = new Headers(init?.headers);
      if (!headers.has("Idempotency-Key")) {
        headers.set("Idempotency-Key", key);
        init = { ...init, headers };
      }
    }
    let lastError;
    let response;
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
            log({ type: "cache_miss", url, method, attempt, duration });
          }
          log({ type: attempt === 1 ? "request" : "retry", url, method, attempt, duration, status: response.status });
          return response;
        }
        if (shouldRetry(null, response.status, options.retry.on, options.retry.onNetworkError)) {
          breaker.failure();
          lastError = new Error(`HTTP ${response.status}`);
          if (attempt < maxRetries) {
            const delay = backoffDelay(attempt, options.retry.backoff, options.retry.jitter);
            await new Promise((r) => setTimeout(r, delay));
          }
          log({ type: "retry", url, method, attempt, duration, status: response.status });
          continue;
        }
        breaker.success();
        return response;
      } catch (err) {
        const duration = Date.now() - start;
        if (shouldRetry(err, void 0, options.retry.on, options.retry.onNetworkError)) {
          breaker.failure();
          lastError = err;
          if (attempt < maxRetries) {
            const delay = backoffDelay(attempt, options.retry.backoff, options.retry.jitter);
            await new Promise((r) => setTimeout(r, delay));
          }
          log({ type: "retry", url, method, attempt, duration, error: err });
          continue;
        }
        breaker.failure();
        log({ type: "error", url, method, attempt, duration, error: err });
        throw err;
      }
    }
    log({ type: "error", url, method, attempt: maxRetries, duration: 0, error: lastError });
    throw lastError;
  };
}

// src/steady.ts
function steady(options) {
  return createSteady(options);
}
export {
  steady
};
