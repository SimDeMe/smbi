// Kør med node og Playwright installeret. ATLAS_URL kan pege på en lokal server.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const url = process.env.ATLAS_URL || 'http://localhost:8777';
const data = JSON.parse(fs.readFileSync(path.join(root, 'data/samfund.json')));
assert(data.lande['208'].el.renewables > 80);
assert(data.lande['208'].energi.renewables < data.lande['208'].el.renewables);
assert(data.lande['250'].el.nuclear > 60);
assert(data.lande['818'].vand > 100); // Kritisk stress må ikke afklippes ved 100 %.
(async () => {
  const browser = await chromium.launch({ headless: true });
  const fejl = [];
  for (const [width, height] of [[1280,577], [1366,625], [1536,730], [390,750], [640,625]]) {
    const page = await browser.newPage({ viewport: { width, height }, hasTouch: width === 390, isMobile: width === 390, reducedMotion: 'reduce' });
    page.on('pageerror', e => fejl.push(e.stack));
    await page.goto(url + '/atlas/');
    await page.waitForFunction(() => document.querySelector('#kortstatus').hidden);
    const aabn = async id => {
      if (!await page.locator('#lagmenu').evaluate(e => e.matches(':popover-open'))) await page.locator('#lag-aabn').click();
      const btn = page.locator(id), gr = await btn.evaluate(e => e.closest('details').id);
      if (!await page.locator('#'+gr).evaluate(e => e.open)) await page.locator('#'+gr+' summary').click();
      if (width === 390) await btn.tap();
      else { await btn.focus(); await page.keyboard.press('Enter'); }
      await page.waitForFunction(id => document.querySelector(id).getAttribute('aria-pressed') === 'true', id);
      await page.locator('#lag-luk').click();
    };
    await aabn('#energilag');
    await page.locator('#energibasis').selectOption('energi');
    await page.locator('#energikilde').selectOption('coal');
    await page.locator('#energikilde').focus(); await page.keyboard.press('ArrowDown');
    assert.equal(await page.locator('#energikilde').evaluate(e => e === document.activeElement), true);
    assert.match(await page.locator('#ressourceforklaring').innerText(), /substitutionsmetoden/);
    // Uafhængige kontroltal og rigtig kobling til kortets land-id.
    const dk = await page.evaluate(async () => { const m = await import('./samfund.js'); await m.hent(); return m.aflaes({id:'208',properties:{name:'Denmark'}}); });
    assert.match(dk, /2023/); assert.match(dk, /Kul/);
    await aabn('#potentialelag');
    assert.equal(await page.locator('#energilag').getAttribute('aria-pressed'), 'false');
    await page.waitForFunction(() => document.querySelector('#potentialeaflaesning').textContent.includes('kWh/m²/døgn'));
    await page.locator('#potentialemaal').selectOption('vind');
    await page.waitForFunction(() => document.querySelector('#potentialeaflaesning').textContent.includes('m/s'));
    const tal = await page.evaluate(async () => { const m = await import('./potentiale.js'); await m.hent(); return { sahara:m.vaerdi(15,24,'sol'), dk:m.vaerdi(10,56,'sol'), vind:m.vaerdi(10,56,'vind'), kant:m.celle(180,90) === m.celle(-180,90) }; });
    assert(tal.sahara > 6 && tal.dk > 2 && tal.dk < 3.5 && tal.vind > 6 && tal.kant, JSON.stringify(tal));
    await page.screenshot({path: `/tmp/atlas-ressourcer-${width}.png`, fullPage:true});
    await aabn('#vandstresslag');
    assert.equal(await page.locator('#potentialelag').getAttribute('aria-pressed'), 'false');
    assert.match(await page.locator('#ressourceforklaring').innerText(), /2022/);
    await page.locator('#ressourceopgave').click();
    assert.equal(await page.locator('.rangtabel tbody tr').count(), 176);
    await page.keyboard.press('Escape');
    await aabn('#temalag');
    assert.equal(await page.locator('#vandstresslag').getAttribute('aria-pressed'), 'false');
    await aabn('#energilag');
    assert.equal(await page.locator('#temalag').getAttribute('aria-pressed'), 'false');
    // Bevæg globussen med tastatur; klassen følger samme sigtekorn.
    await page.locator('#globus').focus(); await page.keyboard.press('ArrowRight');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.close();
  }
  // Datafejl giver synlig fejl og kan forsøges igen uden genindlæsning.
  const page = await browser.newPage();
  await page.route('**/data/samfund.json', route => route.fulfill({ status: 503, body: '' }));
  await page.goto(url + '/atlas/');
  await page.waitForFunction(() => document.querySelector('#kortstatus').hidden);
  await page.locator('#lag-aabn').click(); await page.locator('#lag-ressourcer summary').click();
  await page.locator('#energilag').click();
  await page.waitForFunction(() => !document.querySelector('#energilag').disabled);
  assert.equal(await page.locator('#energilag').getAttribute('aria-pressed'), 'false');
  assert.match(await page.locator('#kortstatus').innerText(), /kunne ikke/);
  await page.unroute('**/data/samfund.json'); await page.locator('#energilag').click();
  await page.waitForFunction(() => document.querySelector('#energilag').getAttribute('aria-pressed') === 'true');
  await page.route('**/data/potentiale.bin', route => route.fulfill({status:503,body:''}));
  await page.locator('#potentialelag').click();
  await page.waitForFunction(() => !document.querySelector('#potentialelag').disabled);
  assert.equal(await page.locator('#energilag').getAttribute('aria-pressed'), 'true');
  assert.equal(await page.locator('#potentialelag').getAttribute('aria-pressed'), 'false');
  await page.unroute('**/data/potentiale.bin'); await page.locator('#potentialelag').click();
  await page.waitForFunction(() => document.querySelector('#potentialelag').getAttribute('aria-pressed') === 'true');
  const geoOK = await page.evaluate(async () => {
    const m = await import('./potentiale.js');
    for(const centrum of [[0,0],[22,42],[-120,-40]]) {
      const w=101,h=101,cx=50.5,cy=50.5,skala=48;
      const p=d3.geoOrthographic().rotate([-centrum[0],-centrum[1]]).scale(skala).translate([cx,cy]);
      const g=m.geometri(w,h,{centrum,skala,cx,cy});
      for(const [x,y] of [[50,50],[30,35],[65,70]]) {
        const ll=p.invert([x+.5,y+.5]);
        if(g[y*w+x] !== m.celle(...ll)) return false;
      }
    }
    return true;
  });
  assert(geoOK, 'Rasterets positioner skal svare til D3-projektionen');
  const raw = zlib.gunzipSync(fs.readFileSync(path.join(root,'data/potentiale.bin')));
  assert.equal(raw.length, 259208); assert.equal(raw.toString('ascii',0,4), 'RES1');
  assert.deepEqual(fejl, []);
  await browser.close();
  console.log('Ressourcer: data, fem skærme, tastatur/touch, lagudelukkelse, dialog og fejl/genforsøg OK');
})().catch(e => { console.error(e); process.exit(1); });
