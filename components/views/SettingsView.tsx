'use client';

import { useMoodStore, Difficulty, ThemePreference } from '@/store/useMoodStore';
import { motion } from 'motion/react';
import { ArrowLeft, Volume2, VolumeX, Monitor, Moon, Sun, Sliders } from 'lucide-react';
import { playClick } from '@/lib/audio';
import { useIsMobile } from '@/hooks/use-mobile';

export function SettingsView() {
  const { 
    difficulty, setDifficulty, 
    volume, setVolume, 
    soundEnabled, setSoundEnabled, 
    theme, setTheme, 
    setView 
  } = useMoodStore();
  const isMobile = useIsMobile();

  const handleBack = () => {
    playClick();
    setView('home');
  };

  const handleDifficultyChange = (diff: Difficulty) => {
    playClick();
    setDifficulty(diff);
  };

  const handleThemeChange = (newTheme: ThemePreference) => {
    playClick();
    setTheme(newTheme);
  };

  const handleSoundToggle = () => {
    playClick();
    setSoundEnabled(!soundEnabled);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseFloat(e.target.value));
  };

  return (
    <div className={`flex flex-col items-center justify-start w-full h-full ${isMobile ? 'max-w-md' : 'max-w-2xl'} px-6 pt-12 pb-6 relative`}>
      {/* Header */}
      <div className="flex items-center w-full mb-8 relative">
        <button 
          onClick={handleBack}
          className="absolute left-0 p-3 -ml-3 text-muted hover:text-foreground transition-colors rounded-full hover:bg-surface"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-display font-bold w-full text-center">Settings</h2>
      </div>

      <div className="w-full flex flex-col gap-8 overflow-y-auto pb-20 no-scrollbar">
        
        {/* Difficulty Section */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-2 text-muted uppercase tracking-widest text-xs font-bold">
            <Sliders className="w-4 h-4" />
            Default Difficulty
          </div>
          <div className="bg-surface rounded-2xl p-2 flex gap-2">
            {(['easy', 'medium', 'hard'] as const).map(diff => (
              <button
                key={diff}
                onClick={() => handleDifficultyChange(diff)}
                className={`flex-1 py-3 rounded-xl text-sm font-bold capitalize transition-all ${difficulty === diff ? 'bg-primary text-primary-fg shadow-sm' : 'text-muted hover:text-foreground hover:bg-background'}`}
              >
                {diff}
              </button>
            ))}
          </div>
        </section>

        {/* Audio Section */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-2 text-muted uppercase tracking-widest text-xs font-bold">
            <Volume2 className="w-4 h-4" />
            Audio Preferences
          </div>
          <div className="bg-surface rounded-2xl p-6 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <span className="font-bold">Sound Effects & Ambient</span>
              <button 
                onClick={handleSoundToggle}
                className={`w-14 h-8 rounded-full p-1 transition-colors ${soundEnabled ? 'bg-primary' : 'bg-muted/30'}`}
              >
                <motion.div 
                  className="w-6 h-6 bg-white rounded-full shadow-sm flex items-center justify-center"
                  animate={{ x: soundEnabled ? 24 : 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                >
                  {soundEnabled ? <Volume2 className="w-3 h-3 text-primary" /> : <VolumeX className="w-3 h-3 text-muted" />}
                </motion.div>
              </button>
            </div>

            <div className={`flex flex-col gap-4 transition-opacity ${soundEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
              <div className="flex items-center justify-between text-sm font-bold">
                <span>Volume</span>
                <span className="text-muted">{Math.round(volume * 100)}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.05" 
                value={volume} 
                onChange={handleVolumeChange}
                className="w-full accent-primary"
              />
            </div>
          </div>
        </section>

        {/* Theme Section */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-2 text-muted uppercase tracking-widest text-xs font-bold">
            <Monitor className="w-4 h-4" />
            Theme
          </div>
          <div className="bg-surface rounded-2xl p-2 flex gap-2">
            <button
              onClick={() => handleThemeChange('light')}
              className={`flex-1 py-3 rounded-xl text-sm font-bold flex flex-col items-center gap-2 transition-all ${theme === 'light' ? 'bg-primary text-primary-fg shadow-sm' : 'text-muted hover:text-foreground hover:bg-background'}`}
            >
              <Sun className="w-5 h-5" />
              Light
            </button>
            <button
              onClick={() => handleThemeChange('dark')}
              className={`flex-1 py-3 rounded-xl text-sm font-bold flex flex-col items-center gap-2 transition-all ${theme === 'dark' ? 'bg-primary text-primary-fg shadow-sm' : 'text-muted hover:text-foreground hover:bg-background'}`}
            >
              <Moon className="w-5 h-5" />
              Dark
            </button>
            <button
              onClick={() => handleThemeChange('system')}
              className={`flex-1 py-3 rounded-xl text-sm font-bold flex flex-col items-center gap-2 transition-all ${theme === 'system' ? 'bg-primary text-primary-fg shadow-sm' : 'text-muted hover:text-foreground hover:bg-background'}`}
            >
              <Monitor className="w-5 h-5" />
              System
            </button>
          </div>
        </section>

      </div>
    </div>
  );
}
