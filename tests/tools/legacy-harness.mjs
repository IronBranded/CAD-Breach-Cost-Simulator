// Runs the calculation code embedded in the legacy single-file index.html
// inside a Node VM with a minimal DOM stub, so its outputs can be recorded
// as golden values before the refactor.
//
//   node tests/tools/legacy-harness.mjs            -> writes tests/golden-legacy.json
//
import { readFileSync, writeFileSync } from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');

export function loadLegacy(htmlPath = join(root, 'index.html')) {
  const html = readFileSync(htmlPath, 'utf8');
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  const main = scripts.find(s => s.includes('function runCalc'));
  if (!main) throw new Error('runCalc not found in legacy index.html');

  const elements = new Map();
  const stub = id => {
    if (!elements.has(id)) {
      const cls = new Set();
      elements.set(id, {
        id, value: '', checked: false, textContent: '', innerHTML: '', style: {},
        classList: {
          add: c => cls.add(c), remove: c => cls.delete(c),
          toggle: (c, on) => ((on ?? !cls.has(c)) ? cls.add(c) : cls.delete(c)),
          contains: c => cls.has(c),
        },
        setAttribute() {}, addEventListener() {},
      });
    }
    return elements.get(id);
  };
  const document = {
    getElementById: stub, addEventListener() {}, querySelector: () => null,
    documentElement: {},
  };
  const context = vm.createContext({
    window: {}, document, performance: { now: () => 0 },
    requestAnimationFrame: () => 0, setTimeout: () => 0, console,
  });
  vm.runInContext(main, context);

  return function legacyCalc(input, lang = 'en') {
    vm.runInContext(`lang = ${JSON.stringify(lang)};`, context);
    stub('incidentType').value = input.incident;
    stub('industryType').value = input.industry;
    stub('recordCount').value = input.records;
    stub('revenueBracket').value = input.revenue;
    stub('rootCause').value = input.cause;
    stub('provinceSelect').value = input.province;
    stub('hasPHI').checked = !!input.phi;
    stub('hasExfil').checked = !!input.exfil;
    stub('hasInsurance').checked = !!input.insurance;
    stub('insLimit').value = input.insurance ? String(input.insurance.limit) : '';
    stub('insDeductible').value = input.insurance ? String(input.insurance.deductible) : '';
    return vm.runInContext('runCalc()', context);
  };
}

// Numeric projection of a legacy runCalc() result (labels dropped).
export function legacyNumbers(r) {
  const known = r.legal.costCounsel + r.legal.fineExposure + r.legal.settlementRisk
    + r.legal.costNotify + r.legal.costCredit;
  return {
    tech: { ir: r.tech.costIR, forensics: r.tech.costForensics, it: r.tech.costIT, total: r.tech.total },
    legal: {
      counsel: r.legal.costCounsel, fines: r.legal.fineExposure, settlement: r.legal.settlementRisk,
      notification: r.legal.costNotify, doubleExtortionSurcharge: r.legal.total - known,
      credit: r.legal.costCredit, total: r.legal.total, regime: r.regimeKey,
    },
    business: { operations: r.biz.costOps, remediation: r.biz.costRemediation, extortion: r.biz.ransom, total: r.biz.total },
    grossTotal: r.grossTotal,
    insurance: { covered: r.insuranceCovered, premiumIncrease: r.premiumHike },
    netTotal: r.netTotal,
    timeline: { year1: r.year1Total, year2Plus: r.year2PlusTotal },
  };
}

import { SCENARIOS } from '../scenarios.mjs';
export { SCENARIOS };

// Legacy root-cause values, keyed by the new ids.
export const LEGACY_CAUSE = { phishing: 'Human Error', vuln: 'Exploited Vuln', thirdParty: 'Third Party' };

export function toLegacyInput(s) {
  return { ...s, cause: LEGACY_CAUSE[s.cause], exfil: s.exfil ?? s.dataExposed };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const calc = loadLegacy();
  const out = {};
  for (const [name, s] of Object.entries(SCENARIOS)) out[name] = legacyNumbers(calc(toLegacyInput(s)));
  writeFileSync(join(root, 'tests', 'golden-legacy.json'), JSON.stringify(out, null, 2) + '\n');
  console.log(`wrote ${Object.keys(out).length} legacy golden scenarios`);
}
