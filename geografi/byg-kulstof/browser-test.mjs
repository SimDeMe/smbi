// Funktionerne testes også med byg-motor/selvtest.mjs. Her kontrolleres
// figurernes forbindelser, læsbarhed, skærmstørrelser og touch.
import { chromium } from '../../værktøj/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const ud = new URL('../../værktøj/ud/',import.meta.url);mkdirSync(ud,{recursive:true});
const url=`http://localhost:${process.env.PORT||8777}/geografi/byg-kulstof.html`;
const browser=await chromium.launch({headless:true});
try {
  const page=await browser.newPage({viewport:{width:1366,height:625}}),fejl=[];
  page.on('pageerror',e=>fejl.push(e.message));
  await page.goto(url);await page.waitForFunction(()=>window.bygFiguren);await page.evaluate(()=>document.fonts.ready);
  await page.emulateMedia({reducedMotion:'reduce'});
  for(const id of ['hurtig','geologi','mennesker']) {
    await page.locator(`#fane-${id}`).click();
    await page.locator('#svaer').check();
    // Motorens komplette visning bruges til at kontrollere alle forbindelser.
    await page.evaluate(()=>{const m=window.bygFiguren.aktiv();m.fig.pladser.forEach((p,i)=>m.paa.set(i,p.ord));m.indsend();});
    const maal=await page.evaluate(()=>{
      const m=window.bygFiguren.aktiv(), svg=document.querySelector('#figur');
      return m.fig.pladser.map((p,i)=>{
        const tekst=svg.querySelector(`.plads[data-i="${i}"] .ordtekst`),boks=svg.querySelector(`.plads[data-i="${i}"] .boks`);
        const bredde=tekst.getComputedTextLength(), plads=+boks.getAttribute('width');
        const path=svg.querySelector(`.del[data-ord="${p.ord}"] path[marker-end]`);
        let afstand=0;
        if(path&&p.maal){afstand=Infinity;const L=path.getTotalLength();for(let s=0;s<=L;s+=2){const q=path.getPointAtLength(s);afstand=Math.min(afstand,Math.hypot(q.x-p.maal[0],q.y-p.maal[1]));}}
        return {ord:p.ord,bredde,plads,afstand};
      });
    });
    for(const p of maal){assert(p.bredde<=p.plads-18,`${id}/${p.ord}: ordet går uden for pladsen (${p.bredde})`);assert(p.afstand<=20,`${id}/${p.ord}: prikken rammer ikke pilen (${p.afstand})`);}
    await page.evaluate(()=>document.querySelector('#byg').scrollIntoView({block:'start',behavior:'instant'}));
    await page.screenshot({path:fileURLToPath(new URL(`byg-kulstof-${id}-faerdig.png`,ud))});
    await page.locator('#svaer').uncheck();
    await page.locator('#btn-forfra').click();
    for(const [w,h] of [[1280,577],[1366,625],[1536,730],[740,750],[390,750]]){
      await page.setViewportSize({width:w,height:h});await page.waitForTimeout(70);
      const t=await page.evaluate(()=>{
        const fig=document.querySelector('#figur').getBoundingClientRect(), k=document.querySelector('#btn-indsend').getBoundingClientRect();
        return {overflow:document.documentElement.scrollWidth>innerWidth,span:Math.max(fig.bottom,k.bottom)-Math.min(fig.top,k.top)};
      });
      assert(!t.overflow,`${id}/${w}: siden ruller vandret`);
      if(w>=861)assert(t.span<=h-50,`${id}/${w}: figur og svarknap kan ikke ses samtidigt (${t.span})`);
      await page.evaluate(()=>document.querySelector('#byg').scrollIntoView({block:'start',behavior:'instant'}));
      await page.screenshot({path:fileURLToPath(new URL(`byg-kulstof-${id}-${w}.png`,ud))});
    }
    await page.setViewportSize({width:1366,height:625});
  }
  const mobile=await browser.newPage({viewport:{width:390,height:750},hasTouch:true,isMobile:true});
  await mobile.goto(url);await mobile.waitForFunction(()=>window.bygFiguren);
  // En plads kan rulles frem på touch uden at siden selv bliver bredere.
  await mobile.locator('[data-ord="atmosfaere"].ord').tap();
  const i=await mobile.evaluate(()=>window.bygFiguren.aktiv().fig.pladser.findIndex(p=>p.ord==='atmosfaere'));
  await mobile.locator(`#figur .plads[data-i="${i}"] .boks`).tap();
  await mobile.locator('#btn-indsend').tap();
  assert.equal(await mobile.locator('#figur .plads.laast').count(),1);
  assert.deepEqual(fejl,[]);
  console.log('Kulstof: pile og prikker, fagordenes bredde, tre faner, fem skærmstørrelser og touch OK.');
}finally{await browser.close();}
