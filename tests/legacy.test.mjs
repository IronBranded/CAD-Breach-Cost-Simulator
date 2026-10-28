import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { loadLegacy, legacyNumbers, SCENARIOS, toLegacyInput } from './tools/legacy-harness.mjs';

const golden = JSON.parse(readFileSync(new URL('./golden-legacy.json', import.meta.url)));

test('legacy calculator reproduces recorded golden outputs', () => {
  const calc = loadLegacy();
  for (const [name, s] of Object.entries(SCENARIOS)) {
    assert.deepEqual(legacyNumbers(calc(toLegacyInput(s))), golden[name], name);
  }
});
