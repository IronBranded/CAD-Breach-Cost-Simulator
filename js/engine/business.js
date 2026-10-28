// @ts-check
// Business impact: operations disruption, post-incident remediation, ransom / fraud loss.
import { extortionAt } from './scale.js?v=2026.11.0';

/**
 * Operations loss is tied to revenue: it can never exceed the revenue the
 * organisation would have earned during the outage, plus extra operating cost.
 * @param {object} p
 * @param {import('../types.js').Inputs} p.inputs
 * @param {any} p.incident
 * @param {any} p.industry
 * @param {number} p.downtimeDays
 * @param {{remediation:number}} p.size
 * @param {{ransomUnpaid:boolean}} p.factors
 * @param {import('../types.js').Draw} p.draw
 * @param {any} model
 */
export function businessCosts({ inputs, incident, industry, downtimeDays, size, factors, draw }, model) {
  const dailyRevenue = inputs.revenue / 365;
  const operations = dailyRevenue * downtimeDays * incident.operationsImpact * industry.revenueAtRisk
    * (1 + model.businessInterruption.v.extraCostRate);
  const remediation = size.remediation * draw.remediation;

  let extortion = 0;
  if (incident.ransomDecision) {
    extortion = factors.ransomUnpaid ? 0 : extortionAt(incident, inputs.revenue, model) * draw.extortion;
  } else if (incident.fraudRecovery) {
    const recovered = inputs.fraudReportedFast ? model.decisions.v.becRecoveredShareIfReportedFast : 0;
    extortion = extortionAt(incident, inputs.revenue, model) * draw.extortion * (1 - recovered);
  }
  return { operations, remediation, extortion, total: operations + remediation + extortion, downtimeDays };
}
