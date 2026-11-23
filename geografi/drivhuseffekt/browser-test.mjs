// Bruger den eksisterende Playwright-installation fra repoets pladstjek.
import { chromium } from '../../værktøj/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';
const billeder = new URL('../../værktøj/ud/', import.meta.url);
mkdirSync(billeder, { recursive: true });
(async()=>{
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1280,height:577}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto(`http://localhost:${process.env.PORT || 8777}/geografi/drivhuseffekt/`);
await page.evaluate(()=>document.fonts.ready);
for(const [w,h] of [[1280,577],[1366,625],[1536,730],[740,750],[390,750]]){
 await page.setViewportSize({width:w,height:h});
 for(let i=0;i<6;i++){
  await page.locator(`[data-trin="${i}"]`).click();
  await page.waitForTimeout(90);
  const m=await page.evaluate(()=>{
   const r=document.querySelector('.scene').getBoundingClientRect();
   const k=document.querySelector('.betjening').getBoundingClientRect();
   return {top:r.top,bottom:k.bottom,overflow:document.documentElement.scrollWidth>innerWidth};
  });
  assert.equal(m.overflow,false,`overflow ${w} step ${i}`);
  if(w>=760)assert.ok(m.bottom<=h+1,`controls below screen ${w} step ${i}: ${m.bottom}`);
 }
}
await page.setViewportSize({width:1366,height:625});
await page.locator('[data-trin="5"]').click();
assert.equal(await page.locator('#klima-valg').isVisible(),true);
assert.equal(await page.locator('[data-klima="2"]').getAttribute('aria-pressed'),'true');
assert.equal(await page.locator('#molekyler > g:visible').count(),5);
assert.match(await page.locator('#temperatur-note').innerText(),/valgt forstærket eksempel/);
for(const [k,n] of [[0,0],[1,3],[2,5]]) {
 await page.locator(`[data-klima="${k}"]`).click();
 assert.equal(await page.locator(`[data-klima="${k}"]`).getAttribute('aria-pressed'),'true');
 assert.equal(await page.locator('#molekyler > g:visible').count(),n);
 assert.equal(await page.locator('#mod-proces').isVisible(),k!==0);
}
await page.locator('[data-trin="5"]').click();
await page.waitForTimeout(1400);
await page.evaluate(()=>scrollTo(0,0));
await page.screenshot({path:fileURLToPath(new URL('drivhuseffekt-forstaerket.png',billeder))});

await page.locator('[data-trin="1"]').click();
await page.locator('#sol-knap').focus();
await page.keyboard.press('Enter');
assert.equal(await page.locator('#sol-knap').getAttribute('aria-pressed'),'true');
assert.match(await page.locator('#observation').innerText(),/stråler stadig/);
assert.equal(await page.locator('#solskaerm').getAttribute('opacity'),'1');
await page.locator('#nulstil').click();
assert.equal(await page.locator('#sol-knap').getAttribute('aria-pressed'),'false');
await page.locator('[data-trin="4"]').click();
await page.waitForTimeout(1600);
await page.evaluate(()=>scrollTo(0,0));
await page.screenshot({path:fileURLToPath(new URL('drivhuseffekt-slut.png',billeder))});
await page.locator('#gas-knap').click();
assert.equal(await page.locator('#molekyler').getAttribute('opacity'),'0');
assert.equal(await page.locator('#mod-proces').isVisible(),false);
await page.locator('#gas-knap').click();
await page.locator('#forklar-knap').click();
assert.equal(await page.locator('#mod-proces').isVisible(),false);
await page.locator('#forklar-knap').click();
const iBevaegelse=await page.locator('canvas').evaluate(c=>c.toDataURL());
await page.waitForTimeout(150);
assert.notEqual(await page.locator('canvas').evaluate(c=>c.toDataURL()),iBevaegelse);
await page.locator('#pause').click();
const canvas=await page.locator('canvas').evaluate(c=>c.toDataURL());
await page.waitForTimeout(200);
assert.equal(await page.locator('canvas').evaluate(c=>c.toDataURL()),canvas);
await page.locator('#fokus').click();
assert.equal(await page.locator('body').evaluate(b=>b.classList.contains('fokus')),true);
await page.keyboard.press('Escape');
assert.equal(await page.locator('body').evaluate(b=>b.classList.contains('fokus')),false);
await page.emulateMedia({reducedMotion:'reduce'});
await page.reload();
assert.equal(await page.locator('#pause').getAttribute('aria-pressed'),'true');
assert.ok((await page.locator('canvas').evaluate(c=>c.toDataURL())).length>1000);
await page.locator('[data-trin="3"]').click();
assert.equal(await page.locator('#mod-proces').isVisible(),true);
await page.setViewportSize({width:390,height:750});
await page.screenshot({path:fileURLToPath(new URL('drivhuseffekt-mobil.png',billeder)),fullPage:true});
// Opgaverne: multiple choice, peg på figuren, byg kæden og resultat.
await page.emulateMedia({reducedMotion:'no-preference'});
await page.setViewportSize({width:1280,height:577});
await page.reload();
await page.locator('[data-trin="5"]').click();
await page.locator('#naeste').click();
assert.match(await page.locator('#opg-nr').innerText(),/OPGAVE 1 AF 13/);
assert.equal(await page.locator('#mod-proces').isVisible(),false,'etiketter skjult under svar');
await page.locator('#opg-valg > button').nth(1).click();
assert.equal(await page.locator('#opg-valg > button.forkert').count(),1);
assert.equal(await page.locator('#opg-valg > button.rigtig').count(),1);
assert.match(await page.locator('#opg-svar').innerText(),/Ikke rigtigt/);
assert.equal(await page.locator('#mod-proces').isVisible(),true,'etiketter vises efter svar');
const knap=await page.locator('#opg-naeste').boundingBox();
assert.ok(knap.y+knap.height<=577,'næste-knap synlig på 1280×577');
const peg=async(vx,vy)=>{const r=await page.locator('.landskab').boundingBox();await page.mouse.click(r.x+vx/1200*r.width,r.y+vy/500*r.height);};
await page.locator('#opg-naeste').click();
await peg(300,232);                       // på en solstråle
assert.equal(await page.locator('.opg-maerke.rigtig').count(),1);
assert.match(await page.locator('#opg-svar').innerText(),/Rigtigt/);
await page.locator('#opg-naeste').click();
await peg(330,60);                        // tom luft – forkert
assert.equal(await page.locator('.opg-maerke.forkert').count(),1);
assert.ok(await page.locator('#opg-fremhaev path').count()>0,'rigtigt svar markeres');
assert.match(await page.locator('#opg-svar').innerText(),/tomt sted i luften/);
// Resten: tastaturet for pegeopgaver, første valgmulighed for resten.
for(let i=3;i<12;i++){
  await page.locator('#opg-naeste').click();
  if(await page.locator('.opg-punkt').count()){await page.locator('.opg-punkt').first().focus();await page.keyboard.press('Enter');}
  else await page.locator('#opg-valg > button').first().click();
  assert.equal(await page.locator('#opg-naeste').isVisible(),true,`opgave ${i+1} besvaret`);
}
await page.locator('#opg-naeste').click();
assert.match(await page.locator('#opg-nr').innerText(),/BYG KÆDEN/);
assert.equal(await page.locator('.scene').isVisible(),false);
const led=['Solen udsender kortbølget stråling','Solstrålingen absorberes ved jordoverfladen, som bliver varm','Den varme jordoverflade udsender langbølget varmestråling','Drivhusgasser absorberer noget af varmestrålingen, og luften bliver varm','Den varme atmosfære udsender varmestråling i alle retninger','Modstrålingen absorberes ved jordoverfladen, som bliver varmere'];
// Første led trækkes, resten placeres med klik.
const kort=page.locator(`.kaede-bunke .kaede-kort[data-tekst="${led[0]}"]`);
const fra=await kort.boundingBox(), til=await page.locator('.kaede-felt').first().boundingBox();
await page.mouse.move(fra.x+20,fra.y+10);await page.mouse.down();
await page.mouse.move(til.x+30,til.y+20,{steps:8});await page.mouse.up();
assert.equal(await page.locator('.kaede-felt').first().getAttribute('class'),'kaede-felt fyldt');
for(let i=1;i<6;i++){
  await page.locator(`.kaede-bunke .kaede-kort[data-tekst="${led[i]}"]`).click();
  await page.locator('.kaede-felt').nth(i).locator('.kaede-tom').click();
}
await page.setViewportSize({width:390,height:750});
await page.screenshot({path:fileURLToPath(new URL('drivhuseffekt-kaede-mobil.png',billeder)),fullPage:true});
await page.setViewportSize({width:1280,height:577});
await page.locator('.kaede-tjek').click();
assert.equal(await page.locator('.kaede-felt.rigtig').count(),6);
assert.match(await page.locator('#opg-svar').innerText(),/Rigtigt/);
await page.locator('#opg-naeste').click();
assert.match(await page.locator('#opg-spm').innerText(),/Du fik \d+ af 13 rigtige/);
await page.locator('[data-igen]').click();
assert.match(await page.locator('#opg-nr').innerText(),/OPGAVE 1 AF 13/);
await page.locator('[data-trin="0"]').click();
assert.equal(await page.locator('#opgaver').isVisible(),false);
assert.equal(await page.locator('.forklaring').isVisible(),true);
assert.deepEqual(errors,[]);
await browser.close();
console.log('Browser: alle seks trin på fem skærmstørrelser, afskærmning, gassammenligning, nulstilling, forklar selv, pause, fokus, reduceret bevægelse, opgaver (valg, peg, byg kæden) og ingen scriptfejl OK.');
})().catch(e=>{console.error(e);process.exit(1)});
