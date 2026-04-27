import { describe, it, expect, vi } from 'vitest';
import { steady } from '../src/steady';

describe('circuit breaker', () => {
  it('should open circuit after threshold failures and serve stale if enabled', async () => {
    let calls = 0;
    globalThis.fetch = vi.fn().mockImplementation(() => {
      calls++;
      return Promise.resolve(new Response(null, { status: 503 }));
    });

    const fetch = steady({
      retry: { max: 1 }, // Disabilita retry per questo test
      circuitBreaker: { threshold: 3, resetTimeout: 999999, serveStaleOnOpen: true },
      cache: { ttl: 999999, methods: ['GET'] }
    });

    // Forza 3 fallimenti (senza retry automatici) per aprire il circuito
    await fetch('https://api.example.com/resource').catch(() => {});
    await fetch('https://api.example.com/resource').catch(() => {});
    await fetch('https://api.example.com/resource').catch(() => {});
    expect(calls).toBe(3);

    // La quarta chiamata dovrebbe essere bloccata dal circuito
    await expect(fetch('https://api.example.com/resource')).rejects.toThrow('Circuit breaker is OPEN');
    expect(calls).toBe(3); // Nessuna nuova chiamata
  });

  it('should close circuit after success in half-open state', async () => {
    let calls = 0;
    // Prima fallisce per aprire il circuito
    globalThis.fetch = vi.fn().mockImplementation(() => {
      calls++;
      return Promise.resolve(new Response(null, { status: 503 }));
    });

    const fetch = steady({
      retry: { max: 1 },
      circuitBreaker: { threshold: 1, resetTimeout: 10 }
    });

    await fetch('https://api.example.com/resource').catch(() => {});

    // Aspetta che scada il timeout di reset
    await new Promise(r => setTimeout(r, 20));

    // Ora il fetch dovrebbe funzionare
    globalThis.fetch = vi.fn().mockImplementation(() => {
      calls++;
      return Promise.resolve(new Response('ok', { status: 200 }));
    });

    const res = await fetch('https://api.example.com/resource');
    expect(res.status).toBe(200);
  });
});
