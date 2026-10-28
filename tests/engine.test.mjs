import test from 'node:test';
import { calculate } from '../js/engine/calculate.js';
import { SCENARIOS } from './tools/legacy-harness.mjs';
import { loadJSON, assertClose } from './helpers.mjs';

const model = loadJSON('data/model.json');
const golden = loadJSON('tests/golden-legacy.json');

// Same numeric shape the legacy harness records.
function numbers(r) {
  return {
    tech: r.tech,
    legal: r.legal,
    business: r.business,
    grossTotal: r.grossTotal,
    insurance: { covered: r.insurance.covered, premiumIncrease: r.insurance.premiumIncrease },
    netTotal: r.netTotal,
    timeline: { year1: r.timeline.year1, year2Plus: r.timeline.year2Plus },
  };
}

for (const [name, s] of Object.entries(SCENARIOS)) {
  test(`engine matches legacy: ${name}`, () => {
    const inputs = { ...s, insurance: s.insurance ?? null };
    assertClose(numbers(calculate(inputs, model)), golden[name]);
  });
}
