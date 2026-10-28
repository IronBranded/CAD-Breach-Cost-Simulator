// @ts-check
// Shared JSDoc types (no runtime code). Imported with `import('./types.js').X` in annotations.

/**
 * @typedef {'Ransomware'|'BEC'|'DataBreach'|'Insider'|'DoS'} IncidentId
 * @typedef {'Low'|'Medium'|'High'|'Critical'} RecordsBucket
 * @typedef {'private'|'public'} Sector
 * @typedef {'automation'|'backups'|'retainer'|'irPlan'|'encryption'} ControlId
 */

/**
 * @typedef {object} PolicyInput
 * @property {number} limit                Aggregate limit (the deductible sits inside it)
 * @property {number} deductible
 * @property {number|null} [premium]       Current annual premium; derived from the limit when absent
 * @property {number|null} [ransomwareSublimit]
 * @property {number|null} [coinsurance]   Share of ransomware loss retained by the insured (0-1)
 * @property {number|null} [waitingHours]  Business-interruption waiting period
 */

/**
 * @typedef {object} Inputs
 * @property {IncidentId} incident
 * @property {string} industry
 * @property {Sector} sector
 * @property {string} province              QC | ON | AB | BC | OTHER | FED
 * @property {string} cause                 phishing | vuln | thirdParty
 * @property {number} revenue               Annual revenue, CAD
 * @property {number|null} [employees]
 * @property {RecordsBucket|null} records   Required only when personal information is exposed
 * @property {boolean} phi
 * @property {boolean} dataExposed          For incidents whose dataExposure is 'optional'
 * @property {boolean} [ransomPaid]         Ransomware only (default true)
 * @property {boolean} [fraudReportedFast]  BEC only
 * @property {Partial<Record<ControlId, boolean>>} [controls]
 * @property {PolicyInput|null} insurance
 */

/**
 * Random draws for one Monte Carlo run. Absent = point estimate
 * (multipliers 1, probabilistic items as expected values).
 * @typedef {object} Draw
 * @property {boolean} sampled
 * @property {number} effort
 * @property {number} downtime
 * @property {number} counsel
 * @property {number} extortion
 * @property {number} unitCosts
 * @property {number} remediation
 * @property {number} fineRoll           uniform [0,1): the fine happens when below its probability
 * @property {number} fineSeverity
 * @property {number} classActionRoll    uniform [0,1): a class action is filed when below its probability
 * @property {number} settlementSeverity
 * @property {number} defenceSeverity
 */

export {};
