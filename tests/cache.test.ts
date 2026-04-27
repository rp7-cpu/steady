import { describe, it, expect, vi } from 'vitest';
import { steady } from '../src/steady';

describe('cache', () => {
  it('should return cached response for identical GET requests', async () => {
    let calls = 0;
    globalThis.fetch = vi.fn().mockImplementation(() => {
      calls++;
      return Promise.resolve(new Response(JSON.stringify({ data: calls }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }));
    });

    const fetch = steady({ cache: { ttl: 999999, maxSize: 10 } });

    const res1 = await fetch('https://api.example.com/data');
    const json1 = await res1.json();
    expect(json1.data).toBe(1);
    expect(calls).toBe(1);

    const res2 = await fetch('https://api.example.com/data');
    const json2 = await res2.json();
    expect(json2.data).toBe(1); // Still 1, cached
    expect(calls).toBe(1); // No new call
  });

  it('should not cache POST by default', async () => {
    let calls = 0;
    globalThis.fetch = vi.fn().mockImplementation(() => {
      calls++;
      return Promise.resolve(new Response(JSON.stringify({ data: calls }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }));
    });

    const fetch = steady({ cache: { ttl: 999999, maxSize: 10 } });

    await fetch('https://api.example.com/data', { method: 'POST', body: 'test' });
    expect(calls).toBe(1);
    await fetch('https://api.example.com/data', { method: 'POST', body: 'test' });
    expect(calls).toBe(2); // Not cached
  });

  it('should evict oldest entry when reaching maxSize', async () => {
    globalThis.fetch = vi.fn().mockImplementation((url) => {
      return Promise.resolve(new Response(url, { status: 200 }));
    });

    const fetch = steady({ cache: { ttl: 999999, maxSize: 2 } });

    await fetch('https://api.example.com/1');
    await fetch('https://api.example.com/2');
    await fetch('https://api.example.com/3'); // Should evict /1

    // Re-request /1 should miss cache
    let called = false;
    globalThis.fetch = vi.fn().mockImplementation(() => {
      called = true;
      return Promise.resolve(new Response('fresh', { status: 200 }));
    });
    await fetch('https://api.example.com/1');
    expect(called).toBe(true);
  });
});
