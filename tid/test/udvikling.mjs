import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import fs from 'fs';
const HER = fileURLToPath(new URL('.', import.meta.url));   // tid/test/
const DIR = HER + 'ud';                                       // skærmbilleder
fs.mkdirSync(DIR, { recursive: true });
const BASE = 'http://localhost:8777/tid/';
const fejl = [];
const ok = (b, msg) => { console.log((b ? 'OK   ' : 'FEJL ') + msg); if (!b) fejl.push(msg); };

async function side(browser, cfg, w = 390) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 844 }, serviceWorkers: 'block', locale: 'da-DK' });
  const page = await ctx.newPage();
  page.on('pageerror', e => fejl.push('pageerror: ' + e.message));
  for (const [frag, fil] of [['firebase-app.js', 'fake-app.js'], ['firebase-auth.js', 'fake-auth.js'], ['firebase-firestore.js', 'fake-fs.js']])
    await page.route('**/' + frag, r => r.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(HER + fil, 'utf8') }));
  await page.route('**/feedback.js', r => r.fulfill({ contentType: 'text/javascript', body: '' }));
  await page.route('https://fonts.**', r => r.abort());
  await page.addInitScript(c => { window.__fsCfg = c; }, cfg);
  // Fredag 2. oktober 2026 kl. 10, som i ferie.mjs
  await page.clock.setFixedTime(new Date(2026, 9, 2, 10, 0));
  await page.goto(BASE);
  return page;
}
const act = (id, name, extra = {}) => [`users/u1/activities/${id}`, { name, type: 'opgave', color: '#0E86C8', schoolYear: '2026/27', order: 1, isArchived: false, parentId: null, ...extra }];
const settings = ['users/u1/settings/config', { currentSchoolYear: '2026/27' }];
const post = (id, a, s, min) => [`users/u1/entries/${id}`, { activityId: a, workType: null, startTime: { __ts: s }, endTime: { __ts: s + min * 60000 }, durationMinutes: min, note: '', isModule: false, autoStopped: false }];
const tilRapport = async page => { await page.click('.nav-btn[data-view="rapporter"]'); await page.waitForTimeout(500); };
const kurve = (page, n) => page.$$eval('.udv-kort[data-udv]', (k, n) => JSON.parse(k[n].dataset.udv).data, n);

const browser = await chromium.launch();

// Tre timer hver hverdag fra 10. august, på en løbende opgave og en, der
// blev afsluttet 14. september
{
  const seed = [settings,
    act('a1', 'Hold-arbejde', { budgetHours: 800 }),
    act('a2', 'Studietur', { budgetHours: 40, optjening: 'afslutning', isArchived: true, archivedAt: { __ts: new Date(2026, 8, 14, 12).getTime() } })];
  let n = 0;
  for (let d = new Date(2026, 7, 10); d < new Date(2026, 9, 2); d.setDate(d.getDate() + 1)) {
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    const s = new Date(d); s.setHours(8);
    seed.push(post('e' + n++, d < new Date(2026, 8, 14) && d.getDay() === 5 ? 'a2' : 'a1', s.getTime(), 180));
  }
  const page = await side(browser, { seed });
  await tilRapport(page);

  const kort = await page.$$('.udv-kort');
  ok(kort.length === 4, 'fire grafer under skoleåret: ' + kort.length);
  const titler = await page.$$eval('.udv-titel', e => e.map(x => x.textContent));
  ok(titler.join() === 'Arbejdet mod normen,Belastning og arbejde,Arbejdet mod belastning,Leveret mod optjent', 'titlerne: ' + titler.join());

  // Ugerne: tre timer hver hverdag er 15 t om ugen; hele normperioden er med
  const uger = await page.$eval('.udv-uger', k => JSON.parse(k.dataset.uger).data);
  const uge = t => uger.find(w => w[0] === t);
  ok(uge(new Date(2026, 8, 7).getTime())?.[2] === 15 * 60, 'arbejdet i ugen fra 7. sep.: ' + uge(new Date(2026, 8, 7).getTime())?.[2] / 60 + ' t');
  ok(uger[0][0] === new Date(2026, 5, 1).getTime() && uger.at(-1)[1] === new Date(2027, 5, 1).getTime(), 'ugerne dækker normperioden');
  ok(uge(new Date(2026, 10, 2).getTime())?.[2] === null && uge(new Date(2026, 10, 2).getTime())?.[3] > 0, 'uger frem i tiden: intet arbejdet, men belastning');
  ok(uge(new Date(2026, 6, 13).getTime())?.[3] === 0 && uge(new Date(2026, 6, 13).getTime())?.[4] === 0, 'sommerferien: hverken belastning eller norm');
  // Summen af ugernes belastning er normen
  const sumBel = uger.reduce((s, w) => s + w[3], 0) / 60;
  ok(Math.abs(sumBel - 1690) <= 2, 'ugernes belastning giver normen: ' + Math.round(sumBel));

  // Sidste punkt i forskelskurven er chippens tal
  const chip = (await page.textContent('.bel-mod .forecast-chip')).trim();
  ok((await page.textContent('.bel-mod')).trim().startsWith('Mod belastningen'), 'chippen har tekst foran: Mod belastningen');
  const chipT = Number(chip.match(/(\d+)t/)[1]) * (chip.includes('overskud') ? -1 : 1);
  const skema = await kurve(page, 0);
  ok(Math.round(skema.at(-1)[1] / 60) === chipT, `forskelskurven ender i chippens tal: ${Math.round(skema.at(-1)[1] / 60)} / ${chip}`);
  ok(skema[0][0] === new Date(2026, 5, 1).getTime() && skema[0][1] === 0, 'kurven begynder i 0 ved normperiodens start');
  ok(skema.length >= 18 && skema.length <= 20, 'et punkt om ugen: ' + skema.length);
  // Hele juni og juli uden registreringer: bagud — men ikke i sommerferien
  const v = t => skema.find(p => p[0] === t)?.[1];
  const ferieStart = new Date(2026, 6, 6).getTime(), ferieSlut = new Date(2026, 6, 27).getTime();
  ok(v(ferieStart) === v(ferieSlut), 'kurven står stille i sommerferien: ' + v(ferieStart) / 60 + ' / ' + v(ferieSlut) / 60);

  // Akkordkurven ender i saldoen
  const saldo = (await page.textContent('.akkord-saldo-tal')).trim();
  const akkord = await kurve(page, 1);
  const m = saldo.match(/([+−])(?:(\d+)t)?\s*(?:(\d+)m)?/);
  const saldoM = (m[1] === '−' ? -1 : 1) * ((+m[2] || 0) * 60 + (+m[3] || 0));
  ok(Math.abs(akkord.at(-1)[1] - saldoM) <= 1, `akkordkurven ender i saldoen: ${akkord.at(-1)[1]}m / ${saldo}`);
  // Fortegnet forklares med samme ord i sammendraget og i grafen
  const sub = await page.textContent('.akkord-saldo-sub');
  ok(sub.includes(akkord.at(-1)[1] >= 0 ? 'optjent mere end brugt' : 'brugt mere end optjent'), 'saldoens fortegn forklaret: ' + sub);
  ok((await page.$$eval('.udv-nu', e => e[3].textContent)).includes(akkord.at(-1)[1] >= 0 ? 'optjent mere end brugt' : 'brugt mere end optjent'), 'samme ord i grafens overskrift');
  const under = await page.$$eval('.udv-under', e => e[3].textContent);
  ok(under.includes('Over nul') && under.includes('Under nul: du har brugt mere tid, end du har optjent'), 'undertitlen forklarer begge fortegn');

  // Studieturen (ved afslutning) har optjent sine 15 brugte timer undervejs og
  // optjener resten af de 40 t, da den afsluttes 14. september
  const a = t => akkord.find(p => p[0] === t)?.[1];
  const foer = a(new Date(2026, 8, 14).getTime()), efter = a(new Date(2026, 8, 21).getTime());
  const spring = (efter - foer) / 60;
  ok(spring > 20 && spring < 32, `springet ved afslutningen (≈ de 25 t, der er tilbage): ${Math.round(spring)} t`);

  // Arbejdet mod normen: 37 t × ansættelsesgraden om ugen, lagt sammen
  const norm = await page.$eval('.udv-norm-kort', k => JSON.parse(k.dataset.norm).data);
  const fortid = norm.filter(p => p[1] != null), nuP = fortid.at(-1);
  const total = (await page.textContent('.rapport-total')).trim();
  const tm = total.match(/(?:(\d+)t)?\s*(?:(\d+)m)?/);
  ok(Math.abs(nuP[1] - ((+tm[1] || 0) * 60 + (+tm[2] || 0))) <= 1, `normkurvens arbejde ender i den samlede tid: ${nuP[1]}m / ${total}`);
  ok(norm[0][0] === new Date(2026, 5, 1).getTime() && norm[0][1] === 0 && norm[0][2] === 0, 'normkurven begynder i 0');
  ok(norm.at(-1)[0] === new Date(2027, 5, 1).getTime() && Math.abs(norm.at(-1)[2] - 1690 * 60) <= 1 && norm.at(-1)[1] === null, 'normen fortsætter til årets slut og ender i 1690 t');
  const nv = t => norm.find(p => p[0] === t)?.[2];
  ok(nv(ferieStart) === nv(ferieSlut), 'normen står stille i sommerferien');
  const ugeNorm = (nv(new Date(2026, 8, 14).getTime()) - nv(new Date(2026, 8, 7).getTime())) / 60;
  ok(ugeNorm > 36 && ugeNorm < 38.5, 'en hel uge uden ferie er ≈ 37 t: ' + ugeNorm.toFixed(2));
  const underN = await page.textContent('.udv-norm-kort .udv-under');
  ok(/ (36|37|38),\d t om ugen/.test(underN), 'undertitlen siger normen om ugen: ' + underN.match(/[\d,]+ t om ugen/)?.[0]);
  // Sammendragets linje og grafens hoved siger det samme
  const modN = (await page.textContent('.norm-mod')).replace(/\s+/g, ' ').trim();
  const diffT = Math.round((nuP[1] - nuP[2]) / 60);
  ok(modN.includes(`Normen indtil nu ${Math.round(nuP[2] / 60)} t`) && modN.includes(`${Math.abs(diffT)}t ${diffT >= 0 ? 'over' : 'under'} normen`), 'sammendraget: ' + modN);
  const hovedN = (await page.textContent('.udv-norm-kort .udv-nu')).trim();
  ok(hovedN === `${diffT > 0 ? '+' : diffT < 0 ? '−' : '± '}${Math.abs(diffT)} t ${diffT >= 0 ? 'over' : 'under'} normen`, 'grafens hoved: ' + hovedN);
  // Hover: arbejdet og normen før i dag, kun normen efter
  const svgN = await page.$('.udv-norm-kort svg');
  await svgN.scrollIntoViewIfNeeded();
  const bn = await svgN.boundingBox();
  await page.mouse.move(bn.x + bn.width * 0.3, bn.y + bn.height / 2);
  const tipN = (await page.textContent('.udv-norm-kort .udv-tip')).trim();
  ok(/arbejdet \d+ t · normen \d+ t · [+−±]/.test(tipN), 'hover før i dag: ' + tipN);
  await page.mouse.move(bn.x + bn.width * 0.8, bn.y + bn.height / 2);
  const tipN2 = (await page.textContent('.udv-norm-kort .udv-tip')).trim();
  ok(/normen \d+ t$/.test(tipN2) && !tipN2.includes('arbejdet'), 'hover efter i dag: ' + tipN2);
  await page.mouse.move(0, 0);
  await page.locator('.rapport-summary').screenshot({ path: DIR + '/normen-sammendrag.png' });
  await page.addStyleTag({ content: '.nav-btn{visibility:hidden}nav{display:none!important}' });
  await page.locator('.udv-norm-kort').screenshot({ path: DIR + '/normen-graf.png' });

  // Hover viser datoen og tallet
  const svg = await page.$('.udv-kort[data-udv] svg');
  await svg.scrollIntoViewIfNeeded();
  const bx = await svg.boundingBox();
  await page.mouse.move(bx.x + bx.width * 0.3, bx.y + bx.height / 2);
  const tip = (await page.textContent('.udv-kort[data-udv] .udv-tip')).trim();
  const tipInde = await page.evaluate(() => { const t = document.querySelector('.udv-kort[data-udv] .udv-tip').getBoundingClientRect(), k = document.querySelector('.udv-kort[data-udv]').getBoundingClientRect(); return t.left >= k.left && t.right <= k.right; });
  ok(/\d+\. \w+.*t (merarbejde|overskud)/.test(tip) && tipInde, 'hover viser dato og tal: ' + tip);

  // Hover på ugegrafen viser ugen
  const svgU = await page.$('.udv-uger svg');
  await svgU.scrollIntoViewIfNeeded();
  const bu = await svgU.boundingBox();
  await page.mouse.move(bu.x + bu.width * 0.5, bu.y + bu.height / 2);
  const tipU = (await page.textContent('.udv-uger .udv-tip-hoved')).trim();
  ok(/^Uge \d+ · .*belastning \d+ t · norm \d+ t$/.test(tipU), 'hover på ugegrafen viser ugens tal: ' + tipU);
  const tipOpg = await page.$$eval('.udv-uger .udv-tip-opg', e => e.map(x => x.textContent.trim()));
  ok(tipOpg.length >= 1 && tipOpg[0].startsWith('Hold-arbejde'), 'hover viser ugens opgaver: ' + tipOpg.join(' / '));
  const tipInde2 = await page.evaluate(() => { const t = document.querySelector('.udv-uger .udv-tip').getBoundingClientRect(), k = document.querySelector('.udv-uger').getBoundingClientRect(); return t.left >= k.left - 1 && t.right <= k.right + 1; });
  ok(tipInde2, 'ugegrafens tip står inden for kortet');

  // Klik på en uge: panelet med opgaverne, og deres timer giver ugens belastning
  const ugeX = async t => {
    const w = uger.findIndex(u => u[0] === t);
    const b = await (await page.$('.udv-uger svg')).boundingBox();
    const vb = { l: 62, r: 18, B: 600 };
    const xv = vb.l + (w + 0.5) / uger.length * (vb.B - vb.l - vb.r);   // ugerne er (næsten) lige brede
    return b.x + xv / vb.B * b.width;
  };
  const sepUge = new Date(2026, 8, 7).getTime();
  await page.mouse.click(await ugeX(sepUge), bu.y + bu.height / 2);
  await page.waitForTimeout(100);
  const det = await page.$eval('.udv-uger .udv-detalje', el => ({ skjult: el.hidden, hoved: el.querySelector('.udv-det-head')?.textContent, opg: [...el.querySelectorAll('.udv-opg li')].map(li => [li.querySelector('.udv-opg-navn').textContent, li.querySelector('b').textContent]) }));
  ok(!det.skjult && /Uge 37/.test(det.hoved), 'klik på uge 37 viser panelet: ' + det.hoved?.replace(/\s+/g, ' '));
  const tal = t => Number(t.replace(' t', '').replace(',', '.'));
  const sumOpg = det.opg.reduce((s, [, t]) => s + tal(t), 0);
  const belSep = uge(sepUge)[3] / 60;
  ok(Math.abs(sumOpg - belSep) < 0.3, `opgavernes timer giver ugens belastning: ${sumOpg.toFixed(1)} / ${belSep.toFixed(1)}`);
  ok(det.opg.some(([n]) => n === 'Studietur') && det.opg.some(([n]) => n === 'Hold-arbejde'), 'begge opgaver i ugen før studieturen blev afsluttet: ' + det.opg.map(o => o.join(' ')).join(' / '));
  // Studieturen belaster med den tid, der blev brugt den uge (fredag: 3 t)
  ok(det.opg.find(([n]) => n === 'Studietur')?.[1] === '3 t', 'studieturen belaster med den brugte tid: ' + det.opg.find(([n]) => n === 'Studietur')?.[1]);
  ok(await page.$('.udv-uger .udv-uge-valgt') !== null, 'den valgte uge er markeret i grafen');
  // Pil til højre: næste uge
  await page.focus('.udv-uger svg');
  await page.keyboard.press('ArrowRight');
  ok(/Uge 38/.test(await page.textContent('.udv-uger .udv-det-head')), 'pil til højre vælger næste uge');
  await page.click('.udv-uger .udv-luk');
  ok(await page.$eval('.udv-uger .udv-detalje', el => el.hidden), 'panelet lukkes med ×');

  // Zoom: træk hen over grafen fra august til oktober
  const antalUger = () => page.$$eval('.udv-uger .udv-bel', p => (p[0].getAttribute('d').match(/M|L/g).length) / 2);
  ok(await antalUger() === uger.length, 'hele året vises fra start: ' + await antalUger());
  ok(await page.$eval('.udv-uger .udv-zk[data-zoom="alt"]', b => b.disabled), '«Hele året» er slået fra, når hele året vises');
  const x1 = await ugeX(new Date(2026, 7, 10).getTime()), x2 = await ugeX(new Date(2026, 9, 5).getTime());
  await page.mouse.move(x1, bu.y + bu.height / 2);
  await page.mouse.down();
  await page.mouse.move((x1 + x2) / 2, bu.y + bu.height / 2, { steps: 4 });
  await page.mouse.move(x2, bu.y + bu.height / 2, { steps: 4 });
  await page.mouse.up();
  await page.waitForTimeout(100);
  ok(await antalUger() === 9, 'trukket udsnit: 9 uger: ' + await antalUger());
  ok(await page.$eval('.udv-uger .udv-detalje', el => el.hidden), 'et træk vælger ikke en uge');
  const akse = await page.$$eval('.udv-uger .udv-akse-x', t => t.map(x => x.textContent));
  ok(akse[0] === 'uge' && akse.includes('33') && akse.includes('41'), 'kort udsnit: ugenumre på x-aksen: ' + akse.join(' '));
  ok((await page.textContent('.udv-uger .udv-udsnit')).includes('9 uger'), 'udsnittet står over grafen: ' + await page.textContent('.udv-uger .udv-udsnit'));
  await page.click('.udv-uger .udv-zk[data-zoom="hoejre"]');
  ok((await page.textContent('.udv-uger .udv-udsnit')).startsWith('14. sep'), '› flytter udsnittet et halvt udsnit frem: ' + await page.textContent('.udv-uger .udv-udsnit'));
  await page.click('.udv-uger .udv-zk[data-zoom="ind"]');
  ok(await antalUger() === 5, '+ halverer udsnittet: ' + await antalUger());
  await page.click('.udv-uger .udv-zk[data-zoom="alt"]');
  ok(await antalUger() === uger.length, '«Hele året» viser hele året igen');
  ok((await page.$$eval('.udv-uger tbody tr', r => r.length)) === uger.length, 'tabellen har stadig alle uger');

  // Zoom på kurverne: træk, knapper, taster og Ctrl+hjul
  const punkter = (sel, sti = '.udv-linje') => page.$eval(sel + ' ' + sti, p => p.getAttribute('d').match(/[ML]/g).length);
  const fSel = '.udv-kort[data-graf-id="udv-forskel"]';
  ok(await punkter(fSel) === skema.length, 'forskelskurven viser alle punkter fra start: ' + await punkter(fSel));
  ok(await page.$eval(fSel + ' .udv-zk[data-zoom="alt"]', b => b.disabled), 'forskelskurven har zoomknapper');
  const svgF = await page.$(fSel + ' svg');
  await svgF.scrollIntoViewIfNeeded();
  const bf = await svgF.boundingBox();
  await page.mouse.move(bf.x + bf.width * 0.15, bf.y + bf.height / 2);
  await page.mouse.down();
  await page.mouse.move(bf.x + bf.width * 0.25, bf.y + bf.height / 2, { steps: 4 });
  await page.mouse.move(bf.x + bf.width * 0.35, bf.y + bf.height / 2, { steps: 4 });
  await page.mouse.up();
  await page.waitForTimeout(100);
  const nF = await punkter(fSel);
  ok(nF >= 3 && nF < skema.length, 'trukket udsnit af forskelskurven: ' + nF + ' punkter');
  ok(/uger$/.test(await page.textContent(fSel + ' .udv-udsnit')), 'udsnittet står over kurven: ' + await page.textContent(fSel + ' .udv-udsnit'));
  await page.mouse.move(bf.x + bf.width * 0.5, bf.y + bf.height / 2);
  ok(/\d+\. \w+.*t (merarbejde|overskud)/.test((await page.textContent(fSel + ' .udv-tip')).trim()), 'hover virker i udsnittet: ' + (await page.textContent(fSel + ' .udv-tip')).trim());
  await page.click(fSel + ' .udv-zk[data-zoom="alt"]');
  ok(await punkter(fSel) === skema.length, '«Hele året» viser hele forskelskurven igen');

  const nSel = '.udv-norm-kort';
  const nAlle = await punkter(nSel, '.udv-norm');
  const yAkse = () => page.$$eval(nSel + ' .udv-akse:not(.udv-akse-x)', t => t.map(x => x.textContent).join(' '));
  const yHele = await yAkse();
  await page.focus(nSel + ' svg');
  await page.keyboard.press('+'); await page.keyboard.press('+');
  await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowRight');
  const nZ = await punkter(nSel, '.udv-norm');
  ok(nZ < nAlle, `+ og → zoomer og flytter normkurven: ${nZ} af ${nAlle} punkter`);
  const yZ = await yAkse();
  ok(yZ !== yHele && !yZ.startsWith('0 '), `y-aksen følger udsnittet: ${yZ} (hele året ${yHele})`);
  await page.keyboard.press('ArrowLeft');
  ok(await page.$eval(nSel + ' .udv-zk[data-zoom="hoejre"]', b => !b.disabled), '← flytter udsnittet tilbage');
  await page.keyboard.press('-'); await page.keyboard.press('-'); await page.keyboard.press('-');
  ok(await punkter(nSel, '.udv-norm') === nAlle, '− zoomer helt ud igen');

  if ((await page.$$('[data-graf-id="udv-akkord"]')).length) {
    const aSel = '[data-graf-id="udv-akkord"]';
    const svgA = await page.$(aSel + ' svg');
    await svgA.scrollIntoViewIfNeeded();
    const ba = await svgA.boundingBox();
    await page.mouse.move(ba.x + ba.width * 0.3, ba.y + ba.height / 2);
    await page.keyboard.down('Control');
    await page.mouse.wheel(0, -100);
    await page.keyboard.up('Control');
    await page.waitForTimeout(100);
    ok(await page.$eval(aSel + ' .udv-zk[data-zoom="alt"]', b => !b.disabled), 'Ctrl+hjul zoomer akkordkurven');
    await page.click(aSel + ' .udv-zk[data-zoom="alt"]');
  }

  ok((await page.$$eval('.udv-kort[data-udv]', k => k[0].querySelectorAll('tbody tr').length)) === skema.length, 'tabellen har en række pr. punkt');
  ok((await page.$$eval('.udv-uger tbody tr', r => r.length)) === uger.length, 'ugetabellen har en række pr. uge');
  ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'intet vandret overløb ved 390');
  await page.locator('.udv-sektion').screenshot({ path: DIR + '/udvikling.png' });

  // Ikke i ugen
  await page.click('.rapport-tab[data-period="uge"]'); await page.waitForTimeout(300);
  ok((await page.$$('.udv-kort')).length === 0, 'ingen grafer i ugevisningen');
  await page.context().close();
}

// En engangsopgave (ved afslutning) belaster kun med den brugte tid: det
// ubrugte lægges ikke ud over de kommende uger
{
  const s = new Date(2026, 8, 8, 8).getTime();
  const seed = [settings,
    act('a1', 'Hold-arbejde', { budgetHours: 800 }),
    act('a3', 'Efteruddannelse', { budgetHours: 30, optjening: 'afslutning' }),
    post('e1', 'a3', s, 120)];
  const page = await side(browser, { seed });
  await tilRapport(page);
  const uger = await page.$eval('.udv-uger', k => JSON.parse(k.dataset.uger).data);
  const sumBel = uger.reduce((t, w) => t + w[3], 0) / 60;
  ok(Math.abs(sumBel - (1690 - 28)) <= 2, 'de 28 ubrugte timer ligger ikke i nogen uge: ' + Math.round(sumBel));
  const ugeKlik = async t => {
    const i = uger.findIndex(u => u[0] === t);
    await page.focus('.udv-uger svg');
    await page.keyboard.press('ArrowRight');
    for (let j = 0; j < i; j++) await page.keyboard.press('ArrowRight');
    return page.$$eval('.udv-uger .udv-opg li', l => l.map(li => [li.querySelector('.udv-opg-navn').textContent, li.querySelector('b').textContent]));
  };
  const sep = await ugeKlik(new Date(2026, 8, 7).getTime());
  ok(sep.find(([n]) => n === 'Efteruddannelse')?.[1] === '2 t', 'ugen med efteruddannelse: de brugte 2 t: ' + sep.map(o => o.join(' ')).join(' / '));
  await page.keyboard.press('Escape');
  const nov = await ugeKlik(new Date(2026, 10, 2).getTime());
  ok(nov.length > 0 && !nov.some(([n]) => n === 'Efteruddannelse'), 'ingen efteruddannelse i en uge frem i tiden: ' + nov.map(o => o.join(' ')).join(' / '));
  const under = await page.textContent('.udv-uger .udv-under');
  ok(under.includes('28 t på engangsopgaver er ikke brugt endnu'), 'undertitlen nævner de ubrugte timer: ' + under.match(/[^.]*engangsopgaver er[^.]*/)?.[0]);
  await page.context().close();
}

// Uden budgetter: ingen akkordkurve
{
  const s = new Date(2026, 8, 7, 8).getTime();
  const page = await side(browser, { seed: [settings, act('a1', 'Diverse'), post('e1', 'a1', s, 120)] });
  await tilRapport(page);
  const titler = await page.$$eval('.udv-titel', e => e.map(x => x.textContent));
  ok(titler.join() === 'Arbejdet mod normen,Belastning og arbejde,Arbejdet mod belastning', 'uden budgetter ingen akkordkurve: ' + titler.join());
  await page.context().close();
}

await browser.close();
console.log(fejl.length ? '\nFEJL:\n' + fejl.join('\n') : '\nAlt OK');
process.exitCode = fejl.length ? 1 : 0;
