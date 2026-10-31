// Lydfeedback i browser med syntetisk lyd og falsk modtager. Rører ingen rigtig tjeneste.
// Headless Chromium hænger her ved getUserMedia, også med falsk enhed, så testen giver
// MediaRecorder en tone fra Web Audio. Tilladelsesdialogen skal prøves i en rigtig browser.
// node værktøj/lydfeedback-test.mjs
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';

const PORT = 8783, SIDE = `http://127.0.0.1:${PORT}/geografi/luftmasser/`, KODE = 'test-kode-til-afproevning';
const server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { stdio: 'ignore' });
await new Promise(r => setTimeout(r, 600));
const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const MODTAGER = 'https://script.google.test/macros/s/falsk/exec';
const KONFIG = `export const LYD_CONFIG = { modtager: '${MODTAGER}', opbevaringDage: 90 };`;
const TOM_KONFIG = `export const LYD_CONFIG = { modtager: '', opbevaringDage: 90 };`;

async function nySide({ konfig = true, viewport = { width: 1280, height: 577 }, init } = {}) {
  const ctx = await browser.newContext({ viewport });
  const page = await ctx.newPage();
  page.fejl = [];
  page.on('pageerror', e => page.fejl.push(e.message));
  // Altid falsk: testen må aldrig kunne nå den rigtige modtager i lyd-config.js.
  await page.route('**/feedback/lyd-config.js*', r => r.fulfill({ contentType: 'text/javascript', body: konfig ? KONFIG : TOM_KONFIG }));
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = async () => {
      const lyd = new AudioContext(), tone = lyd.createOscillator(), ud = lyd.createMediaStreamDestination();
      tone.connect(ud); tone.start();
      return ud.stream;
    };
  });
  if (init) await page.addInitScript(init);
  // Følg mikrofonsporene, så frigivelsen kan kontrolleres.
  await page.addInitScript(() => {
    window.__spor = [];
    const original = navigator.mediaDevices?.getUserMedia?.bind(navigator.mediaDevices);
    if (original) navigator.mediaDevices.getUserMedia = async c => { const s = await original(c); window.__spor.push(...s.getTracks()); return s; };
  });
  return page;
}
const knap = page => page.locator('[data-lf="aabn"]');
const lf = (page, navn) => page.locator(`[data-lf="${navn}"]`);
async function optag(page, ms = 1300) {
  await knap(page).click();
  await lf(page, 'start').click();
  await lf(page, 'stop').waitFor();
  await page.locator('[data-profil="stabil"]').click();
  await page.locator('#afspil').click();
  await page.locator('#afspil').click();
  await page.waitForTimeout(ms);
  await lf(page, 'stop').click();
  await lf(page, 'send').waitFor();
}

try {
  // Almindelig brug: ingen kode eller ingen modtager giver ingen knap og ingen mikrofon.
  for (const [url, konfig] of [[SIDE, true], [`${SIDE}?afproevning=${KODE}`, false]]) {
    const page = await nySide({ konfig });
    await page.goto(url);
    await page.locator('#a-afspil').waitFor();
    await page.waitForTimeout(200);
    assert.equal(await knap(page).count(), 0, `knap uden grund: ${url}`);
    assert.equal(await page.evaluate(() => window.__spor.length), 0);
    assert.deepEqual(page.fejl, []);
    await page.context().close();
  }

  // Hele forløbet: information, optagelse, log, aflytning, fejl, genforsøg, kvittering.
  {
    const page = await nySide();
    const modtaget = [];
    let svar = 'netfejl';
    await page.route(MODTAGER, async r => {
      // Apps Script kan ikke svare på en preflight: ingen OPTIONS, og kroppen er ren tekst.
      assert.equal(r.request().method(), 'POST');
      assert.match(r.request().headers()['content-type'], /^text\/plain/);
      modtaget.push(r.request().postData());
      const cors = { 'Access-Control-Allow-Origin': '*' };
      if (svar === 'netfejl') return r.abort();
      if (svar === '500') return r.fulfill({ status: 500, headers: cors, contentType: 'application/json', body: '{"ok":false,"fejl":"server"}' });
      if (svar === 'udloebet') return r.fulfill({ status: 403, headers: cors, contentType: 'application/json', body: '{"ok":false,"fejl":"kode"}' });
      return r.fulfill({ status: 200, headers: cors, contentType: 'application/json', body: '{"ok":true,"kvittering":"3F2B8C1E"}' });
    });
    await page.goto(`${SIDE}?afproevning=${KODE}`);
    assert.equal(await knap(page).isVisible(), true);

    // Informationen står der, før mikrofonen spørges.
    await knap(page).click();
    const info = await page.locator('.lf-dialog').textContent();
    for (const m of [/Modtager:/, /forbedre simulationerne/, /senest efter 90 dage/, /frivilligt/, /Ikke det, du skriver/]) assert.match(info, m);
    assert.equal(await page.evaluate(() => window.__spor.length), 0);
    await lf(page, 'annuller').click();
    assert.equal(await page.evaluate(() => window.__spor.length), 0);

    await knap(page).click();
    await lf(page, 'start').click();
    await lf(page, 'stop').waitFor();
    // Under optagelsen kan simulationen bruges, og figur og knapper er ikke dækket.
    assert.equal(await page.locator('.lf-dialog').evaluate(d => d.open), false);
    assert.match(await page.locator('.lf-bjaelke').textContent(), /Optager/);
    await page.locator('[data-profil="betinget"]').click();
    await page.locator('[data-luft="fugtig"]').click();
    await page.locator('#hoejde').fill('800');
    await page.locator('#hoejde').dispatchEvent('change');
    await page.locator('[data-profil="afkoeling"]').click();
    await page.locator('#vaelg-opgaver').click();
    await page.locator('#opgavevalg').selectOption('0');
    await page.locator('#energi-svar').fill('HEMMELIGT ELEVSVAR');
    await page.locator('#energi-svar').blur();
    await page.waitForTimeout(1200);
    await lf(page, 'stop').click();
    await lf(page, 'send').waitFor();

    // Mikrofonen er frigivet, og lyden kan aflyttes.
    assert.ok(await page.evaluate(() => window.__spor.length > 0 && window.__spor.every(s => s.readyState === 'ended')));
    assert.equal(await page.locator('.lf-bjaelke').count(), 0);
    await page.waitForFunction(() => document.querySelector('.lf-dialog audio')?.readyState >= 1);
    // Intet er sendt, før der trykkes send, og Escape smider ikke optagelsen væk.
    assert.equal(modtaget.length, 0);
    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(100);
    assert.equal(await page.locator('.lf-dialog').evaluate(d => d.open), true);

    // Netfejl: ingen kvittering, men genforsøg og download.
    await lf(page, 'send').click();
    await page.locator('.lf-fejl').waitFor();
    assert.match(await page.locator('.lf-dialog').textContent(), /ikke modtaget/);
    assert.doesNotMatch(await page.locator('.lf-dialog').textContent(), /Tak|Kvittering/);
    assert.match(await lf(page, 'hent').getAttribute('download'), /^lydfeedback-.+\.webm$/);
    // Serverfejl: heller ingen kvittering.
    svar = '500';
    await lf(page, 'send').click();
    await page.waitForFunction(() => document.querySelector('[data-lf="send"]') && !document.querySelector('[data-lf="send"]').disabled);
    assert.doesNotMatch(await page.locator('.lf-dialog').textContent(), /Kvittering/);
    // Udløbet link får sin egen besked.
    svar = 'udloebet';
    await lf(page, 'send').click();
    await page.getByText('gælder ikke længere').waitFor();

    // Modtaget: kvittering først nu, med den samme session ved alle forsøg.
    svar = 'ok';
    await lf(page, 'send').click();
    await page.getByText('Kvittering').waitFor();
    assert.match(await page.locator('.lf-dialog').textContent(), /3F2B8C1E/);
    const forsoeg = modtaget.map(k => JSON.parse(k)), sidste = forsoeg.at(-1);
    assert.equal(new Set(forsoeg.map(k => k.session)).size, 1, 'genforsøg skal genbruge sessionen');
    assert.equal(sidste.kode, KODE);
    assert.equal(sidste.simulation, 'geografi/luftmasser');
    assert.match(sidste.version, /^luftpakke\d+$/);
    assert.ok(Number.isInteger(sidste.varighed_ms) && sidste.varighed_ms > 1000);
    assert.match(sidste.lydformat, /^audio\//);
    assert.deepEqual(sidste.starttilstand, { profil: 'afkoeling', luft: 'fugtig', hoejde_m: 0 });
    const log = sidste.log, logTekst = JSON.stringify(log);
    assert.ok(log.every((h, i) => h.t >= 0 && (i === 0 || h.t >= log[i - 1].t)), 'loggen følger tidsaksen');
    assert.match(logTekst, /klik betinget/);
    assert.match(logTekst, /klik fugtig/);
    assert.match(logTekst, /skyder hoejde = 800/);
    assert.match(logTekst, /svarfelt udfyldt energi-svar/);
    assert.ok(log.some(h => h.tilstand.profil === 'betinget' && h.tilstand.luft === 'fugtig'), 'tilstanden efter handlingen');
    assert.ok(!modtaget.at(-1).includes('HEMMELIGT'), 'elevens tekst må ikke sendes');
    // Lyden overlever base64 og er stadig en webm-fil, som scriptet vil godkende.
    assert.equal(Buffer.from(sidste.lyd, 'base64').subarray(0, 4).toString('hex'), '1a45dfa3');
    assert.ok(sidste.lyd.length > 1000);

    await lf(page, 'luk').click();
    assert.equal(await page.locator('.lf-dialog').evaluate(d => d.open), false);
    assert.deepEqual(page.fejl, []);
    await page.context().close();
  }

  // Slet og optag igen: optagelsen er væk, og næste får en ny session.
  {
    const page = await nySide();
    await page.goto(`${SIDE}?afproevning=${KODE}`);
    await optag(page);
    // Forsøg på at forlade siden med en uafleveret optagelse advarer.
    let advaret = false;
    page.on('dialog', d => { advaret = d.type() === 'beforeunload'; d.dismiss(); });
    await page.evaluate(() => { location.href = '/'; }).catch(() => {});
    await page.close({ runBeforeUnload: true }).catch(() => {});
    await page.waitForTimeout(300);
    assert.equal(advaret, true, 'uafleveret optagelse skal advare ved navigation');

    const anden = await nySide();
    await anden.goto(`${SIDE}?afproevning=${KODE}`);
    await optag(anden);
    await lf(anden, 'igen').click();
    await lf(anden, 'start').waitFor();
    await lf(anden, 'annuller').click();
    await optag(anden);
    await lf(anden, 'slet').click();
    assert.equal(await anden.locator('.lf-dialog').evaluate(d => d.open), false);
    await anden.evaluate(() => { window.__forladt = dispatchEvent(new Event('beforeunload', { cancelable: true })); });
    assert.equal(await anden.evaluate(() => window.__forladt), true, 'slettet optagelse må ikke advare');
    assert.deepEqual(anden.fejl, []);
    await anden.context().close();
  }

  // Mikrofonfejl og gamle browsere giver en forståelig besked, ikke en død knap.
  for (const [navn, tekst] of [['NotAllowedError', /fik ikke lov/], ['NotFoundError', /ikke fundet nogen mikrofon/], ['NotReadableError', /andet program/]]) {
    const page = await nySide({ init: `navigator.mediaDevices.getUserMedia = () => Promise.reject(new DOMException('x', '${navn}'));` });
    await page.goto(`${SIDE}?afproevning=${KODE}`);
    await knap(page).click();
    await lf(page, 'start').click();
    await page.locator('.lf-fejl').waitFor();
    assert.match(await page.locator('.lf-fejl').textContent(), tekst);
    assert.equal(await lf(page, 'start').isEnabled(), true);
    await page.locator('#fokus').evaluate(() => {});
    await page.context().close();
  }
  {
    const page = await nySide({ init: 'delete window.MediaRecorder;' });
    await page.goto(`${SIDE}?afproevning=${KODE}`);
    await knap(page).click();
    await lf(page, 'start').click();
    assert.match(await page.locator('.lf-fejl').textContent(), /kan ikke optage lyd/);
    await page.context().close();
  }

  // Skærmstørrelser: figur og kontroller er i syne, og optagelinjen dækker ikke simulationens knapper.
  for (const viewport of [{ width: 1280, height: 577 }, { width: 1366, height: 625 }, { width: 1536, height: 730 }, { width: 390, height: 750 }]) {
    const page = await nySide({ viewport });
    await page.goto(`${SIDE}?afproevning=${KODE}`);
    const navn = `${viewport.width}x${viewport.height}`;
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${navn}: vandret rulning`);
    assert.ok(await knap(page).isVisible(), `${navn}: knap`);
    assert.ok(await knap(page).evaluate(el => el.getBoundingClientRect().bottom <= innerHeight), `${navn}: knappen skal ses uden at rulle`);
    await knap(page).click();
    const boks = await page.locator('.lf-dialog').boundingBox();
    assert.ok(boks.x >= 0 && boks.x + boks.width <= viewport.width && boks.y >= 0 && boks.y + boks.height <= viewport.height, `${navn}: dialog uden for skærmen`);
    await page.screenshot({ path: `værktøj/ud/lydfeedback-info-${navn}.png` });
    await lf(page, 'start').click();
    await lf(page, 'stop').waitFor();
    await page.waitForTimeout(600);
    assert.equal(await lf(page, 'stop').evaluate(el => { const r = el.getBoundingClientRect(); return r.bottom <= innerHeight && r.right <= innerWidth && r.left >= 0; }), true, `${navn}: stopknap`);
    const overlap = await page.evaluate(() => {
      const b = document.querySelector('.lf-bjaelke').getBoundingClientRect();
      return ['#a-afspil', '#a-nulstil', '#a-hvorfor'].filter(s => { const r = document.querySelector(s)?.getBoundingClientRect(); return r?.width && r.left < b.right && r.right > b.left && r.top < b.bottom && r.bottom > b.top; });
    });
    assert.deepEqual(overlap, [], `${navn}: optagelinjen dækker knapper`);
    await page.screenshot({ path: `værktøj/ud/lydfeedback-optager-${navn}.png` });
    await lf(page, 'stop').click();
    await lf(page, 'send').waitFor();
    await page.screenshot({ path: `værktøj/ud/lydfeedback-aflyt-${navn}.png` });
    assert.deepEqual(page.fejl, []);
    await page.context().close();
  }

  console.log('lydfeedback-test.mjs: alt bestået');
} finally {
  await browser.close();
  server.kill();
}
