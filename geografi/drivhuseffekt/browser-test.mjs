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
 for(let i=0;i<5;i++){
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
assert.deepEqual(errors,[]);
await browser.close();
console.log('Browser: alle fem trin på fem skærmstørrelser, afskærmning, gassammenligning, nulstilling, forklar selv, pause, fokus, reduceret bevægelse og ingen scriptfejl OK.');
})().catch(e=>{console.error(e);process.exit(1)});
