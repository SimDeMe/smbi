// Nedbør måned for måned: GPCP v2.3 (Adler m.fl. 2018), klimanormal 1991–2020
// i 2,5° celler. Dannes af data/nedboer.py; se data/nedboer.LICENSE.
// Satellit- og regnmålerdata kombineret – også over havet, hvor der ingen
// regnmålere er. Værdierne er cellemiddel og passer ikke med én station.
//
// Laget dækker både hav og land: Rasteret tegnes oven på landfladerne, og
// kystlinjen tegnes igen ovenpå. Geometrien (hvilken celle hver skærmpixel
// rammer) gemmes for den aktuelle projektion, så et månedsskift kun skal farve
// pixlerne om. Modulets beregninger bruger ikke DOM, så de kan testes i node.

export const NX = 144, NY = 72, CELLE = 2.5;
export const ORDEN = 0;
export const AFLAESNING = '#nedboeraflaesning';
export const MAANEDER = ['januar', 'februar', 'marts', 'april', 'maj', 'juni', 'juli',
  'august', 'september', 'oktober', 'november', 'december'];

// mm pr. måned. Tørt er sandfarvet, vådt blåt og violet; grænserne følger de
// tal, elever kender fra klimadiagrammer (fx 50 og 100 mm).
export const KLASSER = [
  [0, '#f2e3bd'], [10, '#e3d98f'], [25, '#c4dc8f'], [50, '#8fca8e'], [75, '#5cb59a'],
  [100, '#3a9bb0'], [150, '#2c7cba'], [200, '#2e5aa6'], [300, '#383b8c'], [400, '#40206b']
].map(([fra, farve], i, alle) => ({ fra, til: alle[i + 1]?.[0] ?? null, farve }));
export function klasseFor(mm) {
  let k = 0;
  while (k < KLASSER.length - 1 && mm >= KLASSER[k + 1].fra) k++;
  return k;
}

// Solens zenitbredde (deklination) midt i måneden, efter Spencer (1971);
// nøjagtig til ca. 0,1°. Dag i året for den 15. i en ikke-skudår.
const DAG15 = [15, 46, 74, 105, 135, 166, 196, 227, 258, 288, 319, 349];
export function zenitbredde(maaned) {
  const g = 2 * Math.PI * (DAG15[maaned] - 1) / 365;
  const d = .006918 - .399912 * Math.cos(g) + .070257 * Math.sin(g) - .006758 * Math.cos(2 * g) +
    .000907 * Math.sin(2 * g) - .002697 * Math.cos(3 * g) + .00148 * Math.sin(3 * g);
  return d * 180 / Math.PI;
}

// Filen (efter gunzip): 'NBR1', bredde, højde og antal måneder (uint16), derefter
// uint16 i tiendedele mm pr. måned: måned for måned, rækker fra nord.
export function afkod(bytes) {
  const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (bytes.length !== 10 + 2 * 12 * NX * NY || String.fromCharCode(...bytes.subarray(0, 4)) !== 'NBR1' ||
      v.getUint16(4, true) !== NX || v.getUint16(6, true) !== NY || v.getUint16(8, true) !== 12) {
    throw new Error('Nedbørsdata er ugyldige eller ufuldstændige');
  }
  const d = new Float32Array(12 * NX * NY);
  for (let i = 0; i < d.length; i++) {
    d[i] = v.getUint16(10 + 2 * i, true) / 10;
    if (d[i] > 2000) throw new Error('Nedbørsdata er ugyldige');
  }
  return d;
}

let gitter = null;
let henter = null;
export const data = () => gitter;
export function brugGitter(d) { gitter = d; }

export function hent() {
  if (gitter) return Promise.resolve(gitter);
  henter ??= (async () => {
    if (typeof DecompressionStream === 'undefined') throw new Error('Browseren kan ikke pakke data ud');
    const svar = await fetch(new URL('./data/nedboer.bin', import.meta.url), { signal: AbortSignal.timeout(20000) });
    if (!svar.ok) throw new Error('Nedbørsdata kunne ikke indlæses');
    const ud = svar.body.pipeThrough(new DecompressionStream('gzip'));
    gitter = afkod(new Uint8Array(await new Response(ud).arrayBuffer()));
    return gitter;
  })().catch(fejl => { henter = null; throw fejl; });
  return henter;
}

// Cellen og vægtene for et punkt: bilineær mellem de fire nærmeste cellemidter.
// Cellemidterne ligger i -178,75 … 178,75° og 88,75 … -88,75°.
function celle(lon, lat) {
  let x = (lon + 178.75) / CELLE, y = (88.75 - lat) / CELLE;
  if (y < 0) y = 0; else if (y > NY - 1) y = NY - 1;
  const x0 = Math.floor(x), y0 = Math.min(NY - 2, Math.floor(y));
  return { x0: (x0 % NX + NX) % NX, y0, fx: x - x0, fy: y - y0 };
}

// mm i måneden (0–11) i punktet [lon, lat].
export function mmI(lon, lat, maaned, d = gitter) {
  if (!d) return null;
  const { x0, y0, fx, fy } = celle(lon, lat);
  const x1 = (x0 + 1) % NX, o = maaned * NX * NY;
  const a = d[o + y0 * NX + x0], b = d[o + y0 * NX + x1], c = d[o + (y0 + 1) * NX + x0], e = d[o + (y0 + 1) * NX + x1];
  return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + e * fx) * fy;
}
export function aaretI(lon, lat, d = gitter) {
  return Array.from({ length: 12 }, (_, m) => mmI(lon, lat, m, d));
}

// ---------- Tilstand: måned og overgang ----------

// Under et skift glider farverne fra én måned til den næste (t fra 0 til 1);
// de viste tal er altid månedens egne.
export const tilstand = { maaned: 0, fra: 0, t: 1, zenit: true };
export function saetMaaned(maaned, fra = maaned, t = 1) {
  Object.assign(tilstand, { maaned, fra, t });
}

// ---------- Tegning på globussen ----------

const RGB = KLASSER.map(k => [1, 3, 5].map(i => parseInt(k.farve.slice(i, i + 2), 16)));
// Opslagstabel fra tiendedele mm til klasse (0–4000, derover sidste klasse).
const LUT = new Uint8Array(4001);
for (let i = 0; i < LUT.length; i++) LUT[i] = klasseFor(i / 10);

// Ortografisk projektion baglæns for hver pixel. Samme formler som D3's
// geoOrthographic med rotate([-λ0, -φ0]); testen kontrollerer det.
// Resultat: celle og vægte pr. pixel (x0 = 255 uden for kloden).
export function geometri(w, h, { centrum, skala, cx, cy }) {
  const r = Math.PI / 180;
  const l0 = centrum[0] * r, p0 = centrum[1] * r, sp = Math.sin(p0), cp = Math.cos(p0);
  const x0 = new Uint8Array(w * h).fill(255), y0 = new Uint8Array(w * h);
  const fx = new Float32Array(w * h), fy = new Float32Array(w * h);
  for (let j = 0; j < h; j++) {
    const v = (cy - j - .5) / skala;
    for (let i = 0; i < w; i++) {
      const u = (i + .5 - cx) / skala;
      const rho2 = u * u + v * v;
      if (rho2 > 1) continue;
      const z = Math.sqrt(1 - rho2);
      const lat = Math.asin(v * cp + z * sp) / r;
      const lon = (l0 + Math.atan2(u, z * cp - v * sp)) / r;
      const c = celle(((lon + 540) % 360) - 180, lat);
      const n = j * w + i;
      x0[n] = c.x0; y0[n] = c.y0; fx[n] = c.fx; fy[n] = c.fy;
    }
  }
  return { w, h, x0, y0, fx, fy };
}

// Farver pixlerne for den viste tilstand. Under et skift blandes de to måneder
// først i gitteret (144 × 72 celler), så hver pixel kun slår ét gitter op.
// Klassegrænserne (isohyeter) tegnes som en svag, mørk kant, så farven ikke er
// eneste signal om grænsen.
const blandet = new Float32Array(NX * NY);
export function farvTil(ud, geo, { maaned, fra, t }, d = gitter, linjer = true) {
  const { w, h, x0, y0, fx, fy } = geo;
  let g;
  if (t < 1) {
    const oA = fra * NX * NY, oB = maaned * NX * NY;
    for (let i = 0; i < NX * NY; i++) blandet[i] = d[oA + i] + (d[oB + i] - d[oA + i]) * t;
    g = blandet;
  } else g = d.subarray(maaned * NX * NY, (maaned + 1) * NX * NY);
  const klasse = new Int8Array(w * h).fill(-1);
  for (let n = 0; n < w * h; n++) {
    const x = x0[n];
    if (x === 255) continue;
    const a = fx[n], b = fy[n], i00 = y0[n] * NX + x, i01 = x + 1 === NX ? i00 - x : i00 + 1;
    const oeverst = g[i00] + (g[i01] - g[i00]) * a, nederst = g[i00 + NX] + (g[i01 + NX] - g[i00 + NX]) * a;
    const mm = oeverst + (nederst - oeverst) * b;
    const k = LUT[Math.min(4000, (mm * 10 + .5) | 0)];
    klasse[n] = k;
    const farve = RGB[k], o = 4 * n;
    ud[o] = farve[0]; ud[o + 1] = farve[1]; ud[o + 2] = farve[2]; ud[o + 3] = 255;
  }
  if (!linjer) return klasse;
  for (let j = 0; j < h - 1; j++) {
    for (let i = 0; i < w - 1; i++) {
      const n = j * w + i, c = klasse[n];
      if (c < 0) continue;
      const hoejre = klasse[n + 1], under = klasse[n + w];
      if ((hoejre >= 0 && hoejre !== c) || (under >= 0 && under !== c)) {
        const o = 4 * n;
        ud[o] *= .72; ud[o + 1] *= .72; ud[o + 2] *= .72;
      }
    }
  }
  return klasse;
}

let cache = null, sidstFlyttet = 0, efterTimer = 0, sidsteProjektion = null;

// Rasteret over hav og land. Mens kloden drejes, bruges en grov geometri, og
// en skarp følger, når den har stået stille et øjeblik. Månedsskift genbruger
// geometrien og farver kun om.
export function tegnFlade(ctx, { projektion, centrum, skala, bredde, hoejde, gentegn }) {
  if (!gitter) return;
  sidsteProjektion = projektion;
  const noegle = `${centrum[0]},${centrum[1]},${skala},${bredde},${hoejde}`;
  const nu = performance.now();
  const flyttet = cache?.noegle !== noegle;
  const groft = flyttet ? nu - sidstFlyttet < 150 : cache.groft;
  if (flyttet) sidstFlyttet = nu;
  const taethed = Math.min(1.25, ctx.getTransform().a || 1);
  const faktor = groft ? .4 : taethed;
  const w = Math.max(1, Math.ceil(bredde * faktor)), h = Math.max(1, Math.ceil(hoejde * faktor));
  if (flyttet || cache.groft !== groft) {
    const laerred = cache?.laerred.width === w && cache.laerred.height === h ? cache.laerred : Object.assign(document.createElement('canvas'), { width: w, height: h });
    cache = { noegle, groft, laerred, geo: geometri(w, h, { centrum, skala: skala * faktor, cx: bredde / 2 * faktor, cy: hoejde / 2 * faktor }), vist: null };
  }
  const vist = `${tilstand.maaned},${tilstand.fra},${tilstand.t}`;
  if (cache.vist !== vist) {
    const lc = cache.laerred.getContext('2d');
    cache.billede ??= lc.createImageData(w, h);
    farvTil(cache.billede.data, cache.geo, tilstand, gitter, !groft);
    lc.putImageData(cache.billede, 0, 0);
    cache.vist = vist;
  }
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(cache.laerred, 0, 0, bredde, hoejde);
  ctx.restore();
  clearTimeout(efterTimer);
  if (groft && gentegn) efterTimer = setTimeout(() => { if (cache) cache.noegle = null; sidstFlyttet = 0; gentegn(); }, 180);
}

// Gradnet, ækvator og vendekredse over rasteret – og solens zenitbredde i måneden.
export function tegn(ctx, { projektion }) {
  if (!gitter) return;
  const d3 = window.d3;
  const sti = d3.geoPath(projektion, ctx);
  const kreds = bredde => ({ type: 'LineString', coordinates: Array.from({ length: 73 }, (_, i) => [-180 + 5 * i, bredde]) });
  ctx.save();
  ctx.beginPath(); sti(kreds(0)); ctx.strokeStyle = '#17211fb3'; ctx.lineWidth = 1.1; ctx.stroke();
  ctx.setLineDash([2, 4]);
  ctx.beginPath(); sti(kreds(23.44)); sti(kreds(-23.44)); ctx.strokeStyle = '#17211f99'; ctx.lineWidth = 1; ctx.stroke();
  if (tilstand.zenit) {
    const b = zenitbredde(tilstand.maaned);
    ctx.setLineDash([9, 5]); ctx.lineCap = 'round';
    ctx.beginPath(); sti(kreds(b)); ctx.strokeStyle = '#fff9ee'; ctx.lineWidth = 4.5; ctx.stroke();
    ctx.beginPath(); sti(kreds(b)); ctx.strokeStyle = '#d9480f'; ctx.lineWidth = 2.2; ctx.stroke();
  }
  ctx.restore();
}

// Aflæsning ved et skærmpunkt (mus, eller sigtekornet midt på globussen).
// lyt(aaret, maaned) får punktets tolv måneder, fx til et lille søjlediagram.
export let lyt = null;
export function lytTil(fn) { lyt = fn; }
export const mmTekst = mm => mm < 1 ? 'under 1 mm' : `${Math.round(mm).toLocaleString('da-DK')} mm`;
export function beskriv(aaret, maaned) {
  if (!aaret) return 'ingen data';
  const sum = aaret.reduce((a, b) => a + b, 0);
  return `${mmTekst(aaret[maaned])} i ${MAANEDER[maaned]} · ${mmTekst(sum)} på et år`;
}
export function aflaes(xy) {
  const p = sidsteProjektion?.invert(xy);
  const aaret = p && Number.isFinite(p[0]) ? aaretI(p[0], p[1]) : null;
  lyt?.(aaret, tilstand.maaned);
  return beskriv(aaret, tilstand.maaned);
}
