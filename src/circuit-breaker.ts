// steady-fetch Copyright (C) 2026 rp7-cpu
// This program comes with ABSOLUTELY NO WARRANTY.
// This is free software, and you are welcome to redistribute it
// under the terms of the GNU Affero General Public License v3.0.
// You should have received a copy of the license with this program.
// If not, see <https://www.gnu.org/licenses/>.
type State = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export class CircuitBreaker {
  state: State = 'CLOSED';
  failures = 0;
  lastFailureTime = 0;
  threshold: number;
  resetTimeout: number;

  constructor(threshold: number, resetTimeout: number) {
    this.threshold = threshold;
    this.resetTimeout = resetTimeout;
  }

  success() {
    if (this.state === 'HALF_OPEN') {
      this.state = 'CLOSED';
      this.failures = 0;
    } else if (this.state === 'CLOSED') {
      this.failures = 0;
    }
  }

  failure() {
    this.failures++;
    this.lastFailureTime = Date.now();
    if (this.state === 'HALF_OPEN' || (this.state === 'CLOSED' && this.failures >= this.threshold)) {
      this.state = 'OPEN';
    }
  }

  allowRequest(): boolean {
    if (this.state === 'CLOSED') return true;
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = 'HALF_OPEN';
        return true;
      }
      return false;
    }
    return true; // HALF_OPEN
  }
}

