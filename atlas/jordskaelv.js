// Jordskælv M ≥ 5 fra USGS' ComCat-katalog, 1976–2025 (public domain).
// Data dannes af data/jordskaelv.py; se data/jordskaelv.LICENSE.
// Over 80 000 punkter: projektionen regnes her direkte (samme ortografiske
// formel som D3's geoOrthographic uden klipning), så en frame tager få ms.

export const DYBDER = [
  { id: 'lav', navn: 'Lavtliggende', interval: '0–70 km', fra: 0, farve: '#f26b38' },
  { id: 'mellem', navn: 'Mellemdybe', interval: '70–300 km', fra: 70, farve: '#b5307e' },
  { id: 'dyb', navn: 'Dybe', interval: 'over 300 km', fra: 300, farve: '#2a2f8f' }
];
export const ORDEN = 1;
export const AFLAESNING = '#skaelvaflaesning';

// Hvad der tegnes; ændres fra signaturen.
export const valg = { minM: 5, dybder: new Set(DYBDER.map(d => d.id)) };

let data = null;
let henter = null;
// Skærmpunkter fra seneste tegning (NaN = ikke tegnet) til aflæsningen.
let sx, sy;

const dybdeklasse = km => (km >= 300 ? 2 : km >= 70 ? 1 : 0);

function kontrollerData(raa) {
  const s = raa?.skaelv;
  if (!Array.isArray(s) || raa.start !== 1976 || s.length !== raa.antal * 5 || raa.antal < 50000) {
    throw new Error('Jordskælvsdata er ugyldige eller ufuldstændige');
  }
  for (let i = 0; i < s.length; i += 5) {
    const [lon, lat, dybde, m, aar] = [s[i], s[i + 1], s[i + 2], s[i + 3], s[i + 4]];
    if (!Number.isInteger(lon) || Math.abs(lon) > 1800 || !Number.isInteger(lat) || Math.abs(lat) > 900 ||
        !Number.isInteger(dybde) || dybde < 0 || dybde > 800 || !Number.isInteger(m) || m < 0 || m > 50 ||
        !Number.isInteger(aar) || aar < 0 || aar > 49) {
      throw new Error('Jordskælvsdata er ugyldige');
    }
  }
}

export function hent() {
  if (data) return Promise.resolve(data);
  henter ??= (async () => {
    const svar = await fetch(new URL('./data/jordskaelv.json', import.meta.url), { signal: AbortSignal.timeout(20000) });
    if (!svar.ok) throw new Error('Jordskælvsdata kunne ikke indlæses');
    const raa = await svar.json();
    kontrollerData(raa);
    const n = raa.antal, s = raa.skaelv, rad = Math.PI / 1800;
    const d = {
      antal: n, lon: new Float32Array(n), sinlat: new Float32Array(n), coslat: new Float32Array(n),
      dybde: new Uint16Array(n), m: new Uint8Array(n), aar: new Uint16Array(n),
      // Indeks pr. dybdeklasse; filen er sorteret efter magnitude, så de
      // største skælv i hver klasse tegnes øverst.
      klasser: [[], [], []]
    };
    for (let i = 0; i < n; i++) {
      const lat = s[i * 5 + 1] * rad;
      d.lon[i] = s[i * 5] * rad; d.sinlat[i] = Math.sin(lat); d.coslat[i] = Math.cos(lat);
      d.dybde[i] = s[i * 5 + 2]; d.m[i] = s[i * 5 + 3]; d.aar[i] = raa.start + s[i * 5 + 4];
      d.klasser[dybdeklasse(d.dybde[i])].push(i);
    }
    d.klasser = d.klasser.map(liste => Uint32Array.from(liste));
    sx = new Float32Array(n).fill(NaN); sy = new Float32Array(n).fill(NaN);
    data = d;
    return d;
  })().catch(fejl => { henter = null; throw fejl; });
  return henter;
}

// Antal skælv pr. dybdeklasse, til tekstalternativet.
export function optaelling() {
  return data ? DYBDER.map((dybde, k) => ({ ...dybde, antal: data.klasser[k].length })) : null;
}

// M 5 er en lille prik, M 9 en tydelig plet (radius i px ved normal zoom).
const radius = (m, faktor) => (0.6 + m * 0.13) * faktor;

// centrum i grader, skala = globussens radius i px.
export function tegn(ctx, { centrum, skala, bredde, hoejde }) {
  if (!data) return;
  const l0 = centrum[0] * Math.PI / 180, p0 = centrum[1] * Math.PI / 180;
  const sin0 = Math.sin(p0), cos0 = Math.cos(p0);
  const cx = bredde / 2, cy = hoejde / 2;
  const faktor = Math.sqrt(Math.max(.8, Math.min(4, skala / 220)));
  const minM = (valg.minM - 5) * 10;
  const { lon, sinlat, coslat, m } = data;
  sx.fill(NaN); sy.fill(NaN);
  ctx.save();
  ctx.globalAlpha = .82;
  DYBDER.forEach((dybde, k) => {
    if (!valg.dybder.has(dybde.id)) return;
    ctx.beginPath();
    for (const i of data.klasser[k]) {
      if (m[i] < minM) continue;
      const dl = lon[i] - l0, cosdl = Math.cos(dl);
      if (sin0 * sinlat[i] + cos0 * coslat[i] * cosdl <= 0) continue;
      const x = cx + skala * coslat[i] * Math.sin(dl);
      const y = cy - skala * (cos0 * sinlat[i] - sin0 * coslat[i] * cosdl);
      if (x < -8 || y < -8 || x > bredde + 8 || y > hoejde + 8) continue;
      const r = radius(m[i], faktor);
      // Små prikker som kvadrater: ser ens ud og er langt hurtigere at fylde.
      if (r < 1.2) ctx.rect(x - r, y - r, 2 * r, 2 * r);
      else { ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, 2 * Math.PI); }
      sx[i] = x; sy[i] = y;
    }
    ctx.fillStyle = dybde.farve; ctx.fill();
  });
  ctx.restore();
}

const tal = x => String(x).replace('.', ',');

// Det største tegnede skælv inden for få pixel af skærmpunktet xy.
export function aflaes([x, y]) {
  if (!data) return '';
  let bedst = -1, bedstM = -1, bedstAfstand = Infinity;
  for (let i = 0; i < data.antal; i++) {
    if (Number.isNaN(sx[i])) continue;
    const afstand = Math.hypot(sx[i] - x, sy[i] - y);
    if (afstand > 9) continue;
    if (data.m[i] > bedstM || (data.m[i] === bedstM && afstand < bedstAfstand)) {
      bedst = i; bedstM = data.m[i]; bedstAfstand = afstand;
    }
  }
  if (bedst < 0) return 'intet skælv lige her';
  const km = data.dybde[bedst];
  return `M ${tal((5 + data.m[bedst] / 10).toFixed(1))}, ${km} km dybt (${DYBDER[dybdeklasse(km)].navn.toLowerCase()}), ${data.aar[bedst]}`;
}
