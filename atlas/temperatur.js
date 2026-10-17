// Klimaforandringer: temperaturstigning årti for årti. NASA GISTEMP v4
// (Lenssen m.fl. 2019), afvigelse fra middel 1951–1980 i 2° celler, land og
// hav kombineret. Dannes af data/temperatur.py; se data/temperatur.LICENSE.
//
// Laget dækker både hav og land som nedbørslaget: rasteret tegnes oven på
// landfladerne, og kystlinjen tegnes igen ovenpå. Geometrien (hvilken celle
// hver skærmpixel rammer) gemmes for den aktuelle projektion, så et
// periodeskift kun farver pixlerne om. Celler uden data (fx Arktis før 1950)
// bliver grå. Modulets beregninger bruger ikke DOM, så de kan testes i node.

export const NX = 180, NY = 90, CELLE = 2;
export const ORDEN = 0;
export const AFLAESNING = '#temperaturaflaesning';
export const GRUNDLAG = '1951–1980';
const INGEN = -32768;

// °C i forhold til 1951–1980. ColorBrewer RdBu: blå er koldere, rød varmere;
// den hvide klasse om 0 er »som i 1951–1980«.
export const KLASSER = [
  [-Infinity, '#2166ac'], [-1, '#4393c3'], [-.5, '#92c5de'], [-.2, '#f7f7f7'], [.2, '#fddbc7'],
  [.5, '#f4a582'], [1, '#d6604d'], [1.5, '#b2182b'], [2, '#67001f'], [3, '#3b0011']
].map(([fra, farve], i, alle) => ({ fra, til: alle[i + 1]?.[0] ?? null, farve }));
export const INGEN_DATA = '#c9c6bd';
export function klasseFor(t) {
  let k = 0;
  while (k < KLASSER.length - 1 && t >= KLASSER[k + 1].fra) k++;
  return k;
}

// Filen (efter gunzip): 'TMP1', bredde, højde, antal perioder (uint16), perioderne
// som par af uint16, derefter int16 i hundrededele °C (−32768 = ingen data).
export function afkod(bytes) {
  const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const np = v.getUint16(8, true);
  const start = 10 + 4 * np;
  if (String.fromCharCode(...bytes.subarray(0, 4)) !== 'TMP1' || v.getUint16(4, true) !== NX ||
      v.getUint16(6, true) !== NY || np < 2 || bytes.length !== start + 2 * np * NX * NY) {
    throw new Error('Temperaturdata er ugyldige eller ufuldstændige');
  }
  const perioder = Array.from({ length: np }, (_, i) => [v.getUint16(10 + 4 * i, true), v.getUint16(12 + 4 * i, true)]);
  const d = new Float32Array(np * NX * NY);
  for (let i = 0; i < d.length; i++) {
    const r = v.getInt16(start + 2 * i, true);
    d[i] = r === INGEN ? NaN : r / 100;
    if (Math.abs(d[i]) > 20) throw new Error('Temperaturdata er ugyldige');
  }
  return { perioder, d };
}

let data = null, henter = null;
export const hentede = () => data;
export function brugData(x) { data = x; }
export const tilstand = { periode: 0 };

export function hent() {
  if (data) return Promise.resolve(data);
  henter ??= (async () => {
    if (typeof DecompressionStream === 'undefined') throw new Error('Browseren kan ikke pakke data ud');
    const svar = await fetch(new URL('./data/temperatur.bin', import.meta.url), { signal: AbortSignal.timeout(20000) });
    if (!svar.ok) throw new Error('Temperaturdata kunne ikke indlæses');
    const ud = svar.body.pipeThrough(new DecompressionStream('gzip'));
    data = afkod(new Uint8Array(await new Response(ud).arrayBuffer()));
    tilstand.periode = data.perioder.length - 1;   // start i den seneste periode
    return data;
  })().catch(fejl => { henter = null; throw fejl; });
  return henter;
}

export const periodenavn = (i, d = data) => {
  const [fra, til] = d.perioder[i];
  return `${fra}–${til}`;
};

// Arealvægtet middel over cellerne med data (cos(bredde)).
export function globaltMiddel(i, d = data) {
  let sum = 0, vaegt = 0;
  for (let y = 0; y < NY; y++) {
    const w = Math.cos((89 - 2 * y) * Math.PI / 180);
    for (let x = 0; x < NX; x++) {
      const t = d.d[i * NX * NY + y * NX + x];
      if (!Number.isNaN(t)) { sum += t * w; vaegt += w; }
    }
  }
  return sum / vaegt;
}

// Cellen og vægtene for et punkt: bilineær mellem de fire nærmeste cellemidter.
// Cellemidterne ligger i −179 … 179° og 89 … −89°.
function celle(lon, lat) {
  let x = (lon + 179) / CELLE, y = (89 - lat) / CELLE;
  if (y < 0) y = 0; else if (y > NY - 1) y = NY - 1;
  const x0 = Math.floor(x), y0 = Math.min(NY - 2, Math.floor(y));
  return { x0: (x0 % NX + NX) % NX, y0, fx: x - x0, fy: y - y0 };
}
// Mangler en af de fire celler, bruges den nærmeste, så kanten mod »ingen data« er skarp.
function interpoler(g, o, x0, y0, fx, fy) {
  const x1 = x0 + 1 === NX ? 0 : x0 + 1;
  const a = g[o + y0 * NX + x0], b = g[o + y0 * NX + x1], c = g[o + (y0 + 1) * NX + x0], e = g[o + (y0 + 1) * NX + x1];
  if (Number.isNaN(a + b + c + e)) return fy < .5 ? (fx < .5 ? a : b) : (fx < .5 ? c : e);
  return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + e * fx) * fy;
}
export function tI(lon, lat, periode = tilstand.periode, d = data) {
  if (!d) return null;
  const { x0, y0, fx, fy } = celle(lon, lat);
  const t = interpoler(d.d, periode * NX * NY, x0, y0, fx, fy);
  return Number.isNaN(t) ? null : t;
}

// ---------- Tegning på globussen ----------

const RGB = [...KLASSER.map(k => k.farve), INGEN_DATA].map(f => [1, 3, 5].map(i => parseInt(f.slice(i, i + 2), 16)));

// Ortografisk projektion baglæns for hver pixel (samme formler som nedboer.js).
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

// Farver pixlerne for perioden; klassegrænser får en svag, mørk kant, så farven
// ikke er eneste signal om grænsen.
export function farvTil(ud, geo, periode, d = data, linjer = true) {
  const { w, h, x0, y0, fx, fy } = geo;
  const o = periode * NX * NY, ingen = KLASSER.length;
  const klasse = new Int8Array(w * h).fill(-1);
  for (let n = 0; n < w * h; n++) {
    if (x0[n] === 255) continue;
    const t = interpoler(d.d, o, x0[n], y0[n], fx[n], fy[n]);
    const k = Number.isNaN(t) ? ingen : klasseFor(t);
    klasse[n] = k;
    const farve = RGB[k], p = 4 * n;
    ud[p] = farve[0]; ud[p + 1] = farve[1]; ud[p + 2] = farve[2]; ud[p + 3] = 255;
  }
  if (!linjer) return klasse;
  for (let j = 0; j < h - 1; j++) {
    for (let i = 0; i < w - 1; i++) {
      const n = j * w + i, c = klasse[n];
      if (c < 0) continue;
      const hoejre = klasse[n + 1], under = klasse[n + w];
      if ((hoejre >= 0 && hoejre !== c) || (under >= 0 && under !== c)) {
        const p = 4 * n;
        ud[p] *= .78; ud[p + 1] *= .78; ud[p + 2] *= .78;
      }
    }
  }
  return klasse;
}

let cache = null, sidstFlyttet = 0, efterTimer = 0, sidsteProjektion = null;

// Mens kloden drejes, bruges en grov geometri, og en skarp følger, når den har
// stået stille et øjeblik.
export function tegnFlade(ctx, { projektion, centrum, skala, bredde, hoejde, gentegn }) {
  if (!data) return;
  sidsteProjektion = projektion;
  const noegle = `${centrum[0]},${centrum[1]},${skala},${bredde},${hoejde}`;
  const nu = performance.now();
  const flyttet = cache?.noegle !== noegle;
  const groft = flyttet ? nu - sidstFlyttet < 150 : cache.groft;
  if (flyttet) sidstFlyttet = nu;
  const faktor = groft ? .4 : Math.min(1.25, ctx.getTransform().a || 1);
  const w = Math.max(1, Math.ceil(bredde * faktor)), h = Math.max(1, Math.ceil(hoejde * faktor));
  if (flyttet || cache.faktor !== faktor) {
    const laerred = cache?.laerred.width === w && cache.laerred.height === h ? cache.laerred : Object.assign(document.createElement('canvas'), { width: w, height: h });
    cache = { noegle, groft, faktor, laerred, geo: geometri(w, h, { centrum, skala: skala * faktor, cx: bredde / 2 * faktor, cy: hoejde / 2 * faktor }), vist: null };
  }
  if (cache.vist !== tilstand.periode) {
    const lc = cache.laerred.getContext('2d');
    cache.billede ??= lc.createImageData(w, h);
    farvTil(cache.billede.data, cache.geo, tilstand.periode, data, !groft);
    lc.putImageData(cache.billede, 0, 0);
    cache.vist = tilstand.periode;
  }
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(cache.laerred, 0, 0, bredde, hoejde);
  ctx.restore();
  clearTimeout(efterTimer);
  if (groft && gentegn) efterTimer = setTimeout(() => { if (cache) cache.noegle = null; sidstFlyttet = 0; gentegn(); }, 180);
}

// Ækvator og polarcirkler over rasteret: Arktis opvarmes hurtigst.
export function tegn(ctx, { projektion }) {
  if (!data) return;
  const sti = window.d3.geoPath(projektion, ctx);
  const kreds = b => ({ type: 'LineString', coordinates: Array.from({ length: 73 }, (_, i) => [-180 + 5 * i, b]) });
  ctx.save();
  ctx.beginPath(); sti(kreds(0)); ctx.strokeStyle = '#17211fb3'; ctx.lineWidth = 1.1; ctx.stroke();
  ctx.setLineDash([2, 4]);
  ctx.beginPath(); sti(kreds(66.56)); sti(kreds(-66.56)); ctx.strokeStyle = '#17211f99'; ctx.lineWidth = 1; ctx.stroke();
  ctx.restore();
}

export const tekst = t => `${t > 0 ? '+' : t < 0 ? '−' : ''}${Math.abs(t).toLocaleString('da-DK', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} °C`;
export function aflaes(xy) {
  const p = sidsteProjektion?.invert(xy);
  const t = p && Number.isFinite(p[0]) ? tI(p[0], p[1]) : null;
  return t == null ? `ingen data i ${periodenavn(tilstand.periode)}` : `${tekst(t)} i ${periodenavn(tilstand.periode)} i forhold til ${GRUNDLAG}`;
}
