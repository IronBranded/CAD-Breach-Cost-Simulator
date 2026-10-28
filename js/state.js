// @ts-check
// URL state: ?lang=fr for the language, #… for a shareable scenario.
// The fragment never reaches the server, and nothing is stored in the browser.

const FIELDS = ['incident', 'industry', 'sector', 'cause', 'province', 'records'];
const CONTROL_PARAM = 'ctl';

// Revenue brackets used by links made with model v2026.10 and earlier.
const LEGACY_REVENUE = { Micro: 1_000_000, Small: 5_000_000, Mid: 50_000_000, Large: 500_000_000 };

export function readLangParam() {
  return new URLSearchParams(location.search).get('lang');
}

/** @param {import('./types.js').Inputs} inputs @param {string} version */
export function encodeScenario(inputs, version) {
  const p = new URLSearchParams();
  p.set('v', version);
  for (const f of FIELDS) if (inputs[f]) p.set(f, inputs[f]);
  p.set('revenue', String(inputs.revenue));
  if (inputs.employees) p.set('employees', String(inputs.employees));
  if (inputs.phi) p.set('phi', '1');
  if (inputs.dataExposed) p.set('exposed', '1');
  if (inputs.ransomPaid === false) p.set('ransom', 'unpaid');
  if (inputs.fraudReportedFast) p.set('reported', '1');
  const ctl = Object.entries(inputs.controls || {}).filter(([, on]) => on).map(([id]) => id);
  if (ctl.length) p.set(CONTROL_PARAM, ctl.join(','));
  const ins = inputs.insurance;
  if (ins) {
    p.set('limit', String(ins.limit));
    p.set('deductible', String(ins.deductible ?? 0));
    if (ins.premium) p.set('premium', String(ins.premium));
    if (ins.ransomwareSublimit) p.set('sublimit', String(ins.ransomwareSublimit));
    if (ins.coinsurance) p.set('coins', String(ins.coinsurance));
    if (ins.waitingHours !== null && ins.waitingHours !== undefined) p.set('wait', String(ins.waitingHours));
  }
  return p.toString();
}

const positive = v => (v !== null && v !== '' && Number(v) > 0 ? Number(v) : null);
const nonNegative = v => (v !== null && v !== '' && Number(v) >= 0 ? Number(v) : null);

/**
 * Parse a scenario fragment. Returns { values, version } or null when the fragment
 * is empty or names anything the model or option lists don't know.
 * Links from earlier model versions are migrated (revenue brackets, no sector).
 * @param {string} hash
 * @param {Record<string, string[]>} valid  allowed ids per field
 * @param {any} model
 */
export function decodeScenario(hash, valid, model) {
  const raw = hash.replace(/^#/, '');
  if (!raw) return null;
  const p = new URLSearchParams(raw);
  if (!p.has('incident')) return null;
  /** @type {any} */
  const out = {};
  for (const f of FIELDS) {
    const v = p.get(f);
    if (v === null) {
      if (f === 'records') { out.records = null; continue; }
      if (f === 'sector') continue; // filled in below for legacy links
      return null;
    }
    if (!valid[f].includes(v)) return null;
    out[f] = v;
  }
  if (!out.sector) out.sector = model.industries.v[out.industry].defaultSector || 'private';

  const rev = p.get('revenue');
  out.revenue = rev && rev in LEGACY_REVENUE ? LEGACY_REVENUE[rev] : positive(rev);
  if (!out.revenue) return null;
  out.employees = positive(p.get('employees'));
  out.phi = p.get('phi') === '1';
  out.dataExposed = p.get('exposed') === '1';
  out.ransomPaid = p.get('ransom') !== 'unpaid';
  out.fraudReportedFast = p.get('reported') === '1';
  out.controls = {};
  for (const id of (p.get(CONTROL_PARAM) || '').split(',').filter(Boolean)) {
    if (!(id in model.controls.v)) return null;
    out.controls[id] = true;
  }
  out.insurance = null;
  if (p.has('limit')) {
    const limit = positive(p.get('limit'));
    if (!limit) return null;
    const coins = nonNegative(p.get('coins'));
    out.insurance = {
      limit,
      deductible: nonNegative(p.get('deductible')) ?? 0,
      premium: positive(p.get('premium')),
      ransomwareSublimit: positive(p.get('sublimit')),
      coinsurance: coins !== null && coins <= 1 ? coins : null,
      waitingHours: nonNegative(p.get('wait')),
    };
  }
  return { values: out, version: p.get('v') || '2026.10' };
}

/** Rewrite the address bar without adding history entries. */
export function writeUrl({ lang, inputs, version }) {
  const url = new URL(location.href);
  if (lang) url.searchParams.set('lang', lang);
  url.hash = inputs ? encodeScenario(inputs, version) : '';
  const next = url.pathname + url.search + (url.hash && url.hash !== '#' ? url.hash : '');
  history.replaceState(null, '', next);
}
