export type TelemetryLevel = 'error' | 'warning' | 'info';

export type TelemetryContext = Record<string, unknown>;

export type TelemetryEvent = {
  id: string;
  level: TelemetryLevel;
  message: string;
  stack?: string;
  context?: TelemetryContext;
  timestamp: string;
  userAgent?: string;
  href?: string;
};

const generateEventId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `evt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
};

const getEndpoint = (): string | undefined => {
  if (typeof process === 'undefined' || !process.env) return undefined;
  const value = process.env.NEXT_PUBLIC_TELEMETRY_ENDPOINT;
  return typeof value === 'string' && value.length > 0 ? value : undefined;
};

const buildEvent = (
  level: TelemetryLevel,
  message: string,
  options: { stack?: string; context?: TelemetryContext } = {},
): TelemetryEvent => ({
  id: generateEventId(),
  level,
  message,
  stack: options.stack,
  context: options.context,
  timestamp: new Date().toISOString(),
  userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
  href: typeof window !== 'undefined' ? window.location.href : undefined,
});

const dispatch = (event: TelemetryEvent): void => {
  const consoleFn =
    event.level === 'error' ? console.error : event.level === 'warning' ? console.warn : console.info;
  consoleFn(`[telemetry:${event.level}] ${event.message}`, event);

  const endpoint = getEndpoint();
  if (!endpoint || typeof fetch === 'undefined') return;

  try {
    void fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
      keepalive: true,
    }).catch(() => {
      // Telemetry must never throw or surface to the user.
    });
  } catch {
    // Network errors during telemetry submission are non-fatal.
  }
};

export const captureError = (error: unknown, context?: TelemetryContext): TelemetryEvent => {
  const baseMessage = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;
  const event = buildEvent('error', baseMessage, { stack, context });
  dispatch(event);
  return event;
};

export const captureMessage = (
  message: string,
  level: TelemetryLevel = 'info',
  context?: TelemetryContext,
): TelemetryEvent => {
  const event = buildEvent(level, message, { context });
  dispatch(event);
  return event;
};

let globalHandlersAttached = false;

export const attachGlobalErrorHandlers = (): void => {
  if (typeof window === 'undefined' || globalHandlersAttached) return;
  globalHandlersAttached = true;

  window.addEventListener('error', (event) => {
    captureError(event.error ?? event.message, {
      source: 'window.error',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    captureError(event.reason, { source: 'unhandledrejection' });
  });
};
