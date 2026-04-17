'use client';

import { useMoodStore } from '@/store/useMoodStore';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { ArrowRight, Share2, CheckCircle2, XCircle, Users } from 'lucide-react';
import { disconnectPeer } from '@/lib/peer';
import { playClick } from '@/lib/audio';

import { useIsMobile } from '@/hooks/use-mobile';

export function ResultView() {
  const { score, resultMessage, reset, activity, challenge, isMultiplayer, opponentScore } = useMoodStore();
  const [shareText, setShareText] = useState('Challenge a Friend');
  const isMobile = useIsMobile();

  // Determine if this was a challenge and if the user won
  const isChallenge = challenge !== null;
  const wonChallenge = isChallenge && score > challenge.targetScore;

  // Determine multiplayer result
  const wonMultiplayer = isMultiplayer && score > opponentScore;
  const lostMultiplayer = isMultiplayer && score < opponentScore;
  const tieMultiplayer = isMultiplayer && score === opponentScore;

  useEffect(() => {
    if (score > 0 || wonChallenge || wonMultiplayer) {
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({
          ...defaults, particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        });
        confetti({
          ...defaults, particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [score, wonChallenge, wonMultiplayer]);

  const handleShare = async () => {
    playClick();
    const url = `${window.location.origin}${window.location.pathname}?activity=${activity}&score=${score}`;
    const text = `I scored ${score} in MoodDetox! Can you beat my score?`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'MoodDetox Challenge',
          text: text,
          url: url
        });
      } else {
        await navigator.clipboard.writeText(`${text} ${url}`);
        setShareText('Link Copied!');
        setTimeout(() => setShareText('Challenge a Friend'), 2000);
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

  return (
    <div className={`flex flex-col items-center justify-center w-full ${isMobile ? 'max-w-md' : 'max-w-2xl'} px-6 text-center`}>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', bounce: 0.5 }}
        className={`mb-8 w-full glass-surface glass-border ${isMobile ? 'p-10' : 'p-16'} rounded-[40px] shadow-2xl relative overflow-hidden`}
      >
        {/* Decorative background element */}
        <div className={`absolute -top-20 -right-20 ${isMobile ? 'w-40 h-40' : 'w-64 h-64'} bg-primary/10 rounded-full blur-3xl animate-pulse-glow`} />
        
        {isChallenge && (
          <div className="mb-6">
            {wonChallenge ? (
              <div className="flex flex-col items-center text-teal-500">
                <CheckCircle2 className="w-12 h-12 mb-2" />
                <span className="font-display font-bold text-xl">Challenge Won!</span>
                <span className="text-sm opacity-80">You beat their score of {challenge.targetScore}</span>
              </div>
            ) : (
              <div className="flex flex-col items-center text-orange-500">
                <XCircle className="w-12 h-12 mb-2" />
                <span className="font-display font-bold text-xl">Challenge Lost</span>
                <span className="text-sm opacity-80">Target was {challenge.targetScore}</span>
              </div>
            )}
          </div>
        )}

        {isMultiplayer && (
          <div className="mb-6">
            {wonMultiplayer && (
              <div className="flex flex-col items-center text-teal-500">
                <CheckCircle2 className="w-12 h-12 mb-2" />
                <span className="font-display font-bold text-xl">You Won!</span>
                <span className="text-sm opacity-80">Friend scored {opponentScore}</span>
              </div>
            )}
            {lostMultiplayer && (
              <div className="flex flex-col items-center text-orange-500">
                <XCircle className="w-12 h-12 mb-2" />
                <span className="font-display font-bold text-xl">You Lost</span>
                <span className="text-sm opacity-80">Friend scored {opponentScore}</span>
              </div>
            )}
            {tieMultiplayer && (
              <div className="flex flex-col items-center text-purple-500">
                <Users className="w-12 h-12 mb-2" />
                <span className="font-display font-bold text-xl">It&apos;s a Tie!</span>
                <span className="text-sm opacity-80">Both scored {score}</span>
              </div>
            )}
          </div>
        )}

        {activity === 'particles' ? (
          <div className="w-24 h-24 rounded-full bg-teal-500/10 flex items-center justify-center mx-auto mb-6">
            <div className="w-12 h-12 rounded-full bg-teal-500/20 animate-pulse" />
          </div>
        ) : (
          <div className="text-6xl font-display font-bold text-foreground mb-2">
            {score}
          </div>
        )}
        <h2 className="text-2xl font-medium text-muted">
          {isChallenge || isMultiplayer ? 'Your Final Score' : resultMessage}
        </h2>
      </motion.div>

      <div className="flex flex-col gap-4 w-full">
        {score > 0 && !isChallenge && !isMultiplayer && activity !== 'particles' && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleShare}
            className="flex items-center justify-center gap-2 px-8 py-4 bg-surface border border-border text-foreground rounded-full font-medium hover:bg-surface-hover transition-all w-full"
          >
            <Share2 className="w-5 h-5" />
            {shareText}
          </motion.button>
        )}

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleContinue}
          className="flex items-center justify-center gap-2 px-8 py-4 bg-primary text-primary-fg rounded-full font-medium hover:opacity-90 transition-all w-full"
        >
          Continue
          <ArrowRight className="w-5 h-5" />
        </motion.button>
      </div>
    </div>
  );
}
