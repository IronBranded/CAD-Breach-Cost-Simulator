// "Model assumptions & sources" panel, generated from data/model.json so the
// page always shows the numbers it actually uses.
import { t, moneyShort, money, number, percent } from '../i18n.js';
import { h, $, mount } from './dom.js';

const A = key => t(`assumptions.${key}`);
const col = key => t(`assumptions.cols.${key}`);
const unit = key => t(`assumptions.units.${key}`);

function sourceText(src) {
  return src.map(id => t(`sources.${id}`)).join(' · ');
}
function sourceCell(src) {
  return h('td', { class: ['src', src.length === 1 && src[0] === 'author' ? 'author' : null], text: sourceText(src) });
}
function sourceNote(src) {
  return h('p', { class: ['note', 'src', src.length === 1 && src[0] === 'author' ? 'author' : null], text: t('assumptions.sourceNote', { sources: sourceText(src) }) });
}

function table(headers, rows) {
  return h('div', { class: 'table-scroll' }, h('table', null,
    h('thead', null, h('tr', null, headers.map(x => h('th', { scope: 'col', text: x })))),
    h('tbody', null, rows)));
}
const td = (text, num = false) => h('td', { class: num ? 'num' : null, text });

/** Rows of [label, value text, src] for scalar parameters. */
function paramTable(entries) {
  return table([A('colParameter'), A('colValue'), A('colSource')],
    entries.map(([label, value, src]) => h('tr', null, h('th', { scope: 'row', text: label }), td(value, true), sourceCell(src))));
}

export function renderAssumptions(model) {
  const m = model;
  const P = key => t(`assumptions.params.${key}`);
  const opt = (group, id) => t(`options.${group}.${id}`);
  const brackets = Object.keys(m.revenue.v);
  const rate = e => `${moneyShort(e.v)} ${unit(e.unit === 'perHour' ? 'perHour' : 'perIndividual')}`;

  $('assumptionsVersion').textContent = t('assumptions.version', { version: m.version });

  const sections = [
    [A('sections.rules'), h('ul', { class: 'assumptions-rules' }, t('assumptions.rules').map(r => h('li', { text: r })))],

    [A('sections.rates'), paramTable(Object.entries(m.rates).map(([k, e]) => [P(k), rate(e), e.src]))],

    [A('sections.effort'), paramTable(Object.entries(m.effort).map(([k, e]) => [P(k), `${number(e.v)} ${unit('times')}`, e.src]))],

    [A('sections.causes'), [
      table([col('cause'), col('irMult'), col('forensicsMult')],
        Object.entries(m.causes.v).map(([id, c]) => h('tr', null, h('th', { scope: 'row', text: opt('cause', id) }), td(number(c.irMult), true), td(number(c.forensicsMult), true)))),
      sourceNote(m.causes.src)]],

    [A('sections.incidents'), [
      table([col('scenario'), col('downtime'), col('irHours'), col('counselHours'), col('exposure'), col('extortion')],
        Object.entries(m.incidents.v).map(([id, inc]) => h('tr', null,
          h('th', { scope: 'row', text: opt('incident', id) }),
          td(number(inc.downtimeDays, 1), true), td(number(inc.irHours, 0), true), td(number(inc.counselHours, 0), true),
          td(t(`assumptions.exposure.${inc.dataExposure}`)),
          td(inc.extortion ? brackets.map(b => moneyShort(inc.extortion[b])).join(' · ') : '—', true)))),
      sourceNote(m.incidents.src)]],

    [A('sections.revenue'), [
      table([col('bracket'), col('representative'), col('effortMult'), col('opsLoss'), col('remediation'), col('varXRate')],
        brackets.map(b => {
          const r = m.revenue.v[b];
          const eff = r.irScaleCap < 1 ? `${number(r.effortMult)} (IR × ${number(r.irScaleCap)})` : number(r.effortMult);
          return h('tr', null, h('th', { scope: 'row', text: opt('revenue', b) }),
            td(moneyShort(r.representative), true), td(eff, true), td(moneyShort(r.opsLossPerDay), true),
            td(moneyShort(r.remediation), true), td(percent(r.varXRate), true));
        })),
      sourceNote(m.revenue.src)]],

    [A('sections.records'), [
      table([col('bucket'), col('individuals'), col('classAction'), col('dxRate')],
        Object.entries(m.records.v).map(([id, b]) => h('tr', null, h('th', { scope: 'row', text: opt('records', id) }),
          td(number(b.individuals, 0), true),
          td(`${percent(b.classActionProb)} · ${percent(b.classActionProbSensitive)}`, true),
          td(`${moneyShort(b.doubleExtortionNotifyRate)} ${unit('perIndividual')}`, true)))),
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

    [A('sections.industries'), [
      table([col('industry'), col('multiplier')],
        Object.entries(m.industries.v).map(([id, x]) => h('tr', null, h('th', { scope: 'row', text: opt('industry', id) }), td(`${number(x)} ${unit('times')}`, true)))),
      sourceNote(m.industries.src)]],

    [A('sections.regimes'), [
      table([col('regime'), col('fineBasis'), col('probability')],
        Object.entries(m.regimes.v).map(([id, r]) => {
          const f = r.fine;
          const basis = f.type === 'revenuePct'
            ? t('assumptions.fineRevenuePct', { pct: percent(f.pct, 1), pctPhi: percent(f.pctPhi, 1), cap: moneyShort(f.capFixed), capPct: percent(f.capRevenuePct) })
            : t('assumptions.fineFixed', { amount: moneyShort(f.amount), amountPhi: moneyShort(f.amountPhi) });
          return h('tr', null, h('th', { scope: 'row', text: t(`regimes.labels.${id}`) }), td(basis), td(percent(f.probability), true));
        })),
      h('p', { class: 'note', text: A('fedRule') }),
      sourceNote(m.regimes.src)]],

    [A('sections.insurance'), paramTable([
      [P('premiumRateOfLimit'), percent(m.insurance.v.premiumRateOfLimit), m.insurance.src],
      [P('postClaimIncrease'), percent(m.insurance.v.postClaimIncrease), m.insurance.src],
      [P('increaseYears'), number(m.insurance.v.increaseYears, 0), m.insurance.src],
    ])],

    [A('sections.benchmark'), paramTable([
      [P('averageBreachCost'), money(m.benchmark.averageBreachCost.v), m.benchmark.averageBreachCost.src],
      [P('severityTiers'), t('assumptions.tiers', {
        medium: number(m.benchmark.severityTiers.v.medium), high: number(m.benchmark.severityTiers.v.high), critical: number(m.benchmark.severityTiers.v.critical),
      }), m.benchmark.severityTiers.src],
    ])],

    [A('sections.variableX'), [
      table([col('scenario'), col('churn'), col('revenue'), col('recruitment'), col('partner')],
        Object.entries(m.variableX.weights.v).map(([id, w]) => h('tr', null, h('th', { scope: 'row', text: opt('incident', id) }),
          td(percent(w.churn), true), td(percent(w.revenue), true), td(percent(w.recruitment), true), td(percent(w.partner), true)))),
      h('p', {
        class: 'note',
        text: Object.entries(m.variableX.industryShift.v).map(([id, sh]) => `${opt('industry', id)}: ${Object.entries(sh)
          .map(([k, v]) => `${col(k)} ${v > 0 ? '+' : '−'}${number(Math.abs(v) * 100, 0)} pts`).join(', ')}`).join(' · '),
      }),
      sourceNote(m.variableX.weights.src)]],
  ];

  mount($('assumptionsBody'),
    h('p', { class: 'assumptions-intro', text: A('intro') }),
    sections.map(([title, content]) => [h('h4', { text: title }), content]));
}
