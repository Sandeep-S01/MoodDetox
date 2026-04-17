'use client';

import { useEffect, useState } from 'react';
import { useMoodStore, type Activity, type Difficulty } from '@/store/useMoodStore';
import { beginMultiplayerMatch, disconnectPeer, initPeer, sendMultiplayerDifficulty } from '@/lib/peer';
import { playClick } from '@/lib/audio';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, CheckCircle2, Crown, Gamepad2, Loader2, Play, QrCode, Signal, User, Users } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useIsMobile } from '@/hooks/use-mobile';

type MultiplayerActivity = Extract<Activity, 'reaction' | 'color' | 'direction'>;

const MULTIPLAYER_ACTIVITIES: { id: MultiplayerActivity; name: string }[] = [
  { id: 'reaction', name: 'Reaction Tap' },
  { id: 'color', name: 'Color Match' },
  { id: 'direction', name: 'Direction Dash' },
];

export function MultiplayerLobbyView() {
  const { connectionStatus, difficulty, multiplayerRole, peerId, setDifficulty, setMultiplayerState, setView, startActivity } = useMoodStore();
  const [selectedActivity, setSelectedActivity] = useState<MultiplayerActivity>('reaction');
  const isMobile = useIsMobile();

  useEffect(() => {
    initPeer();
    setMultiplayerState({ isMultiplayer: true });

    return () => {
      const currentView = useMoodStore.getState().view;
      if (currentView !== 'game' && currentView !== 'multiplayer_lobby') {
        disconnectPeer();
      }
    };
  }, [setMultiplayerState]);

  const handleStartGame = () => {
    playClick();
    if (connectionStatus === 'connected' && multiplayerRole === 'host') {
      const started = beginMultiplayerMatch(selectedActivity, difficulty);
      if (started) {
        startActivity(selectedActivity);
      }
    }
  };

  const handleDifficultyChange = (nextDifficulty: Difficulty) => {
    playClick();
    setDifficulty(nextDifficulty);
    if (multiplayerRole === 'host') {
      sendMultiplayerDifficulty(nextDifficulty);
    }
  };

  const handleBack = () => {
    playClick();
    disconnectPeer();
    setView('home');
  };

  const joinUrl = typeof window !== 'undefined' && peerId
    ? `${window.location.origin}${window.location.pathname}?join=${peerId}`
    : '';

  return (
    <div className={`flex flex-col items-center justify-start w-full h-full ${isMobile ? 'max-w-md' : 'max-w-2xl'} px-6 pt-12 pb-6 relative`}>
      <div className="flex items-center justify-between w-full mb-8">
        <button
          onClick={handleBack}
          className="p-2 text-muted hover:text-foreground transition-colors rounded-full hover:bg-surface"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex flex-col items-center">
          <h2 className="text-xl font-display font-bold">Local Multiplayer</h2>
          {multiplayerRole && (
            <div className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full mt-1 ${multiplayerRole === 'host' ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500'}`}>
              {multiplayerRole === 'host' ? <Crown className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
              {multiplayerRole}
            </div>
          )}
        </div>
        <div className="w-10" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full flex flex-col items-center"
      >
        {!peerId && multiplayerRole !== 'guest' && (
          <div className="flex flex-col items-center w-full mt-12">
            <div className="w-20 h-20 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-6">
              <Loader2 className="w-10 h-10 animate-spin" />
            </div>
            <p className="text-muted text-center font-medium">Generating your local game code...</p>
          </div>
        )}

        {peerId && multiplayerRole !== 'guest' && (
          <div className="glass-surface glass-border p-8 rounded-3xl w-full flex flex-col items-center mb-8 shadow-xl">
            <AnimatePresence mode="wait">
              {connectionStatus !== 'connected' ? (
                <motion.div
                  key="waiting"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex flex-col items-center w-full"
                >
                  <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
                    <QrCode className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-display font-bold mb-2">Invite Friend</h3>
                  <p className="text-sm text-muted text-center mb-6">Have your friend scan this QR code with their camera to join instantly.</p>

                  <div className="bg-white p-4 rounded-2xl mb-8 shadow-sm border border-gray-100">
                    {joinUrl ? (
                      <QRCodeSVG value={joinUrl} size={180} />
                    ) : (
                      <div className="w-[180px] h-[180px] bg-gray-100 animate-pulse rounded-xl" />
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-muted bg-background px-4 py-2.5 rounded-full border border-border">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-sm font-medium">Waiting for player to scan...</span>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="connected"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-full flex flex-col items-center"
                >
                  <div className="w-16 h-16 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center mb-4 ring-4 ring-green-500/20">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-display font-bold mb-1">Player Joined!</h3>
                  <p className="text-sm text-muted mb-8">You are the host. Choose a game to begin.</p>

                  <div className="w-full mb-8 space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-sm font-bold text-foreground flex items-center gap-2">
                          <Signal className="w-4 h-4 text-primary" />
                          Difficulty
                        </label>
                      </div>
                      <div className="flex items-center gap-2 bg-background p-1.5 rounded-2xl border border-border">
                        {(['easy', 'medium', 'hard'] as const).map((option) => (
                          <button
                            key={option}
                            onClick={() => handleDifficultyChange(option)}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-bold capitalize transition-all ${difficulty === option ? 'bg-primary text-primary-fg shadow-sm' : 'text-muted hover:text-foreground hover:bg-surface'}`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-bold text-foreground flex items-center gap-2 mb-3">
                        <Gamepad2 className="w-4 h-4 text-primary" />
                        Select Game
                      </label>
                      <div className="grid grid-cols-1 gap-2">
                        {MULTIPLAYER_ACTIVITIES.map((activity) => (
                          <button
                            key={activity.id}
                            onClick={() => {
                              playClick();
                              setSelectedActivity(activity.id);
                            }}
                            className={`p-4 rounded-2xl text-left font-bold transition-all flex items-center justify-between ${selectedActivity === activity.id ? 'bg-primary/10 text-primary border-2 border-primary' : 'bg-background text-foreground border-2 border-transparent hover:border-border'}`}
                          >
                            {activity.name}
                            {selectedActivity === activity.id && <CheckCircle2 className="w-5 h-5" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleStartGame}
                    className="w-full py-4 rounded-full bg-primary text-primary-fg font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-lg shadow-primary/25"
                  >
                    <Play className="w-5 h-5 fill-current" />
                    Start Match
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {multiplayerRole === 'guest' && (
          <div className="glass-surface glass-border p-8 rounded-3xl w-full flex flex-col items-center shadow-xl mt-4">
            <AnimatePresence mode="wait">
              {connectionStatus === 'connecting' && (
                <motion.div key="connecting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center">
                  <div className="w-20 h-20 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center mb-6">
                    <Loader2 className="w-10 h-10 animate-spin" />
                  </div>
                  <h3 className="text-xl font-display font-bold mb-2">Connecting...</h3>
                  <p className="text-muted text-center text-sm">Joining your friend&apos;s game session</p>
                </motion.div>
              )}

              {connectionStatus === 'connected' && (
                <motion.div key="connected" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center w-full">
                  <div className="w-20 h-20 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center mb-6 ring-4 ring-green-500/20">
                    <Users className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-display font-bold mb-2 text-center">You&apos;re In!</h3>
                  <p className="text-muted text-center mb-8">Waiting for the host to start the match...</p>

                  <div className="w-full bg-background rounded-2xl p-4 border border-border mb-8">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-muted">Host Difficulty</span>
                      <span className="text-sm font-bold capitalize text-primary bg-primary/10 px-2 py-0.5 rounded-md">{difficulty}</span>
                    </div>
                    <p className="text-xs text-muted">The host controls the game settings.</p>
                  </div>

                  <div className="flex items-center gap-3 text-primary bg-primary/5 px-6 py-3 rounded-full border border-primary/20">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="font-bold">Ready to play</span>
                  </div>
                </motion.div>
              )}

              {connectionStatus === 'disconnected' && (
                <motion.div key="disconnected" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center">
                  <div className="w-20 h-20 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mb-6">
                    <Users className="w-10 h-10 opacity-50" />
                  </div>
                  <h3 className="text-xl font-display font-bold mb-2">Connection Failed</h3>
                  <p className="text-muted text-center text-sm mb-8">Could not connect to the host. They may have left or the code is invalid.</p>
                  <button
                    onClick={handleBack}
                    className="w-full py-4 bg-primary text-primary-fg rounded-full font-bold hover:opacity-90 transition-opacity"
                  >
                    Back to Home
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </div>
  );
}
