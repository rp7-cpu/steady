export class LRUCache {
  map = new Map<string, { response: Response; timestamp: number; size: number }>();
  maxSize: number;
  maxBytes: number;
  ttl: number;

  constructor(maxSize: number, maxBytes: number, ttl: number) {
    this.maxSize = maxSize;
    this.maxBytes = maxBytes;
    this.ttl = ttl;
  }

  private computeKey(input: RequestInfo, init?: RequestInit): string {
    const url = typeof input === 'string' ? input : input.url;
    const method = init?.method || 'GET';
    const body = init?.body ? String(init.body) : '';
    return `${method}:${url}:${body}`;
  }

  private totalBytes(): number {
    let sum = 0;
    for (const v of this.map.values()) sum += v.size;
    return sum;
  }

  get(input: RequestInfo, init?: RequestInit): Response | undefined {
    const key = this.computeKey(input, init);
    const entry = this.map.get(key);
    if (!entry) return undefined;
    if (Date.now() - entry.timestamp > this.ttl) {
      this.map.delete(key);
      return undefined;
    }
    this.map.delete(key);
    this.map.set(key, entry);
    return entry.response.clone();
  }

  set(input: RequestInfo, init: RequestInit | undefined, response: Response) {
    const key = this.computeKey(input, init);
    const cloned = response.clone();
    const size = parseInt(cloned.headers.get('content-length') || '0', 10) || 1024;
    while (this.map.size >= this.maxSize || (this.maxBytes > 0 && this.totalBytes() + size > this.maxBytes)) {
      const oldest = this.map.keys().next().value;
      if (oldest === undefined) break;
      this.map.delete(oldest);
    }
    this.map.set(key, { response: cloned, timestamp: Date.now(), size });
  }
}
