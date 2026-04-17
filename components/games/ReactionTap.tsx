'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useMoodStore } from '@/store/useMoodStore';
import { playPop } from '@/lib/audio';

export function ReactionTap() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(true);
  const [size, setSize] = useState(80);
  const difficulty = useMoodStore((state) => state.difficulty);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const respawnTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const moveTarget = () => {
    // Random position within a reasonable bound (assuming container is roughly 300x400)
    const x = (Math.random() - 0.5) * 200;
    const y = (Math.random() - 0.5) * 300;
    
    let newSize = 80;
    let timeoutMs = 0;

    if (difficulty === 'easy') {
      newSize = Math.max(80, Math.random() * 120);
    } else if (difficulty === 'medium') {
      newSize = Math.max(40, Math.random() * 100);
    } else if (difficulty === 'hard') {
      newSize = Math.max(20, Math.random() * 60);
      timeoutMs = Math.max(600, Math.random() * 1200); // Disappears quickly
    }
    
    setPosition({ x, y });
    setSize(newSize);
    setIsVisible(true);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (respawnTimeoutRef.current) clearTimeout(respawnTimeoutRef.current);

    if (timeoutMs > 0) {
      timeoutRef.current = setTimeout(() => {
        setIsVisible(false);
        respawnTimeoutRef.current = setTimeout(moveTarget, 200);
      }, timeoutMs);
    }
  };

  useEffect(() => {
    moveTarget();
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (respawnTimeoutRef.current) clearTimeout(respawnTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficulty]);

  const handleTap = () => {
    if (!isVisible) return;
    
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (respawnTimeoutRef.current) clearTimeout(respawnTimeoutRef.current);
    
    playPop();
    setIsVisible(false);
    useMoodStore.setState((state) => ({ score: state.score + 1 }));
    
    // Respawn after a short delay
    respawnTimeoutRef.current = setTimeout(() => {
      moveTarget();
    }, 200);
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <AnimatePresence>
        {isVisible && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: 1, 
              opacity: 1,
              x: position.x,
              y: position.y
            }}
            exit={{ scale: 0, opacity: 0 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleTap}
            className="absolute rounded-full bg-orange-500 shadow-[0_0_30px_rgba(249,115,22,0.4)] flex items-center justify-center"
            style={{ width: size, height: size }}
          >
            <div className="w-1/2 h-1/2 rounded-full bg-white/20" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
