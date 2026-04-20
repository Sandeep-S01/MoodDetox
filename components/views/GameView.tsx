'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Users, X } from 'lucide-react';
import { useMoodStore } from '@/store/useMoodStore';
import { finishMultiplayerMatch, sendMultiplayerScore } from '@/lib/peer';
import { playClick } from '@/lib/audio';
import { ReactionTap } from '@/components/games/ReactionTap';
import { ColorMatch } from '@/components/games/ColorMatch';
import { MemoryFlash } from '@/components/games/MemoryFlash';
import { DirectionDash } from '@/components/games/DirectionDash';
import { RuleBreaker } from '@/components/games/RuleBreaker';
import { MirrorLogic } from '@/components/games/MirrorLogic';
import { SimonParadox } from '@/components/games/SimonParadox';
import { Panel, ShellButton } from '@/components/ui/game-shell';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

const GAME_DURATION = 30;

const MODE_NAMES = {
  particles: 'Breathing Field',
  reaction: 'Reaction Tap',
  color: 'Color Match',
  memory: 'Memory Flash',
  direction: 'Direction Dash',
  rulebreaker: 'Rule Breaker',
  mirrorlogic: 'Mirror Logic',
  simonparadox: 'Simon Paradox',
} as const;

const MODE_INSTRUCTIONS = {
  particles: 'Breathe and interact.',
  reaction: 'Tap the targets as fast as you can.',
  color: 'Follow the word, not the text color.',
  memory: 'Watch the sequence, then repeat it.',
  direction: 'Tap the opposite direction of the arrow.',
  rulebreaker: 'Follow the rule: match or mismatch.',
  mirrorlogic: 'Tap the mirrored position.',
  simonparadox: 'Only tap when Simon says.',
} as const;

export function GameView() {
  const activity = useMoodStore((state) => state.activity);
  const endActivity = useMoodStore((state) => state.endActivity);
  const isMultiplayer = useMoodStore((state) => state.isMultiplayer);
  const opponentScore = useMoodStore((state) => state.opponentScore);
  const reset = useMoodStore((state) => state.reset);
  const score = useMoodStore((state) => state.score);
  const isMobile = useIsMobile();
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [showCountdown, setShowCountdown] = useState(true);
  const [countdown, setCountdown] = useState(3);
  const hasFinishedRef = useRef(false);

  const getTimerStyles = (time: number) => {
    if (time <= 2) {
      return {
        text: 'text-red-500',
        stroke: 'stroke-red-500',
        glow: 'drop-shadow-[0_0_12px_rgba(239,68,68,0.8)]',
      };
    }
    if (time <= 5) {
      return {
        text: 'text-yellow-500',
        stroke: 'stroke-yellow-500',
        glow: 'drop-shadow-[0_0_12px_rgba(234,179,8,0.8)]',
      };
    }
    if (time <= 15) {
      return {
        text: 'text-blue-500',
        stroke: 'stroke-blue-500',
        glow: '',
      };
    }
    return {
      text: 'text-foreground',
      stroke: 'stroke-primary',
      glow: '',
    };
  };

  useEffect(() => {
    hasFinishedRef.current = false;
  }, [activity]);

  useEffect(() => {
    if (showCountdown) return;

    const endTime = performance.now() + GAME_DURATION * 1000;
    let lastShown = GAME_DURATION;

    const tick = () => {
      const remainingMs = Math.max(0, endTime - performance.now());
      const remainingSec = Math.ceil(remainingMs / 1000);
      if (remainingSec !== lastShown) {
        lastShown = remainingSec;
        setTimeLeft(remainingSec);
        if (typeof window !== 'undefined' && window.navigator.vibrate) {
          window.navigator.vibrate(10);
        }
      }
    };

    const interval = window.setInterval(tick, 250);
    const onVisibilityChange = () => {
      if (typeof document !== 'undefined' && !document.hidden) {
        tick();
      }
    };
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVisibilityChange);
    }

    return () => {
      window.clearInterval(interval);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVisibilityChange);
      }
    };
  }, [showCountdown]);

  useEffect(() => {
    if (showCountdown || timeLeft > 0 || hasFinishedRef.current) {
      return;
    }

    hasFinishedRef.current = true;

    if (isMultiplayer) {
      finishMultiplayerMatch(score);
    }
    endActivity(score, 'Session Complete');
  }, [endActivity, isMultiplayer, score, showCountdown, timeLeft]);

  useEffect(() => {
    if (isMultiplayer) {
      sendMultiplayerScore(score);
    }
  }, [isMultiplayer, score]);

  useEffect(() => {
    if (!showCountdown) {
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setShowCountdown(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showCountdown]);

  const { glow: glowClass, stroke: strokeColor, text: textColor } = getTimerStyles(timeLeft);
  const modeName = activity ? MODE_NAMES[activity] : 'Get Ready';
  const instructionHint = activity ? MODE_INSTRUCTIONS[activity] : 'Get ready.';

  if (showCountdown) {
    return (
      <div className="flex h-full w-full items-center justify-center ambient-bg px-4 py-8">
        <Panel tone="raised" padding="lg" className="w-full max-w-md text-center sm:max-w-lg">
          <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-4">
            <div className="section-kicker">Starting round</div>
            <div className="space-y-2">
              <h2 className="text-2xl font-display font-bold sm:text-3xl">{modeName}</h2>
              <p className="text-sm text-muted">{instructionHint}</p>
            </div>
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-border/45 bg-background/35 text-5xl font-display font-black text-primary sm:h-24 sm:w-24 sm:text-6xl">
              {countdown}
            </div>
          </motion.div>
        </Panel>
      </div>
    );
  }

  return (
    <div className="relative flex h-full w-full items-stretch justify-center overflow-hidden px-2 py-2.5 sm:px-4 sm:py-4">
      <div className="pointer-events-none absolute inset-0">
        <div
          className={cn(
            'absolute left-1/2 top-[12%] h-52 w-52 -translate-x-1/2 rounded-full blur-[100px] opacity-18 animate-pulse-glow sm:h-72 sm:w-72',
            timeLeft <= 5 ? 'bg-red-500' : 'bg-primary',
          )}
        />
      </div>

      <div className="absolute inset-x-0 top-2 z-20 flex justify-center px-2 sm:top-3 sm:px-3">
        <div className="hud-strip grid w-full max-w-3xl grid-cols-[minmax(66px,auto)_1fr_minmax(66px,auto)] items-center gap-2 px-2.5 py-2 sm:gap-3 sm:px-4 sm:py-2.5">
          <div className="flex min-w-0 items-center gap-2">
            {isMultiplayer ? (
              <div className="rounded-2xl bg-background/35 px-2 py-1.5 sm:px-3 sm:py-2" aria-label={`Friend score ${opponentScore}`}>
                <div className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-muted sm:text-[10px] sm:tracking-[0.22em]">
                  <Users className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                  {!isMobile ? 'Friend' : null}
                </div>
                <motion.div
                  key={opponentScore}
                  initial={{ scale: 1.15, color: 'var(--color-primary)' }}
                  animate={{ scale: 1, color: 'var(--color-foreground)' }}
                  className="text-lg font-display font-bold sm:text-2xl"
                >
                  {opponentScore}
                </motion.div>
              </div>
            ) : (
              <ShellButton
                size="icon"
                variant="secondary"
                onClick={() => {
                  playClick();
                  reset();
                }}
                aria-label="Exit game"
              >
                <X className="h-4 w-4" />
              </ShellButton>
            )}
          </div>

          <div className="flex min-w-0 items-center justify-center gap-3">
            <motion.div
              key={timeLeft}
              animate={{ scale: [1, 1.03, 1] }}
              transition={{ duration: 0.2 }}
              className={cn('relative flex h-14 w-14 items-center justify-center transition-all duration-300 sm:h-[68px] sm:w-[68px]', glowClass)}
            >
              <svg className="h-full w-full -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="36" className="stroke-surface" strokeWidth="6" fill="none" />
                <motion.circle
                  cx="40"
                  cy="40"
                  r="36"
                  className={strokeColor}
                  strokeWidth="6"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={226.2}
                  initial={{ strokeDashoffset: 0 }}
                  animate={{ strokeDashoffset: 226.2 - (226.2 * timeLeft) / GAME_DURATION }}
                  transition={{ duration: 1, ease: 'linear' }}
                />
              </svg>
              <motion.span
                key={timeLeft}
                initial={{ scale: 1.3, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className={cn('absolute font-mono text-lg font-bold sm:text-2xl', textColor)}
              >
                {timeLeft}
              </motion.span>
            </motion.div>

            {!isMobile ? (
              <div className="min-w-0">
                <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted">Live round</div>
                <div className="truncate text-sm font-display font-bold text-foreground">{modeName}</div>
                <div className="max-w-[220px] truncate text-[11px] text-muted/80">{instructionHint}</div>
              </div>
            ) : null}
          </div>

          <div className="justify-self-end rounded-2xl bg-background/35 px-2 py-1.5 text-right sm:px-3 sm:py-2">
            <div className="text-[9px] font-semibold uppercase tracking-[0.2em] text-muted sm:text-[10px] sm:tracking-[0.22em]">{isMultiplayer ? 'You' : 'Score'}</div>
            <motion.div
              key={score}
              initial={{ scale: 1.2, color: 'var(--color-primary)' }}
              animate={{ scale: 1, color: 'var(--color-foreground)' }}
              className="text-lg font-display font-bold sm:text-2xl"
            >
              {score}
            </motion.div>
          </div>
        </div>
      </div>

      {isMobile ? (
        <div className="absolute inset-x-0 top-[72px] z-10 flex justify-center px-3">
          <div className="game-panel game-panel-soft flex max-w-[220px] flex-col items-center gap-1 rounded-[1.1rem] px-3 py-2 text-center">
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">Live round</div>
            <div className="text-xs font-display font-bold">{modeName}</div>
            <div className="max-w-full truncate text-[11px] text-muted/80">{instructionHint}</div>
          </div>
        </div>
      ) : null}

      <div className={cn('relative z-10 flex w-full flex-1 items-center justify-center pt-[118px] pb-2 sm:pt-24', isMobile ? 'max-w-md' : 'max-w-4xl')}>
        {activity === 'reaction' && <ReactionTap />}
        {activity === 'color' && <ColorMatch />}
        {activity === 'memory' && <MemoryFlash />}
        {activity === 'direction' && <DirectionDash />}
        {activity === 'rulebreaker' && <RuleBreaker />}
        {activity === 'mirrorlogic' && <MirrorLogic />}
        {activity === 'simonparadox' && <SimonParadox />}
      </div>
    </div>
  );
}
