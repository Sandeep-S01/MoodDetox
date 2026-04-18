import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MultiplayerLobbyView } from '@/components/views/MultiplayerLobbyView';
import { useMoodStore } from '@/store/useMoodStore';
import { resetMoodStore } from '@/tests/helpers/resetMoodStore';

type ClipboardShape = { writeText: (value: string) => Promise<void> } | undefined;

const setClipboard = (clipboard: ClipboardShape) => {
  Object.defineProperty(window.navigator, 'clipboard', {
    configurable: true,
    value: clipboard,
  });
};

describe('MultiplayerLobbyView copy invite', () => {
  beforeEach(() => {
    localStorage.clear();
    resetMoodStore();
    useMoodStore.setState({
      isMultiplayer: true,
      multiplayerRole: 'host',
      peerId: 'peer-abcdef1234',
      connectionStatus: 'disconnected',
    });
  });

  it('writes the join URL to the clipboard and flips the label', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    setClipboard({ writeText });

    render(React.createElement(MultiplayerLobbyView));

    fireEvent.click(await screen.findByRole('button', { name: /Copy invite link/i }));

    const expectedUrl = `${window.location.origin}${window.location.pathname}?join=peer-abcdef1234`;
    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(expectedUrl);
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Invite copied/i })).toBeInTheDocument();
    });
  });

  it('shows a copy-failed label when the clipboard API rejects', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('blocked'));
    setClipboard({ writeText });

    render(React.createElement(MultiplayerLobbyView));

    fireEvent.click(await screen.findByRole('button', { name: /Copy invite link/i }));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Copy failed/i })).toBeInTheDocument();
    });
  });

  it('falls back to the error label when the clipboard API is unavailable', async () => {
    setClipboard(undefined);

    render(React.createElement(MultiplayerLobbyView));

    fireEvent.click(await screen.findByRole('button', { name: /Copy invite link/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Copy failed/i })).toBeInTheDocument();
    });
  });

  it('renders a grouped lobby code from the peer id', async () => {
    render(React.createElement(MultiplayerLobbyView));

    expect(await screen.findByText('PEER-ABCD')).toBeInTheDocument();
  });
});
