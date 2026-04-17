import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import Page from '@/app/page';
import { resetMoodStore } from '@/tests/helpers/resetMoodStore';

describe('Page smoke test', () => {
  beforeEach(() => {
    localStorage.clear();
    resetMoodStore();
  });

  it('initializes the app shell without crashing', async () => {
    expect(() => render(React.createElement(Page))).not.toThrow();
    expect(await screen.findByText('Choose your first round')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Start Breathing Field/i })).toBeInTheDocument();
  }, 10000);
});
