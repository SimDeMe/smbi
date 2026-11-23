// Film af drivhuseffekten: renderer geografi/drivhuseffekt/ billede for
// billede til en MP4 i 1920×1080, evt. med speak lagt på.
//
//   python3 -m http.server 8777                         (i repoets rod)
//   node værktøj/film-drivhuseffekt.mjs                  hele forløbet, uden lyd
//   node værktøj/film-drivhuseffekt.mjs --lyd ~/speak    med speak, ét klip pr. trin
//   node værktøj/film-drivhuseffekt.mjs --trin 2         kun ét trin (hurtig prøve)
//
// Speak: læg ét lydklip pr. trin i en mappe, navngivet trin1 … trin6
// (.m4a, .mp3, .wav eller .aif). Har et trin et klip, varer trinnet lige så
// længe som klippet plus lidt luft før og efter; ellers bruges varigheden i
// drejebogen nedenfor. Handlinger (solnedgang, sammenligninger) sker ved en
// andel af trinnets varighed, så de flytter med, når speaken bliver længere.
// Optag et trin om, og kør scriptet igen — billedet følger med.
//
// Siden åbnes med ?film=styret: dens eget ur står stille, og scriptet
// skridter modellen frem med window.dhFilm.skridt(1/FPS) før hvert billede.
// Derfor er videoen jævn uanset maskinens fart.
//
// Resultatet lægges i værktøj/ud/film/ (ikke med i git).

import { chromium } from './node_modules/playwright/index.mjs';
import { spawn, execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';

// ── Drejebog ────────────────────────────────────────────────────────────
// varighed: sekunder uden speak. handlinger: [andel af trinnet, handling].
const DREJEBOG = [
  { navn: 'Solens energi', varighed: 9 },
  { navn: 'Jorden stråler', varighed: 16,
    handlinger: [[0.35, f => f.sol(false)]] },          // solen går ned (4,5 s)
  { navn: 'Gasser absorberer', varighed: 10 },
  { navn: 'Atmosfæren stråler', varighed: 11 },
  { navn: 'Drivhuseffekten', varighed: 18,
    handlinger: [[0.45, f => f.gas(false)]] },          // uden drivhusgassernes virkning
  { navn: 'Forstærket drivhuseffekt', varighed: 20,
    handlinger: [[0, f => f.klima(1)], [0.4, f => f.klima(2)]] }, // reference → forstærket
];
const FOER = 0.5, EFTER = 1.2;   // luft før og efter speaken i hvert trin

// ── Indstillinger ───────────────────────────────────────────────────────
const arg = process.argv.slice(2);
const vaerdi = navn => { const i = arg.indexOf(navn); return i >= 0 ? arg[i + 1] : null; };
const FPS = +(vaerdi('--fps') || 30);
const kunTrin = vaerdi('--trin') ? +vaerdi('--trin') : null;   // 1–6
const lydmappe = vaerdi('--lyd') ? resolve(vaerdi('--lyd').replace(/^~/, homedir())) : null;
const PORT = process.env.PORT || 8777;
const ud = fileURLToPath(new URL('ud/film/', import.meta.url));
mkdirSync(ud, { recursive: true });
const filnavn = join(ud, kunTrin ? `drivhuseffekten-trin${kunTrin}.mp4` : 'drivhuseffekten.mp4');

function lydTil(nr) {
  if (!lydmappe) return null;
  const fil = readdirSync(lydmappe).find(f => new RegExp(`^trin${nr}\\.(m4a|mp3|wav|aiff?)$`, 'i').test(f));
  return fil ? join(lydmappe, fil) : null;
}
function laengde(fil) {
  return +execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration',
    '-of', 'default=nw=1:nk=1', fil]).toString().trim();
}

if (lydmappe && !existsSync(lydmappe)) { console.error(`Lydmappen findes ikke: ${lydmappe}`); process.exit(1); }
const plan = DREJEBOG.map((t, i) => {
  const lyd = lydTil(i + 1);
  return { ...t, nr: i + 1, lyd, sek: lyd ? FOER + laengde(lyd) + EFTER : t.varighed };
}).filter(t => kunTrin === null || t.nr === kunTrin);
const ialt = plan.reduce((s, t) => s + t.sek, 0);
for (const t of plan) console.log(`Trin ${t.nr} ${t.navn.padEnd(26)} ${t.sek.toFixed(1).padStart(5)} s  ${t.lyd ? 'speak' : '—'}`);
console.log(`I alt ${ialt.toFixed(1)} s · ${Math.round(ialt * FPS)} billeder → ${filnavn}`);

// ── ffmpeg: billeder ind på stdin, evt. speak som ekstra input ───────────
const lydspor = plan.some(t => t.lyd);
const ffArg = ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-'];
let filter = '';
if (lydspor) {
  let k = 1;
  plan.forEach((t, i) => {
    if (t.lyd) {
      ffArg.push('-i', t.lyd);
      filter += `[${k++}:a]aresample=48000,aformat=channel_layouts=stereo,adelay=${FOER * 1000}:all=1,apad,atrim=duration=${t.sek.toFixed(3)}[a${i}];`;
    } else {
      filter += `anullsrc=r=48000:cl=stereo,atrim=duration=${t.sek.toFixed(3)}[a${i}];`;
    }
  });
  filter += plan.map((_, i) => `[a${i}]`).join('') + `concat=n=${plan.length}:v=0:a=1[lyd]`;
  ffArg.push('-filter_complex', filter, '-map', '0:v', '-map', '[lyd]', '-c:a', 'aac', '-b:a', '192k');
}
ffArg.push('-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p',
  '-movflags', '+faststart', '-shortest', filnavn);
const ffmpeg = spawn('ffmpeg', ffArg, { stdio: ['pipe', 'inherit', 'inherit'] });
const ffSlut = new Promise((ok, fejl) => ffmpeg.on('close', c => c ? fejl(new Error(`ffmpeg ${c}`)) : ok()));

// ── Browseren ───────────────────────────────────────────────────────────
const browser = await chromium.launch({ headless: true });
const side = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1.5 });
const fejl = [];
side.on('pageerror', e => fejl.push(e.message));
await side.goto(`http://localhost:${PORT}/geografi/drivhuseffekt/?film=styret`);
await side.evaluate(() => document.fonts.ready);
await side.waitForFunction(() => window.dhFilm);
await side.waitForTimeout(400);

const start = Date.now();
let billeder = 0;
for (const t of plan) {
  await side.evaluate(n => window.dhFilm.trin(n), t.nr - 1);
  const antal = Math.round(t.sek * FPS);
  const handlinger = (t.handlinger || []).map(([andel, h]) => ({ ved: Math.round(andel * antal), kode: h.toString() }));
  for (let b = 0; b < antal; b++) {
    for (const h of handlinger.filter(h => h.ved === b)) {
      await side.evaluate(kode => (0, eval)(kode)(window.dhFilm), h.kode);
    }
    if (b > 0) await side.evaluate(dt => window.dhFilm.skridt(dt), 1 / FPS);
    const png = await side.screenshot({ type: 'png' });
    if (!ffmpeg.stdin.write(png)) await new Promise(ok => ffmpeg.stdin.once('drain', ok));
    if (++billeder % (FPS * 5) === 0) {
      process.stdout.write(`\r${(billeder / FPS).toFixed(0)} / ${ialt.toFixed(0)} s  (${((Date.now() - start) / 1000).toFixed(0)} s brugt)`);
    }
  }
}
ffmpeg.stdin.end();
await browser.close();
await ffSlut;
console.log(`\nFærdig: ${filnavn}`);
if (fejl.length) { console.error('Fejl på siden:\n' + fejl.join('\n')); process.exit(1); }
