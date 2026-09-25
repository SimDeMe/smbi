/* ═══════════════════════════════════════════════════════════
   model.js — hormonmodellen.

   Aksen hypothalamus → hypofyse → ovarie → livmoder regnet dag
   for dag i de enheder, et hospitalslaboratorium svarer i:
   FSH, LH og hCG i IU/L, østradiol i pmol/L og progesteron i
   nmol/L. Tallene er valgt, så en ubehandlet cyklus rammer
   lærebogens kurver (ægløsning omkring dag 14, en cyklus på
   ca. 28 dage), men forløbet er ikke skrevet ind som en kurve —
   det opstår af feedbacksløjferne:

   • Negativ feedback: østrogen, progesteron og inhibin bremser
     hypofysens FSH og LH.
   • Positiv feedback: højt østrogen i halvanden dag uden
     progesteron udløser LH-toppen, og ca. 36 timer efter dens
     start brister folliklen.
   • Det gule legeme lever ca. 14 dage. Dør det, falder
     progesteron, slimhinden afstødes, og FSH får lov at stige.
     hCG fra et indlejret foster holder det i live.

   P-piller og fortrydelsespille lægger syntetiske hormoner oven
   i feedbacken. De tælles ikke med i østradiol og progesteron —
   laboratoriet måler dem ikke — men hypofysen og slimhinden
   mærker dem.

   Ingen DOM her: modellen kan køres i node for at kontrollere
   kurverne.
   ═══════════════════════════════════════════════════════════ */

export const DT = 0.02;            /* døgn pr. regneskridt */

/* ── Faste størrelser ────────────────────────────────────── */
export const K = {
  /* hypofysen */
  fshMaks: 10.5,  lhMaks: 7,       /* IU/L uden bremse */
  fshUd: 1.4,     lhUd: 5,         /* udskillelse pr. døgn (LH har kort halveringstid) */
  eBremsF: 750,   eBremsL: 1600,   /* pmol/L østradiol, der halverer … */
  pBremsF: 12,    pBremsL: 14,     /* nmol/L progesteron, der halverer … */
  inhibinB: 0.55, inhibinA: 1.1,   /* inhibin fra dominant follikel / gule legeme */

  /* LH-toppen */
  eTaerskel: 750,                  /* pmol/L, der skal holdes … */
  primTid: 1.3,                    /* … så mange døgn, før toppen udløses */
  pSpaerre: 4,                     /* nmol/L-ækvivalent gestagen, der spærrer */
  toppLH: 62, toppFSH: 11,         /* IU/L oven i det basale */
  toppVarighed: 2.4,               /* døgn */
  aegloesningEfter: 1.5,           /* døgn fra toppens start (≈ 36 timer) */
  modenFollikel: 16,               /* mm — mindre follikler brister ikke */

  /* folliklen */
  rekrutFSH: 5.2,                  /* IU/L FSH, der skal til for at en ny follikel vokser */
  vaekstTidlig: 0.42,              /* mm/døgn pr. IU/L FSH over tærsklen */
  vaekstDominant: 1.7,             /* mm/døgn, når LH-receptorerne er på plads */
  dominantVed: 10,                 /* mm */
  hvile: 3,                        /* mm — de små follikler, der altid er der */

  /* det gule legeme */
  gulLevetid: 14,                  /* døgn */

  /* hormonerne fra ovariet */
  eBasal: 110, eFollikel: 3.3,     /* pmol/L og pmol/L pr. mm² over hvilestørrelsen */
  eGul: 520, pGul: 46,             /* pmol/L / nmol/L fra et fuldt fungerende gult legeme */
  eTid: 0.45, pTid: 0.5,           /* døgn — hvor hurtigt blodet følger produktionen */

  /* slimhinden */
  slimMin: 1.5, slimMaks: 13,      /* mm */
  blodningDage: 5,

  /* befrugtning */
  saedLevetid: 5, aegLevetid: 1,   /* døgn */
  indlejringEfter: 8,              /* døgn efter ægløsning */

  /* syntetiske hormoner (som ækvivalenter i feedbacken) */
  pilleOe: 380, pilleG: 26,        /* pmol/L- og nmol/L-ækvivalent under en aktiv pille */
  syntTid: 0.9,                    /* døgn — halveringstid ≈ 0,6 døgn */
  fortrydG: 44,                    /* nmol/L-ækvivalent lige efter fortrydelsespillen */
  fortrydHalv: 1.1,                /* døgn */
};

/* ── Tilstand ────────────────────────────────────────────── */
export function nyTilstand(){
  return {
    t: 0,                  /* døgn siden start */
    cyklus: 1, dag: 1,     /* dag 1 = første blødningsdag */
    fsh: 7, lh: 5, oe: 130, prog: 0.8, hcg: 0,
    follikel: K.hvile,     /* diameter af den største follikel, mm */
    gul: -1,               /* det gule legemes alder i døgn; -1 = intet */
    gulFunktion: 0,        /* 0–1 */
    reddet: false,         /* holdt i live af hCG */
    prim: 0,               /* døgn med højt østrogen uden gestagen */
    topp: -1,              /* døgn siden LH-toppen startede; -1 = ingen */
    slim: 3,               /* slimhindens tykkelse, mm */
    blod: 0,               /* resterende blødningsdøgn */
    sekretorisk: false,    /* slimhinden har været under gestagen */
    aeg: -99,              /* tidspunkt for seneste ægløsning */
    saed: -99,             /* tidspunkt for seneste samleje */
    befrugtet: -1,         /* tidspunkt for befrugtning */
    gravid: false,         /* fostret har sat sig fast */
    pille: false, pilleDag: 0,
    pilleOe: 0, pilleG: 0, /* syntetiske ækvivalenter i blodet */
    fortryd: 0,            /* levonorgestrel fra en fortrydelsespille */
    haendelser: [],        /* {t, type} — tegnes på kurverne */
  };
}

/* ── Små hjælpere ────────────────────────────────────────── */
const glat = (a, b, x) => { const u = Math.min(1, Math.max(0, (x - a) / (b - a))); return u*u*(3 - 2*u); };
const mod  = (x, maal, tid, dt) => x + (maal - x) * (1 - Math.exp(-dt / tid));

/* LH-toppens form: stiger på et halvt døgn, klinger af over to. */
function toppForm(s){
  if (s < 0 || s > K.toppVarighed) return 0;
  return s < 0.55 ? glat(0, 0.55, s) : 1 - glat(0.55, K.toppVarighed, s);
}

/* Det gule legemes funktion som funktion af alder: topper en
   uge efter ægløsningen og går til grunde ved døgn 12–14. */
function gulForm(alder, reddet){
  if (alder < 0) return 0;
  const op = glat(0, 7, alder);
  return reddet ? op : op * (1 - glat(7.5, K.gulLevetid, alder));
}

function log(s, type){ s.haendelser.push({t: s.t, type}); }

/* ── Ét regneskridt ──────────────────────────────────────── */
export function skridt(s, dt = DT){
  /* syntetiske hormoner */
  if (s.pille){
    s.pilleDag += dt;
    if (s.pilleDag >= 28) s.pilleDag -= 28;
  }
  const aktivPille = s.pille && s.pilleDag < 21;
  s.pilleOe = mod(s.pilleOe, aktivPille ? K.pilleOe : 0, K.syntTid, dt);
  s.pilleG  = mod(s.pilleG,  aktivPille ? K.pilleG  : 0, K.syntTid, dt);
  s.fortryd *= Math.pow(0.5, dt / K.fortrydHalv);

  const oeFeed = s.oe + s.pilleOe;                   /* hvad hypofysen mærker */
  const gFeed  = s.prog + s.pilleG + s.fortryd;

  /* inhibin: B fra den dominante follikel, A fra det gule legeme */
  const inhibin = K.inhibinB * glat(6, 18, s.follikel) + K.inhibinA * s.gulFunktion;

  /* positiv feedback: højt østrogen uden gestagen primer toppen */
  if (s.topp < 0){
    if (s.oe > K.eTaerskel && gFeed < K.pSpaerre && s.follikel >= K.modenFollikel - 2) s.prim += dt;
    else s.prim = Math.max(0, s.prim - 2*dt);
    if (s.prim >= K.primTid){ s.topp = 0; s.prim = 0; log(s, 'lh-top'); }
  } else {
    s.topp += dt;
    if (s.topp > K.toppVarighed) s.topp = -1;
  }
  const top = s.topp >= 0 ? toppForm(s.topp) : 0;

  /* hypofysen: basal udskillelse under negativ feedback + top */
  const fshMaal = K.fshMaks / (1 + oeFeed/K.eBremsF + gFeed/K.pBremsF + inhibin) + K.toppFSH*top;
  const lhMaal  = K.lhMaks  / (1 + oeFeed/K.eBremsL + gFeed/K.pBremsL + 0.4*inhibin) + K.toppLH*top;
  s.fsh += (fshMaal - s.fsh) * K.fshUd * dt;
  s.lh  += (lhMaal  - s.lh)  * K.lhUd  * dt;

  /* folliklen */
  {
    let v;
    if (s.follikel < K.dominantVed){
      v = s.fsh > K.rekrutFSH
        ? K.vaekstTidlig * (s.fsh - K.rekrutFSH)
        : -0.35 * (s.follikel - K.hvile);                    /* atresi */
    } else {
      /* dominant: har LH-receptorer og klarer sig på mindre FSH */
      const stoette = (s.fsh + s.lh) / 9;
      v = stoette > 0.55 ? K.vaekstDominant * Math.min(1, stoette)
                         : -0.5 * (s.follikel - K.hvile);    /* går til grunde */
      if (s.follikel > 24) v = Math.min(v, 0);
    }
    s.follikel = Math.max(K.hvile, s.follikel + v*dt);
  }

  /* ægløsning ca. 36 timer efter toppens start */
  if (s.topp >= K.aegloesningEfter && s.topp - dt < K.aegloesningEfter && s.follikel >= K.modenFollikel){
    s.follikel = K.hvile;
    s.gul = 0; s.reddet = false;
    s.aeg = s.t;
    log(s, 'aegloesning');
  }

  /* det gule legeme */
  if (s.gul >= 0){
    s.gul += dt;
    if (!s.reddet && s.hcg > 5 && s.gul < K.gulLevetid - 1){ s.reddet = true; }
    s.gulFunktion = gulForm(s.gul, s.reddet);
    if (!s.reddet && s.gul > K.gulLevetid){ s.gul = -1; s.gulFunktion = 0; }
  }

  /* befrugtning: levende sædceller og et levende æg på samme tid */
  if (s.befrugtet < 0 && s.aeg > -50
      && s.t - s.aeg >= 0 && s.t - s.aeg <= K.aegLevetid
      && s.t - s.saed <= K.saedLevetid && s.saed <= s.t){
    s.befrugtet = s.t;
    log(s, 'befrugtning');
  }
  if (s.befrugtet >= 0 && !s.gravid && s.t - s.aeg >= K.indlejringEfter){
    s.gravid = true;
    log(s, 'indlejring');
  }
  /* hCG fordobles hvert andet døgn fra indlejringen */
  if (s.gravid){
    const alder = s.t - s.aeg - K.indlejringEfter;
    s.hcg = Math.min(120000, 4 * Math.pow(2, alder / 2));
  }

  /* ovariets hormoner */
  const graviditet = s.gravid ? Math.min(1, s.hcg / 3000) : 0;      /* moderkagen tager over */
  const oeMaal = K.eBasal
    + K.eFollikel * Math.max(0, s.follikel*s.follikel - K.hvile*K.hvile)
    + K.eGul * s.gulFunktion * (1 + 1.5*graviditet);
  const progMaal = 0.6 + K.pGul * s.gulFunktion * (1 + 1.2*graviditet);
  s.oe   = mod(s.oe,   oeMaal,   K.eTid, dt);
  s.prog = mod(s.prog, progMaal, K.pTid, dt);

  /* slimhinden: østrogen bygger op, gestagen gør den sekretorisk,
     og et fald i gestagen afstøder den */
  const gSlim = s.prog + s.pilleG;                    /* fortrydelsespillen regnes ikke med */
  if (gSlim > 10) s.sekretorisk = true;
  if (s.sekretorisk && gSlim < 4 && s.blod <= 0){
    s.sekretorisk = false;
    s.blod = K.blodningDage;
    if (!s.pille) { s.cyklus++; s.dag = 1 - dt; }
    log(s, s.pille ? 'bortfaldsbloedning' : 'menstruation');
  }
  if (s.blod > 0){
    s.blod -= dt;
    s.slim = mod(s.slim, K.slimMin, 1.3, dt);
  } else {
    const oeSlim = s.oe + s.pilleOe;
    const loft = gSlim > 10 ? (s.pilleG > 10 ? 4.5 : K.slimMaks) : K.slimMaks;
    const vaekst = 2.0 * Math.min(1.3, oeSlim / 900) * (gSlim > 10 ? 0.35 : 1);
    s.slim += vaekst * (1 - s.slim/loft) * dt;
    if (s.slim > loft) s.slim = mod(s.slim, loft, 3, dt);
  }

  s.t += dt;
  s.dag += dt;
}

/* ── Indgreb ─────────────────────────────────────────────── */
export function samleje(s){ s.saed = s.t; log(s, 'samleje'); }

export function fortrydelsespille(s){
  s.fortryd += K.fortrydG;
  /* virker kun, hvis LH-toppen ikke er gået i gang */
  if (s.topp < 0) s.prim = 0;
  log(s, 'fortryd');
}

export function saetPille(s, til){
  if (til === s.pille) return;
  s.pille = til;
  s.pilleDag = 0;
  log(s, til ? 'pille-start' : 'pille-stop');
}

/* ── Fase i ord ──────────────────────────────────────────── */
export function fase(s){
  if (s.gravid) return 'graviditet';
  if (s.blod > 0) return s.pille ? 'bortfaldsblødning' : 'menstruation';
  if (s.pille) return s.pilleDag < 21 ? 'p-pille · aktiv' : 'p-pille · pause';
  if (s.topp >= 0) return 'LH-top';
  if (s.gul >= 0) return 'lutealfase';
  return 'follikelfase';
}

/* Svinger modellen ind fra et groft skøn og stopper på første
   blødningsdag, så siden altid starter på dag 1. `optag` kaldes
   for hvert skridt, så forhistorien kan vises på kurverne; den
   får bagefter tiden flyttet, så dag 1 ligger på t = 0. */
export function indsvunget(optag){
  const s = nyTilstand();
  const spor = [];
  let menstruationer = 0, sikring = 0;
  while (menstruationer < 3 && sikring++ < 200/DT){
    const n = s.haendelser.length;
    skridt(s);
    if (optag) spor.push(optag(s));
    if (s.haendelser.length > n && s.haendelser[s.haendelser.length-1].type === 'menstruation') menstruationer++;
  }
  const nul = s.t;
  for (const p of spor) p.t -= nul;
  s.haendelser = s.haendelser
    .map(h => ({t: h.t - nul, type: h.type}))
    .filter(h => h.t > -60);
  s.haendelser[s.haendelser.length-1].t = 0;
  s.aeg -= nul; s.saed = -99;
  s.t = 0; s.dag = 1; s.cyklus = 1;
  return {s, spor: spor.filter(p => p.t > -60)};
}
