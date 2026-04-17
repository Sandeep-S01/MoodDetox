# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- Initial project setup for MoodDetox.
- Integrated Zustand for state management.
- Added `canvas-confetti` for celebration effects.
- Implemented `HomeView` with mood selection (Tired, Stressed, Bored).
- Implemented `GameView` with 30-second timer and score tracking.
- Implemented `CalmView` with 60-second timer and relaxing UI.
- Implemented `ResultView` with confetti celebration.
- Added `ReactionTap` micro-game.
- Added `ColorMatch` micro-game.
- Added `MemoryFlash` micro-game.
- Added `DirectionDash` micro-game (a cognitive reaction test for the "Bored" mood).
- Added `ParticleCanvas` for calm mode.
- Added interactive proximity effects to `ParticleCanvas` (particles scale and brighten near cursor).
- Added Web Audio API sound effects (`lib/audio.ts`) for game interactions (taps, correct/incorrect, sequence playing).
- Implemented "Time of Day" dynamic themes (Morning, Afternoon, Evening, Night).
- Added Breathing Sync to `CalmView` (subtle pulsating ring guiding a 4s inhale / 6s exhale cycle).
- Added the "Zen Streak" feature (tracks consecutive days of mood resets using `localStorage` and displays a flame icon on the home screen).
- Created `CHANGELOG.md` to track features.
