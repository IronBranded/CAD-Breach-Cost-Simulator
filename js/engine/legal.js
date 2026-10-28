// @ts-check
// Legal, regulatory and class-action exposure.

/**
 * @param {string} province
 * @param {string} industry
 * @param {import('../types.js').Sector} sector
 * @param {any} model
 */
export function resolveRegime(province, industry, sector, model) {
  if (sector === 'public') return `${province}_PUB`;
  if (province === 'FED' && model.regimes.federalFinancialIndustries.includes(industry)) return 'FIN';
  return province;
}

/** Fine amount if a penalty is imposed (before probability). */
export function fineAmount(regime, phi, revenue, model) {
  const f = model.regimes.v[regime].fine;
  if (f.type === 'none') return { amount: 0, probability: 0 };
  if (f.type === 'revenuePct') {
    const cap = Math.max(f.capFixed, revenue * f.capRevenuePct);
    return { amount: Math.min(cap, revenue * (phi ? f.pctPhi : f.pct)), probability: f.probability };
  }
  return { amount: phi ? f.amountPhi : f.amount, probability: f.probability };
}

/**
 * Point estimate: probabilistic items are expected values (amount x probability).
 * Monte Carlo (draw.sampled): each event happens or not, with a random severity.
 * @param {object} p
 * @param {import('../types.js').Inputs} p.inputs
 * @param {any} p.incident
 * @param {{counselEffort:number}} p.size
 * @param {{rates:number, counsel:number, individuals:number}} p.factors
 * @param {boolean} p.dataExposed
 * @param {boolean} p.doubleExtortion
 * @param {import('../types.js').Draw} p.draw
 * @param {any} model
 */
export function legalCosts({ inputs, incident, size, factors, dataExposed, doubleExtortion, draw }, model) {
  const regime = resolveRegime(inputs.province, inputs.industry, inputs.sector, model);
  const counsel = incident.counselHours * size.counselEffort * model.rates.breachCounsel.v
    * factors.rates * factors.counsel * draw.counsel;
  const zero = { fines: 0, settlement: 0, defence: 0, notification: 0, doubleExtortionSurcharge: 0, credit: 0, individuals: 0 };
  if (!dataExposed) return { counsel, ...zero, total: counsel, regime };

  const bucket = model.records.v[/** @type {string} */ (inputs.records)];
  const n = model.notification;
  const individuals = bucket.individuals * factors.individuals;
  const sampled = !!draw.sampled;
  const event = (prob, roll, value, severity) => (sampled ? (roll < prob ? value * severity : 0) : value * prob);

  const fine = fineAmount(regime, inputs.phi, inputs.revenue, model);
  const fines = event(fine.probability, draw.fineRoll, fine.amount, draw.fineSeverity);

  const s = model.settlement.v;
  const sensitive = inputs.phi || inputs.industry === 'finance';
  const classProb = sensitive ? bucket.classActionProbSensitive : bucket.classActionProb;
  const perIndividual = s.basePerIndividual + (inputs.phi ? s.phiPremium : 0) + (inputs.industry === 'finance' ? s.financePremium : 0);
  const classRoll = draw.classActionRoll;
  const settlement = event(classProb, classRoll, individuals * perIndividual, draw.settlementSeverity);
  const defence = event(classProb, classRoll, bucket.defenceCost, draw.defenceSeverity);

  const notification = individuals * n.baseRatePerIndividual.v * draw.unitCosts;
  const doubleExtortionSurcharge = doubleExtortion ? notification * n.doubleExtortionSurcharge.v : 0;
  const credit = individuals * (inputs.phi ? n.creditMonitoring.v.phi : n.creditMonitoring.v.standard) * draw.unitCosts;

  const total = counsel + fines + settlement + defence + notification + doubleExtortionSurcharge + credit;
  return { counsel, fines, settlement, defence, notification, doubleExtortionSurcharge, credit, individuals, total, regime };
}
