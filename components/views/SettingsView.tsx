'use client';

import type { ChangeEvent } from 'react';
import { useMoodStore, type Difficulty, type ThemePreference } from '@/store/useMoodStore';
import { ArrowLeft, Monitor, Moon, Sliders, Sun, Volume2, VolumeX } from 'lucide-react';
import { motion } from 'motion/react';
import { playClick } from '@/lib/audio';
import { Panel, ScreenHeader, SegmentedControl, ShellButton, ViewFrame } from '@/components/ui/game-shell';

const DIFFICULTY_OPTIONS = [
  { id: 'easy', label: 'Easy' },
  { id: 'medium', label: 'Medium' },
  { id: 'hard', label: 'Hard' },
] as const;

const THEME_OPTIONS = [
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'dark', label: 'Dark', icon: Moon },
  { id: 'system', label: 'System', icon: Monitor },
] as const;

export function SettingsView() {
  const { difficulty, setDifficulty, volume, setVolume, soundEnabled, setSoundEnabled, theme, setTheme, setView } = useMoodStore();

  const handleBack = () => {
    playClick();
    setView('home');
  };

  const handleDifficultyChange = (nextDifficulty: Difficulty) => {
    playClick();
    setDifficulty(nextDifficulty);
  };

  const handleThemeChange = (nextTheme: ThemePreference) => {
    playClick();
    setTheme(nextTheme);
  };

  const handleSoundToggle = () => {
    playClick();
    setSoundEnabled(!soundEnabled);
  };

  const handleVolumeChange = (e: ChangeEvent<HTMLInputElement>) => {
    setVolume(parseFloat(e.target.value));
  };

  return (
    <ViewFrame className="shell-page max-w-3xl">
      <div className="space-y-5">
        <div className="flex items-start gap-3">
          <ShellButton size="icon" variant="secondary" onClick={handleBack} aria-label="Back to home">
            <ArrowLeft className="h-4 w-4" />
          </ShellButton>
          <ScreenHeader
            className="w-full"
            eyebrow="Controls"
            title="Settings"
            subtitle="Tune your default challenge level, audio behavior, and shell theme without leaving the game flow."
          />
        </div>

        <Panel tone="soft">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold">
              <Sliders className="h-4 w-4 text-primary" />
              <span>Default Difficulty</span>
            </div>
            <SegmentedControl
              compact
              value={difficulty}
              onChange={(next) => handleDifficultyChange(next as Difficulty)}
              options={DIFFICULTY_OPTIONS.map((option) => ({ ...option }))}
            />
          </div>
        </Panel>

        <Panel tone="soft">
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-bold">
                  <Volume2 className="h-4 w-4 text-primary" />
                  <span>Audio</span>
                </div>
                <p className="text-sm text-muted">Keep shell clicks, ambient audio, and calm loops available while you play.</p>
              </div>

              <button
                type="button"
                onClick={handleSoundToggle}
                className={`relative h-8 w-14 rounded-full p-1 transition-colors ${soundEnabled ? 'bg-primary' : 'bg-muted/30'}`}
                aria-pressed={soundEnabled}
              >
                <motion.div
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-sm"
                  animate={{ x: soundEnabled ? 24 : 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                >
                  {soundEnabled ? <Volume2 className="h-3 w-3 text-primary-fg" /> : <VolumeX className="h-3 w-3 text-muted" />}
                </motion.div>
              </button>
            </div>

            <div className={`space-y-3 transition-opacity ${soundEnabled ? 'opacity-100' : 'pointer-events-none opacity-45'}`}>
              <div className="flex items-center justify-between text-sm font-semibold">
                <span>Volume</span>
                <span className="text-muted">{Math.round(volume * 100)}%</span>
              </div>
              <input type="range" min="0" max="1" step="0.05" value={volume} onChange={handleVolumeChange} className="w-full accent-primary" />
            </div>
          </div>
        </Panel>

        <Panel tone="soft">
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-bold">
                <Monitor className="h-4 w-4 text-primary" />
                <span>Theme</span>
              </div>
              <p className="text-sm text-muted">Change the shell tone while keeping the same gameplay and layout.</p>
            </div>

            <SegmentedControl
              compact
              value={theme}
              onChange={(next) => handleThemeChange(next as ThemePreference)}
              options={THEME_OPTIONS.map((option) => ({ ...option }))}
            />
          </div>
        </Panel>
      </div>
    </ViewFrame>
  );
}
