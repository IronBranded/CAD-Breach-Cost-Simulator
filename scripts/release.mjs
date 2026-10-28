// Stamps a release version on every local asset URL and module import, so a new
// deploy never mixes cached old files with new ones (GitHub Pages caches files
// for about 10 minutes and has no build step to fingerprint them).
//
//   node scripts/release.mjs 2026.11.1     set the version and stamp everything
//   node scripts/release.mjs               re-stamp with the current package.json version
//
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const read = p => readFileSync(new URL(p, root), 'utf8');
const write = (p, s) => writeFileSync(new URL(p, root), s);

const pkg = JSON.parse(read('package.json'));
const version = process.argv[2] || pkg.version;
if (!/^[0-9A-Za-z.-]+$/.test(version)) throw new Error(`invalid version "${version}"`);
if (pkg.version !== version) {
  pkg.version = version;
  write('package.json', JSON.stringify(pkg, null, 2) + '\n');
}

const walk = dir => readdirSync(new URL(dir, root)).flatMap(f => {
  const p = `${dir}/${f}`;
  return statSync(new URL(p, root)).isDirectory() ? walk(p) : [p];
});

let changed = 0;
const update = (file, next) => {
  if (next !== read(file)) { write(file, next); changed++; }
};

for (const file of ['index.html', 'methodology.html']) {
  update(file, read(file).replace(
    /((?:href|src)=")((?!https?:|#|data:|mailto:|index\.html|methodology\.html)[^"?]+)(\?v=[^"]*)?"/g,
    (m, attr, path) => `${attr}${path}?v=${version}"`));
}
for (const file of walk('js').filter(f => f.endsWith('.js'))) {
  update(file, read(file).replace(/from '(\.{1,2}\/[^'?]+)(\?v=[^']*)?'/g, (m, path) => `from '${path}?v=${version}'`));
}
console.log(`version ${version}: ${changed} file(s) updated`);
