import test from 'node:test';
import { calculate } from '../js/engine/calculate.js';
import { SCENARIOS } from './scenarios.mjs';
import { loadJSON, assertClose, goldenView } from './helpers.mjs';

const model = loadJSON('data/model.json');
const golden = loadJSON('tests/golden.json');

test('golden.json was generated from the current model version', () => {
  assertClose(golden.modelVersion, model.version, 'modelVersion');
});

for (const [name, s] of Object.entries(SCENARIOS)) {
  test(`golden: ${name}`, () => assertClose(goldenView(calculate(s, model)), golden.scenarios[name], name));
}

test('insurance never makes net exposure exceed gross + premium increase', () => {
  const base = SCENARIOS['bec-deductible-above-gross'];
  for (const [limit, deductible] of [[1_000_000, 500_000], [100_000, 150_000], [50_000, 0], [10_000_000, 25_000]]) {
    const r = calculate({ ...base, insurance: { limit, deductible } }, model);
    const ok = r.netTotal <= r.grossTotal + r.insurance.premiumIncrease + 1e-6 && r.insurance.covered >= 0;
    if (!ok) throw new Error(`limit ${limit} deductible ${deductible}: net ${r.netTotal} gross ${r.grossTotal}`);
    if (r.insurance.covered === 0 && r.insurance.premiumIncrease !== 0) throw new Error('premium increase without a paid claim');
  }
});
