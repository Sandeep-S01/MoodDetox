'use client';

import { useMoodStore } from '@/store/useMoodStore';
import { motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { ArrowRight, CheckCircle2, Share2, Users, XCircle } from 'lucide-react';
import { disconnectPeer } from '@/lib/peer';
import { playClick } from '@/lib/audio';
import { Panel, ShellButton, ViewFrame } from '@/components/ui/game-shell';

export function ResultView() {
  const score = useMoodStore((state) => state.score);
  const resultMessage = useMoodStore((state) => state.resultMessage);
  const reset = useMoodStore((state) => state.reset);
  const activity = useMoodStore((state) => state.activity);
  const challenge = useMoodStore((state) => state.challenge);
  const isMultiplayer = useMoodStore((state) => state.isMultiplayer);
  const opponentScore = useMoodStore((state) => state.opponentScore);
  const [shareText, setShareText] = useState('Challenge a Friend');
  const shareResetTimerRef = useRef<number | null>(null);

  const isChallenge = challenge !== null;
  const wonChallenge = isChallenge && score > challenge.targetScore;
  const wonMultiplayer = isMultiplayer && score > opponentScore;
  const lostMultiplayer = isMultiplayer && score < opponentScore;
  const tieMultiplayer = isMultiplayer && score === opponentScore;

  useEffect(() => {
    return () => {
      if (shareResetTimerRef.current !== null) {
        window.clearTimeout(shareResetTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    if (score > 0 || wonChallenge || wonMultiplayer) {
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval = window.setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          window.clearInterval(interval);
          return;
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);

      return () => window.clearInterval(interval);
    }
  }, [score, wonChallenge, wonMultiplayer]);

  const handleShare = async () => {
    playClick();
    const url = `${window.location.origin}${window.location.pathname}?activity=${activity}&score=${score}`;
    const text = `I scored ${score} in MoodDetox. Can you beat it?`;

    try {
      if (navigator.share) {
        await navigator.share({ title: 'MoodDetox Challenge', text, url });
      } else {
        await navigator.clipboard.writeText(`${text} ${url}`);
        setShareText('Link Copied');
        if (shareResetTimerRef.current !== null) {
          window.clearTimeout(shareResetTimerRef.current);
        }
        shareResetTimerRef.current = window.setTimeout(() => {
          setShareText('Challenge a Friend');
          shareResetTimerRef.current = null;
        }, 2000);
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  const handleContinue = () => {
    playClick();
    if (isMultiplayer) {
      disconnectPeer();
    }
    reset();
  };

  let resultTitle = resultMessage;
  let resultTone = 'text-primary';
  let ResultIcon = CheckCircle2;

  if (isChallenge) {
    resultTitle = wonChallenge ? 'Challenge won' : 'Target missed';
    resultTone = wonChallenge ? 'text-teal-500' : 'text-orange-500';
    ResultIcon = wonChallenge ? CheckCircle2 : XCircle;
  } else if (wonMultiplayer) {
    resultTitle = 'You won';
    resultTone = 'text-teal-500';
    ResultIcon = CheckCircle2;
  } else if (lostMultiplayer) {
    resultTitle = 'You lost';
    resultTone = 'text-orange-500';
    ResultIcon = XCircle;
  } else if (tieMultiplayer) {
    resultTitle = 'Tie game';
    resultTone = 'text-purple-500';
    ResultIcon = Users;
  }

  return (
    <ViewFrame className="shell-page flex min-h-full max-w-2xl items-start sm:items-center">
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', bounce: 0.3 }}
        className="w-full"
      >
        <Panel tone="raised" padding="lg" className="relative overflow-hidden text-center">
          <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-primary/10 blur-3xl" />

          <div className="relative space-y-6">
            {(isChallenge || isMultiplayer) && (
              <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-background/35 ${resultTone}`}>
                <ResultIcon className="h-8 w-8" />
              </div>
            )}

            <div className="space-y-3">
              <div className="section-kicker">Round complete</div>
              <h2 className={`text-3xl font-display font-bold tracking-tight ${isChallenge || isMultiplayer ? resultTone : 'text-foreground'}`}>
                {resultTitle}
              </h2>
              <p className="mx-auto max-w-lg text-sm leading-6 text-muted">
                {isChallenge
                  ? `Score to beat: ${challenge?.targetScore}`
                  : isMultiplayer
                    ? `Friend score: ${opponentScore}`
                    : 'Short sessions count. Reset again whenever you need another quick round.'}
              </p>
            </div>

            {activity === 'particles' ? (
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-teal-500/12">
                <div className="h-12 w-12 rounded-full bg-teal-500/25 animate-pulse" />
              </div>
            ) : (
              <div className="text-6xl font-display font-bold text-foreground">{score}</div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              {score > 0 && !isChallenge && !isMultiplayer && activity !== 'particles' ? (
                <ShellButton variant="secondary" onClick={handleShare} className="sm:min-w-48">
                  <Share2 className="h-4 w-4" />
                  {shareText}
                </ShellButton>
              ) : null}

              <ShellButton variant="primary" onClick={handleContinue} className="sm:min-w-40">
                Continue
                <ArrowRight className="h-4 w-4" />
              </ShellButton>
            </div>
          </div>
        </Panel>
      </motion.div>
    </ViewFrame>
  );
}
