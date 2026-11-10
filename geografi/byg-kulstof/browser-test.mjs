import {chromium} from '../../værktøj/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {STEDER,krav} from './model.js';
const ud=new URL('../../værktøj/ud/',import.meta.url);mkdirSync(ud,{recursive:true});
const url=`http://localhost:${process.env.PORT||8777}/geografi/byg-kulstof.html`;
const browser=await chromium.launch({headless:true});
try{
 const p=await browser.newPage({viewport:{width:1366,height:625}}),fejl=[];p.on('pageerror',e=>fejl.push(e.message));
 await p.goto(url+'#mennesker');await p.locator('[data-form="co2"]').waitFor();await p.evaluate(()=>document.fonts.ready);
 await p.screenshot({path:fileURLToPath(new URL('kulstof-landskab-start.png',ud))});
 assert.equal(new URL(p.url()).hash,'#landskab');
 assert.equal(await p.locator('.form-kort').count(),3);assert.equal(await p.locator('[data-sted="flod"]').isVisible(),false);
 const maerke=async id=>p.evaluate(id=>{
  const g=document.querySelector(`[data-sted="${id}"]`),r=g.querySelector('.navnefelt').getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2};
 },id);
 const placerKlik=async(id,form)=>{
  await p.locator(`[data-form="${form}"]`).click();await p.locator(`[data-find="${id}"]`).click();
  await p.locator(`[data-sted="${id}"]`).focus();await p.keyboard.press('Enter');
 };
 // Træk samme CO2-kort to gange til hver sin modtager.
 for(const id of ['luft','hav']){
  await p.locator(`[data-find="${id}"]`).click();
  const fra=await p.locator('[data-form="co2"]').boundingBox(),til=await maerke(id);
  await p.mouse.move(fra.x+fra.width/2,fra.y+fra.height/2);await p.mouse.down();await p.mouse.move(til.x,til.y,{steps:12});await p.mouse.up();
  assert.match(await p.locator('#besked').innerText(),/Korrekt/);
 }
 assert.match(await p.locator('#fremskridt').innerText(),/2 af 12/);
 await placerKlik('skov','co2');assert.match(await p.locator('#besked').innerText(),/organisk/);assert.match(await p.locator('#fremskridt').innerText(),/2 af 12/);
 for(const s of STEDER.filter(s=>!['luft','hav'].includes(s.id)))for(const f of krav(s,'C'))await placerKlik(s.id,f);
 assert.match(await p.locator('#fremskridt').innerText(),/12 af 12/);assert.equal(await p.locator('.form-kort').count(),3);
 await p.locator('#fortsaet-b').click();assert.match(await p.locator('#fremskridt').innerText(),/12 af 15/);assert.equal(await p.locator('.form-kort').count(),5);
 await placerKlik('hav','hco3');await placerKlik('flod','hco3');await placerKlik('hav','co3');
 assert.match(await p.locator('#fremskridt').innerText(),/15 af 15/);
 await p.screenshot({path:fileURLToPath(new URL('kulstof-landskab-B-hele.png',ud)),fullPage:true});
 await p.locator('[data-niveau="C"]').click();assert.match(await p.locator('#fremskridt').innerText(),/12 af 12/);assert.equal(await p.locator('[data-form="hco3"]').count(),0);
 await p.locator('[data-niveau="B"]').click();await p.reload();await p.locator('[data-form="hco3"]').waitFor();assert.match(await p.locator('#fremskridt').innerText(),/15 af 15/);
 await p.locator('#vis-processer').check();await p.locator('#proces-valg').selectOption('forvitring');assert.match(await p.locator('#proces-tekst').innerText(),/HCO₃/);
 await p.locator('[data-niveau="C"]').click();assert(!/HCO₃|hydrogenkarbonat|CO₃²/.test(await p.locator('#proces-tekst').innerText()));
 await p.locator('#vis-processer').uncheck();
 // Samme landskab i begge niveauer; kontroller, skærme og fokus.
 for(const [w,h]of [[1280,577],[1366,625],[1536,730],[740,750],[390,750]]){
  await p.setViewportSize({width:w,height:h});
  for(const n of ['C','B']){
   await p.locator(`[data-niveau="${n}"]`).click();await p.evaluate(()=>document.querySelector('#byg').scrollIntoView({block:'start',behavior:'instant'}));
   assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${w}/${n}: vandret side-overflow`);
   await p.screenshot({path:fileURLToPath(new URL(`kulstof-landskab-${n}-${w}.png`,ud))});
  }
 }
 await p.locator('#fokus').click();assert.equal(await p.locator('#site-top').isVisible(),false);
 await p.locator('#zoom').click();assert.equal(await p.locator('#landskabsrum').evaluate(e=>e.classList.contains('overblik')),true);
 await p.locator('#forfra').click();assert.match(await p.locator('#fremskridt').innerText(),/0 af 15/);
 await p.locator('#hint').click();await p.locator('#hint').click();assert.match(await p.locator('#fremskridt').innerText(),/1 af 15/);
 assert.deepEqual(fejl,[]);
 // Touch har samme genbrugelige kort og store områder som musebetjening.
 const m=await browser.newPage({viewport:{width:390,height:750},hasTouch:true,isMobile:true});
 await m.goto(url);await m.locator('[data-form="organisk"]').tap();await m.locator('[data-find="skov"]').tap();await m.locator('[data-sted="skov"]').focus();await m.keyboard.press('Enter');
 assert.match(await m.locator('#fremskridt').innerText(),/1 af 12/);
 // Ren touch: klik på det synlige element efter valg af kortet.
 await m.locator('[data-form="organisk"]').tap();await m.locator('[data-find="jord"]').tap();
 const punkt=await m.locator('[data-sted="jord"] .navnefelt').boundingBox();await m.touchscreen.tap(punkt.x+punkt.width/2,punkt.y+punkt.height/2);
 assert.match(await m.locator('#fremskridt').innerText(),/2 af 12/);
 // Et reelt touchtræk skal kunne genbruge det samme kort på endnu et sted.
 await m.locator('[data-find="kul"]').tap();
 const fra=await m.locator('[data-form="organisk"]').boundingBox(),til=await m.locator('[data-sted="kul"] .navnefelt').boundingBox();
 const cdp=await m.context().newCDPSession(m),x=fra.x+fra.width/2,y=fra.y+fra.height/2,tx=til.x+til.width/2,ty=til.y+til.height/2;
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
 for(let i=1;i<=12;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+(tx-x)*i/12,y:y+(ty-y)*i/12}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 assert.match(await m.locator('#fremskridt').innerText(),/3 af 12/);
 await m.screenshot({path:fileURLToPath(new URL('kulstof-landskab-touch.png',ud))});
 console.log('Kulstoflandskab: rigtige/forkerte svar, genbrugt træk, C→B, lagring, tastatur, processer, fem skærmstørrelser og touch OK.');
}finally{await browser.close();}
