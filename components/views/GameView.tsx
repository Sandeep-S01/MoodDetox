'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { X, Users } from 'lucide-react';
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
import { useIsMobile } from '@/hooks/use-mobile';

const GAME_DURATION = 30;

export function GameView() {
  const { activity, endActivity, isMultiplayer, opponentScore, reset, score } = useMoodStore();
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

    if (timeLeft <= 0) {
      if (hasFinishedRef.current) {
        return;
      }

      hasFinishedRef.current = true;

      if (isMultiplayer) {
        finishMultiplayerMatch(score);
      }
      endActivity(score, 'Session Complete');
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        const next = prev - 1;
        if (typeof window !== 'undefined' && window.navigator.vibrate) {
          window.navigator.vibrate(10);
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
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

  const getInstructions = () => {
    switch (activity) {
      case 'reaction':
        return 'Tap the targets as fast as you can!';
      case 'color':
        return 'Tap the color that matches the WORD, not the text color!';
      case 'memory':
        return 'Watch the sequence and repeat it!';
      case 'direction':
        return 'Tap the OPPOSITE direction of the arrow!';
      case 'rulebreaker':
        return 'Follow the rule: Match or Mismatch!';
      case 'mirrorlogic':
        return 'Tap the mirrored position!';
      case 'simonparadox':
        return 'Only tap if Simon says!';
      default:
        return 'Get ready!';
    }
  };

  const { glow: glowClass, stroke: strokeColor, text: textColor } = getTimerStyles(timeLeft);

  if (showCountdown) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full ambient-bg text-foreground p-8 text-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-8">
          <div className="text-muted uppercase tracking-[0.3em] text-sm">Get Ready</div>
          <h2 className="text-4xl font-display font-bold">{getInstructions()}</h2>
          <div className="text-8xl font-display font-black text-primary animate-pulse">{countdown}</div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-start w-full h-full ${isMobile ? 'max-w-md' : 'max-w-4xl'} px-6 pt-12 pb-6 relative overflow-hidden`}>
      <div className="absolute inset-0 pointer-events-none">
        <div className={`absolute top-1/4 left-1/2 -translate-x-1/2 ${isMobile ? 'w-64 h-64' : 'w-96 h-96'} rounded-full blur-[100px] opacity-20 animate-pulse-glow ${timeLeft <= 5 ? 'bg-red-500' : 'bg-primary'}`} />
      </div>

      <div className={`grid grid-cols-3 items-center w-full mb-12 glass-surface glass-border p-4 rounded-3xl z-10 shadow-xl ${!isMobile && 'max-w-2xl'}`}>
        <div className="flex flex-col items-start justify-center pl-2">
          {isMultiplayer ? (
            <>
              <span className="text-muted uppercase text-[10px] tracking-widest mb-1 flex items-center gap-1">
                <Users className="w-3 h-3" /> Friend
              </span>
              <motion.span
                key={opponentScore}
                initial={{ scale: 1.2, color: 'var(--color-teal-500)' }}
                animate={{ scale: 1, color: 'var(--color-muted)' }}
                className="text-3xl font-display font-bold text-muted"
              >
                {opponentScore}
              </motion.span>
            </>
          ) : (
            <button
              onClick={() => {
                playClick();
                reset();
              }}
              className="p-3 -ml-3 text-muted hover:text-foreground transition-colors rounded-full hover:bg-surface"
            >
              <X className="w-6 h-6" />
            </button>
          )}
        </div>

        <div className="flex justify-center">
          <motion.div
            key={timeLeft}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 0.2 }}
            className={`relative flex items-center justify-center w-20 h-20 transition-all duration-300 ${glowClass}`}
          >
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 80 80">
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
            <div className="absolute flex flex-col items-center justify-center">
              <motion.span
                key={timeLeft}
                initial={{ scale: 1.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className={`font-mono text-2xl font-bold ${textColor}`}
              >
                {timeLeft}
              </motion.span>
            </div>
          </motion.div>
        </div>

        <div className="flex flex-col items-end justify-center pr-2">
          <span className="text-muted uppercase text-[10px] tracking-widest mb-1">{isMultiplayer ? 'You' : 'Score'}</span>
          <motion.span
            key={score}
            initial={{ scale: 1.5, color: 'var(--color-primary)' }}
            animate={{ scale: 1, color: 'var(--color-foreground)' }}
            className="text-3xl font-display font-bold text-foreground"
          >
            {score}
          </motion.span>
        </div>
      </div>

      <div className="flex-1 w-full flex items-center justify-center">
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
