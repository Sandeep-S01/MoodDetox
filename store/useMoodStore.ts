import { create } from 'zustand';

export type ViewState = 'home' | 'game' | 'calm' | 'result' | 'challenge_prompt' | 'multiplayer_lobby' | 'settings';
export type Mood = 'tired' | 'stressed' | 'bored' | null;
export type Activity = 'reaction' | 'color' | 'memory' | 'particles' | 'direction' | 'rulebreaker' | 'mirrorlogic' | 'simonparadox' | null;
export type Difficulty = 'easy' | 'medium' | 'hard';
export type ThemePreference = 'light' | 'dark' | 'system';

export interface Challenge {
  activity: Activity;
  targetScore: number;
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'error' | 'success' | 'info';
}

interface MoodStore {
  view: ViewState;
  mood: Mood;
  activity: Activity;
  difficulty: Difficulty;
  score: number;
  resultMessage: string;
  streak: number;
  totalSessions: number;
  challenge: Challenge | null;
  toasts: ToastMessage[];

  // Settings
  volume: number;
  soundEnabled: boolean;
  theme: ThemePreference;

  // Multiplayer State
  isMultiplayer: boolean;
  multiplayerRole: 'host' | 'guest' | null;
  opponentScore: number;
  connectionStatus: 'disconnected' | 'connecting' | 'connected';
  peerId: string | null;
  
  // Actions
  setMood: (mood: Mood) => void;
  setDifficulty: (difficulty: Difficulty) => void;
  setVolume: (volume: number) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setTheme: (theme: ThemePreference) => void;
  startActivity: (activity: Activity, isCalm?: boolean) => void;
  endActivity: (score: number, message: string) => void;
  reset: () => void;
  initStats: () => void;
  setChallenge: (challenge: Challenge | null) => void;
  setView: (view: ViewState) => void;
  addToast: (message: string, type?: 'error' | 'success' | 'info') => void;
  removeToast: (id: string) => void;
  
  // Multiplayer Actions
  setMultiplayerState: (state: Partial<Pick<MoodStore, 'isMultiplayer' | 'multiplayerRole' | 'opponentScore' | 'connectionStatus' | 'peerId' | 'difficulty'>>) => void;
  updateScore: (score: number) => void;
}

const getTodayStr = () => new Date().toDateString();
const getYesterdayStr = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toDateString();
};

export const useMoodStore = create<MoodStore>((set) => ({
  view: 'home',
  mood: null,
  activity: null,
  difficulty: 'medium',
  score: 0,
  resultMessage: '',
  streak: 0,
  totalSessions: 0,
  challenge: null,
  toasts: [],

  volume: 0.5,
  soundEnabled: true,
  theme: 'system',

  isMultiplayer: false,
  multiplayerRole: null,
  opponentScore: 0,
  connectionStatus: 'disconnected',
  peerId: null,

  initStats: () => {
    if (typeof window === 'undefined') return;
    try {
      const lastReset = localStorage.getItem('mood_reset_last_date');
      const savedStreak = parseInt(localStorage.getItem('mood_reset_streak') || '0', 10);
      const savedTotal = parseInt(localStorage.getItem('mood_reset_total') || '0', 10);
      const savedDifficulty = (localStorage.getItem('mood_reset_difficulty') as Difficulty) || 'medium';
      const savedVolume = localStorage.getItem('mood_reset_volume');
      const savedSoundEnabled = localStorage.getItem('mood_reset_sound');
      const savedTheme = (localStorage.getItem('mood_reset_theme') as ThemePreference) || 'system';
      
      const updates: Partial<MoodStore> = {
        difficulty: savedDifficulty,
        theme: savedTheme,
      };

      if (savedVolume !== null) updates.volume = parseFloat(savedVolume);
      if (savedSoundEnabled !== null) updates.soundEnabled = savedSoundEnabled === 'true';

      if (lastReset === getTodayStr() || lastReset === getYesterdayStr()) {
        updates.streak = savedStreak;
        updates.totalSessions = savedTotal;
      } else {
        // Streak broken, but keep total
        updates.streak = 0;
        updates.totalSessions = savedTotal;
        localStorage.setItem('mood_reset_streak', '0');
      }
      set(updates);
    } catch (err) {
      console.warn('Failed to access localStorage:', err);
    }
  },

  setMood: (mood) => set({ mood }),
  
  setDifficulty: (difficulty) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('mood_reset_difficulty', difficulty);
      } catch (err) {
        console.warn('Failed to save difficulty to localStorage:', err);
      }
    }
    set({ difficulty });
  },

  setVolume: (volume) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('mood_reset_volume', volume.toString());
      } catch {
        console.warn('Failed to save volume to localStorage');
      }
    }
    set({ volume });
  },

  setSoundEnabled: (soundEnabled) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('mood_reset_sound', soundEnabled.toString());
      } catch {
        console.warn('Failed to save sound setting to localStorage');
      }
    }
    set({ soundEnabled });
  },

  setTheme: (theme) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('mood_reset_theme', theme);
      } catch {
        console.warn('Failed to save theme to localStorage');
      }
    }
    set({ theme });
  },
  
  startActivity: (activity, isCalm = false) => set({ 
    activity, 
    view: isCalm ? 'calm' : 'game',
    score: 0,
    opponentScore: 0,
    resultMessage: ''
  }),
  
  endActivity: (score, message) => {
    if (typeof window !== 'undefined') {
      try {
        const lastReset = localStorage.getItem('mood_reset_last_date');
        let currentStreak = parseInt(localStorage.getItem('mood_reset_streak') || '0', 10);
        let total = parseInt(localStorage.getItem('mood_reset_total') || '0', 10);
        
        total += 1;
        localStorage.setItem('mood_reset_total', total.toString());

        if (lastReset !== getTodayStr()) {
          if (lastReset === getYesterdayStr()) {
            currentStreak += 1;
          } else {
            currentStreak = 1;
          }
          localStorage.setItem('mood_reset_last_date', getTodayStr());
          localStorage.setItem('mood_reset_streak', currentStreak.toString());
        }
        set({ streak: currentStreak, totalSessions: total });
      } catch (err) {
        console.warn('Failed to save stats to localStorage:', err);
        set((state) => ({ streak: state.streak + 1, totalSessions: state.totalSessions + 1 }));
      }
    }

    set({
      view: 'result',
      score,
      resultMessage: message
    });
  },
  
  reset: () => set({
    view: 'home',
    mood: null,
    activity: null,
    score: 0,
    resultMessage: '',
    challenge: null,
    isMultiplayer: false,
    multiplayerRole: null,
    opponentScore: 0,
    connectionStatus: 'disconnected',
    peerId: null
  }),

  setChallenge: (challenge) => set({ challenge }),
  setView: (view) => set({ view }),

  addToast: (message, type = 'info') => set((state) => {
    const id = Math.random().toString(36).substring(2, 9);
    return { toasts: [...state.toasts, { id, message, type }] };
  }),
  
  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter((t) => t.id !== id)
  })),

  setMultiplayerState: (state) => set((prev) => ({ ...prev, ...state })),
  updateScore: (score) => set({ score })
}));



