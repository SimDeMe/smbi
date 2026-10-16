// Havbundens alder: Seton m.fl. (2020), EarthBytes aldersgitter. Dannes af
// data/havbundsalder.py; se data/havbundsalder.LICENSE. Alderen er en
// rekonstruktion ud fra magnetiske striber og pladerekonstruktion – ikke en
// datering af hvert punkt.
//
// Laget tegnes som et raster under landfladerne: For hver skærmpixel regnes
// den ortografiske projektion baglæns til længde og bredde, og alderen slås op
// i gitteret (bilineær interpolation). Profilen (linje, ryg og markør) tegnes
// oven på kortet. Modulets beregninger bruger ikke DOM, så de kan testes i node.

export const NX = 1800, NY = 900, CELLE = 0.2, TRIN = 5;
export const ORDEN = 0;
export const AFLAESNING = '#havbundaflaesning';
const R_JORD = 6371;

// 20 mio. år pr. klasse, rød ved ryggen og violet længst væk (ColorBrewer
// Spectral, 11 klasser). Farven er aldrig eneste signal: aflæsningen og
// profilen giver tallet, og klassegrænserne tegnes som tynde linjer (isokroner).
export const KLASSER = ['#9e0142', '#d53e4f', '#f46d43', '#fdae61', '#fee08b', '#ffffbf',
  '#e6f598', '#abdda4', '#66c2a5', '#3288bd', '#5e4fa2'].map((farve, i) =>
  ({ fra: 20 * i, til: i === 10 ? null : 20 * (i + 1), farve }));
export const INGEN = '#cdd5d3';
export const klasseFor = alder => Math.min(10, Math.floor(alder / 20));

// Geologisk tid efter GTS2012, som gitteret bruger.
const TID = [
  [2.588, 'kvartær'], [5.333, 'pliocæn (neogen)'], [23.03, 'miocæn (neogen)'],
  [33.9, 'oligocæn (palæogen)'], [56.0, 'eocæn (palæogen)'], [66.0, 'palæocæn (palæogen)'],
  [100.5, 'sen kridt'], [145.0, 'tidlig kridt'], [201.3, 'jura'], [252.2, 'trias'],
  [298.9, 'perm'], [358.9, 'karbon']
];
export function periode(alder) {
  return (TID.find(([graense]) => alder < graense) || [0, 'devon eller ældre'])[1];
}

export function aldertekst(alder) {
  if (alder === null) return 'ingen havbundsalder';
  const tal = alder < 10 ? alder.toLocaleString('da-DK', { maximumFractionDigits: 1 }) : Math.round(alder).toLocaleString('da-DK');
  return `${tal} mio. år`;
}

export function beskriv(alder) {
  return alder === null
    ? 'ingen havbundsalder (kontinent, sokkel eller ingen data)'
    : `havbund ${aldertekst(alder)} gammel – ${periode(alder)}`;
}

// Filen (efter gunzip): 'HBA1', bredde, højde (uint16), derefter int16-forskelle
// række for række. Resultatet er k = 5·alder + 1, 0 = ingen alder.
export function afkod(bytes) {
  const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (bytes.length !== 8 + 2 * NX * NY || String.fromCharCode(...bytes.subarray(0, 4)) !== 'HBA1' ||
      v.getUint16(4, true) !== NX || v.getUint16(6, true) !== NY) {
    throw new Error('Havbundsdata er ugyldige eller ufuldstændige');
  }
  const k = new Uint16Array(NX * NY);
  for (let y = 0; y < NY; y++) {
    let sum = 0;
    for (let x = 0; x < NX; x++) {
      sum += v.getInt16(8 + 2 * (y * NX + x), true);
      if (sum < 0 || sum > 2000) throw new Error('Havbundsdata er ugyldige');
      k[y * NX + x] = sum;
    }
  }
  return k;
}

let gitter = null;
let henter = null;
export const data = () => gitter;
export function brugGitter(k) { gitter = k; }

export function hent() {
  if (gitter) return Promise.resolve(gitter);
  henter ??= (async () => {
    if (typeof DecompressionStream === 'undefined') throw new Error('Browseren kan ikke pakke data ud');
    const svar = await fetch(new URL('./data/havbundsalder.bin', import.meta.url), { signal: AbortSignal.timeout(20000) });
    if (!svar.ok) throw new Error('Havbundsdata kunne ikke indlæses');
    const ud = svar.body.pipeThrough(new DecompressionStream('gzip'));
    gitter = afkod(new Uint8Array(await new Response(ud).arrayBuffer()));
    return gitter;
  })().catch(fejl => { henter = null; throw fejl; });
  return henter;
}

// Alder (mio. år) i et punkt; null uden havbundsalder. Bilineær mellem de fire
// nærmeste cellemidter; mangler én af dem (ved kysten), bruges den nærmeste.
export function alderI(lon, lat, k = gitter) {
  if (!k) return null;
  let x = (lon + 180) / CELLE - .5, y = (90 - lat) / CELLE - .5;
  if (y < 0) y = 0; else if (y > NY - 1) y = NY - 1;
  const x0 = Math.floor(x), y0 = Math.min(NY - 2, Math.floor(y));
  const fx = x - x0, fy = y - y0;
  const xa = (x0 % NX + NX) % NX, xb = (xa + 1) % NX;
  const a = k[y0 * NX + xa], b = k[y0 * NX + xb], c = k[(y0 + 1) * NX + xa], d = k[(y0 + 1) * NX + xb];
  if (a && b && c && d) {
    const v = (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy;
    return (v - 1) / TRIN;
  }
  const naermest = fy < .5 ? (fx < .5 ? a : b) : (fx < .5 ? c : d);
  return naermest ? (naermest - 1) / TRIN : null;
}

// Storcirkel fra a til b ([lon, lat]) i n trin: punkter med afstand fra a (km) og alder.
export function profil(a, b, n = 360, k = gitter) {
  const r = Math.PI / 180;
  const [l1, p1, l2, p2] = [a[0] * r, a[1] * r, b[0] * r, b[1] * r];
  const vinkel = 2 * Math.asin(Math.sqrt(Math.sin((p2 - p1) / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin((l2 - l1) / 2) ** 2));
  const punkter = [];
  for (let i = 0; i <= n; i++) {
    const f = i / n;
    const A = vinkel ? Math.sin((1 - f) * vinkel) / Math.sin(vinkel) : 1 - f, B = vinkel ? Math.sin(f * vinkel) / Math.sin(vinkel) : f;
    const x = A * Math.cos(p1) * Math.cos(l1) + B * Math.cos(p2) * Math.cos(l2);
    const y = A * Math.cos(p1) * Math.sin(l1) + B * Math.cos(p2) * Math.sin(l2);
    const z = A * Math.sin(p1) + B * Math.sin(p2);
    const lon = Math.atan2(y, x) / r, lat = Math.atan2(z, Math.hypot(x, y)) / r;
    punkter.push({ punkt: [lon, lat], km: f * vinkel * R_JORD, alder: alderI(lon, lat, k) });
  }
  // Ryggen er profilens yngste punkt – men kun, hvis havbunden dér er under
  // 5 mio. år; ellers krydser profilen ingen spredningsryg.
  let ryg = null;
  punkter.forEach((p, i) => { if (p.alder !== null && (ryg === null || p.alder < punkter[ryg].alder)) ryg = i; });
  if (ryg !== null && punkter[ryg].alder > 5) ryg = null;
  return { punkter, laengde: vinkel * R_JORD, ryg };
}

// Gennemsnitlig halv spredningshastighed fra ryggen til punktet i cm/år:
// afstand (km) / alder (mio. år) · 0,1, da 1 km pr. mio. år = 0,1 cm/år.
// Ryggens egen alder i gitteret (under 5 mio. år, pga. cellestørrelsen) trækkes
// ikke fra: Som i lærebøgerne er alderen ved ryggen 0.
export function hastighed(prof, i) {
  const p = prof.punkter[i], ryg = prof.punkter[prof.ryg];
  if (prof.ryg === null || p.alder === null) return null;
  const km = Math.abs(p.km - ryg.km), alder = p.alder;
  if (km < 150 || alder < 2) return { km, alder, cm: null };
  return { km, alder, cm: km / alder / 10 };
}

// Faste profiler på tværs af ryggene. Endepunkterne ligger ved eller på
// kontinenterne, så profilen dækker hele havbunden mellem dem.
export const PROFILER = [
  { id: 'sydatlanten', navn: 'Sydatlanten', fra: [-50, -32], til: [17, -32], ender: ['mod Brasilien', 'mod Sydafrika'] },
  { id: 'nordatlanten', navn: 'Nordatlanten', fra: [-77, 26], til: [-15, 22], ender: ['Bahamas', 'Vestafrika'] },
  { id: 'reykjanes', navn: 'Reykjanesryggen syd for Island', fra: [-40, 59], til: [-14, 61], ender: ['mod Grønland', 'mod Rockall'] },
  { id: 'oestpacifik', navn: 'Østpacifiske Ryg', fra: [-150, -18], til: [-72, -18], ender: ['Fransk Polynesien', 'Peru'] },
  { id: 'indiske', navn: 'Det Sydøstindiske Ocean', fra: [125, -36], til: [125, -64], ender: ['Australien', 'Antarktis'] }
];

// ---------- Tegning på globussen ----------

let valgt = null;          // { prof, markoer } – profilen, der vises
let sidstTegnet = 0, cache = null, efterTimer = 0, sidsteProjektion = null;
export function visProfil(prof, markoer) { valgt = prof ? { prof, markoer } : null; }

const RGB = KLASSER.map(k => [1, 3, 5].map(i => parseInt(k.farve.slice(i, i + 2), 16)));
const RGB_INGEN = [1, 3, 5].map(i => parseInt(INGEN.slice(i, i + 2), 16));

// Rasteret under landfladerne. Under bevægelse tegnes et groft billede, og et
// skarpt følger, når kloden har stået stille et øjeblik.
export function tegnUnder(ctx, { projektion, centrum, skala, bredde, hoejde, gentegn }) {
  if (!gitter) return;
  sidsteProjektion = projektion;
  const noegle = `${centrum[0]},${centrum[1]},${skala},${bredde},${hoejde}`;
  const nu = performance.now();
  if (cache?.noegle === noegle && cache.skarp) { ctx.drawImage(cache.laerred, 0, 0, bredde, hoejde); return; }
  const groft = cache?.noegle !== noegle && nu - sidstTegnet < 150;
  sidstTegnet = nu;
  const taethed = Math.min(1.25, ctx.getTransform().a || 1);
  const faktor = groft ? .4 : taethed;
  const w = Math.max(1, Math.ceil(bredde * faktor)), h = Math.max(1, Math.ceil(hoejde * faktor));
  const laerred = cache?.laerred.width === w && cache.laerred.height === h ? cache.laerred : Object.assign(document.createElement('canvas'), { width: w, height: h });
  const lc = laerred.getContext('2d');
  const billede = lc.createImageData(w, h);
  rasterTil(billede.data, w, h, { centrum, skala: skala * faktor, cx: bredde / 2 * faktor, cy: hoejde / 2 * faktor, linjer: !groft });
  lc.putImageData(billede, 0, 0);
  cache = { noegle, skarp: !groft, laerred };
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(laerred, 0, 0, bredde, hoejde);
  ctx.restore();
  clearTimeout(efterTimer);
  if (groft && gentegn) efterTimer = setTimeout(gentegn, 180);
}

// Ortografisk projektion baglæns for hver pixel. Samme formler som D3's
// geoOrthographic med rotate([-λ0, -φ0]); testen kontrollerer det.
export function rasterTil(ud, w, h, { centrum, skala, cx, cy, linjer, k = gitter }) {
  const r = Math.PI / 180;
  const l0 = centrum[0] * r, p0 = centrum[1] * r, sp = Math.sin(p0), cp = Math.cos(p0);
  const klasse = new Int8Array(w * h).fill(-2);
  for (let j = 0; j < h; j++) {
    const v = (cy - j - .5) / skala;
    for (let i = 0; i < w; i++) {
      const u = (i + .5 - cx) / skala;
      const rho2 = u * u + v * v;
      if (rho2 > 1) continue;
      const z = Math.sqrt(1 - rho2);
      const lat = Math.asin(v * cp + z * sp) / r;
      const lon = (l0 + Math.atan2(u, z * cp - v * sp)) / r;
      const a = alderI(((lon + 540) % 360) - 180, lat, k);
      const c = a === null ? -1 : klasseFor(a);
      klasse[j * w + i] = c;
      const farve = c < 0 ? RGB_INGEN : RGB[c];
      const o = 4 * (j * w + i);
      ud[o] = farve[0]; ud[o + 1] = farve[1]; ud[o + 2] = farve[2]; ud[o + 3] = 255;
    }
  }
  if (!linjer) return klasse;
  // Isokroner: mørk kant, hvor klassen skifter (ikke mod kontinentet).
  for (let j = 0; j < h - 1; j++) {
    for (let i = 0; i < w - 1; i++) {
      const c = klasse[j * w + i];
      if (c < 0) continue;
      const hoejre = klasse[j * w + i + 1], under = klasse[(j + 1) * w + i];
      if ((hoejre >= 0 && hoejre !== c) || (under >= 0 && under !== c)) {
        const o = 4 * (j * w + i);
        ud[o] *= .45; ud[o + 1] *= .45; ud[o + 2] *= .45;
      }
    }
  }
  return klasse;
}

// Profilen oven på kortet: linje, km-mærker for hver 500 km, ryg og markør.
export function tegn(ctx, { projektion, centrum }) {
  if (!valgt) return;
  const d3 = window.d3;
  const synlig = p => d3.geoDistance(centrum, p) < Math.PI / 2 - .01;
  const { prof, markoer } = valgt;
  ctx.save();
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (const [bredde, farve] of [[5, '#fff9ee'], [2.2, '#17211f']]) {
    ctx.beginPath();
    let i = false;
    for (const p of prof.punkter) {
      if (!synlig(p.punkt)) { i = false; continue; }
      const [x, y] = projektion(p.punkt);
      if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
      i = true;
    }
    ctx.lineWidth = bredde; ctx.strokeStyle = farve; ctx.stroke();
  }
  // Mærker for hver 500 km fra ryggen (ellers fra starten).
  const nul = prof.ryg !== null ? prof.punkter[prof.ryg].km : 0;
  let forrige = null;
  for (const p of prof.punkter) {
    const trin = Math.floor((p.km - nul) / 500 + 1e-9);
    if (forrige !== null && trin !== forrige && synlig(p.punkt)) {
      const [x, y] = projektion(p.punkt);
      ctx.beginPath(); ctx.arc(x, y, 2.6, 0, 2 * Math.PI);
      ctx.fillStyle = '#fff9ee'; ctx.fill(); ctx.lineWidth = 1.2; ctx.strokeStyle = '#17211f'; ctx.stroke();
    }
    forrige = trin;
  }
  const ende = (p, tekst) => {
    if (!synlig(p.punkt)) return;
    const [x, y] = projektion(p.punkt);
    ctx.font = '700 12px Archivo, system-ui, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.beginPath(); ctx.arc(x, y, 8.5, 0, 2 * Math.PI);
    ctx.fillStyle = '#17211f'; ctx.fill();
    ctx.fillStyle = '#fff9ee'; ctx.fillText(tekst, x, y + .5);
  };
  ende(prof.punkter[0], 'A'); ende(prof.punkter.at(-1), 'B');
  if (prof.ryg !== null && synlig(prof.punkter[prof.ryg].punkt)) {
    const [x, y] = projektion(prof.punkter[prof.ryg].punkt);
    ctx.beginPath(); ctx.moveTo(x, y - 9); ctx.lineTo(x + 7, y + 5); ctx.lineTo(x - 7, y + 5); ctx.closePath();
    ctx.fillStyle = '#fff9ee'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#9e0142'; ctx.stroke();
  }
  const m = prof.punkter[markoer];
  if (m && synlig(m.punkt)) {
    const [x, y] = projektion(m.punkt);
    ctx.beginPath(); ctx.arc(x, y, 6.5, 0, 2 * Math.PI);
    ctx.fillStyle = '#fff9ee'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#7a4fd6'; ctx.stroke();
  }
  ctx.restore();
}

// Aflæsning ved et skærmpunkt (mus, eller sigtekornet midt på globussen).
export function aflaes(xy) {
  if (!sidsteProjektion) return beskriv(null);
  const p = sidsteProjektion.invert(xy);
  if (!p || !Number.isFinite(p[0])) return beskriv(null);
  return beskriv(alderI(p[0], p[1]));
}
