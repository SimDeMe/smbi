/* ═══════════════════════════════════════════════════════════
   brygning.js — fagmodellen bag hele brygningen.

   Alt det, der kan diskuteres fagligt, står her og ingen andre
   steder: hvordan de to amylaser nedbryder stivelsen i mæsken,
   hvor hurtigt de denatureres, hvor meget bitterhed humlen giver
   under kogningen, og hvordan gæren omsætter sukkeret til ethanol
   og CO₂. Modulet kender hverken lærredet eller knapperne. Det
   regner.

   Én batch løber igennem fire stationer, og det, en station
   efterlader, er det, den næste starter med:

     malt ─ mæskning ─▶ urt ─ kogning ─▶ humlet urt ─ gæring ─▶ øl

   Mængderne holdes i gram (kulhydrater) og liter (volumen), så
   regnskabet kan følges hele vejen: den stivelse, der ikke bliver
   til sukker i mæsken, kan gæren aldrig lave alkohol af.
   ═══════════════════════════════════════════════════════════ */

/* ── Vægtfylde, °Plato og alkohol ──────────────────────── *
 * Opløst sukker gør væsken tungere, ethanol gør den lettere. Det er
 * derfor, brygeren kan følge gæringen med et hydrometer: vægtfylden
 * falder af to grunde på én gang. 142 g ekstrakt pr. liter giver
 * 1,055 (tabelværdi ved 20 °C), og 39 g ethanol pr. liter (5 % vol)
 * trækker knap 0,006 fra — sat, så modellens alkohol passer med
 * brygerens hydrometerregel nedenfor.                               */
const PR_G_EKSTRAKT = 0.000387;   /* vægtfylde pr. g/L opløst ekstrakt */
const PR_G_ETHANOL  = 0.000145;   /* vægtfylde pr. g/L ethanol (minus) */
const ETHANOL_DENS  = 789;        /* g/L — ren ethanol                 */

export function vaegtfylde(ekstrakt_gL, ethanol_gL = 0){
  return 1 + PR_G_EKSTRAKT * ekstrakt_gL - PR_G_ETHANOL * ethanol_gL;
}
/** °Plato: gram ekstrakt pr. 100 g urt — brygerens egen enhed. */
export function plato(sg){ return 259 - 259 / sg; }
/** Alkohol i volumenprocent ud fra gram ethanol pr. liter. */
export function alkoholVol(ethanol_gL){ return ethanol_gL / ETHANOL_DENS * 100; }
/** Brygerens tommelfingerregel: alkohol af to hydrometeraflæsninger. */
export function alkoholAfSG(og, fg){ return (og - fg) * 131.25; }

/* ═════════════════════════════════════════════════════════
   1 · MÆSKNING — stivelse bliver til sukker
   ═════════════════════════════════════════════════════════ *
 * Den knuste malt røres ud i varmt vand. Maltens egne enzymer
 * hydrolyserer stivelsen:
 *
 *   α-amylase klipper midt i kæderne (endo-enzym). Den laver mange
 *     korte dextriner og lidt sukker, er hurtig og tåler varme.
 *     Optimum omkring 70–72 °C.
 *   β-amylase klipper maltose (to glukose) af kædernes ender
 *     (exo-enzym). Den laver det gærbare sukker, men denatureres
 *     hurtigt over ca. 65 °C.
 *
 * Ingen af dem kan klippe forbi forgreningerne (α-1,6-bindinger),
 * så en del bliver altid til grænsedextriner, som gæren ikke kan
 * bruge. Det er dem, der giver øllet fylde og restsødme.
 *
 * Kulhydraterne holdes i fire puljer (gram):
 *   stivelse   — lange kæder, endnu ikke nedbrudt
 *   dextrin    — korte kæder, som β-amylase stadig kan klippe maltose af
 *   graense    — grænsedextriner: kan ingen af enzymerne komme videre med
 *   sukker     — maltose, glukose og maltotriose: det gæren kan bruge   */

export const MALT = {
  stivelse:0.58,    /* andel af maltens masse, der er stivelse        */
  sukker:0.02,      /* sukker, der allerede er i malten              */
  andet:0.05,       /* opløseligt protein m.m. — ugærbart            */
  ebc:6,            /* lys pilsnermalt, farve i EBC                  */
};
export const VAND_FOER_KOG = 24;   /* L urt efter mæskning og skylning */

/* Stivelsen skal forklistres (gelatineres), før enzymerne kan komme
   til. Bygstivelse forklistres omkring 60–64 °C. */
export function forklistring(T){ return 1 / (1 + Math.exp(-(T - 61) / 1.6)); }

/* Reaktionerne går hurtigere, jo varmere det er (Q₁₀ ≈ 2). */
function q10(T, ref){ return Math.pow(2, (T - ref) / 10); }

/* Denaturering: andelen af enzymet, der ødelægges pr. minut.
   β-amylase: halveringstid ≈ 60 min ved 63 °C, 10 min ved 67 °C.
   α-amylase: halveringstid ≈ 60 min ved 72 °C,  5 min ved 78 °C. */
const LN2 = Math.LN2;
export function denatBeta(T){  return LN2 / 60 * Math.exp((T - 63) / 2.23); }
export function denatAlfa(T){  return LN2 / 60 * Math.exp((T - 72) / 2.41); }

/* Hvor hurtigt hvert enzym arbejder, pr. minut, ved fuld aktivitet
   og 65 °C. Tallene er valgt, så en mæsk ved 65 °C er omsat
   (jodprøven negativ) efter ca. 20–30 minutter. */
const K_ALFA = 0.11, K_BETA = 0.10;

/* Hvad et klip giver. α-amylase: mest dextriner, lidt sukker og
   nogle grænsedextriner. β-amylase direkte på stivelse: maltose, til
   den rammer en forgrening. */
const ALFA_UD  = {sukker:0.14, dextrin:0.62, graense:0.24};
const BETA_UD  = {sukker:0.62, graense:0.38};

export function nyMaesk(maltKg, T){
  const g = maltKg * 1000;
  return {
    t:0, T,                           /* min, °C                     */
    malt:maltKg,
    stivelse:g * MALT.stivelse,
    dextrin:0, graense:0,
    sukker:g * MALT.sukker,
    andet:g * MALT.andet,
    alfa:1, beta:1,                   /* enzymaktivitet, 0–1         */
  };
}

/** Enzymernes øjeblikkelige arbejdstempo (til instrumenterne), 0–1. */
export function enzymTempo(m){
  const gel = forklistring(m.T);
  /* Normeret, så det højeste, man kan se, er omkring 1. */
  return {
    alfa: m.alfa * q10(m.T, 72) * gel,
    beta: m.beta * q10(m.T, 65) * gel,
  };
}

/* Varmelegemet: 3 kW ind i ca. 20 kg mæsk (varmekapacitet ≈ 83 kJ/K)
   giver godt 2 °C i minuttet op. Uden varme taber gryden ca.
   0,3 °C i minuttet til omgivelserne. */
export const VARME_KW = 3;
export function varmekapacitet(maltKg){          /* kJ/K */
  const vand = maltKg * 3.5;                      /* 3,5 L vand pr. kg malt */
  return vand * 4.18 + maltKg * 1.7;
}

/** Et skridt på dt minutter mod måltemperaturen Tmaal. */
export function skridtMaesk(m, dt, Tmaal){
  /* Temperaturen: varm op med fuld effekt, eller lad den falde. */
  const C = varmekapacitet(m.malt);
  const op  = VARME_KW * 60 / C;                  /* °C pr. min */
  const ned = 0.3;
  const d = Tmaal - m.T;
  m.varmer = d > 0.05;
  m.T += Math.max(-ned * dt, Math.min(op * dt, d));

  const gel = forklistring(m.T);
  const fa = K_ALFA * m.alfa * q10(m.T, 65) * gel;
  const fb = K_BETA * m.beta * q10(m.T, 65);

  /* α-amylase: klipper stivelsen op, og klipper langsomt også
     dextrinerne ned til sukker. */
  const aS = Math.min(m.stivelse, fa * m.stivelse * dt);
  const aD = Math.min(m.dextrin,  fa * 0.22 * m.dextrin * dt);
  /* β-amylase: maltose af enderne. Stivelsen har få ender, dextrinerne
     mange — derfor arbejder den bedst, når α-amylasen har været der. */
  const bS = Math.min(m.stivelse - aS, fb * 0.25 * gel * m.stivelse * dt);
  const bD = Math.min(m.dextrin - aD,  fb * m.dextrin * dt);

  m.stivelse -= aS + bS;
  m.dextrin  += aS * ALFA_UD.dextrin - aD - bD;
  m.graense  += aS * ALFA_UD.graense + bS * BETA_UD.graense;
  m.sukker   += aS * ALFA_UD.sukker  + bS * BETA_UD.sukker + aD + bD;

  m.alfa *= Math.exp(-denatAlfa(m.T) * dt);
  m.beta *= Math.exp(-denatBeta(m.T) * dt);
  m.t += dt;
  return m;
}

/* Jodprøven: jod farver stivelse blåsort. Når under ca. 3 % af
   stivelsen er tilbage, ses farven ikke længere — prøven er negativ. */
export function jodproeve(m, startStivelse){
  const rest = m.stivelse / startStivelse;
  return {rest, positiv:rest > 0.03};
}

/** Hvad mæsken giver videre til kogningen. */
export function urtAfMaesk(m){
  /* Den stivelse, der ikke er omsat, bliver i kornet, når urten
     skylles fra. Alt det opløste følger med. */
  return {
    V:VAND_FOER_KOG,
    sukker:m.sukker,
    dextrin:m.dextrin + m.graense + m.andet,   /* ugærbart ekstrakt */
    stivelseRest:m.stivelse,
    malt:m.malt,
    maeskT:m.T,
  };
}

/* ═════════════════════════════════════════════════════════
   2 · KOGNING — humlens bitterhed, og vand der damper væk
   ═════════════════════════════════════════════════════════ *
 * Urten koges i en time. Det gør tre ting:
 *   – enzymerne denatureres, så sukkerforholdet fra mæsken ligger fast,
 *     og urten bliver steril,
 *   – vand fordamper, så sukkeret koncentreres, og
 *   – humlens α-syrer omdannes (isomeriseres) til iso-α-syrer. Kun
 *     iso-α-syrerne er opløselige nok til at give øllet bitterhed, og
 *     omdannelsen tager tid — derfor giver tidlig humle bitterhed.
 *   – humlens æteriske olier fordamper med dampen — derfor skal humle
 *     til aroma først i til sidst.
 *
 * Bitterheden regnes i IBU (mg iso-α-syre pr. liter) med Tinseths
 * formel, som bryggere bruger den.                                */

export const ALFA_SYRE = 0.08;       /* humlen er 8 % α-syre (fx Cascade-agtig) */
export const FORDAMP_L_PR_T = 4;     /* L pr. time ved kraftig kog              */
const OLIE_TAB = Math.LN2 / 8;       /* aromaolierne halveres på ca. 8 min      */

export function nyKog(urt){
  return {t:0, V:urt.V, urt, humle:[]};  /* humle: [{g, tid}] */
}

export function tilsaetHumle(k, gram){
  k.humle.push({g:gram, tid:k.t});
}

export function skridtKog(k, dt){
  k.V = Math.max(10, k.V - FORDAMP_L_PR_T / 60 * dt);
  k.t += dt;
  return k;
}

/** Tinseth: hvor stor en andel af α-syrerne, der er blevet iso-α-syre. */
export function udnyttelse(minutter, sg){
  const tyngde = 1.65 * Math.pow(0.000125, sg - 1);   /* tyk urt → mindre */
  const tid    = (1 - Math.exp(-0.04 * minutter)) / 4.15;
  return tyngde * tid;
}

export function kogEkstrakt(k){ return (k.urt.sukker + k.urt.dextrin) / k.V; }
export function kogSG(k){ return vaegtfylde(kogEkstrakt(k)); }

export function ibu(k){
  const sg = kogSG(k);
  let sum = 0;
  for(const h of k.humle){
    sum += udnyttelse(k.t - h.tid, sg) * ALFA_SYRE * h.g * 1000 / k.V;
  }
  return sum;
}

/** Humlearoma: den del af olierne, der endnu ikke er dampet af (g humle). */
export function aroma(k){
  let sum = 0;
  for(const h of k.humle) sum += h.g * Math.exp(-OLIE_TAB * (k.t - h.tid));
  return sum;
}

/* Maillard-reaktioner og malten selv giver farven. Moreys formel
   omregner malt og volumen til øllets farve i EBC. */
export function farveEBC(maltKg, V){
  const mcu = (maltKg * 2.2046) * (MALT.ebc / 1.97) / (V * 0.2642);
  const srm = 1.4922 * Math.pow(mcu, 0.6859);
  return srm * 1.97;
}

export function urtAfKog(k){
  return {
    V:k.V,
    sukker_gL:k.urt.sukker / k.V,
    dextrin_gL:k.urt.dextrin / k.V,
    og:kogSG(k),
    ibu:ibu(k),
    aroma:aroma(k) / k.V,           /* g humle pr. L, der stadig dufter */
    kogetid:k.t,
    humle:k.humle.map(h => ({g:h.g, tid:h.tid})),
    ebc:farveEBC(k.urt.malt, k.V),
  };
}

/* ═════════════════════════════════════════════════════════
   3 · GÆRING — sukker bliver til ethanol og CO₂
   ═════════════════════════════════════════════════════════ *
 * Urten køles og iltes, og gæren tilsættes. Først bruger gæren ilten
 * til at formere sig (ånding), bagefter gærer den (anaerob respiration):
 *
 *     C₁₂H₂₂O₁₁ + H₂O  →  4 C₂H₅OH + 4 CO₂       (maltose)
 *     C₆H₁₂O₆          →  2 C₂H₅OH + 2 CO₂       (glukose)
 *
 * Massen af sukkeret går næsten ligeligt til ethanol og CO₂ — efter
 * ligningen giver 1 g glukose 0,51 g ethanol og 0,49 g CO₂. I en rigtig
 * gæring går ca. 8 % af sukkeret dog til ny gær og glycerol, så det
 * bliver til 0,47 g ethanol og 0,45 g CO₂. Med de tal passer modellens
 * alkohol med brygerens hydrometerregel, (OG − FG) · 131,25.
 *
 * Tiden regnes i timer. Gæren (overgær, Saccharomyces cerevisiae)
 * gennemgår de klassiske faser:
 *   lag     — gæren vågner og tilpasser sig urten
 *   vækst   — den formerer sig, til ilten er brugt
 *   gæring  — sukkeret omsættes; vægtfylden falder
 *   hvile   — sukkeret er brugt, gæren synker til bunds
 *
 * Temperaturen styrer tempo og smag: varmt giver hurtig gæring, men
 * flere estere og fuselalkoholer (bismag). For varmt dræber gæren. */

const MY_20   = 0.12;   /* gærens væksthastighed ved 20 °C, pr. time         */
const Q_20    = 0.33;   /* g sukker pr. g gær pr. time ved 20 °C            */
const KS      = 6;      /* g/L — halvmætning: det sidste sukker går langsomt */
export const X_MAKS = 3.2;    /* g gær pr. L, som ilten rækker til                 */
const E_TÅL   = 105;    /* g/L ethanol (≈ 13 %), hvor gæren giver op          */
const VÅGN_20 = 0.16;   /* pr. time — hvor hurtigt gæren kommer i gang       */
export const ETHANOL_PR_G = 0.47, CO2_PR_G = 0.45;
export const CO2_L_PR_G = 0.545;  /* liter CO₂-gas pr. gram ved 20 °C */

/** Gærens tempo i forhold til 20 °C — med hæmning i kulde og over 35 °C. */
export function gaerTempo(T){
  const kulde = 1 / (1 + Math.exp(-(T - 11) / 1.8));   /* overgær går i stå i kulden */
  const varme = 1 / (1 + Math.exp((T - 37) / 1.4));
  return q10(T, 20) * kulde * varme;
}
/** Andelen af gærcellerne, der dør pr. time af varme. */
export function gaerDoed(T){
  return 0.004 * Math.exp((T - 35) / 1.5);
}
/* Estere og fuselalkoholer: mere, jo varmere gæringen er. 1 ved 18 °C. */
export function bismagFaktor(T){ return Math.exp((T - 18) / 5.5); }

export function nyGaering(urt, gaerGram, T){
  return {
    t:0, T, V:urt.V, urt,
    sukker:urt.sukker_gL,
    dextrin:urt.dextrin_gL,
    ethanol:0, co2:0,           /* g/L og g i alt                       */
    gaer:gaerGram * 0.9 / urt.V, /* g aktiv gær pr. L (tørgær ≈ 90 %)  */
    doed:0,                      /* g døde celler pr. L                 */
    vaagen:0,                    /* 0–1: hvor godt gæren er kommet i gang */
    bismag:0,
    co2Rate:0,                   /* g/L pr. time — til gærlåsen         */
  };
}

export function skridtGaering(g, dt){
  const f = gaerTempo(g.T);
  g.vaagen += (1 - g.vaagen) * (1 - Math.exp(-VÅGN_20 * f * dt));
  const mæt  = g.sukker / (KS + g.sukker);
  const tål  = Math.max(0, 1 - g.ethanol / E_TÅL);

  /* Vækst, så længe der er ilt (her: indtil gæren når X_MAKS). */
  const vækst = MY_20 * f * g.vaagen * mæt * (1 - g.gaer / X_MAKS);
  const dør   = gaerDoed(g.T);
  const nyGaer = g.gaer * Math.max(0, vækst) * dt;
  const døde   = g.gaer * (1 - Math.exp(-dør * dt));

  /* Gæringen selv. */
  const brugt = Math.min(g.sukker, Q_20 * f * g.vaagen * g.gaer * mæt * tål * dt);
  g.sukker  -= brugt;
  g.ethanol += brugt * ETHANOL_PR_G;
  g.co2     += brugt * CO2_PR_G * g.V;
  g.co2Rate  = dt > 0 ? brugt * CO2_PR_G / dt : 0;
  g.bismag  += brugt * bismagFaktor(g.T);

  g.gaer += nyGaer - døde;
  g.doed += døde;
  g.t += dt;
  return g;
}

export function gaeringSG(g){ return vaegtfylde(g.sukker + g.dextrin, g.ethanol); }

/** Hvilken fase gæren er i — til statusfeltet og figuren. */
export function fase(g){
  if(g.gaer < 0.05 * (g.gaer + g.doed) && g.sukker > 3) return 'død';
  if(g.vaagen < 0.5) return 'lag';
  if(g.sukker < 2) return 'hvile';
  if(g.gaer < X_MAKS * 0.85 && g.co2Rate < 0.4) return 'vækst';
  return 'gæring';
}

/* ═════════════════════════════════════════════════════════
   4 · SMAGNING — hvad blev det til?
   ═════════════════════════════════════════════════════════ */
export function resultat(urt, g){
  const fg  = gaeringSG(g);
  const abv = alkoholVol(g.ethanol);
  const forgaering = (urt.og - fg) / (urt.og - 1);    /* tilsyneladende */
  /* Restsødme: det sukker og de dextriner, der er tilbage (g/L). */
  const restsukker = g.sukker;
  const fylde      = g.dextrin;
  /* Bitterhed mod sødme: BU:GU — IBU delt med «vægtfyldepoint». */
  const bugu = urt.ibu / Math.max(1, (urt.og - 1) * 1000);
  /* Bismag pr. liter øl, skaleret så 18 °C og normal urt giver ≈ 1. */
  const bismag = g.bismag / 95;
  return {og:urt.og, fg, abv, forgaering, ibu:urt.ibu, aroma:urt.aroma,
          restsukker, fylde, bugu, bismag, ebc:urt.ebc};
}
