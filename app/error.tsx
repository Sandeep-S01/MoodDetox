'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { useMoodStore } from '@/store/useMoodStore';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Unhandled application error:', error);
    useMoodStore.getState().addToast(error.message || 'An unexpected error occurred', 'error');
  }, [error]);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background text-foreground p-8">
      <div className="bg-surface border border-border p-8 rounded-3xl max-w-md w-full flex flex-col items-center text-center">
        <div className="w-20 h-20 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mb-6">
          <AlertTriangle className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-display font-bold mb-4">Something went wrong!</h2>
        <p className="text-muted mb-8 text-sm">
          {error.message || 'An unexpected error occurred while running the application.'}
        </p>
        <button
          onClick={() => {
            // Attempt to recover by trying to re-render the segment
            reset();
          }}
          className="w-full py-4 rounded-full bg-primary text-primary-fg font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
        >
          <RefreshCcw className="w-5 h-5" />
          Try again
        </button>
      </div>
    </div>
  );
}
