// Del 3 · Afkøling og korn: hvor og hvor tyk magmaen er, bestemmer hvor længe den
// er om at størkne – og dermed hvor store krystallerne bliver. Luppen viser et
// felt på 10 × 10 mm, hvor krystallerne begynder at vokse fra kim og vokser,
// til de støder sammen (Johnson–Mehl-mønster).
import { KROPPE, MAGMAER, stoerkn, tidsord, kornklasse } from './model.js';
import { el, efterId, stenbillede, stenlink, roligBevaegelse } from './sten.js';
import { rng } from './tilfaeldig.js';

const NS = 'http://www.w3.org/2000/svg';
const svg = (navn, attr = {}, tekst) => {
  const e = document.createElementNS(NS, navn);
  for (const [k, v] of Object.entries(attr)) e.setAttribute(k, v);
  if (tekst !== undefined) e.textContent = tekst;
  return e;
};
const FELT = 10;      // mm
const PX = 280;       // beregningens opløsning (px pr. side)

const fmtTykkelse = h => h >= 1000 ? `${(h / 1000).toLocaleString('da-DK', { maximumFractionDigits: 1 })} km`
  : `${h.toLocaleString('da-DK', { maximumFractionDigits: h < 1 ? 2 : h < 10 ? 1 : 0 })} m`;

// Krystalmønstret: kim med tilfældigt sted og starttid; hver pixel tilhører det
// krystal, der når den først (tid = starttid + afstand / fart).
export function krystaller(d, magma, froe) {
  const tilf = rng(froe);
  const glas = d < 0.05;
  const n = glas ? 12 : Math.max(2, Math.min(5000, Math.round(1.15 * (FELT / d) ** 2)));
  const kim = [];
  const mineraler = MAGMAER[magma].mineraler;
  for (let i = 0; i < n; i++) {
    let r = tilf(), m = mineraler[0];
    for (const mm of mineraler) { if (r < mm[2]) { m = mm; break; } r -= mm[2]; }
    kim.push({ x: tilf() * PX, y: tilf() * PX, t: tilf() * .55, farve: m[1], lys: .86 + tilf() * .28 });
  }
  // Fart: kornene når cirka den gennemsnitlige afstand mellem kim ved tid ~0,9.
  const fart = glas ? PX / 40 : (PX / Math.sqrt(n)) / .7;
  // Net af kim, så hver pixel kun ser på kim i nærheden.
  const c = Math.max(4, Math.ceil(PX / Math.sqrt(n))), nc = Math.ceil(PX / c);
  const celler = Array.from({ length: nc * nc }, () => []);
  kim.forEach((k, i) => celler[Math.min(nc - 1, Math.floor(k.y / c)) * nc + Math.min(nc - 1, Math.floor(k.x / c))].push(i));
  const ankomst = new Float32Array(PX * PX).fill(Infinity), ejer = new Int32Array(PX * PX).fill(-1);
  const r = glas ? nc : 2;
  for (let y = 0; y < PX; y++) {
    const cy = Math.floor(y / c);
    for (let x = 0; x < PX; x++) {
      const cx = Math.floor(x / c);
      let bedst = Infinity, hvem = -1;
      for (let j = Math.max(0, cy - r); j <= Math.min(nc - 1, cy + r); j++) {
        for (let i = Math.max(0, cx - r); i <= Math.min(nc - 1, cx + r); i++) {
          for (const k of celler[j * nc + i]) {
            const a = kim[k].t + Math.hypot(kim[k].x - x, kim[k].y - y) / fart;
            if (a < bedst) { bedst = a; hvem = k; }
          }
        }
      }
      ankomst[y * PX + x] = glas ? Math.min(bedst, 2) : bedst;
      ejer[y * PX + x] = glas && bedst > .12 ? -1 : hvem;
    }
  }
  return { kim, ankomst, ejer, glas };
}

const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));

function tegnLupe(ctx, k, tau, magma) {
  const billede = ctx.createImageData(PX, PX), ud = billede.data;
  const glasfarve = magma === 'granitisk' ? [22, 20, 24] : [34, 30, 28];
  // Smelten gløder først og bliver mørkere, mens den køler.
  const smelte = [Math.round(255 - 150 * tau), Math.round(120 - 80 * tau), Math.round(46 - 20 * tau)];
  const farver = k.kim.map(kk => hex(kk.farve).map(v => Math.min(255, v * kk.lys)));
  for (let p = 0; p < PX * PX; p++) {
    const o = 4 * p, e = k.ejer[p];
    let f;
    if (tau < 1 && k.ankomst[p] > tau) f = smelte;
    else if (e < 0) f = glasfarve;
    else {
      f = farver[e];
      // Korngrænser: mørk kant mod nabokorn.
      const x = p % PX, y = (p / PX) | 0;
      if ((x + 1 < PX && k.ejer[p + 1] !== e && k.ankomst[p + 1] <= tau) || (y + 1 < PX && k.ejer[p + PX] !== e && k.ankomst[p + PX] <= tau)) f = f.map(v => v * .55);
    }
    ud[o] = f[0]; ud[o + 1] = f[1]; ud[o + 2] = f[2]; ud[o + 3] = 255;
  }
  if (k.glas && tau >= 1) {
    // Glans på glasset.
    for (let p = 0; p < PX * PX; p++) {
      const x = p % PX, y = (p / PX) | 0, g = Math.max(0, 1 - Math.abs(x + y - PX * .8) / 40) * 70;
      if (k.ejer[p] < 0) { ud[4 * p] += g; ud[4 * p + 1] += g; ud[4 * p + 2] += g; }
    }
  }
  return billede;
}

export function start(rod) {
  const skorpe = rod.querySelector('#skorpe');
  const lupe = rod.querySelector('#lupe');
  const ur = rod.querySelector('#lupe-ur');
  const lupetekst = rod.querySelector('#lupe-tekst');
  const skyder = rod.querySelector('#tykkelse');
  const skyderUd = rod.querySelector('#tykkelse-ud');
  const resultat = rod.querySelector('#resultat');
  const knap = rod.querySelector('#stoerkn');
  let magma = 'basaltisk', krop = 'lava', h = KROPPE.lava.start;
  let monster = null, animation = 0;
  const lag = document.createElement('canvas');
  lag.width = lag.height = PX;
  const lctx = lag.getContext('2d');

  // ---------- Snittet gennem skorpen ----------
  skorpe.innerHTML = `
    <rect x="0" y="0" width="400" height="70" fill="#e7f3f8"/>
    <rect x="0" y="70" width="400" height="350" fill="#cdb8a3"/>
    <path d="M0 150 H400 M0 250 H400 M0 350 H400" stroke="#17211f1f" stroke-width="1"/>
    <text x="392" y="88" text-anchor="end" class="dybde">overfladen</text>
    <text x="392" y="250" text-anchor="end" class="dybde">ca. 5 km</text>
    <text x="392" y="410" text-anchor="end" class="dybde">ca. 10 km</text>
    <g data-legeme="lava"><path d="M18 70 C40 60 90 58 140 62 L150 70Z" fill="#3a3330"/><text x="20" y="50" class="kropnavn">Lavastrøm</text></g>
    <g data-legeme="gang"><path d="M188 70 L200 70 L206 330 L192 330Z" fill="#4a403b"/><text x="212" y="150" class="kropnavn">Gang</text></g>
    <g data-legeme="pluton"><path d="M60 300 C60 250 120 230 170 236 C230 242 262 290 250 340 C238 384 160 396 110 384 C70 374 60 340 60 300Z" fill="#c08a72"/><text x="100" y="318" class="kropnavn">Pluton</text></g>
    <path d="M199 330 C190 360 180 380 160 395" stroke="#e8562a" stroke-width="4" stroke-dasharray="6 5" fill="none"/>
    <path d="M199 70 L199 60" stroke="#e8562a" stroke-width="4"/>`;
  const kroppe = [...skorpe.querySelectorAll('[data-legeme]')];

  // ---------- Kontroller ----------
  const somV = (k, hh) => Math.round(1000 * Math.log(hh / k.min) / Math.log(k.max / k.min));
  const fraV = (k, v) => k.min * (k.max / k.min) ** (v / 1000);
  function radio(selektor, felt, skift) {
    const knapper = [...rod.querySelectorAll(selektor)];
    const saet = v => { for (const b of knapper) { b.setAttribute('aria-checked', String(b.dataset[felt] === v)); b.tabIndex = b.dataset[felt] === v ? 0 : -1; } };
    for (const b of knapper) {
      b.onclick = () => { saet(b.dataset[felt]); skift(b.dataset[felt]); };
      b.onkeydown = e => {
        const ny = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
        if (ny === undefined) return;
        e.preventDefault();
        const n = knapper[(knapper.indexOf(b) + ny + knapper.length) % knapper.length];
        n.focus(); n.click();
      };
    }
    saet(knapper.find(b => b.getAttribute('aria-checked') === 'true').dataset[felt]);
  }
  radio('[data-magma]', 'magma', v => { magma = v; opdater(); });
  radio('[data-krop]', 'krop', v => { krop = v; h = KROPPE[v].start; skyder.value = somV(KROPPE[v], h); opdater(); });
  skyder.value = somV(KROPPE.lava, h);
  skyder.oninput = () => { h = fraV(KROPPE[krop], Number(skyder.value)); opdater(); };
  knap.onclick = () => afspil();

  function opdater() {
    cancelAnimationFrame(animation);
    const k = KROPPE[krop];
    skyderUd.textContent = fmtTykkelse(h);
    skyder.setAttribute('aria-valuetext', `${fmtTykkelse(h)} (${k.navn.toLowerCase()})`);
    for (const g of kroppe) g.classList.toggle('valgt', g.dataset.legeme === krop);
    const r = stoerkn(magma, krop, h);
    monster = krystaller(r.d, magma, Math.round(h * 1000) + (magma === 'granitisk' ? 7 : 0));
    tegnFelt(1);
    ur.textContent = '';
    const dl = el('dl');
    const tilfoej = (dt, dd) => dl.append(el('dt', dt), el('dd', dd));
    tilfoej('Afkøling', `ca. ${tidsord(r.t)}`);
    tilfoej('Kornstørrelse', r.klasse.navn === 'glas' ? 'ingen korn – glas' : `ca. ${r.d.toLocaleString('da-DK', { maximumSignificantDigits: 2 })} mm · ${r.klasse.tekst}`);
    const post = efterId[r.bjergart];
    const navn = post ? post.navn : r.bjergart === 'basaltglas' ? 'Basaltglas' : r.bjergart;
    tilfoej('Bjergart', navn);
    const kort = el('div', '', 'stenkort');
    if (post) {
      const t = el('div');
      const a = el('a', 'Se den i stensamlingen →'); a.href = stenlink(post.id);
      t.append(el('h3', post.navn), el('p', post.kort), a);
      kort.append(stenbillede(post.id), t);
    }
    const noter = [];
    if (r.klasse.navn === 'glas') noter.push('Smelten køler så hurtigt, at atomerne ikke når at ordne sig i krystaller – fx skorpen på en lavastrøm eller pudelava i havet.');
    if (magma === 'granitisk' && krop === 'lava' && r.klasse.navn !== 'glas') noter.push('Granitisk lava er så sej, at den også kan størkne til glas (obsidian) i en tyk strøm – det er ikke kun afkølingen, der bestemmer.');
    if (krop === 'pluton' && magma === 'granitisk') noter.push('Den sidste, vandrige rest af smelten kan trænge ud i sprækker og give kæmpekorn: pegmatit.');
    resultat.replaceChildren(dl, ...(post ? [kort] : []), ...noter.map(n => el('p', n, 'smaa')));
    lupetekst.textContent = `${navn} · ${r.klasse.navn === 'glas' ? 'glas' : `korn ca. ${r.d.toLocaleString('da-DK', { maximumSignificantDigits: 2 })} mm`} · afkøling ca. ${tidsord(r.t)}`;
    lupe.setAttribute('aria-label', `Under luppen (10 × 10 mm): ${navn.toLowerCase()}, ${r.klasse.navn === 'glas' ? 'glas uden synlige korn' : `korn på ca. ${r.d.toLocaleString('da-DK', { maximumSignificantDigits: 2 })} mm`}.`);
  }

  function tegnFelt(tau) {
    lctx.putImageData(tegnLupe(lctx, monster, tau, magma), 0, 0);
    const boks = lupe.getBoundingClientRect();
    const dpr = Math.min(2, devicePixelRatio || 1), s = Math.max(1, Math.round(boks.width * dpr));
    if (lupe.width !== s) { lupe.width = s; lupe.height = s; }
    const ctx = lupe.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(lag, 0, 0, s, s);
    // Målestok: 1 mm og feltets bredde.
    const mm = s / FELT;
    ctx.fillStyle = '#fff9eeee'; ctx.fillRect(8 * dpr, s - 30 * dpr, mm * 2 + 50 * dpr, 22 * dpr);
    ctx.fillStyle = '#17211f'; ctx.fillRect(14 * dpr, s - 16 * dpr, mm * 2, 4 * dpr);
    ctx.fillRect(14 * dpr, s - 20 * dpr, 1.5 * dpr, 12 * dpr); ctx.fillRect(14 * dpr + mm, s - 18 * dpr, 1.5 * dpr, 8 * dpr); ctx.fillRect(14 * dpr + 2 * mm, s - 20 * dpr, 1.5 * dpr, 12 * dpr);
    ctx.font = `600 ${11 * dpr}px "IBM Plex Mono", monospace`; ctx.textBaseline = 'middle';
    ctx.fillText('2 mm', 20 * dpr + 2 * mm, s - 15 * dpr);
    ctx.strokeStyle = '#17211f'; ctx.lineWidth = 2 * dpr; ctx.strokeRect(dpr, dpr, s - 2 * dpr, s - 2 * dpr);
  }

  function afspil() {
    cancelAnimationFrame(animation);
    const r = stoerkn(magma, krop, h);
    if (roligBevaegelse()) { tegnFelt(1); ur.textContent = `Størknet efter ca. ${tidsord(r.t)}`; return; }
    const t0 = performance.now(), varighed = 3200;
    const trin = nu => {
      const f = Math.min(1, (nu - t0) / varighed);
      tegnFelt(f < 1 ? f : 1);
      ur.textContent = f < 1 ? `${tidsord(r.t * f || 1)} · ${Math.round(f * 100)} %` : `Størknet efter ca. ${tidsord(r.t)}`;
      if (f < 1) animation = requestAnimationFrame(trin);
    };
    animation = requestAnimationFrame(trin);
  }

  new ResizeObserver(() => monster && tegnFelt(1)).observe(lupe);
  opdater();
  return { vis() { if (monster) tegnFelt(1); }, skjul() { cancelAnimationFrame(animation); } };
}
