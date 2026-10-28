// @ts-check
// Tiny DOM helpers. Everything is built with createElement / textContent,
// so translated or data-driven text never goes through innerHTML.

const SVG_NS = 'http://www.w3.org/2000/svg';

function build(el, attrs, children) {
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === undefined || v === null || v === false) continue;
    if (k === 'class') el.setAttribute('class', Array.isArray(v) ? v.filter(Boolean).join(' ') : v);
    else if (k === 'text') el.textContent = v;
    else if (k === 'style') Object.assign(el.style, v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : String(v));
  }
  for (const c of children.flat(Infinity)) {
    if (c === null || c === undefined || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

/** HTML element: h('div', { class: 'x', text: 'hi' }, child, ...) */
export const h = (tag, attrs, ...children) => build(document.createElement(tag), attrs, children);

/** SVG element. */
export const s = (tag, attrs, ...children) => build(document.createElementNS(SVG_NS, tag), attrs, children);

/** Replace all children of el. */
export function mount(el, ...children) {
  el.replaceChildren(...children.flat(Infinity).filter(c => c !== null && c !== undefined && c !== false));
  return el;
}

/** Text with **bold** segments -> DocumentFragment (the only markup translations may use). */
export function rich(text) {
  const frag = document.createDocumentFragment();
  String(text).split(/(\*\*[^*]+\*\*)/g).forEach(part => {
    if (!part) return;
    if (part.startsWith('**') && part.endsWith('**')) frag.append(h('strong', { text: part.slice(2, -2) }));
    else frag.append(document.createTextNode(part));
  });
  return frag;
}

/** Plain text version of a rich string (for aria labels). */
export const plain = text => String(text).replace(/\*\*/g, '');

export const $ = id => document.getElementById(id);
