// Pure calculation entry point: (inputs, model) -> result.
// No DOM, no language, no globals. Labels are the UI's job.
import { technicalCosts } from './technical.js';
import { legalCosts } from './legal.js';
import { businessCosts } from './business.js';
import { applyInsurance } from './insurance.js';
import { costTimeline, variableXWeights, severity } from './projection.js';

/**
 * @param {object} inputs
 * @param {string} inputs.incident   Ransomware | BEC | DataBreach | Insider | DoS
 * @param {string} inputs.industry   key of model.industries
 * @param {string} inputs.records    Low | Medium | High | Critical
 * @param {string} inputs.revenue    Micro | Small | Mid | Large
 * @param {string} inputs.cause      phishing | vuln | thirdParty
 * @param {string} inputs.province   QC | ON | AB | BC | OTHER | FED
 * @param {boolean} inputs.phi
 * @param {boolean} inputs.exfil     ransomware only: data was also exfiltrated
 * @param {{limit:number, deductible:number}|null} inputs.insurance
 * @param {object} model             data/model.json
 */
export function calculate(inputs, model) {
  const incident = model.incidents.v[inputs.incident];
  const rev = model.revenue.v[inputs.revenue];
  const cause = model.causes.v[inputs.cause];
  const industryMult = model.industries.v[inputs.industry];
  if (!incident || !rev || !cause || industryMult === undefined || !model.records.v[inputs.records]) {
    throw new Error('calculate: invalid inputs ' + JSON.stringify(inputs));
  }

  const doubleExtortion = inputs.incident === 'Ransomware' && !!inputs.exfil;
  const irHours = incident.irHours * rev.effortMult * rev.irScaleCap;

  const tech = technicalCosts({ irHours, cause }, model);
  const legal = legalCosts({ inputs, incident, revenueBracket: inputs.revenue, doubleExtortion }, model);
  const business = businessCosts({ incident, revenueBracket: inputs.revenue, industryMult }, model);
  const grossTotal = tech.total + legal.total + business.total;
  const insurance = applyInsurance(grossTotal, inputs.insurance, model);

  return {
    inputs,
    doubleExtortion,
    tech, legal, business,
    grossTotal,
    insurance,
    netTotal: insurance.netTotal,
    timeline: costTimeline({ tech, legal, business, insurance, revenueBracket: inputs.revenue }, model),
    variableX: variableXWeights(inputs.incident, inputs.industry, model),
    severity: severity(grossTotal, model),
    revenueValue: rev.representative,
  };
}
