// NCEP/NCAR månedlig lufttemperatur, 1991–2020. Raster som nedboer.js.
export const NX = 144, NY = 72, CELLE = 2.5;
export const ORDEN = 0;
export const AFLAESNING = '#middelaflaesning';
export const MAANEDER = ['januar', 'februar', 'marts', 'april', 'maj', 'juni', 'juli',
  'august', 'september', 'oktober', 'november', 'december'];

export const KLASSER = [
  [-90, '#542788'], [-30, '#8073ac'], [-20, '#4393c3'], [-10, '#92c5de'],
  [0, '#d1e5f0'], [10, '#fee090'], [20, '#fdae61'], [30, '#d73027'], [40, '#800026']
].map(([fra, farve], i, alle) => ({ fra, til: alle[i + 1]?.[0] ?? null, farve }));
export function klasseFor(mm) {
  let k = 0;
  while (k < KLASSER.length - 1 && mm >= KLASSER[k + 1].fra) k++;
  return k;
}

const DAG15 = [15, 46, 74, 105, 135, 166, 196, 227, 258, 288, 319, 349];
export function zenitbredde(maaned) {
  const g = 2 * Math.PI * (DAG15[maaned] - 1) / 365;
  const d = .006918 - .399912 * Math.cos(g) + .070257 * Math.sin(g) - .006758 * Math.cos(2 * g) +
    .000907 * Math.sin(2 * g) - .002697 * Math.cos(3 * g) + .00148 * Math.sin(3 * g);
  return d * 180 / Math.PI;
}

export function afkod(bytes) {
  const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (bytes.length !== 10 + 2 * 12 * NX * NY || String.fromCharCode(...bytes.subarray(0, 4)) !== 'MTM1' ||
      v.getUint16(4, true) !== NX || v.getUint16(6, true) !== NY || v.getUint16(8, true) !== 12) {
    throw new Error('Temperaturdata er ugyldige eller ufuldstændige');
  }
  const d = new Float32Array(12 * NX * NY);
  for (let i = 0; i < d.length; i++) {
    d[i] = v.getInt16(10 + 2 * i, true) / 10;
    if (d[i] < -90 || d[i] > 65) throw new Error('Temperaturdata er ugyldige');
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
    const svar = await fetch(new URL('./data/middeltemperatur.bin', import.meta.url), { signal: AbortSignal.timeout(20000) });
    if (!svar.ok) throw new Error('Temperaturdata kunne ikke indlæses');
    const ud = svar.body.pipeThrough(new DecompressionStream('gzip'));
    gitter = afkod(new Uint8Array(await new Response(ud).arrayBuffer()));
    return gitter;
  })().catch(fejl => { henter = null; throw fejl; });
  return henter;
}

function celle(lon, lat) {
  let x = (lon + 178.75) / CELLE, y = (88.75 - lat) / CELLE;
  if (y < 0) y = 0; else if (y > NY - 1) y = NY - 1;
  const x0 = Math.floor(x), y0 = Math.min(NY - 2, Math.floor(y));
  return { x0: (x0 % NX + NX) % NX, y0, fx: x - x0, fy: y - y0 };
}

export function tI(lon, lat, maaned, d = gitter) {
  if (!d) return null;
  const { x0, y0, fx, fy } = celle(lon, lat);
  const x1 = (x0 + 1) % NX, o = maaned * NX * NY;
  const a = d[o + y0 * NX + x0], b = d[o + y0 * NX + x1], c = d[o + (y0 + 1) * NX + x0], e = d[o + (y0 + 1) * NX + x1];
  return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + e * fx) * fy;
}
export function aaretI(lon, lat, d = gitter) {
  return Array.from({ length: 12 }, (_, m) => tI(lon, lat, m, d));
}


export const tilstand = { maaned: 0, fra: 0, t: 1, vist: 0, zenit: false, spiller: false };
export function saetMaaned(maaned, fra = maaned, t = 1) {
  Object.assign(tilstand, { maaned, fra, t, vist: t < .5 ? fra : maaned });
}
export function zenitNu({ maaned, fra, t } = tilstand) {
  const a = zenitbredde(fra), b = zenitbredde(maaned);
  return a + (b - a) * t;
}


const RGB = KLASSER.map(k => [1, 3, 5].map(i => parseInt(k.farve.slice(i, i + 2), 16)));
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
    const k = klasseFor(mm);
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

export function tegnFlade(ctx, { projektion, centrum, skala, bredde, hoejde, gentegn }) {
  if (!gitter) return;
  sidsteProjektion = projektion;
  const noegle = `${centrum[0]},${centrum[1]},${skala},${bredde},${hoejde}`;
  const nu = performance.now();
  const flyttet = cache?.noegle !== noegle;
  const groft = flyttet ? nu - sidstFlyttet < 150 : cache.groft;
  if (flyttet) sidstFlyttet = nu;
  const taethed = Math.min(1.25, ctx.getTransform().a || 1);
  const faktor = groft ? .4 : tilstand.spiller ? Math.min(taethed, .75) : taethed;
  const w = Math.max(1, Math.ceil(bredde * faktor)), h = Math.max(1, Math.ceil(hoejde * faktor));
  if (flyttet || cache.faktor !== faktor) {
    const laerred = cache?.laerred.width === w && cache.laerred.height === h ? cache.laerred : Object.assign(document.createElement('canvas'), { width: w, height: h });
    cache = { noegle, groft, faktor, laerred, geo: geometri(w, h, { centrum, skala: skala * faktor, cx: bredde / 2 * faktor, cy: hoejde / 2 * faktor }), vist: null };
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
    const b = zenitNu();
    ctx.setLineDash([9, 5]); ctx.lineCap = 'round';
    ctx.beginPath(); sti(kreds(b)); ctx.strokeStyle = '#fff9ee'; ctx.lineWidth = 4.5; ctx.stroke();
    ctx.beginPath(); sti(kreds(b)); ctx.strokeStyle = '#d9480f'; ctx.lineWidth = 2.2; ctx.stroke();
  }
  ctx.restore();
}

export let lyt = null;
export function lytTil(fn) { lyt = fn; }
export const temperaturTekst = t => `${t.toLocaleString('da-DK', {maximumFractionDigits: 1})} °C`;
export function beskriv(aaret, maaned) {
  return aaret ? `${temperaturTekst(aaret[maaned])} i ${MAANEDER[maaned]}` : 'ingen data';
}
export let aflaestPunkt = null;
export function aflaes(xy) {
  const p = sidsteProjektion?.invert(xy);
  aflaestPunkt = p && Number.isFinite(p[0]) ? p : null;
  const aaret = p && Number.isFinite(p[0]) ? aaretI(p[0], p[1]) : null;
  lyt?.(aaret, tilstand.vist);
  return beskriv(aaret, tilstand.vist);
}
