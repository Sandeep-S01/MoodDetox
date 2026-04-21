import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { captureError, captureMessage } from '@/lib/telemetry';

describe('telemetry', () => {
  const originalEndpoint = process.env.NEXT_PUBLIC_TELEMETRY_ENDPOINT;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue({ ok: true });
    Object.defineProperty(globalThis, 'fetch', { configurable: true, value: fetchMock });
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.env.NEXT_PUBLIC_TELEMETRY_ENDPOINT = originalEndpoint;
  });

  it('captures Error instances and returns a structured event', () => {
    delete process.env.NEXT_PUBLIC_TELEMETRY_ENDPOINT;

    const event = captureError(new Error('boom'), { source: 'unit-test' });

    expect(event.level).toBe('error');
    expect(event.message).toBe('boom');
    expect(event.id).toMatch(/^[a-z0-9-]+$/i);
    expect(event.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(event.context).toEqual({ source: 'unit-test' });
    expect(event.stack).toBeDefined();
  });

  it('coerces non-Error values to a string message', () => {
    delete process.env.NEXT_PUBLIC_TELEMETRY_ENDPOINT;

    const event = captureError('plain string failure');

    expect(event.message).toBe('plain string failure');
    expect(event.stack).toBeUndefined();
  });

  it('skips the network call when no endpoint is configured', () => {
    delete process.env.NEXT_PUBLIC_TELEMETRY_ENDPOINT;

    captureError(new Error('local-only'));

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('POSTs the event to the configured endpoint with keepalive', () => {
    process.env.NEXT_PUBLIC_TELEMETRY_ENDPOINT = 'https://telemetry.example.test/ingest';

    const event = captureError(new Error('shipped'));

    expect(fetchMock).toHaveBeenCalledWith(
      'https://telemetry.example.test/ingest',
      expect.objectContaining({
        method: 'POST',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const call = fetchMock.mock.calls[0];
    const body = JSON.parse((call[1] as { body: string }).body);
    expect(body.id).toBe(event.id);
    expect(body.message).toBe('shipped');
  });

  it('never throws when fetch rejects', async () => {
    process.env.NEXT_PUBLIC_TELEMETRY_ENDPOINT = 'https://telemetry.example.test/ingest';
    fetchMock.mockRejectedValueOnce(new Error('offline'));

    expect(() => captureError(new Error('still safe'))).not.toThrow();
    await Promise.resolve();
  });

  it('captureMessage records info-level events by default', () => {
    delete process.env.NEXT_PUBLIC_TELEMETRY_ENDPOINT;

    const event = captureMessage('round started');

    expect(event.level).toBe('info');
    expect(event.message).toBe('round started');
  });

  it('captureMessage honours an explicit level', () => {
    delete process.env.NEXT_PUBLIC_TELEMETRY_ENDPOINT;

    const event = captureMessage('throttled write', 'warning', { tag: 'audio' });

    expect(event.level).toBe('warning');
    expect(event.context).toEqual({ tag: 'audio' });
  });
});
