// NASA POWER årsnormal 2001–2020. Sol: CERES; vind: MERRA-2, 50 m højde.
// Et globalt oversigtskort i 1° celler, ikke en lokal anlægsberegning.
import { farver, klasser, klasseFor, vaerditekst, INGEN_DATA } from './temakort.js';
export { klasser, vaerditekst, INGEN_DATA };
export const AFLAESNING = '#potentialeaflaesning', ORDEN = 0;
export const valg = { maal: 'sol' };
export const MAAL = {
  sol: { navn: 'Solindstråling', enhed: 'kWh/m²/døgn', decimaler: 1, graenser: [2, 3, 4, 5, 6],
    forklaring: 'Solenergi på en vandret flade, inkl. skyer. Årsmiddel 2001–2020; 1° celler.' },
  vind: { navn: 'Vindpotentiale', enhed: 'm/s i 50 m højde', decimaler: 1, graenser: [3, 5, 7, 9, 11],
    forklaring: 'Middelvind i 50 m højde. Årsmiddel 2001–2020; vist i 1° celler. Terræn og lokale læforhold er ikke opløst.' }
};
for (const m of Object.values(MAAL)) m.farver = farver(m);
export const indikator = () => MAAL[valg.maal];
let data, henter, projektion;
export function afkod(bytes) {
  const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (bytes.length !== 8 + 360 * 180 * 4 || String.fromCharCode(...bytes.slice(0, 4)) !== 'RES1' || v.getUint16(4, true) !== 360 || v.getUint16(6, true) !== 180) throw Error('Ugyldige potentialedata');
  return Float32Array.from({ length: 360 * 180 * 2 }, (_, i) => {
    const tal = v.getUint16(8 + i * 2, true);
    if (tal !== 65535 && tal > 6000) throw Error('Ugyldig ressourceværdi');
    return tal === 65535 ? NaN : tal / 100;
  });
}
export async function hent() {
  henter ??= (async () => {
    const r = await fetch(new URL('./data/potentiale.bin', import.meta.url), { signal: AbortSignal.timeout(20000) });
    if (!r.ok) throw Error('Potentialedata kunne ikke hentes');
    return afkod(new Uint8Array(await new Response(r.body.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer()));
  })().catch(e => { henter = null; throw e; });
  data = await henter; return data;
}
export function celle(lon, lat) {
  if (!Number.isFinite(lon) || !Number.isFinite(lat) || Math.abs(lat) > 90) return -1;
  return Math.min(179, Math.floor(90 - lat)) * 360 + Math.floor(((lon + 180) % 360 + 360) % 360);
}
export function vaerdi(lon, lat, maal = valg.maal, d = data) {
  const i = celle(lon, lat);
  const v = i < 0 ? null : d?.[i + (maal === 'vind' ? 64800 : 0)];
  return v == null || Number.isNaN(v) ? null : v;
}
// Inverter ortografisk projektion én gang pr. skærmcelle og genbrug ved målskift.
export function geometri(w, h, { centrum, skala, cx, cy }) {
  const rad = Math.PI / 180, p0 = centrum[1] * rad, l0 = centrum[0] * rad;
  const sp = Math.sin(p0), cp = Math.cos(p0), celler = new Int32Array(w * h).fill(-1);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const u = (x + .5 - cx) / skala, v = (cy - y - .5) / skala, q = u * u + v * v;
    if (q > 1) continue;
    const z = Math.sqrt(1 - q);
    celler[y * w + x] = celle((l0 + Math.atan2(u, z * cp - v * sp)) / rad, Math.asin(v * cp + z * sp) / rad);
  }
  return celler;
}
let cache, timer, sidst = 0;
export function tegnFlade(ctx, { projektion: p, centrum, skala, bredde, hoejde, gentegn }) {
  if (!data || bredde <= 0 || hoejde <= 0 || !Number.isFinite(skala) || skala <= 0) return;
  projektion = p;
  const key = `${centrum},${skala},${bredde},${hoejde}`, nu = performance.now();
  const flyttet = cache?.key !== key, groft = flyttet ? nu - sidst < 150 : cache.groft;
  if (flyttet) sidst = nu;
  const faktor = groft ? .35 : 1;
  if (flyttet || cache.faktor !== faktor) {
    const w = Math.ceil(bredde * faktor), h = Math.ceil(hoejde * faktor);
    const c = Object.assign(document.createElement('canvas'), { width: w, height: h });
    cache = { key, faktor, groft, c, celler: geometri(w, h, { centrum, skala: skala * faktor, cx: bredde * faktor / 2, cy: hoejde * faktor / 2 }) };
  }
  if (cache.maal !== valg.maal) {
    const lc = cache.c.getContext('2d'), billede = lc.createImageData(cache.c.width, cache.c.height), ind = indikator();
    const rgb = [...ind.farver, INGEN_DATA].map(f => [1, 3, 5].map(i => parseInt(f.slice(i, i + 2), 16)));
    const offset = valg.maal === 'vind' ? 64800 : 0;
    cache.celler.forEach((i, n) => {
      if (i < 0) return;
      const k = klasseFor(ind, data[i + offset]), f = rgb[k < 0 ? ind.farver.length : k];
      billede.data.set([...f, 255], n * 4);
    });
    lc.putImageData(billede, 0, 0); cache.maal = valg.maal;
  }
  ctx.drawImage(cache.c, 0, 0, bredde, hoejde);
  clearTimeout(timer);
  if (groft) timer = setTimeout(() => { cache.key = null; sidst = 0; gentegn(); }, 180);
}
export function tegn() {} // Fladen tegnes før kystlinjer og øvrige punktlag.
export function aflaes(xy) {
  const p = projektion?.invert(xy), ind = indikator();
  return `${ind.navn}: ${vaerditekst(ind, p ? vaerdi(...p) : null)} · 2001–2020`;
}
