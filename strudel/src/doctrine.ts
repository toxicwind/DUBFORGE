// @toxicwind/dubforge — DUBFORGE doctrine ported to Strudel.
// Pure, dependency-free core: phi/fibonacci constants + basscraft primitives.
// Ported from ResonanceEnergy/DUBFORGE engine/ (phi_core, riddim_engine,
// sidechain, arp_synth, config_loader). MIT.

export const PHI = 1.618033988749895;
export const FIBONACCI = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987, 1597];
export const BEATS_PER_BAR = 4;
export const A4_432 = 432;
export const A4_440 = 440;

// Phi envelope timing: Attack:Decay:Release = 1 : φ : φ²
export const PHI_ENVELOPE = [1, PHI, PHI * PHI];

// Filter cutoff ladder: 55 × φ^n Hz
export function phiCutoffLadder(n: number): number {
  return 55 * Math.pow(PHI, n);
}

// PSBS band boundaries (Fibonacci-approximate Hz)
export const PSBS_BANDS = [
  { band: 'SUB', lo: 20, hi: 89 },
  { band: 'LOW', lo: 89, hi: 144 },
  { band: 'MID', lo: 144, hi: 233 },
  { band: 'HIGH', lo: 233, hi: 377 },
  { band: 'CLICK', lo: 377, hi: 610 },
];

// Phi harmonic series: each partial is fundamental * φ^k
export function phiHarmonicSeries(fundamental: number, nPartials: number): number[] {
  const out: number[] = [];
  for (let k = 0; k < nPartials; k++) out.push(fundamental * Math.pow(PHI, k));
  return out;
}

// Fibonacci harmonic series: partials at Fibonacci-integer multiples
export function fibonacciHarmonicSeries(fundamental: number, maxFreq = 22050): number[] {
  const out: number[] = [];
  for (const f of FIBONACCI) {
    if (f === 1) continue;
    const freq = fundamental * f;
    if (freq < maxFreq) out.push(freq);
  }
  return out;
}

// Amplitude envelope: 1 / φ^(k * decay)
export function phiAmplitudeCurve(n: number, decay = 1.0): number[] {
  const out: number[] = [];
  for (let k = 0; k < n; k++) out.push(1 / Math.pow(PHI, k * decay));
  return out;
}

// Render one wavetable frame from partials + amplitudes, normalized to [-1,1]
export function renderFrame(partials: number[], amplitudes: number[], size = 2048): Float32Array {
  const frame = new Float32Array(size);
  for (let i = 0; i < size; i++) {
    const t = (i / size) * 2 * Math.PI;
    let v = 0;
    for (let p = 0; p < partials.length; p++) v += amplitudes[p] * Math.sin(partials[p] * t);
    frame[i] = v;
  }
  let peak = 0;
  for (let i = 0; i < size; i++) {
    const a = Math.abs(frame[i]);
    if (a > peak) peak = a;
  }
  if (peak > 0) for (let i = 0; i < size; i++) frame[i] /= peak;
  return frame;
}

// Phi-weighted morph position (fractal curve)
export function phiMorphPosition(i: number, steps: number): number {
  const tLinear = i / Math.max(steps - 1, 1);
  return Math.pow(tLinear, PHI);
}

// Fibonacci interval steps (arp pattern)
export const FIB_INTERVALS = [0, 2, 3, 5, 7, 8, 10, 12, 14, 15, 17, 19, 20, 24];

// Phi arp note pattern: semitone offsets wrapped within octave range
export function phiArpPattern(stepCount: number, octaveRange = 2): number[] {
  const out: number[] = [];
  const maxSemis = octaveRange * 12;
  for (let i = 0; i < stepCount; i++) {
    const idx = i % FIB_INTERVALS.length;
    let semis = FIB_INTERVALS[idx];
    if (semis > maxSemis) semis %= maxSemis;
    out.push(semis);
  }
  return out;
}

// ---- Riddim (ported from engine/riddim_engine.py) ----
export type RiddimType = 'minimal' | 'heavy' | 'bounce' | 'stutter' | 'triplet';

export interface RiddimPreset {
  name: string;
  riddimType: RiddimType;
  frequency?: number;
  durationS?: number;
  gapRatio?: number;
  attackS?: number;
  releaseS?: number;
  distortion?: number;
  subdivisions?: number;
  bpm?: number;
  depth?: number;
}

export const RIDDIM_BANKS: Record<RiddimType, { name: string; presets: RiddimPreset[] }> = {
  minimal: {
    name: 'MINIMAL_RIDDIM',
    presets: [
      { name: 'Minimal Pure', riddimType: 'minimal', gapRatio: 0.5, distortion: 0.2 },
      { name: 'Minimal Wide', riddimType: 'minimal', gapRatio: 0.6, distortion: 0.3 },
      { name: 'Minimal Dark', riddimType: 'minimal', gapRatio: 0.4, frequency: 44.0, distortion: 0.4 },
      { name: 'Minimal Space', riddimType: 'minimal', gapRatio: 0.7, distortion: 0.1 },
    ],
  },
  heavy: {
    name: 'HEAVY_RIDDIM',
    presets: [
      { name: 'Heavy Wall', riddimType: 'heavy', gapRatio: 0.15, distortion: 0.8 },
      { name: 'Heavy Crush', riddimType: 'heavy', gapRatio: 0.1, distortion: 1.0 },
      { name: 'Heavy Dense', riddimType: 'heavy', gapRatio: 0.2, distortion: 0.7 },
      { name: 'Heavy Sub', riddimType: 'heavy', gapRatio: 0.12, frequency: 36.7, distortion: 0.6 },
    ],
  },
  bounce: {
    name: 'BOUNCE_RIDDIM',
    presets: [
      { name: 'Bounce Standard', riddimType: 'bounce', gapRatio: 0.35, distortion: 0.5 },
      { name: 'Bounce Tight', riddimType: 'bounce', gapRatio: 0.25, distortion: 0.6 },
      { name: 'Bounce Loose', riddimType: 'bounce', gapRatio: 0.5, distortion: 0.3 },
      { name: 'Bounce Deep', riddimType: 'bounce', gapRatio: 0.3, frequency: 44.0, distortion: 0.5 },
    ],
  },
  stutter: {
    name: 'STUTTER_RIDDIM',
    presets: [
      { name: 'Stutter 4x', riddimType: 'stutter', subdivisions: 4, gapRatio: 0.3, distortion: 0.6 },
      { name: 'Stutter 8x', riddimType: 'stutter', subdivisions: 8, gapRatio: 0.3, distortion: 0.5 },
      { name: 'Stutter 16x', riddimType: 'stutter', subdivisions: 16, gapRatio: 0.25, distortion: 0.4 },
      { name: 'Stutter Dirty', riddimType: 'stutter', subdivisions: 6, gapRatio: 0.2, distortion: 0.9 },
    ],
  },
  triplet: {
    name: 'TRIPLET_RIDDIM',
    presets: [
      { name: 'Triplet Standard', riddimType: 'triplet', gapRatio: 0.3, distortion: 0.5 },
      { name: 'Triplet Heavy', riddimType: 'triplet', gapRatio: 0.2, distortion: 0.8 },
      { name: 'Triplet Clean', riddimType: 'triplet', gapRatio: 0.4, distortion: 0.2 },
      { name: 'Triplet Deep', riddimType: 'triplet', gapRatio: 0.35, frequency: 44.0, distortion: 0.6 },
    ],
  },
};

export interface RiddimEvent {
  timeS: number;
  durationS: number;
  frequency: number;
  gain: number;
}

// Riddim gate pattern (which subdivisions are silent) per type.
// Returns a boolean array of length `subdivisions` per beat.
export function riddimGate(type: RiddimType, subdivisions = 4): boolean[] {
  switch (type) {
    case 'minimal':
    case 'heavy':
      return [true]; // one hit per beat
    case 'bounce':
      return [true, false, false, true, false, true, false, false];
    case 'stutter':
      return Array.from({ length: subdivisions }, () => true);
    case 'triplet':
      return [true, false, true];
    default:
      return [true];
  }
}

// Sample-accurate riddim events (ported from generate_riddim_*).
export function riddimEvents(preset: RiddimPreset, sampleRate = 44100): RiddimEvent[] {
  const type = preset.riddimType;
  const bpm = preset.bpm ?? 150;
  const freq = preset.frequency ?? 55.0;
  const gap = preset.gapRatio ?? 0.3;
  const dur = preset.durationS ?? 4.0;
  const depth = preset.depth ?? 1.0;
  const n = Math.floor(dur * sampleRate);
  const beatSamples = Math.floor((60 / bpm) * sampleRate);
  const events: RiddimEvent[] = [];

  if (type === 'minimal') {
    const hitSamples = Math.floor(beatSamples * (1 - gap));
    for (let pos = 0; pos < n; pos += beatSamples) {
      events.push({ timeS: pos / sampleRate, durationS: Math.min(hitSamples, n - pos) / sampleRate, frequency: freq, gain: depth });
    }
  } else if (type === 'heavy') {
    const hitSamples = Math.floor(beatSamples * Math.max(0.7, 1 - gap * 0.3));
    for (let pos = 0; pos < n; pos += beatSamples) {
      events.push({ timeS: pos / sampleRate, durationS: Math.min(hitSamples, n - pos) / sampleRate, frequency: freq, gain: depth });
    }
  } else {
    const pattern = riddimGate(type, preset.subdivisions ?? 4);
    const subLen = type === 'triplet' ? Math.floor(beatSamples / 3) : Math.floor(beatSamples / pattern.length);
    const hitLen = Math.floor(subLen * (1 - gap));
    let pos = 0;
    let idx = 0;
    while (pos < n) {
      if (pattern[idx % pattern.length]) {
        events.push({ timeS: pos / sampleRate, durationS: Math.min(hitLen, n - pos) / sampleRate, frequency: freq, gain: depth });
      }
      pos += subLen;
      idx++;
    }
  }
  return events;
}

// ---- Sidechain (ported from engine/sidechain.py) ----
export type SidechainShape = 'pump' | 'hard_cut' | 'smooth' | 'bounce' | 'phi_curve';

export interface SidechainPreset {
  name: string;
  shape: SidechainShape;
  attackMs?: number;
  releaseMs?: number;
  depth?: number;
  holdMs?: number;
  curveExp?: number;
  retriggerRate?: number;
  mix?: number;
  bpm?: number;
}

export const SIDECHAIN_BANKS: Record<SidechainShape, { name: string; presets: SidechainPreset[] }> = {
  pump: {
    name: 'PUMP_SIDECHAIN',
    presets: [
      { name: 'Pump Standard', shape: 'pump', releaseMs: 150, depth: 1.0 },
      { name: 'Pump Tight', shape: 'pump', releaseMs: 80, depth: 0.9 },
      { name: 'Pump Loose', shape: 'pump', releaseMs: 250, depth: 0.8 },
      { name: 'Pump Deep', shape: 'pump', releaseMs: 200, depth: 1.0 },
    ],
  },
  hard_cut: {
    name: 'HARD_CUT_SIDECHAIN',
    presets: [
      { name: 'Hard Cut Standard', shape: 'hard_cut', releaseMs: 120, depth: 1.0 },
      { name: 'Hard Cut Fast', shape: 'hard_cut', releaseMs: 50, depth: 1.0 },
      { name: 'Hard Cut Soft', shape: 'hard_cut', releaseMs: 200, depth: 0.7 },
      { name: 'Hard Cut Pump', shape: 'hard_cut', releaseMs: 90, depth: 0.9 },
    ],
  },
  smooth: {
    name: 'SMOOTH_SIDECHAIN',
    presets: [
      { name: 'Smooth Gentle', shape: 'smooth', releaseMs: 250, depth: 0.5 },
      { name: 'Smooth Medium', shape: 'smooth', releaseMs: 180, depth: 0.7 },
      { name: 'Smooth Deep', shape: 'smooth', releaseMs: 300, depth: 0.9 },
      { name: 'Smooth Wide', shape: 'smooth', releaseMs: 400, depth: 0.6 },
    ],
  },
  bounce: {
    name: 'BOUNCE_SIDECHAIN',
    presets: [
      { name: 'Bounce 2x', shape: 'bounce', retriggerRate: 2, releaseMs: 100, depth: 0.8 },
      { name: 'Bounce 4x', shape: 'bounce', retriggerRate: 4, releaseMs: 80, depth: 0.9 },
      { name: 'Bounce 8x', shape: 'bounce', retriggerRate: 8, releaseMs: 60, depth: 0.7 },
      { name: 'Bounce Deep', shape: 'bounce', retriggerRate: 4, releaseMs: 150, depth: 1.0 },
    ],
  },
  phi_curve: {
    name: 'PHI_CURVE_SIDECHAIN',
    presets: [
      { name: 'Phi Curve Standard', shape: 'phi_curve', releaseMs: 200, depth: 0.8, curveExp: PHI },
      { name: 'Phi Curve Deep', shape: 'phi_curve', releaseMs: 250, depth: 1.0, curveExp: PHI },
      { name: 'Phi Curve Fast', shape: 'phi_curve', releaseMs: 100, depth: 0.7, curveExp: PHI },
      { name: 'Phi Curve Wide', shape: 'phi_curve', releaseMs: 350, depth: 0.6, curveExp: PHI },
    ],
  },
};

// Sidechain ducking envelope, sample-accurate (ported from generate_*_envelope).
export function sidechainEnvelope(preset: SidechainPreset, durationS = 4.0, sampleRate = 44100): Float32Array {
  const n = Math.floor(durationS * sampleRate);
  const bpm = preset.bpm ?? 150;
  const depth = preset.depth ?? 1.0;
  const mix = preset.mix ?? 1.0;
  const beatSamples = Math.floor((60 / bpm) * sampleRate);
  const env = new Float32Array(n).fill(1.0);

  if (preset.shape === 'pump' || preset.shape === 'smooth' || preset.shape === 'phi_curve') {
    const attack = Math.max(1, Math.floor((preset.attackMs ?? 0.5) / 1000 * sampleRate));
    const hold = Math.max(1, Math.floor((preset.holdMs ?? 10) / 1000 * sampleRate));
    const release = Math.max(1, Math.floor((preset.releaseMs ?? 150) / 1000 * sampleRate));
    const exp = preset.curveExp ?? 2.0;
    let pos = 0;
    while (pos < n) {
      for (let i = 0; i < Math.min(attack, n - pos); i++) {
        const t = i / attack;
        env[pos + i] = 1 - depth * t;
      }
      pos += attack;
      for (let i = 0; i < Math.min(hold, Math.max(0, n - pos)); i++) env[pos + i] = 1 - depth;
      pos += hold;
      for (let i = 0; i < Math.min(release, Math.max(0, n - pos)); i++) {
        const t = i / release;
        env[pos + i] = (1 - depth) + depth * Math.pow(t, exp);
      }
      pos += release;
      pos += Math.max(0, beatSamples - attack - hold - release);
    }
  } else if (preset.shape === 'hard_cut') {
    const release = Math.max(1, Math.floor((preset.releaseMs ?? 120) / 1000 * sampleRate));
    let pos = 0;
    while (pos < n) {
      if (pos < n) env[pos] = 1 - depth;
      for (let i = 1; i < Math.min(release, Math.max(0, n - pos)); i++) {
        const t = i / release;
        env[pos + i] = (1 - depth) + depth * Math.pow(t, 1.5);
      }
      pos += beatSamples;
    }
  } else if (preset.shape === 'bounce') {
    const rate = preset.retriggerRate ?? 2;
    const subLen = Math.floor(beatSamples / rate);
    const attack = Math.max(1, Math.floor((preset.attackMs ?? 0.5) / 1000 * sampleRate));
    const release = Math.max(1, Math.floor((preset.releaseMs ?? 80) / 1000 * sampleRate));
    let pos = 0;
    while (pos < n) {
      for (let i = 0; i < Math.min(attack, n - pos); i++) {
        const t = i / attack;
        env[pos + i] = 1 - depth * t;
      }
      pos += attack;
      for (let i = 0; i < Math.min(release, Math.max(0, n - pos)); i++) {
        const t = i / release;
        env[pos + i] = (1 - depth) + depth * Math.pow(t, 1.2);
      }
      pos += release;
      pos += Math.max(0, subLen - attack - release);
    }
  }

  for (let i = 0; i < n; i++) {
    env[i] = Math.min(1, Math.max(0, env[i]));
    env[i] = env[i] * mix + (1 - mix);
  }
  return env;
}

// ---- MIDI (ported from engine/midi_export.py) ----
export function midiNoteToFreq(note: number): number {
  return 440 * Math.pow(2, (note - 69) / 12);
}

export function freqToMidiNote(freq: number): number {
  return Math.round(69 + 12 * Math.log2(freq / 440));
}

// ---- Chords (ported from engine/chord_progression.py) ----
export const CHORD_QUALITIES: Record<string, number[]> = {
  major: [0, 4, 7],
  minor: [0, 3, 7],
  diminished: [0, 3, 6],
  augmented: [0, 4, 8],
  sus2: [0, 2, 7],
  sus4: [0, 5, 7],
  power: [0, 7],
  maj7: [0, 4, 7, 11],
  min7: [0, 3, 7, 10],
  dom7: [0, 4, 7, 10],
  dim7: [0, 3, 6, 9],
  min7b5: [0, 3, 6, 10],
  add9: [0, 4, 7, 14],
  madd9: [0, 3, 7, 14],
  maj9: [0, 4, 7, 11, 14],
  min9: [0, 3, 7, 10, 14],
  dom9: [0, 4, 7, 10, 14],
  min11: [0, 3, 7, 10, 14, 17],
  '7sus4': [0, 5, 7, 10],
  // Dubstep specials
  '5th_stack': [0, 7, 14],
  tritone: [0, 6],
  phi_triad: [0, 5, 8],
};

export type ChordQuality = keyof typeof CHORD_QUALITIES;

export function buildChord(rootMidi: number, quality: ChordQuality = 'minor'): number[] {
  const intervals = CHORD_QUALITIES[quality] ?? CHORD_QUALITIES.minor;
  return intervals.map((i) => rootMidi + i);
}

// Phi voice spread: spread chord notes by phi ratio above the root.
export function phiVoiceSpread(chordNotes: number[], spread = PHI): number[] {
  if (chordNotes.length === 0) return chordNotes;
  const root = chordNotes[0];
  return chordNotes.map((n, i) => (i === 0 ? n : root + Math.round((n - root) * spread)));
}

// ---- Arps (ported from engine/trance_arp.py) ----
export interface ArpNote {
  step: number;
  semitoneOffset: number;
  velocity: number;
  gatePercent: number;
  durationBeats: number;
}

export interface ArpPattern {
  name: string;
  steps: number;
  direction: 'up_down' | 'forward' | 'backward';
  octaveRange: number;
  rate: string;
  notes: ArpNote[];
}

export function fibonacciRisePattern(rootSemitone = 0): ArpPattern {
  const fibSemitones = [0, 0, 2, 3, 5, 8, 0, 5, 3, 2, 0, 0, -5];
  const accents = new Set([0, 1, 2, 4, 7, 12]);
  return {
    name: 'FIBONACCI_RISE',
    steps: 13,
    direction: 'up_down',
    octaveRange: 3,
    rate: '1/16',
    notes: fibSemitones.map((st, i) => ({
      step: i,
      semitoneOffset: rootSemitone + st,
      velocity: accents.has(i) ? 127 : 80,
      gatePercent: 61.8,
      durationBeats: 0.25,
    })),
  };
}

export function phiSpiralPattern(rootSemitone = 0): ArpPattern {
  const steps = 21;
  const accents = new Set([0, 1, 2, 4, 7, 12, 20]);
  return {
    name: 'PHI_SPIRAL',
    steps,
    direction: 'up_down',
    octaveRange: 3,
    rate: '1/16',
    notes: Array.from({ length: steps }, (_, i) => {
      const interval = Math.round(PHI * (i % 8)) % 12;
      const dir = i % 2 === 0 ? 1 : -1;
      return {
        step: i,
        semitoneOffset: rootSemitone + interval * dir,
        velocity: accents.has(i) ? 127 : 90,
        gatePercent: 61.8,
        durationBeats: 0.25,
      };
    }),
  };
}

export function goldenGatePattern(rootSemitone = 0): ArpPattern {
  const fibGates = [1, 1, 2, 3, 5, 8, 5, 3, 2, 1, 1, 2, 3];
  const maxGate = Math.max(...fibGates);
  return {
    name: 'GOLDEN_GATE',
    steps: 13,
    direction: 'forward',
    octaveRange: 1,
    rate: '1/16',
    notes: fibGates.map((g, i) => {
      const gatePct = (g / maxGate) * 100;
      return {
        step: i,
        semitoneOffset: rootSemitone,
        velocity: 80 + Math.floor(gatePct * 0.47),
        gatePercent: gatePct,
        durationBeats: 0.25 * (g / maxGate + 0.5),
      };
    }),
  };
}

export const ARP_PATTERNS: Record<string, () => ArpPattern> = {
  fibonacci_rise: () => fibonacciRisePattern(),
  phi_spiral: () => phiSpiralPattern(),
  golden_gate: () => goldenGatePattern(),
};

// ---- Groove (ported from engine/groove.py) ----
export interface GrooveTemplate {
  name: string;
  timing: number[];
  velocity: number[];
  swing: number;
}

export const GROOVE_TEMPLATES: Record<string, GrooveTemplate> = {
  straight: {
    name: 'straight',
    timing: Array(16).fill(0),
    velocity: [1.0, 0.7, 0.8, 0.6, 0.9, 0.7, 0.8, 0.6, 1.0, 0.7, 0.8, 0.6, 0.9, 0.7, 0.8, 0.6],
    swing: 0,
  },
  swing_light: {
    name: 'swing_light',
    timing: [0, 0, 15, 0, 0, 0, 15, 0, 0, 0, 15, 0, 0, 0, 15, 0],
    velocity: Array(16).fill(1.0),
    swing: 25,
  },
  swing_heavy: {
    name: 'swing_heavy',
    timing: [0, 0, 30, 0, 0, 0, 30, 0, 0, 0, 30, 0, 0, 0, 30, 0],
    velocity: Array(16).fill(1.0),
    swing: 60,
  },
  dubstep_halftime: {
    name: 'dubstep_halftime',
    timing: [0, 5, -3, 8, 0, 3, -5, 10, 0, 5, -3, 8, 0, 3, -5, 10],
    velocity: [1.0, 0.5, 0.6, 0.4, 0.9, 0.5, 0.7, 0.3, 1.0, 0.5, 0.6, 0.4, 0.9, 0.5, 0.7, 0.3],
    swing: 0,
  },
  riddim_bounce: {
    name: 'riddim_bounce',
    timing: [0, -5, 10, -5, 0, -5, 10, -5, 0, -5, 10, -5, 0, -5, 10, -5],
    velocity: [1.0, 0.6, 0.9, 0.5, 1.0, 0.6, 0.9, 0.5, 1.0, 0.6, 0.9, 0.5, 1.0, 0.6, 0.9, 0.5],
    swing: 0,
  },
  phi_groove: {
    name: 'phi_groove',
    timing: [
      0, 0, Math.floor(100 / PHI / PHI), 0,
      0, 0, Math.floor(100 / PHI), 0,
      0, 0, Math.floor(100 / PHI / PHI), 0,
      0, 0, Math.floor(100 / PHI), 0,
    ],
    velocity: [
      1.0, 1 / PHI, 1 / PHI ** 2, 1 / PHI,
      1.0, 1 / PHI, 1 / PHI ** 2, 1 / PHI,
      1.0, 1 / PHI, 1 / PHI ** 2, 1 / PHI,
      1.0, 1 / PHI, 1 / PHI ** 2, 1 / PHI,
    ],
    swing: 0,
  },
};

// ---- LFO (ported from engine/lfo_matrix.py) ----
export type LfoWaveform = 'sine' | 'triangle' | 'saw' | 'square' | 'sample_hold';

export function lfoValue(waveform: LfoWaveform, phase: number): number {
  const p = phase % 1;
  switch (waveform) {
    case 'sine':
      return Math.sin(2 * Math.PI * p);
    case 'triangle':
      return 4 * Math.abs(p - 0.5) - 1;
    case 'saw':
      return 2 * p - 1;
    case 'square':
      return p < 0.5 ? 1 : -1;
    case 'sample_hold':
      return Math.floor(p * 16) % 2 === 0 ? 1 : -1;
    default:
      return Math.sin(2 * Math.PI * p);
  }
}

// ---- Pitch automation (ported from engine/pitch_automation.py) ----
export type PitchAutoType = 'dive' | 'rise' | 'wobble' | 'staircase' | 'glide';

export function pitchAutoValue(type: PitchAutoType, t: number, opts: { start?: number; end?: number; depth?: number; rateHz?: number; steps?: number; curveExp?: number } = {}): number {
  const start = opts.start ?? 0;
  const end = opts.end ?? -12;
  const depth = opts.depth ?? 2;
  const rateHz = opts.rateHz ?? 2;
  const steps = opts.steps ?? 4;
  const curveExp = opts.curveExp ?? 2;
  const tc = Math.min(1, Math.max(0, t));
  switch (type) {
    case 'dive':
      return start + (end - start) * Math.pow(tc, curveExp);
    case 'rise':
      return start + (end - start) * (1 - Math.pow(1 - tc, curveExp));
    case 'wobble':
      return start + depth * Math.sin(2 * Math.PI * rateHz * t);
    case 'staircase': {
      const stepIdx = Math.min(steps - 1, Math.floor(tc * steps));
      return start + ((end - start) / steps) * stepIdx;
    }
    case 'glide':
      return start + (end - start) * 0.5 * (1 + Math.tanh(6 * (tc - 0.5)));
    default:
      return start;
  }
}

// ---- PSBS crossovers (ported from engine/psbs.py) ----
export function phiCrossovers(rootHz: number, nBands = 5): number[] {
  const out: number[] = [];
  for (let n = 0; n <= nBands; n++) out.push(Math.round(rootHz * Math.pow(PHI, n) * 100) / 100);
  return out;
}

// ---- RCO energy curves (ported from engine/rco.py) ----
export interface RcoSection {
  name: string;
  bars: number;
  energy: number;
}

export const RCO_PROFILES: Record<'weapon' | 'emotive' | 'hybrid', RcoSection[]> = {
  weapon: [
    { name: 'INTRO', bars: 8, energy: 0.2 },
    { name: 'BUILD 1', bars: 16, energy: 0.55 },
    { name: 'DROP 1', bars: 16, energy: 1.0 },
    { name: 'BREAKDOWN', bars: 8, energy: 0.3 },
    { name: 'BUILD 2', bars: 16, energy: 0.65 },
    { name: 'DROP 2', bars: 16, energy: 1.0 },
    { name: 'BRIDGE', bars: 8, energy: 0.4 },
    { name: 'FINAL DROP', bars: 16, energy: 0.95 },
    { name: 'OUTRO', bars: 8, energy: 0.15 },
  ],
  emotive: [
    { name: 'INTRO', bars: 8, energy: 0.15 },
    { name: 'BUILD 1', bars: 16, energy: 0.4 },
    { name: 'DROP 1', bars: 16, energy: 0.8 },
    { name: 'BREAKDOWN', bars: 8, energy: 0.25 },
    { name: 'BUILD 2', bars: 16, energy: 0.5 },
    { name: 'DROP 2', bars: 16, energy: 0.85 },
    { name: 'BRIDGE', bars: 8, energy: 0.35 },
    { name: 'FINAL DROP', bars: 16, energy: 0.75 },
    { name: 'OUTRO', bars: 8, energy: 0.1 },
  ],
  hybrid: [
    { name: 'INTRO', bars: 8, energy: 0.25 },
    { name: 'BUILD 1', bars: 16, energy: 0.5 },
    { name: 'DROP 1', bars: 16, energy: 0.95 },
    { name: 'BREAKDOWN', bars: 8, energy: 0.2 },
    { name: 'BUILD 2', bars: 16, energy: 0.6 },
    { name: 'DROP 2', bars: 16, energy: 0.9 },
    { name: 'BRIDGE', bars: 8, energy: 0.45 },
    { name: 'FINAL DROP', bars: 16, energy: 1.0 },
    { name: 'OUTRO', bars: 8, energy: 0.12 },
  ],
};

export function rcoEnergyCurve(profile: 'weapon' | 'emotive' | 'hybrid', bpm = 150, resolutionPerBar = 4): { totalBars: number; totalDurationS: number; timeS: number[]; energy: number[] } {
  const sections = RCO_PROFILES[profile];
  const secondsPerBar = (4 * 60) / bpm;
  const totalBars = sections.reduce((a, s) => a + s.bars, 0);
  const totalDuration = totalBars * secondsPerBar;
  const timeS: number[] = [];
  const energy: number[] = [];
  let currentBar = 0;
  for (const sec of sections) {
    const samples = sec.bars * resolutionPerBar;
    for (let i = 0; i < samples; i++) {
      const barOffset = currentBar + i / resolutionPerBar;
      timeS.push(barOffset * secondsPerBar);
      energy.push(sec.energy);
    }
    currentBar += sec.bars;
  }
  return { totalBars, totalDurationS: totalDuration, timeS, energy };
}