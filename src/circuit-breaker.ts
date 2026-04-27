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
