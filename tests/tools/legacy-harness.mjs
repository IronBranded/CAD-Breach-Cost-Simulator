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

// Named scenarios used as golden fixtures. Legacy root-cause values are
// mapped from the new ids so the same list drives both implementations.
export const LEGACY_CAUSE = { phishing: 'Human Error', vuln: 'Exploited Vuln', thirdParty: 'Third Party' };

export const SCENARIOS = {
  'ransomware-qc-health-mid-phi-exfil-insured': { incident: 'Ransomware', industry: 'health', records: 'High', revenue: 'Mid', cause: 'phishing', province: 'QC', phi: true, exfil: true, insurance: { limit: 2_000_000, deductible: 50_000 } },
  'ransomware-on-retail-small-no-exfil': { incident: 'Ransomware', industry: 'retail', records: 'Medium', revenue: 'Small', cause: 'vuln', province: 'ON', phi: false, exfil: false },
  'ransomware-large-over-limit': { incident: 'Ransomware', industry: 'mfg', records: 'Critical', revenue: 'Large', cause: 'thirdParty', province: 'AB', phi: false, exfil: true, insurance: { limit: 5_000_000, deductible: 250_000 } },
  'ransomware-deductible-above-limit': { incident: 'Ransomware', industry: 'energy', records: 'Low', revenue: 'Small', cause: 'phishing', province: 'BC', phi: false, exfil: false, insurance: { limit: 100_000, deductible: 150_000 } },
  'bec-other-legal-micro': { incident: 'BEC', industry: 'legal', records: 'Low', revenue: 'Micro', cause: 'phishing', province: 'OTHER', phi: false },
  'bec-deductible-above-gross': { incident: 'BEC', industry: 'tech', records: 'Low', revenue: 'Micro', cause: 'phishing', province: 'ON', phi: false, insurance: { limit: 1_000_000, deductible: 500_000 } },
  'databreach-fed-finance-large-phi': { incident: 'DataBreach', industry: 'finance', records: 'Critical', revenue: 'Large', cause: 'thirdParty', province: 'FED', phi: true },
  'databreach-bc-tech-mid-critical': { incident: 'DataBreach', industry: 'tech', records: 'Critical', revenue: 'Mid', cause: 'vuln', province: 'BC', phi: false },
  'databreach-on-finance-medium': { incident: 'DataBreach', industry: 'finance', records: 'Medium', revenue: 'Small', cause: 'phishing', province: 'ON', phi: false },
  'databreach-qc-large-phi-critical': { incident: 'DataBreach', industry: 'health', records: 'Critical', revenue: 'Large', cause: 'vuln', province: 'QC', phi: true },
  'insider-ab-gov-small-high': { incident: 'Insider', industry: 'gov', records: 'High', revenue: 'Small', cause: 'phishing', province: 'AB', phi: false },
  'insider-other-edu-micro-low': { incident: 'Insider', industry: 'edu', records: 'Low', revenue: 'Micro', cause: 'thirdParty', province: 'OTHER', phi: false },
  'dos-qc-telco-large-critical': { incident: 'DoS', industry: 'telco', records: 'Critical', revenue: 'Large', cause: 'vuln', province: 'QC', phi: false },
  'dos-fed-telco-mid': { incident: 'DoS', industry: 'telco', records: 'High', revenue: 'Mid', cause: 'phishing', province: 'FED', phi: false },
};

export function toLegacyInput(s) {
  return { ...s, cause: LEGACY_CAUSE[s.cause] };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const calc = loadLegacy();
  const out = {};
  for (const [name, s] of Object.entries(SCENARIOS)) out[name] = legacyNumbers(calc(toLegacyInput(s)));
  writeFileSync(join(root, 'tests', 'golden-legacy.json'), JSON.stringify(out, null, 2) + '\n');
  console.log(`wrote ${Object.keys(out).length} legacy golden scenarios`);
}
