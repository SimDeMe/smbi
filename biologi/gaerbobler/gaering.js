/* ═══════════════════════════════════════════════════════════
   gaering.js — fagmodellen bag forsøget.

   Her ligger alt det, der kan diskuteres fagligt: hvor hurtigt
   gæren omsætter sukker ved en given temperatur, hvornår
   gærcellerne dør af varme, hvor længe der går, før den første
   boble kommer, og hvordan CO₂'en gør vandet i gærrøret surt, så
   bromthymolblåt skifter farve.

   Modulet kender hverken lærredet eller knapperne. Det regner.
   ═══════════════════════════════════════════════════════════ */

export const RUM = 20;            /* stuetemperatur, °C           */
export const VAND_PORTION   = 100; /* mL pr. hældning              */
export const SUKKER_PORTION = 25;  /* g pr. afvejning              */
export const GAER_PORTION   = 20;  /* g pr. afvejning              */
export const ROER_VAND      = 8;   /* mL BTB-vand i et gærrør      */

/* ── Gæringshastigheden ────────────────────────────────── *
 * Gæring er enzymstyret, og hastigheden følger to modsatrettede
 * ting: reaktionerne går hurtigere, når det bliver varmere (Q₁₀ ≈ 2
 * — en fordobling pr. 10 °C), og enzymerne bliver ødelagt, når det
 * bliver for varmt. Produktet af de to giver en kurve med optimum
 * omkring 38 °C, som det skal være for bagegær.                  */

const V20  = 18;    /* bobler/min ved 20 °C med frisk, omrørt gær  */
const Q10  = 2;

/** Hvor mange gange hurtigere end ved 20 °C — temperaturen alene. */
export function tempFaktor(T){
  const fart  = Math.pow(Q10, (T - 20) / 10);          /* Q₁₀-reglen   */
  const aktiv = 1 / (1 + Math.exp((T - 44) / 2.2));    /* varmehæmning */
  return fart * aktiv;
}

/** Andelen af gærceller, der dør pr. sekund ved temperaturen T. */
export function doedsrate(T){
  return 0.0005 * Math.exp((T - 42) / 3.2);
}

/* Hvor mange bobler CO₂ 1 g sukker kan give i alt. 1 g saccharose
   giver ca. 0,51 g CO₂ ≈ 0,26 L ved rumtemperatur, og en boble i
   gærrøret er ca. 1 mL. Det er langt mere, end 30 minutters gæring
   når at bruge — sukkeret er ikke det, der sætter grænsen. */
const BOBLER_PR_G = 260;

/* ── Mætning: derfor kommer den første boble ikke med det samme ── *
 * Den CO₂, gæren danner, opløses først i væsken. Først når væsken er
 * mættet, begynder gassen at samle sig i bobler. Varmt vand kan
 * indeholde mindre CO₂ end koldt, så en varm kolbe når mætningen
 * hurtigere — både fordi den gærer hurtigere, og fordi der skal
 * mindre til.                                                      */
export function maetning(mL, T){
  return (mL / 100) * Math.max(8, 60 - 0.7 * T);   /* i boble-enheder */
}

/* ── BTB og pH i gærrøret ──────────────────────────────── *
 * Gærrøret er fyldt med hanevand og et par dråber bromthymolblåt.
 * CO₂ fra boblerne opløses i vandet og danner kulsyre:
 *     CO₂ + H₂O → H₂CO₃ ⇌ H⁺ + HCO₃⁻
 * Hanevand indeholder i forvejen lidt hydrogencarbonat (alkalinitet),
 * og derfor er det svagt basisk fra start — det er grunden til, at
 * BTB'en er blå, før forsøget går i gang.
 *
 * pH findes af ladningsbalancen
 *     Alk + [H⁺] = [HCO₃⁻] + [OH⁻],   [HCO₃⁻] = Ka₁·C/[H⁺]
 * der er en andengradsligning i [H⁺]:
 *     [H⁺]² + Alk·[H⁺] − (Ka₁·C + Kw) = 0                        */

const Ka1 = 4.3e-7;      /* kulsyrens 1. syrekonstant, 25 °C        */
const Kw  = 1e-14;
const ALK = 1.0e-3;      /* hanevandets hydrogencarbonat, mol/L     */

export const C_START = 2.8e-5;   /* opløst CO₂ i ligevægt med luften */
export const C_MAET  = 34e-3;    /* mættet med ren CO₂ ved 1 atm     */

/** Hvor meget den opløste CO₂ i gærrøret stiger pr. boble, der
    passerer. Kun en lille del af gassen når at gå i opløsning på
    vejen igennem — resten forlader røret som boble. */
export const PR_BOBLE = 7.7e-6;  /* mol/L pr. boble                  */

export function pHaf(C){
  const h = (-ALK + Math.sqrt(ALK * ALK + 4 * (Ka1 * C + Kw))) / 2;
  return -Math.log10(h);
}

/** BTB er en blanding af en blå og en gul form. Andelen af den gule
    følger pH omkring omslagspunktet pKa ≈ 7,1 — og en blanding af
    blåt og gult ser grønt ud. Det er præcis, hvad man ser i røret. */
export function gulAndel(pH){
  return 1 / (1 + Math.pow(10, pH - 7.1));
}

const BLAA = [31, 99, 200], GROEN = [63, 166, 74], GUL = [228, 197, 32];
const bland = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));

export function btbFarve(pH){
  const f = gulAndel(pH);
  const c = f < 0.5 ? bland(BLAA, GROEN, f * 2) : bland(GROEN, GUL, (f - 0.5) * 2);
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

export function btbNavn(pH){
  return pH >= 7.6 ? 'Blå' : pH >= 6.0 ? 'Grøn' : 'Gul';
}

/* ── Et gærrør ─────────────────────────────────────────── */
export function opretRoer(id){
  return {
    id,
    vand:false,      /* er der hældt vand i?                        */
    btb:false,       /* er der dryppet BTB i?                       */
    C:C_START,       /* opløst CO₂ i rørets vand, mol/L             */
    paa:null,        /* den kolbe, røret sidder på                  */
    rest:0,          /* brøkdel af en boble, der endnu ikke er sluppet */
    kvote:0,         /* hvor mange bobler der må vises lige nu       */
    bobler:[],       /* boblerne, man kan se lige nu                */
    talt:0,          /* bobler i alt gennem røret                   */
  };
}

export function roerPH(r){ return pHaf(r.C); }

/* ── En konisk kolbe ───────────────────────────────────── */
export function opretKolbe(id, navn){
  return {
    id, navn,
    sukker:0, gaer:0, vand:0,       /* g, g, mL                     */
    temp:RUM,
    roert:false,                    /* er der rørt rundt?           */
    levende:1,                      /* andel levende gærceller      */
    vaagen:0,                       /* hvor godt gæren er kommet i gang */
    dannet:0,                       /* CO₂ dannet i alt, boble-enheder */
    oploest:0,                      /* CO₂ opløst i kolbens væske   */
    hastighed:0,                    /* bobler/min lige nu           */
    slip:0,                         /* bobler/min ud af kolben      */
    plads:null,                     /* bordplads eller varmeplade   */
    roer:null,
    maaltTemp:null,                 /* det, termometeret sidst viste */
    taellinger:[],                  /* {tid, antal} fra bobletællingerne */
    foersteBoble:null,              /* forsøgstid for første boble   */
    skift:{groen:null, gul:null},   /* forsøgstid for BTB-omslag     */
    bobleFase:0,                    /* til boblerne inde i væsken    */
    indreBobler:[],
  };
}

export function harBlanding(k){ return k.vand > 0 && k.gaer > 0 && k.sukker > 0; }

/* ── Oprydning ─────────────────────────────────────────── *
 * Tømt og skyllet er tømt og skyllet: indholdet ryger ud, og de
 * målinger, der hørte til netop den portion, følger med. Ellers
 * ville et nyt hold tal lægge sig oven i det gamle i journalen.  */
export function toemKolbe(k){
  k.sukker = 0; k.gaer = 0; k.vand = 0;
  k.temp = RUM;
  k.roert = false;
  k.levende = 1; k.vaagen = 0;
  k.dannet = 0; k.oploest = 0;
  k.hastighed = 0; k.slip = 0;
  k.maaltTemp = null; k.taellinger = [];
  k.foersteBoble = null; k.skift = {groen:null, gul:null};
  k.bobleFase = 0; k.indreBobler = [];
}

export function toemRoer(r){
  r.vand = false; r.btb = false; r.C = C_START;
  r.rest = 0; r.kvote = 0; r.bobler = []; r.talt = 0;
}

/** Hastigheden lige nu, i bobler pr. minut. */
export function hastighedAf(k){
  if(!harBlanding(k)) return 0;
  const rest    = Math.max(0, k.sukker * BOBLER_PR_G - k.dannet);
  const sukker  = Math.min(1, rest / (0.15 * k.sukker * BOBLER_PR_G));
  /* Alkoholen hober sig op og hæmmer gæren en smule undervejs — nok
     til, at en varm kolbe taber lidt fart i løbet af en halv time. */
  const alkohol = Math.exp(-k.dannet / 8000);
  return V20 * tempFaktor(k.temp) * k.levende * k.vaagen * sukker * alkohol;
}

/* ── Ét skridt frem ────────────────────────────────────── *
 * dt er simuleret tid i sekunder — altså virkelig forsøgstid, ikke
 * skærmtid. Tidsfarten ganges på, før modellen kaldes.            */
export function opdaterKolbe(k, dt){
  /* Temperaturen søger mod varmepladen, ellers mod stuetemperatur.
     Vandbadet i kolben er trægt; luften i lokalet er meget træg. */
  const maal = k.plads && k.plads.type === 'plade' ? k.plads.temp : RUM;
  const tau  = k.plads && k.plads.type === 'plade' && k.plads.temp > RUM ? 75 : 900;
  k.temp += (maal - k.temp) * (1 - Math.exp(-dt / tau));

  /* Varmedøden. Under ca. 40 °C er den uden betydning; over 50 °C går
     det stærkt, og den er uoprettelig — derfor hjælper det ikke at
     køle kolben ned bagefter. */
  k.levende *= Math.exp(-doedsrate(k.temp) * dt);

  /* Gæren skal vågne: tørgæren skal suge vand og komme i gang. Det
     går hurtigere i varmt vand og langsommere, hvis der ikke er rørt
     rundt. */
  if(harBlanding(k)){
    let t = 150 * Math.pow(2, -(k.temp - 20) / 12);
    if(!k.roert) t *= 1.8;
    k.vaagen += (1 - k.vaagen) * (1 - Math.exp(-dt / t));
  }

  k.hastighed = hastighedAf(k);
  const dannet = k.hastighed * dt / 60;
  k.dannet += dannet;

  /* Væsken mættes først. Bliver den varmere undervejs, kan den
     holde mindre CO₂, og det overskydende slipper ud som bobler. */
  const maet = maetning(k.vand, k.temp);
  let ud = 0;
  if(k.oploest > maet){ ud += k.oploest - maet; k.oploest = maet; }
  const plads = Math.max(0, maet - k.oploest);
  const ind   = Math.min(plads, dannet);
  k.oploest += ind;
  ud += dannet - ind;

  k.slip = dt > 0 ? ud * 60 / dt : 0;
  return ud;                       /* bobler ud af kolben i dette skridt */
}

/** Fører boblerne gennem gærrøret og lader CO₂'en surgøre vandet.
    Returnerer antallet af hele bobler, der forlod røret. */
export function opdaterRoer(r, ud, dt){
  let hele = 0;
  if(r.vand){
    r.C += ud * PR_BOBLE;
    /* Uden bobler afgiver vandet langsomt sin CO₂ til luften igen. */
    r.C += -(r.C - C_START) * (1 - Math.exp(-dt / 1600));
    r.C = Math.min(C_MAET, Math.max(C_START, r.C));
    r.rest += ud;
    while(r.rest >= 1){ r.rest -= 1; hele++; r.talt++; }
  }
  return hele;
}
