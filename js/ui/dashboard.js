// @ts-check
// Results dashboard.
import { t, money, moneyCompact, percent, number } from '../i18n.js?v=2026.11.0';
import { h, $, mount, rich } from './dom.js?v=2026.11.0';
import { buildDonut } from './donut.js?v=2026.11.0';
import { buildTimelineChart } from './timeline-chart.js?v=2026.11.0';
import { buildSeverityBand } from './severity.js?v=2026.11.0';
import { costSections, shares, optionLabel, enabledControls } from './sections.js?v=2026.11.0';
import { rangeBasis } from './insights.js?v=2026.11.0';

const BRAND_KEYS = ['churn', 'revenue', 'recruitment', 'partner'];

/** @param {any} r engine result @param {any} sim simulation @param {any} model */
export function renderDashboard(r, sim, model) {
  renderHero(r, sim, model);
  renderCostDonut(r);
  renderBrandDonut(r);
  renderCards(r);
  renderTimeline(r);
  renderThreatLandscape(model);
  renderSources(model);
}

function renderHero(r, sim, model) {
  const { inputs } = r;
  const ctl = enabledControls(inputs).length;
  mount($('heroBadges'),
    h('span', { class: 'badge incident', text: optionLabel('incident', inputs.incident) }),
    h('span', { class: 'badge province', text: t(`options.provinceShort.${inputs.province}`) }),
    inputs.sector === 'public' ? h('span', { class: 'badge public', text: t('results.badges.public') }) : null,
    inputs.phi ? h('span', { class: 'badge phi', text: t('results.badges.phi') }) : null,
    h('span', {
      class: ['badge', r.dataExposed ? 'exposed' : 'not-exposed'],
      text: t(r.dataExposed ? 'results.badges.exposed' : 'results.badges.notExposed'),
    }),
    ctl ? h('span', { class: 'badge controls', text: t(ctl === 1 ? 'results.badges.controlsOne' : 'results.badges.controls', { count: ctl }) }) : null);

  $('exposureLabelText').textContent = t(r.insurance.applied ? 'results.exposureNet' : 'results.exposureGross');
  $('grandTotal').textContent = money(r.netTotal);
  const basis = rangeBasis(sim, r).summary;
  $('rangeLine').textContent = t('results.range', { p10: money(basis.p10), p90: money(basis.p90) });

  const ins = r.insurance;
  mount($('insuranceSummary'),
    ins.applied ? h('div', { class: 'insurance-covered-badge', text: t('results.insuranceCovered', { amount: money(ins.covered) }) }) : null,
    ins.premiumIncrease > 0 ? h('p', { class: 'premium-note', text: t('results.premiumIncluded', { amount: money(ins.premiumIncrease) }) }) : null);

  mount($('severityBand'), buildSeverityBand(r.severity, model.benchmark.severityTiers.v));
  $('lifecycleValue').textContent = t(`results.durations.${inputs.incident}`);
  const inc = model.incidents.v[inputs.incident];
  $('lifecycleModelled').textContent = t('results.modelled', {
    days: number(r.business.downtimeDays, 1), pct: percent(inc.operationsImpact),
  });
  $('regimePill').textContent = t('results.regime', { regime: t(`regimes.labels.${r.legal.regime}`) });
}

function renderCostDonut(r) {
  const sh = shares(r);
  const values = { tech: r.tech.total, legal: r.legal.total, biz: r.business.total };
  const segments = ['tech', 'legal', 'biz'].map(key => ({
    key, value: sh[key], label: t(`chart.legend.${key}`), display: moneyCompact(values[key]), amount: money(values[key]),
  }));
  mount($('costDonut'), buildDonut({
    segments,
    center: { key: 'total', display: moneyCompact(r.grossTotal), label: t('chart.centerTotal') },
    ariaLabel: t('chart.distributionAria', { parts: segments.map(sg => `${sg.label} ${percent(sg.value)} (${sg.amount})`).join(', ') }),
  }));
}

function renderBrandDonut(r) {
  const segments = BRAND_KEYS.map(key => ({
    key, value: r.variableX[key], label: t(`chart.brandLegend.${key}`), display: percent(r.variableX[key]),
  }));
  const top = segments.reduce((a, b) => (b.value > a.value ? b : a));
  mount($('brandDonut'), buildDonut({
    segments, stroke: 20,
    center: { key: top.key, display: top.display, label: top.label },
    ariaLabel: t('chart.brandAria', { parts: segments.map(sg => `${sg.label} ${sg.display}`).join(', ') }),
  }));
}

function costRows(section) {
  const max = Math.max(...section.rows.map(row => row.value), 1);
  return h('ul', { class: 'cost-rows' }, section.rows.map(row => {
    const pct = row.value > 0 ? Math.max(8, Math.round((row.value / max) * 92)) : 0;
    return h('li', { class: 'cost-row' },
      h('span', { class: 'cost-row-inner' },
        h('span', { class: 'cost-label' }, row.label,
          row.tag ? h('span', { class: ['cost-row-tag', row.tag], text: t(`cards.tags.${row.tag}`) }) : null),
        pct ? h('span', { class: 'cost-micro-bar', style: { width: `${pct}%` }, 'aria-hidden': 'true' }) : null),
      h('span', { class: 'cost-val', text: money(row.value) }));
  }));
}

function renderCards(r) {
  const cards = costSections(r).map(sec => h('article', { class: ['detail-card', sec.key] },
    h('div', { class: 'card-header' },
      h('span', { class: 'card-header-icon', 'aria-hidden': 'true' }),
      h('h3', { class: 'card-title', text: sec.title }),
      h('span', { class: 'card-total', text: money(sec.total) })),
    sec.notice ? h('p', { class: 'reg-notice' }, rich(sec.notice)) : null,
    sec.notes.map(n => h('p', { class: 'no-exposure-note', text: n })),
    costRows(sec)));

  cards.push(h('article', { class: 'detail-card brand' },
    h('div', { class: 'card-header' },
      h('span', { class: 'card-header-icon', 'aria-hidden': 'true' }),
      h('h3', { class: 'card-title', text: t('cards.brand') })),
    h('div', { class: 'brand-impact' },
      h('p', { class: 'brand-impact-title', text: t('cards.brandImpactTitle') }),
      h('p', { class: 'brand-impact-body', text: t('cards.churnText') }),
      h('p', { class: 'brand-impact-body scale', text: t('cards.onePercent', { amount: money(r.onePercentOfRevenue) }) }))));

  mount($('detailCards'), cards);
}

/** @param {any} r @param {string} [liClass] */
export function timelineLegendItems(r, liClass = '') {
  const tl = r.timeline;
  return [
    ['y1', money(tl.year1), t('timeline.year1Label'), t('timeline.year1Desc')],
    ['y2', money(tl.year2Plus), t('timeline.year2Label'), t('timeline.year2Desc')],
    ['vx', 'Variable X', t('timeline.varXLabel'), t('timeline.varXDesc')],
  ].map(([cls, amount, label, desc]) => h('li', { class: [cls, liClass] },
    h('span', { class: ['tl-swatch', cls], 'aria-hidden': 'true' }),
    h('span', null, h('strong', { text: amount }), ` ${label} ${desc}`)));
}

function renderTimeline(r) {
  mount($('timelineChart'), buildTimelineChart(r.timeline, { idPrefix: 'tl', animate: true, money }));
  mount($('timelineLegend'), timelineLegendItems(r));
}

/** Links for a list of source ids. @param {any} model @param {string[]} ids */
export function sourceLinks(model, ids) {
  return ids.map(id => {
    const meta = model.sources[id] || {};
    return meta.url
      ? h('a', { href: meta.url, target: '_blank', rel: 'noopener noreferrer', class: 'text-link', text: t(`sources.${id}`) })
      : h('span', { text: t(`sources.${id}`) });
  });
}

function renderThreatLandscape(model) {
  mount($('ncta'),
    h('div', { class: 'ncta-header' },
      h('span', { class: 'ncta-dot', 'aria-hidden': 'true' }),
      h('h2', { class: 'ncta-title', id: 'nctaTitle', text: t('ncta.title') })),
    h('div', { class: 'ncta-body' },
      h('p', { class: 'ncta-meta' }, sourceLinks(model, ['cccsNcta2025'])[0], ` — ${t('ncta.meta')}`),
      h('p', { class: 'ncta-intro', text: t('ncta.intro') }),
      h('ol', { class: 'ncta-trends' }, t('ncta.trends').map((tr, i) => h('li', { class: 'trend-item' },
        h('span', { class: 'trend-num', 'aria-hidden': 'true', text: `T${i + 1}` }),
        h('span', { class: 'trend-text' }, h('strong', { text: `${tr.label}:` }), ` ${tr.body}`)))),
      h('div', { class: 'ncta-alert' },
        h('p', { class: 'ncta-alert-title', text: t('ncta.alertTitle') }),
        h('p', { class: 'ncta-alert-body' }, rich(t('ncta.alert'))),
        h('p', { class: 'ncta-alert-sources' }, `${t('ncta.sourcesLabel')} `,
          sourceLinks(model, ['ibm2025', 'sophos2025']).flatMap((a, i) => (i ? [' · ', a] : [a]))))));
}

/** Sources cited anywhere in the model, in registry order. @param {any} model */
export function citedSources(model) {
  return Object.keys(model.sources).filter(id => id !== 'author');
}

function renderSources(model) {
  mount($('disclaimerSources'), sourceLinks(model, citedSources(model)).map(a => h('li', { class: 'source-chip' }, a)));
}
