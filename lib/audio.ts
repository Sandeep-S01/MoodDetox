'use client';

import { useMoodStore } from '@/store/useMoodStore';

let audioCtx: AudioContext | null = null;

export const getAudioContext = () => {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (!audioCtx) return null;

  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

export const playTone = (frequency: number, type: OscillatorType = 'sine', duration: number = 0.1, vol: number = 0.1) => {
  try {
    const { soundEnabled, volume } = useMoodStore.getState();
    if (!soundEnabled) return;

    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);

    const actualVol = vol * volume;

    gainNode.gain.setValueAtTime(actualVol, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    // Ignore audio errors (e.g. if user hasn't interacted yet)
    console.warn('Audio playback failed:', e);
  }
};

// --- UI Interaction Sounds ---
export const playClick = () => playTone(800, 'sine', 0.05, 0.02);

export const playTabSelect = () => {
  playTone(400, 'triangle', 0.08, 0.03);
  setTimeout(() => playTone(600, 'triangle', 0.1, 0.02), 50);
};

export const playPop = () => playTone(600, 'sine', 0.1, 0.1);

export const playCorrect = () => {
  playTone(523.25, 'sine', 0.1, 0.1); // C5
  setTimeout(() => playTone(659.25, 'sine', 0.2, 0.1), 100); // E5
};

export const playIncorrect = () => {
  playTone(250, 'triangle', 0.15, 0.1);
  setTimeout(() => playTone(200, 'triangle', 0.25, 0.1), 150);
};

// C4, D4, E4, G4, A4, C5, D5, E5, G5
const PENTATONIC_SCALE = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99];

export const playGridTone = (index: number) => {
  const freq = PENTATONIC_SCALE[index % PENTATONIC_SCALE.length];
  playTone(freq, 'sine', 0.3, 0.1);
};

// --- Continuous Ambient Audio Generators ---

let ambientOsc1: OscillatorNode | null = null;
let ambientOsc2: OscillatorNode | null = null;
let ambientGain: GainNode | null = null;

export const toggleAmbientDrift = (play: boolean) => {
  const ctx = getAudioContext();
  if (!ctx) return;

  const { soundEnabled, volume } = useMoodStore.getState();

  if (play && soundEnabled) {
    if (ambientGain) return; // Already playing
    
    ambientOsc1 = ctx.createOscillator();
    ambientOsc2 = ctx.createOscillator();
    ambientGain = ctx.createGain();

    ambientOsc1.type = 'sine';
    ambientOsc2.type = 'sine';
    
    // Binaural beat effect (110Hz and 114Hz)
    ambientOsc1.frequency.value = 110;
    ambientOsc2.frequency.value = 114;

    ambientGain.gain.value = 0;
    ambientGain.gain.setTargetAtTime(0.05 * volume, ctx.currentTime, 2); // Fade in

    ambientOsc1.connect(ambientGain);
    ambientOsc2.connect(ambientGain);
    ambientGain.connect(ctx.destination);

    ambientOsc1.start();
    ambientOsc2.start();
  } else {
    if (ambientGain && ambientOsc1 && ambientOsc2) {
      ambientGain.gain.setTargetAtTime(0, ctx.currentTime, 1); // Fade out
      setTimeout(() => {
        ambientOsc1?.stop();
        ambientOsc2?.stop();
        ambientOsc1?.disconnect();
        ambientOsc2?.disconnect();
        ambientGain?.disconnect();
        ambientOsc1 = null;
        ambientOsc2 = null;
        ambientGain = null;
      }, 1500);
    }
  }
};

let natureBufferSource: AudioBufferSourceNode | null = null;
let natureGain: GainNode | null = null;
let natureFilter: BiquadFilterNode | null = null;
let natureNoiseBuffer: AudioBuffer | null = null;
let natureNoiseSampleRate = 0;

export const toggleNatureFocus = (play: boolean) => {
  const ctx = getAudioContext();
  if (!ctx) return;

  const { soundEnabled, volume } = useMoodStore.getState();

  if (play && soundEnabled) {
    if (natureGain) return; // Already playing

    if (!natureNoiseBuffer || natureNoiseSampleRate !== ctx.sampleRate) {
      const bufferSize = ctx.sampleRate * 2;
      natureNoiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      natureNoiseSampleRate = ctx.sampleRate;

      const output = natureNoiseBuffer.getChannelData(0);
      let lastOut = 0;

      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5;
      }
    }

    natureBufferSource = ctx.createBufferSource();
    natureBufferSource.buffer = natureNoiseBuffer;
    natureBufferSource.loop = true;

    // Apply a lowpass filter to make it sound like wind/ocean
    natureFilter = ctx.createBiquadFilter();
    natureFilter.type = 'lowpass';
    natureFilter.frequency.value = 400;

    natureGain = ctx.createGain();
    natureGain.gain.value = 0;
    natureGain.gain.setTargetAtTime(0.1 * volume, ctx.currentTime, 2); // Fade in

    natureBufferSource.connect(natureFilter);
    natureFilter.connect(natureGain);
    natureGain.connect(ctx.destination);

    natureBufferSource.start();
  } else {
    if (natureGain && natureBufferSource) {
      natureGain.gain.setTargetAtTime(0, ctx.currentTime, 1); // Fade out
      setTimeout(() => {
        natureBufferSource?.stop();
        natureBufferSource?.disconnect();
        natureFilter?.disconnect();
        natureGain?.disconnect();
        natureBufferSource = null;
        natureFilter = null;
        natureGain = null;
      }, 1500);
    }
  }
};

export const setAmbientParameters = (mood: string | null, difficulty: string) => {
  const ctx = getAudioContext();
  if (!ctx) return;

  // Adjust binaural beat frequencies based on mood
  if (ambientOsc1 && ambientOsc2) {
    let baseFreq = 110;
    let beatFreq = 4; // Theta waves for relaxation
    
    if (mood === 'anxious' || mood === 'overwhelmed') {
      baseFreq = 85; // Lower, more grounding
      beatFreq = 2; // Delta waves for deep relaxation
    } else if (mood === 'bored' || mood === 'scattered') {
      baseFreq = 130; // Slightly higher, more energizing
      beatFreq = 10; // Alpha waves for focus
    }

    // Adjust based on difficulty (more intense = slightly higher beat freq)
    if (difficulty === 'medium') beatFreq += 2;
    if (difficulty === 'hard') beatFreq += 4;

    ambientOsc1.frequency.setTargetAtTime(baseFreq, ctx.currentTime, 1);
    ambientOsc2.frequency.setTargetAtTime(baseFreq + beatFreq, ctx.currentTime, 1);
  }

  // Adjust nature noise filter based on difficulty and mood
  if (natureFilter) {
    let filterFreq = 400;
    if (difficulty === 'medium') filterFreq = 600;
    if (difficulty === 'hard') filterFreq = 800;
    
    if (mood === 'anxious') filterFreq = Math.max(200, filterFreq - 100);
    if (mood === 'bored') filterFreq += 200;

    natureFilter.frequency.setTargetAtTime(filterFreq, ctx.currentTime, 1);
  }
};

export const updateAmbientVolume = () => {
  const ctx = getAudioContext();
  if (!ctx) return;

  const { soundEnabled, volume } = useMoodStore.getState();
  const targetVolume = soundEnabled ? volume : 0;

  if (ambientGain) {
    ambientGain.gain.setTargetAtTime(0.05 * targetVolume, ctx.currentTime, 0.5);
  }
  if (natureGain) {
    natureGain.gain.setTargetAtTime(0.1 * targetVolume, ctx.currentTime, 0.5);
  }
};

if (typeof window !== 'undefined') {
  useMoodStore.subscribe((state, prevState) => {
    if (state.volume !== prevState.volume || state.soundEnabled !== prevState.soundEnabled) {
      updateAmbientVolume();
    }
  });
}

