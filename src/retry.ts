export function backoffDelay(attempt: number, backoff: 'exponential' | 'linear' | 'fixed', jitter: 'full' | 'equal' | false): number {
  let base: number;
  if (backoff === 'exponential') base = Math.pow(2, attempt) * 1000;
  else if (backoff === 'linear') base = attempt * 1000;
  else base = 1000;

  if (!jitter) return base;
  const jitterAmount = jitter === 'full' ? Math.random() * base : (base / 2) * Math.random();
  return base + jitterAmount;
}

export function shouldRetry(error: any, status: number | undefined, on: number[], onNetworkError: string[]): boolean {
  if (status && on.includes(status)) return true;
  if (!status && error) {
    const code = (error as any)?.code;
    const message = (error as any)?.message || '';
    if (code && onNetworkError.includes(code)) return true;
    if (!code && message.includes('fetch failed') && onNetworkError.includes('TypeError')) return true;
  }
  return false;
}
