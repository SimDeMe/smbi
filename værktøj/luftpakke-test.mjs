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
 const page=await browser.newPage({viewport:{width:1280,height:577}}), errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8782/geografi/luftmasser/');
 await page.emulateMedia({reducedMotion:'reduce'});
 // Hver fane forklarer sit begreb over figuren, og figur og kontroller er synlige uden at rulle.
 for(const [profil,begreb] of [['stabil','Stabil luft'],['ustabil','Ustabil luft'],['betinget','Betinget stabil luft'],['inversion','Inversion'],['afkoeling','Adiabatisk afkøling']]) {
  await page.locator(`[data-profil="${profil}"]`).click();
  assert.equal(await page.locator('#intro strong').textContent(),begreb);
  const id=profil==='afkoeling'?'#a-hoejde':'#hoejde';
  await page.evaluate(()=>scrollTo(0,0));
  assert.ok(await page.locator(id).evaluate(el=>el.getBoundingClientRect().bottom<=innerHeight),`${profil}: skyder uden for skærmen`);
  assert.ok(await page.locator('#figur').evaluate(el=>el.getBoundingClientRect().bottom<=innerHeight),`${profil}: figur uden for skærmen`);
 }
 // Læringsfanen: løft standser ved dugpunktet og toppen, og pakken kan synke igen.
 assert.equal(await page.locator('#a-hoejde').isVisible(),true);
 assert.equal(await page.locator('#hoejde').isVisible(),false);
 for(const [luft,base,top] of [['toer',1500,'Afkølet 22,5'],['fugtig',400,'Afkølet 17,0']]) {
  await page.locator(`[data-aluft="${luft}"]`).click();
  await page.locator('#a-afspil').click();
  assert.equal(await page.locator('#a-hoejde').inputValue(),String(base));
  assert.match(await page.locator('#a-titel').textContent(),/Dugpunktet er nået/);
  await page.locator('#a-afspil').click();
  assert.equal(await page.locator('#a-hoejde').inputValue(),'3000');
  assert.match(await page.locator('#a-maal-titel').textContent(),new RegExp(top));
  assert.match(await page.locator('#a-afspil').textContent(),/synke/);
  await page.locator('#a-afspil').click();
  assert.equal(await page.locator('#a-hoejde').inputValue(),'0');
 }
 // Opgaverne: rigtigt og forkert svar, komma som decimaltegn.
 await page.locator('#svar-0').fill('14,0');await page.locator('#svar-0').press('Enter');
 assert.match(await page.locator('#svar-tekst-0').textContent(),/^Rigtigt/);
 await page.locator('#svar-1').fill('6');await page.locator('#svar-1').press('Enter');
 assert.match(await page.locator('#svar-tekst-1').textContent(),/^Ikke helt/);
 for(const [profil,[toer,fugtig]] of Object.entries(FORVENTET)) {
  await page.locator(`[data-profil="${profil}"]`).click();
  for(const [luft,maal] of [['toer',toer],['fugtig',fugtig]]) {
   await page.locator(`[data-luft="${luft}"]`).click();
   assert.equal(await page.locator('#hoejde').inputValue(),'0');
   const z=await koer(page);
   assert.ok(Math.abs(z-maal)<=15,`${profil}/${luft}: ${z} ≠ ${maal}`);
   assert.match(await page.locator('#opdrift-titel').textContent(),maal===3000?/Stadig varmere/:/Stopper ved/);
  }
 }
 // Tvunget løft forbi 2.750 m: den tørre pakke får opdrift i betinget luft.
 await page.locator('[data-profil="betinget"]').click();
 await page.locator('[data-luft="toer"]').click();
 await page.locator('#hoejde').fill('2800');
 assert.match(await page.locator('#afspil').textContent(),/Slip pakken her/);
 assert.equal(await koer(page),3000);
 assert.ok(await page.locator('#afspil').evaluate(el=>el.getBoundingClientRect().bottom<=innerHeight));
 assert.ok(await page.locator('#hoejde').evaluate(el=>el.getBoundingClientRect().bottom<=innerHeight));
 await page.screenshot({path:join(tmpdir(),'luftpakke-fri.png'),fullPage:true});
 await page.emulateMedia({reducedMotion:'no-preference'});
 // Animeret løft i læringsfanen standser ved dugpunktet (den fugtige pakke: 400 m).
 await page.locator('[data-profil="afkoeling"]').click();
 await page.locator('#a-afspil').click();await page.waitForTimeout(2200);
 assert.equal(await page.locator('#a-hoejde').inputValue(),'400');
 assert.match(await page.locator('#a-afspil').textContent(),/Løft videre/);
 await page.locator('[data-profil="ustabil"]').click();
 await page.locator('#afspil').click();await page.waitForTimeout(1600);
 await page.locator('#afspil').click();
 const z=await page.locator('#hoejde').inputValue();assert.ok(+z>0 && +z<3000);
 await page.waitForTimeout(150);assert.equal(await page.locator('#hoejde').inputValue(),z);
 await page.locator('#fokus').click();await page.keyboard.press('Escape');
 assert.equal(await page.locator('#fokus').getAttribute('aria-pressed'),'false');
 await page.locator('#hoejde').focus();await page.keyboard.press('ArrowRight');
 assert.ok(+(await page.locator('#hoejde').inputValue())>+z);
 for(const width of [380,390,640]) {
  await page.setViewportSize({width,height:750});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 }
 assert.deepEqual(errors,[]);console.log('Fire atmosfærer × tør/fugtig, tvunget løft, pause, tastatur, fokus, reduceret bevægelse og mobil: OK');
} finally {await browser.close();server.kill();}
