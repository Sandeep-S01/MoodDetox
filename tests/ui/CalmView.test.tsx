import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CalmView } from '@/components/views/CalmView';
import { useMoodStore } from '@/store/useMoodStore';
import { resetMoodStore } from '@/tests/helpers/resetMoodStore';

describe('CalmView', () => {
  beforeEach(() => {
    localStorage.clear();
    resetMoodStore();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('clears its interval and visibility listener on unmount', () => {
    const { unmount } = render(React.createElement(CalmView));

    expect(vi.getTimerCount()).toBeGreaterThan(0);

    unmount();

    expect(vi.getTimerCount()).toBe(0);
  });

  it('does not transition to result when unmounted mid-session', () => {
    const { unmount } = render(React.createElement(CalmView));

    unmount();
    act(() => {
      vi.advanceTimersByTime(120_000);
    });

    expect(useMoodStore.getState().view).toBe('home');
    expect(useMoodStore.getState().resultMessage).toBe('');
  });

  it('displays remaining time based on the wall clock, not tick count', () => {
    render(React.createElement(CalmView));

    // Big discontinuous jump: the monotonic timer should read the full
    // elapsed time, not the number of ticks fired.
    act(() => {
      vi.advanceTimersByTime(30_000);
    });

    // 60s total duration, 30s elapsed → 30s remaining, rendered "0:30".
    expect(screen.getByText(/0:30/)).toBeInTheDocument();
  });
});
