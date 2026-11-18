// Generate public/data/results.json from the paper's main table (sec/4_benchmark.tex),
// so the site and the paper always show the same numbers.
// Usage: node scripts/extract-results.mjs [path/to/4_benchmark.tex]
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const texPath = resolve(process.argv[2] ?? resolve(here, '../../RadioVISTA-paper/sec/4_benchmark.tex'));
const outPath = resolve(here, '../public/data/results.json');

const tex = readFileSync(texPath, 'utf8');
const body = tex.match(/\\label\{tab:main\}[\s\S]*?\\midrule([\s\S]*?)\\bottomrule/)[1];

const COLS = ['G1', 'G2', 'G3', 'G4', 'G', 'P1', 'P2', 'P3', 'P4', 'P', 'F1', 'F2', 'F3', 'F4', 'F', 'All', 'Pass@4', 'Corr'];

// \bestA{tabG}{78.2} -> 78.2, \bestK{89.7} -> 89.7, \textbf{x} -> x
const clean = (s) => {
  let prev;
  do {
    prev = s;
    s = s.replace(/\\[a-zA-Z]+\{tab[GPF]\}\{([^{}]*)\}/g, '$1').replace(/\\[a-zA-Z]+\{([^{}]*)\}/g, '$1');
  } while (s !== prev);
  return s.replace(/\\quad/g, '').trim();
};

let group = 'baseline';
const rows = [];
let base = null;
for (const raw of body.split('\\\\')) {
  const line = raw.replace(/\\midrule/g, '').trim();
  if (!line) continue;
  const g = line.match(/\\textit\{(Proprietary models|Open models|Ours)\}/);
  if (g) {
    group = { 'Proprietary models': 'proprietary', 'Open models': 'open', Ours: 'ours' }[g[1]];
    continue;
  }
  const cells = line.split('&').map(clean);
  if (cells.length !== COLS.length + 1) continue;
  let name = cells[0];
  const scores = Object.fromEntries(COLS.map((c, i) => [c, Number(cells[i + 1])]));
  const isMean = /mean$/i.test(name);
  if (group === 'ours') {
    if (name.startsWith('+')) name = `${base}${name.replace(/^\+\s*/, '-').replace(/\s*\+\s*/g, '-')}`;
    else { base = name; continue; } // base model already listed under open models
  }
  rows.push({ name, group: isMean ? `${group}-mean` : group, scores });
}

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify({ source: 'sec/4_benchmark.tex (tab:main)', columns: COLS, rows }, null, 2));
console.log(`Wrote ${rows.length} rows to ${outPath}`);
