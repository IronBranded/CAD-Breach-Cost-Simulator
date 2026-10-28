// Legal, regulatory and settlement exposure.

export function resolveRegime(province, industry, model) {
  if (province === 'FED' && model.regimes.federalFinancialIndustries.includes(industry)) return 'FIN';
  return province;
}

export function expectedFine({ regime, phi, revenueValue }, model) {
  const f = model.regimes.v[regime].fine;
  let amount;
  if (f.type === 'revenuePct') {
    const cap = Math.max(f.capFixed, revenueValue * f.capRevenuePct);
    amount = Math.min(cap, revenueValue * (phi ? f.pctPhi : f.pct));
  } else {
    amount = phi ? f.amountPhi : f.amount;
  }
  return amount * f.probability;
}

export function settlementReserve({ bucket, phi, industry }, model) {
  const s = model.settlement.v;
  const sensitive = phi || industry === 'finance';
  const prob = sensitive ? bucket.classActionProbSensitive : bucket.classActionProb;
  if (!prob) return 0;
  let perIndividual = s.basePerIndividual;
  if (phi) perIndividual += s.phiPremium;
  if (industry === 'finance') perIndividual += s.financePremium;
  return bucket.classActionIndividuals * perIndividual * prob;
}

export function legalCosts({ inputs, incident, revenueBracket, dataExposed, doubleExtortion }, model) {
  const rev = model.revenue.v[revenueBracket];
  const n = model.notification;
  const regime = resolveRegime(inputs.province, inputs.industry, model);

  const counsel = incident.counselHours * rev.effortMult * model.rates.breachCounsel.v;
  if (!dataExposed) {
    // No personal information exposed: no notification, monitoring, privacy fine or class action.
    return { counsel, fines: 0, settlement: 0, notification: 0, doubleExtortionSurcharge: 0, credit: 0, total: counsel, regime };
  }

  const bucket = model.records.v[inputs.records];
  const fines = expectedFine({ regime, phi: inputs.phi, revenueValue: rev.representative }, model);
  const settlement = settlementReserve({ bucket, phi: inputs.phi, industry: inputs.industry }, model);

  const notifyRate = doubleExtortion ? bucket.doubleExtortionNotifyRate : n.baseRatePerIndividual.v;
  const notification = bucket.individuals * notifyRate;
  const doubleExtortionSurcharge = doubleExtortion
    ? bucket.individuals * bucket.doubleExtortionNotifyRate * n.doubleExtortionSurcharge.v
    : 0;
  const credit = bucket.individuals * (inputs.phi ? n.creditMonitoring.v.phi : n.creditMonitoring.v.standard);

  const total = counsel + fines + settlement + notification + doubleExtortionSurcharge + credit;
  return { counsel, fines, settlement, notification, doubleExtortionSurcharge, credit, total, regime };
}
