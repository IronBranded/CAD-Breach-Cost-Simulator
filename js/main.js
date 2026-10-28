// @ts-check
// Entry point: loads data, wires the UI, keeps the URL in sync.
import { calculate } from './engine/calculate.js?v=2026.11.0';
import { simulate } from './engine/simulate.js?v=2026.11.0';
import { controlSavings, ransomComparison } from './engine/savings.js?v=2026.11.0';
import { initI18n, setLang, getLang, t, applyStatic, LANGS } from './i18n.js?v=2026.11.0';
import { $ } from './ui/dom.js?v=2026.11.0';
import { initForm, translateForm, readForm, validateForm, setForm, setControl } from './ui/form.js?v=2026.11.0';
import { renderDashboard } from './ui/dashboard.js?v=2026.11.0';
import { renderRange, renderSavings, renderCompare, renderRelated } from './ui/insights.js?v=2026.11.0';
import { renderAssumptions } from './ui/assumptions.js?v=2026.11.0';
import { renderPrintReport, renderPrintEmpty } from './ui/print.js?v=2026.11.0';
import { readLangParam, decodeScenario, writeUrl } from './state.js?v=2026.11.0';

const MAX_PINNED = 3;
/** @type {any} */ let model;
/** @type {any} */ let related;
/** @type {{inputs:any, result:any, sim:any}|null} */ let current = null;
/** @type {{inputs:any, result:any, sim:any}[]} */ const pinned = [];
/** @type {string|null} */ let linkVersion = null;

async function loadJSON(path) {
  const res = await fetch(path, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
  return res.json();
}

async function boot() {
  let en, fr;
  try {
    [model, en, fr, related] = await Promise.all(['data/model.json', 'i18n/en.json', 'i18n/fr.json', 'data/related.json'].map(loadJSON));
  } catch (err) {
    console.error(err);
    $('loadError').hidden = false;
    $('formSection').hidden = true;
    return;
  }
  initI18n({ en, fr });
  setLang(pickLanguage());
  initForm(model, { onSubmit: () => run() });
  wireActions();
  applyLanguage();
  openScenarioFromUrl();
  window.addEventListener('hashchange', openScenarioFromUrl);
}

function pickLanguage() {
  const param = readLangParam();
  if (param && LANGS.includes(param)) return param;
  return (navigator.language || '').toLowerCase().startsWith('fr') ? 'fr' : 'en';
}

function validValues() {
  return {
    incident: Object.keys(model.incidents.v),
    industry: Object.keys(model.industries.v),
    sector: ['private', 'public'],
    records: Object.keys(model.records.v),
    cause: Object.keys(model.causes.v),
    province: Object.keys(t('options.province')),
  };
}

function openScenarioFromUrl() {
  const decoded = decodeScenario(location.hash, validValues(), model);
  if (!decoded) return;
  setForm(decoded.values);
  linkVersion = decoded.version;
  run();
}

function applyLanguage() {
  const lang = getLang();
  document.documentElement.lang = lang;
  document.title = t('meta.title');
  /** @type {HTMLMetaElement} */ (document.querySelector('meta[name="description"]')).content = t('meta.description');
  document.querySelectorAll('.lang-btn').forEach(b => b.setAttribute('aria-pressed', String(/** @type {HTMLElement} */ (b).dataset.lang === lang)));
  document.querySelectorAll('a[href^="methodology.html"]').forEach(a => a.setAttribute('href', `methodology.html?lang=${lang}`));
  applyStatic();
  translateForm();
  renderAssumptions(model, { body: $('assumptionsBody'), version: $('assumptionsVersion') });
  if (current) render();
  else renderPrintEmpty();
}

/** @param {any} inputs */
function compute(inputs) {
  return { inputs, result: calculate(inputs, model), sim: simulate(inputs, model) };
}

function render() {
  if (!current) return;
  const { inputs, result, sim } = current;
  renderDashboard(result, sim, model);
  renderRange(sim, result);
  renderSavings(controlSavings(inputs, model), ransomComparison(inputs, model), result, toggleControl);
  renderCompare(pinned, current, removePinned);
  renderRelated(related, inputs.incident);
  renderPrintReport(result, sim, model);
  renderVersionBanner();
  updatePinButton();
}

function renderVersionBanner() {
  const banner = $('versionBanner');
  const stale = !!linkVersion && linkVersion !== model.version;
  banner.hidden = !stale;
  if (stale) banner.textContent = t('results.versionMismatch', { old: linkVersion, current: model.version });
}

/** @param {{ keepPosition?: boolean }} [opts] */
function run(opts = {}) {
  const inputs = readForm();
  if (!validateForm(inputs)) return;
  current = compute(inputs);
  render();
  $('formSection').hidden = true;
  $('results').hidden = false;
  $('dashActions').hidden = false;
  writeUrl({ lang: getLang(), inputs, version: model.version });
  if (opts.keepPosition) {
    announce(t('results.title'));
  } else {
    window.scrollTo({ top: 0 });
    $('exposureLabelText').focus({ preventScroll: true });
  }
}

/** "Apply" / "Remove" in the savings card: change one control and recalculate in place. */
function toggleControl(id, on) {
  setControl(id, on);
  linkVersion = null;
  run({ keepPosition: true });
}

function editScenario() {
  current = null;
  linkVersion = null;
  renderPrintEmpty();
  $('results').hidden = true;
  $('dashActions').hidden = true;
  $('formSection').hidden = false;
  writeUrl({ lang: getLang(), inputs: null, version: model.version });
  window.scrollTo({ top: 0 });
  $('incident').focus({ preventScroll: true });
}

function pinCurrent() {
  if (!current) return;
  if (pinned.length >= MAX_PINNED) {
    announce(t('actions.pinFull'));
    return;
  }
  pinned.push(current);
  renderCompare(pinned, current, removePinned);
  updatePinButton();
  announce(t('actions.pinned'));
}

function removePinned(index) {
  pinned.splice(index, 1);
  if (current) renderCompare(pinned, current, removePinned);
  updatePinButton();
}

function updatePinButton() {
  const btn = $('btnPin');
  const isPinned = !!current && pinned.includes(current);
  btn.textContent = t(isPinned ? 'actions.pinned' : pinned.length >= MAX_PINNED ? 'actions.pinFull' : 'actions.pin');
  /** @type {HTMLButtonElement} */ (btn).disabled = isPinned || pinned.length >= MAX_PINNED;
}

function announce(msg) {
  $('liveStatus').textContent = msg;
}

function wireActions() {
  document.querySelectorAll('.lang-btn').forEach(btn => btn.addEventListener('click', () => {
    const lang = /** @type {HTMLElement} */ (btn).dataset.lang;
    if (!lang || lang === getLang()) return;
    setLang(lang);
    applyLanguage();
    writeUrl({ lang: getLang(), inputs: current ? current.inputs : null, version: model.version });
  }));

  $('btnPrint').addEventListener('click', () => window.print());
  $('btnEdit').addEventListener('click', editScenario);
  $('btnPin').addEventListener('click', pinCurrent);

  const copyBtn = $('btnCopyLink');
  let restoreTimer;
  copyBtn.addEventListener('click', async () => {
    let msg;
    try {
      await navigator.clipboard.writeText(location.href);
      msg = t('actions.linkCopied');
    } catch {
      msg = t('actions.linkCopyFailed');
    }
    copyBtn.textContent = msg;
    announce(msg);
    clearTimeout(restoreTimer);
    restoreTimer = setTimeout(() => { copyBtn.textContent = t('actions.copyLink'); }, 2000);
  });
}

boot();
