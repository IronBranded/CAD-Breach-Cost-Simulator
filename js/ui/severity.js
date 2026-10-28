// Severity band: gross exposure against the Canadian average breach cost.
import { h } from './dom.js';
import { t, number, moneyCompact as millions } from '../i18n.js';

export function buildSeverityBand(severity, grossTotal) {
  const { tier, ratio, benchmark } = severity;
  const scale = Math.max(grossTotal * 1.4, benchmark * 1.15);
  const fillPct = Math.min(100, Math.round((grossTotal / scale) * 100));
  const avgPct = Math.round((benchmark / scale) * 100);
  const tierLabel = t(`severity.tiers.${tier}`);

  const fill = h('div', { class: ['severity-fill', `tier-${tier}`] });
  requestAnimationFrame(() => requestAnimationFrame(() => { fill.style.width = `${fillPct}%`; }));

  return h('div', {
    class: 'severity-band', role: 'img',
    'aria-label': t('severity.aria', { tier: tierLabel, ratio: number(ratio, 1), amount: millions(benchmark) }),
  },
  h('div', { class: 'severity-track', 'aria-hidden': 'true' },
    fill,
    h('div', { class: 'severity-marker', style: { left: `${avgPct}%` } })),
  h('div', { class: 'severity-labels', 'aria-hidden': 'true' },
    h('span', { text: t('severity.start') }),
    h('span', { text: t('severity.average', { amount: millions(benchmark) }) }),
    h('span', { class: ['severity-pill', tier], text: tierLabel })));
}
