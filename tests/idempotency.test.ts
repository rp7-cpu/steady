import { describe, it, expect, vi } from 'vitest';
import { steady } from '../src/steady';

describe('idempotency', () => {
  it('should cache response for identical POST requests when idempotency is on', async () => {
    let calls = 0;
    globalThis.fetch = vi.fn().mockImplementation(() => {
      calls++;
      return Promise.resolve(new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': 'test-key' }
      }));
    });

    const fetch = steady({
      idempotency: true,
      cache: { ttl: 999999, maxSize: 10, methods: ['GET', 'POST'] }
    });

    await fetch('https://api.example.com/action', { method: 'POST', body: '{"a":1}' });
    expect(calls).toBe(1);
    await fetch('https://api.example.com/action', { method: 'POST', body: '{"a":1}' });
    expect(calls).toBe(1); // Cached, no new request
  });

  it('should not retry on 400 with Idempotency-Key header', async () => {
    let calls = 0;
    globalThis.fetch = vi.fn().mockImplementation(() => {
      calls++;
      return Promise.resolve(new Response('Bad Request', { status: 400 }));
    });

    const fetch = steady({ idempotency: true });

    // Should not retry, just propagate error
    const res = await fetch('https://api.example.com/action', { method: 'POST', body: 'test' });
    expect(res.status).toBe(400);
    expect(calls).toBe(1); // No retries
  });
});
