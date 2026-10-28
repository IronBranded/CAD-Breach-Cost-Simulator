// URL state: ?lang=fr for the language, #… for a shareable scenario.
// The hash never reaches the server, and nothing is stored in the browser.

const FIELDS = ['incident', 'industry', 'records', 'revenue', 'cause', 'province'];

export function readLangParam() {
  return new URLSearchParams(location.search).get('lang');
}

export function encodeScenario(inputs) {
  const p = new URLSearchParams();
  for (const f of FIELDS) if (inputs[f]) p.set(f, inputs[f]);
  if (inputs.phi) p.set('phi', '1');
  if (inputs.dataExposed) p.set('exposed', '1');
  if (inputs.insurance) {
    p.set('limit', String(inputs.insurance.limit));
    p.set('deductible', String(inputs.insurance.deductible));
  }
  return p.toString();
}

/**
 * Parse a scenario hash. Returns form values, or null when the hash is empty or
 * names anything the model / option lists don't know (so stale links fail quietly).
 */
export function decodeScenario(hash, valid) {
  const raw = hash.replace(/^#/, '');
  if (!raw) return null;
  const p = new URLSearchParams(raw);
  const out = {};
  for (const f of FIELDS) {
    const v = p.get(f);
    if (v === null) { if (f === 'records') { out.records = null; continue; } return null; }
    if (!valid[f].includes(v)) return null;
    out[f] = v;
  }
  out.phi = p.get('phi') === '1';
  out.dataExposed = p.get('exposed') === '1';
  out.insurance = null;
  if (p.has('limit')) {
    const limit = Number(p.get('limit'));
    const deductible = Number(p.get('deductible') || 0);
    if (!(limit > 0) || !(deductible >= 0)) return null;
    out.insurance = { limit, deductible };
  }
  return out;
}

/** Rewrite the address bar without adding history entries. */
export function writeUrl({ lang, inputs }) {
  const url = new URL(location.href);
  if (lang) url.searchParams.set('lang', lang);
  url.hash = inputs ? encodeScenario(inputs) : '';
  const next = url.pathname + url.search + (url.hash && url.hash !== '#' ? url.hash : '');
  history.replaceState(null, '', next);
}
