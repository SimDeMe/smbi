// Pladstjek: kan eleverne se figuren og bruge kontrollerne på deres skærm?
//
//   node værktøj/pladstjek.mjs geografi/Stigningsregn.html [flere sider …]
//   node værktøj/pladstjek.mjs --alle          alle sider under geografi/ og biologi/
//
// Åbner hver side i de vinduesstørrelser, elever faktisk har — skærmen
// minus faner, adresselinje og proceslinje. Skærmbilleder lægges i
// værktøj/ud/, som ikke er med i git; ligger figur og kontroller ikke
// inden for skærmen ved start, tages også et billede (…_rullet.png), hvor
// siden er rullet ned til figurens top.
//
// Hovedmålingen er det, design_rules.md afsnit 3 kræver: kan DEN CENTRALE
// FIGUR og DE PRIMÆRE KONTROLLER ses samtidig? Værktøjet måler spændet fra
// figurens top til den nederste primære kontrol (eller figurens bund):
//
//   ✓ straks        figur og kontroller er synlige, når siden åbner
//   ~ efter rul     de kan ses samtidig, når man har rullet lidt ned
//   ✗ mangler N px  spændet er højere end skærmen — de kan aldrig ses samtidig
//
// Figuren er det element med data-pladstjek="figur", ellers den største
// synlige canvas/svg i .stage, ellers .stage selv, ellers den største
// canvas/svg på siden (mindst 150×100 px).
// Primære kontroller er elementer med data-pladstjek="kontrol", ellers de
// synlige skydere, valglister, tal-, radio- og afkrydsningsfelter i .rig
// (eller på siden); findes ingen af dem, tæller panelets knapper (ikke
// faneknapper og ikke knapperne i .rig-head). Kontroller i skjulte faner og
// lukkede fold-ud-paneler tæller ikke med — de må gerne ligge dér.
//
// Hele panelet (.rig) måles stadig som DIAGNOSE: det er fint, at sekundært
// stof ligger under kanten, så panelmålingen er ikke bestået/ikke bestået.
// Telefonen (390×750) tjekkes kun for vandret rulning. Kig altid selv på
// skærmbillederne — værktøjet kan udpege forkert figur eller kontrol;
// sæt så data-pladstjek på siden.
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
  { w: 390,  h: 750, navn: 'telefon', telefon: true },
];

let sider = process.argv.slice(2);
if (sider.includes('--alle')) {
  sider = [];
  for (const mappe of ['geografi', 'biologi']) {
    const gaa = d => fs.readdirSync(ROD + d, { withFileTypes: true }).forEach(f => {
      const sti = d + '/' + f.name;
      if (f.isDirectory()) gaa(sti);
      else if (f.name.endsWith('.html')) sider.push(sti);
    });
    gaa(mappe);
  }
  sider.sort();
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

// Kører i siden: find figur og primære kontroller, og mål dem.
function maal() {
  const synlig = el => {
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return false;
    if (el.checkVisibility && !el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) return false;
    return !el.closest('details:not([open]) > :not(summary), [hidden], [aria-hidden="true"][role="tabpanel"]');
  };
  const areal = el => { const r = el.getBoundingClientRect(); return r.width * r.height; };
  const stoerst = liste => liste.filter(synlig).filter(el => {
    const r = el.getBoundingClientRect(); return r.width >= 150 && r.height >= 100;
  }).sort((a, b) => areal(b) - areal(a))[0];

  const rig = document.querySelector('.rig');
  const omraade = rig || document.querySelector('main') || document.body;
  const stage = omraade.querySelector('.stage');
  const tegning = 'canvas, svg';

  let figur = document.querySelector('[data-pladstjek="figur"]'), hvorfra = 'data-pladstjek';
  if (!figur && stage) { figur = stoerst([...stage.querySelectorAll(tegning)]); hvorfra = '.stage ' + (figur?.tagName.toLowerCase() || ''); }
  if (!figur && stage && synlig(stage)) { figur = stage; hvorfra = '.stage'; }
  if (!figur) { figur = stoerst([...omraade.querySelectorAll(tegning)]); hvorfra = figur ? figur.tagName.toLowerCase() : ''; }

  const udenfor = el => el.closest('#site-top, .top-nav, footer, .foot, .rig-head');
  let kontroller = [...document.querySelectorAll('[data-pladstjek="kontrol"]')].filter(synlig);
  let kHvorfra = 'data-pladstjek';
  if (!kontroller.length) {
    kHvorfra = 'felter';
    kontroller = [...omraade.querySelectorAll('input[type=range], select, input[type=number], input[type=radio], input[type=checkbox]')]
      .filter(el => !udenfor(el));
    // Skjulte radio-/afkrydsningsfelter bag pæne labels: mål labelen.
    kontroller = kontroller.map(el => (synlig(el) ? el : (el.labels && el.labels[0]) || el)).filter(synlig);
  }
  if (!kontroller.length) {
    kHvorfra = 'knapper';
    kontroller = [...omraade.querySelectorAll('button, [role=button]')]
      .filter(el => !udenfor(el) && el.getAttribute('role') !== 'tab' && !el.closest('[role=tablist]') && synlig(el));
  }

  const vt = document.querySelector('#site-top, .top');
  const klaeber = vt && ['sticky', 'fixed'].includes(getComputedStyle(vt).position) ? vt.getBoundingClientRect().height : 0;
  const rr = rig && rig.getBoundingClientRect();
  const f = figur && figur.getBoundingClientRect();
  const ks = kontroller.map(k => k.getBoundingClientRect());
  const ind = r => r.top >= -1 && r.bottom <= innerHeight + 1;
  const spaend = f ? [f, ...ks] : ks;
  const navn = el => el.id ? '#' + el.id : (el.getAttribute('aria-label') || el.textContent || el.tagName).trim().replace(/\s+/g, ' ').slice(0, 30);
  const nederst = kontroller[ks.reduce((bi, r, i) => (r.bottom > ks[bi].bottom ? i : bi), 0)];
  return {
    nederst: nederst && navn(nederst),
    panelTop: rr && Math.round(rr.top + scrollY), panelHoejde: rr && Math.round(rr.height),
    figur: f ? { b: Math.round(f.width), h: Math.round(f.height), hvorfra,
                 synligPct: Math.round(100 * Math.max(0, Math.min(f.bottom, innerHeight) - Math.max(f.top, 0)) / f.height) } : null,
    kontroller: { n: ks.length, synlige: ks.filter(ind).length, hvorfra: kHvorfra },
    top: spaend.length ? Math.round(Math.min(...spaend.map(r => r.top)) + scrollY) : null,
    bund: spaend.length ? Math.round(Math.max(...spaend.map(r => r.bottom)) + scrollY) : null,
    scrollY: Math.round(scrollY),
    klaeber: Math.round(klaeber),
    vandret: document.documentElement.scrollWidth - innerWidth,
  };
}

const browser = await chromium.launch();
const problemer = [];
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
    const m = await p.evaluate(maal);
    const fil = `${UD}${side.replace(/[\/]/g, '_')}_${sk.w}x${sk.h}`;
    await p.screenshot({ path: fil + '.png' });
    // Andet billede: rullet, så figurens top står lige under den klæbende header.
    if (!sk.telefon && m.top != null && m.bund > m.scrollY + sk.h + 1) {
      await p.evaluate(y => window.scrollTo(0, y), m.top - m.klaeber - 8);
      await p.waitForTimeout(150);
      await p.screenshot({ path: fil + '_rullet.png' });
    }
    await p.close();

    const js = fejl.length ? '  JS-FEJL: ' + fejl[0] : '';
    const maalStr = `${sk.w}×${sk.h}`.padEnd(9);
    if (sk.telefon) {
      console.log(`  ${maalStr} ${sk.navn.padEnd(22)} ${m.vandret > 1 ? `✗ vandret rulning ${m.vandret} px` : '✓ ingen vandret rulning'}${js}`);
      if (m.vandret > 1) problemer.push(`${side}  telefon: vandret rulning ${m.vandret} px`);
      continue;
    }

    // Hovedmåling: figur + primære kontroller.
    let dom;
    const plads = sk.h - m.klaeber;
    if (!m.figur) dom = '? ingen figur fundet (ikke en simulering, eller sæt data-pladstjek="figur")';
    else if (m.top >= m.scrollY - 1 && m.bund <= m.scrollY + sk.h + 1) dom = '✓ straks';
    else if (m.bund - m.top <= plads) dom = `~ efter rul (${m.bund - m.scrollY - sk.h} px under kanten ved start)`;
    else dom = `✗ mangler ${m.bund - m.top - plads} px`;
    if (dom.startsWith('✗') && sk.w === 1366) problemer.push(`${side}  1366×625: figur + kontroller ${dom.slice(2)}`);

    const fig = m.figur ? `${m.figur.b}×${m.figur.h} (${m.figur.hvorfra}, ${m.figur.synligPct} % synlig)` : '–';
    const kon = `${m.kontroller.synlige}/${m.kontroller.n} ${m.kontroller.hvorfra} synlige${m.nederst ? ', nederst ' + m.nederst : ''}`;
    // Diagnose: hele panelet.
    let panel = 'intet .rig';
    if (m.panelHoejde) {
      panel = `${m.panelHoejde} px`;
      if (m.panelTop + m.panelHoejde <= sk.h) panel += ', ses helt';
      else if (m.panelHoejde <= plads) panel += ', ses helt efter rul';
      else panel += `, ${m.panelHoejde - plads} px for højt`;
    }
    console.log(`  ${maalStr} ${sk.navn.padEnd(22)} ${dom}${js}`);
    console.log(`  ${''.padEnd(9)} ${''.padEnd(22)}   figur ${fig} · kontroller ${kon} · panel ${panel}`);
  }
}
await browser.close();
server?.kill();
console.log(`\nSkærmbilleder i værktøj/ud/.`);
console.log(problemer.length ? `\nReelle pladsproblemer (figur + kontroller ved 1366×625, vandret rulning på telefon):\n  ${problemer.join('\n  ')}` : '\nFigur og primære kontroller kan ses samtidig overalt.');
