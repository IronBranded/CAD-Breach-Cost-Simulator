// @ts-check
// Methodology page: formulas, calibration notes, every model parameter and the sources.
import { initI18n, setLang, getLang, t, applyStatic, LANGS } from './i18n.js?v=2026.11.0';
import { $, h, mount } from './ui/dom.js?v=2026.11.0';
import { renderAssumptions } from './ui/assumptions.js?v=2026.11.0';
import { readLangParam } from './state.js?v=2026.11.0';

/** @type {any} */ let model;

async function loadJSON(path) {
  const res = await fetch(path, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
  return res.json();
}

function render() {
  const lang = getLang();
  document.documentElement.lang = lang;
  document.title = `${t('methodology.title')} — ${t('header.title')} ${t('header.titleMuted')}`;
  document.querySelectorAll('.lang-btn').forEach(b => b.setAttribute('aria-pressed', String(/** @type {HTMLElement} */ (b).dataset.lang === lang)));
  $('backLink').setAttribute('href', `index.html?lang=${lang}`);
  applyStatic();
  $('methodVersion').textContent = t('assumptions.version', { version: model.version });
  mount($('formulas'), t('methodology.formulas').map(f => [h('dt', { text: f.name }), h('dd', { text: f.text })]));
  mount($('calibration'), t('methodology.calibration').map(c => h('li', { text: c })));
  renderAssumptions(model, { body: $('assumptionsBody'), headingTag: 'h3' });
  mount($('sourcesList'), Object.entries(model.sources).filter(([id]) => id !== 'author').map(([id, meta]) => h('li', null,
    meta.url ? h('a', { class: 'text-link', href: meta.url, target: '_blank', rel: 'noopener noreferrer', text: t(`sources.${id}`) }) : t(`sources.${id}`),
    meta.url ? h('span', { class: 'method-url', text: new URL(meta.url).hostname }) : null)));
}

async function boot() {
  let en, fr;
  try {
    [model, en, fr] = await Promise.all(['data/model.json', 'i18n/en.json', 'i18n/fr.json'].map(loadJSON));
  } catch (err) {
    console.error(err);
    $('loadError').hidden = false;
    return;
  }
  initI18n({ en, fr });
  const param = readLangParam();
  setLang(param && LANGS.includes(param) ? param : (navigator.language || '').toLowerCase().startsWith('fr') ? 'fr' : 'en');
  document.querySelectorAll('.lang-btn').forEach(btn => btn.addEventListener('click', () => {
    const lang = /** @type {HTMLElement} */ (btn).dataset.lang;
    if (!lang || lang === getLang()) return;
    setLang(lang);
    const url = new URL(location.href);
    url.searchParams.set('lang', lang);
    history.replaceState(null, '', url.pathname + url.search);
    render();
  }));
  render();
}

boot();
