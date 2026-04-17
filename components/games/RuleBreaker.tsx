'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useMoodStore } from '@/store/useMoodStore';
import { playPop, playClick } from '@/lib/audio';

type Mode = 'TAP' | 'AVOID';

export function RuleBreaker() {
  const [mode, setMode] = useState<Mode>('TAP');
  const [target, setTarget] = useState<{ x: number; y: number; id: number } | null>(null);
  const difficulty = useMoodStore((state) => state.difficulty);
  
  const modeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const targetIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const spawnTarget = useCallback(() => {
    const x = (Math.random() - 0.5) * 240;
    const y = (Math.random() - 0.5) * 340;
    setTarget({ x, y, id: Date.now() });
  }, []);

  useEffect(() => {
    // Mode switching logic
    const switchMode = () => {
      setMode((prev) => (prev === 'TAP' ? 'AVOID' : 'TAP'));
      playClick();
      
      const nextSwitch = difficulty === 'easy' ? 5000 : difficulty === 'medium' ? 3500 : 2000;
      modeIntervalRef.current = setTimeout(switchMode, nextSwitch);
    };

    switchMode();

    // Target spawning logic
    const spawnLoop = () => {
      spawnTarget();
      const nextSpawn = difficulty === 'easy' ? 1500 : difficulty === 'medium' ? 1000 : 700;
      targetIntervalRef.current = setTimeout(spawnLoop, nextSpawn);
    };

    spawnLoop();

    return () => {
      if (modeIntervalRef.current) clearTimeout(modeIntervalRef.current);
      if (targetIntervalRef.current) clearTimeout(targetIntervalRef.current);
    };
  }, [difficulty, spawnTarget]);

  const handleTargetClick = () => {
    if (mode === 'TAP') {
      playPop();
      useMoodStore.setState((state) => ({ score: state.score + 1 }));
      setTarget(null);
    } else {
      // Tapped when should avoid
      playClick();
      useMoodStore.setState((state) => ({ score: Math.max(0, state.score - 2) }));
      setTarget(null);
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden">
      {/* Mode Indicator */}
      <motion.div
        key={mode}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`absolute top-0 px-8 py-3 rounded-full font-display font-black text-2xl tracking-tighter z-20 ${
          mode === 'TAP' 
            ? 'bg-primary text-primary-fg shadow-[0_0_40px_rgba(var(--color-primary-rgb),0.4)]' 
            : 'bg-red-500 text-white shadow-[0_0_40px_rgba(239,68,68,0.4)]'
        }`}
      >
        {mode === 'TAP' ? 'TAP TARGETS!' : 'AVOID TARGETS!'}
      </motion.div>

      {/* Background Pulse */}
      <AnimatePresence>
        {mode === 'AVOID' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-red-500 pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Target Area */}
      <div className="relative w-full h-full flex items-center justify-center">
        <AnimatePresence>
          {target && (
            <motion.button
              key={target.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: 1, 
                opacity: 1,
                x: target.x,
                y: target.y
              }}
              exit={{ scale: 0, opacity: 0 }}
              onClick={handleTargetClick}
              className={`absolute w-20 h-20 rounded-full flex items-center justify-center shadow-xl transition-colors ${
                mode === 'TAP' ? 'bg-primary' : 'bg-red-500'
              }`}
            >
              <div className="w-1/2 h-1/2 rounded-full bg-white/30 animate-ping" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 text-muted text-xs font-sans uppercase tracking-widest text-center px-10">
        The rule changes constantly. Watch the top indicator!
      </div>
    </div>
  );
}
