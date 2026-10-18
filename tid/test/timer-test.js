import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
const her = fileURLToPath(new URL('.', import.meta.url));
const akt = (id, name) => [`users/u1/activities/${id}`, { name, type: 'opgave', order: 1, schoolYear: '2026/27', color: '#0E86C8' }];
export const seed = [['users/u1/settings/config', { currentSchoolYear: '2026/27', autoShortBreaks: false }], akt('a', 'SRP'), akt('b', 'Retning')];
export const aaben = (id, age = 5) => [`users/u1/entries/${id}`, { activityId: 'a', workType: null, startTime: { __ts: Date.now() - age * 60000 }, endTime: null, durationMinutes: null, note: '' }];
export const fejl = [];
export async function lavSide(browser, cfg = {}, server = null, width = 390) {
  const ctx = await browser.newContext({ viewport: { width, height: 750 }, locale: 'da-DK', timezoneId: 'Europe/Copenhagen', serviceWorkers: 'block' });
  const page = await ctx.newPage();
  page.on('pageerror', e => fejl.push(e.message));
  for (const [frag, file] of [['firebase-app.js', 'fake-app.js'], ['firebase-auth.js', 'fake-auth.js'], ['firebase-firestore.js', 'fake-fs.js']])
    await page.route('**/' + frag, r => r.fulfill({ contentType: 'text/javascript', body: readFileSync(her + file, 'utf8') }));
  await page.route('**/feedback.js', r => r.fulfill({ contentType: 'text/javascript', body: '' }));
  await page.route('https://fonts.**', r => r.abort());
  if (server) {
    server.pages.push(page);
    await page.exposeFunction('__fsRemote', req => {
      if (req.type === 'read') return [...server.store];
      const ok = req.reads.every(([path, data]) => {
        try { assert.deepEqual(server.store.get(path) ?? null, data); return true; } catch { return false; }
      });
      if (ok) for (const [path, data] of req.ops) data ? server.store.set(path, data) : server.store.delete(path);
      const rows = [...server.store];
      if (ok) setTimeout(() => { for (const p of server.pages) if (!server.paused.has(p)) p.evaluate(rows => window.__fs?.receive(rows), rows).catch(() => {}); }, 0);
      return { ok, rows };
    });
  }
  await page.addInitScript(cfg => { window.__fsCfg = cfg; }, { seed: server ? [...server.store] : seed, ...cfg });
  await page.goto('http://localhost:8777/tid/');
  await page.waitForSelector('.qs-btn[data-id="a"]');
  await page.waitForTimeout(100);
  return page;
}
