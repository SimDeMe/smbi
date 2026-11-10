import {chromium} from '../../værktøj/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {LAG} from './model.js';
import {KULSTOFFIGUR} from './puljer.js';
const ud=new URL('../../værktøj/ud/',import.meta.url);mkdirSync(ud,{recursive:true});
const url=`http://localhost:${process.env.PORT||8777}/geografi/byg-kulstof.html`;
const indeks=id=>KULSTOFFIGUR.pladser.findIndex(p=>p.ord===id);
const felt=(p,id)=>p.locator(`#figur .plads[data-i="${indeks(id)}"]`);
async function saet(p,id,maal=id){await p.locator(`#bakke [data-ord="${id}"]`).click();await felt(p,maal).focus();await p.keyboard.press('Enter');}
const browser=await chromium.launch({headless:true});
try{
 const p=await browser.newPage({viewport:{width:1366,height:625}}),fejl=[];p.on('pageerror',e=>fejl.push(e.message));
 await p.goto(url+'#mennesker');await p.locator('#bakke .ord').first().waitFor();await p.evaluate(()=>document.fonts.ready);
 assert.equal(new URL(p.url()).hash,'#landskab');assert.equal(await p.locator('#bakke .ord').count(),10);
 assert.equal(await p.locator('#figur .kulstof-pil').count(),0);assert.equal(await p.locator('[data-form],#trin-former,[data-niveau]').count(),0);
 await saet(p,'hav','skov');await p.locator('#indsend').click();assert.match(await p.locator('#besked').innerText(),/passer ikke/);assert.equal(await p.locator('#bakke .ord').count(),10);
 // Faktisk musetræk fra den fælles ordbakke.
 const fra=await p.locator('#bakke [data-ord="hav"]').boundingBox(),til=await felt(p,'hav').locator('.boks').boundingBox();
 await p.mouse.move(fra.x+fra.width/2,fra.y+fra.height/2);await p.mouse.down();await p.mouse.move(til.x+til.width/2,til.y+til.height/2,{steps:12});await p.mouse.up();
 assert.equal(await felt(p,'hav').evaluate(e=>e.classList.contains('fyldt')),true);
 await p.locator('#indsend').click();await p.reload();await p.locator('#bakke .ord').first().waitFor();assert.equal(await p.locator('#bakke .ord').count(),9);
 for(let lag=0;lag<3;lag++){
  assert.match(await p.locator('#opg-titel').innerText(),new RegExp(`Lag ${lag+1} af 3`));
  for(const id of LAG[lag].ord)if(await p.locator(`#bakke [data-ord="${id}"]`).count())await saet(p,id);
  await p.locator('#indsend').click();assert.equal(await p.locator('#faerdig-kort').isVisible(),true);
  assert.deepEqual(await p.locator('#figur .plads').evaluateAll(gs=>gs.filter(g=>g.querySelector('.ordtekst').getBBox().width>+g.querySelector('.boks').getAttribute('width')-12).map(g=>g.textContent)),[],'Navne skal passe i felterne');
  await p.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
  await p.screenshot({path:fileURLToPath(new URL(`kulstof-lag-${lag+1}-bygget.png`,ud)),fullPage:true});
  if(lag<2){await p.locator('#btn-naeste').click();assert.equal(await p.locator('#bakke .ord').count(),LAG[lag+1].ord.length);
   assert.equal(await p.locator('#figur .plads:not(.tidligere-navn)').count(),LAG[lag+1].ord.length);
   assert.equal(await felt(p,'hav').isVisible(),false);
   await p.locator('#tidligere').check();assert.equal(await felt(p,'hav').isVisible(),true);await p.locator('#tidligere').uncheck();
   await p.reload();await p.locator('#bakke .ord').first().waitFor();
  }
 }
 assert.equal(await p.locator('#figur .kulstof-pil').count(),13);
 assert.equal(await p.locator('#btn-naeste').count(),0);assert.match(await p.locator('#faerdig-kort').innerText(),/Forklar kulstoffets vej/);
 await p.reload();await p.locator('#faerdig-kort').waitFor();assert.equal(await p.locator('#figur .plads.laast').count(),21);
 // Hvert lag på fem skærmstørrelser: kun 5 eller 6 nye procesord ad gangen.
 for(const [w,h]of [[1280,577],[1366,625],[1536,730],[740,750],[390,750]]){
  await p.setViewportSize({width:w,height:h});await p.locator('#forfra').click();
  for(let lag=0;lag<3;lag++){
   if(lag>0){await p.evaluate(({lag,loest})=>localStorage.setItem('byg-kulstof.v2',JSON.stringify({version:4,lag,loest})),{lag,loest:LAG.slice(0,lag).flatMap(l=>l.ord)});await p.reload();await p.locator('#bakke .ord').first().waitFor();}
   assert.equal(await p.locator('#bakke .ord').count(),LAG[lag].ord.length);
   assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${w}/${lag}: vandret overflow`);
   await p.screenshot({path:fileURLToPath(new URL(`kulstof-lag-${lag+1}-${w}.png`,ud)),fullPage:true});
  }
 }
 await p.locator('#fokus').click();assert.equal(await p.locator('#site-top').isVisible(),false);
 await p.locator('#forfra').click();await p.locator('#hint').click();await p.locator('#hint').click();assert.match(await p.locator('#fremskridt').innerText(),/1 af 10/);
 await p.locator('#vis-opgave').click();assert.equal(await p.locator('.side').isVisible(),false);assert.equal(await p.locator('.ren-figur').isVisible(),true);
 await p.locator('#vis-opgave').click();assert.equal(await p.locator('.side').isVisible(),true);assert.match(await p.locator('#fremskridt').innerText(),/1 af 10/);
 assert.deepEqual(fejl,[]);
 // Touch: navnekort og procesord gennem præcis samme fælles motor.
 const m=await browser.newPage({viewport:{width:390,height:750},hasTouch:true,isMobile:true});await m.goto(url);await m.locator('#bakke .ord').first().waitFor();
 await m.locator('#bakke [data-ord="hav"]').tap();await felt(m,'hav').locator('.boks').tap();await m.locator('#indsend').tap();assert.match(await m.locator('#fremskridt').innerText(),/1 af 10/);
 for(const id of LAG[0].ord.filter(id=>id!=='hav')){await m.locator(`#bakke [data-ord="${id}"]`).tap();await felt(m,id).locator('.boks').tap();}
 await m.locator('#indsend').tap();await m.locator('#btn-naeste').tap();await m.locator('#bakke [data-ord="foto"]').tap();await felt(m,'foto').locator('.boks').tap();await m.locator('#indsend').tap();assert.match(await m.locator('#fremskridt').innerText(),/1 af 5/);
 await m.screenshot({path:fileURLToPath(new URL('kulstof-processer-touch.png',ud)),fullPage:true});
 assert.match(await p.locator('.overlinje').textContent(),/Alfa/);
 console.log('Kulstofkredsløb: fælles motor, 3 lag, 5/6 procesord, pile, fejl/rigtige svar, lagring, tidligere navne, mus, tastatur, touch og fem skærmstørrelser OK.');
}finally{await browser.close();}
