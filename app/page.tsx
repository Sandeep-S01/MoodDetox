'use client';

import { useEffect, useState } from 'react';
import { useMoodStore } from '@/store/useMoodStore';
import { HomeView } from '@/components/views/HomeView';
import { GameView } from '@/components/views/GameView';
import { CalmView } from '@/components/views/CalmView';
import { ResultView } from '@/components/views/ResultView';
import { ChallengePromptView } from '@/components/views/ChallengePromptView';
import { MultiplayerLobbyView } from '@/components/views/MultiplayerLobbyView';
import { SettingsView } from '@/components/views/SettingsView';
import { AnimatePresence, motion } from 'motion/react';
import { joinGame } from '@/lib/peer';
import { resolveSessionEntry } from '@/lib/session-entry';

export default function Page() {
  const view = useMoodStore((state) => state.view);
  const setChallenge = useMoodStore((state) => state.setChallenge);
  const setView = useMoodStore((state) => state.setView);
  const setMultiplayerState = useMoodStore((state) => state.setMultiplayerState);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);

    // Parse URL parameters for challenges and multiplayer joins
    if (typeof window !== 'undefined') {
      const entryIntent = resolveSessionEntry(window.location.search);

      if (entryIntent.type === 'join') {
        setMultiplayerState({ isMultiplayer: true });
        setView('multiplayer_lobby');
        joinGame(entryIntent.joinId);
        window.history.replaceState({}, '', window.location.pathname);
      } else if (entryIntent.type === 'challenge') {
        setChallenge(entryIntent.challenge);
        setView('challenge_prompt');
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, [setChallenge, setView, setMultiplayerState]);

  const fadeUpInitial = hasMounted ? { opacity: 0, y: 20 } : false;
  const scaleInitial = hasMounted ? { opacity: 0, scale: 0.95 } : false;
  const fadeInitial = hasMounted ? { opacity: 0 } : false;
  const slideInitial = hasMounted ? { opacity: 0, x: 20 } : false;

  return (
    <main className="relative min-h-screen w-full flex flex-col items-center justify-center bg-background text-foreground">
      <AnimatePresence mode="wait" initial={false}>
        {view === 'home' && (
          <motion.div
            key="home"
            initial={fadeUpInitial}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="w-full h-full absolute inset-0 overflow-y-auto overflow-x-hidden"
          >
            <HomeView />
          </motion.div>
        )}

        {view === 'multiplayer_lobby' && (
          <motion.div
            key="multiplayer_lobby"
            initial={scaleInitial}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="w-full h-full absolute inset-0 overflow-y-auto overflow-x-hidden flex items-start justify-center"
          >
            <MultiplayerLobbyView />
          </motion.div>
        )}

        {view === 'challenge_prompt' && (
          <motion.div
            key="challenge_prompt"
            initial={scaleInitial}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="w-full h-full absolute inset-0 overflow-y-auto overflow-x-hidden flex items-start justify-center"
          >
            <ChallengePromptView />
          </motion.div>
        )}
        
        {view === 'game' && (
          <motion.div
            key="game"
            initial={scaleInitial}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="w-full h-full absolute inset-0 overflow-hidden flex items-center justify-center"
          >
            <GameView />
          </motion.div>
        )}

        {view === 'calm' && (
          <motion.div
            key="calm"
            initial={fadeInitial}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="w-full h-full flex items-center justify-center absolute inset-0"
          >
            <CalmView />
          </motion.div>
        )}

        {view === 'result' && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="w-full h-full absolute inset-0 overflow-y-auto overflow-x-hidden flex items-start justify-center"
          >
            <ResultView />
          </motion.div>
        )}
        {view === 'settings' && (
          <motion.div
            key="settings"
            initial={slideInitial}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="w-full h-full absolute inset-0 overflow-y-auto overflow-x-hidden flex items-start justify-center"
          >
            <SettingsView />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
