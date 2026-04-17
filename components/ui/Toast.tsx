'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useMoodStore, type ToastMessage } from '@/store/useMoodStore';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

export function ToastContainer() {
  const toasts = useMoodStore((state) => state.toasts);
  const removeToast = useMoodStore((state) => state.removeToast);

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({ toast, onRemove }: { toast: ToastMessage; onRemove: () => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onRemove]);

  const icons = {
    error: <AlertCircle className="w-5 h-5 text-red-500" />,
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />
  };

  const bgs = {
    error: 'bg-red-500/10 border-red-500/20',
    success: 'bg-green-500/10 border-green-500/20',
    info: 'bg-blue-500/10 border-blue-500/20'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-md shadow-lg ${bgs[toast.type as keyof typeof bgs]}`}
    >
      {icons[toast.type as keyof typeof icons]}
      <p className="text-sm font-medium text-foreground">{toast.message}</p>
      <button 
        onClick={onRemove}
        className="ml-2 p-1 rounded-full hover:bg-surface-hover transition-colors text-muted hover:text-foreground"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

