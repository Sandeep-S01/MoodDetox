import React from 'react';
import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ColorMatch } from '@/components/games/ColorMatch';
import { useMoodStore } from '@/store/useMoodStore';
import { resetMoodStore } from '@/tests/helpers/resetMoodStore';

describe('ColorMatch', () => {
  beforeEach(() => {
    localStorage.clear();
    resetMoodStore();
    useMoodStore.setState({ difficulty: 'hard', score: 0 });
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('clears the hard-mode auto-timeout on unmount', () => {
    const { unmount } = render(React.createElement(ColorMatch));

    expect(vi.getTimerCount()).toBeGreaterThan(0);

    unmount();

    expect(vi.getTimerCount()).toBe(0);
  });

  it('does not mutate the store score after unmount', () => {
    const { unmount } = render(React.createElement(ColorMatch));

    unmount();
    vi.advanceTimersByTime(5000);

    expect(useMoodStore.getState().score).toBe(0);
  });
});
