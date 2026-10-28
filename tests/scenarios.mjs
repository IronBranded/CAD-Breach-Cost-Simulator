// Named input scenarios used as golden fixtures for the engine tests.
export const SCENARIOS = {
  'ransomware-qc-health-mid-phi-exfil-insured': { incident: 'Ransomware', industry: 'health', records: 'High', revenue: 'Mid', cause: 'phishing', province: 'QC', phi: true, exfil: true, insurance: { limit: 2_000_000, deductible: 50_000 } },
  'ransomware-on-retail-small-no-exfil': { incident: 'Ransomware', industry: 'retail', records: 'Medium', revenue: 'Small', cause: 'vuln', province: 'ON', phi: false, exfil: false, insurance: null },
  'ransomware-large-over-limit': { incident: 'Ransomware', industry: 'mfg', records: 'Critical', revenue: 'Large', cause: 'thirdParty', province: 'AB', phi: false, exfil: true, insurance: { limit: 5_000_000, deductible: 250_000 } },
  'ransomware-deductible-above-limit': { incident: 'Ransomware', industry: 'energy', records: 'Low', revenue: 'Small', cause: 'phishing', province: 'BC', phi: false, exfil: false, insurance: { limit: 100_000, deductible: 150_000 } },
  'bec-other-legal-micro': { incident: 'BEC', industry: 'legal', records: 'Low', revenue: 'Micro', cause: 'phishing', province: 'OTHER', phi: false, insurance: null },
  'bec-deductible-above-gross': { incident: 'BEC', industry: 'tech', records: 'Low', revenue: 'Micro', cause: 'phishing', province: 'ON', phi: false, insurance: { limit: 1_000_000, deductible: 500_000 } },
  'databreach-fed-finance-large-phi': { incident: 'DataBreach', industry: 'finance', records: 'Critical', revenue: 'Large', cause: 'thirdParty', province: 'FED', phi: true, insurance: null },
  'databreach-bc-tech-mid-critical': { incident: 'DataBreach', industry: 'tech', records: 'Critical', revenue: 'Mid', cause: 'vuln', province: 'BC', phi: false, insurance: null },
  'databreach-on-finance-medium': { incident: 'DataBreach', industry: 'finance', records: 'Medium', revenue: 'Small', cause: 'phishing', province: 'ON', phi: false, insurance: null },
  'databreach-qc-large-phi-critical': { incident: 'DataBreach', industry: 'health', records: 'Critical', revenue: 'Large', cause: 'vuln', province: 'QC', phi: true, insurance: null },
  'insider-ab-gov-small-high': { incident: 'Insider', industry: 'gov', records: 'High', revenue: 'Small', cause: 'phishing', province: 'AB', phi: false, insurance: null },
  'insider-other-edu-micro-low': { incident: 'Insider', industry: 'edu', records: 'Low', revenue: 'Micro', cause: 'thirdParty', province: 'OTHER', phi: false, insurance: null },
  'dos-qc-telco-large-critical': { incident: 'DoS', industry: 'telco', records: 'Critical', revenue: 'Large', cause: 'vuln', province: 'QC', phi: false, insurance: null },
  'dos-fed-telco-mid': { incident: 'DoS', industry: 'telco', records: 'High', revenue: 'Mid', cause: 'phishing', province: 'FED', phi: false, insurance: null },
};
