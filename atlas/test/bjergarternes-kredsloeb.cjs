// Browsertest for Bjergarternes kredsløb. Kræver en lokal server og Playwright:
//   NODE_PATH=værktøj/node_modules node atlas/test/bjergarternes-kredsloeb.cjs
// Modellens indhold og tal testes for sig i atlas/bjergarternes-kredsloeb/model.test.mjs.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const base = process.env.ATLAS_URL || 'http://127.0.0.1:8777';
const ud = process.env.ATLAS_TEST_UD || '/tmp/smbi-kredsloeb';
fs.mkdirSync(ud, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true });
  const fejl = [];
  for (const [w, h] of [[1280, 577], [1366, 625], [1536, 730], [390, 750], [640, 625]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce', hasTouch: w === 390, isMobile: w === 390 });
    const side = await ctx.newPage();
    side.on('pageerror', e => fejl.push(`${w}: ${e.message}`));
    side.on('console', m => { if (m.type() === 'error') fejl.push(`${w}: ${m.text()}`); });
    side.on('response', r => { if (r.status() >= 400) fejl.push(`${w}: ${r.status()} ${r.url()}`); });
    await side.goto(base + '/atlas/bjergarternes-kredsloeb/');
    await side.evaluate(() => document.fonts.ready);
    const vandret = () => side.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    const synlig = async sel => { const b = await side.locator(sel).first().boundingBox(); return b && b.y >= 0 && b.y + b.height <= h; };
    const tryk = async sel => (w === 390 ? side.locator(sel).first().tap() : side.locator(sel).first().click());

    // 1 · Stenens rejse: fra granit til kvartsit, med fortryd og udfordring.
    assert.equal(await vandret(), 0, 'ingen vandret rulning');
    if (w >= 900) for (const sel of ['#diagram', '#stenkort', '.mulighed']) assert.ok(await synlig(sel), `${sel} synlig ved ${w}×${h}`);
    await side.evaluate(() => localStorage.clear());
    assert.match(await side.textContent('#stenkort h3'), /Granit/);
    assert.ok(await side.locator('#stenkort img').count() === 1, 'granitten har et foto fra samlingen');
    for (const valg of ['Forvitring og erosion: Sand', 'Aflejring og sammenkitning: Sandsten', 'Omdannelse: Kvartsit']) {
      await tryk(`.mulighed:has-text("${valg}")`);
      assert.match(await side.textContent('#stenkort h3'), new RegExp(valg.split(': ')[1]));
    }
    assert.match(await side.textContent('#rejsetid'), /I alt ca\. 40 mio\. år/);
    assert.equal(await side.locator('#rejse li').count(), 4);
    assert.match(await side.textContent('#forklaring'), /Udfordring klaret: Fra granit til kvartsit/);
    assert.equal(await side.locator('#maal [data-klaret=true]').count(), 1);
    assert.equal(await side.locator('#diagram .spor rect').count(), 3, 'tre trin på tre forskellige pile');
    assert.match(await side.getAttribute('#diagram', 'aria-label'), /Stenen er nu Kvartsit/);
    await tryk('#fortryd');
    assert.match(await side.textContent('#stenkort h3'), /Sandsten/);
    // Tastatur: efter et trin har den første mulighed fokus, og Enter tager næste trin.
    await side.locator('.mulighed').first().focus();
    await side.keyboard.press('Enter');
    assert.ok(await side.evaluate(() => document.activeElement.classList.contains('mulighed')), 'fokus på ny mulighed');
    // Kvartsit og marmor kan ikke smelte i modellen; kappen kan.
    await side.selectOption('#start', 'kvartsit');
    assert.ok(!(await side.textContent('#muligheder')).includes('Opsmeltning'));
    await side.selectOption('#start', 'peridotit');
    await tryk('.mulighed');
    assert.match(await side.textContent('#stenkort h3'), /Basaltisk magma/);
    // Fra trinnet til stedet i snittet.
    await tryk('#forklaring button');
    await side.waitForSelector('#del-2:not([hidden])');
    await side.waitForFunction(() => document.querySelectorAll('.stedknap').length === 8, null, { timeout: 10000 });
    assert.equal(await side.getAttribute('#fane-2', 'aria-selected'), 'true');
    assert.match(await side.textContent('#stedkort h3'), /Spredningsryg/);

    // 2 · Snittet: alle steder, temperatur, quiz med rigtigt og forkert svar.
    if (w >= 900) for (const sel of ['#snit', '[data-tilstand=quiz]', '.stedknap']) assert.ok(await synlig(sel), `${sel} synlig ved ${w}×${h}`);
    assert.equal(await side.locator('.stedknap').count(), 8);
    const knapper = await side.locator('.stedknap').evaluateAll(ks => ks.map(k => { const r = k.getBoundingClientRect(); return [r.width, r.height]; }));
    assert.ok(knapper.every(([bb, hh]) => bb > 20 && hh > 20), 'stedknapperne er synlige');
    for (const [id, navn] of [['bjergkaede', 'Bjergkæde'], ['subduktion', 'Subduktionszone'], ['sokkel', 'Lavland']]) {
      await tryk(`.stedknap[data-sted=${id}]`);
      assert.match(await side.textContent('#stedkort h3'), new RegExp(navn));
      assert.ok(await side.locator('#stedkort .dannes a').count() >= 1);
    }
    assert.ok(await side.locator('#snit .temperatur[hidden]').count() === 1);
    await tryk('#temperatur');
    assert.ok(await side.locator('#snit .temperatur:not([hidden])').count() === 1, 'temperaturen vises');
    await tryk('[data-tilstand=quiz]');
    assert.ok(await side.isVisible('#quiz') && !(await side.isVisible('#stedkort')));
    const svar = async ret => {
      const sten = await side.getAttribute('#quizsten', 'data-sten');
      const rigtige = await side.evaluate(async s => (await import('/atlas/bjergarternes-kredsloeb/model.js')).stederFor(s), sten);
      const alle = ['hotspot', 'ryg', 'dybhav', 'subduktion', 'bue', 'buedyb', 'sokkel', 'bjergkaede'];
      const valgt = ret ? rigtige[0] : alle.find(a => !rigtige.includes(a));
      await tryk(`.stedknap[data-sted=${valgt}]`);
      return rigtige;
    };
    await svar(true);
    assert.match(await side.textContent('#quizsvar h3'), /Rigtigt/);
    assert.match(await side.textContent('#quizpoint'), /1 rigtige/);
    await tryk('#quiznaeste');
    const rigtige = await svar(false);
    assert.match(await side.textContent('#quizsvar h3'), /Ikke helt/);
    assert.equal(await side.locator('.stedknap.rigtig').count(), rigtige.length);
    assert.equal(await side.locator('.stedknap.forkert').count(), 1);
    // Piletaster i valget mellem udforsk og quiz.
    await side.locator('[data-tilstand=quiz]').focus();
    await side.keyboard.press('ArrowLeft');
    assert.equal(await side.getAttribute('[data-tilstand=udforsk]', 'aria-checked'), 'true');
    assert.equal(await vandret(), 0);
    await side.screenshot({ path: `${ud}/snit-${w}x${h}.png` });

    // 3 · Afkøling: lava, gang og pluton giver basalt, diabas og gabbro; granitisk pluton giver granit.
    await tryk('#fane-3');
    await side.waitForSelector('#del-3:not([hidden])');
    await side.waitForFunction(() => document.querySelector('#lupe-tekst').textContent, null, { timeout: 10000 }); // modulet indlæses ved første visning
    if (w >= 900) for (const sel of ['#lupe', '#stoerkn', '#tykkelse', '#lupe-tekst']) assert.ok(await synlig(sel), `${sel} synlig ved ${w}×${h}`);
    assert.match(await side.textContent('#lupe-tekst'), /Basalt · korn ca\. 0,3 mm · afkøling ca\. 72 døgn/);
    for (const [krop, navn] of [['gang', 'Diabas'], ['pluton', 'Gabbro']]) {
      await tryk(`[data-krop=${krop}]`);
      assert.match(await side.textContent('#lupe-tekst'), new RegExp(navn));
    }
    await tryk('[data-magma=granitisk]');
    assert.match(await side.textContent('#resultat'), /Granit/);
    assert.match(await side.textContent('#resultat'), /pegmatit/);
    await side.locator('#tykkelse').focus();
    await side.keyboard.press('End');
    assert.equal(await side.textContent('#tykkelse-ud'), '20 km');
    assert.match(await side.textContent('#resultat'), /grovkornet/);
    await tryk('[data-krop=lava]');
    await side.locator('#tykkelse').focus();
    await side.keyboard.press('Home');
    assert.match(await side.textContent('#lupe-tekst'), /Obsidian · glas/);
    await tryk('#stoerkn');
    assert.match(await side.textContent('#lupe-ur'), /Størknet efter ca\./);
    // Krystallerne fylder hele feltet til sidst: ingen glødende smelte tilbage.
    const smelte = await side.evaluate(() => {
      const c = document.querySelector('#lupe'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
      let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] > 200 && d[i + 1] > 80 && d[i + 1] < 140 && d[i + 2] < 70) n++;
      return n;
    });
    assert.equal(smelte, 0, 'smelte tilbage i luppen');
    await tryk('[data-krop=gang]');
    await tryk('[data-magma=basaltisk]');
    assert.equal(await vandret(), 0);
    await side.screenshot({ path: `${ud}/afkoeling-${w}x${h}.png` });

    // Dialog og fokus.
    await tryk('#om-knap');
    assert.ok(await side.isVisible('#om'));
    await side.keyboard.press('Escape');
    assert.ok(!(await side.isVisible('#om')));
    await tryk('#fokus');
    assert.ok(!(await side.isVisible('.site-header')));
    await side.keyboard.press('Escape');
    assert.ok(await side.isVisible('.site-header'));
    // Faner med piletaster og adressen.
    await side.locator('#fane-3').focus();
    await side.keyboard.press('ArrowRight');
    assert.equal(await side.getAttribute('#fane-1', 'aria-selected'), 'true');
    assert.equal(new URL(side.url()).hash, '');
    console.log(`${w}×${h}: rejse, udfordring, fortryd, tastatur, snit, temperatur, quiz, afkøling, glas, dialog og fokus bestået`);
    await ctx.close();
  }
  await browser.close();
  assert.deepEqual(fejl, [], fejl.join('\n'));
  console.log('Alle browsertest for Bjergarternes kredsløb bestået.');
})().catch(e => { console.error(e); process.exit(1); });
