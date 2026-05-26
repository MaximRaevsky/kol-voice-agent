/**
 * Audio utilities for call sounds
 */

// ============================================
// Audio Context for generating tones
// ============================================

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

// ============================================
// Ring Tone Generator
// ============================================

interface RingToneHandle {
  stop: () => void;
}

export function playRingTone(): RingToneHandle {
  const ctx = getAudioContext();
  let isPlaying = true;
  let timeoutId: ReturnType<typeof setTimeout>;
  
  // Israeli phone ring pattern: 1s ring, 4s silence
  const playRing = () => {
    if (!isPlaying) return;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Dual-tone (400Hz + 450Hz) for Israeli ring
    oscillator.frequency.setValueAtTime(425, ctx.currentTime);
    oscillator.type = 'sine';

    // Fade in/out
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime + 0.95);
    gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 1);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 1);

    // Schedule next ring
    if (isPlaying) {
      timeoutId = setTimeout(playRing, 4000);
    }
  };

  playRing();

  return {
    stop: () => {
      isPlaying = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    },
  };
}

// ============================================
// Connected Beep
// ============================================

export function playConnectedBeep(): void {
  const ctx = getAudioContext();
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.frequency.setValueAtTime(880, ctx.currentTime);
  oscillator.type = 'sine';

  gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
  gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2);

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + 0.2);
}

// ============================================
// Disconnect Beep
// ============================================

export function playDisconnectBeep(): void {
  const ctx = getAudioContext();
  
  // Three descending beeps
  [660, 550, 440].forEach((freq, i) => {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    const startTime = ctx.currentTime + i * 0.15;
    oscillator.frequency.setValueAtTime(freq, startTime);
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.2, startTime);
    gainNode.gain.linearRampToValueAtTime(0, startTime + 0.1);

    oscillator.start(startTime);
    oscillator.stop(startTime + 0.1);
  });
}

