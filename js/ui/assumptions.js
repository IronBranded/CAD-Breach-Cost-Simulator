// @ts-check
// "Model assumptions & sources" panel, generated from data/model.json so the
// page always shows the numbers it actually uses. Also rendered in full on
// the methodology page.
import { t, moneyShort, money, number, percent } from '../i18n.js?v=2026.11.0';
import { h, mount } from './dom.js?v=2026.11.0';

const A = key => t(`assumptions.${key}`);
const col = key => t(`assumptions.cols.${key}`);
const unit = key => t(`assumptions.units.${key}`);
const P = key => t(`assumptions.params.${key}`);
const opt = (group, id) => t(`options.${group}.${id}`);
const isAuthorOnly = src => src.length === 1 && src[0] === 'author';

/** @param {any} model @param {string[]} src */
function sourceNodes(model, src) {
  return src.flatMap((id, i) => {
    const url = model.sources[id] && model.sources[id].url;
    const node = url
      ? h('a', { href: url, target: '_blank', rel: 'noopener noreferrer', text: t(`sources.${id}`) })
      : document.createTextNode(t(`sources.${id}`));
    return i ? [' · ', node] : [node];
  });
}

/** @param {any} model */
function makeHelpers(model) {
  const sourceCell = src => h('td', { class: ['src', isAuthorOnly(src) ? 'author' : null] }, sourceNodes(model, src));
  const sourceNote = src => h('p', { class: ['note', 'src', isAuthorOnly(src) ? 'author' : null] },
    t('assumptions.sourceNote', { sources: '' }).trim(), ' ', sourceNodes(model, src));
  const table = (headers, rows) => h('div', { class: 'table-scroll' }, h('table', null,
    h('thead', null, h('tr', null, headers.map(x => h('th', { scope: 'col', text: x })))),
    h('tbody', null, rows)));
  const td = (text, num = false) => h('td', { class: num ? 'num' : null, text });
  const rowTh = text => h('th', { scope: 'row', text });
  const paramTable = entries => table([A('colParameter'), A('colValue'), A('colSource')],
    entries.map(([label, value, src]) => h('tr', null, rowTh(label), td(value, true), sourceCell(src))));
  return { sourceNote, table, td, rowTh, paramTable };
}

/**
 * @param {any} model
 * @param {{ body: HTMLElement, version?: HTMLElement|null, headingTag?: string }} targets
 */
export function renderAssumptions(model, targets) {
  const m = model;
  const { sourceNote, table, td, rowTh, paramTable } = makeHelpers(model);
  const rate = e => `${moneyShort(e.v)} ${unit(e.unit === 'perHour' ? 'perHour' : 'perIndividual')}`;
  const times = v => `${number(v)} ${unit('times')}`;
  const s = m.scale.v;
  const anchors = s.revenue.map((_, i) => i);
  const factorText = c => Object.entries(c).filter(([k, v]) => typeof v === 'number' && k !== 'appliesTo')
    .map(([k, v]) => `${t(`assumptions.factors.${k}`)} ×${number(/** @type {number} */ (v))}`).join(' · ');

  if (targets.version) targets.version.textContent = t('assumptions.version', { version: m.version });

  const sections = [
    [A('sections.rules'), h('ul', { class: 'assumptions-rules' }, t('assumptions.rules').map(r => h('li', { text: r })))],

    [A('sections.rates'), paramTable(Object.entries(m.rates).map(([k, e]) => [P(k), rate(e), e.src]))],

    [A('sections.effort'), paramTable(Object.entries(m.effort).map(([k, e]) => [P(k), times(e.v), e.src]))],

    [A('sections.causes'), [
      table([col('cause'), col('irMult'), col('forensicsMult')],
        Object.entries(m.causes.v).map(([id, c]) => h('tr', null, rowTh(opt('cause', id)), td(number(c.irMult), true), td(number(c.forensicsMult), true)))),
      sourceNote(m.causes.src)]],

    [A('sections.scale'), [
      table([col('anchor'), col('revenue'), col('employees'), col('irEffort'), col('counselEffort'), col('remediation')],
        anchors.map(i => h('tr', null, rowTh(String(i + 1)), td(moneyShort(s.revenue[i]), true), td(number(s.employees[i], 0), true),
          td(number(s.irEffort[i]), true), td(number(s.counselEffort[i]), true), td(moneyShort(s.remediation[i]), true)))),
      sourceNote(m.scale.src)]],

    [A('sections.incidents'), [
      table([col('scenario'), col('downtime'), col('operationsImpact'), col('irHours'), col('counselHours'), col('exposure'), col('extortion')],
        Object.entries(m.incidents.v).map(([id, inc]) => h('tr', null,
          rowTh(opt('incident', id)),
          td(number(inc.downtimeDays, 1), true), td(percent(inc.operationsImpact), true),
          td(number(inc.irHours, 0), true), td(number(inc.counselHours, 0), true),
          td(t(`assumptions.exposure.${inc.dataExposure}`)),
          td(inc.extortion ? inc.extortion.map(moneyShort).join(' · ') : '—', true)))),
      sourceNote(m.incidents.src)]],

    [A('sections.decisions'), paramTable([
      [P('unpaidDowntimeMult'), times(m.decisions.v.unpaidDowntimeMult), m.decisions.src],
      [P('unpaidDowntimeMultWithBackups'), times(m.decisions.v.unpaidDowntimeMultWithBackups), m.decisions.src],
      [P('unpaidItRecoveryMult'), times(m.decisions.v.unpaidItRecoveryMult), m.decisions.src],
      [P('becRecoveredShareIfReportedFast'), percent(m.decisions.v.becRecoveredShareIfReportedFast), m.decisions.src],
    ])],

    [A('sections.businessInterruption'), paramTable([
      [P('extraCostRate'), percent(m.businessInterruption.v.extraCostRate), m.businessInterruption.src],
    ])],

    [A('sections.industries'), [
      table([col('industry'), col('revenueAtRisk'), col('defaultSector')],
        Object.entries(m.industries.v).map(([id, x]) => h('tr', null, rowTh(opt('industry', id)),
          td(percent(x.revenueAtRisk), true), td(opt('sector', x.defaultSector || 'private'))))),
      sourceNote(m.industries.src)]],

    [A('sections.records'), [
      table([col('bucket'), col('individuals'), col('classAction'), col('defenceCost')],
        Object.entries(m.records.v).map(([id, b]) => h('tr', null, rowTh(opt('records', id)),
          td(number(b.individuals, 0), true),
          td(`${percent(b.classActionProb)} · ${percent(b.classActionProbSensitive)}`, true),
          td(b.defenceCost ? moneyShort(b.defenceCost) : '—', true)))),
      sourceNote(m.records.src)]],

    [A('sections.notification'), paramTable([
      [P('baseRatePerIndividual'), rate(m.notification.baseRatePerIndividual), m.notification.baseRatePerIndividual.src],
      [P('doubleExtortionSurcharge'), percent(m.notification.doubleExtortionSurcharge.v), m.notification.doubleExtortionSurcharge.src],
      [P('creditStandard'), `${moneyShort(m.notification.creditMonitoring.v.standard)} ${unit('perIndividual')}`, m.notification.creditMonitoring.src],
      [P('creditPhi'), `${moneyShort(m.notification.creditMonitoring.v.phi)} ${unit('perIndividual')}`, m.notification.creditMonitoring.src],
    ])],

    [A('sections.settlement'), paramTable([
      [P('settlementBase'), `${moneyShort(m.settlement.v.basePerIndividual)} ${unit('perIndividual')}`, m.settlement.src],
      [P('settlementPhi'), `+${moneyShort(m.settlement.v.phiPremium)} ${unit('perIndividual')}`, m.settlement.src],
      [P('settlementFinance'), `+${moneyShort(m.settlement.v.financePremium)} ${unit('perIndividual')}`, m.settlement.src],
    ])],

    [A('sections.regimes'), [
      table([col('regime'), col('fineBasis'), col('probability')],
        Object.entries(m.regimes.v).map(([id, r]) => {
          const f = r.fine;
          const basis = f.type === 'none' ? A('fineNone')
            : f.type === 'revenuePct'
              ? t('assumptions.fineRevenuePct', { pct: percent(f.pct, 1), pctPhi: percent(f.pctPhi, 1), cap: moneyShort(f.capFixed), capPct: percent(f.capRevenuePct) })
              : t('assumptions.fineFixed', { amount: moneyShort(f.amount), amountPhi: moneyShort(f.amountPhi) });
          return h('tr', null, rowTh(t(`regimes.labels.${id}`)), td(basis), td(f.type === 'none' ? '—' : percent(f.probability), true));
        })),
      h('p', { class: 'note', text: A('fedRule') }),
      sourceNote(m.regimes.src)]],

    [A('sections.controls'), [
      table([col('control'), col('effect'), col('appliesTo')],
        Object.entries(m.controls.v).map(([id, c]) => h('tr', null, rowTh(t(`form.controls.${id}.label`)),
          td(factorText(c)), td(c.appliesTo ? c.appliesTo.map(i => opt('incident', i)).join(', ') : A('all'))))),
      sourceNote(m.controls.src)]],

    [A('sections.insurance'), paramTable([
      [P('premiumRateOfLimit'), percent(m.insurance.v.premiumRateOfLimit), m.insurance.src],
      [P('postClaimIncrease'), percent(m.insurance.v.postClaimIncrease), m.insurance.src],
      [P('increaseYears'), number(m.insurance.v.increaseYears, 0), m.insurance.src],
      [P('defaultWaitingHours'), `${number(m.insurance.v.defaultWaitingHours, 0)} ${unit('hours')}`, m.insurance.src],
      [P('panelRateDiscount'), times(m.insurance.v.panelRateDiscount), m.insurance.src],
    ])],

    [A('sections.benchmark'), paramTable([
      [P('averageBreachCost'), money(m.benchmark.averageBreachCost.v), m.benchmark.averageBreachCost.src],
      [P('severityTiers'), t('assumptions.tiers', {
        medium: percent(m.benchmark.severityTiers.v.medium), high: percent(m.benchmark.severityTiers.v.high), critical: percent(m.benchmark.severityTiers.v.critical),
      }), m.benchmark.severityTiers.src],
    ])],

    [A('sections.uncertainty'), [
      table([col('driver'), col('low'), col('high')],
        Object.entries(m.uncertainty.v).map(([id, u]) => h('tr', null, rowTh(t(`assumptions.drivers.${id}`)), td(number(u.low), true), td(number(u.high), true)))),
      h('p', { class: 'note', text: `${P('runs')}: ${number(m.uncertainty.runs, 0)}` }),
      sourceNote(m.uncertainty.src)]],

    [A('sections.variableX'), [
      table([col('scenario'), col('churn'), col('revenue'), col('recruitment'), col('partner')],
        Object.entries(m.variableX.weights.v).map(([id, w]) => h('tr', null, rowTh(opt('incident', id)),
          td(percent(w.churn), true), td(percent(w.revenue), true), td(percent(w.recruitment), true), td(percent(w.partner), true)))),
      h('p', {
        class: 'note',
        text: Object.entries(m.variableX.industryShift.v).map(([id, sh]) => `${opt('industry', id)}: ${Object.entries(sh)
          .map(([k, v]) => `${col(k)} ${v > 0 ? '+' : '−'}${number(Math.abs(v) * 100, 0)} pts`).join(', ')}`).join(' · '),
      }),
      sourceNote(m.variableX.weights.src)]],
  ];

  mount(targets.body,
    h('p', { class: 'assumptions-intro', text: A('intro') }),
    sections.map(([title, content]) => [h(targets.headingTag || 'h4', { class: 'assumptions-h', text: title }), content]));
}
