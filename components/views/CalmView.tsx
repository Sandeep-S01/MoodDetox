'use client';

import { useMoodStore } from '@/store/useMoodStore';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';
import { ParticleCanvas } from '@/components/calm/ParticleCanvas';
import { playClick } from '@/lib/audio';

const CALM_DURATION = 60; // 60 seconds

export function CalmView() {
  const reset = useMoodStore((state) => state.reset);
  const endActivity = useMoodStore((state) => state.endActivity);
  const [timeLeft, setTimeLeft] = useState(CALM_DURATION);
  const hasCompletedRef = useRef(false);

  useEffect(() => {
    hasCompletedRef.current = false;
  }, []);

  useEffect(() => {
    const endTime = performance.now() + CALM_DURATION * 1000;
    let lastShown = CALM_DURATION;

    const tick = () => {
      const remainingMs = Math.max(0, endTime - performance.now());
      const remainingSec = Math.ceil(remainingMs / 1000);
      if (remainingSec !== lastShown) {
        lastShown = remainingSec;
        setTimeLeft(remainingSec);
      }
    };

    const interval = window.setInterval(tick, 250);
    const onVisibilityChange = () => {
      if (typeof document !== 'undefined' && !document.hidden) {
        tick();
      }
    };
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVisibilityChange);
    }

    return () => {
      window.clearInterval(interval);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVisibilityChange);
      }
    };
  }, []);

  useEffect(() => {
    if (timeLeft > 0 || hasCompletedRef.current) {
      return;
    }

    hasCompletedRef.current = true;
    endActivity(0, 'You are refreshed');
  }, [endActivity, timeLeft]);

  return (
    <div className="w-full h-full relative bg-background transition-colors duration-1000">
      {/* Background Canvas */}
      <ParticleCanvas />

      {/* Breathing Ring */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        <motion.div
          animate={{ 
            scale: [1, 2.5, 1], 
            opacity: [0.05, 0.2, 0.05] 
          }}
          transition={{ 
            duration: 10, 
            times: [0, 0.4, 1], // 4s expand (40%), 6s contract (60%)
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className="absolute w-32 h-32 md:w-48 md:h-48 rounded-full border border-primary"
        />
        <motion.div
          animate={{ 
            scale: [1, 2.2, 1], 
            opacity: [0.02, 0.08, 0.02] 
          }}
          transition={{ 
            duration: 10, 
            times: [0, 0.4, 1], 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className="absolute w-32 h-32 md:w-48 md:h-48 rounded-full bg-primary"
        />
      </div>

      {/* UI Overlay */}
      <div className="absolute inset-0 z-10 flex flex-col pointer-events-none">
        {/* Header */}
        <div className="flex items-center justify-between w-full p-6 pointer-events-auto">
          <button 
            onClick={() => {
              playClick();
              reset();
            }}
            className="p-2 text-muted hover:text-foreground transition-colors rounded-full hover:bg-surface"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="text-muted font-mono text-sm">
            0:{timeLeft.toString().padStart(2, '0')}
          </div>
        </div>

        {/* Center Text */}
        <div className="flex-1 flex items-center justify-center">
          <motion.div
            animate={{ opacity: [0.3, 0.8, 0.3] }}
            transition={{ duration: 10, times: [0, 0.4, 1], repeat: Infinity, ease: "easeInOut" }}
            className="text-muted font-display tracking-widest uppercase text-sm"
          >
            Breathe and interact
          </motion.div>
        </div>
      </div>
    </div>
  );
}
