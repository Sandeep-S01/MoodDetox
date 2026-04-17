'use client';

import { useEffect, useState } from 'react';
import { useMoodStore, Mood, Activity } from '@/store/useMoodStore';
import { useIsMobile } from '@/hooks/use-mobile';
import { motion, AnimatePresence } from 'motion/react';
import {
  Moon, Wind, Zap, Leaf, Gamepad2, HeartPulse, Sparkles,
  Settings, User, ArrowRight, Music, PauseCircle, Sun, PlayCircle, Plus,
  Activity as ActivityIcon, Brain, Target, Flame, Users
} from 'lucide-react';
import { toggleAmbientDrift, toggleNatureFocus, playClick, playTabSelect, setAmbientParameters } from '@/lib/audio';

const MOODS: { 
  id: Mood; 
  label: string; 
  subtitle: string;
  icon: React.ElementType; 
  activity: Activity; 
  isCalm: boolean; 
  theme: string;
  buttonText: string;
}[] = [
  {
    id: 'tired',
    label: 'Tired',
    subtitle: 'Recharge & Flow',
    icon: Moon,
    activity: 'reaction',
    isCalm: false,
    theme: 'tired',
    buttonText: 'Begin Reset'
  },
  {
    id: 'stressed',
    label: 'Stressed',
    subtitle: 'Release & Center',
    icon: Wind,
    activity: 'particles',
    isCalm: true,
    theme: 'stressed',
    buttonText: 'Start Breathing'
  },
  {
    id: 'bored',
    label: 'Bored',
    subtitle: 'Spark & Create',
    icon: Zap,
    activity: 'color',
    isCalm: false,
    theme: 'bored',
    buttonText: 'Launch Spark'
  },
];

type Tab = 'sanctuary' | 'library' | 'pulse' | 'reflect';

export function HomeView() {
  const {
    difficulty,
    mood,
    setDifficulty,
    setMood,
    startActivity,
    streak,
    totalSessions,
    initStats,
    setView
  } = useMoodStore();
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
      if (savedReflection) setReflectionText(savedReflection);
    } catch (err) {
      console.warn('Failed to read reflection from localStorage:', err);
    }
  }, [initStats]);

  const fadeUpInitial = hasMounted ? { opacity: 0, y: 20 } : false;

  const handleTabChange = (tab: Tab) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(50);
    }
    setActiveTab(tab);
    playTabSelect();
  };

  const handleSelect = (mood: typeof MOODS[0]) => {
    playClick();
    setMood(mood.id);
    setAmbientParameters(mood.id, difficulty);
    let activityToStart = mood.activity;
    
    if (mood.id === 'bored') {
      const boredActivities: Activity[] = ['color', 'memory', 'direction'];
      activityToStart = boredActivities[Math.floor(Math.random() * boredActivities.length)];
    }
    
    startActivity(activityToStart, mood.isCalm);
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
    } else {
      setPlayingAudio(type);
      if (type === 'ambient') {
        toggleNatureFocus(false);
        toggleAmbientDrift(true);
      } else {
        toggleAmbientDrift(false);
        toggleNatureFocus(true);
      }
    }
  };

  const handleReflectionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setReflectionText(e.target.value);
    try {
      localStorage.setItem('mood_reset_reflection', e.target.value);
    } catch (err) {
      console.warn('Failed to save reflection to localStorage:', err);
    }
  };


  return (
    <div className="w-full min-h-screen flex ambient-bg text-foreground font-sans">
      {/* Top Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center w-full px-8 py-6 font-display tracking-tight bg-background/80 backdrop-blur-md">
        <div className="text-2xl font-bold">MoodDetox</div>
        {!isMobile && (
          <div className="flex gap-8 items-center">
            <button onClick={() => handleTabChange('sanctuary')} className={`${activeTab === 'sanctuary' ? 'text-primary font-bold' : 'text-muted'} hover:opacity-80 transition-opacity`}>Sanctuary</button>
            <button onClick={() => handleTabChange('library')} className={`${activeTab === 'library' ? 'text-primary font-bold' : 'text-muted'} hover:opacity-80 transition-opacity`}>Library</button>
            <button onClick={() => handleTabChange('pulse')} className={`${activeTab === 'pulse' ? 'text-primary font-bold' : 'text-muted'} hover:opacity-80 transition-opacity`}>Pulse</button>
            <button onClick={() => handleTabChange('reflect')} className={`${activeTab === 'reflect' ? 'text-primary font-bold' : 'text-muted'} hover:opacity-80 transition-opacity`}>Reflect</button>
          </div>
        )}
        <div className="flex items-center gap-4 text-primary">
          <Settings 
            onClick={() => {
              playClick();
              setView('settings');
            }}
            className="w-6 h-6 cursor-pointer hover:opacity-80 transition-opacity" 
          />
          <User className="w-6 h-6 cursor-pointer hover:opacity-80 transition-opacity" />
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 px-8 pt-32 pb-32 flex flex-col items-center min-h-screen">
        <AnimatePresence mode="wait" initial={false}>
          {activeTab === 'sanctuary' && (
            <motion.div 
              key="sanctuary"
              initial={fadeUpInitial}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full flex flex-col items-center"
            >
              <div className="max-w-6xl w-full text-center space-y-4 mb-20">
                <span className="text-muted font-sans text-sm uppercase tracking-[0.3em]">The Experience</span>
                <h1 className="text-6xl md:text-8xl font-display font-extrabold tracking-tighter leading-tight">
                  MoodDetox
                </h1>
                <p className="text-lg md:text-xl text-muted max-w-xl mx-auto opacity-70">
                  Select your state for a 60-second reset. Your digital breath begins here.
                </p>
              </div>

              {/* Mood Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl">
                {MOODS.map((mood, index) => {
                  const Icon = mood.icon;
                  const isStressed = mood.id === 'stressed';
                  
                  const colorMap = {
                    tired: { bg: 'bg-orange-500/10', text: 'text-orange-500', buttonBg: 'bg-orange-500', buttonText: 'text-white' },
                    stressed: { bg: 'bg-teal-500/10', text: 'text-teal-500', buttonBg: 'bg-teal-500', buttonText: 'text-white' },
                    bored: { bg: 'bg-purple-500/10', text: 'text-purple-500', buttonBg: 'bg-purple-500', buttonText: 'text-white' },
                  };
                  const colors = colorMap[mood.id as keyof typeof colorMap];

                  return (
                    <motion.div
                      key={mood.id}
                      initial={fadeUpInitial}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + index * 0.1 }}
                      onClick={() => handleSelect(mood)}
                      className={`group relative overflow-hidden rounded-3xl flex flex-col items-center justify-end p-10 cursor-pointer transition-all duration-500 hover:-translate-y-2 hover:scale-[1.02] bg-surface mood-glow-${mood.theme} ${isStressed ? 'h-[500px] md:-translate-y-6' : 'h-[450px]'}`}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-b from-transparent to-surface-hover opacity-50`}></div>
                      <div className={`absolute inset-0 inner-glow-${mood.theme} opacity-40`}></div>
                      
                      <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                        <div className={`w-24 h-24 rounded-full ${colors.bg} flex items-center justify-center ${colors.text} shadow-xl`}>
                          <Icon className="w-10 h-10" />
                        </div>
                        <div>
                          <h2 className={`text-3xl font-display font-bold ${colors.text} mb-2`}>{mood.label}</h2>
                          <p className="text-muted text-sm font-sans uppercase tracking-widest">{mood.subtitle}</p>
                        </div>
                        <div className="pt-4">
                          <button className={`${colors.buttonBg} ${colors.buttonText} px-8 py-3 rounded-full font-sans text-sm font-bold opacity-0 group-hover:opacity-100 transition-all transform translate-y-4 group-hover:translate-y-0`}>
                            {mood.buttonText}
                          </button>
                        </div>
                      </div>

                      {isStressed && (
                        <div className="absolute top-6 right-6">
                          <span className={`${colors.bg} ${colors.text} px-4 py-1 rounded-full text-xs font-bold uppercase`}>Most Needed</span>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {/* Bottom Grid */}
              <div className="mt-24 grid grid-cols-1 md:grid-cols-4 gap-8 w-full max-w-6xl">
                {/* Streak Card */}
                <div className="col-span-1 md:col-span-2 bg-surface rounded-2xl p-12 relative overflow-hidden group">
                  <div className="relative z-10 space-y-4">
                    <span className="text-muted font-sans text-xs uppercase tracking-widest">Daily Insight</span>
                    <h4 className="text-2xl font-display font-bold">
                      {streak > 0 
                        ? `You've found calm ${streak} day${streak === 1 ? '' : 's'} in a row.`
                        : "Start your journey to emotional resilience today."}
                    </h4>
                    <p className="text-muted font-sans">Keep the momentum going. Consistency is the foundation of emotional resilience.</p>
                    <button onClick={() => handleTabChange('pulse')} className="flex items-center text-primary font-bold font-sans text-sm group-hover:opacity-80 transition-opacity">
                      View detailed stats
                      <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                    </button>
                  </div>
                  <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-colors"></div>
                </div>

                {/* Audio Cards */}
                <div className="col-span-1 md:col-span-2 flex flex-col gap-4">
                  <div className="flex-1 bg-surface rounded-2xl p-8 flex items-center justify-between border-b-4 border-surface-hover">
                    <div className="flex items-center gap-6">
                      <div className="w-12 h-12 bg-surface-hover rounded-full flex items-center justify-center">
                        <Music className="w-5 h-5 text-muted" />
                      </div>
                      <div>
                        <h5 className="font-display font-bold">Ambient Drift</h5>
                        <p className="text-xs text-muted font-sans">{playingAudio === 'ambient' ? 'Now playing in your Sanctuary' : 'Binaural relaxation'}</p>
                      </div>
                    </div>
                    <button onClick={() => handleAudioToggle('ambient')} className="hover:scale-110 transition-transform">
                      {playingAudio === 'ambient' ? <PauseCircle className="w-8 h-8 text-primary" /> : <PlayCircle className="w-8 h-8 text-muted" />}
                    </button>
                  </div>
                  <div className="flex-1 bg-surface rounded-2xl p-8 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="w-12 h-12 bg-surface-hover rounded-full flex items-center justify-center">
                        <Sun className="w-5 h-5 text-muted" />
                      </div>
                      <div>
                        <h5 className="font-display font-bold">Nature Focus</h5>
                        <p className="text-xs text-muted font-sans">{playingAudio === 'nature' ? 'Now playing in your Sanctuary' : 'Brown noise & wind'}</p>
                      </div>
                    </div>
                    <button onClick={() => handleAudioToggle('nature')} className="hover:scale-110 transition-transform">
                      {playingAudio === 'nature' ? <PauseCircle className="w-8 h-8 text-primary" /> : <PlayCircle className="w-8 h-8 text-muted" />}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'library' && (
            <motion.div 
              key="library"
              initial={fadeUpInitial}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-4xl"
            >
              <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                  <h2 className="text-4xl font-display font-bold mb-4">Experience Library</h2>
                  <p className="text-muted">Direct access to all micro-games and calm activities.</p>
                </div>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-2 bg-surface p-1 rounded-full">
                    {(['easy', 'medium', 'hard'] as const).map(diff => (
                      <button
                        key={diff}
                        onClick={() => {
                          playClick();
                          setDifficulty(diff);
                          setAmbientParameters(mood, diff);
                        }}
                        className={`px-4 py-2 rounded-full text-sm font-bold capitalize transition-colors ${difficulty === diff ? 'bg-primary text-primary-fg' : 'text-muted hover:text-foreground'}`}
                      >
                        {diff}
                      </button>
                    ))}
                  </div>
                  <button 
                    onClick={() => {
                      playClick();
                      setView('multiplayer_lobby');
                    }}
                    className="px-6 py-3 bg-primary text-primary-fg rounded-full font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity whitespace-nowrap"
                  >
                    <Users className="w-5 h-5" />
                    Local Multiplayer
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { id: 'particles', name: 'Particle Breathing', icon: Wind, calm: true, desc: '60s guided breathing with interactive particles.' },
                  { id: 'reaction', name: 'Reaction Tap', icon: Target, calm: false, desc: '30s fast-paced target tapping to wake up.' },
                  { id: 'color', name: 'Color Match', icon: Brain, calm: false, desc: '30s cognitive test based on the Stroop effect.' },
                  { id: 'memory', name: 'Memory Flash', icon: ActivityIcon, calm: false, desc: '30s sequence memory game with musical tones.' },
                  { id: 'direction', name: 'Direction Dash', icon: Zap, calm: false, desc: '30s cognitive reaction test with opposites.' },
                  { id: 'rulebreaker', name: 'Rule Breaker', icon: Sparkles, calm: false, desc: '30s context-switching challenge. Watch the rule!' },
                  { id: 'mirrorlogic', name: 'Mirror Logic', icon: Moon, calm: false, desc: '30s spatial inversion challenge. Tap the reflection!' },
                  { id: 'simonparadox', name: 'Simon Paradox', icon: Brain, calm: false, desc: '30s inhibitory control challenge. Listen to Simon!' },
                ].map(act => (
                  <div key={act.id} onClick={() => handleDirectActivity(act.id as Activity, act.calm)} className="bg-surface p-6 rounded-2xl cursor-pointer hover:bg-surface-hover transition-colors flex items-center gap-6 group">
                    <div className="w-16 h-16 rounded-full bg-background flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                      <act.icon className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-lg">{act.name}</h3>
                      <p className="text-sm text-muted">{act.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'pulse' && (
            <motion.div 
              key="pulse"
              initial={fadeUpInitial}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-4xl"
            >
              <div className="mb-12">
                <h2 className="text-4xl font-display font-bold mb-4">Your Pulse</h2>
                <p className="text-muted">Track your emotional resilience journey.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-surface p-10 rounded-3xl flex flex-col items-center justify-center text-center">
                  <div className="w-24 h-24 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center mb-6">
                    <Flame className="w-12 h-12" />
                  </div>
                  <div className="text-6xl font-display font-bold mb-2">{streak}</div>
                  <div className="text-muted uppercase tracking-widest text-sm">Current Streak (Days)</div>
                </div>
                <div className="bg-surface p-10 rounded-3xl flex flex-col items-center justify-center text-center">
                  <div className="w-24 h-24 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-6">
                    <HeartPulse className="w-12 h-12" />
                  </div>
                  <div className="text-6xl font-display font-bold mb-2">{totalSessions}</div>
                  <div className="text-muted uppercase tracking-widest text-sm">Total Resets</div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'reflect' && (
            <motion.div 
              key="reflect"
              initial={fadeUpInitial}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-4xl flex flex-col h-[60vh]"
            >
              <div className="mb-8">
                <h2 className="text-4xl font-display font-bold mb-4">Digital Journal</h2>
                <p className="text-muted">A private space to drop your thoughts. Saved locally.</p>
              </div>
              <textarea
                value={reflectionText}
                onChange={handleReflectionChange}
                placeholder="What's on your mind right now?..."
                className="flex-1 w-full bg-surface border-none rounded-3xl p-8 text-lg resize-none focus:ring-2 focus:ring-primary outline-none text-foreground placeholder:text-muted/50"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <footer className="mt-32 w-full max-w-6xl flex flex-col md:flex-row justify-between items-center text-muted font-sans text-xs uppercase tracking-[0.2em]">
          <div className="mb-4 md:mb-0">MoodDetox © 2026</div>
          <div className="flex gap-8">
            <a className="hover:text-primary transition-colors" href="#">Privacy</a>
            <a className="hover:text-primary transition-colors" href="#">OS Settings</a>
            <a className="hover:text-primary transition-colors" href="#">Community</a>
          </div>
        </footer>
      </main>

      {/* FAB */}
      {!isMobile && (
        <button 
          onClick={() => handleTabChange('reflect')}
          className="fixed bottom-10 right-10 w-16 h-16 bg-primary text-primary-fg rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform active:scale-95 group z-50"
        >
          <Plus className="w-8 h-8" />
          <span className="absolute right-20 bg-surface text-foreground px-4 py-2 rounded-lg font-sans text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none uppercase tracking-widest shadow-lg">
            New Reflection
          </span>
        </button>
      )}

      {/* Mobile Nav */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-lg flex justify-around items-center p-6 z-50 border-t border-surface">
          <motion.button whileTap={{ scale: 0.85 }} onClick={() => handleTabChange('sanctuary')} className={`flex flex-col items-center gap-1 cursor-pointer ${activeTab === 'sanctuary' ? 'text-primary font-bold' : 'text-muted'}`}>
            <Leaf className="w-5 h-5" />
            <span className="text-[10px] font-display uppercase tracking-tighter">Sanctuary</span>
          </motion.button>
          <motion.button whileTap={{ scale: 0.85 }} onClick={() => handleTabChange('library')} className={`flex flex-col items-center gap-1 cursor-pointer ${activeTab === 'library' ? 'text-primary font-bold' : 'text-muted'}`}>
            <Gamepad2 className="w-5 h-5" />
            <span className="text-[10px] font-display uppercase tracking-tighter">Library</span>
          </motion.button>
          <motion.button whileTap={{ scale: 0.85 }} onClick={() => handleTabChange('pulse')} className={`flex flex-col items-center gap-1 cursor-pointer ${activeTab === 'pulse' ? 'text-primary font-bold' : 'text-muted'}`}>
            <HeartPulse className="w-5 h-5" />
            <span className="text-[10px] font-display uppercase tracking-tighter">Pulse</span>
          </motion.button>
          <motion.button whileTap={{ scale: 0.85 }} onClick={() => handleTabChange('reflect')} className={`flex flex-col items-center gap-1 cursor-pointer ${activeTab === 'reflect' ? 'text-primary font-bold' : 'text-muted'}`}>
            <Sparkles className="w-5 h-5" />
            <span className="text-[10px] font-display uppercase tracking-tighter">Reflect</span>
          </motion.button>
        </div>
      )}
    </div>
  );
}


