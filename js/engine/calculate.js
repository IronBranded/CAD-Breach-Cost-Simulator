// @ts-check
// Pure calculation entry point: (inputs, model[, draw]) -> result.
// No DOM, no language, no globals. Labels are the UI's job.
import { technicalCosts } from './technical.js?v=2026.11.0';
import { legalCosts } from './legal.js?v=2026.11.0';
import { businessCosts } from './business.js?v=2026.11.0';
import { applyInsurance } from './insurance.js?v=2026.11.0';
import { costTimeline, variableXWeights, severity } from './projection.js?v=2026.11.0';
import { sizeProfile } from './scale.js?v=2026.11.0';
import { effectiveFactors } from './controls.js?v=2026.11.0';

/** Point estimate: every multiplier at its most likely value, events as expected values. */
export const POINT = Object.freeze({
  sampled: false, effort: 1, downtime: 1, counsel: 1, extortion: 1, unitCosts: 1, remediation: 1,
  fineRoll: 0, fineSeverity: 1, classActionRoll: 0, settlementSeverity: 1, defenceSeverity: 1,
});

/** @param {any} incident @param {import('../types.js').Inputs} inputs */
export function isDataExposed(incident, inputs) {
  return incident.dataExposure === 'always' || (incident.dataExposure === 'optional' && !!inputs.dataExposed);
}

/**
 * @param {import('../types.js').Inputs} inputs
 * @param {any} model  data/model.json
 * @param {import('../types.js').Draw} [draw] Monte Carlo draw (see simulate.js); omit for the point estimate
 */
export function calculate(inputs, model, draw = POINT) {
  const incident = model.incidents.v[inputs.incident];
  const industry = model.industries.v[inputs.industry];
  const cause = model.causes.v[inputs.cause];
  const regimeOk = inputs.sector === 'private' || inputs.sector === 'public';
  if (!incident || !industry || !cause || !regimeOk || !(inputs.revenue > 0)) {
    throw new Error('calculate: invalid inputs ' + JSON.stringify(inputs));
  }
  const dataExposed = isDataExposed(incident, inputs);
  if (dataExposed && !model.records.v[/** @type {string} */ (inputs.records)]) {
    throw new Error('calculate: records bucket required when personal information is exposed');
  }
  const doubleExtortion = dataExposed && !!incident.exposureIsDoubleExtortion;
  const factors = effectiveFactors(inputs, model);
  const size = sizeProfile(inputs, model);

  const irHours = incident.irHours * size.irEffort * factors.irEffort * draw.effort;
  const downtimeDays = incident.downtimeDays * factors.downtime * draw.downtime;

  const tech = technicalCosts({ irHours, cause, factors }, model);
  const legal = legalCosts({ inputs, incident, size, factors, dataExposed, doubleExtortion, draw }, model);
  const business = businessCosts({ inputs, incident, industry, downtimeDays, size, factors, draw }, model);
  const grossTotal = tech.total + legal.total + business.total;
  const insurance = applyInsurance(
    { grossTotal, operations: business.operations, downtimeDays, isRansomware: !!incident.ransomDecision },
    inputs.insurance, model);

  return {
    inputs,
    dataExposed,
    doubleExtortion,
    ransomUnpaid: factors.ransomUnpaid,
    sizeBasis: size.basis,
    tech, legal, business,
    grossTotal,
    insurance,
    netTotal: insurance.netTotal,
    timeline: costTimeline({ tech, legal, business, insurance }),
    variableX: variableXWeights(inputs.incident, inputs.industry, model),
    severity: severity(insurance.netTotal, inputs.revenue, model),
    revenueValue: inputs.revenue,
    onePercentOfRevenue: inputs.revenue * 0.01,
  };
}
