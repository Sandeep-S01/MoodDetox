import React from 'react';
import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import confetti from 'canvas-confetti';
import { ResultView } from '@/components/views/ResultView';
import { useMoodStore } from '@/store/useMoodStore';
import { resetMoodStore } from '@/tests/helpers/resetMoodStore';

type MatchMediaMock = (query: string) => MediaQueryList;

const installMatchMedia = (prefersReducedMotion: boolean) => {
  const impl: MatchMediaMock = (query: string) => ({
    matches: query.includes('prefers-reduced-motion') ? prefersReducedMotion : false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }) as unknown as MediaQueryList;

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(impl),
  });
};

describe('ResultView confetti gating', () => {
  beforeEach(() => {
    localStorage.clear();
    resetMoodStore();
    useMoodStore.setState({ score: 42, resultMessage: 'Session Complete' });
    vi.useFakeTimers();
    vi.mocked(confetti).mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('skips confetti when the user prefers reduced motion', () => {
    installMatchMedia(true);

    render(React.createElement(ResultView));
    vi.advanceTimersByTime(1000);

    expect(confetti).not.toHaveBeenCalled();
  });

  it('fires confetti when reduced motion is not preferred', () => {
    installMatchMedia(false);

    render(React.createElement(ResultView));
    vi.advanceTimersByTime(260);

    expect(confetti).toHaveBeenCalled();
  });
});
