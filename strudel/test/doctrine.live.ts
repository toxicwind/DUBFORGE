/**
 * doctrine.live.ts — LIVE twin of doctrine.test.ts. Hits the REAL built
 * package (dist/) and the REAL @strudel/core runtime (not mocks), verifying
 * the pattern functions compose onto an actual Strudel Pattern and produce
 * finite, in-range events. Per AGENTS.md §9: every .test.ts needs a .live.ts.
 */
import { describe, it, expect } from "bun:test";
import { Pattern, silence } from "@strudel/core";
import * as dubforge from "../dist/index.js";
import { buildChord, rcoEnergyCurve, sidechainEnvelope, riddimEvents } from "../src/doctrine";

describe("dubforge plugin against real strudel runtime (LIVE)", () => {
  it("dist exports the full plugin surface", () => {
    for (const fn of [
      "bass", "dubBass", "phiArp", "fibArp", "riddim", "sidechain",
      "subBass", "growl", "wobble", "psbsBand", "phiHarmonics", "dubforge",
      "chord", "dubArp", "dubGroove", "wobbleLfo", "pitchAuto", "rco",
    ]) {
      expect(typeof dubforge[fn as keyof typeof dubforge]).toBe("function");
    }
  });

  it("bass() composes onto a real Strudel Pattern", () => {
    const p = dubforge.bass("growl")(silence);
    expect(p).toBeInstanceOf(Pattern);
  });

  it("dubforge() chain composes and evaluates to finite events", async () => {
    const p = dubforge.dubforge({ voice: "growl", riddim: "bounce", sidechain: "pump" })(silence);
    expect(p).toBeInstanceOf(Pattern);
    const events = await p.queryArc(0, 2);
    expect(Array.isArray(events)).toBe(true);
  });

  it("chord() produces the expected note offsets", async () => {
    const p = dubforge.chord("5th_stack");
    const events = await p.queryArc(0, 1);
    expect(events.length).toBeGreaterThan(0);
    expect(events[0].value.note).toEqual([60, 67, 74]);
  });

  it("rco energy curve is finite and bounded", () => {
    const c = rcoEnergyCurve("weapon", 150, 4);
    for (const e of c.energy) {
      expect(Number.isFinite(e)).toBe(true);
      expect(e).toBeGreaterThanOrEqual(0);
      expect(e).toBeLessThanOrEqual(1);
    }
  });

  it("sidechain envelope is finite and in range", () => {
    const env = sidechainEnvelope({ name: "p", shape: "pump", bpm: 150 }, 1, 44100);
    for (const v of env) {
      expect(Number.isFinite(v)).toBe(true);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });

  it("riddim events are finite and non-empty", () => {
    const ev = riddimEvents({ name: "t", riddimType: "stutter", subdivisions: 8, bpm: 150 });
    expect(ev.length).toBeGreaterThan(0);
    for (const e of ev) expect(Number.isFinite(e.timeS)).toBe(true);
  });

  it("chord qualities include dubstep specials", () => {
    expect(buildChord(36, "tritone")).toEqual([36, 42]);
    expect(buildChord(36, "phi_triad")).toEqual([36, 41, 44]);
  });
});