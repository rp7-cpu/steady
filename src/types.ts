// steady-fetch Copyright (C) 2026 rp7-cpu
// This program comes with ABSOLUTELY NO WARRANTY.
// This is free software, and you are welcome to redistribute it
// under the terms of the GNU Affero General Public License v3.0.
// You should have received a copy of the license with this program.
// If not, see <https://www.gnu.org/licenses/>.
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

