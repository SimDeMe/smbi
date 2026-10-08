/* model.js — reserve- og ressourcemodellen (McKelvey-kassen) for ét råstof.

   Ressourcen er alt det råstof, der findes. Den deles to veje:
     · kendt eller uopdaget            (efterforskning flytter fra uopdaget til kendt)
     · rentabel eller ikke rentabel    (afgøres af prisen og teknologien)
   Reserven er den del, der er både kendt og rentabel.

   Hver forekomst har en udvindingsomkostning (USD pr. ton råstof).
   Omkostningerne er fordelt log-normalt og holdes i N klasser for den
   kendte og den uopdagede del hver for sig. En forekomst er rentabel,
   når omkostningen ligger under grænsen  pris ÷ (1 − teknologi).

   Ét år:
     1. Behovet vokser med væksten; en højere pris dæmper det en smule.
     2. Genanvendelsen dækker en del af behovet — resten skal brydes.
     3. Der brydes fra reserven, billigste forekomster først. Er reserven
        for lille, opstår der mangel.
     4. Efterforskningen finder en andel af det uopdagede; en højere pris
        giver mere efterforskning.

   Tallene er afrundede tal for kobber (USGS, Mineral Commodity
   Summaries): reserve ≈ 1000 mio. t, kendt ressource ≈ 2100 mio. t,
   uopdaget ≈ 3500 mio. t, forbrug ≈ 32 mio. t/år, heraf ca. 30 %
   genanvendt, pris ≈ 9000 USD/t. */

export const RAASTOF = 'Kobber';

export const START = {
  kendt:   2100,     // mio. t
  ukendt:  3500,     // mio. t
  reserve: 1000,     // mio. t ved startprisen
  pris:    9000,     // USD/t
  forbrug: 32,       // mio. t/år i alt (primært + genanvendt)
};
export const SAMLET = START.kendt + START.ukendt;

export const STANDARD = {
  pris: 9000,        // USD/t
  teknologi: 0,      // % lavere udvindingsomkostning
  efterforskning: 0.8, // % af det uopdagede, der findes pr. år (ved startprisen)
  vaekst: 2.5,       // % pr. år
  genanv: 30,        // % af forbruget, der dækkes af genanvendelse
};

export const AAR_MAKS = 100;

const ELASTICITET = -0.3;  // forbrug ∝ pris^−0,3: dobbelt pris → ca. 19 % mindre forbrug
const SPREDNING = 0.6;     // spredningen på ln(omkostning)

// ── Omkostningsklasser ──────────────────────────────────
const N = 240;
const LN_MIN = Math.log(300), LN_MAKS = Math.log(300000);
const DL = (LN_MAKS - LN_MIN) / N;
const kant = i => LN_MIN + i * DL;

// normalfordelingens fordelingsfunktion (Abramowitz & Stegun 7.1.26)
function Phi(z){
  const t = 1 / (1 + 0.3275911 * Math.abs(z) / Math.SQRT2);
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592)
              * t * Math.exp(-z * z / 2);
  return z >= 0 ? 0.5 * (1 + y) : 0.5 * (1 - y);
}

function fordeling(median){
  const v = new Float64Array(N);
  let sum = 0;
  for (let i = 0; i < N; i++){
    v[i] = Phi((kant(i + 1) - Math.log(median)) / SPREDNING)
         - Phi((kant(i)     - Math.log(median)) / SPREDNING);
    sum += v[i];
  }
  for (let i = 0; i < N; i++) v[i] /= sum;
  return v;
}

/* Mængden i klasserne, der kan brydes ved grænsen g (USD/t).
   Klassen, grænsen falder i, tæller med i forhold til, hvor langt inde den er. */
function andelUnder(i, lg){
  if (kant(i + 1) <= lg) return 1;
  if (kant(i) >= lg) return 0;
  return (lg - kant(i)) / DL;
}
function rentabel(klasser, g){
  const lg = Math.log(g);
  let s = 0;
  for (let i = 0; i < N; i++){
    const a = andelUnder(i, lg);
    if (a === 0) break;
    s += klasser[i] * a;
  }
  return s;
}
const sum = klasser => klasser.reduce((a, b) => a + b, 0);

// Medianomkostningen vælges, så reserven er 1000 mio. t ved startprisen.
const MEDIAN = (function(){
  let lo = 1000, hi = 100000;
  for (let k = 0; k < 60; k++){
    const m = Math.sqrt(lo * hi);
    const r = rentabel(fordeling(m), START.pris) * START.kendt;
    if (r > START.reserve) lo = m; else hi = m;
  }
  return Math.sqrt(lo * hi);
})();

export const graense = p => p.pris / (1 - p.teknologi / 100);

// ── Tilstand ────────────────────────────────────────────
export function nyTilstand(){
  const f = fordeling(MEDIAN);
  return {
    aar: 0,
    kendt:  f.map(x => x * START.kendt),
    ukendt: f.map(x => x * START.ukendt),
    udvundet: 0,
    basis: START.forbrug,   // forbruget ved startprisen; vokser år for år
    historik: [],
  };
}

export function behov(s, p){
  const samlet = s.basis * Math.pow(p.pris / START.pris, ELASTICITET);
  return { samlet, primaer: samlet * (1 - p.genanv / 100) };
}

export function aflaes(s, p){
  const g = graense(p);
  const kendt = sum(s.kendt), ukendt = sum(s.ukendt);
  const reserve = rentabel(s.kendt, g);
  const rentabelUkendt = rentabel(s.ukendt, g);
  const b = behov(s, p);
  // Det, der kan brydes i det kommende år med de nuværende indstillinger
  const produktion = Math.min(b.primaer, reserve);
  const mangel = b.primaer - produktion;
  return {
    aar: s.aar, graense: g,
    kendt, ukendt, udvundet: s.udvundet, reserve, rentabelUkendt,
    forbrug: b.samlet, primaer: b.primaer, produktion, mangel,
    rp: produktion > 0 ? reserve / produktion : Infinity,
  };
}

// Ét år frem
export function etAar(s, p){
  if (s.aar === 0 && s.historik.length === 0) s.historik.push(punkt(s, p));
  const g = graense(p), lg = Math.log(g);
  const b = behov(s, p);

  // brydning: billigste kendte, rentable forekomster først
  let rest = b.primaer;
  for (let i = 0; i < N && rest > 0; i++){
    const a = andelUnder(i, lg);
    if (a === 0) break;
    const tag = Math.min(s.kendt[i] * a, rest);
    s.kendt[i] -= tag;
    rest -= tag;
  }
  s.udvundet += b.primaer - rest;

  // efterforskning: en andel af det uopdagede bliver kendt
  const fund = Math.min(0.2, p.efterforskning / 100 * p.pris / START.pris);
  for (let i = 0; i < N; i++){
    const d = s.ukendt[i] * fund;
    s.ukendt[i] -= d;
    s.kendt[i] += d;
  }

  s.basis *= 1 + p.vaekst / 100;
  s.aar++;
  s.historik.push(punkt(s, p));
}

function punkt(s, p){
  const a = aflaes(s, p);
  return { aar: a.aar, reserve: a.reserve, udvundet: a.udvundet, rp: a.rp, mangel: a.mangel };
}

/* Markedsprisen: er der kort tid tilbage af reserven, stiger prisen; er der
   lang tid, falder den. Højst 8 % pr. år, og aldrig uden for skyderens ramme. */
export const RP_LIGEVAEGT = 40;   // år
export function markedspris(s, p, min, maks){
  const rp = Math.max(1, Math.min(200, aflaes(s, p).rp));
  const faktor = Math.max(0.92, Math.min(1.08, Math.pow(RP_LIGEVAEGT / rp, 0.15)));
  return Math.max(min, Math.min(maks, p.pris * faktor));
}
