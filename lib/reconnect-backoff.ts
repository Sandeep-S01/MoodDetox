export type BackoffOptions = {
  initialDelayMs: number;
  maxDelayMs: number;
  factor: number;
  maxAttempts: number;
};

export function computeBackoffDelay(attempt: number, options: BackoffOptions): number {
  if (attempt < 1) return 0;
  const exponential = options.initialDelayMs * Math.pow(options.factor, attempt - 1);
  return Math.min(exponential, options.maxDelayMs);
}

export function shouldGiveUp(attempt: number, options: BackoffOptions): boolean {
  return attempt >= options.maxAttempts;
}
