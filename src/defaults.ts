// steady-fetch Copyright (C) 2026 rp7-cpu
// This program comes with ABSOLUTELY NO WARRANTY.
// This is free software, and you are welcome to redistribute it
// under the terms of the GNU Affero General Public License v3.0.
// You should have received a copy of the license with this program.
// If not, see <https://www.gnu.org/licenses/>.
import type { SteadyOptions } from './types';

export const defaults: Required<SteadyOptions> = {
  retry: {
    max: 3,
    backoff: 'exponential',
    jitter: 'full',
    on: [502, 503, 504, 429],
    onNetworkError: ['ETIMEDOUT', 'ECONNRESET', 'ECONNREFUSED', 'TypeError']
  },
  circuitBreaker: {
    threshold: 5,
    resetTimeout: 30000,
    serveStaleOnOpen: true
  },
  cache: {
    ttl: 60000,
    maxSize: 500,
    maxBytes: undefined as unknown as number,
    methods: ['GET']
  },
  idempotency: false,
  keyMap: {},
  log: undefined as unknown as (event: any) => void
};

export function mergeOptions(user?: SteadyOptions): Required<SteadyOptions> {
  if (!user) return { ...defaults, cache: { ...defaults.cache }, circuitBreaker: { ...defaults.circuitBreaker }, retry: { ...defaults.retry } };
  return {
    retry: { ...defaults.retry, ...user.retry, on: user.retry?.on ?? defaults.retry.on, onNetworkError: user.retry?.onNetworkError ?? defaults.retry.onNetworkError },
    circuitBreaker: { ...defaults.circuitBreaker, ...user.circuitBreaker },
    cache: { ...defaults.cache, ...user.cache, maxBytes: user.cache?.maxBytes ?? (defaults.cache.maxBytes as any), methods: user.cache?.methods ?? defaults.cache.methods },
    idempotency: user.idempotency ?? defaults.idempotency,
    keyMap: user.keyMap ?? {},
    log: user.log ?? (() => {})
  };
}

