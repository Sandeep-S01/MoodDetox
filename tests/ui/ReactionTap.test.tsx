import React from 'react';
import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ReactionTap } from '@/components/games/ReactionTap';
import { useMoodStore } from '@/store/useMoodStore';
import { resetMoodStore } from '@/tests/helpers/resetMoodStore';

describe('ReactionTap', () => {
  beforeEach(() => {
    localStorage.clear();
    resetMoodStore();
    useMoodStore.setState({ difficulty: 'hard', score: 0 });
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('clears the hard-mode disappear timeout on unmount', () => {
    const { unmount } = render(React.createElement(ReactionTap));

    expect(vi.getTimerCount()).toBeGreaterThan(0);

    unmount();

    expect(vi.getTimerCount()).toBe(0);
  });

  it('cancels the pending respawn after a tap when unmounted', () => {
    const { container, unmount } = render(React.createElement(ReactionTap));

    const target = container.querySelector('button');
    expect(target).not.toBeNull();

    target!.click();

    expect(useMoodStore.getState().score).toBe(1);

    unmount();
    vi.advanceTimersByTime(5000);

    expect(useMoodStore.getState().score).toBe(1);
  });
});
