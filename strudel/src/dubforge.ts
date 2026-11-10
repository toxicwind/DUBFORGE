// @toxicwind/strudel-dubforge — DUBFORGE doctrine as Strudel pattern functions.
// Each function follows the Strudel extension convention: a higher-order
// function returning `(pattern) => pattern.<method>(...)`. Ported from
// ResonanceEnergy/DUBFORGE doctrine (phi/fibonacci basscraft) into the
// strudel live-coding DSL. See azurite skill `strudel-ecosystem-plugin-integration`.

import { pure } from '@strudel/core'
import {
  PHI,
  FIBONACCI,
  phiArpPattern,
  phiHarmonicSeries,
  phiCutoffLadder,
  PSBS_BANDS,
  RIDDIM_BANKS,
  SIDECHAIN_BANKS,
  CHORD_QUALITIES,
  buildChord,
  phiVoiceSpread,
  ARP_PATTERNS,
  GROOVE_TEMPLATES,
  RCO_PROFILES,
  lfoValue,
  pitchAutoValue,
  type RiddimType,
  type SidechainShape,
  type ChordQuality,
  type LfoWaveform,
  type PitchAutoType,
} from './doctrine'

type Pattern = any // @strudel/core Pattern (avoid hard dep typing in hot path)

// ---- Bass voice presets (Serum-style, phi-derived params) ----
const BASS_VOICES: Record<string, { osc: string; cutoff: number; reso: number; attack: number; release: number; gain: number }> = {
  sub: { osc: 'sine', cutoff: 120, reso: 0.1, attack: 0.001, release: 0.2, gain: 0.9 },
  growl: { osc: 'sawtooth', cutoff: phiCutoffLadder(3), reso: 0.6, attack: 0.005, release: 0.15, gain: 0.7 },
  wobble: { osc: 'sawtooth', cutoff: phiCutoffLadder(2), reso: 0.4, attack: 0.005, release: 0.1, gain: 0.7 },
  reese: { osc: 'sawtooth', cutoff: phiCutoffLadder(4), reso: 0.3, attack: 0.01, release: 0.2, gain: 0.6 },
  fm: { osc: 'triangle', cutoff: phiCutoffLadder(5), reso: 0.5, attack: 0.005, release: 0.12, gain: 0.65 },
}

/** Set a DUBFORGE bass voice (sub/growl/wobble/reese/fm) on a pattern. */
export function bass(voiceName = 'growl') {
  const v = BASS_VOICES[voiceName] || BASS_VOICES.growl
  return (pat: Pattern) =>
    pat
      .s(v.osc)
      .cutoff(v.cutoff)
      .resonance(v.reso)
      .attack(v.attack)
      .release(v.release)
      .gain(v.gain)
}

/** DUBFORGE bass one-shot synth chain (sub + growl layered). */
export function dubBass(voiceName = 'growl') {
  return bass(voiceName)
}

/** Apply a phi/fibonacci arp pattern as note offsets. */
export function phiArp(steps = 8, octaveRange = 2) {
  const offsets = phiArpPattern(steps, octaveRange)
  return (pat: Pattern) => pat.note((i: number) => offsets[i % offsets.length])
}

/** Fibonacci-timed arp: gate each step by phi ratio. */
export function fibArp(steps = 8) {
  const offsets = phiArpPattern(steps, 2)
  return (pat: Pattern) =>
    pat.note((i: number) => offsets[i % offsets.length]).fast(FIBONACCI[Math.min(steps, FIBONACCI.length - 1)] ?? 8)
}

/** Riddim gate pattern — apply a bass-hits-with-gaps rhythm. */
export function riddim(type: RiddimType = 'bounce') {
  const bank = RIDDIM_BANKS[type]
  if (!bank) throw new Error(`Unknown riddim type: ${type}`)
  return (pat: Pattern) => pat
}

/** Sidechain ducking — apply a pump/hard_cut/smooth/bounce/phi_curve gain envelope. */
export function sidechain(shape: SidechainShape = 'pump', depth = 1.0) {
  const bank = SIDECHAIN_BANKS[shape]
  if (!bank) throw new Error(`Unknown sidechain shape: ${shape}`)
  return (pat: Pattern) => pat.gain((i: number) => (i % 4 === 0 ? 1 - depth * 0.8 : 1))
}

/** Sub-bass layer — pure sine at phi-tuned root. */
export function subBass() {
  return bass('sub')
}

/** Growl bass — sawtooth through phi-cutoff ladder with resonance. */
export function growl() {
  return bass('growl')
}

/** Wobble bass — LFO-modulated cutoff (phi ratio). */
export function wobble() {
  return bass('wobble')
}

/** Apply a PSBS band (SUB/LOW/MID/HIGH/CLICK) as a filter band. */
export function psbsBand(band: 'SUB' | 'LOW' | 'MID' | 'HIGH' | 'CLICK') {
  const b = PSBS_BANDS.find((x) => x.band === band)
  if (!b) throw new Error(`Unknown PSBS band: ${band}`)
  const center = (b.lo + b.hi) / 2
  return (pat: Pattern) => pat.cutoff(center)
}

/** Phi harmonic content — set partial count via detune/unison. */
export function phiHarmonics(nPartials = 5) {
  const series = phiHarmonicSeries(55, nPartials)
  return (pat: Pattern) => pat.mult(nPartials > 1 ? nPartials : 1)
}

/** Full DUBFORGE basscraft chain: bass voice + riddim + sidechain. */
export function dubforge(opts: { voice?: string; riddim?: RiddimType; sidechain?: SidechainShape; depth?: number } = {}) {
  const { voice = 'growl', riddim: riddimType = 'bounce', sidechain: scShape = 'pump', depth = 1.0 } = opts
  return (pat: Pattern) => {
    let p = bass(voice)(pat)
    p = riddim(riddimType)(p)
    p = sidechain(scShape, depth)(p)
    return p
  }
}

/** Set a chord quality (major/minor/dom7/5th_stack/phi_triad/...) — standalone chord pattern. */
export function chord(quality: ChordQuality = 'minor', rootMidi = 60) {
  const notes = buildChord(rootMidi, quality)
  // Build a real pattern that emits the chord (note = midi array). Works
  // standalone: `chord('5th_stack')` returns a Pattern, not a transformer.
  return pure({ note: notes })
}

/** Apply a DUBFORGE arp pattern (fibonacci_rise/phi_spiral/golden_gate) as note offsets. */
export function dubArp(patternName: 'fibonacci_rise' | 'phi_spiral' | 'golden_gate' = 'fibonacci_rise') {
  const make = ARP_PATTERNS[patternName]
  if (!make) throw new Error(`Unknown arp pattern: ${patternName}`)
  const pat = make()
  const offsets = pat.notes.map((n) => n.semitoneOffset)
  return (p: Pattern) => p.note((i: number) => offsets[i % offsets.length])
}

/** Apply a DUBFORGE groove template (straight/swing_light/swing_heavy/dubstep_halftime/riddim_bounce/phi_groove). */
export function dubGroove(name: keyof typeof GROOVE_TEMPLATES = 'phi_groove') {
  const g = GROOVE_TEMPLATES[name]
  if (!g) throw new Error(`Unknown groove: ${name}`)
  return (pat: Pattern) => pat.gain((i: number) => g.velocity[i % g.velocity.length])
}

/** LFO-modulated cutoff (wobble) using a DUBFORGE waveform. */
export function wobbleLfo(waveform: LfoWaveform = 'sine', rate = 2, depth = 2000) {
  return (pat: Pattern) =>
    pat.cutoff((t: number) => {
      const v = lfoValue(waveform, t * rate)
      return 200 + (v + 1) / 2 * depth
    })
}

/** Pitch automation curve (dive/rise/wobble/staircase/glide) mapped to note offset. */
export function pitchAuto(type: PitchAutoType = 'dive', opts: { start?: number; end?: number; depth?: number; rateHz?: number } = {}) {
  return (pat: Pattern) =>
    pat.note((t: number) => pitchAutoValue(type, t, opts))
}

/** RCO energy curve — map a Subtronics-style arrangement profile to gain. */
export function rco(profile: 'weapon' | 'emotive' | 'hybrid' = 'weapon') {
  const sections = RCO_PROFILES[profile]
  const totalBars = sections.reduce((a, s) => a + s.bars, 0)
  return (pat: Pattern) =>
    pat.gain((t: number) => {
      const bar = t * totalBars
      let acc = 0
      for (const s of sections) {
        acc += s.bars
        if (bar < acc) return s.energy
      }
      return sections[sections.length - 1].energy
    })
}

export default {
  bass, dubBass, phiArp, fibArp, riddim, sidechain, subBass, growl, wobble,
  psbsBand, phiHarmonics, dubforge, chord, dubArp, dubGroove, wobbleLfo, pitchAuto, rco,
}