// @ts-check
// Derived views of a result: cost timeline, Variable X weights, severity.

/**
 * Year 1: response, counsel, notification, monitoring, business impact, premium increase.
 * Year 2+: regulatory fines, class-action settlement and defence (resolve 12-36 months later).
 * Variable X (brand & reputation) is deliberately not given a dollar value.
 */
export function costTimeline({ tech, legal, business, insurance }) {
  const year1 = tech.total + legal.counsel + legal.notification + legal.doubleExtortionSurcharge
    + legal.credit + business.total + insurance.premiumIncrease;
  const year2Plus = legal.fines + legal.settlement + legal.defence;
  return { year1, year2Plus, total: year1 + year2Plus };
}

/** @param {string} incidentId @param {string} industry @param {any} model */
export function variableXWeights(incidentId, industry, model) {
  const base = model.variableX.weights.v[incidentId];
  const shift = model.variableX.industryShift.v[industry] || {};
  /** @type {Record<string, number>} */
  const w = { ...base };
  for (const [k, v] of Object.entries(shift)) w[k] = (w[k] || 0) + /** @type {number} */ (v);
  const sum = Object.values(w).reduce((a, b) => a + b, 0);
  for (const k of Object.keys(w)) w[k] = w[k] / sum;
  return w;
}

/**
 * Severity is the exposure the organisation itself bears (net of insurance when a
 * policy is entered) as a share of annual revenue, with the Canadian average breach
 * cost as a secondary reference.
 * @param {number} netTotal @param {number} revenue @param {any} model
 */
export function severity(netTotal, revenue, model) {
  const t = model.benchmark.severityTiers.v;
  const ratio = netTotal / revenue;
  const tier = ratio < t.medium ? 'low' : ratio < t.high ? 'medium' : ratio < t.critical ? 'high' : 'critical';
  const benchmark = model.benchmark.averageBreachCost.v;
  return { tier, ratio, benchmark, benchmarkRatio: netTotal / benchmark };
}
