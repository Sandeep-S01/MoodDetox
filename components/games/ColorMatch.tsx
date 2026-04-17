'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useMoodStore } from '@/store/useMoodStore';
import { playCorrect, playIncorrect } from '@/lib/audio';

const ALL_COLORS = [
  { name: 'RED', hex: '#ef4444' },
  { name: 'BLUE', hex: '#3b82f6' },
  { name: 'GREEN', hex: '#22c55e' },
  { name: 'YELLOW', hex: '#eab308' },
  { name: 'PURPLE', hex: '#a855f7' },
  { name: 'ORANGE', hex: '#f97316' },
  { name: 'PINK', hex: '#ec4899' },
];

const ACTIVE_COLORS_BY_DIFFICULTY = {
  easy: ALL_COLORS.slice(0, 3),
  medium: ALL_COLORS.slice(0, 5),
  hard: ALL_COLORS,
} as const;

export function ColorMatch() {
  const [wordIndex, setWordIndex] = useState(0);
  const [colorIndex, setColorIndex] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const difficulty = useMoodStore((state) => state.difficulty);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const nextRoundTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const activeColors = ACTIVE_COLORS_BY_DIFFICULTY[difficulty];

  const [randomRotation, setRandomRotation] = useState(0);

  const generateNext = () => {
    const isMatch = Math.random() > 0.5;
    const newWordIndex = Math.floor(Math.random() * activeColors.length);
    
    let newColorIndex = newWordIndex;
    if (!isMatch) {
      do {
        newColorIndex = Math.floor(Math.random() * activeColors.length);
      } while (newColorIndex === newWordIndex);
    }
    
    setWordIndex(newWordIndex);
    setColorIndex(newColorIndex);
    setFeedback(null);
    setRandomRotation(difficulty === 'hard' ? (Math.random() - 0.5) * 20 : 0);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (nextRoundTimeoutRef.current) clearTimeout(nextRoundTimeoutRef.current);

    if (difficulty === 'hard') {
      timeoutRef.current = setTimeout(() => {
        handleAnswer(null); // Timeout counts as wrong
      }, 1500);
    }
  };

  const handleAnswer = (userSaysMatch: boolean | null) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    if (userSaysMatch === null) {
      // Timeout
      playIncorrect();
      useMoodStore.setState((state) => ({ score: Math.max(0, state.score - 5) }));
      setFeedback('wrong');
    } else {
      const isActuallyMatch = wordIndex === colorIndex;
      const isCorrect = userSaysMatch === isActuallyMatch;

      if (isCorrect) {
        playCorrect();
        useMoodStore.setState((state) => ({ score: state.score + 10 }));
        setFeedback('correct');
      } else {
        playIncorrect();
        useMoodStore.setState((state) => ({ score: Math.max(0, state.score - 5) }));
        setFeedback('wrong');
      }
    }

    nextRoundTimeoutRef.current = setTimeout(() => {
      generateNext();
    }, 400);
  };

  useEffect(() => {
    generateNext();
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (nextRoundTimeoutRef.current) clearTimeout(nextRoundTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficulty]);

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <div className="h-40 flex items-center justify-center relative w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${wordIndex}-${colorIndex}`}
            initial={{ scale: 0.8, opacity: 0, rotate: randomRotation }}
            animate={{ scale: 1, opacity: 1, rotate: randomRotation }}
            exit={{ scale: 1.2, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="text-5xl font-display font-bold tracking-widest"
            style={{ color: activeColors[colorIndex]?.hex }}
          >
            {activeColors[wordIndex]?.name}
          </motion.div>
        </AnimatePresence>

        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`absolute -bottom-8 text-sm font-medium ${
                feedback === 'correct' ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {feedback === 'correct' ? '+10' : '-5'}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex gap-4 mt-12 w-full max-w-xs">
        <button
          onClick={() => handleAnswer(false)}
          className="flex-1 py-4 rounded-2xl bg-surface border border-border hover:bg-surface-hover active:scale-95 transition-all text-foreground font-medium"
        >
          No Match
        </button>
        <button
          onClick={() => handleAnswer(true)}
          className="flex-1 py-4 rounded-2xl bg-purple-500/20 border border-purple-500/30 hover:bg-purple-500/30 active:scale-95 transition-all text-purple-400 font-medium"
        >
          Match
        </button>
      </div>
    </div>
  );
}
