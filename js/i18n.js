// @ts-check
// Translations and locale formatting.
import { rich } from './ui/dom.js?v=2026.11.0';

export const LANGS = ['en', 'fr'];
const LOCALE = { en: 'en-CA', fr: 'fr-CA' };
let dicts = {};
let lang = 'en';

export function initI18n(dictionaries) { dicts = dictionaries; }
export function setLang(l) { lang = LANGS.includes(l) ? l : 'en'; }
export const getLang = () => lang;
export const locale = () => LOCALE[lang];

function lookup(dict, key) {
  return key.split('.').reduce((o, k) => (o == null ? undefined : o[k]), dict);
}

/** t('form.labels.incident'), t('results.regime', { regime: 'Loi 25' }). Returns strings, arrays or objects. */
export function t(key, vars) {
  let v = lookup(dicts[lang], key);
  if (v === undefined) v = lookup(dicts.en, key);
  if (v === undefined) {
    console.warn(`i18n: missing key ${key}`);
    return key;
  }
  if (typeof v === 'string' && vars) v = v.replace(/\{(\w+)\}/g, (m, name) => (name in vars ? vars[name] : m));
  return v;
}

/** Whole-dollar CAD amount: "$1,234,567 CAD" / "1 234 567 $ CAD". */
export function money(n) {
  const s = Math.round(n).toLocaleString(locale(), { maximumFractionDigits: 0 });
  return lang === 'fr' ? `${s} $ CAD` : `$${s} CAD`;
}

/** Short CAD amount for tables: "$12,000" / "12 000 $". */
export function moneyShort(n) {
  const s = Math.round(n).toLocaleString(locale(), { maximumFractionDigits: 0 });
  return lang === 'fr' ? `${s} $` : `$${s}`;
}

/** Compact CAD amount for tight spaces: "$11.45M" / "11,45 M$", "$772K" / "772 k$". */
export function moneyCompact(n) {
  const abs = Math.abs(n);
  const [div, en, fr, digits] = abs >= 1e6 ? [1e6, 'M', 'M$', 2] : abs >= 1e3 ? [1e3, 'K', 'k$', 0] : [1, '', '$', 0];
  const v = (n / div).toLocaleString(locale(), { maximumFractionDigits: digits });
  return lang === 'fr' ? `${v}\u00a0${fr}` : `$${v}${en}`;
}

export const number = (n, digits = 2) => Number(n).toLocaleString(locale(), { maximumFractionDigits: digits });
export const percent = (r, digits = 0) => Number(r).toLocaleString(locale(), { style: 'percent', maximumFractionDigits: digits });

/**
 * Apply translations to static markup:
 *   data-i18n="key"            -> textContent
 *   data-i18n-rich="key"       -> text with **bold**
 *   data-i18n-attr="attr:key;attr2:key2"
 */
export function applyStatic(root = document) {
  root.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(/** @type {HTMLElement} */ (el).dataset.i18n || ''); });
  root.querySelectorAll('[data-i18n-rich]').forEach(el => { el.replaceChildren(rich(t(/** @type {HTMLElement} */ (el).dataset.i18nRich || ''))); });
  root.querySelectorAll('[data-i18n-attr]').forEach(el => {
    (/** @type {HTMLElement} */ (el).dataset.i18nAttr || '').split(';').forEach(pair => {
      const [attr, key] = pair.split(':');
      if (attr && key) el.setAttribute(attr.trim(), t(key.trim()));
    });
  });
}
