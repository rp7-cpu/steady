export async function generateIdempotencyKey(input: RequestInfo, init?: RequestInit): Promise<string> {
  const url = typeof input === 'string' ? input : input.url;
  const method = init?.method || 'GET';
  const body = init?.body ? String(init.body) : '';
  const data = `${method}:${url}:${body}`;
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}
