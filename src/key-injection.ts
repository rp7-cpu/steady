export function injectKey(url: string, init: RequestInit | undefined, keyMap: Record<string, string>): RequestInit | undefined {
  if (!keyMap || Object.keys(keyMap).length === 0) return init;
  const host = new URL(url).host;
  const key = keyMap[host];
  if (!key) return init;
  const headers = new Headers(init?.headers);
  if (!headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${key}`);
  }
  return { ...init, headers };
}
