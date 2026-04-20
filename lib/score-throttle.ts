export type ScoreThrottleOptions = {
  intervalMs: number;
  send: (score: number) => void;
};

export type ScoreThrottle = {
  invoke: (score: number) => void;
  cancel: () => void;
};

export function createScoreThrottle({ intervalMs, send }: ScoreThrottleOptions): ScoreThrottle {
  let lastSendAt = Number.NEGATIVE_INFINITY;
  let pendingScore: number | null = null;
  let pendingTimer: ReturnType<typeof setTimeout> | null = null;

  const clearPendingTimer = () => {
    if (pendingTimer !== null) {
      clearTimeout(pendingTimer);
      pendingTimer = null;
    }
  };

  const flush = () => {
    pendingTimer = null;
    if (pendingScore === null) {
      return;
    }
    const value = pendingScore;
    pendingScore = null;
    lastSendAt = Date.now();
    send(value);
  };

  return {
    invoke(score) {
      const now = Date.now();
      const elapsed = now - lastSendAt;

      if (elapsed >= intervalMs) {
        clearPendingTimer();
        pendingScore = null;
        lastSendAt = now;
        send(score);
        return;
      }

      pendingScore = score;
      if (pendingTimer === null) {
        pendingTimer = setTimeout(flush, intervalMs - elapsed);
      }
    },
    cancel() {
      clearPendingTimer();
      pendingScore = null;
    },
  };
}
