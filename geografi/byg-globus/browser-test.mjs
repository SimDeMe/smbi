// Start først python3 -m http.server 8777 i repoets rod.
import { chromium } from '../../værktøj/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { LAG } from './model.js';

const ud = new URL('../../værktøj/ud/', import.meta.url); mkdirSync(ud, {recursive:true});
const url = `http://localhost:${process.env.PORT || 8777}/geografi/byg-globus.html`;
const browser = await chromium.launch({headless:true});
try {
  const page = await browser.newPage({viewport:{width:1366,height:625}}), fejl = [];
  page.on('pageerror', e => fejl.push(e.message));
  const klar = async () => { await page.locator('#hint:not([disabled])').waitFor(); await page.evaluate(() => document.fonts.ready); };
  await page.goto(url); await klar();
  // Forkert svar skal sendes tilbage, og rigtige skal låses uden at flytte kloden.
  await page.locator('[data-ord="asien"]').click();
  await page.locator('[data-find="europa"]').click();
  await page.locator('[data-plads="europa"]').click();
  await page.locator('#indsend').click();
  assert.match(await page.locator('#besked').innerText(), /tilbage/);
  assert.equal(await page.locator('.plads.rigtig').count(),0);
  for (const o of LAG.dele.ord) {
    await page.locator(`[data-ord="${o.id}"]`).click();
    await page.locator(`[data-find="${o.id}"]`).click();
    await page.locator(`[data-plads="${o.id}"]`).click();
  }
  await page.locator('#indsend').click();
  assert.equal(await page.locator('#faerdig').isVisible(),true);
  assert.match(await page.locator('#tab-verdensdele').innerText(), /✓/);
  await page.reload(); await page.locator('#faerdig').waitFor({state:'visible'});
  assert.equal(await page.locator('.plads.rigtig').count(),7);
  await page.locator('#naeste').click();
  assert.match(await page.locator('#titel').innerText(),/verdenshave/);

  // Alle pladser kan nås med knapper, også polerne; tastatur kan sætte ord.
  for (const [tab, id] of [['breddekredse','linjer'],['koordinater','gradnet'],['klimazoner','klima']]) {
    await page.locator(`#tab-${tab}`).click(); await klar();
    if (id==='linjer' || id==='gradnet') {
      await page.evaluate(()=>scrollTo(0,0));
      await page.screenshot({path:fileURLToPath(new URL(`byg-globus-${id}.png`,ud))});
    }
    for (const o of LAG[id].ord) {
      await page.locator(`[data-ord="${o.id}"]`).focus(); await page.keyboard.press('Enter');
      await page.locator(`[data-find="${o.id}"]`).click();
      await page.locator(`[data-plads="${o.id}"]`).focus(); await page.keyboard.press('Enter');
    }
    await page.locator('#indsend').click();
    if (!await page.locator('#faerdig').isVisible()) {
      console.log(id, await page.locator('#besked').innerText(), await page.locator('#pladser').innerHTML());
      await page.screenshot({path:fileURLToPath(new URL('byg-globus-testfejl.png',ud))});
    }
    assert.equal(await page.locator('#faerdig').isVisible(),true,id);
    if (id==='klima') {
      // Markørerne skal faktisk ligge i den viste zone. Ingen plantebælter i UI.
      const zoner = await page.evaluate(async () => {
        const {klasseI} = await import('/atlas/klimalag.js');
        const {LAG,zoneForKlasse} = await import('/geografi/byg-globus/model.js');
        return LAG.klima.ord.map(o=>[o.id,zoneForKlasse(klasseI('vahl',o.punkt))]);
      });
      for (const [id, zone] of zoner) assert.equal(id,zone);
      assert(!/regnskov|savanne|busksteppe|maki|tundra/i.test(await page.locator('.arbejde').innerText()));
      await page.locator('#hjaelpelinjer').check();
      await page.screenshot({path:fileURLToPath(new URL('byg-globus-klima.png',ud))});
    }
  }
  // Poler og breddekredse går nu direkte videre til bredde og længde.
  await page.locator('#tab-breddekredse').click();
  assert.match(await page.locator('#titel').innerText(),/Poler/);
  await page.locator('#naeste').click();
  assert.match(await page.locator('#titel').innerText(),/gradnettets/);
  await page.locator('#naeste').click();
  assert.equal(await page.locator('#punkt-opgave').isVisible(),true);
  // Gradnet var færdigt, så fanen går videre til koordinatopgaverne.
  await page.locator('#tab-koordinater').click(); await klar();
  assert.equal(await page.locator('#punkt-opgave').isVisible(),true);
  await page.locator('#saet-punkt').click();
  assert.equal(await page.locator('#indsend').isVisible(),false);
  assert.match(await page.locator('#besked').innerText(),/for langt/);
  // Tastatur: Home til [10,15], øst 20°, nord 15° → første mål [30,30].
  await page.locator('#globus').focus(); await page.keyboard.press('Home');
  await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowUp');
  for (let n=0;n<5;n++) await page.keyboard.press('Shift+ArrowUp');
  await page.locator('#saet-punkt').click();
  assert.match(await page.locator('#besked').innerText(),/Korrekt!/);
  // Enter på globussen og direkte klik skal også bedømmes med det samme.
  await page.locator('#globus').focus(); await page.keyboard.press('Enter');
  assert.match(await page.locator('#besked').innerText(),/for langt/);
  await page.locator('#globus').click();
  assert.match(await page.locator('#besked').innerText(),/for langt/);
  assert.match(await page.locator('#punkt-maal').innerText(),/30° S/);
  for(let n=0;n<2;n++){await page.locator('#hint').click(); await page.locator('#hint').click();}
  assert.equal(await page.locator('#faerdig').isVisible(),true);
  assert(!/★/.test(await page.locator('#taeller').innerText()));

  // Laptop, smal visning, mobil, fokus: ingen vandret overflow.
  await page.locator('#tab-verdensdele').click(); await page.locator('#forfra').click(); await klar();
  for(const [w,h] of [[1280,577],[1366,625],[1536,730],[740,750],[390,750]]) {
    await page.setViewportSize({width:w,height:h}); await page.waitForTimeout(90);
    await page.evaluate(()=>scrollTo(0,0));
    const maal = await page.evaluate(()=>{
      const f=document.querySelector('#globus').getBoundingClientRect(), k=document.querySelector('#indsend').getBoundingClientRect();
      return {overflow:document.documentElement.scrollWidth>innerWidth,spaend:Math.max(f.bottom,k.bottom)-Math.min(f.top,k.top),fokus:document.body.classList.contains('fokus')};
    });
    assert.equal(maal.overflow,false,`${w}: vandret overflow`);
    if(w>=850) assert(maal.spaend<h,`${w}: figur og primære kontroller kan ikke ses samtidig: ${maal.spaend}`);
    await page.screenshot({path:fileURLToPath(new URL(`byg-globus-${w}.png`,ud))});
  }
  await page.locator('#fokus').click(); assert.equal(await page.locator('#site-top').isVisible(),false);
  assert.deepEqual(fejl,[]);

  // Ingen ekstern netadgang er nødvendig; afvist lagring stopper heller ikke UI.
  const offline = await browser.newPage({viewport:{width:1280,height:577}});
  await offline.route('**/*',route=>new URL(route.request().url()).hostname==='localhost'?route.continue():route.abort());
  await offline.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw new Error('Lagring blokeret');}});});
  await offline.goto(url); await offline.locator('#indsend:not([disabled])').waitFor();
  await offline.locator('#hint').click(); await offline.locator('#hint').click();
  assert.match(await offline.locator('#taeller').innerText(),/1 \/ 7/);

  // Manglende data viser en konkret fejl og en genforsøgsknap.
  const brud = await browser.newPage();
  await brud.route('**/countries-110m.json',route=>route.fulfill({status:503,body:'utilgængelig'}));
  await brud.goto(url); await brud.locator('#indlaesning button').waitFor();
  assert.match(await brud.locator('#indlaesning').innerText(),/ikke hentes/);

  // Genforsøg ved netfejl må også virke efter en mislykket klimahentning.
  await brud.unroute('**/countries-110m.json');
  let forsoeg = 0;
  await brud.route('**/vahl.json',route=>++forsoeg===1 ? route.fulfill({status:503,body:'utilgængelig'}) : route.continue());
  await brud.goto(url+'?nettest#klimazoner'); await brud.locator('#indlaesning button').waitFor();
  await brud.locator('#indlaesning button').click(); await brud.locator('#indsend:not([disabled])').waitFor();
  assert.equal(await brud.locator('#indlaesning').isVisible(),false);
  assert.equal(forsoeg,2);

  // Touch: ordbakken skal kunne bruges samtidig med den synlige globus.
  const mobil = await browser.newPage({viewport:{width:390,height:750},hasTouch:true,isMobile:true});
  await mobil.goto(url); await mobil.locator('#indsend:not([disabled])').waitFor();
  await mobil.locator('[data-ord="antarktis"]').tap();
  await mobil.locator('[data-find="antarktis"]').tap();
  await mobil.locator('[data-plads="antarktis"]').tap();
  await mobil.locator('#indsend').tap();
  assert.equal(await mobil.locator('.plads.rigtig').count(),1);
  await mobil.locator('[data-find="afrika"]').tap();
  await mobil.locator('[data-ord="afrika"]').tap();
  await mobil.locator('[data-plads="afrika"]').tap();
  await mobil.evaluate(()=>document.querySelector('#globusrum').scrollIntoView({block:'center',behavior:'instant'}));
  const tray = await mobil.locator('#ord').boundingBox();
  await mobil.screenshot({path:fileURLToPath(new URL('byg-globus-touch.png',ud))});
  assert(tray.y>=0 && tray.y<150,'Ordbakken følger ikke med på telefonen');
  console.log('Globusbrowser: svar, gemt fremskridt, tastatur, poler, øjeblikkelig koordinatfeedback, Vahl-data, skærmstørrelser, offline og fejltilstand OK.');
} finally { await browser.close(); }
