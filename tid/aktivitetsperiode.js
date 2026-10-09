// aktivitetsperiode.js — hvornår i skoleåret en aktivitet ligger
//
// Hvert hold og hver opgave hører til én af skolens faste perioder:
//
//   aar           Hele skoleåret — normperioden (standard)
//   grundforloeb  Grundforløb — første skoledag til grundforløbets slutning
//                 (fredag to uger efter efterårsferien)
//   efterGf       Efter grundforløb — dagen efter grundforløbet og året ud
//   eksamen       Eksamensperiode — sommerterminen i starten af normperioden.
//                 Skolen regner de officielle prøver (skriftlige og mundtlige)
//                 med i den normperiode, de holdes i — juni 2026 hører til
//                 2026/27 (FAQ om opgavefordeling på MG 2026/27)
//
// Datoerne står pr. skoleår i indstillingerne og kan rettes dér:
//   periodeDatoer: { "2026/27": { skolestart, gfSlut, eksamenFra, eksamenTil } }
// Uden gemte datoer bruges skolens plan, og findes den ikke for året, et
// skøn efter samme mønster.
//
// Perioden bruges to steder:
//
//   optjent  — en løbende opgave (og et hold uden normgrundlag) optjener sit
//              budget jævnt over arbejdsdagene i perioden (se akkord.js)
//   skema    — den tid, der «burde» være registreret, regner med, at
//              aktivitetens budget bruges i perioden. Resten af normen
//              fordeles jævnt over året som før:
//
//     forventet = norm × årets andel + Σ budget × (periodens andel − årets andel)
//
//   Summen er den samme ved årets slut; det er kun fordelingen hen over
//   året, der ændres.
//
// Gemmes på aktiviteten som periode: 'grundforloeb' | 'efterGf' | 'eksamen'
// (eller null = hele skoleåret). En under-opgave uden egen periode ligger i
// forælderens.

import { getSettings } from './indstillinger.js';
import { forloebIArbejdsdage, arbejdsdageIPerioden, tilDato, ferieFor } from './ferie.js';
import { addDays, datoInput, skoleaarStart, kortDato } from './periode.js';
import { budgetTimer } from './normer.js';

export const PERIODER = {
  aar:          'Hele skoleåret',
  grundforloeb: 'Grundforløb',
  efterGf:      'Efter grundforløb',
  eksamen:      'Eksamensperiode'
};

// Skolens datoer (Middelfart Gymnasium). Ret hvert år efter den nye plan.
export const SKOLENS_DATOER = {
  '2025/26': {
    skolestart: '2025-08-11', gfSlut: '2025-10-31',       // Kalender 2025-26: GF-slut fre. 31/10
    eksamenFra: '2025-06-01', eksamenTil: '2025-06-25'    // skøn — sommerterminen 2025
  },
  '2026/27': {
    skolestart: '2026-08-10', gfSlut: '2026-10-30',       // Ferieplan 2026-27; GF-slut som 2025: fre. uge 44
    eksamenFra: '2026-06-01', eksamenTil: '2026-06-24'    // Kalender 2025-26: sidste eksamensdag ons. 24/6
  }
};

// Skøn for et år uden plan: skolestart 2. mandag i august, grundforløbet
// slutter fredag i uge 44, eksamen 1.–24. juni
function skoen(aar) {
  const y = parseInt(aar);
  const aug1 = new Date(y, 7, 1);
  const mandag1 = addDays(aug1, (8 - aug1.getDay()) % 7);
  const jan4 = new Date(y, 0, 4);                          // altid i uge 1
  const uge1Mandag = addDays(jan4, -((jan4.getDay() + 6) % 7));
  return {
    skolestart: datoInput(addDays(mandag1, 7)),
    gfSlut:     datoInput(addDays(uge1Mandag, 43 * 7 + 4)),
    eksamenFra: `${y}-06-01`, eksamenTil: `${y}-06-24`
  };
}

export const datoerFor = (aar, s = getSettings()) =>
  ({ ...skoen(aar), ...(SKOLENS_DATOER[aar] || {}), ...(s.periodeDatoer?.[aar] || {}) });

// Periodens graenser som [fra, til) — midnat, klippet til normperioden
export function graenser(noegle, aar, start, slut, s = getSettings()) {
  const d = datoerFor(aar, s);
  const efter = str => addDays(tilDato(str), 1);
  const [fra, til] =
      noegle === 'grundforloeb' ? [tilDato(d.skolestart), efter(d.gfSlut)]
    : noegle === 'efterGf'      ? [efter(d.gfSlut), slut]
    : noegle === 'eksamen'      ? [tilDato(d.eksamenFra), efter(d.eksamenTil)]
    : [start, slut];
  return [fra < start ? start : fra, til > slut ? slut : til];
}

// Aktivitetens periode, evt. arvet fra forælderen
export function periodeFor(a, acts = []) {
  if (PERIODER[a?.periode]) return a.periode;
  const far = a?.parentId ? acts.find(p => p.id === a.parentId) : null;
  return PERIODER[far?.periode] ? far.periode : 'aar';
}

// Hvor stor en del af aktivitetens arbejdsdage, der er gået ved `nu`
export function aktivitetsAndel(a, acts, { aar, start, slut, ferie, nu = new Date() }) {
  const p = periodeFor(a, acts);
  if (p === 'aar') return forloebIArbejdsdage(start, slut, ferie, nu);
  const [f, t] = graenser(p, aar ?? a.schoolYear, start, slut);
  if (t <= f) return nu >= f ? 1 : 0;           // perioden ligger uden for året
  return forloebIArbejdsdage(f, t, ferie, nu);
}

// «10. aug – 30. okt 2026 · 58 arbejdsdage» — til formularen og indstillingerne
export function periodeBeskrivelse(noegle, aar, s = getSettings()) {
  const y = parseInt(aar, 10);
  const start = skoleaarStart(y), slut = skoleaarStart(y + 1);
  const [f, t] = graenser(noegle, aar, start, slut, s);
  if (t <= f) return 'ligger uden for normperioden';
  const sidste = addDays(t, -1);
  const n = arbejdsdageIPerioden(f, t, ferieFor(aar, s));
  return `${kortDato(f)} – ${kortDato(sidste)} ${sidste.getFullYear()} · ${n} arbejdsdage`;
}

// Den tid, der burde være registreret ved `nu`, i minutter (se øverst).
// Kun aktiviteter med en anden periode end hele året flytter noget.
export function forventetM({ acts, aar, normM, start, slut, ferie, nu = new Date() }) {
  const aaret = forloebIArbejdsdage(start, slut, ferie, nu);
  let m = normM * aaret;
  const aarets = acts.filter(a => a.schoolYear === aar);
  const budgetM = a => { const b = budgetTimer(a); return b != null ? b * 60 : 0; };
  aarets.forEach(a => {
    if (periodeFor(a, aarets) === 'aar') return;
    let b = budgetM(a);
    // Forælderens budget rummer børnenes — de med eget budget tæller selv
    if (!a.parentId) b -= aarets.filter(c => c.parentId === a.id).reduce((s, c) => s + budgetM(c), 0);
    if (b <= 0) return;
    m += b * (aktivitetsAndel(a, aarets, { aar, start, slut, ferie, nu }) - aaret);
  });
  return Math.round(m);
}

// Import: det, man skriver, → periodens nøgle
const ORD = {
  'grundforløb': 'grundforloeb', 'grundforloeb': 'grundforloeb', 'gf': 'grundforloeb',
  'efter grundforløb': 'efterGf', 'efter grundforloeb': 'efterGf', 'efter gf': 'efterGf',
  'studieretning': 'efterGf', 'studieretningsforløb': 'efterGf', 'sr': 'efterGf',
  'eksamen': 'eksamen', 'eksamensperiode': 'eksamen', 'eksamensperioden': 'eksamen',
  'skoleår': 'aar', 'skoleåret': 'aar', 'hele skoleåret': 'aar', 'hele året': 'aar', 'året': 'aar'
};
export const tolkPeriode = s => ORD[(s || '').trim().toLowerCase()] ?? null;
