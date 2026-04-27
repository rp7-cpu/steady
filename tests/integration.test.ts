import { describe, it, expect, vi } from 'vitest';
import { steady } from '../src/steady';

describe('integration', () => {
  it('should retry, open circuit, and still serve from cache when circuit is open', async () => {
    let calls = 0;
    globalThis.fetch = vi.fn().mockImplementation(() => {
      calls++;
      // First 2 calls are successful (fill cache), then fail 3 times
      if (calls <= 2) return Promise.resolve(new Response(JSON.stringify({ data: calls }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }));
      return Promise.resolve(new Response(null, { status: 503 }));
    });

    const fetch = steady({
      retry: { max: 2 },
      circuitBreaker: { threshold: 2, resetTimeout: 999999, serveStaleOnOpen: true },
      cache: { ttl: 999999, maxSize: 10 }
    });

    // First request - cache miss
    const res1 = await fetch('https://api.example.com/data');
    expect(res1.status).toBe(200);
    const json1 = await res1.json();
    expect(json1.data).toBe(1);

    // Second request - cache hit (even though fetch is called, it's for cache)
    const res2 = await fetch('https://api.example.com/data');
    const json2 = await res2.json();
    expect(json2.data).toBe(1);
    expect(calls).toBe(1); // Only one actual network call

    // Now cause failures to open circuit
    await fetch('https://api.example.com/data').catch(() => {});
    await fetch('https://api.example.com/data').catch(() => {});

    // Circuit should be open, but we can still get cached response
    const res3 = await fetch('https://api.example.com/data');
    expect(res3.status).toBe(200);
    const json3 = await res3.json();
    expect(json3.data).toBe(1);
  });
});
