// @ts-check
// Insight cards: range of outcomes (Monte Carlo), what would reduce the cost,
// scenario comparison, and related scenarios in the Attack & Abuse Matrix.
import { t, money, moneyCompact, percent, number } from '../i18n.js?v=2026.11.0';
import { h, s, $, mount } from './dom.js?v=2026.11.0';
import { optionLabel, enabledControls } from './sections.js?v=2026.11.0';

// ---------- Range of outcomes ----------

/**
 * Loss exceedance curve: P(loss > x).
 * @param {any} summary  sim.net or sim.gross
 * @param {number} point point estimate (same basis)
 * @param {string} idPrefix
 */
export function buildExceedanceChart(summary, point, idPrefix) {
  const W = 520, H = 240, L = 54, R = 14, T = 14, B = 40;
  const pw = W - L - R, ph = H - T - B;
  const xmax = Math.max(summary.curve[summary.curve.length - 1].loss, point, 1) * 1.05;
  const xs = v => L + (v / xmax) * pw;
  const ys = p => T + (1 - p) * ph;
  const pts = summary.curve.map(c => `${xs(c.loss).toFixed(1)},${ys(c.exceed).toFixed(1)}`);
  const line = `M${xs(0)},${ys(1)} L${pts.join(' L')}`;
  const area = `${line} L${xs(summary.curve[summary.curve.length - 1].loss)},${ys(0)} L${xs(0)},${ys(0)} Z`;
  const xticks = [0, 0.25, 0.5, 0.75, 1].map(f => f * xmax);
  const yticks = [0, 0.25, 0.5, 0.75, 1];
  const markers = [['p10', 0.9], ['p50', 0.5], ['p90', 0.1]];

  return s('svg', {
    viewBox: `0 0 ${W} ${H}`, role: 'img', id: `${idPrefix}-lec`,
    'aria-label': t('range.aria', { p10: money(summary.p10), p50: money(summary.p50), p90: money(summary.p90), p99: money(summary.p99) }),
  },
  yticks.map(p => [
    s('line', { class: 'lec-grid', x1: L, x2: W - R, y1: ys(p), y2: ys(p) }),
    s('text', { class: 'lec-tick', x: L - 6, y: ys(p) + 3, 'text-anchor': 'end', text: percent(p) }),
  ]),
  xticks.map(v => s('text', { class: 'lec-tick', x: xs(v), y: H - B + 14, 'text-anchor': 'middle', text: moneyCompact(v) })),
  s('line', { class: 'lec-axis', x1: L, x2: W - R, y1: ys(0), y2: ys(0) }),
  s('line', { class: 'lec-axis', x1: L, x2: L, y1: T, y2: ys(0) }),
  s('path', { class: 'lec-area', d: area }),
  s('path', { class: 'lec-line', d: line }),
  markers.map(([k, p]) => s('circle', { class: 'lec-pct-dot', cx: xs(summary[k]), cy: ys(p), r: 3.5 })),
  s('line', { class: 'lec-marker point', x1: xs(point), x2: xs(point), y1: T, y2: ys(0) }),
  s('text', {
    class: 'lec-marker-label point', x: Math.min(xs(point) + 5, W - R - 4), y: T + 10,
    'text-anchor': xs(point) > W - R - 110 ? 'end' : 'start', text: t('range.point'),
  }),
  s('text', { class: 'lec-title', x: L + pw / 2, y: H - 6, 'text-anchor': 'middle', text: t('range.xAxis') }),
  s('text', { class: 'lec-title', x: 12, y: T + ph / 2, 'text-anchor': 'middle', transform: `rotate(-90 12 ${T + ph / 2})`, text: t('range.yAxis') }));
}

/** @param {any} sim @param {any} r engine result */
export function rangeBasis(sim, r) {
  return r.insurance.applied ? { key: 'net', summary: sim.net, point: r.netTotal } : { key: 'gross', summary: sim.gross, point: r.grossTotal };
}

/** @param {any} sim @param {any} r */
export function renderRange(sim, r) {
  const { key, summary, point } = rangeBasis(sim, r);
  const stat = (k, v) => h('li', { class: ['range-stat', k] },
    h('div', { class: 'range-stat-label', text: t(`range.${k}`) }),
    h('div', { class: 'range-stat-value', text: moneyCompact(v) }));
  mount($('rangeCard'),
    h('h3', { class: 'chart-title', id: 'rangeTitle', text: t('range.title') }),
    h('p', { class: 'chart-subtitle', text: `${t('range.subtitle', { runs: number(sim.runs, 0) })} · ${t(`range.basis.${key}`)}` }),
    h('ul', { class: 'range-stats' },
      stat('p10', summary.p10), stat('p50', summary.p50), stat('p90', summary.p90), stat('p99', summary.p99), stat('mean', summary.mean)),
    h('div', { class: 'lec-wrap' }, buildExceedanceChart(summary, point, 'scr')),
    r.dataExposed ? h('p', { class: 'insight-note', text: t('range.events', { fines: percent(sim.fineShare), classActions: percent(sim.classActionShare) }) }) : null,
    h('p', { class: 'insight-note', text: t('range.intro') }));
}

// ---------- What would reduce this ----------

/**
 * @param {{id:string, enabled:boolean, applicable:boolean, saving:number}[]} savings
 * @param {{paid:number, notPaid:number}|null} ransom
 * @param {any} r
 * @param {(id:string, on:boolean) => void} onToggle
 */
export function renderSavings(savings, ransom, r, onToggle) {
  const max = Math.max(...savings.map(x => x.saving), 1);
  mount($('savingsCard'),
    h('h3', { class: 'chart-title', id: 'savingsTitle', text: t('savings.title') }),
    h('p', { class: 'chart-subtitle', text: t('savings.subtitle') }),
    h('ul', { class: 'savings-list' }, savings.map(x => {
      const na = !x.applicable || x.saving <= 0.5;
      const value = na ? t('savings.notApplicable') : t(x.enabled ? 'savings.inPlace' : 'savings.saves', { amount: money(x.saving) });
      return h('li', { class: ['saving-item', x.enabled ? 'enabled' : null, na ? 'na' : null] },
        h('div', { class: 'saving-meta' },
          h('span', { class: 'saving-name', text: t(`form.controls.${x.id}.label`) }),
          h('span', { class: 'saving-value', text: value })),
        na && !x.enabled ? null : h('button', {
          type: 'button', class: 'saving-btn', onclick: () => onToggle(x.id, !x.enabled),
          'aria-label': `${t(x.enabled ? 'savings.remove' : 'savings.apply')}: ${t(`form.controls.${x.id}.label`)}`,
          text: t(x.enabled ? 'savings.remove' : 'savings.apply'),
        }),
        na ? null : h('span', { class: 'saving-bar', style: { width: `${Math.max(4, (x.saving / max) * 100)}%` }, 'aria-hidden': 'true' }));
    })),
    ransom ? h('p', { class: 'ransom-line', text: t('savings.ransom', { paid: money(ransom.paid), notPaid: money(ransom.notPaid) }) }) : null,
    r.insurance.applied ? h('p', { class: 'insight-note', text: t('savings.insuranceNote') }) : null);
}

// ---------- Scenario comparison ----------

/**
 * @param {{ inputs:any, result:any, sim:any }[]} pinned
 * @param {{ inputs:any, result:any, sim:any }} current
 * @param {(index:number) => void} onRemove
 */
export function renderCompare(pinned, current, onRemove) {
  const card = $('compareCard');
  card.hidden = pinned.length === 0;
  if (!pinned.length) { card.replaceChildren(); return; }
  const cols = [...pinned.map((p, i) => ({ ...p, label: `#${i + 1}`, index: i })), { ...current, label: t('compare.current'), index: -1 }];
  const range = c => { const b = rangeBasis(c.sim, c.result).summary; return `${moneyCompact(b.p10)} – ${moneyCompact(b.p90)}`; };
  const ctlCount = c => String(enabledControls(c.inputs).length);
  const rows = [
    ['incident', c => optionLabel('incident', c.inputs.incident), false],
    ['revenue', c => moneyCompact(c.inputs.revenue), true],
    ['controls', ctlCount, true],
    ['insurance', c => (c.inputs.insurance ? moneyCompact(c.inputs.insurance.limit) : t('compare.no')), true],
    ['net', c => money(c.result.netTotal), true, 'key'],
    ['range', range, true],
    ['tech', c => moneyCompact(c.result.tech.total), true],
    ['legal', c => moneyCompact(c.result.legal.total), true],
    ['biz', c => moneyCompact(c.result.business.total), true],
  ];
  const head = h('thead', null, h('tr', null,
    h('th', { scope: 'col' }),
    cols.map(c => h('th', { scope: 'col', class: c.index < 0 ? 'current' : null },
      c.label,
      c.index >= 0
        ? h('button', { type: 'button', class: 'compare-remove', onclick: () => onRemove(c.index), 'aria-label': `${t('compare.remove')} ${c.label}`, text: '×' })
        : null))));
  const body = h('tbody', null, rows.map(([key, fn, num, cls]) => h('tr', { class: cls || null },
    h('th', { scope: 'row', text: t(`compare.rows.${key}`) }),
    cols.map(c => h('td', { class: num ? 'num' : null, text: /** @type {Function} */ (fn)(c) })))));
  mount(card,
    h('h3', { class: 'chart-title', id: 'compareTitle', text: t('compare.title') }),
    h('div', { class: 'compare-scroll' }, h('table', { class: 'compare-table' }, head, body)));
}

// ---------- Related scenarios ----------

/** @param {any} related data/related.json @param {string} incident */
export function renderRelated(related, incident) {
  const items = (related && related.v[incident]) || [];
  const card = $('relatedCard');
  card.hidden = !items.length;
  mount(card,
    h('h3', { class: 'chart-title', id: 'relatedTitle', text: t('related.title') }),
    h('p', { class: 'insight-intro', text: t('related.intro') }),
    h('ul', { class: 'related-list' }, items.map(x => h('li', null,
      h('a', { href: related.baseUrl + x.id, target: '_blank', rel: 'noopener noreferrer', lang: 'en', text: x.title })))));
}
