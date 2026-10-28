// Named input scenarios used as golden fixtures for the engine tests.
const base = { employees: null, phi: false, dataExposed: false, controls: {}, insurance: null, records: null };

export const SCENARIOS = {
  'ransomware-qc-health-50m-phi-exfil-insured': { ...base, incident: 'Ransomware', industry: 'health', sector: 'private', records: 'High', revenue: 50_000_000, cause: 'phishing', province: 'QC', phi: true, dataExposed: true, ransomPaid: true, insurance: { limit: 2_000_000, deductible: 50_000 } },
  'ransomware-on-retail-5m-no-exfil': { ...base, incident: 'Ransomware', industry: 'retail', sector: 'private', revenue: 5_000_000, cause: 'vuln', province: 'ON', ransomPaid: true },
  'ransomware-on-retail-5m-not-paid': { ...base, incident: 'Ransomware', industry: 'retail', sector: 'private', revenue: 5_000_000, cause: 'vuln', province: 'ON', ransomPaid: false },
  'ransomware-not-paid-with-backups': { ...base, incident: 'Ransomware', industry: 'retail', sector: 'private', revenue: 5_000_000, cause: 'vuln', province: 'ON', ransomPaid: false, controls: { backups: true } },
  'ransomware-500m-sublimit-coinsurance': { ...base, incident: 'Ransomware', industry: 'mfg', sector: 'private', records: 'Critical', revenue: 500_000_000, employees: 2500, cause: 'thirdParty', province: 'AB', dataExposed: true, ransomPaid: true, insurance: { limit: 5_000_000, deductible: 250_000, ransomwareSublimit: 2_000_000, coinsurance: 0.2, waitingHours: 24, premium: 180_000 } },
  'ransomware-all-controls': { ...base, incident: 'Ransomware', industry: 'mfg', sector: 'private', records: 'High', revenue: 50_000_000, cause: 'phishing', province: 'BC', dataExposed: true, ransomPaid: true, controls: { automation: true, backups: true, retainer: true, irPlan: true, encryption: true } },
  'bec-other-legal-1m': { ...base, incident: 'BEC', industry: 'legal', sector: 'private', revenue: 1_000_000, cause: 'phishing', province: 'OTHER' },
  'bec-reported-fast': { ...base, incident: 'BEC', industry: 'legal', sector: 'private', revenue: 1_000_000, cause: 'phishing', province: 'OTHER', fraudReportedFast: true },
  'bec-mailbox-exposed-on-5m': { ...base, incident: 'BEC', industry: 'legal', sector: 'private', records: 'Medium', revenue: 5_000_000, cause: 'phishing', province: 'ON', dataExposed: true },
  'bec-deductible-above-gross': { ...base, incident: 'BEC', industry: 'tech', sector: 'private', revenue: 1_000_000, cause: 'phishing', province: 'ON', insurance: { limit: 1_000_000, deductible: 500_000 } },
  'databreach-fed-finance-500m-phi': { ...base, incident: 'DataBreach', industry: 'finance', sector: 'private', records: 'Critical', revenue: 500_000_000, cause: 'thirdParty', province: 'FED', phi: true },
  'databreach-bc-tech-50m-critical': { ...base, incident: 'DataBreach', industry: 'tech', sector: 'private', records: 'Critical', revenue: 50_000_000, cause: 'vuln', province: 'BC' },
  'databreach-qc-health-500m-phi': { ...base, incident: 'DataBreach', industry: 'health', sector: 'private', records: 'Critical', revenue: 500_000_000, cause: 'vuln', province: 'QC', phi: true },
  'databreach-on-gov-public-50m': { ...base, incident: 'DataBreach', industry: 'gov', sector: 'public', records: 'High', revenue: 50_000_000, cause: 'phishing', province: 'ON' },
  'databreach-fed-public-institution': { ...base, incident: 'DataBreach', industry: 'gov', sector: 'public', records: 'Critical', revenue: 500_000_000, employees: 3000, cause: 'thirdParty', province: 'FED' },
  'insider-ab-edu-public-5m': { ...base, incident: 'Insider', industry: 'edu', sector: 'public', records: 'High', revenue: 5_000_000, cause: 'phishing', province: 'AB' },
  'insider-other-edu-1m-low': { ...base, incident: 'Insider', industry: 'edu', sector: 'private', records: 'Low', revenue: 1_000_000, cause: 'thirdParty', province: 'OTHER' },
  'dos-qc-telco-500m': { ...base, incident: 'DoS', industry: 'telco', sector: 'private', revenue: 500_000_000, cause: 'vuln', province: 'QC' },
  'dos-fed-telco-11m-vs-99m-a': { ...base, incident: 'DoS', industry: 'telco', sector: 'private', revenue: 11_000_000, cause: 'phishing', province: 'FED' },
  'dos-fed-telco-11m-vs-99m-b': { ...base, incident: 'DoS', industry: 'telco', sector: 'private', revenue: 99_000_000, cause: 'phishing', province: 'FED' },
};
