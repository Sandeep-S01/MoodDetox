import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createScoreThrottle } from '@/lib/score-throttle';

describe('createScoreThrottle', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: 0 });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('sends the first score immediately on the leading edge', () => {
    const send = vi.fn();
    const throttle = createScoreThrottle({ intervalMs: 100, send });

    throttle.invoke(5);

    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenLastCalledWith(5);
  });

  it('coalesces rapid calls within the window into a single trailing send', () => {
    const send = vi.fn();
    const throttle = createScoreThrottle({ intervalMs: 100, send });

    throttle.invoke(1); // Leading edge fires immediately.
    vi.advanceTimersByTime(20);
    throttle.invoke(2); // Suppressed (in window).
    vi.advanceTimersByTime(20);
    throttle.invoke(3); // Suppressed (in window).
    vi.advanceTimersByTime(20);
    throttle.invoke(4); // Suppressed (in window).

    // Only the leading call has fired so far.
    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenLastCalledWith(1);

    // Advance past the throttle window; the trailing edge flush should fire
    // with the most recent suppressed value (4), not any of the intermediates.
    vi.advanceTimersByTime(100);

    expect(send).toHaveBeenCalledTimes(2);
    expect(send).toHaveBeenLastCalledWith(4);
  });

  it('treats calls spaced beyond the window as independent leading-edge sends', () => {
    const send = vi.fn();
    const throttle = createScoreThrottle({ intervalMs: 100, send });

    throttle.invoke(1);
    vi.advanceTimersByTime(150);
    throttle.invoke(2);
    vi.advanceTimersByTime(150);
    throttle.invoke(3);

    expect(send).toHaveBeenCalledTimes(3);
    expect(send.mock.calls.map((args) => args[0])).toEqual([1, 2, 3]);
  });

  it('cancel discards the pending trailing send', () => {
    const send = vi.fn();
    const throttle = createScoreThrottle({ intervalMs: 100, send });

    throttle.invoke(1);
    vi.advanceTimersByTime(20);
    throttle.invoke(2); // Queued for trailing send.

    throttle.cancel();

    vi.advanceTimersByTime(500);

    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenLastCalledWith(1);
  });

  it('still accepts new calls after a cancel', () => {
    const send = vi.fn();
    const throttle = createScoreThrottle({ intervalMs: 100, send });

    throttle.invoke(1);
    throttle.cancel();

    vi.advanceTimersByTime(150);
    throttle.invoke(2);

    expect(send).toHaveBeenCalledTimes(2);
    expect(send.mock.calls.map((args) => args[0])).toEqual([1, 2]);
  });

  it('keeps the trailing value fresh when multiple invocations race within one window', () => {
    const send = vi.fn();
    const throttle = createScoreThrottle({ intervalMs: 100, send });

    // Leading edge.
    throttle.invoke(10);
    expect(send).toHaveBeenCalledTimes(1);

    // Six updates inside the 100ms window at high frequency.
    for (let i = 11; i <= 16; i += 1) {
      vi.advanceTimersByTime(10);
      throttle.invoke(i);
    }

    // No trailing send yet.
    expect(send).toHaveBeenCalledTimes(1);

    // Flush the trailing edge.
    vi.advanceTimersByTime(100);

    expect(send).toHaveBeenCalledTimes(2);
    expect(send).toHaveBeenLastCalledWith(16);
  });
});
