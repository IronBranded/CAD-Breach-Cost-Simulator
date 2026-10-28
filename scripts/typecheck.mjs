// Type-checks js/ with TypeScript (JSDoc + // @ts-check), no build step.
// Import specifiers carry ?v= cache-busting suffixes that TypeScript cannot resolve,
// so this checks a copy with the suffixes removed.
//
//   node scripts/typecheck.mjs        (downloads TypeScript via npx on first run)
//
import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const out = new URL('.typecheck/', root);
rmSync(out, { recursive: true, force: true });
const walk = dir => readdirSync(new URL(dir, root)).flatMap(f => {
  const p = `${dir}/${f}`;
  return statSync(new URL(p, root)).isDirectory() ? walk(p) : [p];
});
for (const file of walk('js').filter(f => f.endsWith('.js'))) {
  const target = new URL(file, out);
  mkdirSync(new URL('.', target), { recursive: true });
  writeFileSync(target, readFileSync(new URL(file, root), 'utf8').replace(/(from '\.{1,2}\/[^'?]+)\?v=[^']*'/g, "$1'"));
}
writeFileSync(new URL('tsconfig.json', out), JSON.stringify({
  compilerOptions: {
    allowJs: true, checkJs: true, noEmit: true, strict: false, skipLibCheck: true,
    target: 'ES2022', module: 'ES2022', moduleResolution: 'bundler', lib: ['ES2022', 'DOM', 'DOM.Iterable'],
  },
  include: ['js/**/*.js'],
}, null, 2));
const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const r = spawnSync(npx, ['-y', '-p', 'typescript@5', 'tsc', '-p', fileURLToPath(new URL('tsconfig.json', out))], { stdio: 'inherit', shell: process.platform === 'win32' });
rmSync(out, { recursive: true, force: true });
if (r.status === 0) console.log('✓ no type errors');
process.exit(r.status ?? 1);
