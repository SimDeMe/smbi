/* ═══════════════════════════════════════════════════════════
   brygning.js — fagmodellen bag hele brygningen.

   Alt det, der kan diskuteres fagligt, står her og ingen andre
   steder: maltsorternes indhold, blandingstemperaturen ved
   indmæskningen, hvordan de to amylaser nedbryder stivelsen, hvor
   meget sukker skyllevandet får med ud af kornene, hvor meget
   bitterhed og aroma humlen giver under kogningen, og hvordan
   gærtyperne omsætter sukkeret til ethanol og CO₂. Modulet kender
   hverken lærredet eller knapperne. Det regner.

   Én batch løber igennem stationerne, og det, en station
   efterlader, er det, den næste starter med:

     malt + vand ─ indmæskning ─▶ mæsk ─ mæskning ─▶ omsat mæsk
       ─ skylning ─▶ urt ─ kogning ─▶ humlet urt ─ gæring ─▶ øl

   Mængderne holdes i gram (kulhydrater) og liter (volumen), så
   regnskabet kan følges hele vejen: den stivelse, der ikke bliver
   til sukker i mæsken, og det sukker, der bliver i kornene efter
   skylningen, kan gæren aldrig lave alkohol af.
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

/* Reaktionerne går hurtigere, jo varmere det er (Q₁₀ ≈ 2). */
function q10(T, ref){ return Math.pow(2, (T - ref) / 10); }

/* ═════════════════════════════════════════════════════════
   0 · RÅVARER — malten og vandet
   ═════════════════════════════════════════════════════════ *
 * Hver maltsort beskrives ved, hvad et kilo giver til mæsken (andele
 * af massen):
 *   stivelse — skal nedbrydes af enzymerne, før det kan opløses
 *   sukker   — er allerede gærbart sukker
 *   dextrin  — opløste kulhydrater, som hverken enzymerne eller gæren
 *              kan komme videre med (karamel- og ristet malt)
 *   andet    — opløseligt protein m.m. — ugærbart
 *   enzym    — maltens egne amylaser i forhold til pilsnermalt. Karamel-
 *              og ristet malt er opvarmet så kraftigt, at enzymerne er
 *              ødelagt, og bygflager er slet ikke maltet. De skal låne
 *              enzymerne fra basismalten.
 *   ebc      — maltens farve
 *
 * Laboratoriets ekstrakt for lys malt er ca. 80 %; med hjemmebryggerens
 * grovere kværning kommer ca. 70 % i spil, og det er det tal, der står
 * her (stivelse + sukker + andet).                                    */
export const MALTE = [
  {id:'pils',   navn:'Pilsnermalt', kort:'Pilsner',     ebc:3.5,  stivelse:0.63, sukker:0.03, dextrin:0,    andet:0.035, enzym:1.00,
   smag:'lys og kornet', farve:'#F6E3A1'},
  {id:'pale',   navn:'Pale ale-malt', kort:'Pale ale',   ebc:6,    stivelse:0.63, sukker:0.03, dextrin:0,    andet:0.035, enzym:0.85,
   smag:'brød og kiks', farve:'#EFCF84'},
  {id:'muench', navn:'Münchenermalt', kort:'München',   ebc:20,   stivelse:0.61, sukker:0.03, dextrin:0,    andet:0.045, enzym:0.45,
   smag:'fyldig maltsmag', farve:'#D9A55A', malt:1},
  {id:'hvede',  navn:'Hvedemalt', kort:'Hvede',       ebc:4.5,  stivelse:0.65, sukker:0.03, dextrin:0,    andet:0.05, enzym:0.90,
   smag:'blød, protein til skum', farve:'#F3E6BE', protein:1},
  {id:'flager', navn:'Bygflager', kort:'Bygflager',       ebc:3,    stivelse:0.64, sukker:0,    dextrin:0,    andet:0.045, enzym:0,
   smag:'umaltet · fylde og skum', farve:'#F1ECD9', protein:0.6},
  {id:'kar60',  navn:'Karamelmalt 60', kort:'Karamel 60',  ebc:60,   stivelse:0,    sukker:0.35, dextrin:0.33, andet:0.05, enzym:0,
   smag:'karamel og honning', farve:'#C47F2E', karamel:1},
  {id:'kar120', navn:'Karamelmalt 120', kort:'Karamel 120', ebc:120,  stivelse:0,    sukker:0.30, dextrin:0.38, andet:0.05, enzym:0,
   smag:'mørk karamel og rosin', farve:'#8E4A1C', karamel:1.6},
  {id:'ristet', navn:'Ristet byg', kort:'Ristet byg',      ebc:1300, stivelse:0,    sukker:0.02, dextrin:0.55, andet:0.05, enzym:0,
   smag:'ristet, kaffe og kakao', farve:'#2A1608', ristet:1},
];
export const maltsort = id => MALTE.find(m => m.id === id);

export const VAND_C = 4.18;   /* kJ/(kg·K) — vand                   */
export const MALT_C = 1.7;    /* kJ/(kg·K) — tør malt                */
export const MALT_T = 20;     /* °C — malten står i rummet           */
export const KORN_VOL = 0.7;  /* L, som et kilo kværnet malt fylder  */

export function maltKg(malt){ return Object.values(malt).reduce((s, v) => s + (v || 0), 0); }

/** Blandingstemperaturen, når malten røres i vandet. Varmen, vandet
 *  afgiver, er den varme, malten optager:
 *    m_v · c_v · (T_v − T) = m_m · c_m · (T − T_m)                   */
export function blandingsT(vandL, Tv, kg, Tm = MALT_T){
  const cv = vandL * VAND_C, cm = kg * MALT_C;
  return (cv * Tv + cm * Tm) / (cv + cm);
}
/** Hvor varmt indmæskningsvandet skal være for at ramme T. */
export function vandTil(T, vandL, kg, Tm = MALT_T){
  return T + kg * MALT_C / (vandL * VAND_C) * (T - Tm);
}

/** Maltens enzymer i forhold til ren pilsnermalt (vægtet gennemsnit). */
export function enzymkraft(malt){
  const kg = maltKg(malt);
  if(kg <= 0) return 0;
  return MALTE.reduce((s, m) => s + (malt[m.id] || 0) * m.enzym, 0) / kg;
}

/** Den mængde ekstrakt (g), malten i bedste fald kan give. */
export function potentiale(malt){
  return MALTE.reduce((s, m) => s + (malt[m.id] || 0) * 1000 * (m.stivelse + m.sukker + m.dextrin + m.andet), 0);
}

/** Opskriftens forventede OG: 97 % af stivelsen omsat, 90 % skyllet ud. */
export function forventetOG(malt, V = 22){
  return vaegtfylde(potentiale(malt) * 0.97 * 0.9 / V);
}

/* Maillard-reaktioner og malten selv giver farven. Moreys formel
   omregner malt og volumen til øllets farve i EBC. */
export function farveEBC(malt, V){
  let mcu = 0;
  for(const m of MALTE) mcu += (malt[m.id] || 0) * 2.2046 * (m.ebc / 1.97) / (V * 0.2642);
  const srm = 1.4922 * Math.pow(mcu, 0.6859);
  return srm * 1.97;
}

/** Specialmalternes smag pr. liter (kg pr. 20 L). */
export function maltsmag(malt, V){
  const s = {karamel:0, ristet:0, malt:0, protein:0};
  for(const m of MALTE){
    const kg = (malt[m.id] || 0) * 20 / V;
    for(const k of Object.keys(s)) s[k] += kg * (m[k] || 0);
  }
  return s;
}

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

/* Stivelsen skal forklistres (gelatineres), før enzymerne kan komme
   til. Bygstivelse forklistres omkring 60–64 °C. */
export function forklistring(T){ return 1 / (1 + Math.exp(-(T - 61) / 1.6)); }

/* Denaturering: andelen af enzymet, der ødelægges pr. minut.
   β-amylase: halveringstid ≈ 60 min ved 63 °C, 10 min ved 67 °C.
   α-amylase: halveringstid ≈ 60 min ved 72 °C,  5 min ved 78 °C. */
const LN2 = Math.LN2;
export function denatBeta(T){  return LN2 / 60 * Math.exp((T - 63) / 2.23); }
export function denatAlfa(T){  return LN2 / 60 * Math.exp((T - 72) / 2.41); }

/* Hvor hurtigt hvert enzym arbejder, pr. minut, ved fuld aktivitet,
   ren basismalt og 65 °C. Tallene er valgt, så en mæsk ved 65 °C er
   omsat (jodprøven negativ) efter ca. 20–30 minutter. */
const K_ALFA = 0.11, K_BETA = 0.10;

/* Hvad et klip giver. α-amylase: mest dextriner, lidt sukker og
   nogle grænsedextriner. β-amylase direkte på stivelse: maltose, til
   den rammer en forgrening. */
const ALFA_UD  = {sukker:0.14, dextrin:0.66, graense:0.20};
const BETA_UD  = {sukker:0.70, graense:0.30};

/** Mæsken lige efter indmæskningen. */
export function nyMaesk(malt, vandL, T){
  const m = {
    t:0, T,                           /* min, °C                     */
    malt:{...malt}, kg:maltKg(malt), vand:vandL,
    enzym:enzymkraft(malt),
    stivelse:0, dextrin:0, graense:0, sukker:0, andet:0,
    alfa:1, beta:1,                   /* enzymaktivitet, 0–1         */
  };
  for(const s of MALTE){
    const g = (malt[s.id] || 0) * 1000;
    m.stivelse += g * s.stivelse;
    m.sukker   += g * s.sukker;
    m.graense  += g * s.dextrin;      /* karamel/ristet: ugærbart    */
    m.andet    += g * s.andet;
  }
  return m;
}

/** Enzymernes øjeblikkelige arbejdstempo (til instrumenterne), 0–1. */
export function enzymTempo(m){
  const gel = forklistring(m.T);
  return {
    alfa: m.enzym * m.alfa * q10(m.T, 72) * gel,
    beta: m.enzym * m.beta * q10(m.T, 65) * gel,
  };
}

/* Varmelegemet: 3 kW ind i mæsken. Uden varme taber gryden ca.
   0,3 °C i minuttet til omgivelserne. */
export const VARME_KW = 3;
export function varmekapacitet(kg, vandL){          /* kJ/K */
  return vandL * VAND_C + kg * MALT_C;
}

/** Et skridt på dt minutter mod måltemperaturen Tmaal (null = slukket). */
export function skridtMaesk(m, dt, Tmaal){
  const C = varmekapacitet(m.kg, m.vand);
  const op  = VARME_KW * 60 / C;                  /* °C pr. min */
  const ned = 0.3;
  const d = Tmaal == null ? -Infinity : Tmaal - m.T;
  m.varmer = d > 0.05;
  m.T += Math.max(-ned * dt, Math.min(op * dt, d));

  const gel = forklistring(m.T);
  const fa = K_ALFA * m.enzym * m.alfa * q10(m.T, 65) * gel;
  const fb = K_BETA * m.enzym * m.beta * q10(m.T, 65);

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
  const rest = startStivelse > 0 ? m.stivelse / startStivelse : 0;
  return {rest, positiv:rest > 0.03};
}

/* ── Mæskeprogrammer ───────────────────────────────────── *
 * Et program er en række raster: varm op til temperaturen, og hold
 * den i et antal minutter. Rasten tæller fra, temperaturen er nået.
 * Alle programmer slutter med udmæskning ved 78 °C: enzymerne
 * denatureres, så sukkerforholdet ligger fast, og den varme urt er
 * tyndere og lettere at skylle ud af kornene.                      */
export const PROGRAMMER = [
  {id:'infusion', navn:'Enkelt infusion',
   trin:v => [{T:v.rast, min:v.tid, navn:'forsukringsrast'}, {T:78, min:10, navn:'udmæskning'}]},
  {id:'trin', navn:'Trinmæskning 63 → 72 → 78 °C',
   trin:() => [{T:63, min:35, navn:'β-amylaserast'}, {T:72, min:25, navn:'α-amylaserast'},
               {T:78, min:10, navn:'udmæskning'}]},
  {id:'manuel', navn:'Manuel styring', trin:null},
];
export const program = id => PROGRAMMER.find(p => p.id === id) || PROGRAMMER[0];

export function nyKoersel(trin){ return {trin, i:0, ur:0, faerdig:!trin || !trin.length}; }

/** Programmets måltemperatur lige nu (null, når det er færdigt). */
export function programMaal(p, m, dt){
  if(p.faerdig) return null;
  const tr = p.trin[p.i];
  if(m.T >= tr.T - 0.6) p.ur += dt;
  if(p.ur >= tr.min - 1e-9){
    p.i++; p.ur = 0;
    if(p.i >= p.trin.length){ p.faerdig = true; return null; }
  }
  return p.trin[p.i].T;
}

/** Ca. hvor lang tid programmet tager (til grafens tidsakse). */
export function programTid(trin, T0, kg, vandL){
  if(!trin) return 90;
  const op = VARME_KW * 60 / varmekapacitet(kg, vandL);
  let t = 0, T = T0;
  for(const tr of trin){
    t += tr.T > T ? (tr.T - T) / op : (T - tr.T) / 0.3;
    t += tr.min; T = tr.T;
  }
  return t;
}

/* ═════════════════════════════════════════════════════════
   2 · SKYLNING — urten løber fra, skyllevandet vasker efter
   ═════════════════════════════════════════════════════════ *
 * Når mæsken er færdig, åbnes hanen i bunden af mæskekarret. Kornenes
 * avner lægger sig som et filter, og den søde urt løber klar fra
 * (forurten). Kornene holder dog på ca. 1 L væske pr. kg — og den
 * væske er lige så sød som resten. Derfor eftergydes der: varmt
 * skyllevand fordeles over kornlaget i samme tempo, som urten løber
 * fra, og vasker sukkeret ud.
 *
 * Modellen har to puljer i karret:
 *   fri væske   — mellem og over kornene; den løber ud ad hanen
 *   i kornene   — sukkeret herfra skal diffundere ud i den fri væske
 * Diffusionen går hurtigere, jo varmere det er (og jo tyndere urten
 * er). Skyllevand ved 75–78 °C er det sædvanlige: koldere vasker
 * dårligt, og over ca. 80 °C trækkes garvestoffer (polyfenoler) ud af
 * avnerne, så øllet bliver snerpende. Det samme sker, når der skylles
 * så længe, at afløbet er næsten rent vand (under ca. 1,010).        */
export const ABSORB = 1.0;   /* L væske, kornene holder på pr. kg    */
export const FRI    = 0.35;  /* L væske, der skal stå over kornlaget pr. kg */
export const HANE   = 0.5;   /* L i minuttet gennem hanen            */

/** Diffusionen ud af kornene, pr. minut. */
export function diffusion(T){ return 0.07 * Math.exp((T - 76) / 10); }

export function nySkylning(m){
  const E = m.sukker + m.dextrin + m.graense + m.andet;   /* opløst ekstrakt */
  const A = ABSORB * m.kg;
  const c0 = E / m.vand;
  return {
    t:0, kg:m.kg, malt:{...m.malt}, A,
    Vb:m.vand - A, Eb:c0 * (m.vand - A),   /* fri væske og dens ekstrakt  */
    Eg:c0 * A,                              /* ekstrakt i kornene          */
    Tb:m.T, Tmaks:m.T,
    Vk:0, Ek:0, Vs:0,                       /* kogekarret og skyllevandet  */
    garvestof:0, sgUd:vaegtfylde(c0),
    E0:E, andelSukker:E > 0 ? m.sukker / E : 0,
    stivelseRest:m.stivelse,
    stivelseAndel:m.stivelse / Math.max(1, m.stivelse + E),
    fase:'forurt',
  };
}

/** Et skridt på dt minutter med skyllevand ved Ts °C. */
export function skridtSkyl(s, dt, Ts){
  /* Sukker diffunderer ud af kornene. */
  const cg = s.Eg / s.A, cb = s.Eb / s.Vb;
  const J = diffusion(s.Tb) * dt * s.A * (cg - cb) / (1 + s.A / s.Vb * diffusion(s.Tb) * dt);
  s.Eg -= J; s.Eb += J;

  /* Urten løber fra ad hanen. */
  const ud = Math.min(HANE * dt, Math.max(0, s.Vb - 0.2));
  const cUd = s.Eb / s.Vb;
  s.sgUd = vaegtfylde(cUd);
  s.Ek += cUd * ud; s.Eb -= cUd * ud; s.Vb -= ud; s.Vk += ud;

  if(s.fase === 'forurt' && s.Vb <= FRI * s.kg) s.fase = 'skyl';
  if(s.fase === 'skyl'){
    /* Lige så meget skyllevand kommer i, som der løber fra. */
    const C = (s.Vb + s.A) * VAND_C + s.kg * MALT_C;
    s.Tb += ud * VAND_C * (Ts - s.Tb) / C;
    s.Vb += ud; s.Vs += ud;
  }
  s.Tb -= 0.03 * dt;                     /* karret taber lidt varme  */
  s.Tmaks = Math.max(s.Tmaks, s.Tb);

  /* Garvestoffer: fra meget varmt skyllevand og fra tyndt afløb. */
  s.garvestof += ud * (Math.exp((s.Tb - 79) / 2.5) + Math.pow(Math.max(0, (1.012 - s.sgUd) / 0.004), 2));
  s.t += dt;
  return s;
}

export function skylUdbytte(s){ return s.E0 > 0 ? s.Ek / s.E0 : 0; }
export function kogekarSG(s){ return s.Vk > 0 ? vaegtfylde(s.Ek / s.Vk) : 1; }

/** Hvad skylningen giver videre til kogningen. */
export function urtAfSkyl(s){
  return {
    V:s.Vk,
    sukker:s.Ek * s.andelSukker,
    dextrin:s.Ek * (1 - s.andelSukker),   /* ugærbart ekstrakt */
    malt:{...s.malt},
    garvestof:s.garvestof,
    udbytte:skylUdbytte(s),
    stivelseRest:s.stivelseRest,
    stivelseAndel:s.stivelseAndel,
    Tmaks:s.Tmaks,
  };
}

/* ═════════════════════════════════════════════════════════
   3 · KOGNING — humlens bitterhed, og vand der damper væk
   ═════════════════════════════════════════════════════════ *
 * Urten koges i en time. Det gør tre ting:
 *   – enzymerne denatureres, og urten bliver steril,
 *   – vand fordamper, så sukkeret koncentreres, og
 *   – humlens α-syrer omdannes (isomeriseres) til iso-α-syrer. Kun
 *     iso-α-syrerne er opløselige nok til at give øllet bitterhed, og
 *     omdannelsen tager tid — derfor giver tidlig humle bitterhed.
 *   – humlens æteriske olier fordamper med dampen — derfor skal humle
 *     til aroma først i til sidst.
 *
 * Humlesorterne er forskellige: bitterhumle har meget α-syre, aroma-
 * humle har mindre α-syre, men en duft, man vil beholde. Tallene er
 * typiske værdier (α-syre i %, olie i mL pr. 100 g).
 *
 * Bitterheden regnes i IBU (mg iso-α-syre pr. liter) med Tinseths
 * formel, som bryggere bruger den.                                */
export const HUMLER = [
  {id:'magnum',  navn:'Magnum', kort:'Magnum',              alfa:0.13,  olie:2.0, rolle:'bitterhumle',  duft:0.35, aroma:'neutral'},
  {id:'cascade', navn:'Cascade', kort:'Cascade',             alfa:0.065, olie:1.2, rolle:'aroma og bitter', duft:1, aroma:'citrus og grapefrugt'},
  {id:'citra',   navn:'Citra', kort:'Citra',               alfa:0.12,  olie:2.2, rolle:'aromahumle',   duft:1, aroma:'tropisk frugt og citrus'},
  {id:'hallertauer', navn:'Hallertauer', kort:'Hallert.',     alfa:0.04,  olie:0.8, rolle:'aromahumle',   duft:1, aroma:'krydret og blomsteragtig'},
  {id:'saaz',    navn:'Saaz', kort:'Saaz',                alfa:0.035, olie:0.6, rolle:'aromahumle',   duft:1, aroma:'krydret og urteagtig'},
  {id:'ekg',     navn:'East Kent Goldings', kort:'EKG',  alfa:0.055, olie:0.6, rolle:'aroma og bitter', duft:1, aroma:'blød, honning og urter'},
];
export const humlesort = id => HUMLER.find(h => h.id === id) || HUMLER[1];

export const FORDAMP_L_PR_T = 4;     /* L pr. time ved kraftig kog              */
const OLIE_TAB = Math.LN2 / 8;       /* aromaolierne halveres på ca. 8 min      */
const OLIE_MG_PR_G = 9;              /* mg olie pr. g humle pr. (mL/100 g)      */

export function nyKog(urt){
  return {t:0, V:urt.V, urt, humle:[]};  /* humle: [{g, tid, sort}] */
}

export function tilsaetHumle(k, gram, sort){
  k.humle.push({g:gram, tid:k.t, sort});
}

export function skridtKog(k, dt){
  k.V = Math.max(8, k.V - FORDAMP_L_PR_T / 60 * dt);
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
    sum += udnyttelse(k.t - h.tid, sg) * humlesort(h.sort).alfa * h.g * 1000 / k.V;
  }
  return sum;
}

/** Humlearoma: de olier, der endnu ikke er dampet af (mg i alt),
 *  vægtet med hvor meget sorten dufter. */
export function aroma(k, sort = null){
  let sum = 0;
  for(const h of k.humle){
    if(sort && h.sort !== sort) continue;
    const s = humlesort(h.sort);
    sum += h.g * s.olie * OLIE_MG_PR_G * s.duft * Math.exp(-OLIE_TAB * (k.t - h.tid));
  }
  return sum;
}

export function urtAfKog(k){
  const noter = {};
  for(const h of k.humle) noter[h.sort] = aroma(k, h.sort) / k.V;
  return {
    V:k.V,
    sukker_gL:k.urt.sukker / k.V,
    dextrin_gL:k.urt.dextrin / k.V,
    og:kogSG(k),
    ibu:ibu(k),
    aroma:aroma(k) / k.V,           /* mg humleolie pr. L, der stadig dufter */
    aromaSorter:noter,
    kogetid:k.t,
    humle:k.humle.map(h => ({...h})),
    ebc:farveEBC(k.urt.malt, k.V),
    malt:{...k.urt.malt},
    garvestof:k.urt.garvestof,
    stivelseRest:k.urt.stivelseRest,
    stivelseAndel:k.urt.stivelseAndel,
  };
}

/* ═════════════════════════════════════════════════════════
   4 · GÆRING — sukker bliver til ethanol og CO₂
   ═════════════════════════════════════════════════════════ *
 * Urten køles og iltes, og gæren tilsættes. Først bruger gæren ilten
 * til at formere sig (respiration), bagefter gærer den:
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
 * Tiden regnes i timer. Gæren gennemgår de klassiske faser:
 *   lag     — gæren vågner og tilpasser sig urten
 *   vækst   — den formerer sig, til ilten er brugt
 *   gæring  — sukkeret omsættes; vægtfylden falder
 *   hvile   — sukkeret er brugt, gæren synker til bunds
 *
 * Gærtyperne er forskellige stammer:
 *   overgær (Saccharomyces cerevisiae) gærer ved 15–24 °C og samler
 *     sig i skummet; undergær (S. pastorianus) gærer ved 8–15 °C og
 *     synker til bunds.
 *   maltotriose — hvor meget af maltotriosen (ca. 15 % af sukkeret)
 *     stammen kan bruge. Det er den vigtigste grund til, at nogle
 *     gærtyper gærer øllet tørrere end andre.
 *   dextrin — saisongær kan nedbryde en del af dextrinerne selv.
 *   ester/fenol — stammens egen smag: frugt (estere) og krydderi,
 *     fx nellike og peber (fenoler).
 *   flok — hvor godt gæren klumper og synker (klart øl).
 *
 * Temperaturen styrer tempo og smag: varmt giver hurtig gæring og
 * flere estere; over stammens område laver den fuselalkoholer
 * (bismag), og for varmt dræber gæren.                              */
export const GAERTYPER = [
  {id:'ale', navn:'Amerikansk alegær', slags:'overgær', Tmin:15, Tmax:22, Topt:19, kulde:11, varme:37,
   maltotriose:0.8, dextrin:0, ester:0.6, fenol:0, flok:0.55, smag:'ren og neutral', dosis:11.5},
  {id:'engelsk', navn:'Engelsk alegær', slags:'overgær', Tmin:15, Tmax:21, Topt:18, kulde:11, varme:36,
   maltotriose:0.35, dextrin:0, ester:1.4, fenol:0, flok:0.9, smag:'frugtig, lidt restsødme', dosis:11.5},
  {id:'hvede', navn:'Hvedeølsgær', slags:'overgær', Tmin:17, Tmax:24, Topt:20, kulde:12, varme:36,
   maltotriose:0.7, dextrin:0, ester:1.8, fenol:1.0, flok:0.1, smag:'banan og nellike', dosis:11.5},
  {id:'lager', navn:'Lagergær · undergær', slags:'undergær', Tmin:9, Tmax:15, Topt:12, kulde:3, varme:31,
   maltotriose:1.0, dextrin:0, ester:0.3, fenol:0, flok:0.75, smag:'ren og frisk', dosis:23},
  {id:'saison', navn:'Saisongær', slags:'overgær', Tmin:20, Tmax:32, Topt:25, kulde:13, varme:40,
   maltotriose:1.0, dextrin:0.3, ester:1.0, fenol:0.8, flok:0.3, smag:'tør, peber og frugt', dosis:11.5},
];
export const gaertype = id => GAERTYPER.find(y => y.id === id) || GAERTYPER[0];

const MY_20   = 0.12;   /* gærens væksthastighed ved 20 °C, pr. time         */
const Q_20    = 0.33;   /* g sukker pr. g gær pr. time ved 20 °C            */
const KS      = 6;      /* g/L — halvmætning: det sidste sukker går langsomt */
export const X_MAKS = 3.2;    /* g gær pr. L, som ilten rækker til                 */
const E_TÅL   = 105;    /* g/L ethanol (≈ 13 %), hvor gæren giver op          */
const VÅGN_20 = 0.16;   /* pr. time — hvor hurtigt gæren kommer i gang       */
const MALTOTRIOSE = 0.15;     /* andel af det gærbare sukker                */
export const ETHANOL_PR_G = 0.47, CO2_PR_G = 0.45;
export const CO2_L_PR_G = 0.545;  /* liter CO₂-gas pr. gram ved 20 °C */

/** Gærens tempo i forhold til 20 °C — med hæmning i kulde og varme. */
export function gaerTempo(T, y = GAERTYPER[0]){
  const kulde = 1 / (1 + Math.exp(-(T - y.kulde) / 1.8));   /* går i stå i kulden */
  const varme = 1 / (1 + Math.exp((T - y.varme) / 1.4));
  return q10(T, 20) * kulde * varme;
}
/** Andelen af gærcellerne, der dør pr. time af varme. */
export function gaerDoed(T, y = GAERTYPER[0]){
  return 0.004 * Math.exp((T - (y.varme - 2)) / 1.5);
}

export function nyGaering(urt, gaerGram, T, typeId){
  const y = gaertype(typeId);
  /* Det gærbare sukker, denne stamme kan bruge — resten bliver i øllet. */
  const mt = MALTOTRIOSE * urt.sukker_gL;
  const brugbar = urt.sukker_gL - mt * (1 - y.maltotriose) + urt.dextrin_gL * y.dextrin;
  return {
    t:0, T, V:urt.V, urt, y,
    sukker:brugbar,
    dextrin:urt.sukker_gL + urt.dextrin_gL - brugbar,
    ethanol:0, co2:0,           /* g/L og g i alt                       */
    gaer:gaerGram * 0.9 / urt.V, /* g aktiv gær pr. L (tørgær ≈ 90 %)  */
    doed:0,                      /* g døde celler pr. L                 */
    vaagen:0,                    /* 0–1: hvor godt gæren er kommet i gang */
    ester:0, fenol:0, fusel:0,   /* g/L omsat sukker, vægtet            */
    co2Rate:0,                   /* g/L pr. time — til gærlåsen         */
  };
}

export function skridtGaering(g, dt){
  const y = g.y;
  const f = gaerTempo(g.T, y);
  g.vaagen += (1 - g.vaagen) * (1 - Math.exp(-VÅGN_20 * f * dt));
  const mæt  = g.sukker / (KS + g.sukker);
  const tål  = Math.max(0, 1 - g.ethanol / E_TÅL);

  /* Vækst, så længe der er ilt (her: indtil gæren når X_MAKS). */
  const vækst = MY_20 * f * g.vaagen * mæt * (1 - g.gaer / X_MAKS);
  const dør   = gaerDoed(g.T, y);
  const nyGaer = g.gaer * Math.max(0, vækst) * dt;
  const døde   = g.gaer * (1 - Math.exp(-dør * dt));

  /* Gæringen selv. */
  const brugt = Math.min(g.sukker, Q_20 * f * g.vaagen * g.gaer * mæt * tål * dt);
  g.sukker  -= brugt;
  g.ethanol += brugt * ETHANOL_PR_G;
  g.co2     += brugt * CO2_PR_G * g.V;
  g.co2Rate  = dt > 0 ? brugt * CO2_PR_G / dt : 0;
  /* Smagsstofferne dannes sammen med ethanolen. */
  g.ester += brugt * y.ester * Math.exp((g.T - y.Topt) / 6);
  g.fenol += brugt * y.fenol * Math.exp((g.T - y.Topt) / 8);
  g.fusel += brugt * Math.exp((g.T - y.Tmax) / 3);

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
   5 · SMAGNING — hvad blev det til?
   ═════════════════════════════════════════════════════════
   Smagsstofferne skaleres, så en normal øl giver ca. 1:
   100 g/L omsat sukker ved stammens yndlingstemperatur ≈ 1 i gærpræg
   (gange stammens egen styrke), og en gæring ved stammens øvre grænse
   ≈ 1 i fusel.                                                    */
export function resultat(urt, g){
  const fg  = gaeringSG(g);
  const abv = alkoholVol(g.ethanol);
  const forgaering = (urt.og - fg) / (urt.og - 1);    /* tilsyneladende */
  const bugu = urt.ibu / Math.max(1, (urt.og - 1) * 1000);
  const ms = maltsmag(urt.malt, urt.V);
  return {
    og:urt.og, fg, abv, forgaering, ibu:urt.ibu, aroma:urt.aroma, aromaSorter:urt.aromaSorter,
    restsukker:g.sukker, fylde:g.dextrin, bugu, ebc:urt.ebc,
    ester:g.ester / 95, fenol:g.fenol / 95, fusel:g.fusel / 95,
    snerp:urt.garvestof / urt.V,
    maltsmag:ms,
    gaer:g.y.id,
    /* Uklarhed: gær, der ikke synker, protein fra hvede og flager, og
       stivelse, der ikke blev omsat i mæsken. */
    uklar:Math.min(1, (1 - g.y.flok) * 0.8 + ms.protein * 0.25 + (urt.stivelseAndel > 0.05 ? 0.6 : 0)),
  };
}
