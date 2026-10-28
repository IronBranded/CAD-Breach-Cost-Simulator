// @ts-check
// Printable A4 report, kept in the live page (#printReport) and shown only by
// print.css. Rendered with every result, so Ctrl/Cmd+P also prints the report.
import { t, money, moneyCompact, percent, locale } from '../i18n.js?v=2026.11.0';
import { h, $, mount } from './dom.js?v=2026.11.0';
import { costSections, shares, optionLabel, enabledControls } from './sections.js?v=2026.11.0';
import { buildTimelineChart } from './timeline-chart.js?v=2026.11.0';
import { timelineLegendItems, citedSources } from './dashboard.js?v=2026.11.0';
import { buildExceedanceChart, rangeBasis } from './insights.js?v=2026.11.0';

export function renderPrintEmpty() {
  mount($('printReport'), h('p', { class: 'pr-empty', text: t('print.empty') }));
}

/** @param {any} r @param {any} sim @param {any} model */
export function renderPrintReport(r, sim, model) {
  const { inputs } = r;
  const date = new Date().toLocaleDateString(locale(), { year: 'numeric', month: 'long', day: 'numeric' });
  const totalLabel = t(r.insurance.applied ? 'results.exposureNet' : 'results.exposureGross');
  const sh = shares(r);
  const ins = r.insurance;
  const basis = rangeBasis(sim, r);
  const controls = enabledControls(inputs);

  const metaRow = (label, value, cls) => h('div', { class: 'pr-meta-row' },
    h('span', { class: 'pr-meta-label', text: label }), h('span', { class: ['pr-meta-value', cls], text: value }));
  const param = (label, value) => h('div', { class: 'pr-param' },
    h('div', { class: 'pr-param-label', text: label }), h('div', { class: 'pr-param-value', text: value }));

  const params = [
    param(t('form.labels.incident'), optionLabel('incident', inputs.incident)),
    param(t('form.labels.industry'), optionLabel('industry', inputs.industry)),
    param(t('form.labels.sector'), optionLabel('sector', inputs.sector)),
    param(t('form.labels.revenue'), money(inputs.revenue)),
    param(t('assumptions.cols.employees'), inputs.employees ? String(inputs.employees) : '—'),
    param(t('form.labels.province'), t(`options.provinceShort.${inputs.province}`)),
    param(t('form.labels.cause'), optionLabel('cause', inputs.cause)),
    param(t('print.dataExposure'), r.dataExposed ? `${t('print.yes')} · ${optionLabel('records', inputs.records)}` : t('print.no')),
    param(t('results.badges.phi'), t(inputs.phi ? 'print.yes' : 'print.no')),
    param(t('print.insurance'), ins.applied
      ? t('print.insuranceValue', { limit: money(ins.limit), deductible: money(ins.deductible) })
      : t('print.insuranceNone')),
    param(t('print.controls'), controls.length ? controls.map(id => t(`form.controls.${id}.label`)).join(' · ') : t('print.controlsNone')),
    inputs.incident === 'Ransomware' ? param(t('form.ransomPaid'), t(inputs.ransomPaid === false ? 'print.no' : 'print.yes')) : null,
  ].filter(Boolean);

  const detail = [
    t('results.range', { p10: money(basis.summary.p10), p90: money(basis.summary.p90) }),
    ins.applied && r.grossTotal !== r.netTotal ? t('print.gross', { amount: money(r.grossTotal) }) : null,
    ins.applied ? t('results.insuranceCovered', { amount: money(ins.covered) }) : null,
    ins.premiumIncrease > 0 ? t('results.premiumIncluded', { amount: money(ins.premiumIncrease) }) : null,
    `${t('severity.label', { tier: t(`severity.tiers.${r.severity.tier}`) })} · ${t('severity.share', { pct: percent(r.severity.ratio, 1) })}`,
  ].filter(Boolean).join(' · ');

  const cards = costSections(r).map(sec => h('div', { class: ['pr-card', sec.key] },
    h('div', { class: 'pr-card-accent' }),
    h('div', { class: 'pr-card-head' },
      h('span', { class: 'pr-card-title', text: sec.title }),
      h('span', { class: 'pr-card-total', text: money(sec.total) })),
    h('div', { class: 'pr-card-rows' },
      sec.rows.map(row => h('div', { class: 'pr-row' },
        h('span', { class: 'pr-row-label', text: row.label }),
        h('span', { class: 'pr-row-amount', text: money(row.value) }))),
      sec.notes.map(n => h('div', { class: 'pr-row-note', text: n })))));
  cards.push(h('div', { class: 'pr-card brand' },
    h('div', { class: 'pr-card-accent' }),
    h('div', { class: 'pr-card-head' },
      h('span', { class: 'pr-card-title', text: t('cards.brand') }),
      h('span', { class: 'pr-card-total varx', text: 'Variable X' })),
    h('div', { class: 'pr-card-body' },
      h('div', { class: 'pr-card-body-title', text: t('cards.brandImpactTitle') }),
      h('div', { class: 'pr-row-note', text: `${t('cards.churnText')} ${t('cards.onePercent', { amount: money(r.onePercentOfRevenue) })}` }))));

  const page1 = h('section', { class: 'pr-page' },
    h('div', { class: 'pr-topbar' }),
    h('div', { class: 'pr-head' },
      h('div', { class: 'pr-head-left' },
        h('div', { class: 'pr-eyebrow', text: t('header.eyebrow') }),
        h('div', { class: 'pr-title' }, t('header.title'), ' ', h('span', { class: 'pr-title-muted', text: t('header.titleMuted') }))),
      h('div', { class: 'pr-meta' },
        metaRow(t('print.generatedOn'), date),
        metaRow(t('print.classification'), t('print.confidential'), 'red'),
        metaRow(t('print.regime'), t(`regimes.labels.${r.legal.regime}`), 'blue'),
        inputs.phi ? metaRow(t('cards.tags.phi'), t('results.badges.phi')) : null)),
    h('div', { class: 'pr-rule' }),
    h('div', { class: 'pr-section-label', text: t('print.params') }),
    h('div', { class: 'pr-params' }, params),
    h('div', { class: 'pr-exposure' },
      h('div', { class: 'pr-exposure-main' },
        h('div', { class: 'pr-small-label', text: totalLabel }),
        h('div', { class: 'pr-total', text: money(r.netTotal) }),
        h('div', { class: 'pr-total-detail', text: detail })),
      h('div', { class: 'pr-exposure-cell' },
        h('div', { class: 'pr-small-label', text: t('results.lifecycle') }),
        h('div', { class: 'pr-cell-value', text: t(`results.durations.${inputs.incident}`) })),
      h('div', { class: 'pr-exposure-cell' },
        h('div', { class: 'pr-small-label', text: t('print.split') }),
        ['tech', 'legal', 'biz'].map(k => h('div', { class: 'pr-split-row' },
          h('span', { class: ['pr-dot', k] }),
          h('span', { class: 'pr-split-name', text: t(`chart.legend.${k}`) }),
          h('span', { class: 'pr-split-pct', text: percent(sh[k]) }))))),
    h('div', { class: 'pr-section-label', text: t('print.breakdown') }),
    h('div', { class: 'pr-cards' }, cards),
    h('div', { class: 'pr-total-bar' },
      h('span', { class: 'pr-total-bar-label', text: totalLabel }),
      h('span', { class: 'pr-total-bar-value', text: money(r.netTotal) })),
    h('div', { class: 'pr-footer' },
      h('span', { class: 'pr-footer-icon', text: '⚠' }),
      h('div', null,
        h('p', { class: 'pr-disclaimer', text: `${t('disclaimer')} ${t('print.model', { version: model.version })}.` }),
        h('ul', { class: 'pr-chips' }, citedSources(model).map(id => h('li', { class: 'pr-chip', text: t(`sources.${id}`) }))))));

  const s = basis.summary;
  const page2 = h('section', { class: ['pr-page', 'pr-page-2'] },
    h('div', { class: 'pr-topbar' }),
    h('div', { class: 'pr-eyebrow', text: t('header.eyebrow') }),
    h('div', { class: 'pr-page-title', text: t('timeline.title') }),
    h('div', { class: 'pr-page-sub', text: t('timeline.subtitle') }),
    h('div', { class: 'pr-chart' }, buildTimelineChart(r.timeline, { idPrefix: 'prtl', animate: false, money })),
    h('ul', { class: 'pr-legend' }, timelineLegendItems(r)),
    h('div', { class: 'pr-page-title pr-gap', text: t('range.title') }),
    h('div', { class: 'pr-page-sub', text: `${t('range.subtitle', { runs: String(sim.runs) })} · ${t(`range.basis.${basis.key}`)}` }),
    h('div', { class: 'pr-range' },
      h('div', { class: 'pr-chart pr-lec' }, buildExceedanceChart(s, basis.point, 'prlec')),
      h('ul', { class: 'pr-range-stats' }, ['p10', 'p50', 'p90', 'p99', 'mean'].map(k => h('li', null,
        h('span', { class: 'pr-split-name', text: t(`range.${k}`) }),
        h('span', { class: 'pr-split-pct', text: moneyCompact(s[k]) }))))),
    h('p', { class: 'pr-disclaimer pr-gap-sm', text: t('range.intro') }));

  mount($('printReport'), page1, page2);
}
