import { beforeEach, describe, expect, it } from 'vitest';
import { useMoodStore } from '@/store/useMoodStore';
import { resetMoodStore } from '@/tests/helpers/resetMoodStore';

describe('useMoodStore', () => {
  beforeEach(() => {
    localStorage.clear();
    resetMoodStore();
  });

  it('starts game and calm activities with the correct views', () => {
    useMoodStore.getState().startActivity('reaction');
    expect(useMoodStore.getState()).toMatchObject({
      activity: 'reaction',
      view: 'game',
      score: 0,
    });

    useMoodStore.getState().startActivity('particles', true);
    expect(useMoodStore.getState()).toMatchObject({
      activity: 'particles',
      view: 'calm',
      score: 0,
    });
  });

  it('records a completed first session and moves to result view', () => {
    useMoodStore.getState().endActivity(42, 'Session Complete');

    expect(useMoodStore.getState()).toMatchObject({
      view: 'result',
      score: 42,
      resultMessage: 'Session Complete',
      streak: 1,
      totalSessions: 1,
    });
    expect(localStorage.getItem('mood_reset_streak')).toBe('1');
    expect(localStorage.getItem('mood_reset_total')).toBe('1');
    expect(localStorage.getItem('mood_reset_last_date')).toBe(new Date().toDateString());
  });

  it('resets transient game and multiplayer state', () => {
    useMoodStore.setState({
      activity: 'direction',
      view: 'game',
      score: 18,
      resultMessage: 'Done',
      isMultiplayer: true,
      multiplayerRole: 'host',
      opponentScore: 11,
      connectionStatus: 'connected',
      peerId: 'peer-123',
      challenge: { activity: 'reaction', targetScore: 9 },
    });

    useMoodStore.getState().reset();

    expect(useMoodStore.getState()).toMatchObject({
      activity: null,
      view: 'home',
      score: 0,
      resultMessage: '',
      isMultiplayer: false,
      multiplayerRole: null,
      opponentScore: 0,
      connectionStatus: 'disconnected',
      peerId: null,
      challenge: null,
    });
  });
});
