// Kør med en lokal server på port 8777. Skærmbilleder gemmes uden for repoet.
import {chromium} from '../../værktøj/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1366,height:625},reducedMotion:'reduce'});
const fejl=[];page.on('pageerror',e=>fejl.push(e.message));
mkdirSync('/tmp/celletransport-qa',{recursive:true});
await page.goto('http://localhost:8777/biologi/celletransport/');
await page.locator('canvas[data-celle-kilde="byg-cellen/fig-dyr.js"]').waitFor();
await page.evaluate(()=>document.fonts.ready);
await page.screenshot({path:'/tmp/celletransport-qa/celle.png'});
for(const [w,h] of [[1280,577],[1366,625],[1536,730],[740,750],[390,750]]){
 await page.setViewportSize({width:w,height:h});
 for(let t=0;t<6;t++){
  await page.locator(`[data-trin="${t}"]`).click();
  assert.equal(await page.locator(`[data-trin="${t}"]`).getAttribute('aria-current'),'step');
  const mål=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,bund:document.querySelector('.betjening').getBoundingClientRect().bottom,figur:document.querySelector('canvas').getBoundingClientRect().height}));
  assert.equal(mål.overflow,false,`Vandret overflow ${w}, trin ${t}`);
  if(w>=850)assert.ok(mål.bund<=h,`Knapper uden for skærmen: ${w}, ${t}, ${mål.bund}`);
  assert.ok(mål.figur>150);
  if(w>=850&&t===5){const klippet=await page.locator('#valg').evaluate(el=>{const p=el.closest('aside').getBoundingClientRect(),r=el.getBoundingClientRect();return r.bottom>p.bottom+1||r.top<p.top;});assert.equal(klippet,false,`Transportvalg klippet ved ${w}`);}
 }
}
await page.setViewportSize({width:1366,height:625});
await page.locator('[data-trin="1"]').click();for(let i=0;i<8;i++)await page.locator('#deltrin').click();
await page.screenshot({path:'/tmp/celletransport-qa/membran.png'});
for(const t of [3,4]){
 await page.locator(`[data-trin="${t}"]`).click();
 for(let i=0;i<4;i++)await page.locator('#deltrin').click();
 await page.screenshot({path:`/tmp/celletransport-qa/vesikel-${t}.png`});
 for(let i=0;i<4;i++)await page.locator('#deltrin').click();
 assert.match(await page.locator('#status').innerText(),t===3?/blevet en del/:/afsnøret/);
 await page.locator('#gentag').click();assert.match(await page.locator('#afspil').innerText(),/^Afspil$/);
}
await page.locator('[data-trin="5"]').click();
for(const form of ['diffusion','kanal','baerer','osmose','pumpe','exo','endo']){
 await page.selectOption('#transport',form);
 await page.locator('#deltrin').click();
 assert.equal(await page.locator('#energi-felt').isVisible(),['pumpe','exo','endo'].includes(form));
 if(['pumpe','exo','endo'].includes(form)){
  await page.locator('#energi').uncheck();assert.match(await page.locator('#status').innerText(),/standset/);
  await page.locator('#energi').check();assert.doesNotMatch(await page.locator('#status').innerText(),/standset/);
 }else{
  await page.selectOption('#gradient','lige');assert.match(await page.locator('#status').innerText(),/ingen nettotransport/);
  await page.selectOption('#gradient','ud');
  assert.match(await page.locator('#status').innerText(),form==='osmose'?/ind i cellen/:/ud af cellen/);
 }
 if(['kanal','baerer'].includes(form)){await page.locator('#protein').uncheck();assert.match(await page.locator('#status').innerText(),/ikke passere/);await page.locator('#protein').check();}
}
await page.selectOption('#transport','pumpe');
await page.screenshot({path:'/tmp/celletransport-qa/undersoeg.png'});
await page.locator('#fokus').click();assert.equal(await page.locator('body').evaluate(el=>el.classList.contains('fokus')),true);
await page.keyboard.press('Escape');assert.equal(await page.locator('#fokus').getAttribute('aria-pressed'),'false');
await page.locator('#afspil').focus();await page.keyboard.press('Enter');assert.equal(await page.locator('#afspil').innerText(),'Pause');await page.keyboard.press('Enter');
await page.setViewportSize({width:390,height:750});await page.locator('[data-trin="3"]').click();for(let i=0;i<4;i++)await page.locator('#deltrin').click();await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:'/tmp/celletransport-qa/mobil.png',fullPage:true});
// En igangværende animation skal faktisk ændre billedet, og pause skal fryse det.
await page.emulateMedia({reducedMotion:'no-preference'});await page.locator('[data-trin="3"]').click();
const før=await page.locator('canvas').evaluate(c=>c.toDataURL());await page.waitForTimeout(250);const efter=await page.locator('canvas').evaluate(c=>c.toDataURL());assert.notEqual(før,efter);
await page.locator('#afspil').click();const pause=await page.locator('canvas').evaluate(c=>c.toDataURL());await page.waitForTimeout(200);assert.equal(await page.locator('canvas').evaluate(c=>c.toDataURL()),pause);
assert.deepEqual(fejl,[]);await browser.close();console.log('OK: 6 trin, 7 transportformer, gradient/ATP/protein, pause, tastatur, reduceret bevægelse og 5 skærmstørrelser.');
