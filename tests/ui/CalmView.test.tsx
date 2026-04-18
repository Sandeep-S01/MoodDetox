import React from 'react';
import { render } from '@testing-library/react';
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

  it('clears its countdown interval on unmount', () => {
    const { unmount } = render(React.createElement(CalmView));

    expect(vi.getTimerCount()).toBeGreaterThan(0);

    unmount();

    expect(vi.getTimerCount()).toBe(0);
  });

  it('does not transition to result when unmounted mid-session', () => {
    const { unmount } = render(React.createElement(CalmView));

    unmount();
    vi.advanceTimersByTime(120_000);

    expect(useMoodStore.getState().view).toBe('home');
    expect(useMoodStore.getState().resultMessage).toBe('');
  });
});
