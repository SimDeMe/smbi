// aktivitetsperiode.js — hvornår i skoleåret en aktivitet ligger
//
// Hvert hold og hver opgave hører til én af skolens faste perioder:
//
//   aar           Hele skoleåret — normperioden (standard)
//   grundforloeb  Grundforløb — første skoledag til grundforløbets slutning
//                 (fredag to uger efter efterårsferien)
//   efterGf       Efter grundforløb — fra studieretningens start og året ud
//   eksamen       Eksamensperiode — sommerterminen i starten af normperioden.
//                 Skolen regner de officielle prøver (skriftlige og mundtlige)
//                 med i den normperiode, de holdes i — juni 2026 hører til
//                 2026/27 (FAQ om opgavefordeling på MG 2026/27)
//
// Datoerne står pr. skoleår i indstillingerne og kan rettes dér:
//   periodeDatoer: { "2026/27": { skolestart, gfSlut, srStart, eksamenFra, eksamenTil } }
// Uden gemte datoer bruges skolens plan, og findes den ikke for året, et
// skøn efter samme mønster.
//
// Perioden bruges to steder:
//
//   optjent  — en løbende opgave (og et hold uden normgrundlag) optjener sit
//              budget jævnt over arbejdsdagene i perioden (se akkord.js)
//   belastning — aktivitetens budget lægges ud over periodens arbejdsdage
//              uden elevferie (se belastning.js)
//
// Engangsopgaver (optjent ved afslutning — eksamen, SRP, et møde) har ingen
// periode: de er korte og skal ikke fordeles jævnt over noget. Deres
// belastning er den tid, der er brugt — altså det, der er optjent.
//
// Gemmes på aktiviteten som periode: 'grundforloeb' | 'efterGf' | 'eksamen'
// (eller null = hele skoleåret). En under-opgave uden egen periode ligger i
// forælderens.

import { getSettings } from './indstillinger.js';
import { forloebIArbejdsdage, arbejdsdageIPerioden, tilDato, ferieFor } from './ferie.js';
import { addDays, datoInput, skoleaarStart, kortDato } from './periode.js';
import { erEngang } from './akkord.js';

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
    srStart:    '2025-11-03',                             // Kalender 2025-26: SR-start man. 3/11
    eksamenFra: '2025-06-01', eksamenTil: '2025-06-25'    // skøn — sommerterminen 2025
  },
  '2026/27': {
    skolestart: '2026-08-10', gfSlut: '2026-10-30',       // Ferieplan 2026-27; skolens plan: GF slutter 30/10
    srStart:    '2026-11-03',                             // 1g's studieretninger starter tir. 3/11
    eksamenFra: '2026-06-01', eksamenTil: '2026-06-24'    // Kalender 2025-26: sidste eksamensdag ons. 24/6
  }
};

// Skøn for et år uden plan: skolestart 2. mandag i august, grundforløbet
// slutter fredag i uge 44, studieretningen starter mandagen efter, eksamen
// 1.–24. juni
function skoen(aar) {
  const y = parseInt(aar);
  const aug1 = new Date(y, 7, 1);
  const mandag1 = addDays(aug1, (8 - aug1.getDay()) % 7);
  const jan4 = new Date(y, 0, 4);                          // altid i uge 1
  const uge1Mandag = addDays(jan4, -((jan4.getDay() + 6) % 7));
  return {
    skolestart: datoInput(addDays(mandag1, 7)),
    gfSlut:     datoInput(addDays(uge1Mandag, 43 * 7 + 4)),
    srStart:    datoInput(addDays(uge1Mandag, 44 * 7)),
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
    : noegle === 'efterGf'      ? [tilDato(d.srStart), slut]
    : noegle === 'eksamen'      ? [tilDato(d.eksamenFra), efter(d.eksamenTil)]
    : [start, slut];
  return [fra < start ? start : fra, til > slut ? slut : til];
}

// Aktivitetens periode, evt. arvet fra forælderen. En engangsopgave har
// ingen — den regnes som hele året, men indgår i skemaet med det optjente.
export function periodeFor(a, acts = []) {
  if (erEngang(a)) return 'aar';
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

// Import: det, man skriver, → periodens nøgle
const ORD = {
  'grundforløb': 'grundforloeb', 'grundforloeb': 'grundforloeb', 'gf': 'grundforloeb',
  'efter grundforløb': 'efterGf', 'efter grundforloeb': 'efterGf', 'efter gf': 'efterGf',
  'studieretning': 'efterGf', 'studieretningsforløb': 'efterGf', 'sr': 'efterGf',
  'eksamen': 'eksamen', 'eksamensperiode': 'eksamen', 'eksamensperioden': 'eksamen',
  'skoleår': 'aar', 'skoleåret': 'aar', 'hele skoleåret': 'aar', 'hele året': 'aar', 'året': 'aar'
};
export const tolkPeriode = s => ORD[(s || '').trim().toLowerCase()] ?? null;
