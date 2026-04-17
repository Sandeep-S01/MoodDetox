'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useMoodStore } from '@/store/useMoodStore';
import { playPop, playIncorrect } from '@/lib/audio';

export function MirrorLogic() {
  const [target, setTarget] = useState<{ x: number; y: number; id: number } | null>(null);
  const [isMirrored, setIsMirrored] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const spawnTarget = useCallback(() => {
    // Range -110 to 110 for X (total 220) to keep away from edges
    const x = (Math.random() - 0.5) * 220;
    const y = (Math.random() - 0.5) * 320;
    setTarget({ x, y, id: Date.now() });
    
    // Randomly switch mirror mode
    if (Math.random() > 0.4) {
      setIsMirrored((prev) => !prev);
    }
  }, []);

  useEffect(() => {
    spawnTarget();
  }, [spawnTarget]);

  const handleContainerClick = (e: React.MouseEvent) => {
    if (!target || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left - rect.width / 2;
    const clickY = e.clientY - rect.top - rect.height / 2;

    // The target's logical position is (target.x, target.y)
    // If mirrored, the user SHOULD tap (-target.x, target.y)
    const expectedX = isMirrored ? -target.x : target.x;
    const expectedY = target.y;

    const distance = Math.sqrt(Math.pow(clickX - expectedX, 2) + Math.pow(clickY - expectedY, 2));

    if (distance < 50) { // Hit radius
      playPop();
      useMoodStore.setState((state) => ({ score: state.score + 1 }));
      spawnTarget();
    } else {
      playIncorrect();
      useMoodStore.setState((state) => ({ score: Math.max(0, state.score - 1) }));
    }
  };

  return (
    <div 
      ref={containerRef}
      onClick={handleContainerClick}
      className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden cursor-crosshair bg-background/5"
    >
      {/* Mode Indicator */}
      <motion.div
        key={isMirrored ? 'mirror' : 'normal'}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`absolute top-0 px-8 py-3 rounded-full font-display font-black text-2xl tracking-tighter z-20 ${
          isMirrored ? 'bg-purple-600 text-white shadow-[0_0_30px_rgba(147,51,234,0.4)]' : 'bg-blue-600 text-white shadow-[0_0_30px_rgba(37,99,235,0.4)]'
        }`}
      >
        {isMirrored ? 'MIRROR MODE' : 'NORMAL MODE'}
      </motion.div>

      {/* Visual Hint for Mirror */}
      {isMirrored && (
        <div className="absolute inset-y-0 left-1/2 w-px bg-white/10 z-0" />
      )}

      {/* Target */}
      <AnimatePresence mode="wait">
        {target && (
          <motion.div
            key={target.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: 1, 
              opacity: 1,
              x: target.x,
              y: target.y
            }}
            exit={{ scale: 0, opacity: 0 }}
            className={`absolute w-12 h-12 rounded-full flex items-center justify-center shadow-lg pointer-events-none ${
              isMirrored ? 'bg-purple-500' : 'bg-blue-500'
            }`}
          >
             <div className="w-4 h-4 rounded-full bg-white animate-pulse" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Instructions */}
      <div className="absolute bottom-4 text-muted text-xs font-sans uppercase tracking-widest text-center px-10">
        {isMirrored ? "Tap the OPPOSITE side of the target!" : "Tap the target directly!"}
      </div>
    </div>
  );
}
