import { useMoodStore, type Activity, type Difficulty } from '@/store/useMoodStore';
import type { DataConnection, Peer as PeerType } from 'peerjs';

type MultiplayerActivity = Extract<Activity, 'reaction' | 'color' | 'direction'>;

type StartGameMessage = {
  type: 'START_GAME';
  activity: MultiplayerActivity;
  difficulty: Difficulty;
  matchId: string;
};

type SetDifficultyMessage = {
  type: 'SET_DIFFICULTY';
  difficulty: Difficulty;
};

type ScoreUpdateMessage = {
  type: 'SCORE_UPDATE';
  score: number;
  matchId: string;
};

type EndGameMessage = {
  type: 'END_GAME';
  score: number;
  matchId: string;
};

type MultiplayerMessage = StartGameMessage | SetDifficultyMessage | ScoreUpdateMessage | EndGameMessage;

const MULTIPLAYER_ACTIVITIES = new Set<MultiplayerActivity>(['reaction', 'color', 'direction']);
const DIFFICULTIES = new Set<Difficulty>(['easy', 'medium', 'hard']);
const CONNECTION_OPEN_TIMEOUT_MS = 15000;
const PEER_READY_TIMEOUT_MS = 10000;

let peer: PeerType | null = null;
let connection: DataConnection | null = null;
let activeMatchId: string | null = null;
let handledRemoteEndMatchId: string | null = null;
let disconnecting = false;

const createMatchId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;
const isMultiplayerActivity = (value: unknown): value is MultiplayerActivity => typeof value === 'string' && MULTIPLAYER_ACTIVITIES.has(value as MultiplayerActivity);
const isDifficulty = (value: unknown): value is Difficulty => typeof value === 'string' && DIFFICULTIES.has(value as Difficulty);
const isFiniteScore = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const isMatchId = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;

const clearActiveMatch = () => {
  activeMatchId = null;
  handledRemoteEndMatchId = null;
};

const handleConnectionLoss = (message: string) => {
  clearActiveMatch();
  connection = null;
  useMoodStore.getState().setMultiplayerState({
    connectionStatus: 'disconnected',
    opponentScore: 0,
  });
  if (!disconnecting) {
    useMoodStore.getState().addToast(message, 'error');
  }
};

const waitForPeerReady = async (timeoutMs = PEER_READY_TIMEOUT_MS) => {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    if (peer && !peer.destroyed && peer.open && peer.id) {
      return peer;
    }

    if (peer && peer.disconnected && !peer.destroyed) {
      peer.reconnect();
    }

    await delay(250);
  }

  throw new Error('Timed out waiting for the multiplayer signaling connection.');
};

const sendRawMessage = (message: MultiplayerMessage) => {
  if (connection && connection.open) {
    connection.send(message);
    return true;
  }
  return false;
};

const parseMessage = (data: unknown): MultiplayerMessage | null => {
  if (!isObject(data) || typeof data.type !== 'string') {
    return null;
  }

  switch (data.type) {
    case 'START_GAME':
      if (isMultiplayerActivity(data.activity) && isDifficulty(data.difficulty) && isMatchId(data.matchId)) {
        return {
          type: 'START_GAME',
          activity: data.activity,
          difficulty: data.difficulty,
          matchId: data.matchId,
        };
      }
      return null;
    case 'SET_DIFFICULTY':
      if (isDifficulty(data.difficulty)) {
        return { type: 'SET_DIFFICULTY', difficulty: data.difficulty };
      }
      return null;
    case 'SCORE_UPDATE':
      if (isFiniteScore(data.score) && isMatchId(data.matchId)) {
        return { type: 'SCORE_UPDATE', score: data.score, matchId: data.matchId };
      }
      return null;
    case 'END_GAME':
      if (isFiniteScore(data.score) && isMatchId(data.matchId)) {
        return { type: 'END_GAME', score: data.score, matchId: data.matchId };
      }
      return null;
    default:
      return null;
  }
};

const setupConnection = (conn: DataConnection) => {
  conn.on('data', (data: unknown) => {
    const message = parseMessage(data);

    if (!message) {
      useMoodStore.getState().addToast('Received invalid multiplayer data. Ignoring it.', 'error');
      return;
    }

    switch (message.type) {
      case 'START_GAME':
        activeMatchId = message.matchId;
        handledRemoteEndMatchId = null;
        useMoodStore.getState().setMultiplayerState({ opponentScore: 0 });
        useMoodStore.getState().setDifficulty(message.difficulty);
        useMoodStore.getState().startActivity(message.activity);
        break;
      case 'SET_DIFFICULTY':
        useMoodStore.getState().setDifficulty(message.difficulty);
        break;
      case 'SCORE_UPDATE':
        if (message.matchId === activeMatchId) {
          useMoodStore.getState().setMultiplayerState({ opponentScore: message.score });
        }
        break;
      case 'END_GAME': {
        if (message.matchId !== activeMatchId) {
          return;
        }

        useMoodStore.getState().setMultiplayerState({ opponentScore: message.score });

        if (handledRemoteEndMatchId === message.matchId) {
          return;
        }

        handledRemoteEndMatchId = message.matchId;
        activeMatchId = null;

        if (useMoodStore.getState().view === 'game') {
          useMoodStore.getState().endActivity(useMoodStore.getState().score, 'Match Finished');
        }
        break;
      }
    }
  });
};

const attachConnection = (conn: DataConnection, role: 'host' | 'guest') => {
  if (connection && connection !== conn && connection.open) {
    conn.close();
    useMoodStore.getState().addToast('Only one multiplayer session can be active at a time.', 'error');
    return;
  }

  connection = conn;

  const openTimeout = setTimeout(() => {
    if (!conn.open) {
      try {
        conn.close();
      } catch {
        // Ignore close failures for timed-out connections.
      }
      handleConnectionLoss('Connection timed out. Please try again.');
    }
  }, CONNECTION_OPEN_TIMEOUT_MS);

  const clearOpenTimeout = () => clearTimeout(openTimeout);

  conn.on('open', () => {
    clearOpenTimeout();
    connection = conn;
    setupConnection(conn);
    useMoodStore.getState().setMultiplayerState({
      connectionStatus: 'connected',
      multiplayerRole: role,
      opponentScore: 0,
    });
    useMoodStore.getState().addToast(role === 'host' ? 'Friend connected!' : 'Connected to host!', 'success');
  });

  conn.on('error', (err) => {
    clearOpenTimeout();
    console.error(`${role} connection error:`, err);
    handleConnectionLoss(`Connection error: ${err.message || 'Unknown error'}`);
  });

  conn.on('close', () => {
    clearOpenTimeout();
    if (disconnecting) {
      connection = null;
      return;
    }
    console.log('Connection closed');
    handleConnectionLoss('Connection to friend lost.');
  });
};

export const initPeer = async () => {
  if (typeof window === 'undefined') return;

  if (peer) {
    if (peer.open) {
      useMoodStore.getState().setMultiplayerState({ peerId: peer.id });
    }
    return;
  }

  try {
    const Peer = (await import('peerjs')).default;

    disconnecting = false;
    peer = new Peer({
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
          { urls: 'stun:stun3.l.google.com:19302' },
          { urls: 'stun:stun4.l.google.com:19302' },
        ],
      },
      pingInterval: 5000,
    }) as unknown as PeerType;

    peer.on('open', (id) => {
      console.log('PeerJS connected to signaling server with ID:', id);
      useMoodStore.getState().setMultiplayerState({ peerId: id });
    });

    peer.on('connection', (conn) => {
      console.log('Incoming connection from guest:', conn.peer);
      attachConnection(conn, 'host');
    });

    peer.on('error', (err: { type: string; message?: string }) => {
      console.error('PeerJS error:', err.type, err);

      if (err.type === 'peer-unavailable') {
        handleConnectionLoss('Could not find the host. They may have disconnected.');
      } else if (
        err.type === 'network' ||
        err.type === 'server-error' ||
        err.type === 'socket-error' ||
        err.type === 'socket-closed'
      ) {
        useMoodStore.getState().addToast('Connection to server lost. Reconnecting...', 'info');
        if (peer && !peer.destroyed) {
          setTimeout(() => {
            if (peer && !peer.destroyed) {
              peer.reconnect();
            }
          }, 2000);
        }
      } else if (err.type === 'browser-incompatible') {
        useMoodStore.getState().addToast('Your browser does not support multiplayer features.', 'error');
      } else {
        useMoodStore.getState().addToast(`Connection error: ${err.message || 'Unknown error'}`, 'error');
      }
    });

    peer.on('disconnected', () => {
      console.log('PeerJS disconnected from signaling server. Attempting to reconnect...');
      if (peer && !peer.destroyed) {
        setTimeout(() => {
          if (peer && !peer.destroyed) {
            peer.reconnect();
          }
        }, 1000);
      }
    });
  } catch (err: unknown) {
    console.error('Failed to initialize PeerJS:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    useMoodStore.getState().addToast(`Failed to start multiplayer: ${message}`, 'error');
  }
};

export const joinGame = async (hostId: string) => {
  if (typeof window === 'undefined') return;

  const trimmedHostId = hostId.trim();
  if (!trimmedHostId) {
    handleConnectionLoss('Invalid host code.');
    return;
  }

  if (!peer) {
    await initPeer();
  }

  useMoodStore.getState().setMultiplayerState({
    connectionStatus: 'connecting',
    multiplayerRole: 'guest',
    isMultiplayer: true,
  });

  try {
    const readyPeer = await waitForPeerReady();
    console.log('Attempting to connect to host:', trimmedHostId);
    const nextConnection = readyPeer.connect(trimmedHostId, { reliable: true });
    attachConnection(nextConnection, 'guest');
  } catch (err) {
    console.error('Failed to prepare guest peer:', err);
    handleConnectionLoss('Connection timed out. Please try again.');
  }
};

export const sendMultiplayerDifficulty = (difficulty: Difficulty) => {
  return sendRawMessage({ type: 'SET_DIFFICULTY', difficulty });
};

export const beginMultiplayerMatch = (activity: MultiplayerActivity, difficulty: Difficulty) => {
  const matchId = createMatchId();
  activeMatchId = matchId;
  handledRemoteEndMatchId = null;
  useMoodStore.getState().setMultiplayerState({ opponentScore: 0 });
  return sendRawMessage({ type: 'START_GAME', activity, difficulty, matchId });
};

export const sendMultiplayerScore = (score: number) => {
  if (!activeMatchId) {
    return false;
  }

  return sendRawMessage({ type: 'SCORE_UPDATE', score, matchId: activeMatchId });
};

export const finishMultiplayerMatch = (score: number) => {
  if (!activeMatchId) {
    return false;
  }

  const matchId = activeMatchId;
  activeMatchId = null;
  handledRemoteEndMatchId = matchId;
  return sendRawMessage({ type: 'END_GAME', score, matchId });
};

export const disconnectPeer = () => {
  disconnecting = true;
  clearActiveMatch();

  if (connection) {
    try {
      connection.close();
    } catch {
      // Ignore close failures while disconnecting intentionally.
    }
    connection = null;
  }

  if (peer) {
    peer.destroy();
    peer = null;
  }

  useMoodStore.getState().setMultiplayerState({
    connectionStatus: 'disconnected',
    peerId: null,
    isMultiplayer: false,
    multiplayerRole: null,
    opponentScore: 0,
  });
};
