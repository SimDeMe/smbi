import http from 'node:http';
import { readFile, writeFile, mkdir, chmod } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { chromium } from 'playwright';
import { readSchedule, parseBricks, scheduleUrl } from './parser.mjs';
import { weeksForRange, updateRange, mergeUpdate, sameSource } from './range.mjs';
import { setTimeout as pause } from 'node:timers/promises';
import { creditUrl, readCredits } from './credits.mjs';

const root = fileURLToPath(new URL('.', import.meta.url));
const dataDir = path.join(root, '.local');
await mkdir(dataDir, { recursive: true, mode: 0o700 });
await chmod(dataDir, 0o700);
const port = Number(process.env.PORT || 8787);
const origin = `http://127.0.0.1:${port}`;
let config = { url: 'https://www.lectio.dk/lectio/141/SkemaNy.aspx', week: '432026', from: '2026-08-01', to: '2026-12-31' };
try {
  const saved = JSON.parse(await readFile(path.join(dataDir, 'config.json'), 'utf8'));
  weeksForRange(saved.from || config.from, saved.to || config.to);
  config = { ...config, ...saved, url: scheduleUrl(saved.url, saved.week) };
} catch {}
let browser, loginPage, opening, syncing;
let snapshot = null;
let status = 'Åbn Lectio og log ind for at hente dit skema.';
let needsLogin = true;
let lastAttempt = null;
try { snapshot = JSON.parse(await readFile(path.join(dataDir, 'schedule.json'), 'utf8')); } catch {}

async function context() {
  if (browser) return browser;
  if (!opening) opening = (async () => {
    const ctx = await chromium.launchPersistentContext(path.join(dataDir, 'browser'), {
      headless: false, locale: 'da-DK', timezoneId: 'Europe/Copenhagen',
      viewport: { width: 1180, height: 850 },
      ...(process.env.LECTIO_BROWSER_CHANNEL ? { channel: process.env.LECTIO_BROWSER_CHANNEL } : {})
    });
    browser = ctx;
    ctx.on('close', () => { browser = null; loginPage = null; });
    return ctx;
  })().finally(() => { opening = null; });
  return opening;
}

async function sync(mode = 'future') {
  if (syncing) return syncing;
  const selected = { ...config };
  const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Copenhagen', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  const refreshRange = updateRange(selected, mode, today);
  syncing = (async () => {
    lastAttempt = new Date().toISOString();
    const ctx = await context();
    const page = await ctx.newPage();
    const weeks = refreshRange.weeks;
    const source = scheduleUrl(selected.url, selected.week);
    const batches = [];
    try {
      for (const [index, week] of weeks.entries()) {
      status = `Henter uge ${Number(week.slice(0, 2))}/${week.slice(2)} · ${index + 1} af ${weeks.length} uger…`;
      const weekSource = scheduleUrl(selected.url, week);
      const response = await page.goto(weekSource, { waitUntil: 'domcontentloaded', timeout: 45000 });
      if (response && !response.ok()) throw new Error('Lectio svarede med HTTP ' + response.status());
      const extracted = await page.evaluate(readSchedule);
      if (extracted.login || !extracted.recognized) {
        needsLogin = true;
        throw new Error('Log ind i Lectio-vinduet. Hvis du er logget ind, genkender prototypen endnu ikke skemasiden.');
      }
      const parsed = parseBricks(extracted.bricks, weekSource);
      // A format change must never replace a previous schedule with incomplete data.
      if (parsed.warnings.length) throw new Error(`Uge ${week.slice(0, 2)}: ${parsed.warnings.length} skemabrik(ker) kunne ikke læses. Det senest hentede skema er bevaret. Første fejl: ${parsed.warnings[0]}`);
      batches.push(parsed);
      needsLogin = false;
      if (index < weeks.length - 1) await pause(1000);
      }
      const range = { from: selected.from, to: selected.to };
      const warnings = [];
      const fetchedEvents = batches.flatMap(b => b.events);
      const cancelled = [...new Map(fetchedEvents.filter(e => e.cancelled && e.activityId && e.end > `${refreshRange.from}T00:00:00` && e.start.slice(0, 10) <= refreshRange.to).map(e => [e.activityId, e])).values()];
      const credits = new Map();
      for (const [index, event] of cancelled.entries()) {
        status = `Henter kreditering for aflyste moduler · ${index + 1} af ${cancelled.length}…`;
        const creditSource = creditUrl(source, event.activityId);
        try {
          const response = await page.goto(creditSource, { waitUntil: 'domcontentloaded', timeout: 45000 });
          if (response && !response.ok()) throw new Error('Lectio svarede med HTTP ' + response.status());
          const result = await page.evaluate(readCredits);
          credits.set(event.activityId, { ...result, source: creditSource, fetchedAt: new Date().toISOString() });
          if (result.status !== 'ok') warnings.push(`Krediteringen for aktivitet ${event.activityId} kunne ikke læses fuldt ud.`);
        } catch {
          credits.set(event.activityId, { status: 'unknown', teachers: [], groups: [], source: creditSource });
          warnings.push(`Krediteringen for aktivitet ${event.activityId} kunne ikke hentes.`);
        }
        if (index < cancelled.length - 1) await pause(1000);
      }
      for (const event of fetchedEvents) if (event.cancelled) event.credits = credits.get(event.activityId) || { status: 'unknown', teachers: [], groups: [] };
      const next = { schemaVersion: 1, source, range,
        weeks: mode === 'all' ? weeks : [...new Set([...(snapshot && sameSource(snapshot.source, source) ? snapshot.weeks || [] : []), ...weeks])].filter(w => weeksForRange(range.from, range.to).includes(w)),
        lastUpdate: { mode, from: refreshRange.from, to: refreshRange.to, weeks },
        fetchedAt: new Date().toISOString(), events: mergeUpdate(snapshot, batches, source, range, refreshRange.from), warnings };
      await writeFile(path.join(dataDir, 'schedule.json'), JSON.stringify(next, null, 2), { mode: 0o600 });
      snapshot = next;
      needsLogin = false;
      status = `${mode === 'all' ? 'Hele perioden opdateret' : 'Opdateret fra ' + refreshRange.from} · ${weeks.length} uger hentet · ${next.events.length} aktiviteter gemt.${warnings.length ? ' ' + warnings.length + ' krediteringer er ukendte.' : ''}`;
      return next;
    } finally { await page.close().catch(() => {}); }
  })().catch(error => { status = error.message; throw error; }).finally(() => { syncing = null; });
  return syncing;
}

const files = { '/': ['index.html', 'text/html; charset=utf-8'], '/app.js': ['app.js', 'text/javascript; charset=utf-8'], '/tid-bridge.js': ['tid-bridge.js', 'text/javascript; charset=utf-8'], '/styles.css': ['styles.css', 'text/css; charset=utf-8'], '/range.css': ['range.css', 'text/css; charset=utf-8'] };
const server = http.createServer(async (req, res) => {
  const json = (code, obj) => { res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(obj)); };
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Security-Policy', "default-src 'self'; style-src 'self'; script-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
  // Loopback only, plus Host/Origin checks against rebinding and cross-site requests.
  if (req.headers.host !== `127.0.0.1:${port}` ||
      (req.headers.origin && req.headers.origin !== origin) ||
      (req.headers['sec-fetch-site'] && !['same-origin', 'none'].includes(req.headers['sec-fetch-site']))) return json(403, { error: 'Kun adgang fra den lokale app.' });
  try {
    const pathname = new URL(req.url, origin).pathname;
    if (req.method === 'GET' && files[pathname]) {
      const [file, type] = files[pathname];
      res.writeHead(200, { 'Content-Type': type });
      return res.end(await readFile(path.join(root, 'public', file)));
    }
    if (req.method === 'GET' && pathname === '/api/status') return json(200, { config, status, needsLogin, syncing: Boolean(syncing), browserOpen: Boolean(browser), lastAttempt, snapshot });
    if (req.method === 'GET' && pathname === '/api/skema') return json(snapshot ? 200 : 404, snapshot || { error: 'Der er endnu ikke hentet et skema.' });
    if (req.method !== 'POST' || req.headers.origin !== origin || req.headers['content-type'] !== 'application/json') return json(403, { error: 'Brug appens knapper.' });
    let raw = '';
    for await (const chunk of req) { raw += chunk; if (raw.length > 4096) return json(413, { error: 'For mange data.' }); }
    const body = JSON.parse(raw || '{}');
    if (pathname === '/api/config') {
      if (syncing) return json(409, { error: 'Vent til hentningen er færdig.' });
      const url = scheduleUrl(body.url, body.week);
      const from = body.from || config.from, to = body.to || config.to;
      weeksForRange(from, to);
      config = { url, week: body.week, from, to };
      await writeFile(path.join(dataDir, 'config.json'), JSON.stringify(config), { mode: 0o600 });
      return json(200, config);
    }
    if (pathname === '/api/login') {
      const ctx = await context();
      if (!loginPage || loginPage.isClosed()) {
        loginPage = await ctx.newPage();
        await loginPage.goto(scheduleUrl(config.url, config.week), { waitUntil: 'domcontentloaded', timeout: 45000 });
      }
      await loginPage.bringToFront();
      status = 'Log ind med MitID i Lectio-vinduet. Tryk derefter Opdater eller Opdater alt.';
      return json(200, { status });
    }
    if (pathname === '/api/sync') {
      const mode = body.mode || 'future';
      if (!['all', 'future'].includes(mode)) throw new Error('Ukendt opdatering.');
      updateRange(config, mode, new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Copenhagen' }).format(new Date()));
      sync(mode).catch(() => {});
      return json(202, { status: 'Hentning startet. Følg fremdriften i appen.' });
    }
    return json(404, { error: 'Ukendt adresse.' });
  } catch (error) {
    const message = error.message.includes('Executable doesn\'t exist') ? 'Installer browseren med: npx playwright install chromium' : error.message;
    return json(400, { error: message });
  }
});
server.listen(port, '127.0.0.1', () => console.log(`Lectio-skema: ${origin}`));
async function stop() { server.close(); if (browser) await browser.close(); process.exit(); }
process.on('SIGTERM', stop);
process.on('SIGINT', stop);
