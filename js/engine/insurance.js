// Cyber insurance recovery and post-claim premium increase.
//
// Assumptions (stated in the in-app assumptions panel):
// - The deductible (retention) sits inside the coverage limit, so the most the
//   insurer pays is limit - deductible.
// - The 3-year premium increase only applies when a claim is actually paid.
export function applyInsurance(grossTotal, policy, model) {
  const none = { applied: false, covered: 0, premiumIncrease: 0, netTotal: grossTotal };
  if (!policy) return none;
  const limit = Number.isFinite(policy.limit) && policy.limit > 0 ? policy.limit : 0;
  const deductible = Number.isFinite(policy.deductible) && policy.deductible >= 0 ? policy.deductible : 0;
  if (!limit) return none;

  const p = model.insurance.v;
  const covered = Math.max(0, Math.min(grossTotal, limit) - deductible);
  const premiumIncrease = covered > 0
    ? limit * p.premiumRateOfLimit * p.postClaimIncrease * p.increaseYears
    : 0;
  const netTotal = grossTotal - covered + premiumIncrease;
  return { applied: true, covered, premiumIncrease, netTotal, limit, deductible };
}
