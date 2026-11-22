// Synthesised sound for Moonlight Gallery Heist.
// No audio files: every effect is built with the Web Audio API at run time
// (oscillators for tones, a noise buffer for smoke and footsteps), so the
// game ships no sound assets at all. The context starts on the first user
// gesture, as browsers require, and M toggles mute.

export function createSound() {
  return {
    context: null,
    master: null,
    muted: false,
    stepCount: 0,
  };
}

function ensure(sound) {
  if (sound.context) return true;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return false;
    sound.context = new AudioContext();
    sound.master = sound.context.createGain();
    sound.master.gain.value = 0.5;
    sound.master.connect(sound.context.destination);
  } catch {
    return false;
  }
  return true;
}

export function unlockSound(sound) {
  if (ensure(sound) && sound.context.state === 'suspended') {
    sound.context.resume().catch(() => {});
  }
}

export function toggleMute(sound) {
  sound.muted = !sound.muted;
  if (sound.master) sound.master.gain.value = sound.muted ? 0 : 0.5;
  return sound.muted;
}

function tone(sound, frequency, duration, type, volume, when = 0, slideTo = 0) {
  if (!ensure(sound) || sound.muted) return;
  try {
    const now = sound.context.currentTime + when;
    const osc = sound.context.createOscillator();
    const gain = sound.context.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, now);
    if (slideTo > 0) osc.frequency.exponentialRampToValueAtTime(slideTo, now + duration);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(sound.master);
    osc.start(now);
    osc.stop(now + duration + 0.05);
  } catch {
    // Audio is decoration; a failure must never break the game.
  }
}

function noiseBurst(sound, duration, volume, filterFreq) {
  if (!ensure(sound) || sound.muted) return;
  try {
    const ctx = sound.context;
    const length = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = filterFreq;
    const gain = ctx.createGain();
    gain.gain.value = volume;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(sound.master);
    source.start();
  } catch {
    // Audio is decoration; a failure must never break the game.
  }
}

export function playStep(sound, sneaking) {
  if (!ensure(sound) || sound.muted) return;
  sound.stepCount += 1;
  if (sound.stepCount % 2 === 1) return; // every other step only
  noiseBurst(sound, 0.05, sneaking ? 0.04 : 0.1, sneaking ? 500 : 900);
}

export function playPickup(sound, rarity) {
  const base = rarity === 'legendary' ? 880 : rarity === 'epic' ? 740 : rarity === 'rare' ? 660 : 587;
  tone(sound, base, 0.12, 'sine', 0.25);
  tone(sound, base * 1.25, 0.16, 'sine', 0.22, 0.07);
  if (rarity === 'legendary' || rarity === 'epic') {
    tone(sound, base * 1.5, 0.24, 'sine', 0.2, 0.14);
  }
}

export function playCoin(sound) {
  tone(sound, 2400, 0.07, 'triangle', 0.18);
  tone(sound, 1800, 0.1, 'triangle', 0.15, 0.09);
}

export function playSmoke(sound) {
  noiseBurst(sound, 0.5, 0.22, 1200);
}

export function playSpotted(sound) {
  tone(sound, 220, 0.18, 'square', 0.12, 0, 330);
}

export function playCaught(sound) {
  tone(sound, 392, 0.2, 'sawtooth', 0.2);
  tone(sound, 311, 0.2, 'sawtooth', 0.2, 0.16);
  tone(sound, 233, 0.45, 'sawtooth', 0.22, 0.32);
}

export function playWin(sound) {
  const notes = [523, 659, 784, 1047];
  for (let i = 0; i < notes.length; i += 1) {
    tone(sound, notes[i], 0.22, 'triangle', 0.22, i * 0.11);
  }
}

export function playClick(sound) {
  tone(sound, 700, 0.06, 'sine', 0.15);
}
