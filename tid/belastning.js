// belastning.js — hvor meget arbejde opgaveporteføljen lægger i hver uge
//
// Belastningen er den tid, opgaverne forventes at tage — ikke den officielle
// 37 t × ansættelsesgrad. Den er høj, når der er mange opgaver (grundforløb,
// eksamen), og lav, når der er få. Til sammen giver den normen, så en tung
// periode gør resten af året lettere.
//
// Sådan lægges den ud:
//
//   hold og løbende opgaver — budgettet jævnt over de dage i aktivitetens
//       periode, der er arbejdsdage og ikke elevferie (aktivitetsperiode.js)
//   engangsopgaver — eksamen, SRP, et møde: når tiden er brugt, altså det
//       optjente (som i akkord.js). Det, der ikke er brugt endnu, lægges
//       fremad jævnt over de dage, der er tilbage
//   elevferie — arbejdsdage for læreren, men ingen opgaver: belastning 0
//       (ferie.js). Lærerens egen ferie er heller ikke med
//   resten af normen — tid, der ikke står på en opgave i porteføljen, er
//       stadig arbejde, men har ingen belastning for sig selv. Den fordeles på
//       hold og løbende opgaver efter budget, så den følger deres perioder:
//
//         faktor = (norm − engangsopgavernes budget) / øvrige budgetter, mindst 1
//
//       Er porteføljen større end normen, er belastningen porteføljen.
//       Uden hold og løbende opgaver ligger resten jævnt over året.
//
// Hvad akkorden er, kommer fra akkordregnskabet (ak.enheder): forælderens
// budget uden børnenes, intet for opgaver, der optjenes næste år, og intet
// for sidste års opgaver, hvis tid blev brugt dengang.
//
// Alle tal er i minutter.

import { forloebIArbejdsdage } from './ferie.js';
import { periodeFor, graenser } from './aktivitetsperiode.js';
import { erEngang } from './akkord.js';

const midnat = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());

// ak: akkordregnskabet ved det tidspunkt, belastningen gælder
// ferie, elevferie: lærerens og elevernes ferie (ferieFor / elevferieFor)
export function beregnBelastning({ ak, acts, aar, normM, start, slut, ferie, elevferie }) {
  const fri = [...ferie, ...elevferie];
  const aarets = acts.filter(a => a.schoolYear === aar);
  const enheder = Object.values(ak?.enheder || {}).filter(u => !u.overfoert && u.budget > 0);
  const engang = enheder.filter(u => erEngang(u.act));
  const perioder = enheder.filter(u => !erEngang(u.act)).map(u => {
    const [f, t] = graenser(periodeFor(u.act, aarets), aar, start, slut);
    return { budget: u.budget, f, t };
  });

  const P = perioder.reduce((s, x) => s + x.budget, 0);
  const E = engang.reduce((s, u) => s + u.budget, 0);
  const faktor = P > 0 ? Math.max(1, (normM - E) / P) : 0;
  const rest   = P > 0 ? 0 : Math.max(0, normM - E);
  const optjent = engang.reduce((s, u) => s + Math.min(u.optjent, u.budget), 0);

  // Den del af [f, t)'s belastningsdage, der er gået ved d
  const andel = (f, t, d) => t <= f ? (d >= f ? 1 : 0) : forloebIArbejdsdage(f, t, fri, d);
  const planlagt = d =>
    perioder.reduce((s, x) => s + faktor * x.budget * andel(x.f, x.t, d), 0) + rest * andel(start, slut, d);

  return {
    total: faktor * P + E + rest,
    // Belastningen til og med d, med engangsopgaverne, som de står i ak
    ved: d => planlagt(d) + optjent,
    // Fremskrevet fra nu: det ubrugte af engangsopgaverne jævnt over de
    // belastningsdage, der er tilbage
    frem: (d, nu) => planlagt(d) + optjent +
      (d > nu ? (E - optjent) * andel(midnat(nu), slut, d) : 0)
  };
}
