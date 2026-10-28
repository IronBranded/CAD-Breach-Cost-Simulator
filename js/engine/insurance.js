// @ts-check
// Cyber insurance recovery and post-claim premium increase.
//
// - The deductible sits inside the limit (insurer pays at most cap - deductible).
// - Business interruption during the waiting period is not covered.
// - Ransomware claims are capped by the ransomware sublimit and reduced by coinsurance.
// - The 3-year premium increase only applies when a claim is paid.

const num = v => (Number.isFinite(v) ? /** @type {number} */ (v) : null);

/**
 * @param {{ grossTotal:number, operations:number, downtimeDays:number, isRansomware:boolean }} loss
 * @param {import('../types.js').PolicyInput|null} policy
 * @param {any} model
 */
export function applyInsurance({ grossTotal, operations, downtimeDays, isRansomware }, policy, model) {
  const none = { applied: false, covered: 0, premiumIncrease: 0, netTotal: grossTotal, biUncovered: 0 };
  if (!policy) return none;
  const limit = (num(policy.limit) ?? 0) > 0 ? /** @type {number} */ (policy.limit) : 0;
  if (!limit) return none;
  const p = model.insurance.v;
  const deductible = Math.max(0, num(policy.deductible) ?? 0);
  const waitingHours = Math.max(0, num(policy.waitingHours) ?? p.defaultWaitingHours);
  const downtimeHours = downtimeDays * 24;
  const biUncovered = downtimeHours > 0 ? operations * Math.min(1, waitingHours / downtimeHours) : 0;
  const sublimit = num(policy.ransomwareSublimit);
  const cap = isRansomware && sublimit && sublimit > 0 ? Math.min(limit, sublimit) : limit;
  const coinsurance = isRansomware ? Math.min(1, Math.max(0, num(policy.coinsurance) ?? 0)) : 0;

  const claimable = Math.max(0, grossTotal - biUncovered);
  const covered = Math.max(0, Math.min(claimable, cap) - deductible) * (1 - coinsurance);
  const premiumBase = (num(policy.premium) ?? 0) > 0 ? /** @type {number} */ (policy.premium) : limit * p.premiumRateOfLimit;
  const premiumIncrease = covered > 0 ? premiumBase * p.postClaimIncrease * p.increaseYears : 0;
  return {
    applied: true, covered, premiumIncrease, netTotal: grossTotal - covered + premiumIncrease,
    limit, deductible, cap, coinsurance, waitingHours, biUncovered, premiumBase,
  };
}
