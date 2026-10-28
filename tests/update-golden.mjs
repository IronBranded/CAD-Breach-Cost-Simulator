// Regenerates tests/golden.json from the current engine + model.
// Only run this when a change to the numbers is intended, and review the diff.
//
//   node tests/update-golden.mjs
import { writeFileSync } from 'node:fs';
import { calculate } from '../js/engine/calculate.js';
import { simulate } from '../js/engine/simulate.js';
import { SCENARIOS } from './scenarios.mjs';
import { loadJSON, goldenView, simulationView } from './helpers.mjs';

const model = loadJSON('data/model.json');
const out = { modelVersion: model.version, scenarios: {} };
for (const [name, s] of Object.entries(SCENARIOS)) {
  out.scenarios[name] = { point: goldenView(calculate(s, model)), range: simulationView(simulate(s, model)) };
}
writeFileSync(new URL('./golden.json', import.meta.url), JSON.stringify(out, null, 2) + '\n');
console.log(`golden.json: ${Object.keys(out.scenarios).length} scenarios, model ${model.version}`);
