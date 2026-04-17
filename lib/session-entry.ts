import type { Activity, Challenge } from '@/store/useMoodStore';

type ValidEntryActivity = Exclude<Activity, null>;

const VALID_ACTIVITIES: readonly ValidEntryActivity[] = [
  'reaction',
  'color',
  'memory',
  'particles',
  'direction',
  'rulebreaker',
  'mirrorlogic',
  'simonparadox',
] as const;

export type SessionEntryIntent =
  | { type: 'none' }
  | { type: 'join'; joinId: string }
  | { type: 'challenge'; challenge: Challenge };

export function resolveSessionEntry(search: string): SessionEntryIntent {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const joinId = params.get('join')?.trim();

  if (joinId) {
    return { type: 'join', joinId };
  }

  const activity = params.get('activity');
  const score = Number.parseInt(params.get('score') ?? '', 10);

  if (!activity || !VALID_ACTIVITIES.includes(activity as ValidEntryActivity) || !Number.isFinite(score) || score <= 0) {
    return { type: 'none' };
  }

  return {
    type: 'challenge',
    challenge: {
      activity: activity as ValidEntryActivity,
      targetScore: score,
    },
  };
}
