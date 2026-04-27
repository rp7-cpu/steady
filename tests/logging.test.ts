import { describe, it, expect, vi } from 'vitest';
import { steady } from '../src/steady';

describe('logging', () => {
  it('should emit cache_hit event when response is served from cache', async () => {
    const events: any[] = [];
    globalThis.fetch = vi.fn().mockImplementation(() => {
      return Promise.resolve(new Response('ok', { status: 200 }));
    });

    const fetch = steady({
      cache: { ttl: 999999, maxSize: 10 },
      log: (event) => events.push(event)
    });

    await fetch('https://api.example.com/data');
    expect(events.some(e => e.type === 'cache_miss')).toBe(true);

    events.length = 0;
    await fetch('https://api.example.com/data');
    expect(events.some(e => e.type === 'cache_hit')).toBe(true);
  });

  it('should emit retry event when retrying', async () => {
    const events: any[] = [];
    let attempts = 0;
    globalThis.fetch = vi.fn().mockImplementation(() => {
      attempts++;
      if (attempts === 1) throw new TypeError('fetch failed');
      return Promise.resolve(new Response('ok', { status: 200 }));
    });

    const fetch = steady({
      log: (event) => events.push(event)
    });

    await fetch('https://api.example.com/data');
    // Dopo un tentativo fallito e uno riuscito, dovrebbe esserci un evento 'retry'
    expect(events.some(e => e.type === 'retry')).toBe(true);
    // Non ci sarà un evento 'request' perché il tentativo riuscito è il secondo, quindi etichettato come 'retry'
  });
});
