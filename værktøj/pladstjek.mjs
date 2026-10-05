// Pladstjek: kan eleverne se hele simuleringen på deres skærm?
//
//   node værktøj/pladstjek.mjs geografi/Stigningsregn.html [flere sider …]
//   node værktøj/pladstjek.mjs --alle          alle sider med et .rig-panel
//
// Åbner hver side i de vinduesstørrelser, elever faktisk har — skærmen
// minus faner, adresselinje og proceslinje — og måler simuleringens panel
// (.rig). Skærmbilleder lægges i værktøj/ud/, som ikke er med i git.
//
//   straks        hele panelet kan ses, når siden åbner
//   efter rul     panelet kan ses, når man har rullet ned til det
//   mangler N px  panelet er højere end skærmen
//
// Målet (design_rules.md, afsnit 5): «straks» ved 1366×625 og 1536×730,
// mindst «efter rul» ved 1280×577. Telefonen tjekkes kun for vandret rulning.
//
// Kræver Playwright — samme link som tid/test (se tid/test/README.md):
//   ln -s "$(npm root -g)" værktøj/node_modules
// Starter selv `python3 -m http.server 8777`, hvis porten er ledig.

import { chromium } from 'playwright';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import fs from 'fs';
import net from 'net';

const ROD  = fileURLToPath(new URL('../', import.meta.url));
const UD   = fileURLToPath(new URL('./ud/', import.meta.url));
const PORT = +(process.env.PORT || 8777);

const SKAERME = [
  { w: 1280, h: 577, navn: '1080p-skærm ved 150 %' },
  { w: 1366, h: 625, navn: '1366×768-laptop' },
  { w: 1536, h: 730, navn: '1080p-skærm ved 125 %' },
  { w: 1440, h: 780, navn: 'MacBook Air 13"' },
  { w: 1920, h: 940, navn: 'stor skærm' },
  { w: 390,  h: 750, navn: 'telefon', telefon: true },
];

let sider = process.argv.slice(2);
if (sider.includes('--alle')) {
  sider = [];
  for (const mappe of ['geografi', 'biologi']) {
    const gaa = d => fs.readdirSync(ROD + d, { withFileTypes: true }).forEach(f => {
      const sti = d + '/' + f.name;
      if (f.isDirectory()) gaa(sti);
      else if (f.name.endsWith('.html') && fs.readFileSync(ROD + sti, 'utf8').includes('class="rig"')) sider.push(sti);
    });
    gaa(mappe);
  }
}
if (!sider.length) { console.log('Angiv en eller flere sider, fx geografi/Stigningsregn.html, eller --alle'); process.exit(1); }

const optaget = () => new Promise(r => {
  const s = net.connect(PORT, '127.0.0.1', () => { s.end(); r(true); });
  s.on('error', () => r(false));
});
let server = null;
if (!(await optaget())) {
  server = spawn('python3', ['-m', 'http.server', String(PORT)], { cwd: ROD, stdio: 'ignore' });
  for (let i = 0; i < 50 && !(await optaget()); i++) await new Promise(r => setTimeout(r, 100));
}
fs.mkdirSync(UD, { recursive: true });

const browser = await chromium.launch();
let daarlige = 0;
for (const side of sider) {
  console.log('\n' + side);
  for (const sk of SKAERME) {
    const p = await browser.newPage({ viewport: { width: sk.w, height: sk.h },
      ...(sk.telefon ? { isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : {}) });
    const fejl = [];
    p.on('pageerror', e => fejl.push(e.message));
    await p.goto(`http://localhost:${PORT}/${side}`, { waitUntil: 'load' });
    await p.evaluate(() => document.fonts && document.fonts.ready);
    await p.waitForTimeout(600);
    const m = await p.evaluate(() => {
      const rig = document.querySelector('.rig');
      const top = document.querySelector('.top');
      const fig = rig && rig.querySelector('.stage canvas, .stage svg, canvas, svg');
      const r = rig ? rig.getBoundingClientRect() : null;
      const f = fig ? fig.getBoundingClientRect() : null;
      const klaeber = top && getComputedStyle(top).position === 'sticky' ? top.getBoundingClientRect().height : 0;
      return {
        top: r && Math.round(r.top + scrollY), hoejde: r && Math.round(r.height),
        figur: f ? `${Math.round(f.width)}×${Math.round(f.height)}` : '–',
        klaeber: Math.round(klaeber),
        vandret: document.documentElement.scrollWidth - innerWidth,
      };
    });
    await p.screenshot({ path: `${UD}${side.replace(/[\/]/g, '_')}_${sk.w}x${sk.h}.png` });
    await p.close();

    let dom;
    if (!m.hoejde) dom = 'intet .rig-panel';
    else if (sk.telefon) dom = m.vandret > 1 ? `✗ vandret rulning ${m.vandret} px` : '✓ ingen vandret rulning';
    else if (m.top + m.hoejde <= sk.h) dom = '✓ straks';
    else if (m.hoejde <= sk.h - m.klaeber) dom = `~ efter rul (${m.top + m.hoejde - sk.h} px under kanten ved start)`;
    else dom = `✗ mangler ${m.hoejde - (sk.h - m.klaeber)} px`;
    if (dom.startsWith('✗')) daarlige++;
    console.log(`  ${(sk.w + '×' + sk.h).padEnd(9)} ${sk.navn.padEnd(22)} panel ${String(m.hoejde).padStart(4)} px  figur ${m.figur.padEnd(9)}  ${dom}${fejl.length ? '  JS-FEJL: ' + fejl[0] : ''}`);
  }
}
await browser.close();
server?.kill();
console.log(`\nSkærmbilleder i værktøj/ud/. ${daarlige ? daarlige + ' målinger passer ikke.' : 'Alt passer.'}`);
