// Fysikken bag «Find skælvet»: konstante farter i jordskorpen, S−P-metoden,
// cirkler fra stationerne og Richters lokale magnitude. Ingen DOM, så modulet
// kan testes i node (model.test.mjs).

// Farter i den øverste jordskorpe. vP/vS = 1,75 ligger tæt på værdien for
// almindelig granit og basalt (ca. 1,73–1,78) og giver en rund omregning:
// afstand = 8,0 km/s · (tS − tP).
export const VP = 6.0;
export const VP_VS = 1.75;
export const VS = VP / VP_VS;            // ≈ 3,43 km/s
export const VR = 0.92 * VS;             // overfladebølger (Rayleigh) ≈ 3,15 km/s
export const K = VP * VS / (VP - VS);    // = 8,0 km/s

// Afstand ud fra tidsforskellen: d/vS − d/vP = Δt  ⇒  d = Δt · vP·vS / (vP − vS).
export const afstandFraSP = dt => K * dt;

export function ankomster(d) {
  return { p: d / VP, s: d / VS, r: d / VR, sp: d / VS - d / VP };
}

// Lokal magnitude (Richter-skalaen) efter IASPEI's standardformel (Hutton & Boore 1987),
// omregnet til udslaget på en Wood-Anderson-seismograf som Richters:
// ML = log10(A) + 1,11·log10(d) + 0,00189·d + 0,59, hvor A er det største udslag i mm
// og d afstanden i km. Den gengiver Richters tabel fra 1935 (100 km → 3,0) og gælder
// op til ca. 600 km. (Den udbredte skoleformel 3·log10(8·Δt) − 2,92 afviger op til en
// halv enhed fra Richters tabel ved 200–300 km.)
export const magnitude = (A, d) => Math.log10(A) + 1.11 * Math.log10(d) + 0.00189 * d + 0.59;
export const amplitudeFor = (ML, d) => 10 ** (ML - 1.11 * Math.log10(d) - 0.00189 * d - 0.59);

// Gentagelig tilfældighed, så samme skælv giver samme seismogram.
export function rng(froe) {
  let a = froe >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Én bølgefase: en bunke sinusser omkring en midterfrekvens under en indhyldningskurve,
// der rejser sig hurtigt og klinger langsomt af (som en rigtig seismogramfase).
function fase(tilfaeldig, frekvens, antal = 6) {
  const led = [];
  for (let i = 0; i < antal; i++) {
    led.push({ f: frekvens * (0.7 + 0.6 * tilfaeldig()), fase: tilfaeldig() * Math.PI * 2, a: 0.5 + tilfaeldig() });
  }
  // Første bevægelse starter skarpt fra nul: fasen forskydes, så summen starter i 0.
  return t => {
    let s = 0;
    for (const { f, fase: ph, a } of led) s += a * (Math.sin(2 * Math.PI * f * t + ph) - Math.sin(ph) * Math.exp(-t * 40));
    return s / antal;
  };
}

const indhylning = (t, stig, henfald) => t <= 0 ? 0 : (1 - Math.exp(-t / stig)) * Math.exp(-t / henfald);

// Syntetisk seismogram (lodret komponent, mm på en Wood-Anderson-seismograf).
// t0 er skælvets tid på seismogrammets ur. Formen er skematisk; ankomsttiderne
// og det største udslag følger modellen præcist.
export function seismogram({ d, ML, t0, varighed, stoej = 0.12, froe = 1, dtProeve = 0.02 }) {
  const tilfaeldig = rng(froe);
  const { p, s, r } = ankomster(d);
  const n = Math.round(varighed / dtProeve) + 1;
  const ud = new Float32Array(n);
  const P = fase(tilfaeldig, 3.2), S = fase(tilfaeldig, 1.6), R = fase(tilfaeldig, 0.55, 4);
  const aR = 0.35 + d / 700;               // overfladebølgerne fylder mere, jo længere væk
  const hP = 1.2 + d / 90, hS = 2.2 + d / 45, hR = 4 + d / 35;
  for (let i = 0; i < n; i++) {
    const t = i * dtProeve - t0;
    // Hver fase lægges kun til efter sin ankomst.
    ud[i] = (t > p ? 0.32 * indhylning(t - p, 0.05, hP) * P(t - p) : 0)
      + (t > s ? indhylning(t - s, 0.12, hS) * S(t - s) : 0)
      + (t > r ? aR * indhylning(t - r, 1.2, hR) * R(t - r) : 0);
  }
  let maks = 0, maksP = 0;
  for (let i = 0; i < n; i++) {
    maks = Math.max(maks, Math.abs(ud[i]));
    if (i * dtProeve - t0 < s) maksP = Math.max(maksP, Math.abs(ud[i]));
  }
  // Skalér, så det største udslag er præcis det, Richters formel giver.
  const A = amplitudeFor(ML, d);
  const skala = A / maks;
  // Baggrundsstoej: uro fra hav, vind og trafik. Den er der hele tiden, også før skælvet.
  const niveau = stoej * maksP * skala;
  let lav = 0, hoej = 0;
  const mikro = tilfaeldig() * Math.PI * 2;
  for (let i = 0; i < n; i++) {
    hoej = 0.6 * hoej + 0.4 * (tilfaeldig() * 2 - 1);
    lav = 0.97 * lav + 0.03 * (tilfaeldig() * 2 - 1);
    const t = i * dtProeve;
    ud[i] = ud[i] * skala + niveau * (0.9 * hoej + 6 * lav + 0.5 * Math.sin(2 * Math.PI * 0.2 * t + mikro));
  }
  return { data: ud, dtProeve, tP: t0 + p, tS: t0 + s, tR: t0 + r, A };
}

// Bedste punkt for cirklerne (mindste kvadraters metode, Gauss–Newton).
// Bruges til at tegne cirklernes fællespunkt; med kun to cirkler findes to punkter.
export function bedstePunkt(cirkler, start) {
  let x = start ? start[0] : cirkler.reduce((s, c) => s + c.x, 0) / cirkler.length;
  let y = start ? start[1] : cirkler.reduce((s, c) => s + c.y, 0) / cirkler.length;
  for (let gang = 0; gang < 60; gang++) {
    let a11 = 0, a12 = 0, a22 = 0, b1 = 0, b2 = 0;
    for (const c of cirkler) {
      const dx = x - c.x, dy = y - c.y, afst = Math.hypot(dx, dy) || 1e-6;
      const fejl = afst - c.r, jx = dx / afst, jy = dy / afst;
      a11 += jx * jx; a12 += jx * jy; a22 += jy * jy; b1 += jx * fejl; b2 += jy * fejl;
    }
    const det = a11 * a22 - a12 * a12;
    if (Math.abs(det) < 1e-9) break;
    const sx = (a22 * b1 - a12 * b2) / det, sy = (a11 * b2 - a12 * b1) / det;
    x -= sx; y -= sy;
    if (Math.hypot(sx, sy) < 1e-4) break;
  }
  const rest = Math.sqrt(cirkler.reduce((s, c) => s + (Math.hypot(x - c.x, y - c.y) - c.r) ** 2, 0) / cirkler.length);
  return { x, y, rest };
}

// Skæringspunkter mellem to cirkler (0, 1 eller 2 punkter).
export function skaering(a, b) {
  const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
  if (d === 0 || d > a.r + b.r || d < Math.abs(a.r - b.r)) return [];
  const l = (a.r * a.r - b.r * b.r + d * d) / (2 * d), h = Math.sqrt(Math.max(0, a.r * a.r - l * l));
  const mx = a.x + dx * l / d, my = a.y + dy * l / d;
  return h < 1e-9 ? [{ x: mx, y: my }] : [{ x: mx - dy * h / d, y: my + dx * h / d }, { x: mx + dy * h / d, y: my - dx * h / d }];
}
