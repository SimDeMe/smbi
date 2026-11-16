// Browsertest af dyrecellen i 3D. Kræver en server på port 8777:
//   python3 -m http.server 8777   (fra repoets rod)
//   node biologi/dyrecelle-3d/browser-test.mjs
// Testen opdaterer også reservebilledet forhaandsvisning.png, medmindre
// DYRECELLE_URL peger på en anden adresse.
import {chromium} from '../../værktøj/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';
const her=dirname(fileURLToPath(import.meta.url));
const rod=process.env.DYRECELLE_URL||'http://localhost:8777/biologi/dyrecelle-3d/';
const browser=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
async function side(viewport,ekstra={}){
 const page=await browser.newPage({viewport,reducedMotion:'reduce',...ekstra});
 const fejl=[];page.on('pageerror',e=>fejl.push(e.message));
 await page.route(/cloudflareinsights/,r=>r.fulfill({status:200,contentType:'text/javascript',body:''}));
 await page.goto(rod);await page.locator('body[data-grafik]').waitFor();await page.evaluate(()=>document.fonts.ready);
 return {page,fejl};
}
const {page,fejl}=await side({width:1366,height:625});
assert.equal(await page.getAttribute('body','data-grafik'),'webgl','3D skal starte');
const tilstand=()=>page.evaluate(()=>window.dyrecelle.tilstand());
let t=await tilstand();
assert.ok(t.trekanter>200000,'Modellen skal have reel geometri');
// Alle grupper har udstrækning, og organellerne ligger inde i cellen.
for(const [id,g] of Object.entries(t.grupper)){
 assert.ok(g.max[0]-g.min[0]>0.1&&g.max[1]-g.min[1]>0.1,`${id} skal have udstrækning`);
 if(!['cellemembran','cytoplasma'].includes(id)){assert.ok(g.min[0]>-5.8&&g.max[0]<5.8&&g.min[1]>-3.5&&g.max[1]<3.5,`${id} skal ligge inde i cellen`);}
}
// Figur og primære kontroller synlige uden scroll.
for(const sel of ['#celle','#organel','#aabn-kerne','#aabn-mito']){
 const b=await page.locator(sel).boundingBox();assert.ok(b&&b.y>=0&&b.y+b.height<=625,`${sel} skal være synlig på 1366×625`);
}
// Åbn og luk uafhængigt.
await page.click('#aabn-kerne');await page.waitForTimeout(100);t=await tilstand();
assert.equal(t.åbning.kerne,1);assert.equal(t.åbning.mito,0);
assert.equal(await page.getAttribute('#aabn-kerne','aria-pressed'),'true');
await page.click('#aabn-mito');await page.waitForTimeout(100);t=await tilstand();assert.equal(t.åbning.mito,1);
await page.click('#aabn-kerne');await page.waitForTimeout(100);t=await tilstand();assert.equal(t.åbning.kerne,0);assert.equal(t.åbning.mito,1);
// Synlighed pr. gruppe.
for(const el of await page.locator('[data-vis]').all()){
 const id=await el.getAttribute('data-vis');await el.uncheck();t=await tilstand();assert.equal(t.grupper[id].synlig,false,`${id} skal kunne skjules`);
 await el.check();t=await tilstand();assert.equal(t.grupper[id].synlig,true);
}
// Valg via liste, klik på figuren og etiket.
await page.selectOption('#organel','golgi');assert.match(await page.textContent('#forklaring'),/Golgi/);
assert.equal(await page.locator('.etiket.valgt').textContent(),'Golgiapparat');
const kerneEtiket=page.locator('.etiket[data-id=kerne]');await kerneEtiket.click();assert.match(await page.textContent('#overskrift'),/Cellekerne/);
const midt=await page.evaluate(()=>{const r=document.getElementById('celle').getBoundingClientRect();const a=window.dyrecelle.model.projicer(window.dyrecelle.model.ankre.kerne);return [r.left+a.x,r.top+a.y];});
await page.selectOption('#organel','hele');await page.mouse.click(midt[0],midt[1]);assert.match(await page.textContent('#overskrift'),/Cellekerne/,'Klik på kernen skal vælge den');
await page.click('#taet');t=await tilstand();assert.ok(t.kamera.afstand<10,'Se tæt på skal zoome ind');
// Navne kan slås fra.
await page.uncheck('#vis-navne');assert.ok(await page.locator('#navne.skjult').count()===1);await page.check('#vis-navne');
// Tastatur: drejning og nulstilling.
await page.focus('#celle');const før=(await tilstand()).kamera.az;await page.keyboard.press('ArrowRight');assert.notEqual((await tilstand()).kamera.az,før);
await page.keyboard.press('Home');t=await tilstand();assert.equal(t.åbning.mito,0);assert.equal(t.kamera.afstand,17.5);
// Fokusvisning skjuler header.
await page.click('#fokus');assert.equal(await page.locator('header').isVisible(),false);await page.keyboard.press('Escape');assert.equal(await page.locator('header').isVisible(),true);
assert.deepEqual(fejl,[],'Ingen sidefejl');
// Reservebillede af standardvisningen med navne.
if(!process.env.DYRECELLE_URL){await page.locator('#celle').screenshot({path:join(her,'forhaandsvisning.png')});}
await page.close();
// Mobil: ingen vandret rulning, figur og knapper til stede.
{const {page,fejl}=await side({width:390,height:750});
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=390),'Ingen vandret rulning på mobil');
 assert.ok(await page.locator('#aabn-kerne').isVisible());assert.deepEqual(fejl,[]);await page.close();}
// Fallback uden WebGL.
{const page=await browser.newPage({viewport:{width:1366,height:625}});
 await page.route(/cloudflareinsights/,r=>r.fulfill({status:200,contentType:'text/javascript',body:''}));
 await page.addInitScript(()=>{const f=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(t,...a){return /webgl/.test(t)?null:f.call(this,t,...a);};});
 await page.goto(rod);await page.locator('body[data-grafik=fallback]').waitFor();
 assert.ok(await page.locator('#fallback img').isVisible(),'Reservebilledet skal vises uden WebGL');await page.close();}
await browser.close();
console.log('Dyrecelle 3D: alle browsertest bestået.');
