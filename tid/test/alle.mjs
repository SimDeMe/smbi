// Kører alle testene i tid/test mod en lokal server og samler resultatet.
//
//   node tid/test/alle.mjs            alle
//   node tid/test/alle.mjs ferie      kun de filer, hvis navn indeholder "ferie"
//
// Starter selv `python3 -m http.server 8777` i repoets rod, hvis der ikke
// allerede kører en server på porten.

import { spawn, spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import fs from 'fs';
import net from 'net';

const HER  = fileURLToPath(new URL('.', import.meta.url));
const ROD  = fileURLToPath(new URL('../../', import.meta.url));
const PORT = 8777;

const optaget = () => new Promise(r => {
  const s = net.connect(PORT, '127.0.0.1', () => { s.end(); r(true); });
  s.on('error', () => r(false));
});

let server = null;
if (!(await optaget())) {
  server = spawn('python3', ['-m', 'http.server', String(PORT)], { cwd: ROD, stdio: 'ignore' });
  for (let i = 0; i < 50 && !(await optaget()); i++) await new Promise(r => setTimeout(r, 100));
}

const filter = process.argv[2] || '';
const filer = fs.readdirSync(HER)
  .filter(f => f.endsWith('.mjs') && f !== 'alle.mjs' && f.includes(filter)).sort();

let fejlede = 0;
for (const f of filer) {
  const r = spawnSync('node', [HER + f], { encoding: 'utf8', timeout: 300000 });
  const ud = (r.stdout || '') + (r.stderr || '');
  const ok = (ud.match(/^OK /gm) || []).length;
  const fejl = (ud.match(/^FEJL /gm) || []).length;
  const godt = r.status === 0;
  if (!godt) fejlede++;
  console.log(`${godt ? 'OK  ' : 'FEJL'}  ${f.padEnd(30)} ${ok} tjek${fejl ? `, ${fejl} fejl` : ''}`);
  if (!godt) console.log(ud.split('\n').filter(l => /^FEJL|Error|pageerror/.test(l)).map(l => '      ' + l).join('\n'));
}

server?.kill();
console.log(fejlede ? `\n${fejlede} af ${filer.length} filer fejlede` : `\nAlle ${filer.length} filer OK`);
process.exitCode = fejlede ? 1 : 0;
