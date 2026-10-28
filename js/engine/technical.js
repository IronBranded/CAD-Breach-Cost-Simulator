// @ts-check
// Technical response: incident response, forensics, IT recovery.

/**
 * @param {{ irHours: number, cause: {irMult:number, forensicsMult:number}, factors: {rates:number, itRecovery:number} }} p
 * @param {any} model
 */
export function technicalCosts({ irHours, cause, factors }, model) {
  const r = model.rates;
  const e = model.effort;
  const ir = irHours * r.incidentResponse.v * factors.rates * cause.irMult;
  const forensics = irHours * e.forensicHoursPerIrHour.v * r.forensics.v * factors.rates * cause.forensicsMult;
  const it = irHours * e.itHoursPerIrHour.v * r.itRecovery.v * factors.itRecovery;
  return { ir, forensics, it, total: ir + forensics + it, irHours };
}
