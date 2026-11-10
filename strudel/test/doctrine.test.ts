import { describe, it, expect } from "bun:test";
import {
  PHI,
  FIBONACCI,
  phiHarmonicSeries,
  fibonacciHarmonicSeries,
  phiAmplitudeCurve,
  renderFrame,
  phiArpPattern,
  riddimGate,
  riddimEvents,
  sidechainEnvelope,
  buildChord,
  phiVoiceSpread,
  fibonacciRisePattern,
  phiSpiralPattern,
  goldenGatePattern,
  GROOVE_TEMPLATES,
  lfoValue,
  pitchAutoValue,
  phiCrossovers,
  rcoEnergyCurve,
  midiNoteToFreq,
  freqToMidiNote,
} from "../src/doctrine";

describe("constants", () => {
  it("PHI is the golden ratio", () => {
    expect(Math.abs(PHI - 1.6180339887)).toBeLessThan(1e-9);
  });
  it("FIBONACCI contains the drop-structure numbers", () => {
    expect(FIBONACCI).toContain(13);
    expect(FIBONACCI).toContain(21);
    expect(FIBONACCI).toContain(89);
  });
});

describe("phi harmonics", () => {
  it("generates phi-spaced partials", () => {
    const s = phiHarmonicSeries(55, 3);
    expect(s[0]).toBeCloseTo(55);
    expect(s[1]).toBeCloseTo(55 * PHI);
    expect(s[2]).toBeCloseTo(55 * PHI * PHI);
  });
  it("fibonacci harmonic series respects Nyquist", () => {
    const s = fibonacciHarmonicSeries(55, 22050);
    expect(s.length).toBeGreaterThan(0);
    expect(Math.max(...s)).toBeLessThan(22050);
  });
  it("phi amplitude curve decays by phi", () => {
    const a = phiAmplitudeCurve(4);
    expect(a[0]).toBe(1);
    expect(a[1]).toBeCloseTo(1 / PHI);
  });
  it("renderFrame normalizes to [-1,1]", () => {
    const frame = renderFrame([55, 55 * PHI], [1, 0.5], 64);
    expect(frame.length).toBe(64);
    expect(Math.max(...frame)).toBeLessThanOrEqual(1);
  });
});

describe("phi arp", () => {
  it("produces fibonacci interval offsets", () => {
    const p = phiArpPattern(8, 2);
    expect(p).toHaveLength(8);
    expect(Math.max(...p)).toBeLessThanOrEqual(24);
  });
});

describe("riddim", () => {
  it("gate patterns match DUBFORGE types", () => {
    expect(riddimGate("bounce")).toEqual([true, false, false, true, false, true, false, false]);
    expect(riddimGate("triplet")).toEqual([true, false, true]);
    expect(riddimGate("minimal")).toEqual([true]);
  });
  it("riddimEvents produces finite events", () => {
    const ev = riddimEvents({ name: "t", riddimType: "bounce", bpm: 150 });
    expect(ev.length).toBeGreaterThan(0);
    for (const e of ev) {
      expect(Number.isFinite(e.timeS)).toBe(true);
      expect(Number.isFinite(e.frequency)).toBe(true);
    }
  });
});

describe("sidechain", () => {
  it("pump envelope stays in [0,1]", () => {
    const env = sidechainEnvelope({ name: "p", shape: "pump", bpm: 150 }, 1, 8000);
    for (const v of env) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });
  it("hard_cut ducks instantly", () => {
    const env = sidechainEnvelope({ name: "h", shape: "hard_cut", bpm: 150, depth: 1 }, 1, 8000);
    expect(env[0]).toBeLessThan(0.01);
  });
});

describe("chords", () => {
  it("builds a minor chord", () => {
    expect(buildChord(60, "minor")).toEqual([60, 63, 67]);
  });
  it("builds dubstep 5th stack", () => {
    expect(buildChord(36, "5th_stack")).toEqual([36, 43, 50]);
  });
  it("phi voice spread expands intervals", () => {
    const spread = phiVoiceSpread([60, 63, 67], PHI);
    expect(spread[0]).toBe(60);
    expect(spread[1]).toBeGreaterThan(63);
  });
});

describe("arps", () => {
  it("fibonacci rise has 13 steps", () => {
    expect(fibonacciRisePattern().steps).toBe(13);
    expect(fibonacciRisePattern().notes).toHaveLength(13);
  });
  it("phi spiral has 21 steps", () => {
    expect(phiSpiralPattern().steps).toBe(21);
  });
  it("golden gate gates by fibonacci", () => {
    const g = goldenGatePattern();
    expect(g.notes[0].gatePercent).toBeLessThan(g.notes[5].gatePercent);
  });
});

describe("groove", () => {
  it("phi groove timing uses phi-derived offsets", () => {
    const g = GROOVE_TEMPLATES.phi_groove;
    expect(g.timing[2]).toBe(Math.floor(100 / PHI / PHI));
    expect(g.timing[6]).toBe(Math.floor(100 / PHI));
  });
});

describe("lfo", () => {
  it("sine lfo is bipolar", () => {
    expect(lfoValue("sine", 0.25)).toBeCloseTo(1);
    expect(lfoValue("sine", 0.75)).toBeCloseTo(-1);
  });
  it("square lfo is stepwise", () => {
    expect(lfoValue("square", 0.1)).toBe(1);
    expect(lfoValue("square", 0.6)).toBe(-1);
  });
});

describe("pitch automation", () => {
  it("dive falls from start to end", () => {
    expect(pitchAutoValue("dive", 0, { start: 0, end: -12 })).toBeCloseTo(0);
    expect(pitchAutoValue("dive", 1, { start: 0, end: -12 })).toBeCloseTo(-12);
  });
  it("wobble oscillates around start", () => {
    const v = pitchAutoValue("wobble", 0.25, { start: 0, depth: 2, rateHz: 1 });
    expect(v).toBeCloseTo(2);
  });
});

describe("psbs", () => {
  it("phi crossovers ladder by phi", () => {
    const c = phiCrossovers(55, 3);
    expect(c[0]).toBeCloseTo(55);
    expect(c[1]).toBeCloseTo(Math.round(55 * PHI * 100) / 100);
  });
});

describe("rco", () => {
  it("weapon profile has 9 sections", () => {
    const c = rcoEnergyCurve("weapon", 150, 4);
    expect(c.totalBars).toBe(112);
    expect(c.timeS.length).toBe(c.energy.length);
    expect(Math.max(...c.energy)).toBe(1.0);
  });
});

describe("midi", () => {
  it("note<->freq round trip", () => {
    expect(midiNoteToFreq(69)).toBeCloseTo(440);
    expect(freqToMidiNote(440)).toBe(69);
  });
});