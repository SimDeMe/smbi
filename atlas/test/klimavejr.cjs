// Kør med NODE_PATH til Playwright-pakken og en HTTP-server på ATLAS_URL.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch();
 try {
  for(const [width,height] of [[1280,577],[1366,625],[1536,730],[390,750],[640,625]]){
   const page=await browser.newPage({viewport:{width,height}}), errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto((process.env.ATLAS_URL||'http://127.0.0.1:8879')+'/atlas/');
   await page.waitForFunction(()=>!document.querySelector('#middellag').disabled);
   async function toggle(id){
    await page.locator('#lag-aabn').click();
    if(!await page.locator('#lag-klima').evaluate(e=>e.open)) await page.locator('#lag-klima summary').click();
    await page.locator('#'+id).click();await page.locator('#lag-luk').click();
   }
   await toggle('middellag');
   await page.waitForFunction(()=>document.querySelector('#middelaflaesning').textContent.includes('°C'));
   const winter=await page.locator('#globus').evaluate(e=>e.toDataURL());
   await page.locator('#middelskyder').fill('6');
   await page.locator('#middelskyder').dispatchEvent('input');
   await page.waitForTimeout(250);
   assert.notEqual(await page.locator('#globus').evaluate(e=>e.toDataURL()),winter);
   await page.locator('#middelopgave').click();await page.waitForSelector('.klimadatatabel');
   assert.equal(await page.locator('.klimadatatabel tbody tr').count(),12);
   await page.keyboard.press('Escape');
   await page.locator('#middelspil').click();await page.waitForTimeout(2700);
   assert.equal(await page.locator('#middelskyder').inputValue(),'7');
   await toggle('nedboerlag');assert.equal(await page.locator('#middellag').getAttribute('aria-pressed'),'false');
   assert.equal(await page.locator('#middelspil').getAttribute('aria-pressed'),'false');
   await toggle('middellag');assert.equal(await page.locator('#nedboerlag').getAttribute('aria-pressed'),'false');
   await toggle('vindlag');await toggle('havstroemlag');
   const january=await page.locator('#globus').evaluate(e=>e.toDataURL());
   await page.locator('#vindmaaned').selectOption('6');await page.waitForTimeout(200);
   assert.notEqual(await page.locator('#globus').evaluate(e=>e.toDataURL()),january);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth),0);
   await page.screenshot({path:`/tmp/klimavejr-${width}.png`,fullPage:true});
   assert.deepEqual(errors,[]);console.log(`${width}×${height}: OK`);await page.close();
  }
  const p=await browser.newPage();await p.route('**/middeltemperatur.bin',r=>r.abort());
  await p.goto((process.env.ATLAS_URL||'http://127.0.0.1:8879')+'/atlas/');
  await p.waitForFunction(()=>!document.querySelector('#middellag').disabled);
  await p.locator('#lag-aabn').click();await p.locator('#lag-klima summary').click();await p.locator('#middellag').click();
  await p.waitForFunction(()=>!document.querySelector('#middellag').disabled);
  assert.equal(await p.locator('#middellag').getAttribute('aria-pressed'),'false');
  assert.match(await p.locator('#kortstatus').textContent(),/kunne ikke/);
  await p.unroute('**/middeltemperatur.bin');await p.locator('#middellag').click();
  await p.waitForFunction(()=>document.querySelector('#middellag').getAttribute('aria-pressed')==='true');
  console.log('Hentefejl og nyt forsøg: OK');await p.close();
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
