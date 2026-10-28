// Consistency checks for data and translations. No dependencies.
//
//   node scripts/validate.mjs            check everything
//   node scripts/validate.mjs --fix      also regenerate the README cost table from data/model.json
//
import { readFileSync, writeFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const read = p => readFileSync(new URL(p, root), 'utf8');
const model = JSON.parse(read('data/model.json'));
const i18n = { en: JSON.parse(read('i18n/en.json')), fr: JSON.parse(read('i18n/fr.json')) };
const errors = [];
const fail = msg => errors.push(msg);
const get = (o, path) => path.split('.').reduce((x, k) => (x == null ? undefined : x[k]), o);

// 1. EN and FR have the same keys (same order for option lists), same {placeholders}, balanced **bold**.
function compare(a, b, path) {
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return fail(`i18n: ${path} array length differs`);
    return a.forEach((x, i) => compare(x, b[i], `${path}[${i}]`));
  }
  if (a && typeof a === 'object') {
    if (!b || typeof b !== 'object') return fail(`i18n: ${path} missing in fr`);
    const ka = Object.keys(a), kb = Object.keys(b);
    for (const k of ka) if (!kb.includes(k)) fail(`i18n: fr is missing ${path}.${k}`);
    for (const k of kb) if (!ka.includes(k)) fail(`i18n: en is missing ${path}.${k}`);
    if (path.startsWith('options') && ka.join() !== kb.join()) fail(`i18n: ${path} option order differs`);
    return ka.filter(k => k in b).forEach(k => compare(a[k], b[k], path ? `${path}.${k}` : k));
  }
  if (typeof a === 'string') {
    if (typeof b !== 'string') return fail(`i18n: ${path} type differs`);
    const vars = s => (s.match(/\{\w+\}/g) || []).sort().join();
    if (vars(a) !== vars(b)) fail(`i18n: ${path} placeholders differ (${vars(a)} vs ${vars(b)})`);
    for (const [lang, s] of [['en', a], ['fr', b]]) {
      if ((s.match(/\*\*/g) || []).length % 2) fail(`i18n: ${lang} ${path} has unbalanced **`);
      if (!s.trim()) fail(`i18n: ${lang} ${path} is empty`);
    }
  }
}
compare(i18n.en, i18n.fr, '');

// 2. Every model value has known sources, and every source has a title in both languages.
const sourceIds = Object.keys(model.sources);
function checkSources(node, path, inherited) {
  if (!node || typeof node !== 'object' || Array.isArray(node)) return;
  const src = node.src || inherited;
  if ('v' in node) {
    if (!src || !src.length) fail(`model: ${path} has no src`);
    for (const id of src || []) if (!sourceIds.includes(id)) fail(`model: ${path} cites unknown source "${id}"`);
    return;
  }
  for (const [k, v] of Object.entries(node)) if (k !== 'sources') checkSources(v, path ? `${path}.${k}` : k, src);
}
checkSources(model, '', null);
for (const id of sourceIds) for (const lang of ['en', 'fr']) if (!get(i18n[lang], `sources.${id}`)) fail(`i18n: ${lang} has no title for source "${id}"`);

// 3. Ids line up between the model and the translations.
const keys = o => Object.keys(o || {}).sort().join();
const incidents = Object.keys(model.incidents.v);
const sameIds = (label, a, b) => { if (keys(a) !== keys(b)) fail(`ids: ${label} (${keys(a)} vs ${keys(b)})`); };
const asSet = list => Object.fromEntries(list.map(k => [k, 1]));
const provinces = Object.keys(model.regimes.v).filter(k => k !== 'FIN');
for (const lang of ['en', 'fr']) {
  const d = i18n[lang];
  sameIds(`${lang} options.incident vs model.incidents`, d.options.incident, model.incidents.v);
  sameIds(`${lang} options.industry vs model.industries`, d.options.industry, model.industries.v);
  sameIds(`${lang} options.records vs model.records`, d.options.records, model.records.v);
  sameIds(`${lang} options.revenue vs model.revenue`, d.options.revenue, model.revenue.v);
  sameIds(`${lang} options.cause vs model.causes`, d.options.cause, model.causes.v);
  sameIds(`${lang} options.province vs model.regimes (minus FIN)`, d.options.province, asSet(provinces));
  sameIds(`${lang} options.provinceShort vs options.province`, d.options.provinceShort, d.options.province);
  sameIds(`${lang} regimes.labels vs model.regimes`, d.regimes.labels, model.regimes.v);
  sameIds(`${lang} regimes.notices vs model.regimes`, d.regimes.notices, model.regimes.v);
  sameIds(`${lang} results.durations vs model.incidents`, d.results.durations, model.incidents.v);
  sameIds(`${lang} cards.rows.extortion vs incidents with extortion`, d.cards.rows.extortion, asSet(incidents.filter(i => model.incidents.v[i].extortion)));
  sameIds(`${lang} form.exposure vs incidents with optional exposure`, d.form.exposure, asSet(incidents.filter(i => model.incidents.v[i].dataExposure === 'optional')));
}
sameIds('model.variableX.weights vs model.incidents', model.variableX.weights.v, model.incidents.v);
for (const [id, inc] of Object.entries(model.incidents.v)) {
  if (!['always', 'optional', 'never'].includes(inc.dataExposure)) fail(`model: incidents.${id}.dataExposure is "${inc.dataExposure}"`);
  if (inc.extortion) sameIds(`model.incidents.${id}.extortion vs revenue brackets`, inc.extortion, model.revenue.v);
}
for (const id of model.regimes.federalFinancialIndustries) if (!(id in model.industries.v)) fail(`model: unknown industry ${id} in federalFinancialIndustries`);

// 4. README cost table is generated from the model.
const START = '<!-- model-table:start -->';
const END = '<!-- model-table:end -->';
function readmeTable() {
  const m = model;
  const $ = n => `$${n.toLocaleString('en-CA')}`;
  const recs = Object.entries(m.records.v).map(([k, b]) => `${k} ${b.individuals.toLocaleString('en-CA')}`).join(' · ');
  return [
    START,
    `_Generated from \`data/model.json\` (model v${m.version}) by \`node scripts/validate.mjs --fix\`. The in-app “Model assumptions & sources” panel lists every parameter._`,
    '',
    '| Vector | Rate / Logic |',
    '| :--- | :--- |',
    `| **Incident Response** | ${$(m.rates.incidentResponse.v)}/hr |`,
    `| **Digital Forensics** | ${$(m.rates.forensics.v)}/hr (${m.effort.forensicHoursPerIrHour.v} forensic hours per IR hour) |`,
    `| **IT Recovery & Hardening** | ${$(m.rates.itRecovery.v)}/hr (${m.effort.itHoursPerIrHour.v} IT hours per IR hour) |`,
    `| **Breach Counsel** | ${$(m.rates.breachCounsel.v)}/hr |`,
    `| **Notification** | ${$(m.notification.baseRatePerIndividual.v)} per individual; with double extortion ${Object.values(m.records.v).map(b => $(b.doubleExtortionNotifyRate)).join(' / ')} by bucket, plus a ${m.notification.doubleExtortionSurcharge.v * 100}% surcharge |`,
    `| **Credit & ID Monitoring** | ${$(m.notification.creditMonitoring.v.standard)} per individual (${$(m.notification.creditMonitoring.v.phi)} with PHI) |`,
    `| **Class-Action Reserve** | ${$(m.settlement.v.basePerIndividual)} per individual (+${$(m.settlement.v.phiPremium)} PHI, +${$(m.settlement.v.financePremium)} finance) × probability |`,
    `| **Individuals per bucket** | ${recs} |`,
    END,
  ].join('\n');
}
const readme = read('README.md');
const a = readme.indexOf(START), b = readme.indexOf(END);
if (a < 0 || b < 0) fail('README: model-table markers not found');
else {
  const current = readme.slice(a, b + END.length);
  const expected = readmeTable();
  if (current !== expected) {
    if (process.argv.includes('--fix')) {
      writeFileSync(new URL('README.md', root), readme.slice(0, a) + expected + readme.slice(b + END.length));
      console.log('README cost table regenerated.');
    } else fail('README: cost table is out of date with data/model.json (run: node scripts/validate.mjs --fix)');
  }
}

if (errors.length) {
  console.error(`✗ ${errors.length} problem(s):\n  - ${errors.join('\n  - ')}`);
  process.exit(1);
}
console.log(`✓ model v${model.version}, ${sourceIds.length} sources, EN/FR translations consistent, README in sync.`);
