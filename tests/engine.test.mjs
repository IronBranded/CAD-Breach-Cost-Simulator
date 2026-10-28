import test from 'node:test';
import assert from 'node:assert/strict';
import { calculate } from '../js/engine/calculate.js';
import { simulate, canonical } from '../js/engine/simulate.js';
import { controlSavings, ransomComparison } from '../js/engine/savings.js';
import { logInterp } from '../js/engine/scale.js';
import { SCENARIOS } from './scenarios.mjs';
import { loadJSON, assertClose, goldenView, simulationView } from './helpers.mjs';

const model = loadJSON('data/model.json');
const golden = loadJSON('tests/golden.json');

test('golden.json was generated from the current model version', () => {
  assert.equal(golden.modelVersion, model.version);
});

for (const [name, s] of Object.entries(SCENARIOS)) {
  test(`golden point estimate: ${name}`, () => assertClose(goldenView(calculate(s, model)), golden.scenarios[name].point, name));
  test(`golden simulated range: ${name}`, () => assertClose(simulationView(simulate(s, model)), golden.scenarios[name].range, name));
}

// A compact grid over the inputs that drive the model.
function* grid() {
  for (const incident of Object.keys(model.incidents.v))
    for (const industry of ['finance', 'health', 'gov', 'retail'])
      for (const revenue of [400_000, 3_000_000, 40_000_000, 2_000_000_000])
        for (const sector of ['private', 'public'])
          for (const province of ['QC', 'ON', 'FED'])
            for (const dataExposed of [false, true])
              yield { incident, industry, sector, province, revenue, cause: 'phishing', records: 'High', phi: industry === 'health',
                dataExposed, employees: null, controls: {}, insurance: null, ransomPaid: true };
}

test('operations loss never exceeds the revenue earned during the outage (plus extra operating cost)', () => {
  const extra = 1 + model.businessInterruption.v.extraCostRate;
  for (const s of grid()) {
    const r = calculate(s, model);
    const earned = (s.revenue / 365) * r.business.downtimeDays;
    assert.ok(r.business.operations <= earned * extra + 1e-6, JSON.stringify(s));
  }
});

test('public bodies carry no modelled monetary penalty; private regimes do', () => {
  for (const s of grid()) {
    const r = calculate(s, model);
    if (!r.dataExposed) continue;
    if (s.sector === 'public') {
      assert.equal(r.legal.fines, 0);
      assert.ok(r.legal.regime.endsWith('_PUB'));
    } else {
      assert.ok(r.legal.fines > 0, r.legal.regime);
    }
  }
});

test('severity is the exposure the organisation bears (net of insurance) as a share of revenue', () => {
  for (const s of grid()) {
    for (const insurance of [null, { limit: 2_000_000, deductible: 50_000 }]) {
      const r = calculate({ ...s, insurance }, model);
      assertClose(r.severity.ratio, r.netTotal / s.revenue, 'ratio');
    }
  }
});

test('size scaling: more revenue never means less response effort; inputs between anchors differ', () => {
  const s = model.scale.v;
  let prev = 0;
  for (const rev of [1e5, 1e6, 2e6, 1.1e7, 9.9e7, 5e8, 5e9]) {
    const v = logInterp(s.revenue, s.irEffort, rev);
    assert.ok(v >= prev);
    prev = v;
  }
  assert.notEqual(calculate(SCENARIOS['dos-fed-telco-11m-vs-99m-a'], model).grossTotal,
    calculate(SCENARIOS['dos-fed-telco-11m-vs-99m-b'], model).grossTotal);
});

test('security controls never increase net exposure', () => {
  for (const s of grid()) {
    for (const c of controlSavings(s, model)) assert.ok(c.saving >= -1e-6, `${c.id} ${JSON.stringify(s)}`);
  }
});

test('ransom decision: not paying removes the ransom but lengthens disruption unless backups exist', () => {
  const s = SCENARIOS['ransomware-on-retail-5m-no-exfil'];
  const paid = calculate({ ...s, ransomPaid: true }, model);
  const unpaid = calculate({ ...s, ransomPaid: false }, model);
  const unpaidBackups = calculate({ ...s, ransomPaid: false, controls: { backups: true } }, model);
  assert.equal(unpaid.business.extortion, 0);
  assert.ok(paid.business.extortion > 0);
  assert.ok(unpaid.business.downtimeDays > paid.business.downtimeDays);
  assert.ok(unpaidBackups.business.downtimeDays < unpaid.business.downtimeDays);
  assert.ok(ransomComparison(s, model));
  assert.equal(ransomComparison(SCENARIOS['bec-other-legal-1m'], model), null);
});

test('insurance never makes net exposure exceed gross + premium increase', () => {
  const base = SCENARIOS['bec-deductible-above-gross'];
  for (const policy of [
    { limit: 1_000_000, deductible: 500_000 }, { limit: 100_000, deductible: 150_000 }, { limit: 50_000, deductible: 0 },
    { limit: 10_000_000, deductible: 25_000, coinsurance: 0.5, ransomwareSublimit: 100_000, waitingHours: 48 },
  ]) {
    for (const incident of ['BEC', 'Ransomware']) {
      const r = calculate({ ...base, incident, insurance: policy }, model);
      assert.ok(r.netTotal <= r.grossTotal + r.insurance.premiumIncrease + 1e-6);
      assert.ok(r.insurance.covered >= 0 && r.insurance.covered <= policy.limit);
      if (r.insurance.covered === 0) assert.equal(r.insurance.premiumIncrease, 0);
    }
  }
});

test('ransomware sublimit and coinsurance only apply to ransomware', () => {
  const s = SCENARIOS['ransomware-500m-sublimit-coinsurance'];
  const r = calculate(s, model);
  assert.ok(r.insurance.covered <= s.insurance.ransomwareSublimit * (1 - s.insurance.coinsurance) + 1e-6);
  const bec = calculate({ ...s, incident: 'BEC', dataExposed: false, records: null }, model);
  assert.equal(bec.insurance.coinsurance, 0);
});

test('simulation is deterministic per scenario, ordered, and its curve is monotonic', () => {
  const s = SCENARIOS['ransomware-qc-health-50m-phi-exfil-insured'];
  const shuffled = Object.fromEntries(Object.entries(s).reverse());
  assert.equal(canonical(s), canonical(shuffled));
  const a = simulate(s, model);
  const b = simulate(shuffled, model);
  assert.deepEqual(a.net, b.net);
  assert.ok(a.net.p10 <= a.net.p50 && a.net.p50 <= a.net.p90 && a.net.p90 <= a.net.p99);
  for (let i = 1; i < a.net.curve.length; i++) {
    assert.ok(a.net.curve[i].loss >= a.net.curve[i - 1].loss);
    assert.ok(a.net.curve[i].exceed <= a.net.curve[i - 1].exceed);
  }
});

test('simulated event frequency matches the modelled probability', () => {
  const s = SCENARIOS['databreach-qc-health-500m-phi'];
  const sim = simulate(s, model, { runs: 20000 });
  assert.ok(Math.abs(sim.fineShare - model.regimes.v.QC.fine.probability) < 0.02, String(sim.fineShare));
  assert.ok(Math.abs(sim.classActionShare - model.records.v.Critical.classActionProbSensitive) < 0.02, String(sim.classActionShare));
});
