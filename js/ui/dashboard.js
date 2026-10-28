// Results dashboard.
import { t, money, moneyCompact, percent } from '../i18n.js';
import { h, $, mount, rich } from './dom.js';
import { buildDonut } from './donut.js';
import { buildTimelineChart } from './timeline-chart.js';
import { buildSeverityBand } from './severity.js';
import { costSections, shares, optionLabel } from './sections.js';

const BRAND_KEYS = ['churn', 'revenue', 'recruitment', 'partner'];

export function renderDashboard(r, model) {
  renderHero(r);
  renderCostDonut(r);
  renderBrandDonut(r);
  renderCards(r);
  renderTimeline(r);
  renderThreatLandscape();
  renderSources(model);
}

function renderHero(r) {
  const { inputs } = r;
  mount($('heroBadges'),
    h('span', { class: 'badge incident', text: optionLabel('incident', inputs.incident) }),
    h('span', { class: 'badge province', text: t(`options.provinceShort.${inputs.province}`) }),
    inputs.phi ? h('span', { class: 'badge phi', text: t('results.badges.phi') }) : null,
    h('span', {
      class: ['badge', r.dataExposed ? 'exposed' : 'not-exposed'],
      text: t(r.dataExposed ? 'results.badges.exposed' : 'results.badges.notExposed'),
    }));

  $('exposureLabelText').textContent = t(r.insurance.applied ? 'results.exposureNet' : 'results.exposureGross');
  $('grandTotal').textContent = money(r.netTotal);

  const ins = r.insurance;
  mount($('insuranceSummary'),
    ins.applied ? h('div', { class: 'insurance-covered-badge', text: t('results.insuranceCovered', { amount: money(ins.covered) }) }) : null,
    ins.premiumIncrease > 0 ? h('p', { class: 'premium-note', text: t('results.premiumIncluded', { amount: money(ins.premiumIncrease) }) }) : null);

  mount($('severityBand'), buildSeverityBand(r.severity, r.grossTotal));
  $('lifecycleValue').textContent = t(`results.durations.${inputs.incident}`);
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
    sec.note ? h('p', { class: 'no-exposure-note', text: sec.note }) : null,
    costRows(sec)));

  cards.push(h('article', { class: 'detail-card brand' },
    h('div', { class: 'card-header' },
      h('span', { class: 'card-header-icon', 'aria-hidden': 'true' }),
      h('h3', { class: 'card-title', text: t('cards.brand') })),
    h('div', { class: 'brand-impact' },
      h('p', { class: 'brand-impact-title', text: t('cards.brandImpactTitle') }),
      h('p', { class: 'brand-impact-body', text: t('cards.churnText') }))));

  mount($('detailCards'), cards);
}

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

function renderThreatLandscape() {
  mount($('ncta'),
    h('div', { class: 'ncta-header' },
      h('span', { class: 'ncta-dot', 'aria-hidden': 'true' }),
      h('h2', { class: 'ncta-title', id: 'nctaTitle', text: t('ncta.title') })),
    h('div', { class: 'ncta-body' },
      h('p', { class: 'ncta-intro', text: t('ncta.intro') }),
      h('ol', { class: 'ncta-trends' }, t('ncta.trends').map((tr, i) => h('li', { class: 'trend-item' },
        h('span', { class: 'trend-num', 'aria-hidden': 'true', text: `T${i + 1}` }),
        h('span', { class: 'trend-text' }, h('strong', { text: `${tr.label}:` }), ` ${tr.body}`)))),
      h('div', { class: 'ncta-alert' },
        h('p', { class: 'ncta-alert-title', text: t('ncta.alertTitle') }),
        h('p', { class: 'ncta-alert-body' }, rich(t('ncta.alert'))))));
}

export function sourceList(model) {
  return Object.entries(model.sources).filter(([id]) => id !== 'author');
}

function renderSources(model) {
  mount($('disclaimerSources'), sourceList(model).map(([id, meta]) => h('li', { class: 'source-chip' },
    meta.url ? h('a', { href: meta.url, target: '_blank', rel: 'noopener noreferrer', text: t(`sources.${id}`) }) : t(`sources.${id}`))));
}
