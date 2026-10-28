// Derived views of a result: cost timeline, Variable X weights, severity tier.

// Year 1: response, counsel, notification, monitoring, business impact, premium increase.
// Year 2+: regulatory fines and class-action settlements (resolve 12-36 months later).
// Years 3-5: Variable X projected as a share of annual revenue per year.
export function costTimeline({ tech, legal, business, insurance, revenueBracket }, model) {
  const year1 = tech.total + legal.counsel + legal.notification + legal.doubleExtortionSurcharge
    + legal.credit + business.total + insurance.premiumIncrease;
  const year2Plus = legal.fines + legal.settlement;
  const total = year1 + year2Plus;
  const rev = model.revenue.v[revenueBracket];
  const annualImpact = rev.representative * rev.varXRate;
  return {
    year1, year2Plus, total,
    variableX: {
      annualImpact,
      year3: total + annualImpact,
      year4: total + annualImpact * 2,
      year5: total + annualImpact * 3,
    },
  };
}

export function variableXWeights(incidentId, industry, model) {
  const base = model.variableX.weights.v[incidentId];
  const shift = model.variableX.industryShift.v[industry] || {};
  const w = { ...base };
  for (const [k, v] of Object.entries(shift)) w[k] = (w[k] || 0) + v;
  const sum = Object.values(w).reduce((a, b) => a + b, 0);
  for (const k of Object.keys(w)) w[k] = w[k] / sum;
  return w;
}

export function severity(grossTotal, model) {
  const avg = model.benchmark.averageBreachCost.v;
  const t = model.benchmark.severityTiers.v;
  const ratio = grossTotal / avg;
  const tier = ratio < t.medium ? 'low' : ratio < t.high ? 'medium' : ratio < t.critical ? 'high' : 'critical';
  return { tier, ratio, benchmark: avg };
}
