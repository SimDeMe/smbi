/* ═══════════════════════════════════════════════════════════
   poler.js — fagdata.

   Hvor den magnetiske nordpol har ligget, hvor stærkt feltet har
   været, og de steder kompasset kan sættes på. Tallene rettes
   her uden at man skal forbi kode.
   ═══════════════════════════════════════════════════════════ */

/* Den magnetiske nordpol (dippolen — stedet, hvor en
   inklinationsnål står lodret) gennem tiden. 1831 og 1904 er
   målinger i felten (James Clark Ross og Roald Amundsen), resten
   er aflæst af de internationale feltmodeller (IGRF/WMM) og er
   afrundet. Mellem årene lægges polen på en ret linje.        */
export const POLSPOR = [
  {aar:1831, lat:70.1, lon: -96.8, note:'James Clark Ross finder polen'},
  {aar:1904, lat:70.6, lon: -96.4, note:'Roald Amundsen måler polen'},
  {aar:1920, lat:71.2, lon: -96.8},
  {aar:1940, lat:72.8, lon: -98.0},
  {aar:1948, lat:73.9, lon:-100.9, note:'Første måling fra fly'},
  {aar:1960, lat:74.9, lon:-101.0},
  {aar:1973, lat:76.1, lon:-101.0},
  {aar:1984, lat:77.4, lon:-102.2},
  {aar:1994, lat:78.3, lon:-104.0},
  {aar:2001, lat:81.3, lon:-110.8, note:'Polen forlader Canada'},
  {aar:2007, lat:83.9, lon:-120.7},
  {aar:2010, lat:85.0, lon:-132.8},
  {aar:2015, lat:86.3, lon:-160.1},
  {aar:2020, lat:86.5, lon: 162.9, note:'Polen krydser datolinjen'},
  {aar:2025, lat:85.8, lon: 139.3, note:'På vej mod Sibirien'}
];
export const AAR_MIN = POLSPOR[0].aar;
export const AAR_MAX = POLSPOR[POLSPOR.length-1].aar;

/* Årstal med en knap i stedvælgeren. */
export const AAR_KNAPPER = [1831, 1904, 1948, 1973, 2001, 2020, 2025];

/* Jordens dipolmoment i 10²² A·m² — feltet er blevet ca. 10 %
   svagere siden 1840. Ved ækvator giver 7,7·10²² A·m² ca. 30 µT. */
export const DIPOLMOMENT = [
  [1840, 8.50], [1900, 8.32], [1950, 8.05], [2000, 7.79], [2025, 7.70]
];

/* Før Brunhes–Matuyama-vendingen for ca. 780 000 år siden pegede
   kompasnålen mod syd. Polen lå i gennemsnit tæt ved den
   geografiske pol — her lagt på selve polen. */
export const VENDING = {lat:89.0, lon:0, tekst:'For ca. 800 000 år siden'};

/* Steder, kompasset kan sættes på med en knap. */
export const STEDER = [
  {id:'kbh',        navn:'København',   lat: 55.7, lon:  12.6},
  {id:'nuuk',       navn:'Nuuk',        lat: 64.2, lon: -51.7},
  {id:'reykjavik',  navn:'Reykjavík',   lat: 64.1, lon: -21.9},
  {id:'longyear',   navn:'Longyearbyen',lat: 78.2, lon:  15.6},
  {id:'resolute',   navn:'Resolute Bay',lat: 74.7, lon: -94.8},
  {id:'newyork',    navn:'New York',    lat: 40.7, lon: -74.0},
  {id:'singapore',  navn:'Singapore',   lat:  1.3, lon: 103.8},
  {id:'sydney',     navn:'Sydney',      lat:-33.9, lon: 151.2}
];

/* ── Opslag ────────────────────────────────────────────── */

const GRAD = Math.PI/180;
const tilVektor = (lat, lon) => [
  Math.cos(lat*GRAD)*Math.cos(lon*GRAD), Math.cos(lat*GRAD)*Math.sin(lon*GRAD), Math.sin(lat*GRAD)
];

/** Polens plads i et givet år. Der interpoleres mellem vektorer,
    ikke mellem grader, så springet over datolinjen går glat. */
export function polI(aar){
  const a = Math.max(AAR_MIN, Math.min(AAR_MAX, aar));
  let i = 1;
  while(i < POLSPOR.length-1 && POLSPOR[i].aar < a) i++;
  const p0 = POLSPOR[i-1], p1 = POLSPOR[i];
  const f = (a-p0.aar)/(p1.aar-p0.aar || 1);
  const v0 = tilVektor(p0.lat, p0.lon), v1 = tilVektor(p1.lat, p1.lon);
  const v = v0.map((x, k) => x + (v1[k]-x)*f);
  const n = Math.hypot(...v);
  return {lat: Math.asin(v[2]/n)/GRAD, lon: Math.atan2(v[1], v[0])/GRAD};
}

/** Feltstyrken ved den magnetiske ækvator i µT for et givet år. */
export function aekvatorFelt(aar){
  const D = DIPOLMOMENT;
  let m = D[D.length-1][1];
  if(aar <= D[0][0]) m = D[0][1];
  else for(let i=1;i<D.length;i++){
    if(aar <= D[i][0]){
      const f = (aar-D[i-1][0])/(D[i][0]-D[i-1][0]);
      m = D[i-1][1] + (D[i][1]-D[i-1][1])*f; break;
    }
  }
  /* B₀ = μ₀·m / (4π·R³) med R = 6371 km */
  return 1e-7 * m*1e22 / Math.pow(6.371e6, 3) * 1e6;
}
