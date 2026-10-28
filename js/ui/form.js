// @ts-check
// Scenario form: options, conditional fields, reading values and validation.
import { t } from '../i18n.js?v=2026.11.0';
import { $, h, mount } from './dom.js?v=2026.11.0';

const SELECTS = ['incident', 'industry', 'records', 'sector', 'cause', 'province'];
/** @type {any} */
let model;

const el = id => /** @type {HTMLInputElement} */ ($(id));
const sel = id => /** @type {HTMLSelectElement} */ ($(id));

/** @param {any} m @param {{ onSubmit: () => void }} handlers */
export function initForm(m, { onSubmit }) {
  model = m;
  buildControls();
  sel('incident').addEventListener('change', syncConditional);
  el('dataExposed').addEventListener('change', syncConditional);
  sel('industry').addEventListener('change', onIndustryChange);
  el('phi').addEventListener('change', () => { $('hint-phiAuto').hidden = true; syncPanels(); });
  el('insurance').addEventListener('change', () => { syncPanels(); clearError('insLimit'); });
  for (const id of ['insLimit', 'insDeductible']) el(id).addEventListener('input', () => { clearError('insLimit'); syncInsuranceWarning(); });
  el('insCoinsurance').addEventListener('input', () => clearError('insCoinsurance'));
  el('revenue').addEventListener('input', () => clearError('revenue'));
  for (const id of SELECTS) sel(id).addEventListener('change', () => clearError(id));
  $('scenarioForm').addEventListener('submit', e => { e.preventDefault(); onSubmit(); });
  $('btnReset').addEventListener('click', () => { resetForm(); sel('incident').focus(); });
  translateForm();
}

function buildControls() {
  mount($('controlsGrid'), Object.keys(model.controls.v).map(id => h('div', { class: 'control-item' },
    h('label', { class: 'toggle-label', for: `ctl-${id}` },
      h('input', { type: 'checkbox', id: `ctl-${id}`, class: 'visually-hidden', 'data-control': id, 'aria-describedby': `hint-ctl-${id}` }),
      h('span', { class: 'checkmark', 'aria-hidden': 'true' }),
      h('span', { 'data-i18n': `form.controls.${id}.label` })),
    h('p', { class: 'field-hint', id: `hint-ctl-${id}`, 'data-i18n': `form.controls.${id}.hint` }))));
}

/** Re-label options and messages in the current language, keeping selections. */
export function translateForm() {
  for (const id of SELECTS) fillSelect(id);
  syncConditional();
  for (const id of [...SELECTS, 'revenue', 'insLimit', 'insCoinsurance']) {
    const msg = $(`err-${id}`);
    if (msg && msg.dataset.key) msg.textContent = t(msg.dataset.key);
  }
}

function fillSelect(id) {
  const s = sel(id);
  const current = s.value;
  const opts = [new Option(t(`form.placeholders.${id}`), '')];
  for (const [value, label] of Object.entries(t(`options.${id}`))) opts.push(new Option(label, value));
  s.replaceChildren(...opts);
  if (current && opts.some(o => o.value === current)) s.value = current;
}

function incidentModel() {
  return model.incidents.v[sel('incident').value] || null;
}

function recordsApplicable() {
  const inc = incidentModel();
  return !inc || inc.dataExposure === 'always' || (inc.dataExposure === 'optional' && el('dataExposed').checked);
}

function syncConditional() {
  const id = sel('incident').value;
  const inc = incidentModel();
  const optional = !!inc && inc.dataExposure === 'optional';
  $('exposureToggle').hidden = !optional;
  if (optional) {
    $('exposureLabel').textContent = t(`form.exposure.${id}.label`);
    $('exposureTag').textContent = t(`form.exposure.${id}.tag`);
  } else {
    el('dataExposed').checked = false;
  }
  $('ransomToggle').hidden = !(inc && inc.ransomDecision);
  $('fraudToggle').hidden = !(inc && inc.fraudRecovery);

  const applicable = recordsApplicable();
  sel('records').disabled = !applicable;
  sel('records').required = applicable;
  $('hint-records').hidden = applicable;
  if (!applicable) clearError('records');
  syncPanels();
}

function onIndustryChange() {
  const ind = model.industries.v[sel('industry').value];
  if (!ind) return;
  sel('sector').value = ind.defaultSector || 'private';
  clearError('sector');
  if (ind.impliesPhi && !el('phi').checked) {
    el('phi').checked = true;
    $('hint-phiAuto').hidden = false;
  } else if (!ind.impliesPhi) {
    $('hint-phiAuto').hidden = true;
  }
  syncPanels();
}

function syncPanels() {
  $('phiPanel').hidden = !el('phi').checked;
  if (!el('phi').checked) $('hint-phiAuto').hidden = true;
  $('insPanel').hidden = !el('insurance').checked;
  syncInsuranceWarning();
}

function syncInsuranceWarning() {
  const limit = Number(el('insLimit').value) || 0;
  const ded = Number(el('insDeductible').value) || 0;
  $('insWarning').hidden = !(el('insurance').checked && limit > 0 && ded >= limit);
}

/** @param {string} id */
function numberOrNull(id) {
  const raw = el(id).value.trim();
  if (raw === '') return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : NaN;
}

/** Engine inputs from the form. @returns {import('../types.js').Inputs} */
export function readForm() {
  const val = id => sel(id).value || null;
  const inc = incidentModel();
  const dataExposed = !!inc && inc.dataExposure === 'optional' && el('dataExposed').checked;
  /** @type {Record<string, boolean>} */
  const controls = {};
  document.querySelectorAll('[data-control]').forEach(cb => {
    if (/** @type {HTMLInputElement} */ (cb).checked) controls[/** @type {HTMLElement} */ (cb).dataset.control || ''] = true;
  });
  const coins = numberOrNull('insCoinsurance');
  return /** @type {any} */ ({
    incident: val('incident'),
    industry: val('industry'),
    sector: val('sector'),
    province: val('province'),
    cause: val('cause'),
    revenue: numberOrNull('revenue'),
    employees: numberOrNull('employees'),
    records: recordsApplicable() ? val('records') : null,
    phi: el('phi').checked,
    dataExposed,
    ransomPaid: inc && inc.ransomDecision ? el('ransomPaid').checked : undefined,
    fraudReportedFast: inc && inc.fraudRecovery ? el('fraudReportedFast').checked : undefined,
    controls,
    insurance: el('insurance').checked ? {
      limit: numberOrNull('insLimit'),
      deductible: numberOrNull('insDeductible') ?? 0,
      premium: numberOrNull('insPremium'),
      ransomwareSublimit: numberOrNull('insSublimit'),
      coinsurance: coins === null ? null : coins / 100,
      waitingHours: numberOrNull('insWaiting'),
    } : null,
  });
}

/** Marks invalid fields. Returns true when the form can be submitted. @param {any} inputs */
export function validateForm(inputs) {
  /** @type {[string, string][]} */
  const errors = [];
  for (const id of ['incident', 'industry', 'records', 'sector', 'cause', 'province']) {
    if (id === 'records' && !recordsApplicable()) continue;
    if (!inputs[id]) errors.push([id, 'form.required']);
  }
  if (!(inputs.revenue > 0)) errors.push(['revenue', 'form.revenueRequired']);
  if (inputs.insurance) {
    if (!(inputs.insurance.limit > 0)) errors.push(['insLimit', 'form.insLimitRequired']);
    const c = inputs.insurance.coinsurance;
    if (c !== null && !(c >= 0 && c <= 1)) errors.push(['insCoinsurance', 'form.coinsuranceRange']);
  }
  for (const [id, key] of errors) setError(id, key);
  if (errors.some(([id]) => id === 'insCoinsurance')) /** @type {HTMLDetailsElement} */ (document.querySelector('.advanced-terms')).open = true;
  if (errors.length) $(errors[0][0]).focus();
  return errors.length === 0;
}

function setError(id, key) {
  $(id).setAttribute('aria-invalid', 'true');
  const msg = $(`err-${id}`);
  msg.dataset.key = key;
  msg.textContent = t(key);
}

function clearError(id) {
  $(id).removeAttribute('aria-invalid');
  const msg = $(`err-${id}`);
  if (msg) { msg.textContent = ''; delete msg.dataset.key; }
}

/** Fill the form from a (decoded) scenario. @param {any} v */
export function setForm(v) {
  for (const id of SELECTS) sel(id).value = v[id] || '';
  el('revenue').value = v.revenue ?? '';
  el('employees').value = v.employees ?? '';
  el('dataExposed').checked = !!v.dataExposed;
  el('ransomPaid').checked = v.ransomPaid !== false;
  el('fraudReportedFast').checked = !!v.fraudReportedFast;
  el('phi').checked = !!v.phi;
  $('hint-phiAuto').hidden = true;
  document.querySelectorAll('[data-control]').forEach(cb => {
    /** @type {HTMLInputElement} */ (cb).checked = !!(v.controls && v.controls[/** @type {HTMLElement} */ (cb).dataset.control || '']);
  });
  const ins = v.insurance;
  el('insurance').checked = !!ins;
  el('insLimit').value = ins ? ins.limit : '';
  el('insDeductible').value = ins ? ins.deductible : '';
  el('insPremium').value = ins && ins.premium ? ins.premium : '';
  el('insSublimit').value = ins && ins.ransomwareSublimit ? ins.ransomwareSublimit : '';
  el('insCoinsurance').value = ins && ins.coinsurance ? String(Math.round(ins.coinsurance * 100)) : '';
  el('insWaiting').value = ins && ins.waitingHours !== null && ins.waitingHours !== undefined ? ins.waitingHours : '';
  syncConditional();
}

/** Toggle one control on the form (used by the "Apply" buttons in the savings card). */
export function setControl(id, on) {
  const cb = /** @type {HTMLInputElement|null} */ (document.querySelector(`[data-control="${id}"]`));
  if (cb) cb.checked = on;
}

export function resetForm() {
  /** @type {HTMLFormElement} */ ($('scenarioForm')).reset();
  for (const id of [...SELECTS, 'revenue', 'insLimit', 'insCoinsurance']) clearError(id);
  $('hint-phiAuto').hidden = true;
  syncConditional();
}

