import { describe, it, expect, vi } from 'vitest';
import { steady } from '../src/steady';

describe('key injection', () => {
  it('should add Authorization header when keyMap matches', async () => {
    let capturedHeaders: any;
    globalThis.fetch = vi.fn().mockImplementation((url, init) => {
      capturedHeaders = init?.headers;
      return Promise.resolve(new Response('ok', { status: 200 }));
    });

    const fetch = steady({ keyMap: { 'api.example.com': 'my-secret-key' } });
    await fetch('https://api.example.com/data');

    const headers = new Headers(capturedHeaders);
    expect(headers.get('Authorization')).toBe('Bearer my-secret-key');
  });

  it('should not override existing Authorization header', async () => {
    let capturedHeaders: any;
    globalThis.fetch = vi.fn().mockImplementation((url, init) => {
      capturedHeaders = init?.headers;
      return Promise.resolve(new Response('ok', { status: 200 }));
    });

    const fetch = steady({ keyMap: { 'api.example.com': 'injected-key' } });
    await fetch('https://api.example.com/data', {
      headers: { 'Authorization': 'Bearer user-key' }
    });

    const headers = new Headers(capturedHeaders);
    expect(headers.get('Authorization')).toBe('Bearer user-key'); // Not injected
  });
});
