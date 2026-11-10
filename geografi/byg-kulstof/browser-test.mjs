import {chromium} from '../../værktøj/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {STEDER,PULJER,krav} from './model.js';
const ud=new URL('../../værktøj/ud/',import.meta.url);mkdirSync(ud,{recursive:true});
const puljeIndeks=id=>PULJER.findIndex(p=>p.id===id);
const puljePlads=(p,id)=>p.locator(`#pulje-figur .plads[data-i="${puljeIndeks(id)}"]`);
async function bygPuljer(p,touch=false){
 for(const {id}of PULJER){
  const kort=p.locator(`#bakke [data-ord="${id}"]`);if(!await kort.count())continue;
  if(touch){await kort.tap();await puljePlads(p,id).locator('.boks').tap();}
  else{await kort.click();await puljePlads(p,id).focus();await p.keyboard.press('Enter');}
 }
 await p.locator('#pulje-indsend').click();
 assert.match(await p.locator('#pulje-fremskridt').innerText(),/10 af 10/);
 await p.locator('#btn-naeste').click();
}
const url=`http://localhost:${process.env.PORT||8777}/geografi/byg-kulstof.html`;
const browser=await chromium.launch({headless:true});
try{
 const p=await browser.newPage({viewport:{width:1366,height:625}}),fejl=[];p.on('pageerror',e=>fejl.push(e.message));
 await p.goto(url+'#mennesker');await p.locator('#vis-opgave').waitFor();
 assert.equal(await p.locator('#kort-bar').isVisible(),false);
 await p.waitForFunction(()=>document.querySelector('#landskabsbillede')?.getAttribute('href'));
 const billedstatus=await p.evaluate(async()=>{const i=new Image();i.src=document.querySelector('#landskabsbillede').getAttribute('href');await i.decode();return [i.naturalWidth,i.naturalHeight];});
 assert.deepEqual(billedstatus,[1568,1003]);
 await p.screenshot({path:fileURLToPath(new URL('kulstof-ny-figur-1366.png',ud))});
 assert.equal(await p.locator('#bakke .ord').count(),10);
 assert.equal(await p.locator('#trin-former').isDisabled(),true);
 assert.equal(await p.locator('#pulje-figur .plads .ordtekst').allTextContents().then(a=>a.join('')),'');
 // Alle navne er til rådighed. En forkert placering returneres ved Indsend svar.
 await p.locator('#bakke [data-ord="hav"]').click();await puljePlads(p,'skov').focus();await p.keyboard.press('Enter');
 await p.locator('#pulje-indsend').click();assert.match(await p.locator('#pulje-besked').innerText(),/passer ikke/);
 assert.equal(await p.locator('#bakke .ord').count(),10);
 // Faktisk træk med mus, først som ikke indsendt, derefter låst og gemt.
 const fraPulje=await p.locator('#bakke [data-ord="hav"]').boundingBox(),tilPulje=await puljePlads(p,'hav').locator('.boks').boundingBox();
 await p.mouse.move(fraPulje.x+fraPulje.width/2,fraPulje.y+fraPulje.height/2);await p.mouse.down();await p.mouse.move(tilPulje.x+tilPulje.width/2,tilPulje.y+tilPulje.height/2,{steps:12});await p.mouse.up();
 assert.equal(await puljePlads(p,'hav').evaluate(e=>e.classList.contains('fyldt')),true);
 await p.locator('#pulje-indsend').click();assert.match(await p.locator('#pulje-fremskridt').innerText(),/1 af 10/);
 await p.reload();await p.locator('#bakke').waitFor();assert.equal(await p.locator('#bakke .ord').count(),9);
 await bygPuljer(p);await p.locator('[data-form="co2"]').waitFor();await p.evaluate(()=>document.fonts.ready);
 await p.locator('#trin-former').focus();await p.keyboard.press('ArrowLeft');await p.waitForFunction(()=>document.activeElement.id==='trin-puljer');assert.equal(await p.locator('#pulje-figur .plads.laast').count(),10);
 await p.keyboard.press('ArrowRight');assert.equal(await p.locator('#kort-bar').isVisible(),true);
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
 await p.locator('#forfra').click();assert.match(await p.locator('#pulje-fremskridt').innerText(),/0 af 10/);
 await p.locator('#pulje-hint').click();await p.locator('#pulje-hint').click();assert.match(await p.locator('#pulje-fremskridt').innerText(),/1 af 10/);
 assert.deepEqual(fejl,[]);
 // Touch har samme genbrugelige kort og store områder som musebetjening.
 const m=await browser.newPage({viewport:{width:390,height:750},hasTouch:true,isMobile:true});
 await m.goto(url);await bygPuljer(m,true);await m.locator('[data-form="organisk"]').tap();await m.locator('[data-find="skov"]').tap();await m.locator('[data-sted="skov"]').focus();await m.keyboard.press('Enter');
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
 // Første trin har samme fælles ordbakke og felter på fem skærmstørrelser.
 const v=await browser.newPage({viewport:{width:1366,height:625}});
 await v.goto(url);await v.locator('#vis-opgave').waitFor();
 for(const [w,h]of [[1280,577],[1366,625],[1536,730],[740,750],[390,750]]){
  await v.setViewportSize({width:w,height:h});assert.equal(await v.locator('#bakke .ord').count(),10);
  assert.equal(await v.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await v.screenshot({path:fileURLToPath(new URL(`kulstof-puljer-${w}.png`,ud)),fullPage:true});
 }
 await v.locator('#vis-opgave').click();
 await v.evaluate(async()=>{await document.fonts.ready;const i=new Image();i.src=document.querySelector('#landskabsbillede').getAttribute('href');await i.decode();});
 for(const [w,h]of [[1280,577],[1366,625],[1536,730],[740,750],[390,750]]){
  await v.setViewportSize({width:w,height:h});await v.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
  assert.equal(await v.locator('#kort-bar').isVisible(),false);assert.equal(await v.locator('#sted-lag').isVisible(),false);
  assert.equal(await v.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await v.screenshot({path:fileURLToPath(new URL(`kulstof-ren-figur-${w}.png`,ud))});
 }
 await v.locator('#fokus').click();await v.screenshot({path:fileURLToPath(new URL('kulstof-ren-figur-fokus.png',ud))});
 // Alfa er synlig på selve siden og følger bibliotekets eksisterende alfafilter.
 assert.match(await v.locator('.overlinje').textContent(),/Alfa/);
 const bibliotek=await browser.newPage();await bibliotek.goto(`http://localhost:${process.env.PORT||8777}/geografi.html`);
 const kort=bibliotek.locator('article:has(a[href="geografi/byg-kulstof.html"])');
 await bibliotek.locator('#alfa-knap').waitFor();assert.equal(await kort.isVisible(),false);
 await bibliotek.locator('#alfa-knap').click();assert.equal(await kort.isVisible(),true);
 assert.equal(await kort.locator('.beta-mark').count(),0);assert.equal(await kort.locator('.wip-mark').textContent(),'Alfa');
 console.log('Kulstoflandskab: fælles Byg-motor, alle puljenavne, indsendelse, lagring, puljer→former→B, tastatur, træk, fem skærmstørrelser og touch OK.');
}finally{await browser.close();}
