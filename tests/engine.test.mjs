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
