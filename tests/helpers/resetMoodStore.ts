import { useMoodStore } from '@/store/useMoodStore';

export function resetMoodStore() {
  useMoodStore.setState({
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
  });
}
