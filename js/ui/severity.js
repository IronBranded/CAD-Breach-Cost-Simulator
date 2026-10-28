// @ts-check
// Severity band: gross exposure as a share of annual revenue, with tier
// thresholds marked, and the Canadian average breach cost as a reference line.
import { h } from './dom.js?v=2026.11.0';
import { t, number, percent, moneyCompact } from '../i18n.js?v=2026.11.0';

/** @param {any} severity  result.severity @param {any} tiers model.benchmark.severityTiers.v */
export function buildSeverityBand(severity, tiers) {
  const { tier, ratio, benchmark, benchmarkRatio } = severity;
  const scale = Math.max(ratio * 1.2, tiers.critical * 1.2);
  const pos = v => `${Math.min(100, (v / scale) * 100)}%`;
  const tierLabel = t(`severity.tiers.${tier}`);
  const pct = percent(ratio, ratio < 0.1 ? 1 : 0);
  const avgRatio = benchmarkRatio < 0.1 ? `< ${number(0.1, 1)}` : number(benchmarkRatio, 1);

  const fill = h('div', { class: ['severity-fill', `tier-${tier}`] });
  requestAnimationFrame(() => requestAnimationFrame(() => { fill.style.width = pos(ratio); }));

  return h('div', {
    class: 'severity-band', role: 'img',
    'aria-label': t('severity.aria', { tier: tierLabel, pct, ratio: avgRatio }),
  },
  h('div', { class: 'severity-track', 'aria-hidden': 'true' },
    fill,
    ['medium', 'high', 'critical'].map(k => h('div', { class: ['severity-marker', k], style: { left: pos(tiers[k]) } }))),
  h('div', { class: 'severity-labels', 'aria-hidden': 'true' },
    h('span', { text: t('severity.start') }),
    h('span', { text: t('severity.share', { pct }) }),
    h('span', { class: ['severity-pill', tier], text: t('severity.label', { tier: tierLabel }) })),
  h('p', { class: 'severity-benchmark', 'aria-hidden': 'true', text: t('severity.benchmark', { ratio: avgRatio, amount: moneyCompact(benchmark) }) }));
}
