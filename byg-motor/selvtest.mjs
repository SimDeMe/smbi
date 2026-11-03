// Selvtest af en «Byg figuren»-side.
//
//   node byg-motor/selvtest.mjs biologi/byg-cellen.html
//   node byg-motor/selvtest.mjs geografi/byg-figuren.html
//
// Sidens data ligger i mappen med samme navn som siden: <side>/figurer.js.
//
// Kræver Playwright (samme link som tid/test: ln -s "$(npm root -g)" værktøj/node_modules,
// eller kør fra en mappe, hvor playwright kan findes). Starter selv en server på 8777,
// hvis porten er ledig.
//
// Tjekker data (hvert fagord på netop én plads, pladser inden for figuren og uden
// overlap, ingen prikker oven i hinanden, alle ord har en forklaring) og bygger så
// alle figurerne gennem brugerfladen: klik, træk med musen, forkert ord tilbage i
// bakken, ord i overskud, hint og Vis svaret, Svær udgave og tastaturet.

import { createRequire } from 'module';
import { spawn } from 'child_process';
import net from 'net';
import path from 'path';
import { fileURLToPath } from 'url';

const rod = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sti = process.argv[2] || 'biologi/byg-cellen.html';
const data = await import(path.join(rod, sti.replace(/\.html$/, ''), 'figurer.js'));
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); }
catch (e) { ({ chromium } = require(path.join(rod, 'værktøj/node_modules/playwright'))); }

const PORT = 8777;
const ledig = await new Promise((ok) => {
  const s = net.createServer().once('error', () => ok(false)).once('listening', () => s.close(() => ok(true))).listen(PORT);
});
let server = null;
if (ledig) {
  server = spawn('python3', ['-m', 'http.server', String(PORT)], { cwd: rod, stdio: 'ignore' });
  await new Promise((r) => setTimeout(r, 700));
}

let ok = 0, fejl = 0;
const tjek = (betingelse, tekst) => {
  if (betingelse) ok++;
  else { fejl++; console.log('  ✗ ' + tekst); }
};

// ── Data ──────────────────────────────────────────────────
const { ORD, FIGURER: figurer } = data;
const { BOKS, foersteSaetning } = await import('./motor.js');
tjek(foersteSaetning('Laget er ca. 100 km tykt. Mere her.') === 'Laget er ca. 100 km tykt.', 'første sætning stopper ved en forkortelse');
for (const f of figurer) {
  const [W, H] = f.vb;
  const [BOKS_B, BOKS_H] = f.boks || BOKS;
  const lagOrd = f.lag.flatMap((l) => l.ord);
  for (const o of lagOrd) tjek(f.pladser.filter((p) => p.ord === o).length === 1, `${f.id}: ${o} skal have netop én plads`);
  for (const p of f.pladser) tjek(lagOrd.includes(p.ord), `${f.id}: pladsen ${p.ord} hører ikke til et lag`);
  for (const o of lagOrd.concat(f.lag.flatMap((l) => l.ekstra || []))) tjek(!!ORD[o], `${f.id}: ${o} mangler i ordlisten`);
  for (const l of f.lag) for (const e of l.ekstra || []) {
    tjek(!lagOrd.includes(e), `${f.id}: ekstra-ordet ${e} har også en plads`);
    tjek(!!(l.ekstraFejl && l.ekstraFejl[e]), `${f.id}: ekstra-ordet ${e} mangler en forklaring`);
  }
  f.pladser.forEach((p, i) => {
    tjek(p.x - BOKS_B / 2 >= 0 && p.x + BOKS_B / 2 <= W && p.y - BOKS_H / 2 >= 0 && p.y + BOKS_H / 2 <= H, `${f.id}: ${p.ord} uden for figuren`);
    for (const [o, t] of Object.entries(p.fejl || {})) {
      tjek(!!ORD[o], `${f.id}: fejltekst til ukendt ord ${o}`);
      tjek(t.length <= 160, `${f.id}: fejlteksten ${p.ord}/${o} er for lang (${t.length})`);
      tjek(!t.toLowerCase().includes(ORD[p.ord].ord.toLowerCase()), `${f.id}: fejlteksten ${p.ord}/${o} afslører svaret`);
    }
    f.pladser.forEach((q, k) => {
      if (k <= i) return;
      tjek(Math.abs(p.x - q.x) >= BOKS_B + 4 || Math.abs(p.y - q.y) >= BOKS_H + 4, `${f.id}: ${p.ord} og ${q.ord} overlapper`);
      if (p.maal && q.maal) tjek(Math.hypot(p.maal[0] - q.maal[0], p.maal[1] - q.maal[1]) >= 24, `${f.id}: prikkerne ${p.ord} og ${q.ord} ligger for tæt`);
    });
  });
}
for (const [id, o] of Object.entries(ORD)) tjek(o.tekst.length <= 200, `forklaringen til ${id} er for lang`);
console.log(`Data: ${ok} OK, ${fejl} fejl`);

// ── Brugerfladen ──────────────────────────────────────────
const browser = await chromium.launch();
const side = await browser.newPage({ viewport: { width: 1366, height: 625 } });
const sidefejl = [];
side.on('pageerror', (e) => sidefejl.push(e.message));
side.on('console', (m) => { if (m.type() === 'error') sidefejl.push(m.text()); });
await side.goto(`http://localhost:${PORT}/${sti}`);
await side.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
await side.reload();
await side.waitForFunction(() => window.bygFiguren);

const plads = (i) => side.locator(`#figur .plads[data-i="${i}"]`);
const ordKnap = (o) => side.locator(`#bakke .ord[data-ord="${o}"]`);
const klikSaet = async (o, i) => { await ordKnap(o).click(); await plads(i).locator(".boks").click(); };
const farvet = (o) => side.locator(`#figur .del.farvet[data-ord="${o}"]`).count();

for (const f of figurer) {
  await side.locator(`#fane-${f.id}`).click();
  for (let l = 0; l < f.lag.length; l++) {
    const lag = f.lag[l];
    const idx = (o) => f.pladser.findIndex((p) => p.ord === o);
    tjek(await side.locator('#bakke .ord').count() === lag.ord.length + (lag.ekstra || []).length, `${f.id} lag ${l + 1}: forkert antal ord i bakken`);

    // forkert ord først: tilbage i bakken med forklaring
    if (lag.ord.length > 1) {
      const [a, b] = lag.ord;
      await klikSaet(b, idx(a));
      await side.click('#btn-indsend');
      tjek(await ordKnap(b).count() === 1, `${f.id}: forkert ord kom ikke tilbage i bakken`);
      tjek((await side.locator('#besked').textContent()).length > 10, `${f.id}: ingen forklaring ved forkert ord`);
    }
    // ord i overskud
    for (const e of lag.ekstra || []) {
      await klikSaet(e, idx(lag.ord[0]));
      await side.click('#btn-indsend');
      tjek((await side.locator('#besked').textContent()) === lag.ekstraFejl[e], `${f.id}: forkert besked ved ${e}`);
    }
    // første ord med musen (træk), resten med klik — det sidste via hint og Vis svaret
    const [forste, ...resten] = lag.ord;
    const sidste = resten.pop();
    await side.evaluate(() => window.scrollTo(0, document.querySelector('#byg').offsetTop - 68));
    const kilde = await ordKnap(forste).boundingBox();
    const maal = await plads(idx(forste)).locator('.boks').boundingBox();
    await side.mouse.move(kilde.x + kilde.width / 2, kilde.y + kilde.height / 2);
    await side.mouse.down();
    await side.mouse.move(kilde.x + 40, kilde.y + 20, { steps: 4 });
    await side.mouse.move(maal.x + maal.width / 2, maal.y + maal.height / 2, { steps: 8 });
    await side.mouse.up();
    tjek(await plads(idx(forste)).locator('.ordtekst').textContent() === ORD[forste].ord, `${f.id}: træk med musen satte ikke ${forste}`);
    for (const o of resten) await klikSaet(o, idx(o));
    await side.click('#btn-indsend');
    tjek(await farvet(forste) > 0, `${f.id}: ${forste} fik ikke farve`);
    if (sidste) {
      tjek(await side.locator('#faerdig-kort').isHidden(), `${f.id}: laget blev færdigt for tidligt`);
      await side.click('#btn-hint');
      tjek((await side.locator('#btn-hint').textContent()) === 'Vis svaret', `${f.id}: hintknappen skiftede ikke`);
      await side.click('#btn-hint');
    }
    tjek(await side.locator('#faerdig-kort').isVisible(), `${f.id} lag ${l + 1}: det grønne kort kom ikke`);
    for (const o of lag.ord) tjek(await side.locator(`#figur .plads.laast[data-i="${idx(o)}"]`).count() === 1, `${f.id}: ${o} er ikke låst`);
    const naeste = side.locator('#btn-naeste');
    if (l < f.lag.length - 1) await naeste.click();
    else tjek(f === figurer[figurer.length - 1] || (await naeste.textContent()).startsWith('Næste figur'), `${f.id}: ingen knap til næste figur`);
  }
  tjek(await side.locator(`#fane-${f.id} .maerke`).count() === 1, `${f.id}: fanen fik ikke et mærke`);
}

// Svær udgave: alle ord på én gang, løses med tastaturet
const f0 = figurer[0];
await side.locator(`#fane-${f0.id}`).click();
await side.check('#svaer');
tjek(await side.locator('#bakke .ord').count() === f0.lag.reduce((n, l) => n + l.ord.length + (l.ekstra || []).length, 0), 'Svær: ikke alle ord i bakken');
for (const o of f0.lag.flatMap((l) => l.ord)) {
  await ordKnap(o).focus();
  await side.keyboard.press('Enter');
  await plads(f0.pladser.findIndex((p) => p.ord === o)).focus();
  await side.keyboard.press('Enter');
}
await side.locator('#figur').click({ position: { x: 5, y: 5 } });
await side.keyboard.press('Enter');
tjek(await side.locator('#faerdig-kort').isVisible(), `Svær: ${f0.id} blev ikke færdig med tastaturet`);
tjek(await side.locator('#figur .del.graa').count() === 0, 'Svær: der er stadig grå dele');

// Delete sender et ord tilbage, Esc fjerner valget (sidste figur, stadig i Svær udgave)
const fs = figurer[figurer.length - 1];
await side.locator(`#fane-${fs.id}`).click();
if (fs === f0) await side.click('#btn-forfra');   // kun én figur: den er lige bygget
const [o1, o2] = fs.lag.flatMap((l) => l.ord);
const i2 = fs.pladser.findIndex((p) => p.ord === o2);
await ordKnap(o1).click();
await plads(i2).locator('.boks').click();
await plads(i2).focus();
await side.keyboard.press('Delete');
tjek(await ordKnap(o1).count() === 1, 'Delete sendte ikke ordet tilbage');
await ordKnap(o1).click();
await side.keyboard.press('Escape');
tjek(await side.locator('#bakke .ord.valgt').count() === 0, 'Esc fjernede ikke valget');

// Link til en fane
await side.goto(`http://localhost:${PORT}/${sti}#${fs.id}`);
await side.waitForFunction(() => window.bygFiguren);
tjek(await side.locator(`#fane-${fs.id}[aria-selected="true"]`).count() === 1, `#${fs.id} åbner ikke fanen`);

tjek(sidefejl.length === 0, 'fejl i konsollen: ' + sidefejl.join(' | '));
await browser.close();
if (server) server.kill();
console.log(fejl ? `\n${fejl} FEJL, ${ok} OK` : `\nALT OK (${ok})`);
process.exit(fejl ? 1 : 0);
