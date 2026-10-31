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
 assert.match(await page.locator('#a-afspil').textContent(),/Løft 100 m/);
 assert.equal(await page.locator('[data-sky="fugtig"]').isVisible(),false);
 // Hver fane forklarer sit begreb over figuren, og figur og kontroller er synlige uden at rulle.
 for(const [profil,begreb] of [['stabil','Stabil luft'],['ustabil','Ustabil luft'],['betinget','Betinget stabil luft'],['inversion','Inversion'],['afkoeling','Adiabatisk afkøling:']]) {
  await page.locator(`[data-profil="${profil}"]`).click();
  assert.equal(await page.locator('#intro strong').textContent(),begreb);
  const id=profil==='afkoeling'?'#a-afspil':'#hoejde';
  await page.evaluate(()=>scrollTo(0,0));
  assert.ok(await page.locator(id).evaluate(el=>el.getBoundingClientRect().bottom<=innerHeight),`${profil}: skyder uden for skærmen`);
  assert.ok(await page.locator('#figur').evaluate(el=>el.getBoundingClientRect().bottom<=innerHeight),`${profil}: figur uden for skærmen`);
 }
 // Forklaringen kan åbnes fra start og bruger også nulhøjden korrekt.
 await page.locator('#a-hvorfor').click();
 await page.locator('#a-afspil').click();await page.locator('#a-afspil').click();
 assert.match(await page.locator('.h-scene').textContent(),/0 m.*22,0 °C.*22,0 °C/s);
 assert.match(await page.locator('.h-kontekst').textContent(),/ved jorden/);
 await page.locator('#a-afspil').click();
 assert.equal(await page.locator('#a-forstaaelse textarea').count(),2);
 await page.locator('#energi-svar').fill('Energi bruges på arbejde ved udvidelsen.');
 await page.locator('#fortaetning-svar').fill('Begge processer fortsætter samtidig.');
 await page.locator('#a-forstaaelse summary').first().click();
 assert.match(await page.locator('#a-forstaaelse details[open]').textContent(),/indre energi/);
 // Højdestigen kommer først: reglerne tændes, når de er set, og sekundært stof venter.
 assert.equal(await page.locator('.stige').isVisible(),true);
 assert.equal(await page.locator('#landskab').isVisible(),false);
 assert.equal(await page.locator('#a-hoejde').isVisible(),false);
 assert.equal(await page.locator('#a-hvorfor').isVisible(),true);
 const regel=n=>page.locator(`[data-regel="${n}"] strong`).textContent();
 assert.match(await regel('umaettet'),/Umættet luft: \? °C/);assert.match(await regel('maettet'),/Mættet luft: \? °C/);
 assert.match(await page.locator('#intro').textContent(),/luftpakke er en klump luft/);
 const raekke=async()=>(await page.locator('.stige-tabel tr.nu').textContent()).replace(/\s+/g,' ');
 const loeft=async n=>{for(let i=0;i<n;i++)await page.locator('#a-afspil').click();};
 assert.match(await page.locator('#a-titel').textContent(),/Hvor meget koldere/);
 assert.match(await page.locator('.stige-energi').textContent(),/energi bruges/);
 await loeft(1);
 assert.match(await raekke(),/100 m ?21,0 °C −1,0 ?21,0 °C −1,0/);
 assert.equal(await page.locator('[data-fald="toer"]').textContent(),'−1,0 °C');
 await loeft(2);
 assert.match(await regel('umaettet'),/1,0 °C pr\. 100 m/);assert.match(await regel('maettet'),/\?/);
 await loeft(1);
 assert.match(await raekke(),/400 m ?18,0 °C −1,0 ?18,0 °C −1,0 sky/);
 assert.match(await page.locator('#a-titel').textContent(),/fugtige pakke er blevet mættet/);
 assert.equal(await page.locator('#a-hvorfor').isVisible(),true);
 await loeft(1);
 assert.match(await raekke(),/500 m ?17,0 °C −1,0 ?17,5 °C −0,5 sky/);
 assert.equal(await page.locator('[data-fald="fugtig"]').textContent(),'−0,5 °C');
 assert.match(await regel('maettet'),/0,5 °C pr\. 100 m/);
 assert.match(await page.locator('#a-titel').textContent(),/afkøles langsommere/);
 assert.equal(await page.locator('#a-hvorfor').isVisible(),true);
 assert.equal(await page.locator('.stige-tabel tbody tr').count(),3);
 assert.ok(await page.locator('#a-begreb').evaluate(el=>el.scrollHeight<=el.clientHeight+1),'Stigen klippet');
 await page.screenshot({path:join(tmpdir(),'luftpakke-stige.png'),fullPage:true});
 // «Hvorfor» er tre trin, og højden på stigen bevares.
 await page.locator('#a-hvorfor').click();
 assert.match(await page.locator('#intro strong').textContent(),/Hvorfor bliver stigende luft koldere/);
 assert.match(await page.locator('#a-titel').textContent(),/Trin 1 af 3/);
 assert.equal(await page.locator('#a-tilbage').isVisible(),false);
 assert.match(await page.locator('.h-scene').textContent(),/1\.013 hPa/);
 await page.locator('#a-afspil').click();
 assert.match(await page.locator('#a-titel').textContent(),/Trin 2 af 3/);
 assert.match(await page.locator('.h-scene').textContent(),/22,0 °C.*−5,0 °C.*17,0 °C/s);
 await page.locator('#a-tilbage').click();
 assert.match(await page.locator('#a-titel').textContent(),/Trin 1 af 3/);
 await page.locator('#a-afspil').click();await page.locator('#a-afspil').click();
 assert.match(await page.locator('#a-titel').textContent(),/Trin 3 af 3/);
 assert.match(await page.locator('.h-scene').textContent(),/17,0 °C.*\+0,5 °C.*17,5 °C/s);
 assert.ok(await page.locator('#a-begreb').evaluate(el=>el.scrollHeight<=el.clientHeight+1),'Hvorfor klippet');
 await page.screenshot({path:join(tmpdir(),'luftpakke-hvorfor.png'),fullPage:true});
 await page.locator('#a-afspil').click();
 assert.equal(await page.locator('.stige').isVisible(),true);
 assert.match(await raekke(),/500 m/);
 // Et nyt forsøg ved 1.000 m giver samme højde og temperaturer i forklaringen.
 await loeft(5);await page.locator('#a-hvorfor').click();
 await page.locator('#a-afspil').click();await page.locator('#a-afspil').click();
 assert.match(await page.locator('.h-scene').textContent(),/1\.000 m.*12,0 °C.*\+3,0 °C.*15,0 °C/s);
 assert.match(await page.locator('.h-kontekst').textContent(),/opbygget fra 400 m til 1\.000 m/);
 await page.screenshot({path:join(tmpdir(),'luftpakke-aktuel-forklaring.png'),fullPage:true});
 for(const width of [390,640]) {
  await page.setViewportSize({width,height:750});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Energiforklaring: vandret rul ved ${width}`);
  assert.equal(await page.locator('#a-forstaaelse').isVisible(),true);
 }
 await page.setViewportSize({width:390,height:750});
 await page.screenshot({path:join(tmpdir(),'luftpakke-energi-mobil.png'),fullPage:true});
 await page.setViewportSize({width:1280,height:577});
 await page.locator('#a-afspil').click();
 assert.match(await raekke(),/1\.000 m/);
 // Ved toppen kan pakkerne sænkes igen.
 await loeft(20);
 assert.match(await page.locator('#a-afspil').textContent(),/Sænk 100 m/);
 await loeft(1);
 assert.match(await raekke(),/2\.900 m ?\S+ °C \+0,5 sky ?\S+ °C \+0,5 sky/);
 await page.locator('#a-nulstil').click();
 assert.match(await page.locator('#a-afspil').textContent(),/Løft 100 m/);
 assert.match(await regel('maettet'),/\?/);
 assert.equal(await page.locator('#a-hvorfor').isVisible(),true);
 // Temperaturkurven åbnes under arbejdsfeltet.
 await page.locator('#a-ekstra summary').click();
 await page.locator('#a-vis-graf').click();
 assert.equal(await page.locator('#landskab').isVisible(),true);
 assert.equal(await page.locator('#a-begreb').isVisible(),false);
 await page.locator('[data-aluft="fugtig"]').click();
 // Læringsfanen: løft standser ved dugpunktet og toppen, og pakken kan synke igen.
 assert.equal(await page.locator('#a-hoejde').isVisible(),true);
 assert.equal(await page.locator('#hoejde').isVisible(),false);
 for(const [luft,base,top] of [['toer',1500,'Afkølet 22,5'],['fugtig',400,'Afkølet 17,0']]) {
  await page.locator(`[data-aluft="${luft}"]`).click();
  await page.locator('#a-afspil').click();
  assert.equal(await page.locator('#a-hoejde').inputValue(),String(base));
  assert.match(await page.locator('#a-titel').textContent(),/Nu begynder fortætningen/);
  await page.locator('#a-afspil').click();
  assert.equal(await page.locator('#a-hoejde').inputValue(),'3000');
  assert.match(await page.locator('#a-maal-titel').textContent(),new RegExp(top));
  assert.match(await page.locator('#a-afspil').textContent(),/synke/);
  await page.locator('#a-afspil').click();
  assert.equal(await page.locator('#a-hoejde').inputValue(),'0');
 }
 await page.locator('#a-vis-graf').click();
 assert.equal(await page.locator('.stige').isVisible(),true);
 await page.locator('#a-ekstra summary').click();
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
 await page.locator('#a-ekstra summary').click();await page.locator('#a-vis-graf').click();
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
 // Sidste fane: åben fortolkning, kurvesammenligning og forsøg med bevarede svar.
 await page.setViewportSize({width:1280,height:577});
 assert.equal(await page.locator('.situationer button').last().textContent(),'Opgaver');
 await page.locator('#vaelg-opgaver').click();
 assert.equal(await page.locator('#simulationsfelt').isVisible(),false);
 assert.equal(await page.locator('#undersoegelser article').count(),5);
 await page.locator('#forklar-kurve').fill('Pakken mister opdrift, når temperaturerne mødes.');
 await page.locator('#tegn-2').fill('400');
 assert.match(await page.locator('#forudsigelsesgraf').getAttribute('aria-label'),/2 minutter: 400 meter/);
 await page.locator('#vis-modelkurve').click();
 assert.equal(await page.locator('#kurve-feedback').isVisible(),true);
 await page.locator('#vis-modelkurve').click();
 assert.equal(await page.locator('#kurve-feedback').isVisible(),false);
 await page.locator('[data-forsoeg="betinget"][data-fugt="toer"]').click();
 assert.equal(await page.locator('#hoejde').inputValue(),'2000');
 assert.equal(await page.locator('[data-profil="betinget"]').getAttribute('aria-pressed'),'true');
 assert.equal(await page.locator('[data-luft="toer"]').getAttribute('aria-pressed'),'true');
 await page.locator('#vaelg-opgaver').click();
 assert.match(await page.locator('#forklar-kurve').inputValue(),/mister opdrift/);
 assert.equal(await page.locator('#tegn-2').inputValue(),'400');
 await page.locator('.sparring summary').first().click();
 assert.equal(await page.locator('.sparring').first().getAttribute('open'),'');
 for(const width of [380,390,640,1280]) {
  await page.setViewportSize({width,height:750});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Opgaver: vandret rul ved ${width}`);
 }
 await page.screenshot({path:join(tmpdir(),'luftpakke-opgaver.png'),fullPage:true});
 await page.locator('[data-profil="afkoeling"]').click();
 assert.equal(await page.locator('#undersoegelser').isVisible(),false);
 assert.equal(await page.locator('#a-hoejde').isVisible(),true);
 assert.equal(await page.locator('#energi-svar').inputValue(),'Energi bruges på arbejde ved udvidelsen.');
 assert.equal(await page.locator('#fortaetning-svar').inputValue(),'Begge processer fortsætter samtidig.');
 assert.equal(await page.locator('#energi-svar').inputValue(),'Energi bruges på arbejde ved udvidelsen.');
 assert.equal(await page.locator('#fortaetning-svar').inputValue(),'Begge processer fortsætter samtidig.');
 assert.deepEqual(errors,[]);console.log('Fire atmosfærer × tør/fugtig, tvunget løft, pause, tastatur, fokus, reduceret bevægelse og mobil: OK');
} finally {await browser.close();server.kill();}
