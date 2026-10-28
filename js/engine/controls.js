// @ts-check
// Security controls and decisions turned into multipliers for one scenario.

/**
 * @param {import('../types.js').Inputs} inputs
 * @param {any} model
 */
export function effectiveFactors(inputs, model) {
  const f = { irEffort: 1, downtime: 1, itRecovery: 1, rates: 1, counsel: 1, individuals: 1 };
  const enabled = inputs.controls || {};
  for (const [id, c] of Object.entries(model.controls.v)) {
    if (!enabled[/** @type {import('../types.js').ControlId} */ (id)]) continue;
    if (c.appliesTo && !c.appliesTo.includes(inputs.incident)) continue;
    for (const k of Object.keys(f)) if (typeof c[k] === 'number') f[/** @type {keyof typeof f} */ (k)] *= c[k];
  }

  // Panel rates under an insurance policy; a retainer and a panel do not stack.
  if (inputs.insurance && inputs.insurance.limit > 0) f.rates = Math.min(f.rates, model.insurance.v.panelRateDiscount);

  // Ransom decision
  const inc = model.incidents.v[inputs.incident];
  const d = model.decisions.v;
  const unpaid = !!inc.ransomDecision && inputs.ransomPaid === false;
  if (unpaid) {
    const backupsOn = !!enabled.backups;
    f.downtime *= backupsOn ? d.unpaidDowntimeMultWithBackups : d.unpaidDowntimeMult;
    f.itRecovery *= d.unpaidItRecoveryMult;
  }
  return { ...f, ransomUnpaid: unpaid };
}
