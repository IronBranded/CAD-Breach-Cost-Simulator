// @ts-check
// Size scaling: log-linear interpolation between anchor points, clamped at the ends.

/**
 * @param {number[]} xs  ascending anchor positions (> 0)
 * @param {number[]} ys  values at each anchor
 * @param {number} x
 */
export function logInterp(xs, ys, x) {
  if (!(x > 0)) return ys[0];
  if (x <= xs[0]) return ys[0];
  const last = xs.length - 1;
  if (x >= xs[last]) return ys[last];
  let i = 0;
  while (x > xs[i + 1]) i++;
  const t = (Math.log(x) - Math.log(xs[i])) / (Math.log(xs[i + 1]) - Math.log(xs[i]));
  return ys[i] + t * (ys[i + 1] - ys[i]);
}

/**
 * Size-driven values for a scenario.
 * @param {import('../types.js').Inputs} inputs
 * @param {any} model
 */
export function sizeProfile(inputs, model) {
  const s = model.scale.v;
  const byEmployees = Number.isFinite(inputs.employees) && /** @type {number} */ (inputs.employees) > 0;
  const [axis, x] = byEmployees ? [s.employees, /** @type {number} */ (inputs.employees)] : [s.revenue, inputs.revenue];
  return {
    basis: byEmployees ? 'employees' : 'revenue',
    irEffort: logInterp(axis, s.irEffort, x),
    counselEffort: logInterp(axis, s.counselEffort, x),
    remediation: logInterp(axis, s.remediation, x),
  };
}

/** Extortion / fraud amount for an incident at this revenue. */
export function extortionAt(incident, revenue, model) {
  return incident.extortion ? logInterp(model.scale.v.revenue, incident.extortion, revenue) : 0;
}
