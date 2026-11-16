import {chromium} from '../../../værktøj/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
const rod=process.env.CELLE_PROTOTYPE_URL||'http://localhost:8777/biologi/celle-3d/prototype/';
mkdirSync('/tmp/celle-prototype-qa',{recursive:true});
const browser=await chromium.launch();
const page=await browser.newPage({viewport:{width:1366,height:625},reducedMotion:'reduce'});
const fejl=[];page.on('pageerror',e=>fejl.push(e.message));
await page.route(/https:\/\/(static\.)?cloudflareinsights\.com\//,r=>r.fulfill({status:200,contentType:'text/javascript',body:''}));
await page.goto(rod);await page.locator('body[data-grafik=webgl]').waitFor();await page.evaluate(()=>document.fonts.ready);
const billede=()=>page.locator('canvas').evaluate(c=>c.toDataURL());
const data=await page.evaluate(()=>window.cellePrototype.tilstand());
// Mål faktiske world-bounding boxes: en hel celle med organellerne inde i membranen.
assert.ok(data.celle.min>3.9&&data.celle.max<5.6,`Cellen skal være en hel, bulet kugle (${data.celle.min}–${data.celle.max})`);
assert.ok(Math.hypot(...data.kerne.midte)<.4,'Cellekernen skal ligge midt i cellen');
assert.ok(data.ruER.størrelse[0]>data.kerne.størrelse[0]+1,'Ru ER skal omgive kernen');
assert.ok(data.mitokondrier.length>=10&&data.golgi.length>=3,'Der skal være mange mitokondrier og flere golgistakke');
for(const [navn,forhold]of Object.entries(data.indenfor))assert.ok(forhold<.97,`${navn} skal ligge inde i cellemembranen (${forhold.toFixed(3)})`);
const lukket=await billede();
for(const el of await page.locator('[data-vis]').all()){
 await el.uncheck();assert.notEqual(await billede(),lukket,`Skjul ${await el.getAttribute('data-vis')} skal ændre billedet`);
 await el.check();assert.equal(await billede(),lukket,'Vis skal genskabe billedet');
}
await page.locator('[data-vis="golgi"]').uncheck();await page.click('#nulstil');assert.equal(await page.locator('[data-vis="golgi"]').isChecked(),true);

await page.click('#kerne');await page.waitForFunction(()=>window.cellePrototype.tilstand().åbning.kerne===1);
assert.notEqual(await billede(),lukket);assert.equal((await page.evaluate(()=>window.cellePrototype.tilstand())).åbning.mito,0);
await page.click('#mito');await page.waitForFunction(()=>window.cellePrototype.tilstand().åbning.mito===1);
await page.screenshot({path:'/tmp/celle-prototype-qa/aaben.png'});
await page.click('#kerne');await page.waitForFunction(()=>window.cellePrototype.tilstand().åbning.kerne===0);
assert.equal((await page.evaluate(()=>window.cellePrototype.tilstand())).åbning.mito,1,'Organellerne skal kunne lukkes uafhængigt');
await page.click('#nulstil');assert.equal(await billede(),lukket,'Nulstil skal genskabe den lukkede celle');
await page.locator('canvas').focus();await page.keyboard.press('ArrowLeft');assert.notEqual(await billede(),lukket);
await page.click('#nulstil');await page.selectOption('#organel','kerne');await page.click('#taet');assert.notEqual(await billede(),lukket);
assert.match(await page.locator('#forklaring').innerText(),/kromatin/);
await page.click('#nulstil');await page.locator('#gel').fill('85');await page.locator('#gel').dispatchEvent('input');assert.notEqual(await billede(),lukket);
await page.click('#nulstil');
for(const [w,h]of[[1280,577],[1366,625],[1536,730],[740,750],[390,750]]){
 await page.setViewportSize({width:w,height:h});await page.waitForTimeout(80);
 const m=await page.evaluate(()=>({vandret:document.documentElement.scrollWidth>innerWidth,figur:document.querySelector('canvas').getBoundingClientRect().height,åbn:document.getElementById('mito').getBoundingClientRect().bottom,gel:document.getElementById('gel').getBoundingClientRect().bottom}));
 assert.equal(m.vandret,false,`Vandret overflow ${w}`);assert.ok(m.figur>=350);
 if(w>800){assert.ok(m.åbn<h,`Åbningsknapper udenfor skærm ${w}`);assert.ok(m.gel<h,`Gennemsigtighed udenfor skærm ${w}`);}
 if(w===390)await page.screenshot({path:'/tmp/celle-prototype-qa/mobil.png',fullPage:true});
}
await page.setViewportSize({width:1366,height:625});await page.click('#fokus');assert.equal(await page.locator('#slut-fokus').isVisible(),true);await page.click('#slut-fokus');assert.equal(await page.locator('body').evaluate(b=>b.classList.contains('fokus')),false);
await page.click('#fokus');await page.keyboard.press('Escape');assert.equal(await page.locator('#fokus').getAttribute('aria-pressed'),'false');
const r=await page.locator('canvas').boundingBox();const førTræk=await billede();await page.mouse.move(r.x+r.width*.4,r.y+r.height*.5);await page.mouse.down();await page.mouse.move(r.x+r.width*.5,r.y+r.height*.54,{steps:5});await page.mouse.up();assert.notEqual(await billede(),førTræk);
await page.click('#nulstil');
// Gem en reel rendering som reservebillede (kun lokalt, ikke under livekontrol).
if(!process.env.CELLE_PROTOTYPE_URL){await page.setViewportSize({width:1440,height:850});await page.waitForTimeout(100);await page.locator('canvas').screenshot({path:new URL('forhaandsvisning.png',import.meta.url).pathname});}
assert.deepEqual(fejl,[]);await browser.close();
const uden=await chromium.launch({args:['--disable-webgl']});const p=await uden.newPage();await p.goto(rod);await p.locator('body[data-grafik=fallback]').waitFor();assert.equal(await p.locator('#fallback').isVisible(),true);await p.waitForFunction(()=>document.querySelector('#fallback img').naturalWidth>0);assert.equal(await p.locator('#kerne').isDisabled(),true);await uden.close();
console.log('OK: hel celle med organeller indeni, uafhængig åbning, nulstil, fokus, zoom, drejning, 5 vinduesstørrelser og reservebillede uden WebGL.');
