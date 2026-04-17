import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, vi } from 'vitest';

const stripMotionProps = (props: Record<string, unknown>) => {
  const {
    animate,
    exit,
    initial,
    layout,
    transition,
    whileHover,
    whileTap,
    ...domProps
  } = props;

  void animate;
  void exit;
  void initial;
  void layout;
  void transition;
  void whileHover;
  void whileTap;

  return domProps;
};

vi.mock('motion/react', () => {
  const motion = new Proxy(
    {},
    {
      get: (_target, tag: string) =>
        React.forwardRef(function MockMotionComponent(
          { children, ...props }: { children?: React.ReactNode } & Record<string, unknown>,
          ref: React.ForwardedRef<unknown>,
        ) {
          return React.createElement(tag, { ref, ...stripMotionProps(props) }, children as React.ReactNode);
        }),
    },
  );

  return {
    AnimatePresence: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
    motion,
    useReducedMotion: () => false,
  };
});

vi.mock('@/lib/audio', () => ({
  playClick: vi.fn(),
  playCorrect: vi.fn(),
  playGridTone: vi.fn(),
  playIncorrect: vi.fn(),
  playPop: vi.fn(),
  playTabSelect: vi.fn(),
  playTone: vi.fn(),
  setAmbientParameters: vi.fn(),
  toggleAmbientDrift: vi.fn(),
  toggleNatureFocus: vi.fn(),
  updateAmbientVolume: vi.fn(),
}));

vi.mock('@/lib/peer', () => ({
  beginMultiplayerMatch: vi.fn(() => true),
  disconnectPeer: vi.fn(),
  finishMultiplayerMatch: vi.fn(),
  initPeer: vi.fn(),
  joinGame: vi.fn(),
  sendMultiplayerDifficulty: vi.fn(),
  sendMultiplayerScore: vi.fn(),
}));

vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

beforeEach(() => {
  window.history.replaceState({}, '', '/');
  window.innerWidth = 1280;
  window.innerHeight = 720;

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('prefers-reduced-motion') ? false : window.innerWidth < 768,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  Object.defineProperty(window.navigator, 'vibrate', {
    configurable: true,
    value: vi.fn(),
  });

  Object.defineProperty(window.HTMLElement.prototype, 'scrollIntoView', {
    configurable: true,
    value: vi.fn(),
  });
});

afterEach(() => {
  cleanup();
  localStorage.clear();
});
