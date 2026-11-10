// Ambient declarations for @strudel/core (upstream ships no types).
// Minimal surface for the dubforge plugin: Pattern, silence, pure.
declare module '@strudel/core' {
  export interface HapValue {
    note?: number | number[];
    n?: number;
    s?: string;
    gain?: number;
    cutoff?: number;
    resonance?: number;
    attack?: number;
    release?: number;
    [key: string]: unknown;
  }
  export interface Hap {
    value: HapValue;
    whole: { begin: number; end: number };
    part: { begin: number; end: number };
  }
  export class Pattern {
    s(v: unknown): Pattern;
    note(v: unknown): Pattern;
    cutoff(v: unknown): Pattern;
    resonance(v: unknown): Pattern;
    attack(v: unknown): Pattern;
    release(v: unknown): Pattern;
    gain(v: unknown): Pattern;
    mult(v: number): Pattern;
    fast(v: number): Pattern;
    fmap(fn: (v: HapValue) => HapValue): Pattern;
    queryArc(begin: number, end: number): Promise<Hap[]>;
  }
  export const silence: Pattern;
  export function pure(value: unknown): Pattern;
  export function evalScope(...modules: Array<unknown | Promise<unknown>>): Promise<unknown[]>;
}