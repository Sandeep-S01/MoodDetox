import { describe, expect, it } from 'vitest';
import { resolveSessionEntry } from '@/lib/session-entry';

describe('resolveSessionEntry', () => {
  it('prefers a join link when both join and challenge params are present', () => {
    expect(resolveSessionEntry('?join=peer-123&activity=reaction&score=20')).toEqual({
      type: 'join',
      joinId: 'peer-123',
    });
  });

  it('parses a valid challenge entry', () => {
    expect(resolveSessionEntry('?activity=direction&score=17')).toEqual({
      type: 'challenge',
      challenge: {
        activity: 'direction',
        targetScore: 17,
      },
    });
  });

  it('ignores invalid or incomplete session entry params', () => {
    expect(resolveSessionEntry('?activity=unknown&score=9')).toEqual({ type: 'none' });
    expect(resolveSessionEntry('?activity=reaction&score=0')).toEqual({ type: 'none' });
    expect(resolveSessionEntry('?score=10')).toEqual({ type: 'none' });
  });
});
