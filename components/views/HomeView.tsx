'use client';

import { useEffect, useState, type ChangeEvent, type ElementType } from 'react';
import { useMoodStore, type Activity, type Mood } from '@/store/useMoodStore';
import { useIsMobile } from '@/hooks/use-mobile';
import { AnimatePresence, motion } from 'motion/react';
import {
  Activity as ActivityIcon,
  ArrowRight,
  Brain,
  Flame,
  Gamepad2,
  HeartPulse,
  Leaf,
  Moon,
  Music,
  PauseCircle,
  PlayCircle,
  Settings,
  Sparkles,
  Sun,
  Target,
  Users,
  Wind,
  Zap,
} from 'lucide-react';
import { toggleAmbientDrift, toggleNatureFocus, playClick, playTabSelect, setAmbientParameters } from '@/lib/audio';
import { Panel, ScreenHeader, SegmentedControl, ShellButton, StatChip, ViewFrame } from '@/components/ui/game-shell';
import { cn } from '@/lib/utils';

const HOME_TAB_OPTIONS = [
  { id: 'sanctuary', label: 'Sanctuary', shortLabel: 'Reset', icon: Leaf },
  { id: 'library', label: 'Library', shortLabel: 'Library', icon: Gamepad2 },
  { id: 'pulse', label: 'Pulse', shortLabel: 'Pulse', icon: HeartPulse },
  { id: 'reflect', label: 'Reflect', shortLabel: 'Reflect', icon: Sparkles },
] as const;

const DIFFICULTY_OPTIONS = [
  { id: 'easy', label: 'Easy' },
  { id: 'medium', label: 'Medium' },
  { id: 'hard', label: 'Hard' },
] as const;

const MOODS: {
  id: Exclude<Mood, null>;
  label: string;
  headline: string;
  summary: string;
  meta: string;
  icon: ElementType;
  activity: Activity;
  isCalm: boolean;
  theme: string;
  toneClass: string;
  badgeClass: string;
  ctaClass: string;
}[] = [
  {
    id: 'tired',
    label: 'Tired',
    headline: 'Reflex Run',
    summary: 'Wake up fast with a short target-tap round that pushes your reactions.',
    meta: '30 sec / action',
    icon: Moon,
    activity: 'reaction',
    isCalm: false,
    theme: 'tired',
    toneClass: 'text-orange-500',
    badgeClass: 'bg-orange-500/12 text-orange-500',
    ctaClass: 'bg-orange-500 text-white',
  },
  {
    id: 'stressed',
    label: 'Stressed',
    headline: 'Breathing Field',
    summary: 'Slow down with a guided particle-breathing space built for quick decompression.',
    meta: '60 sec / calm',
    icon: Wind,
    activity: 'particles',
    isCalm: true,
    theme: 'stressed',
    toneClass: 'text-teal-500',
    badgeClass: 'bg-teal-500/12 text-teal-500',
    ctaClass: 'bg-teal-500 text-white',
  },
  {
    id: 'bored',
    label: 'Bored',
    headline: 'Focus Shuffle',
    summary: 'Jump into a random brain mini-game to reset attention and build momentum.',
    meta: '30 sec / random',
    icon: Zap,
    activity: 'color',
    isCalm: false,
    theme: 'bored',
    toneClass: 'text-purple-500',
    badgeClass: 'bg-purple-500/12 text-purple-500',
    ctaClass: 'bg-purple-500 text-white',
  },
];

const LIBRARY_ITEMS: {
  id: Exclude<Activity, null>;
  name: string;
  icon: ElementType;
  calm: boolean;
  duration: string;
  category: string;
  desc: string;
}[] = [
  { id: 'particles', name: 'Particle Breathing', icon: Wind, calm: true, duration: '60 sec', category: 'Calm', desc: 'Guide your breath with a soft particle flow.' },
  { id: 'reaction', name: 'Reaction Tap', icon: Target, calm: false, duration: '30 sec', category: 'Reflex', desc: 'Tap the targets before they vanish.' },
  { id: 'color', name: 'Color Match', icon: Brain, calm: false, duration: '30 sec', category: 'Focus', desc: 'Follow the word, not the ink color.' },
  { id: 'memory', name: 'Memory Flash', icon: ActivityIcon, calm: false, duration: '30 sec', category: 'Memory', desc: 'Watch the pattern and play it back.' },
  { id: 'direction', name: 'Direction Dash', icon: Zap, calm: false, duration: '30 sec', category: 'Opposites', desc: 'Tap the opposite direction, not the obvious one.' },
  { id: 'rulebreaker', name: 'Rule Breaker', icon: Sparkles, calm: false, duration: '30 sec', category: 'Switching', desc: 'Adapt every few seconds as the rule changes.' },
  { id: 'mirrorlogic', name: 'Mirror Logic', icon: Moon, calm: false, duration: '30 sec', category: 'Spatial', desc: 'Choose the mirrored position under pressure.' },
  { id: 'simonparadox', name: 'Simon Paradox', icon: Brain, calm: false, duration: '30 sec', category: 'Control', desc: 'Only react when the instruction earns it.' },
];

type Tab = 'sanctuary' | 'library' | 'pulse' | 'reflect';

export function HomeView() {
  const { difficulty, mood, setDifficulty, setMood, startActivity, streak, totalSessions, initStats, setView } = useMoodStore();
  const [activeTab, setActiveTab] = useState<Tab>('sanctuary');
  const [playingAudio, setPlayingAudio] = useState<'none' | 'ambient' | 'nature'>('none');
  const [reflectionText, setReflectionText] = useState('');
  const [hasMounted, setHasMounted] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    setHasMounted(true);
    initStats();
    try {
      const savedReflection = localStorage.getItem('mood_reset_reflection');
      if (savedReflection) {
        setReflectionText(savedReflection);
      }
    } catch (err) {
      console.warn('Failed to read reflection from localStorage:', err);
    }
  }, [initStats]);

  const fadeUpInitial = hasMounted ? { opacity: 0, y: 18 } : false;
  const reflectionPreview = reflectionText.trim()
    ? `${reflectionText.trim().slice(0, 120)}${reflectionText.trim().length > 120 ? '...' : ''}`
    : 'Write one quick line about how the last reset felt. Notes stay on this device.';
  const difficultyLabel = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  const difficultyCompactLabel = difficulty === 'medium' ? 'Med' : difficultyLabel;

  const handleTabChange = (tab: Tab) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(35);
    }
    setActiveTab(tab);
    playTabSelect();
  };

  const handleSelect = (selectedMood: (typeof MOODS)[number]) => {
    playClick();
    setMood(selectedMood.id);
    setAmbientParameters(selectedMood.id, difficulty);

    let activityToStart = selectedMood.activity;
    if (selectedMood.id === 'bored') {
      const boredActivities: Activity[] = ['color', 'memory', 'direction'];
      activityToStart = boredActivities[Math.floor(Math.random() * boredActivities.length)];
    }

    startActivity(activityToStart, selectedMood.isCalm);
  };

  const handleDirectActivity = (activity: Activity, isCalm: boolean) => {
    playClick();
    setMood(null);
    setAmbientParameters(null, difficulty);
    startActivity(activity, isCalm);
  };

  const handleAudioToggle = (type: 'ambient' | 'nature') => {
    playClick();
    if (playingAudio === type) {
      setPlayingAudio('none');
      toggleAmbientDrift(false);
      toggleNatureFocus(false);
      return;
    }

    setPlayingAudio(type);
    if (type === 'ambient') {
      toggleNatureFocus(false);
      toggleAmbientDrift(true);
    } else {
      toggleAmbientDrift(false);
      toggleNatureFocus(true);
    }
  };

  const handleReflectionChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setReflectionText(e.target.value);
    try {
      localStorage.setItem('mood_reset_reflection', e.target.value);
    } catch (err) {
      console.warn('Failed to save reflection to localStorage:', err);
    }
  };

  const calmItems = LIBRARY_ITEMS.filter((item) => item.calm);
  const focusItems = LIBRARY_ITEMS.filter((item) => !item.calm);

  return (
    <div className="min-h-screen ambient-bg text-foreground">
      <div className="relative isolate min-h-screen">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-primary/6 via-transparent to-transparent" />
        <div className="pointer-events-none absolute left-[-6rem] top-24 h-48 w-48 rounded-full bg-primary/8 blur-3xl" />
        <div className="pointer-events-none absolute right-[-5rem] top-44 h-56 w-56 rounded-full bg-surface-hover/30 blur-3xl" />

        <header className="sticky top-0 z-40 border-b border-border/40 bg-background/72 backdrop-blur-xl">
          <ViewFrame className="py-2.5 sm:py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="section-kicker">Game shell</div>
                <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                  <h1 className="truncate text-xl font-display font-bold tracking-tight sm:text-2xl">MoodDetox</h1>
                  {!isMobile ? <p className="hidden text-sm text-muted lg:block">Reset in under a minute.</p> : null}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                {!isMobile ? (
                  <>
                    <StatChip label="Streak" value={`${streak}d`} icon={Flame} />
                    <StatChip label="Sessions" value={totalSessions} icon={HeartPulse} />
                  </>
                ) : null}
                <ShellButton
                  aria-label="Open settings"
                  size="icon"
                  variant="secondary"
                  className="max-sm:h-8 max-sm:w-8"
                  onClick={() => {
                    playClick();
                    setView('settings');
                  }}
                >
                  <Settings className="h-4 w-4" />
                </ShellButton>
              </div>
            </div>

            {!isMobile ? (
              <SegmentedControl
                className="mt-3"
                value={activeTab}
                onChange={(next) => handleTabChange(next as Tab)}
                options={HOME_TAB_OPTIONS.map((option) => ({ ...option }))}
              />
            ) : null}
          </ViewFrame>
        </header>

        <main className="relative">
          <ViewFrame className={cn('shell-page', isMobile && 'pb-24')}>
            <AnimatePresence mode="wait" initial={false}>
              {activeTab === 'sanctuary' && (
                <motion.section
                  key="sanctuary"
                  initial={fadeUpInitial}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -18 }}
                  transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                  className="space-y-5"
                >
                  <ScreenHeader
                    eyebrow="Quick reset"
                    title="Choose your state"
                    subtitle="Pick the mode that matches how you feel and jump into a short session without the extra chrome."
                    actions={!isMobile ? <StatChip label="Difficulty" value={difficultyLabel} icon={Target} /> : null}
                  />

                  {isMobile ? (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex min-w-0 items-center justify-center gap-2 rounded-full border border-border/45 bg-background/40 px-3 py-2 shadow-[0_14px_34px_-28px_rgba(15,23,42,0.85)]">
                        <Flame className="h-3.5 w-3.5 shrink-0 text-primary/90" />
                        <span className="shrink-0 text-sm font-display font-bold text-foreground">{`${streak}d`}</span>
                        <span className="truncate text-[10px] font-bold uppercase tracking-[0.18em] text-muted">Streak</span>
                      </div>
                      <div className="flex min-w-0 items-center justify-center gap-2 rounded-full border border-border/45 bg-background/40 px-3 py-2 shadow-[0_14px_34px_-28px_rgba(15,23,42,0.85)]">
                        <Target className="h-3.5 w-3.5 shrink-0 text-primary/90" />
                        <span className="shrink-0 text-sm font-display font-bold text-foreground">{difficultyCompactLabel}</span>
                      </div>
                    </div>
                  ) : null}

                  <div className="grid gap-3 sm:gap-4 lg:grid-cols-3">
                    {MOODS.map((selectedMood, index) => {
                      const Icon = selectedMood.icon;

                      return (
                        <motion.button
                          key={selectedMood.id}
                          type="button"
                          initial={fadeUpInitial}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.08 + index * 0.06 }}
                          onClick={() => handleSelect(selectedMood)}
                          className={cn(
                            'game-panel game-panel-raised group relative isolate flex min-h-[204px] min-w-0 flex-col justify-between overflow-hidden p-4 text-left transition-transform duration-300 hover:-translate-y-1 sm:min-h-[236px] sm:p-5 lg:min-h-[250px]',
                            `mood-glow-${selectedMood.theme}`,
                          )}
                        >
                          <div className={cn('pointer-events-none absolute inset-0 opacity-70', `inner-glow-${selectedMood.theme}`)} />
                          <div
                            className={cn(
                              'pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-transparent to-transparent',
                              selectedMood.id === 'tired' && 'from-orange-500/18',
                              selectedMood.id === 'stressed' && 'from-teal-500/18',
                              selectedMood.id === 'bored' && 'from-purple-500/18',
                            )}
                          />

                          <div className="relative z-10 flex items-start justify-between gap-3">
                            <span className={cn('rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em]', selectedMood.badgeClass)}>
                              {selectedMood.meta}
                            </span>
                            <div className={cn('rounded-2xl border border-white/10 p-2.5 sm:p-3', selectedMood.toneClass)}>
                              <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                            </div>
                          </div>

                          <div className="relative z-10 space-y-3">
                            <div className="space-y-1">
                              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">{selectedMood.label}</p>
                              <h3 className={cn('text-xl font-display font-bold tracking-tight sm:text-2xl', selectedMood.toneClass)}>
                                {selectedMood.headline}
                              </h3>
                            </div>
                            <p className="max-w-xs text-[13px] leading-5 text-muted sm:text-sm sm:leading-6">{selectedMood.summary}</p>
                          </div>

                          <div className="relative z-10 flex flex-col items-start gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                              {selectedMood.isCalm ? 'Calm mode' : 'Game mode'}
                            </span>
                            <span
                              className={cn(
                                'inline-flex items-center gap-2 self-start rounded-full px-3 py-2 text-sm font-bold shadow-lg sm:px-3.5',
                                selectedMood.ctaClass,
                              )}
                            >
                              Start
                              <ArrowRight className="h-4 w-4" />
                            </span>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>

                  {isMobile ? (
                    <Panel tone="soft" padding="sm">
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <div className="section-kicker">Quick tools</div>
                          <h3 className="text-lg font-display font-bold">Stay in flow</h3>
                          <p className="text-sm text-muted">Check progress, swap ambience, or drop a note without breaking the game feel.</p>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <StatChip label="Sessions" value={totalSessions} icon={HeartPulse} className="w-full justify-between" />
                          <StatChip label="Difficulty" value={difficultyLabel} icon={Target} className="w-full justify-between" />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => handleTabChange('pulse')}
                            className="flex items-center justify-between rounded-2xl border border-border/45 bg-background/35 px-3 py-3 text-left transition-colors hover:bg-surface-hover/35"
                          >
                            <div>
                              <div className="text-sm font-display font-bold">Pulse</div>
                              <div className="text-[11px] text-muted">Stats and streak</div>
                            </div>
                            <HeartPulse className="h-4 w-4 text-primary" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleTabChange('reflect')}
                            className="flex items-center justify-between rounded-2xl border border-border/45 bg-background/35 px-3 py-3 text-left transition-colors hover:bg-surface-hover/35"
                          >
                            <div>
                              <div className="text-sm font-display font-bold">Journal</div>
                              <div className="text-[11px] text-muted">One quick note</div>
                            </div>
                            <Sparkles className="h-4 w-4 text-primary" />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { id: 'ambient', title: 'Ambient', subtitle: 'Soft tones', icon: Music },
                            { id: 'nature', title: 'Nature', subtitle: 'Wind blend', icon: Sun },
                          ].map((item) => {
                            const Icon = item.icon;
                            const isPlaying = playingAudio === item.id;

                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => handleAudioToggle(item.id as 'ambient' | 'nature')}
                                className="rounded-2xl border border-border/45 bg-background/35 px-3 py-3 text-left transition-colors hover:bg-surface-hover/35"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="space-y-1">
                                    <div className="text-sm font-display font-bold">{item.title}</div>
                                    <div className="text-[11px] text-muted">{isPlaying ? 'Now playing' : item.subtitle}</div>
                                  </div>
                                  <div className="rounded-2xl bg-surface p-2 text-primary">
                                    <Icon className="h-4 w-4" />
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        <div className="rounded-2xl border border-border/45 bg-background/35 p-3">
                          <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">Latest note</div>
                          <p className="text-sm leading-5 text-muted">{reflectionPreview}</p>
                        </div>
                      </div>
                    </Panel>
                  ) : (
                    <div className="grid gap-3 lg:grid-cols-[1.05fr_0.95fr_0.9fr]">
                      <Panel tone="soft" padding="sm" className="h-full">
                        <div className="flex h-full flex-col gap-4">
                          <div className="space-y-2">
                            <div className="section-kicker">Daily pulse</div>
                            <h3 className="text-lg font-display font-bold">Keep the streak alive</h3>
                            <p className="text-sm text-muted">Short sessions work best when the shell stays out of the way and you return often.</p>
                          </div>
                          <div className="grid gap-2 sm:grid-cols-2">
                            <StatChip label="Current streak" value={`${streak} day${streak === 1 ? '' : 's'}`} icon={Flame} className="w-full justify-between" />
                            <StatChip label="Total resets" value={totalSessions} icon={HeartPulse} className="w-full justify-between" />
                          </div>
                          <ShellButton size="sm" variant="secondary" onClick={() => handleTabChange('pulse')} className="self-start">
                            Open Pulse
                          </ShellButton>
                        </div>
                      </Panel>

                      <Panel tone="soft" padding="sm" className="h-full">
                        <div className="flex h-full flex-col gap-3">
                          <div className="space-y-2">
                            <div className="section-kicker">Soundscape</div>
                            <h3 className="text-lg font-display font-bold">Play with less clutter</h3>
                            <p className="text-sm text-muted">Keep one ambience loop running in the background while you navigate the shell.</p>
                          </div>

                          {[
                            { id: 'ambient', title: 'Ambient Drift', subtitle: 'Soft tones for calm focus', icon: Music },
                            { id: 'nature', title: 'Nature Focus', subtitle: 'Wind and brown noise blend', icon: Sun },
                          ].map((item) => {
                            const Icon = item.icon;
                            const isPlaying = playingAudio === item.id;

                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => handleAudioToggle(item.id as 'ambient' | 'nature')}
                                className="flex items-center justify-between gap-3 rounded-2xl border border-border/45 bg-background/35 px-3 py-2.5 text-left transition-colors hover:bg-surface-hover/35"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="rounded-2xl bg-surface p-2 text-primary">
                                    <Icon className="h-4 w-4" />
                                  </div>
                                  <div>
                                    <div className="font-display text-sm font-bold">{item.title}</div>
                                    <div className="text-xs text-muted">{isPlaying ? 'Now playing' : item.subtitle}</div>
                                  </div>
                                </div>
                                {isPlaying ? <PauseCircle className="h-5 w-5 text-primary" /> : <PlayCircle className="h-5 w-5 text-muted" />}
                              </button>
                            );
                          })}
                        </div>
                      </Panel>

                      <Panel tone="soft" padding="sm" className="h-full">
                        <div className="flex h-full flex-col gap-4">
                          <div className="space-y-2">
                            <div className="section-kicker">Reflect</div>
                            <h3 className="text-lg font-display font-bold">Keep one quick note</h3>
                            <p className="text-sm text-muted">No feed, no clutter. Just a short checkpoint between resets.</p>
                          </div>
                          <div className="min-h-[96px] rounded-2xl border border-border/45 bg-background/35 p-3 text-sm leading-6 text-muted">
                            {reflectionPreview}
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Saved locally</span>
                            <ShellButton size="sm" variant="secondary" onClick={() => handleTabChange('reflect')}>
                              Open journal
                            </ShellButton>
                          </div>
                        </div>
                      </Panel>
                    </div>
                  )}
                </motion.section>
              )}

              {activeTab === 'library' && (
                <motion.section
                  key="library"
                  initial={fadeUpInitial}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -18 }}
                  transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                  className="space-y-5"
                >
                  <ScreenHeader
                    eyebrow="Game menu"
                    title="Library"
                    subtitle="All reset activities in one place, with difficulty and local multiplayer close at hand."
                  />

                  <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                    <Panel tone="soft" padding="sm">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="section-kicker">Session difficulty</div>
                          <h3 className="text-lg font-display font-bold">Keep your challenge level steady</h3>
                        </div>
                        <SegmentedControl
                          compact
                          value={difficulty}
                          onChange={(next) => {
                            playClick();
                            setDifficulty(next as 'easy' | 'medium' | 'hard');
                            setAmbientParameters(mood, next as 'easy' | 'medium' | 'hard');
                          }}
                          options={DIFFICULTY_OPTIONS.map((option) => ({ ...option }))}
                        />
                      </div>
                    </Panel>

                    <Panel tone="soft" padding="sm">
                      <div className="flex h-full flex-col justify-between gap-4">
                        <div className="space-y-2">
                          <div className="section-kicker">Local multiplayer</div>
                          <h3 className="text-lg font-display font-bold">Play side-by-side with a friend</h3>
                          <p className="text-sm text-muted">Host a short head-to-head match from the same browser session flow.</p>
                        </div>
                        <ShellButton
                          variant="primary"
                          onClick={() => {
                            playClick();
                            setView('multiplayer_lobby');
                          }}
                          className="self-start"
                        >
                          <Users className="h-4 w-4" />
                          Open lobby
                        </ShellButton>
                      </div>
                    </Panel>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="section-kicker">Calm</div>
                      <h3 className="text-lg font-display font-bold">Quiet modes</h3>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      {calmItems.map((item) => {
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleDirectActivity(item.id, item.calm)}
                            className="game-panel group flex items-start gap-4 p-3.5 text-left transition-transform duration-200 hover:-translate-y-0.5 sm:p-4"
                          >
                            <div className="rounded-2xl bg-teal-500/12 p-3 text-teal-500">
                              <Icon className="h-6 w-6" />
                            </div>
                            <div className="min-w-0 space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="font-display text-lg font-bold">{item.name}</h4>
                                <span className="rounded-full bg-surface-hover/50 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
                                  {item.duration}
                                </span>
                              </div>
                              <p className="text-sm leading-6 text-muted">{item.desc}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="section-kicker">Games</div>
                      <h3 className="text-lg font-display font-bold">Fast focus rounds</h3>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      {focusItems.map((item) => {
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleDirectActivity(item.id, item.calm)}
                            className="game-panel group flex items-start gap-4 p-3.5 text-left transition-transform duration-200 hover:-translate-y-0.5 sm:p-4"
                          >
                            <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                              <Icon className="h-6 w-6" />
                            </div>
                            <div className="min-w-0 space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="font-display text-lg font-bold">{item.name}</h4>
                                <span className="rounded-full bg-surface-hover/50 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
                                  {item.category}
                                </span>
                                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">{item.duration}</span>
                              </div>
                              <p className="text-sm leading-6 text-muted">{item.desc}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </motion.section>
              )}

              {activeTab === 'pulse' && (
                <motion.section
                  key="pulse"
                  initial={fadeUpInitial}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -18 }}
                  transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                  className="space-y-5"
                >
                  <ScreenHeader
                    eyebrow="Progress"
                    title="Your Pulse"
                    subtitle="A compact read on how often you reset, how hard you play, and where to go next."
                  />

                  <div className="grid gap-4 md:grid-cols-3">
                    <Panel tone="raised" className="text-center">
                      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500/12 text-orange-500">
                        <Flame className="h-7 w-7" />
                      </div>
                      <div className="text-4xl font-display font-bold">{streak}</div>
                      <div className="mt-1 text-xs font-semibold uppercase tracking-[0.22em] text-muted">Day streak</div>
                    </Panel>

                    <Panel tone="raised" className="text-center">
                      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <HeartPulse className="h-7 w-7" />
                      </div>
                      <div className="text-4xl font-display font-bold">{totalSessions}</div>
                      <div className="mt-1 text-xs font-semibold uppercase tracking-[0.22em] text-muted">Total resets</div>
                    </Panel>

                    <Panel tone="raised" className="text-center">
                      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-500/12 text-teal-500">
                        <Target className="h-7 w-7" />
                      </div>
                      <div className="text-4xl font-display font-bold capitalize">{difficulty}</div>
                      <div className="mt-1 text-xs font-semibold uppercase tracking-[0.22em] text-muted">Current difficulty</div>
                    </Panel>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
                    <Panel tone="soft">
                      <div className="space-y-3">
                        <div className="section-kicker">What it means</div>
                        <h3 className="text-lg font-display font-bold">
                          {streak > 0 ? `You are on a ${streak}-day run.` : 'You are ready to start a new streak.'}
                        </h3>
                        <p className="text-sm leading-6 text-muted">
                          Frequent short rounds matter more than long sessions. Keep the shell simple, return often, and let the score build naturally.
                        </p>
                      </div>
                    </Panel>

                    <Panel tone="soft">
                      <div className="flex h-full flex-col justify-between gap-4">
                        <div className="space-y-2">
                          <div className="section-kicker">Next move</div>
                          <h3 className="text-lg font-display font-bold">Jump back into a quick reset</h3>
                          <p className="text-sm text-muted">Return to the mode picker or open the full activity library.</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <ShellButton variant="primary" onClick={() => handleTabChange('sanctuary')}>
                            Open Sanctuary
                          </ShellButton>
                          <ShellButton variant="secondary" onClick={() => handleTabChange('library')}>
                            Open Library
                          </ShellButton>
                        </div>
                      </div>
                    </Panel>
                  </div>
                </motion.section>
              )}

              {activeTab === 'reflect' && (
                <motion.section
                  key="reflect"
                  initial={fadeUpInitial}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -18 }}
                  transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                  className="space-y-5"
                >
                  <ScreenHeader
                    eyebrow="Journal"
                    title="Reflect"
                    subtitle="A quiet note field for how the last round felt. Nothing public, nothing busy."
                    actions={<StatChip label="Storage" value="Local only" icon={Sparkles} />}
                  />

                  <Panel tone="raised" padding="lg">
                    <div className="space-y-4">
                      <div className="rounded-2xl border border-border/45 bg-background/35 p-4 text-sm text-muted">
                        Short notes help you track what state you came in with and which mode helped most.
                      </div>
                      <textarea
                        value={reflectionText}
                        onChange={handleReflectionChange}
                        placeholder="What changed after this reset?"
                        className="min-h-[320px] w-full resize-none rounded-[1.3rem] border border-border/45 bg-background/35 p-4 text-base text-foreground outline-none transition-colors placeholder:text-muted/60 focus:border-primary/55"
                      />
                    </div>
                  </Panel>
                </motion.section>
              )}
            </AnimatePresence>
          </ViewFrame>
        </main>

        {isMobile ? (
          <div className="pointer-events-none fixed inset-x-0 bottom-1.5 z-50 px-2.5">
            <div className="pointer-events-auto mx-auto w-full max-w-sm rounded-[1.2rem] border border-border/45 bg-background/88 p-1 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.85)] backdrop-blur-xl">
              <div className="grid grid-cols-4 gap-0.5">
                {HOME_TAB_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const isActive = activeTab === option.id;
                  const mobileLabel =
                    option.id === 'library' ? 'Games' : option.id === 'pulse' ? 'Stats' : option.id === 'reflect' ? 'Notes' : option.shortLabel;

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => handleTabChange(option.id)}
                      className={cn(
                        'flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-[0.95rem] px-1 py-1.5 text-[8px] font-bold uppercase tracking-[0.1em] transition-colors',
                        isActive ? 'bg-primary text-primary-fg' : 'text-muted',
                      )}
                    >
                      <Icon className="h-3 w-3 shrink-0" />
                      <span className="truncate leading-none">{mobileLabel}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
