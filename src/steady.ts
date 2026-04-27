import type { SteadyFetch, SteadyOptions } from './types';
import { createSteady } from './pipeline';

export function steady(options?: SteadyOptions): SteadyFetch {
  return createSteady(options);
}
