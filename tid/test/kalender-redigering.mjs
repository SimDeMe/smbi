import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import fsx from 'fs';
const HER = fileURLToPath(new URL('.', import.meta.url));   // tid/test/
const DIR = HER + 'ud';                                       // skærmbilleder
fsx.mkdirSync(DIR, { recursive: true });
import fs from 'fs';
const BASE = 'http://localhost:8777/tid/';
const fejl = [];
const ok = (b, msg) => { console.log((b ? 'OK   ' : 'FEJL ') + msg); if (!b) fejl.push(msg); };

async function side(browser, cfg, w = 390, h = 844) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, serviceWorkers: 'block', locale: 'da-DK' });
  const page = await ctx.newPage();
  page.on('pageerror', e => fejl.push('pageerror: ' + e.message));
  for (const [frag, fil] of [['firebase-app.js', 'fake-app.js'], ['firebase-auth.js', 'fake-auth.js'], ['firebase-firestore.js', 'fake-fs.js']])
    await page.route('**/' + frag, r => r.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(HER + fil, 'utf8') }));
  await page.route('**/feedback.js', r => r.fulfill({ contentType: 'text/javascript', body: '' }));
  await page.route('https://fonts.**', r => r.abort());
  await page.addInitScript(c => { window.__fsCfg = c; }, cfg);
  // Dagen er fredag 2. oktober 2026, og klokken er 14 — formiddagen er gået
  await page.clock.setFixedTime(new Date(2026, 9, 2, 14, 0));
  await page.goto(BASE);
  return page;
}
const act = (id, name, extra = {}) => [`users/u1/activities/${id}`, { name, type: 'opgave', color: '#0E86C8', schoolYear: '2026/27', order: 1, isArchived: false, parentId: null, ...extra }];
const settings = ['users/u1/settings/config', { currentSchoolYear: '2026/27' }];
const kl = (h, m = 0) => new Date(2026, 9, 2, h, m).getTime();
const post = (id, a, s, e, extra = {}) => [`users/u1/entries/${id}`, { activityId: a, workType: null, startTime: { __ts: s }, endTime: e == null ? null : { __ts: e }, durationMinutes: e == null ? null : Math.round((e - s) / 60000), note: '', isModule: false, autoStopped: false, ...extra }];
const tilHistorik = async page => { await page.click('.nav-btn[data-view="historik"]'); await page.waitForSelector('#kal-view .kal-grid'); await page.waitForTimeout(300); };

// Et modul, en pause på 5 min, et modul og en kort post på 5 min lige efter
const seed = [settings, act('a1', 'SRP'), act('a2', 'Retning', { color: '#E8336D' }),
  post('e1', 'a1', kl(8), kl(9, 35)),
  post('e2', null, kl(9, 35), kl(9, 40), { isBreak: true }),
  post('e3', 'a2', kl(9, 40), kl(11, 15)),
  post('e4', 'a1', kl(11, 15), kl(11, 20)),
  post('e5', 'a2', kl(12), kl(13))];

// Hvilken blok rammer et klik midt i blokkens synlige del?
const rammer = (page, id) => page.$eval(`.kal-block[data-id="${id}"]`, b => {
  const r = b.getBoundingClientRect();
  return document.elementFromPoint(r.left + r.width / 2, r.top + Math.min(r.height, 10) / 2)?.closest('.kal-block')?.dataset.id;
});

const browser = await chromium.launch();

// ── Telefonen: korte blokke ligger øverst og kan rammes ──
{
  const page = await side(browser, { seed }, 390);
  await page.waitForTimeout(400);
  await tilHistorik(page);
  ok(await rammer(page, 'e2') === 'e2', 'pausen på 5 min kan rammes, selv om modulet efter rager op over den');
  ok(await rammer(page, 'e4') === 'e4', 'en kort post lige efter et modul kan rammes');
  ok(await rammer(page, 'e3') === 'e3', 'modulet under den korte post kan stadig rammes');
  ok(await page.isHidden('.kal-dagliste'), 'dagens liste er skjult på en smal skærm');

  // Zoom: aksen bliver højere, og valget huskes
  const h1 = await page.$eval('.kal-grid', g => g.offsetHeight);
  await page.click('#kal-zoom-ind'); await page.waitForTimeout(150);
  const h2 = await page.$eval('.kal-grid', g => g.offsetHeight);
  ok(h2 > h1 * 1.2, `zoom ind gør aksen højere: ${h1} → ${h2} px`);
  await page.reload(); await page.waitForTimeout(400); await tilHistorik(page);
  ok(await page.$eval('.kal-grid', g => g.offsetHeight) === h2, 'zoomen huskes efter genindlæsning');
  await page.click('.kal-vis-tab[data-vis="maaned"]'); await page.waitForTimeout(150);
  ok(await page.isHidden('#kal-zoom'), 'zoomknapperne er væk i månedsvisningen');
  await page.context().close();
}

// ── Bred skærm: liste ved siden af, arket i siden, træk med musen ──
{
  const page = await side(browser, { seed }, 1440, 900);
  await page.waitForTimeout(400);
  await tilHistorik(page);
  const bredde = await page.$eval('#view-historik', v => v.getBoundingClientRect().width);
  ok(bredde > 1000, `Historik bruger bredden: ${Math.round(bredde)} px`);
  const raekker = await page.$$eval('.kal-dl-raekke', l => l.map(r => r.dataset.id));
  ok(raekker.join() === 'e1,e2,e3,e4,e5', 'dagens liste har alle fem poster i rækkefølge: ' + raekker);

  // Rækken åbner arket, som står i højre side uden at dække kalenderen
  await page.click('.kal-dl-raekke[data-id="e2"]');
  await page.waitForSelector('#hist-sheet.open'); await page.waitForTimeout(400);
  ok(await page.textContent('#hist-sheet-title') === 'Redigér kort pause', 'rækken åbner den rigtige post');
  const ark = await page.$eval('#hist-sheet', a => a.getBoundingClientRect());
  const grid = await page.$eval('.kal-grid', g => g.getBoundingClientRect());
  ok(ark.left > 1440 / 2 && ark.height > 800, `arket står i højre side i fuld højde (x=${Math.round(ark.left)})`);
  ok(grid.right <= ark.left, `kalenderen ligger til venstre for arket (${Math.round(grid.right)} ≤ ${Math.round(ark.left)})`);
  ok(await page.$eval('.kal-block[data-id="e2"]', b => getComputedStyle(b).outlineStyle) === 'solid', 'posten i arket er markeret på aksen');
  await page.screenshot({ path: DIR + '/kalender-bred-ark.png' });
  await page.keyboard.press('Escape'); await page.waitForTimeout(400);
  await page.mouse.move(5, 300);          // væk fra rækken, der ellers peger blokken ud
  ok(await page.$eval('.kal-block[data-id="e2"]', b => getComputedStyle(b).outlineStyle) !== 'solid', 'markeringen forsvinder, når arket lukkes');

  // Træk modulet e3 en halv time ned
  const pxTime = await page.$eval('.kal-block[data-id="e3"]', b => b.offsetHeight / (95 / 60));
  const b = await page.$eval('.kal-block[data-id="e3"]', b => { const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + 30, bund: r.bottom - 3 }; });
  await page.mouse.move(b.x, b.y); await page.mouse.down();
  await page.mouse.move(b.x, b.y + pxTime / 4, { steps: 4 });
  await page.mouse.move(b.x, b.y + pxTime / 2, { steps: 4 });
  const live = await page.textContent('.kal-block[data-id="e3"] .kal-block-time');
  ok(live.startsWith('10:10–11:45'), 'tiden står i blokken under trækket: ' + live);
  await page.mouse.up(); await page.waitForTimeout(300);
  ok(await page.isHidden('#hist-sheet'), 'et træk åbner ikke arket');
  const e3 = () => page.evaluate(() => { const d = window.__fs.store.get('users/u1/entries/e3'); return [d.startTime.toDate().toTimeString().slice(0, 5), d.endTime.toDate().toTimeString().slice(0, 5), d.durationMinutes]; });
  ok((await e3()).join() === '10:10,11:45,95', 'posten er flyttet en halv time og beholder længden: ' + await e3());
  ok((await page.textContent('#toast')).includes('Flyttet til 10:10–11:45'), 'toasten siger, hvor den er flyttet hen');

  await page.click('.toast-knap'); await page.waitForTimeout(300);
  ok((await e3()).join() === '09:40,11:15,95', 'Fortryd sætter posten tilbage: ' + await e3());

  // Træk i grebet forneden: kun sluttiden ændres
  const g = await page.$eval('.kal-block[data-id="e3"] .kal-block-greb', x => { const r = x.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  await page.mouse.move(g.x, g.y); await page.mouse.down();
  await page.mouse.move(g.x, g.y - pxTime / 4, { steps: 5 });
  await page.mouse.up(); await page.waitForTimeout(300);
  ok((await e3()).join() === '09:40,11:00,80', 'grebet ændrer kun sluttiden: ' + await e3());

  // Snap: e5 (12:00–13:00) trækkes 38 min op — starten snapper til e4's slutning 11:20
  const tid = id => page.evaluate(id => { const d = window.__fs.store.get('users/u1/entries/' + id); return [d.startTime.toDate().toTimeString().slice(0, 8), d.endTime.toDate().toTimeString().slice(0, 8)]; }, id);
  const midt = id => page.$eval(`.kal-block[data-id="${id}"]`, b => { const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  let m = await midt('e5');
  await page.mouse.move(m.x, m.y); await page.mouse.down();
  await page.mouse.move(m.x, m.y - 38 * pxTime / 60, { steps: 6 });
  await page.mouse.up(); await page.waitForTimeout(300);
  ok((await tid('e5')).join() === '11:20:00,12:20:00', 'starten snapper til naboens slutning: ' + await tid('e5'));
  ok(!(await page.textContent('#toast')).includes('OBS'), 'kant i kant er ikke overlap: ' + await page.textContent('#toast'));

  // Overlap: e5 trækkes 30 min op, ind over e3 (09:40–11:00) og e4
  m = await midt('e5');
  await page.mouse.move(m.x, m.y); await page.mouse.down();
  await page.mouse.move(m.x, m.y - 30 * pxTime / 60, { steps: 6 });
  const under = await page.evaluate(() => ({
    selv: document.querySelector('.kal-block[data-id="e5"]').classList.contains('kal-block-overlap'),
    ramt: [...document.querySelectorAll('.kal-block-ramt')].map(b => b.dataset.id).join(),
    tekst: document.querySelector('.kal-block[data-id="e5"] .kal-block-time').textContent }));
  ok(under.selv && under.ramt === 'e3,e4', 'under trækket markeres blokken og de ramte: ' + under.ramt);
  ok(under.tekst.includes('overlap'), 'tiden i blokken siger overlap: ' + under.tekst);
  await page.screenshot({ path: DIR + '/kalender-overlap.png' });
  await page.mouse.up(); await page.waitForTimeout(300);
  const toast = await page.textContent('#toast');
  ok(toast.includes('10:50–11:50') && toast.includes('OBS: overlapper Retning og SRP'), 'beskeden advarer om overlap: ' + toast);
  ok(await page.$$eval('.kal-block-ramt,.kal-block-overlap', l => l.length) === 0, 'markeringen forsvinder, når man slipper');
  await page.click('.toast-knap'); await page.waitForTimeout(300);
  ok((await tid('e5')).join() === '11:20:00,12:20:00', 'Fortryd efter overlap: ' + await tid('e5'));

  // Et almindeligt klik på blokken åbner stadig arket
  await page.click('.kal-block[data-id="e1"]');
  await page.waitForSelector('#hist-sheet.open');
  ok(true, 'et klik uden træk åbner arket');
  await page.keyboard.press('Escape'); await page.waitForTimeout(400);
  await page.screenshot({ path: DIR + '/kalender-bred.png' });
  await page.context().close();
}

await browser.close();
console.log(fejl.length ? '\nFEJL:\n' + fejl.join('\n') : '\nAlt OK');
process.exitCode = fejl.length ? 1 : 0;
