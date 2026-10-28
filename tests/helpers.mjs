import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

export const loadJSON = rel => JSON.parse(readFileSync(new URL('../' + rel, import.meta.url), 'utf8'));

// Deep comparison with a relative tolerance for floating-point sums.
export function assertClose(actual, expected, path = '') {
  if (typeof expected === 'number') {
    assert.equal(typeof actual, 'number', `${path}: expected a number`);
    const tol = Math.max(1e-6, Math.abs(expected) * 1e-9);
    assert.ok(Math.abs(actual - expected) <= tol, `${path}: ${actual} != ${expected}`);
    return;
  }
  if (expected && typeof expected === 'object') {
    assert.deepEqual(Object.keys(actual ?? {}).sort(), Object.keys(expected).sort(), `${path}: keys differ`);
    for (const k of Object.keys(expected)) assertClose(actual[k], expected[k], path ? `${path}.${k}` : k);
    return;
  }
  assert.equal(actual, expected, path);
}

// The parts of a result recorded in golden.json (inputs excluded).
export function goldenView(r) {
  const { inputs, ...rest } = r;
  return JSON.parse(JSON.stringify(rest));
}

// Simulation summary recorded in golden.json (curve excluded to keep the file small).
export function simulationView(sim) {
  const pick = ({ p10, p50, p90, p99, mean }) => ({ p10, p50, p90, p99, mean });
  return { seed: sim.seed, runs: sim.runs, net: pick(sim.net), gross: pick(sim.gross), fineShare: sim.fineShare, classActionShare: sim.classActionShare };
}
