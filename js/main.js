// Entry point: loads data, wires the UI, keeps the URL in sync.
import { calculate } from './engine/calculate.js';
import { initI18n, setLang, getLang, t, applyStatic, LANGS } from './i18n.js';
import { $ } from './ui/dom.js';
import { initForm, translateForm, readForm, validateForm, setForm } from './ui/form.js';
import { renderDashboard } from './ui/dashboard.js';
import { renderAssumptions } from './ui/assumptions.js';
import { renderPrintReport, renderPrintEmpty } from './ui/print.js';
import { readLangParam, decodeScenario, writeUrl } from './state.js';

let model;
let current = null; // { inputs, result } while results are on screen

async function loadJSON(path) {
  const res = await fetch(path, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
  return res.json();
}

async function boot() {
  let en, fr;
  try {
    [model, en, fr] = await Promise.all(['data/model.json', 'i18n/en.json', 'i18n/fr.json'].map(loadJSON));
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
  if (LANGS.includes(param)) return param;
  return (navigator.language || '').toLowerCase().startsWith('fr') ? 'fr' : 'en';
}

function validValues() {
  return {
    incident: Object.keys(model.incidents.v),
    industry: Object.keys(model.industries.v),
    records: Object.keys(model.records.v),
    revenue: Object.keys(model.revenue.v),
    cause: Object.keys(model.causes.v),
    province: Object.keys(t('options.province')),
  };
}

function openScenarioFromUrl() {
  const scenario = decodeScenario(location.hash, validValues());
  if (scenario) {
    setForm(scenario);
    run();
  }
}

function applyLanguage() {
  const lang = getLang();
  document.documentElement.lang = lang;
  document.title = t('meta.title');
  document.querySelector('meta[name="description"]').setAttribute('content', t('meta.description'));
  document.querySelectorAll('.lang-btn').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
  applyStatic();
  translateForm();
  renderAssumptions(model);
  if (current) render(current.result);
  else renderPrintEmpty();
}

function render(result) {
  renderDashboard(result, model);
  renderPrintReport(result, model);
}

function run() {
  const inputs = readForm();
  if (!validateForm(inputs)) return;
  const result = calculate(inputs, model);
  current = { inputs, result };
  render(result);
  $('formSection').hidden = true;
  $('results').hidden = false;
  $('dashActions').hidden = false;
  writeUrl({ lang: getLang(), inputs });
  window.scrollTo({ top: 0 });
  $('exposureLabelText').focus({ preventScroll: true });
}

function editScenario() {
  current = null;
  renderPrintEmpty();
  $('results').hidden = true;
  $('dashActions').hidden = true;
  $('formSection').hidden = false;
  writeUrl({ lang: getLang(), inputs: null });
  window.scrollTo({ top: 0 });
  $('incident').focus({ preventScroll: true });
}

function announce(msg) {
  $('liveStatus').textContent = msg;
}

function wireActions() {
  document.querySelectorAll('.lang-btn').forEach(btn => btn.addEventListener('click', () => {
    if (btn.dataset.lang === getLang()) return;
    setLang(btn.dataset.lang);
    applyLanguage();
    writeUrl({ lang: getLang(), inputs: current ? current.inputs : null });
  }));

  $('btnPrint').addEventListener('click', () => window.print());
  $('btnEdit').addEventListener('click', editScenario);

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
