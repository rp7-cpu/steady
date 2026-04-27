import { describe, it, expect, vi } from 'vitest';
import { steady } from '../src/steady';

describe('steady retry', () => {
  it('should retry on network error and succeed on second attempt', async () => {
    let attempts = 0;
    globalThis.fetch = vi.fn().mockImplementation(() => {
      attempts++;
      if (attempts === 1) throw new TypeError('fetch failed');
      return Promise.resolve(new Response('ok', { status: 200 }));
    });

    const fetch = steady();
    const res = await fetch('https://api.example.com');
    expect(res.status).toBe(200);
    expect(attempts).toBe(2);
  });
});
