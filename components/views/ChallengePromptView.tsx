'use client';

import { useMoodStore, type Activity } from '@/store/useMoodStore';
import { motion } from 'motion/react';
import { Swords, X, Play } from 'lucide-react';
import { playClick } from '@/lib/audio';
import { useIsMobile } from '@/hooks/use-mobile';

const ACTIVITY_NAMES: Record<Exclude<Activity, null>, string> = {
  particles: 'Particle Breathing',
  reaction: 'Reaction Tap',
  color: 'Color Match',
  memory: 'Memory Flash',
  direction: 'Direction Dash',
  rulebreaker: 'Rule Breaker',
  mirrorlogic: 'Mirror Logic',
  simonparadox: 'Simon Paradox'
};

export function ChallengePromptView() {
  const { challenge, startActivity, reset } = useMoodStore();
  const isMobile = useIsMobile();

  if (!challenge) return null;

  const activityName = challenge.activity ? ACTIVITY_NAMES[challenge.activity] : 'a game';

  const handleAccept = () => {
    playClick();
    startActivity(challenge.activity, challenge.activity === 'particles');
  };

  return (
    <div className={`flex flex-col items-center justify-center w-full ${isMobile ? 'max-w-md' : 'max-w-2xl'} px-6 text-center`}>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        className={`bg-surface border border-border ${isMobile ? 'p-8' : 'p-16'} rounded-3xl w-full flex flex-col items-center relative overflow-hidden`}
      >
        <div className={`absolute -top-12 -right-12 ${isMobile ? 'w-32 h-32' : 'w-64 h-64'} bg-primary/10 rounded-full blur-2xl`}></div>
        <div className={`absolute -bottom-12 -left-12 ${isMobile ? 'w-32 h-32' : 'w-64 h-64'} bg-orange-500/10 rounded-full blur-2xl`}></div>

        <div className="w-20 h-20 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-6 relative z-10">
          <Swords className="w-10 h-10" />
        </div>

        <h2 className="text-3xl font-display font-bold mb-2 relative z-10">Challenge Accepted?</h2>
        <p className="text-muted mb-8 relative z-10">
          A friend has challenged you to beat their score in <strong className="text-foreground">{activityName}</strong>.
        </p>

        <div className="bg-background rounded-2xl p-6 w-full mb-8 relative z-10 border border-border">
          <div className="text-sm text-muted uppercase tracking-widest mb-1">Target Score</div>
          <div className="text-5xl font-display font-bold text-primary">{challenge.targetScore}</div>
        </div>

        <div className="flex flex-col gap-3 w-full relative z-10">
          <button
            onClick={handleAccept}
            className="w-full py-4 rounded-full bg-primary text-primary-fg font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
          >
            <Play className="w-5 h-5" />
            Play Now
          </button>
          <button
            onClick={() => {
              playClick();
              reset();
            }}
            className="w-full py-4 rounded-full bg-transparent text-muted font-bold flex items-center justify-center gap-2 hover:bg-surface-hover transition-colors"
          >
            <X className="w-5 h-5" />
            Decline
          </button>
        </div>
      </motion.div>
    </div>
  );
}

