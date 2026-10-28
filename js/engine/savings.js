// @ts-check
// "What would reduce this?" — the change in net exposure from each security
// control and from the ransom decision, holding everything else constant.
import { calculate } from './calculate.js?v=2026.11.0';

/**
 * @param {import('../types.js').Inputs} inputs
 * @param {any} model
 * @returns {{ id: string, enabled: boolean, applicable: boolean, saving: number }[]}
 */
export function controlSavings(inputs, model) {
  const base = inputs.controls || {};
  return Object.entries(model.controls.v).map(([id, c]) => {
    const applicable = !c.appliesTo || c.appliesTo.includes(inputs.incident);
    const on = calculate({ ...inputs, controls: { ...base, [id]: true } }, model).netTotal;
    const off = calculate({ ...inputs, controls: { ...base, [id]: false } }, model).netTotal;
    return { id, enabled: !!base[/** @type {import('../types.js').ControlId} */ (id)], applicable, saving: off - on };
  }).sort((a, b) => b.saving - a.saving);
}

/**
 * Net exposure if the ransom is / is not paid (ransomware only), else null.
 * @param {import('../types.js').Inputs} inputs @param {any} model
 */
export function ransomComparison(inputs, model) {
  if (!model.incidents.v[inputs.incident].ransomDecision) return null;
  return {
    paid: calculate({ ...inputs, ransomPaid: true }, model).netTotal,
    notPaid: calculate({ ...inputs, ransomPaid: false }, model).netTotal,
  };
}
