// Business impact: downtime loss, post-incident remediation, extortion / theft.
export function businessCosts({ incident, revenueBracket, industryMult }, model) {
  const rev = model.revenue.v[revenueBracket];
  const operations = incident.downtimeDays * rev.opsLossPerDay * industryMult;
  const remediation = rev.remediation;
  const extortion = incident.extortion ? incident.extortion[revenueBracket] : 0;
  return { operations, remediation, extortion, total: operations + remediation + extortion };
}
