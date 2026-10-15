const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const base=process.env.ATLAS_URL||'http://127.0.0.1:8777';
const out=process.env.ATLAS_TEST_UD||'/tmp/smbi-seismik-a';fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true});const errors=[];
 for(const [width,height]of [[1280,577],[1366,625],[1536,730],[390,750],[640,625]]){
  const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce',hasTouch:width===390});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/atlas/jordskaelvsboelger-a/');await page.evaluate(()=>document.fonts.ready);
  assert.equal(await page.locator('.station').count(),3);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'ingen vandret rulning');
  if(width>=900){for(const s of ['#tjek','#afspil']){const r=await page.locator(s).boundingBox();assert.ok(r.y+r.height<=height,`${s} synlig ved ${width}×${height}`);}}
  const foer=await page.locator('#ringe circle').first().getAttribute('r');
  await page.locator('#delta-0').fill('30');const efter=Number(await page.locator('#ringe circle').first().getAttribute('r'));
  assert.equal(efter,252);assert.notEqual(Number(foer),efter);
  await page.locator('#gaet-x').fill('10');await page.locator('#gaet-y').fill('10');await page.locator('#tjek').click();assert.match(await page.locator('#feedback').textContent(),/Prøv igen/);
  await page.locator('#gaet-x').fill('365');await page.locator('#gaet-y').fill('240');await page.locator('#tjek').click();assert.match(await page.locator('#feedback').textContent(),/Godt lokaliseret/);
  await page.locator('#facit').click();assert.equal(await page.locator('#markoerer circle').count(),2);
  const radii=await page.locator('#ringe circle').evaluateAll(es=>es.map(e=>Number(e.getAttribute('r'))));
  const wanted=[Math.hypot(365-120,240-130),Math.hypot(365-650,240-150),Math.hypot(365-400,240-440)];
  radii.forEach((r,i)=>assert.ok(Math.abs(r-wanted[i])<1e-6));
  await page.locator('summary').click();await page.locator('#dybde').fill('40');assert.equal(await page.locator('#dybde-tal').textContent(),'40 km');
  const dybe=await page.locator('#ringe circle').evaluateAll(es=>es.map(e=>Number(e.getAttribute('r'))));dybe.forEach((r,i)=>assert.ok(Math.abs(r-wanted[i])<1e-6));
  await page.locator('summary').click();await page.locator('#ny').click();assert.equal(await page.locator('#sag').textContent(),'SAG 02');assert.equal(await page.locator('#markoerer circle').count(),1);
  await page.locator('#tid').fill('60');assert.equal(await page.locator('#fronter circle').count(),2);
  await page.locator('#afspil').click();await page.waitForTimeout(150);const t1=Number(await page.locator('#tid').inputValue());assert.ok(t1>60);await page.locator('#afspil').click();const paused=Number(await page.locator('#tid').inputValue());await page.waitForTimeout(100);assert.equal(Number(await page.locator('#tid').inputValue()),paused,'pause fryser tiden');
  // SVG-koordinater skal også virke i kortets letterbox og ved touch.
  await page.locator('#kort').scrollIntoViewIfNeeded();
  const point=await page.locator('#kort').evaluate(e=>{const p=new DOMPoint(300,200).matrixTransform(e.getScreenCTM());return{x:p.x,y:p.y};});
  if(width===390)await page.touchscreen.tap(point.x,point.y);else await page.mouse.click(point.x,point.y);
  assert.ok(Math.abs(Number(await page.locator('#gaet-x').inputValue())-300)<=2);assert.ok(Math.abs(Number(await page.locator('#gaet-y').inputValue())-200)<=2);
  await page.locator('#forklaring').click();assert.ok(await page.locator('#om').isVisible());await page.keyboard.press('Escape');assert.ok(!await page.locator('#om').isVisible());assert.ok(await page.locator('#forklaring').evaluate(e=>e===document.activeElement));
  await page.locator('[data-rum="boelger"]').click();assert.equal(await page.locator('#boelgepause').getAttribute('aria-pressed'),'true');
  const frozen=await page.locator('#partikler').screenshot();await page.waitForTimeout(100);assert.deepEqual(frozen,await page.locator('#partikler').screenshot());
  await page.locator('[data-medium="vaeske"]').click();assert.match(await page.locator('#s-materiale').textContent(),/Ingen S/);assert.match(await page.locator('#vaesketekst').textContent(),/Ingen udbredelse/);
  const sCoords=await page.locator('#partikler circle[opacity="0.25"]').evaluateAll(es=>es.map(e=>[e.getAttribute('cx'),e.getAttribute('cy')]));
  await page.locator('#boelgepause').click();await page.waitForTimeout(200);
  assert.deepEqual(sCoords,await page.locator('#partikler circle[opacity="0.25"]').evaluateAll(es=>es.map(e=>[e.getAttribute('cx'),e.getAttribute('cy')])),'S står stille i væske');
  await page.locator('[data-medium="fast"]').click();await page.locator('#boelgepause').click();
  await page.screenshot({path:`${out}/boelger-${width}.png`,fullPage:true});
  await page.locator('#til-mission').click();await page.locator('#facit').click();await page.locator('#fokus').click();assert.equal(await page.locator('#fokus').getAttribute('aria-pressed'),'true');await page.keyboard.press('Escape');assert.equal(await page.locator('#fokus').getAttribute('aria-pressed'),'false');
  await page.screenshot({path:`${out}/kort-${width}.png`,fullPage:true});
  console.log(`${width}×${height}: layout, målinger, facit, dybde, nyt skælv, tid, pause, touch/mus, dialog, væske og fokus bestået`);await context.close();
 }
 // Atlasregister, procesindgang og søgning skal føre til den nye model.
 const page=await browser.newPage();await page.goto(base+'/atlas/');
 await page.getByRole('button',{name:'Processer',exact:true}).click();
 assert.ok(await page.getByRole('heading',{name:'Jordskælvsbølger model A',exact:true}).isVisible());
 await page.getByRole('button',{name:'Undersøg jordskælv og vulkaner',exact:true}).click();
 assert.ok(await page.getByRole('heading',{name:'Jordskælvsbølger model A',exact:true}).isVisible());
 assert.equal(await page.getByRole('link',{name:'Åbn simulation: Jordskælvsbølger model A'}).getAttribute('href'),'/atlas/jordskaelvsboelger-a/');
 assert.deepEqual(errors,[]);await browser.close();console.log('Alle browsertest bestået.');
})().catch(e=>{console.error(e);process.exit(1)});
