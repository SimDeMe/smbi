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
// Mål faktiske world-bounding boxes: organeller skal krydse snitfladen.
assert.ok(data.cellelegeme.dybde>3,'Cellelegemet skal have mærkbar volumen under snittet');
for(const [navn,b]of[['kerne',data.kerne],...data.mitokondrier.map((v,i)=>['mitokondrie '+i,v])]){
 assert.ok(b.bund<data.snithøjde&&b.top>data.snithøjde,`${navn} skal gå igennem snitfladen`);
 const andel=(data.snithøjde-b.bund)/(b.top-b.bund);assert.ok(andel>.3&&andel<.75,`${navn} skal være delvist indlejret, fundet ${andel}`);
}
const lukket=await billede();
await page.click('#kerne');await page.waitForFunction(()=>window.cellePrototype.tilstand().åbning.kerne===1);
assert.notEqual(await billede(),lukket);assert.equal((await page.evaluate(()=>window.cellePrototype.tilstand())).åbning.mito,0);
await page.click('#mito');await page.waitForFunction(()=>window.cellePrototype.tilstand().åbning.mito===1);
await page.screenshot({path:'/tmp/celle-prototype-qa/aaben.png'});
await page.click('#kerne');await page.waitForFunction(()=>window.cellePrototype.tilstand().åbning.kerne===0);
assert.equal((await page.evaluate(()=>window.cellePrototype.tilstand())).åbning.mito,1,'Snit skal kunne lukkes uafhængigt');
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
console.log('OK: rumlig indlejring, uafhængige snit, nulstil, fokus, zoom, drejning, 5 vinduesstørrelser og reservebillede uden WebGL.');
