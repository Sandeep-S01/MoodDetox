'use client';

import { useMoodStore, type Activity } from '@/store/useMoodStore';
import { motion } from 'motion/react';
import { Play, Swords, X } from 'lucide-react';
import { playClick } from '@/lib/audio';
import { Panel, ShellButton, ViewFrame } from '@/components/ui/game-shell';

const ACTIVITY_NAMES: Record<Exclude<Activity, null>, string> = {
  particles: 'Particle Breathing',
  reaction: 'Reaction Tap',
  color: 'Color Match',
  memory: 'Memory Flash',
  direction: 'Direction Dash',
  rulebreaker: 'Rule Breaker',
  mirrorlogic: 'Mirror Logic',
  simonparadox: 'Simon Paradox',
};

export function ChallengePromptView() {
  const challenge = useMoodStore((state) => state.challenge);
  const startActivity = useMoodStore((state) => state.startActivity);
  const reset = useMoodStore((state) => state.reset);

  if (!challenge) {
    return null;
  }

  const activityName = challenge.activity ? ACTIVITY_NAMES[challenge.activity] : 'a game';

  const handleAccept = () => {
    playClick();
    startActivity(challenge.activity, challenge.activity === 'particles');
  };

  return (
    <ViewFrame className="shell-page flex min-h-full max-w-2xl items-start sm:items-center">
      <Panel tone="raised" padding="lg" className="w-full text-center">
        <motion.div
          initial={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 22, stiffness: 280 }}
          className="space-y-6"
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary">
            <Swords className="h-8 w-8" />
          </div>

          <div className="space-y-3">
            <div className="section-kicker">Direct challenge</div>
            <h2 className="text-3xl font-display font-bold tracking-tight">Beat the target</h2>
            <p className="mx-auto max-w-lg text-sm leading-6 text-muted">
              A friend challenged you in <span className="font-semibold text-foreground">{activityName}</span>. Start when you are ready and push past their score.
            </p>
          </div>

          <div className="rounded-[1.3rem] border border-border/45 bg-background/35 px-6 py-5">
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">Target score</div>
            <div className="mt-2 text-5xl font-display font-bold text-primary">{challenge.targetScore}</div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <ShellButton variant="primary" onClick={handleAccept} className="sm:min-w-40">
              <Play className="h-4 w-4" />
              Play now
            </ShellButton>
            <ShellButton
              variant="secondary"
              onClick={() => {
                playClick();
                reset();
              }}
              className="sm:min-w-40"
            >
              <X className="h-4 w-4" />
              Decline
            </ShellButton>
          </div>
        </motion.div>
      </Panel>
    </ViewFrame>
  );
}
