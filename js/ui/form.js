// Scenario form: options, conditional fields, reading values and validation.
import { t } from '../i18n.js';
import { $ } from './dom.js';

const SELECTS = ['incident', 'industry', 'records', 'revenue', 'cause', 'province'];
let model;

export function initForm(m, { onSubmit }) {
  model = m;
  $('incident').addEventListener('change', syncExposure);
  $('dataExposed').addEventListener('change', syncExposure);
  $('phi').addEventListener('change', syncPanels);
  $('insurance').addEventListener('change', () => { syncPanels(); clearError('insLimit'); });
  for (const id of ['insLimit', 'insDeductible']) {
    $(id).addEventListener('input', () => { clearError('insLimit'); syncInsuranceWarning(); });
  }
  for (const id of SELECTS) $(id).addEventListener('change', () => clearError(id));
  $('scenarioForm').addEventListener('submit', e => { e.preventDefault(); onSubmit(); });
  $('btnReset').addEventListener('click', () => { resetForm(); $('incident').focus(); });
  translateForm();
}

/** Re-label options and messages in the current language, keeping selections. */
export function translateForm() {
  for (const id of SELECTS) fillSelect(id);
  syncExposure();
  for (const id of [...SELECTS, 'insLimit']) {
    const msg = $(`err-${id}`);
    if (msg && msg.dataset.key) msg.textContent = t(msg.dataset.key);
  }
}

function fillSelect(id) {
  const sel = $(id);
  const current = sel.value;
  const opts = [new Option(t(`form.placeholders.${id}`), '')];
  for (const [value, label] of Object.entries(t(`options.${id}`))) opts.push(new Option(label, value));
  sel.replaceChildren(...opts);
  if (current && opts.some(o => o.value === current)) sel.value = current;
}

function exposureRule() {
  const inc = model.incidents.v[$('incident').value];
  return inc ? inc.dataExposure : null;
}

function recordsApplicable() {
  const rule = exposureRule();
  return rule === null || rule === 'always' || (rule === 'optional' && $('dataExposed').checked);
}

function syncExposure() {
  const id = $('incident').value;
  const rule = exposureRule();
  const optional = rule === 'optional';
  $('exposureToggle').hidden = !optional;
  if (optional) {
    $('exposureLabel').textContent = t(`form.exposure.${id}.label`);
    $('exposureTag').textContent = t(`form.exposure.${id}.tag`);
  } else {
    $('dataExposed').checked = false;
  }
  const applicable = recordsApplicable();
  $('records').disabled = !applicable;
  $('records').required = applicable;
  $('hint-records').hidden = applicable;
  if (!applicable) clearError('records');
  syncPanels();
}

function syncPanels() {
  $('phiPanel').hidden = !$('phi').checked;
  $('insPanel').hidden = !$('insurance').checked;
  syncInsuranceWarning();
}

function syncInsuranceWarning() {
  const limit = Number($('insLimit').value) || 0;
  const ded = Number($('insDeductible').value) || 0;
  $('insWarning').hidden = !($('insurance').checked && limit > 0 && ded >= limit);
}

const numberOrNaN = id => ($(id).value.trim() === '' ? NaN : Number($(id).value));

/** Engine inputs from the form. */
export function readForm() {
  const val = id => $(id).value || null;
  const rule = exposureRule();
  const dataExposed = rule === 'optional' && $('dataExposed').checked;
  return {
    incident: val('incident'),
    industry: val('industry'),
    records: recordsApplicable() ? val('records') : null,
    revenue: val('revenue'),
    cause: val('cause'),
    province: val('province'),
    phi: $('phi').checked,
    dataExposed,
    insurance: $('insurance').checked
      ? { limit: numberOrNaN('insLimit'), deductible: Number.isNaN(numberOrNaN('insDeductible')) ? 0 : numberOrNaN('insDeductible') }
      : null,
  };
}

/** Marks invalid fields. Returns true when the form can be submitted. */
export function validateForm(inputs) {
  const errors = [];
  for (const id of SELECTS) {
    if (id === 'records' && !recordsApplicable()) continue;
    if (!inputs[id]) errors.push([id, 'form.required']);
  }
  if (inputs.insurance && !(inputs.insurance.limit > 0)) errors.push(['insLimit', 'form.insLimitRequired']);
  for (const [id, key] of errors) setError(id, key);
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

/** Fill the form from a (decoded) scenario. */
export function setForm(v) {
  for (const id of SELECTS) $(id).value = v[id] || '';
  $('dataExposed').checked = !!v.dataExposed;
  $('phi').checked = !!v.phi;
  $('insurance').checked = !!v.insurance;
  $('insLimit').value = v.insurance ? v.insurance.limit : '';
  $('insDeductible').value = v.insurance ? v.insurance.deductible : '';
  syncExposure();
}

export function resetForm() {
  $('scenarioForm').reset();
  for (const id of [...SELECTS, 'insLimit']) clearError(id);
  syncExposure();
}
