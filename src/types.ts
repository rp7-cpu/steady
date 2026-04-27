export interface SteadyOptions {
  retry?: {
    max?: number;
    backoff?: 'exponential' | 'linear' | 'fixed';
    jitter?: 'full' | 'equal' | false;
    on?: number[];
    onNetworkError?: string[];
  };
  circuitBreaker?: {
    threshold?: number;
    resetTimeout?: number;
    serveStaleOnOpen?: boolean;
  };
  cache?: {
    ttl?: number;
    maxSize?: number;
    maxBytes?: number;
    methods?: string[];
  };
  idempotency?: boolean;
  keyMap?: Record<string, string>;
  log?: (event: SteadyEvent) => void;
}

export type SteadyFetch = (input: RequestInfo, init?: RequestInit) => Promise<Response>;

export interface SteadyEvent {
  type: 'request' | 'retry' | 'cache_hit' | 'cache_miss' | 'circuit_open' | 'circuit_close' | 'error';
  url: string;
  method: string;
  attempt: number;
  duration: number;
  status?: number;
  error?: Error;
}
