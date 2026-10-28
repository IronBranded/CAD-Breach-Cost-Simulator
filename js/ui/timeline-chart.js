// @ts-check
// Cumulative cost timeline (SVG). One builder for both the dashboard and the
// print report; colours come from CSS so each context themes it.
// The Variable X zone after month 36 is drawn without a dollar scale on purpose.
import { s } from './dom.js?v=2026.11.0';
import { t } from '../i18n.js?v=2026.11.0';

const X = { day0: 40, day30: 230, month12: 420, month36: 610, end: 890 };
const Y_TOP = 24;
const Y_BASE = 270;

/**
 * @param {{year1:number, year2Plus:number, total:number}} timeline  result.timeline
 * @param {{ idPrefix: string, animate: boolean, money: (n:number)=>string }} o
 */
export function buildTimelineChart(timeline, { idPrefix, animate, money }) {
  const { year1, total } = timeline;
  const max = Math.max(total, 1) * 1.25;
  const y = v => Y_BASE - (v / max) * (Y_BASE - Y_TOP);
  const yY1 = y(year1);
  const yTot = y(total);
  const axis = t('timeline.axis');
  const line = `M${X.day0},${Y_BASE} L${X.day30},${yY1} L${X.month12},${yY1} L${X.month36},${yTot}`;
  const lineId = `${idPrefix}-line`;
  const areaId = `${idPrefix}-area`;
  const varxId = `${idPrefix}-varx`;
  const midX = (X.month36 + X.end) / 2;

  return s('svg', {
    viewBox: '0 0 960 320', preserveAspectRatio: 'xMidYMid meet', role: 'img',
    'aria-label': t('timeline.aria', { year1: money(year1), year2: money(timeline.year2Plus), total: money(total) }),
    class: animate ? 'tl-animate' : null,
  },
  s('defs', null,
    s('linearGradient', { id: lineId, x1: 0, y1: 0, x2: 1, y2: 0 },
      s('stop', { offset: '0%', class: 'tl-stop-1' }),
      s('stop', { offset: '55%', class: 'tl-stop-2' }),
      s('stop', { offset: '100%', class: 'tl-stop-3' })),
    s('linearGradient', { id: areaId, x1: 0, y1: 0, x2: 0, y2: 1 },
      s('stop', { offset: '0%', class: 'tl-area-stop', 'stop-opacity': 0.18 }),
      s('stop', { offset: '100%', class: 'tl-area-stop', 'stop-opacity': 0 })),
    s('linearGradient', { id: varxId, x1: 0, y1: 0, x2: 1, y2: 0 },
      s('stop', { offset: '0%', class: 'tl-varx-stop', 'stop-opacity': 0.16 }),
      s('stop', { offset: '100%', class: 'tl-varx-stop', 'stop-opacity': 0 }))),
  s('line', { class: 'tl-grid', x1: X.day0, y1: Y_TOP, x2: X.day0, y2: Y_BASE }),
  s('line', { class: 'tl-grid', x1: X.day0, y1: Y_BASE, x2: X.end, y2: Y_BASE }),

  // Variable X: open-ended, no dollar scale
  s('g', { class: 'tl-varx' },
    s('path', { class: 'tl-varx-band', d: `M${X.month36},${yTot} L${X.end},${Y_TOP} L${X.end},${Y_BASE} L${X.month36},${Y_BASE} Z`, fill: `url(#${varxId})` }),
    s('line', { class: 'tl-varx-sep', x1: X.month36, y1: Y_TOP, x2: X.month36, y2: Y_BASE }),
    s('line', { class: 'tl-varx-line', x1: X.month36, y1: yTot, x2: X.end - 6, y2: Y_TOP + 6 }),
    s('path', { class: 'tl-varx-arrow', d: `M${X.end - 16},${Y_TOP + 4} L${X.end - 4},${Y_TOP + 4} L${X.end - 4},${Y_TOP + 16}` }),
    s('text', { class: 'tl-varx-label', x: midX + 30, y: Math.min(Y_BASE - 40, (yTot + Y_TOP) / 2 + 30), 'text-anchor': 'middle', text: t('timeline.varXShort') })),

  // Known costs: year 1, then fines & settlements by month 36
  s('path', { class: 'tl-area', d: `${line} L${X.month36},${Y_BASE} L${X.day0},${Y_BASE} Z`, fill: `url(#${areaId})` }),
  s('path', { class: 'tl-line', d: line, stroke: `url(#${lineId})`, pathLength: 1 }),
  s('circle', { class: 'tl-point y1', cx: X.day30, cy: yY1, r: 4 }),
  s('circle', { class: 'tl-point y2', cx: X.month36, cy: yTot, r: 4 }),
  s('text', { class: 'tl-value y1', x: X.day30, y: Math.max(Y_TOP + 4, yY1 - 12), 'text-anchor': 'middle', text: money(year1) }),
  s('text', { class: 'tl-value y2', x: X.month36 - 10, y: Math.max(Y_TOP + 4, yTot - 12), 'text-anchor': 'end', text: money(total) }),

  s('text', { class: 'tl-axis', x: X.day0, y: Y_BASE + 25, 'text-anchor': 'start', text: axis.day0 }),
  s('text', { class: 'tl-axis', x: X.day30, y: Y_BASE + 25, 'text-anchor': 'middle', text: axis.day30 }),
  s('text', { class: 'tl-axis', x: X.month12, y: Y_BASE + 25, 'text-anchor': 'middle', text: axis.month12 }),
  s('text', { class: 'tl-axis', x: X.month36, y: Y_BASE + 25, 'text-anchor': 'middle', text: axis.month36 }),
  s('text', { class: 'tl-axis varx', x: midX, y: Y_BASE + 25, 'text-anchor': 'middle', text: axis.years }));
}
