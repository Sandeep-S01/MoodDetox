import { describe, expect, it } from 'vitest';
import { computeBackoffDelay, shouldGiveUp, type BackoffOptions } from '@/lib/reconnect-backoff';

const baseOptions: BackoffOptions = {
  initialDelayMs: 1000,
  maxDelayMs: 15_000,
  factor: 2,
  maxAttempts: 5,
};

describe('computeBackoffDelay', () => {
  it('returns 0 for an attempt below 1', () => {
    expect(computeBackoffDelay(0, baseOptions)).toBe(0);
    expect(computeBackoffDelay(-3, baseOptions)).toBe(0);
  });

  it('returns the initial delay for the first attempt', () => {
    expect(computeBackoffDelay(1, baseOptions)).toBe(1000);
  });

  it('doubles the delay each subsequent attempt', () => {
    expect(computeBackoffDelay(2, baseOptions)).toBe(2000);
    expect(computeBackoffDelay(3, baseOptions)).toBe(4000);
    expect(computeBackoffDelay(4, baseOptions)).toBe(8000);
  });

  it('clamps the delay to the configured maximum', () => {
    expect(computeBackoffDelay(5, baseOptions)).toBe(15_000);
    expect(computeBackoffDelay(20, baseOptions)).toBe(15_000);
  });

  it('honours custom growth factors', () => {
    const linearish: BackoffOptions = { ...baseOptions, factor: 1.5 };
    expect(computeBackoffDelay(1, linearish)).toBe(1000);
    expect(computeBackoffDelay(2, linearish)).toBe(1500);
    expect(computeBackoffDelay(3, linearish)).toBe(2250);
  });
});

describe('shouldGiveUp', () => {
  it('returns false while under the cap', () => {
    expect(shouldGiveUp(0, baseOptions)).toBe(false);
    expect(shouldGiveUp(4, baseOptions)).toBe(false);
  });

  it('returns true at and beyond the cap', () => {
    expect(shouldGiveUp(5, baseOptions)).toBe(true);
    expect(shouldGiveUp(9, baseOptions)).toBe(true);
  });
});
