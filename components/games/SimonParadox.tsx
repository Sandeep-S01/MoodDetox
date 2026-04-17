'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { useMoodStore } from '@/store/useMoodStore';
import { playIncorrect, playPop } from '@/lib/audio';
import { Circle, Square, Triangle } from 'lucide-react';

type Shape = 'circle' | 'square' | 'triangle';

const SHAPES: Shape[] = ['circle', 'square', 'triangle'];
const INITIAL_INSTRUCTION = { text: 'GET READY...', isSimon: false, targetShape: 'circle' as Shape };

export function SimonParadox() {
  const [instruction, setInstruction] = useState(INITIAL_INSTRUCTION);
  const [options, setOptions] = useState<Shape[]>([]);
  const difficulty = useMoodStore((state) => state.difficulty);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const getWaitTime = useCallback(() => {
    if (difficulty === 'easy') return 3000;
    if (difficulty === 'medium') return 2000;
    return 1500;
  }, [difficulty]);

  const scheduleTurn = useCallback(() => {
    const isSimon = Math.random() > 0.3;
    const targetShape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    const text = isSimon ? `SIMON SAYS: TAP ${targetShape.toUpperCase()}` : `TAP ${targetShape.toUpperCase()}`;

    setInstruction({ text, isSimon, targetShape });
    setOptions([...SHAPES].sort(() => Math.random() - 0.5));

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      if (!isSimon) {
        useMoodStore.setState((state) => ({ score: state.score + 1 }));
      }
      scheduleTurn();
    }, getWaitTime());
  }, [getWaitTime]);

  useEffect(() => {
    scheduleTurn();

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [scheduleTurn]);

  const handleShapeClick = (shape: Shape) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    if (instruction.isSimon && shape === instruction.targetShape) {
      playPop();
      useMoodStore.setState((state) => ({ score: state.score + 1 }));
    } else {
      playIncorrect();
      useMoodStore.setState((state) => ({ score: Math.max(0, state.score - 2) }));
    }

    scheduleTurn();
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden">
      <motion.div
        key={instruction.text}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`absolute top-0 px-8 py-4 rounded-3xl font-display font-black text-xl text-center z-20 w-full max-w-[280px] ${
          instruction.isSimon ? 'bg-primary text-primary-fg shadow-[0_0_30px_rgba(var(--color-primary-rgb),0.3)]' : 'bg-surface text-muted'
        }`}
      >
        {instruction.text}
      </motion.div>

      <div className="grid grid-cols-3 gap-6 z-10">
        {options.map((shape) => (
          <motion.button
            key={shape}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleShapeClick(shape)}
            className="w-20 h-20 bg-surface rounded-2xl flex items-center justify-center text-foreground hover:bg-surface-hover transition-colors shadow-lg"
          >
            {shape === 'circle' && <Circle className="w-10 h-10" />}
            {shape === 'square' && <Square className="w-10 h-10" />}
            {shape === 'triangle' && <Triangle className="w-10 h-10" />}
          </motion.button>
        ))}
      </div>

      <div className="absolute bottom-4 text-muted text-xs font-sans uppercase tracking-widest text-center px-10">
        Only tap if Simon says so. Otherwise, WAIT.
      </div>
    </div>
  );
}
