import type { SteadyEvent } from './types';

export function createLogger(cb?: (event: SteadyEvent) => void): (event: SteadyEvent) => void {
  if (!cb) return () => {};
  return (event) => {
    cb(event);
  };
}
