import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { useMoodStore } from '@/store/useMoodStore';
import { playCorrect, playIncorrect } from '@/lib/audio';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

const DIRECTIONS = ['up', 'down', 'left', 'right'] as const;
type Direction = typeof DIRECTIONS[number];
const OPPOSITE_DIRECTIONS: Record<Direction, Direction> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
};

const ICONS = {
  up: ArrowUp,
  down: ArrowDown,
  left: ArrowLeft,
  right: ArrowRight,
};

export function DirectionDash() {
  const [targetDir, setTargetDir] = useState<Direction>('up');
  const [isOpposite, setIsOpposite] = useState(false);
  const difficulty = useMoodStore((state) => state.difficulty);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const generateNext = () => {
    const newDir = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
    
    let oppositeChance = 0;
    if (difficulty === 'medium') oppositeChance = 0.3;
    if (difficulty === 'hard') oppositeChance = 0.5;

    const newOpposite = Math.random() < oppositeChance;
    
    setTargetDir(newDir);
    setIsOpposite(newOpposite);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    if (difficulty === 'hard') {
      timeoutRef.current = setTimeout(() => {
        handleTap(null); // Timeout counts as wrong
      }, 1200);
    }
  };

  const handleTap = (tappedDir: Direction | null) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    if (tappedDir === null) {
      // Timeout
      playIncorrect();
      useMoodStore.setState((state) => ({ score: Math.max(0, state.score - 5) }));
    } else {
      let correctDir = targetDir;
      if (isOpposite) {
        correctDir = OPPOSITE_DIRECTIONS[targetDir];
      }

      if (tappedDir === correctDir) {
        playCorrect();
        useMoodStore.setState((state) => ({ score: state.score + 10 }));
      } else {
        playIncorrect();
        useMoodStore.setState((state) => ({ score: Math.max(0, state.score - 5) }));
      }
    }
    generateNext();
  };

  useEffect(() => {
    generateNext();
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficulty]);

  const Icon = ICONS[targetDir];

  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
      <div className="mb-8 text-muted font-mono text-sm uppercase tracking-widest text-center h-6">
        {isOpposite ? 'Tap Opposite' : 'Tap Same'}
      </div>

      <motion.div
        key={`${targetDir}-${isOpposite}`}
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className={`p-8 rounded-3xl mb-12 ${
          isOpposite 
            ? 'bg-red-500/10 text-red-500 border border-red-500/20' 
            : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
        }`}
      >
        <Icon className="w-24 h-24" strokeWidth={2.5} />
      </motion.div>

      <div className="grid grid-cols-3 gap-3 w-full max-w-[240px]">
        <div />
        <DirectionButton dir="up" onClick={() => handleTap('up')} />
        <div />
        <DirectionButton dir="left" onClick={() => handleTap('left')} />
        <div />
        <DirectionButton dir="right" onClick={() => handleTap('right')} />
        <div />
        <DirectionButton dir="down" onClick={() => handleTap('down')} />
        <div />
      </div>
    </div>
  );
}

function DirectionButton({ dir, onClick }: { dir: Direction; onClick: () => void }) {
  const Icon = ICONS[dir];
  return (
    <button
      onClick={onClick}
      className="aspect-square flex items-center justify-center rounded-2xl bg-surface border border-border hover:bg-surface-hover active:scale-95 transition-all text-foreground"
    >
      <Icon className="w-8 h-8" />
    </button>
  );
}
