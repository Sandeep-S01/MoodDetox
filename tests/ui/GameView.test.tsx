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

    // Five score bumps across < 1s. Under the pre-monotonic code, this
    // pattern destroyed the tick interval before it could fire.
    for (let i = 0; i < 5; i += 1) {
      act(() => {
        useMoodStore.setState((state) => ({ score: state.score + 1 }));
        vi.advanceTimersByTime(150);
      });
    }

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

  it('reports remaining time from the wall clock, not the tick count', () => {
    // If the clock were tick-accumulating (old approach), 30 fake-timer ticks
    // over 30s would be needed to reach zero regardless of real elapsed time.
    // With the monotonic approach, each tick reads performance.now() and
    // computes remaining from an absolute endpoint — so advancing the fake
    // clock past the round end lands at 0 immediately.
    useMoodStore.setState({ score: 7, isMultiplayer: false, opponentScore: 0 });
    render(React.createElement(GameView));

    advanceThroughCountdown();
    expect(screen.getByText('30')).toBeInTheDocument();

    act(() => {
      // Jump well past the round duration in a single advance.
      vi.advanceTimersByTime(45_000);
    });

    // Score is 7 and multiplayer is off, so the only '0' in the DOM is the timer.
    expect(screen.getByText('0')).toBeInTheDocument();
  });
});
