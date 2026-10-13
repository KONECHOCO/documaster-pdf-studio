// Controlla che ogni lingua abbia esattamente le chiavi dell'italiano (e gli stessi segnaposto {x})
import { readdirSync } from 'node:fs';

const dir = new URL('../src/i18n/locales/', import.meta.url);
const flatten = (obj, prefix = '') =>
  Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === 'object' && !Array.isArray(v) ? flatten(v, `${prefix}${k}.`) : [[`${prefix}${k}`, v]]
  );
const placeholders = (v) => (typeof v === 'string' ? (v.match(/\{\w+\}/g) || []).sort().join(',') : Array.isArray(v) ? `array:${v.length}` : '');

const base = new Map(flatten((await import(new URL('it.js', dir))).default));
let problems = 0;
for (const file of readdirSync(dir).filter((f) => f.endsWith('.js') && f !== 'it.js')) {
  const map = new Map(flatten((await import(new URL(file, dir))).default));
  for (const [k, v] of base) {
    if (!map.has(k)) (problems++, console.log(`${file}: manca ${k}`));
    else if (placeholders(map.get(k)) !== placeholders(v)) (problems++, console.log(`${file}: segnaposto diversi in ${k}`));
  }
  for (const k of map.keys()) if (!base.has(k)) (problems++, console.log(`${file}: chiave in più ${k}`));
}
console.log(problems ? `${problems} problemi` : 'traduzioni complete');
process.exit(problems ? 1 : 0);
