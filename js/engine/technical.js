// Technical response: incident response, forensics, IT recovery.
export function technicalCosts({ irHours, cause }, model) {
  const r = model.rates;
  const e = model.effort;
  const ir = irHours * r.incidentResponse.v * cause.irMult;
  const forensics = irHours * e.forensicHoursPerIrHour.v * r.forensics.v * cause.forensicsMult;
  const it = irHours * e.itHoursPerIrHour.v * r.itRecovery.v;
  return { ir, forensics, it, total: ir + forensics + it };
}
