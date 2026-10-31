import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const server=spawn('python3',['-m','http.server','8782','--bind','127.0.0.1'],{stdio:'ignore'});
await new Promise(r=>setTimeout(r,600));
const browser=await chromium.launch();
const FORVENTET={stabil:[333,333],ustabil:[1357,3000],betinget:[667,3000],inversion:[143,143]};
const koer=async page=>{
 for(let i=0;i<60;i++){
  if((await page.locator('#afspil').textContent()).includes('ny pakke')) return +(await page.locator('#hoejde').inputValue());
  await page.locator('#afspil').click();
 }
 throw new Error('Pakken faldt ikke til ro');
};
try {
 const page=await browser.newPage({viewport:{width:1280,height:577}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8782/geografi/luftmasser/');
 await page.emulateMedia({reducedMotion:'reduce'});
 const mode=m=>page.locator(`[data-visning="${m}"]`).click();
 const lift=async n=>{for(let i=0;i<n;i++)await page.locator('#a-afspil').click();};
 // Starten er ét arbejdsfelt. Opgaver, tabeller og ekstra forklaringer er ikke fremme.
 assert.match(await page.locator('#a-titel').textContent(),/Hvad sker der/);
 assert.equal(await page.locator('#intro').isVisible(),false);
 assert.equal(await page.locator('#a-forstaaelse').isVisible(),false);
 assert.equal(await page.locator('#opgaver').isVisible(),false);
 assert.equal(await page.locator('#a-tabel table').isVisible(),false);
 assert.equal(await page.locator('.stige-regel, .stige-energi, .aarsag, .bundlinje').count(),0);
 assert.equal(await page.locator('[data-sky="fugtig"]').isVisible(),false);
 assert.equal(await page.locator('#a-saenk').isDisabled(),true);
 // Alle tre visninger kan vælges fra begyndelsen.
 await mode('hvorfor');await lift(2);
 assert.match(await page.locator('.h-scene').textContent(),/0 m.*22,0 °C.*22,0 °C/s);
 await mode('stige');
 await lift(1);
 assert.equal(await page.locator('[data-pakke="toer"] b').textContent(),'21,0 °C');
 assert.equal(await page.locator('[data-fald="toer"]').textContent(),'−1,0 °C');
 await page.locator('#a-saenk').click();
 assert.equal(await page.locator('#a-hoejde-tal').textContent(),'0 m');
 await lift(5);
 assert.equal(await page.locator('[data-pakke="toer"] b').textContent(),'17,0 °C');
 assert.equal(await page.locator('[data-pakke="fugtig"] b').textContent(),'17,5 °C');
 assert.equal(await page.locator('[data-fald="fugtig"]').textContent(),'−0,5 °C');
 await page.screenshot({path:join(tmpdir(),'luftpakke-stige.png'),fullPage:true});
 // Målinger åbnes efter behov og viser de samme pakker og seneste trin.
 await page.locator('#a-maalinger summary').click();
 assert.match(await page.locator('#a-tabel tr.nu').textContent(),/500 m17,0 °C.*17,5 °C/s);
 assert.equal(await page.locator('#a-tabel tbody tr').count(),3);
 await page.locator('#a-maalinger summary').click();
 await mode('hvorfor');await lift(2);
 assert.match(await page.locator('.h-scene').textContent(),/500 m.*17,0 °C.*\+0,5 °C.*17,5 °C/s);
 assert.equal(await page.locator('.h-kontekst').count(),0);
 assert.match(await page.locator('#a-tekst').textContent(),/opbygget fra 400 m til 500 m/);
 await mode('stige');await lift(5);await mode('hvorfor');await lift(2);
 assert.match(await page.locator('.h-scene').textContent(),/1\.000 m.*12,0 °C.*\+3,0 °C.*15,0 °C/s);
 await page.screenshot({path:join(tmpdir(),'luftpakke-aktuel-forklaring.png'),fullPage:true});
 // Figur og primære kontroller på skolelaptops. Ingen vandret rulning på mobil.
 for(const [width,height] of [[1280,577],[1366,625],[1536,730],[390,750],[640,750]]) {
  await page.setViewportSize({width,height});
  for(const visning of ['stige','hvorfor','graf']) {
   await mode(visning);
   await page.evaluate(()=>scrollTo(0,0));
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${visning}: vandret rul ved ${width}`);
   if(width>820)for(const id of ['#figur','.a-betjening']) assert.ok(await page.locator(id).evaluate(el=>el.getBoundingClientRect().bottom<=innerHeight),`${visning}: ${id} under skærmen ved ${width}×${height}`);
  }
 }
 await page.setViewportSize({width:390,height:750});await mode('stige');
 await page.screenshot({path:join(tmpdir(),'luftpakke-mobil.png'),fullPage:true});
 await page.setViewportSize({width:1280,height:577});
 await mode('stige');await page.locator('#a-nulstil').click();await lift(30);
 assert.equal(await page.locator('#a-afspil').isDisabled(),true);
 await page.locator('#a-saenk').click();
 assert.match(await page.locator('#a-hoejde-tal').textContent(),/2\.900 m/);
 assert.equal(await page.locator('[data-fald="toer"]').textContent(),'+0,5 °C');
 await page.locator('#a-nulstil').click();
 // Temperaturkurven har stadig kontinuerligt løft med stop ved skybasen.
 await mode('graf');
 for(const [luft,base,top] of [['toer',1500,'Afkølet 22,5'],['fugtig',400,'Afkølet 17,0']]) {
  await page.locator(`[data-aluft="${luft}"]`).click();
  await page.locator('#a-afspil').click();assert.equal(await page.locator('#a-hoejde').inputValue(),String(base));
  await page.locator('#a-afspil').click();assert.equal(await page.locator('#a-hoejde').inputValue(),'3000');
  await page.locator('#a-maalinger summary').click();
  assert.match(await page.locator('#a-maal-titel').textContent(),new RegExp(top));
  await page.locator('#a-maalinger summary').click();
  await page.locator('#a-afspil').click();assert.equal(await page.locator('#a-hoejde').inputValue(),'0');
 }
 // Stabilitet: modellen bestemmer bevægelsen efter slip i alle otte tilfælde.
 for(const [profil,[toer,fugtig]] of Object.entries(FORVENTET)) {
  await page.locator(`[data-profil="${profil}"]`).click();
  assert.equal(await page.locator('#a-navigation').isVisible(),false);
  for(const [luft,maal] of [['toer',toer],['fugtig',fugtig]]) {
   await page.locator(`[data-luft="${luft}"]`).click();
   assert.equal(await page.locator('#hoejde').inputValue(),'0');
   const z=await koer(page);assert.ok(Math.abs(z-maal)<=15,`${profil}/${luft}: ${z} ≠ ${maal}`);
   assert.match(await page.locator('#opdrift-titel').textContent(),maal===3000?/Stadig varmere/:/Stopper ved/);
   await page.evaluate(()=>scrollTo(0,0));
   for(const id of ['#afspil','#hoejde']) assert.ok(await page.locator(id).evaluate(el=>el.getBoundingClientRect().bottom<=innerHeight),`${profil}/${luft}: ${id} under skærmen`);
  }
 }
 await page.locator('[data-profil="betinget"]').click();await page.locator('[data-luft="toer"]').click();
 await page.locator('#hoejde').fill('2800');assert.equal(await koer(page),3000);
 await page.screenshot({path:join(tmpdir(),'luftpakke-fri.png'),fullPage:true});
 await page.emulateMedia({reducedMotion:'no-preference'});
 await page.locator('[data-profil="afkoeling"]').click();await mode('graf');
 await page.locator('#a-afspil').click();await page.waitForTimeout(2200);
 assert.equal(await page.locator('#a-hoejde').inputValue(),'400');
 await page.locator('[data-profil="ustabil"]').click();await page.locator('#afspil').click();await page.waitForTimeout(1200);
 await page.locator('#afspil').click();const z=await page.locator('#hoejde').inputValue();assert.ok(+z>0&&+z<3000);
 await page.waitForTimeout(150);assert.equal(await page.locator('#hoejde').inputValue(),z);
 await page.locator('#hoejde').focus();await page.keyboard.press('ArrowRight');assert.ok(+(await page.locator('#hoejde').inputValue())>+z);
 await page.locator('#fokus').click();await page.keyboard.press('Escape');assert.equal(await page.locator('#fokus').getAttribute('aria-pressed'),'false');
 // Alt elevarbejde er samlet i opgavefanen. Kun én opgave vises.
 await page.locator('#vaelg-opgaver').click();
 assert.equal(await page.locator('#simulationsfelt').isVisible(),false);
 assert.equal(await page.locator('.opgavekort>article').count(),7);
 assert.equal(await page.locator('.opgavekort>article:visible').count(),1);
 await page.locator('#energi-svar').fill('Energi bruges på arbejde ved udvidelsen.');
 await page.locator('#fortaetning-svar').fill('Begge processer fortsætter samtidig.');
 await page.locator('#a-forstaaelse summary').first().click();assert.match(await page.locator('#a-forstaaelse details[open]').textContent(),/indre energi/);
 await page.locator('#opgavevalg').selectOption('1');
 await page.locator('#forklar-kurve').fill('Pakken mister opdrift, når temperaturerne mødes.');
 await page.locator('#tegn-2').fill('400');await page.locator('#vis-modelkurve').click();assert.equal(await page.locator('#kurve-feedback').isVisible(),true);
 await page.locator('#opgavevalg').selectOption('3');
 await page.locator('[data-forsoeg="betinget"][data-fugt="toer"]').click();
 assert.equal(await page.locator('#hoejde').inputValue(),'2000');
 await page.locator('#vaelg-opgaver').click();assert.equal(await page.locator('#opgavevalg').inputValue(),'3');
 await page.locator('#opgavevalg').selectOption('6');
 await page.locator('#svar-0').fill('14,0');await page.locator('#svar-0').press('Enter');assert.match(await page.locator('#svar-tekst-0').textContent(),/^Rigtigt/);
 await page.locator('#svar-1').fill('6');await page.locator('#svar-1').press('Enter');assert.match(await page.locator('#svar-tekst-1').textContent(),/^Ikke helt/);
 for(const width of [380,390,640,1280]) {
  await page.setViewportSize({width,height:750});
  for(let i=0;i<7;i++) {
   await page.locator('#opgavevalg').selectOption(String(i));
   assert.equal(await page.locator('.opgavekort>article:visible').count(),1);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Opgave ${i}: vandret rul ved ${width}`);
  }
 }
 await page.locator('#opgavevalg').selectOption('0');
 assert.match(await page.locator('#energi-svar').inputValue(),/arbejde/);
 await page.screenshot({path:join(tmpdir(),'luftpakke-opgaver.png'),fullPage:true});
 await page.locator('[data-profil="afkoeling"]').click();await mode('stige');await page.locator('#a-nulstil').click();
 await page.setViewportSize({width:1280,height:577});await page.evaluate(()=>scrollTo(0,0));
 await page.screenshot({path:join(tmpdir(),'luftpakke-start.png'),fullPage:true});
 assert.deepEqual(errors,[]);
 console.log('Rolig start, tre visninger, fælles højde, syv opgaver, otte fysiske udfald, pause, tastatur, fokus og skærmstørrelser: OK');
} finally {await browser.close();server.kill();}
