import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { HomeView } from '@/components/views/HomeView';
import { useMoodStore } from '@/store/useMoodStore';
import { resetMoodStore } from '@/tests/helpers/resetMoodStore';

describe('HomeView', () => {
  beforeEach(() => {
    localStorage.clear();
    resetMoodStore();
  });

  it('renders the first-run state with the dominant featured CTA', async () => {
    render(React.createElement(HomeView));

    expect(await screen.findByText('Choose your first round')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Start Breathing Field/i })).toBeInTheDocument();
    expect(screen.getByText('3 quick modes')).toBeInTheDocument();
    expect(screen.getByText('Support tools')).toBeInTheDocument();
  });

  it('renders the returning-player state from saved stats', async () => {
    localStorage.setItem('mood_reset_last_date', new Date().toDateString());
    localStorage.setItem('mood_reset_streak', '3');
    localStorage.setItem('mood_reset_total', '8');

    render(React.createElement(HomeView));

    expect(await screen.findByText('Choose your state')).toBeInTheDocument();
    expect(screen.getByText('8 sessions')).toBeInTheDocument();
    expect(screen.getByText('Between-round tools')).toBeInTheDocument();
  });

  it('starts the featured calm mode from the main play CTA', async () => {
    const user = userEvent.setup();
    render(React.createElement(HomeView));

    await user.click(await screen.findByRole('button', { name: /Start Breathing Field/i }));

    await waitFor(() => {
      expect(useMoodStore.getState()).toMatchObject({
        mood: 'stressed',
        activity: 'particles',
        view: 'calm',
      });
    });
  });
});
