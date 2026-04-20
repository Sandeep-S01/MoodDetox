import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GameView } from '@/components/views/GameView';
import { useMoodStore } from '@/store/useMoodStore';
import { resetMoodStore } from '@/tests/helpers/resetMoodStore';

describe('GameView round timer', () => {
  beforeEach(() => {
    localStorage.clear();
    resetMoodStore();
    useMoodStore.setState({
      activity: 'reaction',
      view: 'game',
      isMultiplayer: true,
      score: 0,
      difficulty: 'easy',
    });
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const advanceThroughCountdown = () => {
    act(() => {
      vi.advanceTimersByTime(3100);
    });
  };

  it('renders the full round duration after the countdown ends', () => {
    render(React.createElement(GameView));

    advanceThroughCountdown();

    expect(screen.getByText('30')).toBeInTheDocument();
  });

  it('keeps ticking down even when the score is updated rapidly mid-round', () => {
    render(React.createElement(GameView));

    advanceThroughCountdown();
    expect(screen.getByText('30')).toBeInTheDocument();

    // Simulate rapid scoring (multiplayer reaction game): five score bumps
    // spread across < 1s. This is exactly the pattern that used to thrash
    // the timer effect because `score` was in its dependency list.
    for (let i = 0; i < 5; i += 1) {
      act(() => {
        useMoodStore.setState((state) => ({ score: state.score + 1 }));
        vi.advanceTimersByTime(150);
      });
    }

    // Cumulative: 5 * 150 = 750ms since the round clock started. Advance
    // past the first full second so we can assert the tick actually fired.
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(screen.getByText('29')).toBeInTheDocument();
  });

  it('completes the round exactly once when time runs out', () => {
    const endActivitySpy = vi.spyOn(useMoodStore.getState(), 'endActivity');

    render(React.createElement(GameView));

    advanceThroughCountdown();

    act(() => {
      vi.advanceTimersByTime(31_000);
    });

    expect(endActivitySpy).toHaveBeenCalledTimes(1);
    expect(endActivitySpy).toHaveBeenCalledWith(expect.any(Number), 'Session Complete');
  });
});
