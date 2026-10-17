// Run with Playwright on NODE_PATH, and a local HTTP server already running.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const base=process.env.ATLAS_URL||'http://127.0.0.1:8777';
const output=process.env.ATLAS_TEST_UD||'/tmp/smbi-cirkulation-test';
require('node:fs').mkdirSync(output,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true});
 const errors=[];
 for(const [width,height] of [[1280,577],[1366,625],[1536,730],[390,750],[640,625]]){
  const context=await browser.newContext({viewport:{width,height},hasTouch:width===390,isMobile:width===390,reducedMotion:'reduce'});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/atlas/cirkulation/');
  await page.waitForFunction(()=>document.querySelector('#load-status').hidden);
  await page.evaluate(()=>document.fonts.ready);
  assert.equal(await page.locator('#pause').getAttribute('aria-pressed'),'true','reduced motion starts paused');
  const layout=await page.evaluate(()=>({width:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight}));
  assert.ok(layout.width<=width,`no horizontal overflow at ${width}`);
  if(width>=900){assert.ok(layout.height<=height,`no desktop scroll at ${width}`);assert.ok(await page.evaluate(()=>document.querySelector('.earth-view').getBoundingClientRect().bottom<=document.querySelector('.controls').getBoundingClientRect().top),'figure does not overlap controls');}
  const before=await page.locator('#globus').screenshot();
  await page.locator('#labels').click();const without=await page.locator('#globus').screenshot();assert.notDeepEqual(before,without,'labels visibly toggle');
  await page.locator('#labels').click();
  await page.locator('[data-month="1"]').click();assert.equal(await page.locator('#month-name').textContent(),'Januar');
  const jan=await page.locator('#globus').screenshot();await page.locator('[data-month="7"]').click();assert.notDeepEqual(jan,await page.locator('#globus').screenshot(),'seasons visibly change ITK');
  const six=await page.locator('#snit').screenshot();await page.locator('#rotation').click();assert.equal(await page.locator('#rotation').getAttribute('aria-pressed'),'false');assert.notDeepEqual(six,await page.locator('#snit').screenshot(),'stopped Earth shows different cells');await page.locator('#rotation').click();
  await page.locator('#continents').click();assert.equal(await page.locator('#continents').getAttribute('aria-pressed'),'false');await page.locator('#continents').click();
  await page.locator('#globus').focus();const turned=await page.locator('#globus').screenshot();await page.keyboard.press('ArrowRight');assert.notDeepEqual(turned,await page.locator('#globus').screenshot(),'keyboard turns globe');
  await page.keyboard.press('Enter');assert.match(await page.locator('#notice').textContent(),/Ballonen er sluppet/);
  await page.locator('#reset').click();
  await page.locator('#balloon').click();assert.equal(await page.locator('#balloon').getAttribute('aria-pressed'),'true');
  await page.locator('#globus').scrollIntoViewIfNeeded();
  const rect=await page.locator('#globus').boundingBox();
  if(width===390)await page.touchscreen.tap(rect.x+rect.width/2,rect.y+rect.height/2);else await page.mouse.click(rect.x+rect.width/2,rect.y+rect.height/2);
  assert.match(await page.locator('#notice').textContent(),/Ballonen er sluppet/);
  // Pointer dragging, including touch, rotates the actual rendered geography.
  const dragBefore=await page.locator('#globus').screenshot();
  if(width===390){const cdp=await context.newCDPSession(page);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:rect.x+rect.width/2,y:rect.y+rect.height/2}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:rect.x+rect.width/2+50,y:rect.y+rect.height/2}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
  else{await page.mouse.move(rect.x+rect.width/2,rect.y+rect.height/2);await page.mouse.down();await page.mouse.move(rect.x+rect.width/2+50,rect.y+rect.height/2,{steps:5});await page.mouse.up();}
  assert.notDeepEqual(dragBefore,await page.locator('#globus').screenshot(),'pointer drag rotates globe');
  await page.locator('#help').click();assert.ok(await page.locator('#guide').isVisible());await page.keyboard.press('Escape');assert.ok(!await page.locator('#guide').isVisible());assert.ok(await page.locator('#help').evaluate(el=>el===document.activeElement),'dialog returns focus');
  await page.locator('#mumbai').click();assert.match(await page.locator('#story-title').textContent(),/Monsun/);assert.match(await page.locator('#notice').textContent(),/sydvestmonsun/);
  await page.locator('[data-month="1"]').click();await page.locator('#mumbai').click();assert.match(await page.locator('#notice').textContent(),/nordøstmonsun/);
  await page.locator('#pause').click();assert.equal(await page.locator('#pause').getAttribute('aria-pressed'),'false');await page.waitForTimeout(150);const moving=await page.locator('#globus').screenshot();await page.waitForTimeout(150);assert.notDeepEqual(moving,await page.locator('#globus').screenshot(),'play moves particles');
  await page.locator('#pause').click();const still=await page.locator('#globus').screenshot();await page.waitForTimeout(120);assert.deepEqual(still,await page.locator('#globus').screenshot(),'pause freezes particles');
  await page.locator('#reset').click();await page.locator('[data-month="7"]').click();await page.locator('#balloon').click();
  await page.evaluate(()=>scrollTo(0,0));await page.mouse.move(0,0);
  await page.screenshot({path:`${output}/${width}.png`,fullPage:true});
  console.log(`${width}×${height}: layout, controls, rotation, seasons, keyboard, balloon, touch/pointer, dialog, monsoon, motion passed`);
  await context.close();
 }
 // Missing basemap must preserve the wind model and guidance.
 const page=await browser.newPage();await page.route('**/countries-110m.json',route=>route.abort());await page.goto(base+'/atlas/cirkulation/');await page.waitForFunction(()=>document.querySelector('#load-status').textContent.includes('Landekortet mangler'));await page.locator('#help').click();assert.ok(await page.locator('#guide').isVisible());await page.close();
 assert.deepEqual(errors,[],'no JavaScript errors');
 await browser.close();console.log('All circulation browser checks passed.');
})().catch(error=>{console.error(error);process.exit(1);});
