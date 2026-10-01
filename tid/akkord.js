// akkord.js — akkordregnskabet: hvor meget af opgavefordelingen er leveret?
//
// Hver aktivitet i opgavefordelingen er en akkord: et budget i timer, der
// betales, uanset hvor lang tid arbejdet tager. Regnskabet stiller to tal op
// mod hinanden for hver aktivitet og samlet:
//
//   brugt   = den tid, der er registreret
//   optjent = den del af budgettet, der er leveret indtil nu
//   saldo   = optjent − brugt   (plus: arbejdet har taget mindre tid, end det betales med)
//
// Hold med normgrundlag optjener pr. arbejdstype:
//
//   undervisning = den undervisning, der er registreret, højst normen
//   forberedelse = den undervist andel af undervisningsnormen × forberedelsesnormen
//                  — altså (faktor − 1) time for hver undervist time
//   retning      = retteakkorden × rettede elevtimer / holdets elevtimer pr. elev,
//                  højst normen. Elevtimerne kommer fra holdets rettede sæt
//                  (se rettet.js); retteakkorden er resten af holdets budget
//                  (se normer.js)
//
// Tillægget på ældre hold er ikke med: eksamen og årsprøve er opgaver for
// sig, i det skoleår de betales. Et hold uden normgrundlag optjener sit budget
// jævnt over året, ligesom en løbende opgave.
//
// Opgaver optjener efter deres optjeningsmåde: løbende (jævnt over året), ved
// afslutning (intet, til den afsluttes) eller manuelt (en procent). En
// afsluttet opgave har altid optjent hele sit budget.
//
// Fælles tid er tid, der ikke hører til en akkord: ubundet tid, pauser og
// opgaver uden budget. Den tæller som brugt og kan fordeles på alle
// aktiviteter med budget, vægtet efter budgettet — også de afsluttede, så
// tallene ikke springer, når en opgave afsluttes. Fordelingen flytter kun,
// hvor tiden står; den samlede saldo er den samme.
//
// Alle tal er i minutter.

import { normerFor, budgetTimer } from './normer.js';
import { MODULER, skemaLaengde } from './skema.js';
import { erPause } from './pauser.js';

export const MODUL_MIN = skemaLaengde(MODULER[0]);       // 95

export const OPTJENING = {
  loebende:   'Løbende',
  afslutning: 'Ved afslutning',
  manuel:     'Manuelt'
};
export const optjeningFor = a =>
  OPTJENING[a?.optjening] ? a.optjening : 'loebende';

// Holdets rettede elevtimer — summen af de registrerede sæt, evt. kun dem
// mellem to datoer ('YYYY-MM-DD', fra og med / til og uden)
export function rettedeElevtimer(a, fra = null, til = null) {
  return (a?.rettedeSaet || [])
    .filter(s => (!fra || s.dato >= fra) && (!til || s.dato < til))
    .reduce((sum, s) => sum + (Number(s.elevtimer) || 0), 0);
}

// Hvad holdet kan optjene pr. arbejdstype, i minutter — eller null uden
// normgrundlag. Tillægget er udeladt (se øverst).
function holdNormer(a) {
  const n = normerFor(a);
  if (!n) return null;
  return {
    undervisning: n.undervisning * 60,
    forberedelse: n.forberedelse * 60,
    retning:      n.retning * 60,
    tillaeg:      n.tillaeg * 60,
    elevtimer:    n.elevtimer
  };
}

// Budgettet, der regnes akkord på, i minutter — eller null
function akkordBudget(a) {
  const n = holdNormer(a);
  if (n) return n.undervisning + n.forberedelse + n.retning;
  const b = budgetTimer(a);
  return b != null ? b * 60 : null;
}

// ─── Hovedregningen ───────────────────────────────────────
// acts:    alle aktiviteter (filtreres til skoleåret her)
// entries: skoleårets afsluttede registreringer, pauser medregnet
// andel:   den del af skoleåret, der er gået (0–1)
// fordel:  skal den fælles tid fordeles på aktiviteterne?
export function beregnAkkord({ acts, entries, aar, andel, fordel }) {
  const aarets  = acts.filter(a => a.schoolYear === aar);
  const iAaret  = new Set(aarets.map(a => a.id));
  const harBudget = a => akkordBudget(a) != null;

  // Registreret tid pr. aktivitet og pr. arbejdstype
  const direkte = {}, wt = {};
  const faelles = { ubundet: 0, pauser: 0, udenBudget: 0, total: 0 };
  entries.forEach(e => {
    const m = e.durationMinutes || 0;
    if (erPause(e))     { faelles.pauser  += m; return; }
    if (!e.activityId)  { faelles.ubundet += m; return; }
    // Tid på en aktivitet fra et andet skoleår tælles heller ikke i
    // rapportens samlede tid — regnskabet følger den
    if (!iAaret.has(e.activityId)) return;
    direkte[e.activityId] = (direkte[e.activityId] || 0) + m;
    if (e.workType) {
      wt[e.activityId] ??= {};
      wt[e.activityId][e.workType] = (wt[e.activityId][e.workType] || 0) + m;
    }
  });

  // En under-opgave med eget budget er sin egen akkord. En uden budget hører
  // under forælderens, og dens tid regnes med dér. Forælderens budget rummer
  // børnenes, så dens egen akkord er det, der er tilbage, når de er trukket fra.
  const boern = id => aarets.filter(c => c.parentId === id);

  const enheder = {};
  aarets.forEach(a => {
    if (a.parentId && harBudget(a)) {
      enheder[a.id] = enhed(a, direkte[a.id] || 0, wt[a.id] || {}, akkordBudget(a), andel);
      return;
    }
    if (a.parentId) return;                     // under forælderens akkord
    const udenEget = boern(a.id).filter(c => !harBudget(c));
    const brugt = (direkte[a.id] || 0) +
      udenEget.reduce((s, c) => s + (direkte[c.id] || 0), 0);
    let budget = akkordBudget(a);
    if (budget != null) {
      const boernsBudget = boern(a.id).filter(harBudget)
        .reduce((s, c) => s + akkordBudget(c), 0);
      budget = Math.max(0, budget - boernsBudget);
    }
    enheder[a.id] = enhed(a, brugt, wt[a.id] || {}, budget, andel);
  });

  // Opgaver uden budget er fælles tid, til de får et
  Object.values(enheder).forEach(u => {
    if (u.budget == null) { faelles.udenBudget += u.brugt; u.iFaelles = true; }
  });
  faelles.total = faelles.ubundet + faelles.pauser + faelles.udenBudget;

  // Fordelingen efter budget
  const medBudget = Object.values(enheder).filter(u => u.budget > 0);
  const vaegt     = medBudget.reduce((s, u) => s + u.budget, 0);
  const fordelt   = fordel && vaegt > 0;
  medBudget.forEach(u => {
    u.faelles = fordelt ? faelles.total * u.budget / vaegt : 0;
  });
  Object.values(enheder).forEach(u => {
    u.saldo = u.budget == null ? null : u.optjent - u.brugt - u.faelles;
  });

  const optjent = Object.values(enheder)
    .reduce((s, u) => s + (u.budget != null ? u.optjent : 0), 0);
  const brugt   = entries.reduce((s, e) =>
    s + (!e.activityId || erPause(e) || iAaret.has(e.activityId) ? (e.durationMinutes || 0) : 0), 0);

  return {
    enheder, faelles, fordelt,
    akkord:  vaegt,                 // summen af budgetterne
    optjent, brugt,
    saldo:   optjent - brugt,
    // Fælles tid, der står for sig selv, fordi den ikke er fordelt
    faellesSaldo: fordelt ? 0 : -faelles.total
  };
}

// Én akkord: hvad er brugt, og hvad er optjent?
function enhed(a, brugt, wt, budget, andel) {
  const u = { act: a, brugt, budget, optjent: 0, faelles: 0, saldo: null, maade: null };
  if (budget == null) return u;

  const n = a.type === 'hold' ? holdNormer(a) : null;
  if (n) {
    u.maade = 'hold';
    u.hold  = holdOptjening(a, n, wt);
    u.optjent = u.hold.undervisning.optjent + u.hold.forberedelse.optjent + u.hold.retning.optjent;
    return u;
  }
  if (a.isArchived) { u.maade = 'afsluttet'; u.optjent = budget; return u; }

  u.maade = a.type === 'hold' ? 'loebende' : optjeningFor(a);
  const pct = Math.min(100, Math.max(0, Number(a.fremdrift) || 0));
  u.optjent = u.maade === 'loebende'   ? budget * andel
            : u.maade === 'manuel'     ? budget * pct / 100
            : 0;
  return u;
}

function holdOptjening(a, n, wt) {
  const elever = Number(a.normGrundlag?.elever) || 0;

  const uBrugt   = wt.undervisning || 0;
  const uOptjent = Math.min(uBrugt, n.undervisning);
  const uAndel   = n.undervisning > 0 ? uOptjent / n.undervisning : 0;

  // Retteakkorden i elevtimer pr. elev, og den andel, de rettede sæt dækker
  const rettet     = rettedeElevtimer(a);
  const rettetNorm = elever > 0 ? n.elevtimer / elever : 0;
  const rOptjent   = rettetNorm > 0 ? Math.min(n.retning, n.retning * rettet / rettetNorm) : 0;

  const brugtTyper = ['undervisning', 'forberedelse', 'retning']
    .reduce((s, t) => s + (wt[t] || 0), 0);

  return {
    undervisning: { brugt: uBrugt, norm: n.undervisning, optjent: uOptjent },
    forberedelse: { brugt: wt.forberedelse || 0, norm: n.forberedelse, optjent: uAndel * n.forberedelse },
    retning:      { brugt: wt.retning || 0, norm: n.retning, optjent: rOptjent },
    moduler:      uBrugt / MODUL_MIN,
    modulerNorm:  n.undervisning / MODUL_MIN,
    overNorm:     Math.max(0, uBrugt - n.undervisning),
    rettet, rettetNorm,
    tillaeg:      n.tillaeg,
    brugtTyper
  };
}

// Flere akkorder lagt sammen — fx en opgave og dens under-opgaver i én række
export function samletEnhed(liste) {
  const med = liste.filter(u => u && u.budget != null);
  if (!med.length) return null;
  const s = f => med.reduce((t, u) => t + (u[f] || 0), 0);
  return {
    budget: s('budget'), brugt: s('brugt'), optjent: s('optjent'),
    faelles: s('faelles'), saldo: s('optjent') - s('brugt') - s('faelles')
  };
}
