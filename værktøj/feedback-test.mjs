// Feedbackdialogen (feedback.js) i browser mod en falsk modtager. Rører aldrig det rigtige ark.
// node værktøj/feedback-test.mjs
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';

const PORT = 8784, ROD = `http://127.0.0.1:${PORT}`;
const server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { stdio: 'ignore' });
await new Promise(r => setTimeout(r, 700));
const browser = await chromium.launch();
const cors = { 'Access-Control-Allow-Origin': '*' };

async function nySide({ svar = 'ok', viewport = { width: 1280, height: 577 }, side = '/geografi.html' } = {}) {
  const ctx = await browser.newContext({ viewport });
  const page = await ctx.newPage();
  page.fejl = []; page.sendt = [];
  page.on('pageerror', e => page.fejl.push(e.message));
  page.svar = svar;
  // Alt til Google afskæres; feedbackmodtageren besvares af testen.
  await page.route(/script\.google(usercontent)?\.com/, async r => {
    if (r.request().method() !== 'POST') return r.fulfill({ status: 200, headers: cors, body: '' });
    page.sendt.push(Object.fromEntries(new URLSearchParams(r.request().postData())));
    if (page.svar === 'net') return r.abort('failed');
    if (page.svar === '500') return r.fulfill({ status: 500, headers: cors, body: 'fejl' });
    if (page.svar === 'gammel') return r.fulfill({ status: 200, headers: cors, contentType: 'text/plain', body: 'ok' });
    if (page.svar === 'travlt') return r.fulfill({ status: 200, headers: cors, contentType: 'application/json', body: '{"ok":false,"fejl":"travlt"}' });
    if (page.svar === 'langsom') await new Promise(x => setTimeout(x, 1500));
    return r.fulfill({ status: 200, headers: cors, contentType: 'application/json', body: '{"ok":true}' });
  });
  await page.route(/cloudflareinsights|fonts\.g/, r => r.abort());
  await page.goto(ROD + side);
  return page;
}
const dlg = page => page.locator('dialog.fb-dialog');
const status = page => page.locator('.fb-status');
async function aabn(page) {
  await page.locator('.fb-knap-side').click();
  await dlg(page).waitFor();
  await page.evaluate(() => { /* tidsfælden springes over i testen */
    const d = document.querySelector('dialog.fb-dialog'); d.dataset.t = '1'; });
}
const vent = page => page.waitForTimeout(3100);   // tidsfælden: 3 s fra åbning
const vaelg = (page, navn, v) => page.locator(`input[name="fb-${navn}"][value="${v}"]`).check();
const synlig = (page, sel) => page.locator(sel).isVisible();

try {
  // 1. Startvisning: ingen rolle valgt, kun rollevalg + direkte vej, materialets titel vises.
  {
    const page = await nySide();
    await aabn(page);
    assert.equal(await page.locator('input[name="fb-rolle"]:checked').count(), 0);
    assert.ok(await synlig(page, 'text=Meld en fejl eller skriv en besked'));
    assert.match(await page.locator('.fb-emne').innerText(), /Om \S/);
    for (const r of ['Underviser', 'Elev', 'Andet']) assert.equal(await synlig(page, `[data-rolle="${r}"]`), false);
    assert.ok(await synlig(page, '#fb-email'));
    assert.match(await page.locator('.fb-note').innerText(), /sendes til Simon og offentliggøres ikke/);
    // Fokus står på første rolle; tastaturet kan vælge med piletaster.
    assert.equal(await page.evaluate(() => document.activeElement.name), 'fb-rolle');
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.locator('input[name="fb-rolle"]:checked').getAttribute('value'), 'Elev');
    assert.ok(await synlig(page, '[data-rolle="Elev"]'));
    // Rolle alene er ikke nok.
    await vent(page);
    await page.locator('.fb-send').click();
    assert.match(await status(page).innerText(), /Besvar mindst ét/);
    assert.equal(page.sendt.length, 0);
    assert.deepEqual(page.fejl.filter(f => !/network error/i.test(f)), []);   // afskårne skrifttyper o.l. tæller ikke
    await page.context().close();
  }

  // 2. Underviser: «Fungerede» vises kun ved brug i undervisning og sendes ikke, når den skjules.
  {
    const page = await nySide();
    await aabn(page);
    await vaelg(page, 'rolle', 'Underviser');
    assert.equal(await synlig(page, '[data-naar-brugt]'), false);
    await vaelg(page, 'anvendelse', 'På tavlen');
    assert.ok(await synlig(page, '[data-naar-brugt]'));
    await vaelg(page, 'fungerede', 'Delvist');
    await vaelg(page, 'anvendelse', 'Kun afprøvet');
    assert.equal(await synlig(page, '[data-naar-brugt]'), false);
    await vaelg(page, 'igen', 'Ved ikke endnu');
    await vent(page);
    await page.locator('.fb-send').click();
    await page.locator('.fb-kvittering h2').waitFor();
    const s = page.sendt[0];
    assert.equal(s.skema, '2'); assert.equal(s.visning, 'evaluering'); assert.equal(s.rolle, 'Underviser');
    assert.equal(s.anvendelse, 'Kun afprøvet'); assert.equal(s.igen, 'Ved ikke endnu');
    assert.equal(s.fungerede, undefined, 'skjult svar sendes ikke');
    assert.equal(s.besked, undefined); assert.equal(s.email, undefined);
    assert.ok(s.titel && s.noegle && s.url.startsWith(ROD));
    assert.equal(await page.evaluate(() => document.activeElement.textContent), 'Tak — din feedback er sendt');
    // Genåbnet: tom formular igen.
    await page.locator('.fb-luk-kvit').click();
    await aabn(page);
    assert.equal(await page.locator('.fb-form input:checked').count(), 0);
    assert.ok(await synlig(page, '.fb-form'));
    await page.context().close();
  }

  // 3. Elev, skift af rolle: underviserens svar og tekst følger ikke med.
  {
    const page = await nySide();
    await aabn(page);
    await vaelg(page, 'rolle', 'Underviser');
    await vaelg(page, 'anvendelse', 'Begge dele');
    await vaelg(page, 'fungerede', 'Godt');
    await page.fill('#fb-tekst-underviser', 'Denne tekst må ikke komme med');
    await vaelg(page, 'rolle', 'Elev');
    await vaelg(page, 'tydeligt', 'Nej');
    await vent(page);
    await page.locator('.fb-send').click();
    await page.locator('.fb-kvittering h2').waitFor();
    const s = page.sendt[0];
    assert.equal(s.rolle, 'Elev'); assert.equal(s.tydeligt, 'Nej');
    for (const k of ['anvendelse', 'fungerede', 'igen', 'besked', 'type']) assert.equal(s[k], undefined, k);
    await page.context().close();
  }

  // 4. Andet: beskeden er påkrævet.
  {
    const page = await nySide();
    await aabn(page);
    await vaelg(page, 'rolle', 'Andet');
    await vent(page);
    await page.locator('.fb-send').click();
    assert.match(await status(page).innerText(), /Skriv din besked/);
    assert.equal(await page.evaluate(() => document.activeElement.id), 'fb-tekst-andet');
    await page.fill('#fb-tekst-andet', 'Jeg kigger med som forælder');
    await page.locator('.fb-send').click();
    await page.locator('.fb-kvittering h2').waitFor();
    assert.equal(page.sendt[0].rolle, 'Andet'); assert.equal(page.sendt[0].besked, 'Jeg kigger med som forælder');
    await page.context().close();
  }

  // 5. Direkte fejlmelding uden rolle; tilbage og frem igen; kategori valgfri.
  {
    const page = await nySide();
    await aabn(page);
    await vaelg(page, 'rolle', 'Elev');
    await vaelg(page, 'forstaaet', 'Lidt');
    await page.getByRole('button', { name: 'Meld en fejl eller skriv en besked' }).click();
    assert.equal(await page.locator('#fb-titel').innerText(), 'Meld en fejl eller skriv en besked');
    assert.equal(await page.locator('input[name="fb-type"]:checked').count(), 0);
    assert.deepEqual(await page.locator('input[name="fb-type"]').evaluateAll(l => l.map(x => x.value)),
      ['Fejl', 'Forslag', 'Spørgsmål', 'Ros']);
    await vent(page);
    await page.locator('.fb-send').click();
    assert.match(await status(page).innerText(), /Skriv din besked/);
    await page.fill('#fb-tekst-besked', 'Grafen forsvinder, når jeg drejer telefonen');
    await page.getByRole('button', { name: 'Tilbage til spørgsmålene' }).click();
    assert.equal(await page.locator('input[name="fb-forstaaet"]:checked').getAttribute('value'), 'Lidt');
    await page.getByRole('button', { name: 'Meld en fejl eller skriv en besked' }).click();
    await page.locator('.fb-send').click();
    await page.locator('.fb-kvittering h2').waitFor();
    const s = page.sendt[0];
    assert.equal(s.visning, 'besked'); assert.equal(s.besked, 'Grafen forsvinder, når jeg drejer telefonen');
    for (const k of ['rolle', 'forstaaet', 'tydeligt', 'type']) assert.equal(s[k], undefined, k);
    await page.context().close();
  }

  // 6. Ugyldig e-mail stopper; gyldig sendes med.
  {
    const page = await nySide();
    await aabn(page);
    await vaelg(page, 'rolle', 'Elev');
    await vaelg(page, 'tydeligt', 'Ja');
    await page.fill('#fb-email', 'simon@');
    await vent(page);
    await page.locator('.fb-send').click();
    assert.match(await status(page).innerText(), /E-mailadressen ser ikke rigtig ud/);
    assert.equal(await page.locator('#fb-email').getAttribute('aria-invalid'), 'true');
    assert.equal(page.sendt.length, 0);
    await page.fill('#fb-email', 'larer@skole.dk');
    await page.locator('.fb-send').click();
    await page.locator('.fb-kvittering h2').waitFor();
    assert.equal(page.sendt[0].email, 'larer@skole.dk');
    await page.context().close();
  }

  // 7. Fejl under afsendelse: ingen kvittering, svarene bevares, kan sendes igen.
  for (const [svar, tekst] of [['net', /kunne ikke sendes/], ['500', /kunne ikke sendes/], ['travlt', /mange svar/],
                               ['gammel', /ikke opdateret/]]) {
    const page = await nySide({ svar });
    await aabn(page);
    await vaelg(page, 'rolle', 'Elev');
    await vaelg(page, 'tydeligt', 'Delvist');
    await vent(page);
    await page.locator('.fb-send').click();
    await page.waitForFunction(() => document.querySelector('.fb-status').classList.contains('fb-fejl'));
    assert.match(await status(page).innerText(), tekst, svar);
    assert.match(await status(page).innerText(), /ikke slettet/);
    assert.equal(await page.locator('.fb-kvittering').isVisible(), false);
    assert.equal(await page.locator('input[name="fb-tydeligt"]:checked').getAttribute('value'), 'Delvist');
    assert.equal(await page.locator('.fb-send').isEnabled(), true);
    page.svar = 'ok';
    await page.locator('.fb-send').click();
    await page.locator('.fb-kvittering h2').waitFor();
    await page.context().close();
  }

  // 8. Gammel modtager tager stadig imod en direkte besked (den gemmer tekst).
  {
    const page = await nySide({ svar: 'gammel' });
    await aabn(page);
    await page.getByRole('button', { name: 'Meld en fejl eller skriv en besked' }).click();
    await vaelg(page, 'type', 'Fejl');
    await page.fill('#fb-tekst-besked', 'Knappen virker ikke på iPad');
    await vent(page);
    await page.locator('.fb-send').click();
    await page.locator('.fb-kvittering h2').waitFor();
    assert.equal(page.sendt[0].type, 'Fejl');
    await page.context().close();
  }

  // 9. Ingen dobbeltindsendelse.
  {
    const page = await nySide({ svar: 'langsom' });
    await aabn(page);
    await vaelg(page, 'rolle', 'Elev');
    await vaelg(page, 'tydeligt', 'Ja');
    await vent(page);
    await page.locator('.fb-send').click();
    await page.evaluate(() => { const f = document.querySelector('.fb-form');
      f.requestSubmit(); f.requestSubmit(); });
    assert.equal(await page.locator('.fb-send').isDisabled(), true);
    await page.locator('.fb-kvittering h2').waitFor();
    assert.equal(page.sendt.length, 1);
    await page.context().close();
  }

  // 10. Kort på en side og simuleringens egen knap: rigtig nøgle og URL.
  {
    const page = await nySide();
    const kort = page.locator('.item .fb-knap:visible, .sim .fb-knap:visible').first();
    await kort.click();
    await dlg(page).waitFor();
    await vaelg(page, 'rolle', 'Elev'); await vaelg(page, 'tydeligt', 'Ja');
    await vent(page);
    await page.locator('.fb-send').click();
    await page.locator('.fb-kvittering h2').waitFor();
    assert.match(page.sendt[0].kilde, /^kort på /);
    assert.ok(page.sendt[0].url.startsWith(ROD + '/'));
    await page.context().close();
  }

  // 11. Mobil: dialogen holder sig inden for skærmen og kan rulles; ingen vandret rulning.
  {
    const page = await nySide({ viewport: { width: 390, height: 750 } });
    await aabn(page);
    await vaelg(page, 'rolle', 'Underviser');
    await vaelg(page, 'anvendelse', 'Begge dele');
    const m = await page.evaluate(() => { const d = document.querySelector('dialog.fb-dialog').getBoundingClientRect();
      const dl = document.querySelector('dialog.fb-dialog');
      return { l: d.left, r: d.right, h: d.height, sw: dl.scrollWidth, cw: dl.clientWidth }; });
    assert.ok(m.l >= 0 && m.r <= 390, JSON.stringify(m));
    assert.ok(m.h <= 750);
    assert.ok(m.sw <= m.cw + 1, 'ingen vandret rulning i dialogen');
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'værktøj/ud/feedback-mobil.png' });
    await page.context().close();
  }

  // Skærmbilleder til øjnene.
  {
    const page = await nySide();
    await aabn(page);
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'værktøj/ud/feedback-start.png' });
    await vaelg(page, 'rolle', 'Underviser'); await vaelg(page, 'anvendelse', 'På tavlen');
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'værktøj/ud/feedback-underviser.png' });
    await page.getByRole('button', { name: 'Meld en fejl eller skriv en besked' }).click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'værktøj/ud/feedback-besked.png' });
    await page.context().close();
  }

  console.log('feedback.js: alle browsertest bestået');
} finally {
  await browser.close();
  server.kill();
}
