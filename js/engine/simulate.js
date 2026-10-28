// @ts-check
// Monte Carlo range of outcomes. Deterministic for a given scenario: the seed is
// derived from the inputs and model version, so a shared link shows the same range.
import { calculate } from './calculate.js?v=2026.11.0';

/** Small, fast seeded PRNG (mulberry32). Returns floats in [0, 1). */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 32-bit FNV-1a hash of a string. */
export function hashSeed(text) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** JSON with sorted keys, so the same scenario always hashes to the same seed. */
export function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().filter(k => value[k] !== undefined).map(k => `${JSON.stringify(k)}:${canonical(value[k])}`).join(',')}}`;
  }
  return JSON.stringify(value ?? null);
}

/** Triangular distribution by inverse CDF (min a, mode c, max b). */
export function triangular(u, a, c, b) {
  if (b === a) return c;
  const fc = (c - a) / (b - a);
  return u < fc ? a + Math.sqrt(u * (b - a) * (c - a)) : b - Math.sqrt((1 - u) * (b - a) * (b - c));
}

function quantile(sorted, q) {
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

function summarise(values, points) {
  const sorted = Float64Array.from(values).sort();
  const n = sorted.length;
  const mean = sorted.reduce((a, b) => a + b, 0) / n;
  // Loss exceedance curve: probability that the loss exceeds x.
  const curve = [];
  for (let i = 0; i <= points; i++) {
    const q = Math.min(0.995, i / points);
    curve.push({ loss: quantile(sorted, q), exceed: 1 - q });
  }
  return {
    p10: quantile(sorted, 0.1), p50: quantile(sorted, 0.5), p90: quantile(sorted, 0.9),
    p99: quantile(sorted, 0.99), mean, min: sorted[0], curve,
  };
}

/**
 * @param {import('../types.js').Inputs} inputs
 * @param {any} model
 * @param {{ runs?: number, seed?: number, points?: number }} [opts]
 */
export function simulate(inputs, model, opts = {}) {
  const runs = opts.runs ?? model.uncertainty.runs;
  const seed = opts.seed ?? hashSeed(canonical(inputs) + '|' + model.version);
  const rng = mulberry32(seed);
  const u = model.uncertainty.v;
  const tri = spec => triangular(rng(), spec.low, 1, spec.high);
  const net = new Float64Array(runs);
  const gross = new Float64Array(runs);
  let fineEvents = 0;
  let classActionEvents = 0;
  for (let i = 0; i < runs; i++) {
    const draw = {
      sampled: true,
      effort: tri(u.effort), downtime: tri(u.downtime), counsel: tri(u.counsel),
      extortion: tri(u.extortion), unitCosts: tri(u.unitCosts), remediation: tri(u.remediation),
      fineRoll: rng(), fineSeverity: tri(u.fineSeverity),
      classActionRoll: rng(), settlementSeverity: tri(u.settlementSeverity), defenceSeverity: tri(u.defenceSeverity),
    };
    const r = calculate(inputs, model, draw);
    net[i] = r.netTotal;
    gross[i] = r.grossTotal;
    if (r.legal.fines > 0) fineEvents++;
    if (r.legal.settlement > 0) classActionEvents++;
  }
  const points = opts.points ?? 60;
  return {
    runs, seed,
    net: summarise(net, points),
    gross: summarise(gross, points),
    fineShare: fineEvents / runs,
    classActionShare: classActionEvents / runs,
  };
}
