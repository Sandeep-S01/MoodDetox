'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import { useMoodStore } from '@/store/useMoodStore';
import { playGridTone, playCorrect, playIncorrect } from '@/lib/audio';

const GRID_SIZE = 9;

export function MemoryFlash() {
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerSequence, setPlayerSequence] = useState<number[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [level, setLevel] = useState(1);
  const difficulty = useMoodStore((state) => state.difficulty);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const startSequence = useCallback(async (newSequence: number[]) => {
    if (!isMounted.current) return;
    setIsPlaying(true);
    setPlayerSequence([]);
    
    // Wait a bit before starting
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (!isMounted.current) return;

    let flashDuration = 400;
    let gapDuration = 200;

    if (difficulty === 'easy') {
      flashDuration = 500;
      gapDuration = 300;
    } else if (difficulty === 'medium') {
      flashDuration = 300;
      gapDuration = 150;
    } else if (difficulty === 'hard') {
      flashDuration = 200;
      gapDuration = 100;
    }

    for (let i = 0; i < newSequence.length; i++) {
      if (!isMounted.current) return;
      setActiveIndex(newSequence[i]);
      playGridTone(newSequence[i]);
      await new Promise(resolve => setTimeout(resolve, flashDuration));
      if (!isMounted.current) return;
      setActiveIndex(null);
      await new Promise(resolve => setTimeout(resolve, gapDuration));
    }
    
    if (isMounted.current) {
      setIsPlaying(false);
    }
  }, [difficulty]);

  const nextLevel = () => {
    const newIndex = Math.floor(Math.random() * GRID_SIZE);
    const newSequence = [...sequence, newIndex];
    setSequence(newSequence);
    setLevel(level + 1);
    startSequence(newSequence);
  };

  useEffect(() => {
    // Start first level based on difficulty
    let initialLength = 2;
    if (difficulty === 'medium') initialLength = 3;
    if (difficulty === 'hard') initialLength = 4;

    const initialSequence = Array.from({ length: initialLength }).map(() => Math.floor(Math.random() * GRID_SIZE));
    setSequence(initialSequence);
    startSequence(initialSequence);
  }, [difficulty, startSequence]);

  const handleTap = (index: number) => {
    if (isPlaying) return;

    const newPlayerSequence = [...playerSequence, index];
    setPlayerSequence(newPlayerSequence);

    // Check if correct so far
    const isCorrect = newPlayerSequence.every((val, i) => val === sequence[i]);

    if (!isCorrect) {
      // Wrong
      playIncorrect();
      useMoodStore.setState((state) => ({ score: Math.max(0, state.score - 5) }));
      // Restart current level
      startSequence(sequence);
      return;
    }

    // Correct tap
    playGridTone(index);
    setActiveIndex(index);
    setTimeout(() => {
      if (isMounted.current) setActiveIndex(null);
    }, 200);

    if (newPlayerSequence.length === sequence.length) {
      // Completed level
      useMoodStore.setState((state) => ({ score: state.score + 20 }));
      setTimeout(() => {
        if (isMounted.current) playCorrect();
      }, 300);
      setTimeout(() => {
        if (isMounted.current) nextLevel();
      }, 800);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <div className="mb-8 text-muted font-mono text-sm uppercase tracking-widest">
        {isPlaying ? 'Watch' : 'Repeat'}
      </div>

      <div className="grid grid-cols-3 gap-3 w-full max-w-[240px]">
        {Array.from({ length: GRID_SIZE }).map((_, i) => (
          <motion.button
            key={i}
            whileTap={!isPlaying ? { scale: 0.9 } : {}}
            onClick={() => handleTap(i)}
            className={`aspect-square rounded-2xl transition-colors duration-200 ${
              activeIndex === i 
                ? 'bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.5)]' 
                : 'bg-surface border border-border hover:bg-surface-hover'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
