// Cyber insurance recovery and post-claim premium increase.
export function applyInsurance(grossTotal, policy, model) {
  const none = { applied: false, covered: 0, premiumIncrease: 0, netTotal: grossTotal };
  if (!policy) return none;
  const limit = Number.isFinite(policy.limit) && policy.limit > 0 ? policy.limit : 0;
  const deductible = Number.isFinite(policy.deductible) && policy.deductible >= 0 ? policy.deductible : 0;
  if (!limit) return none;

  const p = model.insurance.v;
  const premiumIncrease = limit * p.premiumRateOfLimit * p.postClaimIncrease * p.increaseYears;
  let covered, netTotal;
  if (grossTotal > limit) {
    covered = Math.max(0, limit - deductible);
    netTotal = deductible + (grossTotal - limit) + premiumIncrease;
  } else {
    covered = Math.max(0, grossTotal - deductible);
    netTotal = deductible + premiumIncrease;
  }
  return { applied: true, covered, premiumIncrease, netTotal, limit, deductible };
}
