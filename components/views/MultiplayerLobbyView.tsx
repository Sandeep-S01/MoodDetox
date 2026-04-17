'use client';

import { useEffect, useRef, useState } from 'react';
import { useMoodStore, type Activity, type Difficulty } from '@/store/useMoodStore';
import { beginMultiplayerMatch, disconnectPeer, initPeer, sendMultiplayerDifficulty } from '@/lib/peer';
import { playClick } from '@/lib/audio';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, CheckCircle2, Copy, Gamepad2, Loader2, Play, QrCode, Signal, Users } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Panel, ScreenHeader, SegmentedControl, ShellButton, ViewFrame } from '@/components/ui/game-shell';
import { cn } from '@/lib/utils';

type MultiplayerActivity = Extract<Activity, 'reaction' | 'color' | 'direction'>;

const MULTIPLAYER_ACTIVITIES: { id: MultiplayerActivity; name: string; hint: string }[] = [
  { id: 'reaction', name: 'Reaction Tap', hint: 'Fast target hits' },
  { id: 'color', name: 'Color Match', hint: 'Word vs color' },
  { id: 'direction', name: 'Direction Dash', hint: 'Opposite direction taps' },
];

const DIFFICULTY_OPTIONS = [
  { id: 'easy', label: 'Easy' },
  { id: 'medium', label: 'Medium' },
  { id: 'hard', label: 'Hard' },
] as const;

export function MultiplayerLobbyView() {
  const connectionStatus = useMoodStore((state) => state.connectionStatus);
  const difficulty = useMoodStore((state) => state.difficulty);
  const multiplayerRole = useMoodStore((state) => state.multiplayerRole);
  const peerId = useMoodStore((state) => state.peerId);
  const setDifficulty = useMoodStore((state) => state.setDifficulty);
  const setMultiplayerState = useMoodStore((state) => state.setMultiplayerState);
  const setView = useMoodStore((state) => state.setView);
  const startActivity = useMoodStore((state) => state.startActivity);
  const [selectedActivity, setSelectedActivity] = useState<MultiplayerActivity>('reaction');
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle');
  const copyResetTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (copyResetTimerRef.current !== null) {
        window.clearTimeout(copyResetTimerRef.current);
      }
    };
  }, []);

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

  const joinUrl = typeof window !== 'undefined' && peerId ? `${window.location.origin}${window.location.pathname}?join=${peerId}` : '';
  const rawLobbyCode = peerId ? peerId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase() : '';
  const lobbyCode = rawLobbyCode ? rawLobbyCode.match(/.{1,4}/g)?.join('-') ?? rawLobbyCode : '----';
  const copyLabel = copyState === 'copied' ? 'Invite copied' : copyState === 'error' ? 'Copy failed' : 'Copy invite link';

  const handleCopyInviteLink = async () => {
    playClick();

    if (!joinUrl || !navigator.clipboard?.writeText) {
      setCopyState('error');
    } else {
      try {
        await navigator.clipboard.writeText(joinUrl);
        setCopyState('copied');
      } catch {
        setCopyState('error');
      }
    }

    if (copyResetTimerRef.current !== null) {
      window.clearTimeout(copyResetTimerRef.current);
    }

    copyResetTimerRef.current = window.setTimeout(() => {
      setCopyState('idle');
      copyResetTimerRef.current = null;
    }, 2200);
  };

  return (
    <ViewFrame className="shell-page max-w-3xl">
      <div className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <ShellButton size="icon" variant="secondary" onClick={handleBack} aria-label="Back to home">
            <ArrowLeft className="h-4 w-4" />
          </ShellButton>

          <ScreenHeader
            className="w-full"
            eyebrow="Local multiplayer"
            title="Lobby"
            subtitle="Host or join a short side-by-side match without leaving the game shell."
            actions={
              multiplayerRole ? (
                <span
                  className={cn(
                    'rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em]',
                    multiplayerRole === 'host' ? 'bg-amber-500/12 text-amber-500' : 'bg-blue-500/12 text-blue-500',
                  )}
                >
                  {multiplayerRole}
                </span>
              ) : null
            }
          />
        </div>

        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {!peerId && multiplayerRole !== 'guest' ? (
            <Panel tone="soft" className="text-center">
              <div className="space-y-4 py-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
                <div className="space-y-2">
                  <div className="section-kicker">Preparing host code</div>
                  <h3 className="text-xl font-display font-bold">Generating your lobby</h3>
                  <p className="text-sm text-muted">This only takes a moment. Once ready, you can share the QR code instantly.</p>
                </div>
              </div>
            </Panel>
          ) : null}

          {peerId && multiplayerRole !== 'guest' ? (
            <Panel tone="raised" padding="md" className="mx-auto w-full max-w-2xl">
              <AnimatePresence mode="wait">
                {connectionStatus !== 'connected' ? (
                  <motion.div
                    key="waiting"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="space-y-5 text-center"
                  >
                    <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-green-500/12 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-green-500">
                      <CheckCircle2 className="h-4 w-4" />
                      Lobby ready
                    </div>

                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-primary/10 text-primary">
                      <QrCode className="h-7 w-7" />
                    </div>

                    <div className="space-y-2.5">
                      <div className="section-kicker">Invite friend</div>
                      <h3 className="text-xl font-display font-bold sm:text-2xl">Scan or copy the invite link</h3>
                      <p className="mx-auto max-w-md text-sm leading-6 text-muted">
                        The QR works fastest. If scanning is awkward, copy the invite link and send it directly. Keep the short lobby code handy so both players know they are joining the same room.
                      </p>
                    </div>

                    <div className="mx-auto w-fit rounded-[1.25rem] border border-border/45 bg-white p-3.5 shadow-sm">
                      {joinUrl ? <QRCodeSVG value={joinUrl} size={160} /> : <div className="h-[160px] w-[160px] animate-pulse rounded-xl bg-gray-100" />}
                    </div>

                    <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                      <div className="rounded-[1.15rem] border border-border/45 bg-background/35 px-4 py-3 text-left">
                        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">Lobby code</div>
                        <div className="mt-1 font-mono text-lg font-bold tracking-[0.18em] text-foreground">{lobbyCode}</div>
                      </div>

                      <ShellButton variant="primary" onClick={handleCopyInviteLink} className="w-full sm:w-auto">
                        <Copy className="h-4 w-4" />
                        {copyLabel}
                      </ShellButton>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="inline-flex items-center justify-center gap-2 rounded-full border border-border/45 bg-background/35 px-4 py-2 text-sm text-muted">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        Waiting for second player
                      </div>

                      <ShellButton variant="secondary" onClick={handleBack} className="w-full sm:w-auto">
                        Cancel lobby
                      </ShellButton>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="connected"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-5"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="space-y-2">
                        <div className="section-kicker">Host setup</div>
                        <h3 className="text-xl font-display font-bold">Player connected</h3>
                        <p className="text-sm text-muted">Pick the difficulty and game, then start the match.</p>
                      </div>

                      <div className="inline-flex items-center gap-2 rounded-full bg-green-500/12 px-3 py-2 text-xs font-bold uppercase tracking-[0.2em] text-green-500">
                        <CheckCircle2 className="h-4 w-4" />
                        Ready
                      </div>
                    </div>

                    <Panel tone="soft" padding="sm">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-bold">
                          <Signal className="h-4 w-4 text-primary" />
                          <span>Difficulty</span>
                        </div>
                        <SegmentedControl
                          compact
                          value={difficulty}
                          onChange={(next) => handleDifficultyChange(next as Difficulty)}
                          options={DIFFICULTY_OPTIONS.map((option) => ({ ...option }))}
                        />
                      </div>
                    </Panel>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm font-bold">
                        <Gamepad2 className="h-4 w-4 text-primary" />
                        <span>Select game</span>
                      </div>

                      <div className="grid gap-3 md:grid-cols-3">
                        {MULTIPLAYER_ACTIVITIES.map((activity) => (
                          <button
                            key={activity.id}
                            type="button"
                            onClick={() => {
                              playClick();
                              setSelectedActivity(activity.id);
                            }}
                            className={cn(
                              'rounded-[1.3rem] border p-4 text-left transition-colors',
                              selectedActivity === activity.id
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-border/45 bg-background/35 text-foreground hover:bg-surface-hover/35',
                            )}
                          >
                            <div className="space-y-2">
                              <div className="flex items-center justify-between gap-2">
                                <h4 className="font-display font-bold">{activity.name}</h4>
                                {selectedActivity === activity.id ? <CheckCircle2 className="h-4 w-4" /> : null}
                              </div>
                              <p className="text-sm text-muted">{activity.hint}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <ShellButton variant="primary" onClick={handleStartGame} className="w-full sm:w-auto">
                      <Play className="h-4 w-4" />
                      Start match
                    </ShellButton>
                  </motion.div>
                )}
              </AnimatePresence>
            </Panel>
          ) : null}

          {multiplayerRole === 'guest' ? (
            <Panel tone="raised" padding="lg">
              <AnimatePresence mode="wait">
                {connectionStatus === 'connecting' ? (
                  <motion.div key="connecting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-500/12 text-blue-500">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                    <div className="space-y-2">
                      <div className="section-kicker">Joining match</div>
                      <h3 className="text-xl font-display font-bold">Connecting to host</h3>
                      <p className="text-sm text-muted">Hold on while the multiplayer session finishes handshaking.</p>
                    </div>
                  </motion.div>
                ) : null}

                {connectionStatus === 'connected' ? (
                  <motion.div
                    key="connected"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-5 text-center"
                  >
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-green-500/12 text-green-500">
                      <Users className="h-8 w-8" />
                    </div>
                    <div className="space-y-2">
                      <div className="section-kicker">Connected</div>
                      <h3 className="text-xl font-display font-bold">You are in</h3>
                      <p className="text-sm text-muted">Wait for the host to choose the game and start the round.</p>
                    </div>

                    <div className="rounded-[1.3rem] border border-border/45 bg-background/35 px-4 py-4 text-left">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-semibold text-muted">Host difficulty</span>
                        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-primary">{difficulty}</span>
                      </div>
                    </div>
                  </motion.div>
                ) : null}

                {connectionStatus === 'disconnected' ? (
                  <motion.div key="disconnected" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-red-500/12 text-red-500">
                      <Users className="h-8 w-8 opacity-75" />
                    </div>
                    <div className="space-y-2">
                      <div className="section-kicker">Connection failed</div>
                      <h3 className="text-xl font-display font-bold">Could not join the lobby</h3>
                      <p className="text-sm text-muted">The host may have left or the join code may no longer be valid.</p>
                    </div>

                    <ShellButton variant="primary" onClick={handleBack}>
                      Back to home
                    </ShellButton>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </Panel>
          ) : null}
        </motion.div>
      </div>
    </ViewFrame>
  );
}
