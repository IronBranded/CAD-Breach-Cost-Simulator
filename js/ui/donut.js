// Donut chart with a legend. Rebuilt from scratch on every render, so event
// listeners never accumulate across runs or language switches.
import { h, s } from './dom.js';
import { percent } from '../i18n.js';

const R = 60;
const C = 2 * Math.PI * R;

/**
 * @param {object} o
 * @param {{key:string,label:string,value:number,display:string,amount?:string}[]} o.segments
 *        value: share (0-1); display: text shown in the centre on hover; amount: optional legend amount
 * @param {{display:string,label:string,key:string}} o.center  default centre content
 * @param {string} o.ariaLabel
 * @param {number} [o.stroke=22]
 */
export function buildDonut({ segments, center, ariaLabel, stroke = 22 }) {
  const amountEl = h('span', { class: ['donut-center-amount', `txt-${center.key}`], text: center.display });
  const labelEl = h('span', { class: 'donut-center-label', text: center.label });

  const show = seg => {
    amountEl.textContent = seg.display;
    amountEl.setAttribute('class', `donut-center-amount txt-${seg.key}`);
    labelEl.textContent = seg.label;
  };
  const reset = () => {
    amountEl.textContent = center.display;
    amountEl.setAttribute('class', `donut-center-amount txt-${center.key}`);
    labelEl.textContent = center.label;
  };

  const circles = [];
  let offset = 0;
  let resetTimer;
  for (const seg of segments) {
    const arc = Math.max(0, seg.value) * C;
    const circle = s('circle', {
      class: ['donut-seg', `seg-${seg.key}`], cx: 80, cy: 80, r: R, 'stroke-width': stroke,
      'stroke-dasharray': `0 ${C}`, 'stroke-dashoffset': -offset,
    });
    circle.dataset.final = `${arc} ${C - arc}`;
    const enter = () => { circle.setAttribute('stroke-width', stroke + 7); show(seg); };
    const leave = () => { circle.setAttribute('stroke-width', stroke); reset(); };
    circle.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') enter(); });
    circle.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') leave(); });
    circle.addEventListener('pointerdown', e => {
      if (e.pointerType === 'mouse') return;
      clearTimeout(resetTimer);
      circles.forEach(c => c.setAttribute('stroke-width', stroke));
      enter();
      resetTimer = setTimeout(leave, 1500);
    });
    circles.push(circle);
    offset += arc;
  }

  const svg = s('svg', { viewBox: '0 0 160 160', width: 160, height: 160, 'aria-hidden': 'true', focusable: 'false' },
    s('circle', { class: 'donut-track', cx: 80, cy: 80, r: R, 'stroke-width': stroke }),
    ...circles);

  // Animate the arcs in on the next frame (CSS transition on stroke-dasharray).
  requestAnimationFrame(() => requestAnimationFrame(() => {
    circles.forEach(c => c.setAttribute('stroke-dasharray', c.dataset.final));
  }));

  const legend = h('ul', { class: 'legend-list' },
    segments.map(seg => h('li', { class: 'legend-item' },
      h('span', { class: ['legend-swatch', `sw-${seg.key}`], 'aria-hidden': 'true' }),
      h('span', { class: 'legend-name', text: seg.label }),
      h('span', { class: 'legend-pct', text: percent(seg.value) }),
      seg.amount ? h('span', { class: 'legend-amount', text: seg.amount }) : null)));

  return h('div', { class: 'donut' },
    h('div', { class: 'donut-wrap', role: 'img', 'aria-label': ariaLabel },
      svg, h('div', { class: 'donut-center', 'aria-hidden': 'true' }, amountEl, labelEl)),
    legend);
}
