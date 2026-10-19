/* ─────────────────────────────────────────────────────────
   Fjordens vand-, salt-, fosfor- og iltbalance
   To-lags kassemodel (overfladelag over springlaget, bundlag
   under det) i ligevægt. Efter C. J. Bjerrum: «Iltsvind i de
   danske farvande», øvelse 1 og 2 (STEM Academy 2026), der
   bygger på Knudsens relationer (1900) og Timmermann m.fl. (2010).

   Strømme (m³/s):
     Qf   ferskvand fra åerne til overfladelaget
     Qud  overfladevand ud af fjorden
     Qind bundvand ind over tærsklen fra det åbne hav
     Qned turbulent nedblanding (vind og tidevand)
     Qop  opblanding fra bundlaget, der erstatter det, som forlader
          overfladelaget
   Saliniteter (g/kg): So overflade, Sb bund, Skat åbent hav under
   springlaget. Åvandet regnes saltfrit (Sf = 0).

   Bevarelse (IND − UD = 0):
     overflade, vand:  Qf + Qop − Qned − Qud = 0
     overflade, salt:  Sb·Qop − So·Qned − So·Qud = 0
     bund, vand:       Qind − Qop + Qned = 0
     bund, salt:       Skat·Qind − Sb·Qop + So·Qned = 0
   (I øvelsesteksten står So·Qud i bundlagets saltligning; det skal
   være So·Qned. Løsningerne 1.5–1.8 i teksten er de rigtige.)
   ───────────────────────────────────────────────────────── */

export const ETA = 130;          // mol O₂ pr. mol P ved respiration (Redfield)
export const M_O2 = 32;          // g/mol — mg/L ↔ mmol/m³
export const ILTSVIND_MODERAT = 4 * 1000 / M_O2;  // 4 mg/L = 125 mmol/m³
export const ILTSVIND_KRAFTIGT = 2 * 1000 / M_O2; // 2 mg/L = 62,5 mmol/m³

/* Knudsens metode: saliniteterne er målt, strømmene beregnes. */
export function stroemmeFraSalt({ Qf, So, Sb, Skat }) {
  const fejl = [];
  if (!(Skat > So)) fejl.push('So ≥ Skat: overfladevandet er saltere end havvandet, der strømmer ind. Det kræver stor fordampning og ligger uden for modellen.');
  if (!(Sb > So)) fejl.push('Sb ≤ So: bundvandet er ikke saltere end overfladevandet, så der er intet springlag at regne på.');
  if (Sb > Skat) fejl.push('Sb > Skat: bundvandet er saltere end det vand, der strømmer ind. Det ville kræve negativ nedblanding (Qned < 0).');
  if (fejl.length) return { gyldig: false, fejl };
  const Qind = Qf * So / (Skat - So);                        // Eq. 1.5
  const Qud  = Qf * Skat / (Skat - So);                      // Eq. 1.6
  const Qop  = Qf * So / (Sb - So);                          // Eq. 1.7
  const Qned = Qf * So * (Skat - Sb) / ((Sb - So) * (Skat - So)); // Eq. 1.8
  return { gyldig: true, fejl, Qf, Qind, Qud, Qop, Qned, So, Sb, Skat };
}

/* «Hvad nu hvis»: strømmene sættes, saliniteterne beregnes.
   Samme fire ligninger løst for So og Sb i stedet. */
export function saltFraStroemme({ Qf, Skat, Qind, Qned }) {
  const Qud = Qf + Qind;
  const Qop = Qind + Qned;
  const So = Qud > 0 ? Skat * Qind / Qud : 0;
  const Sb = Qop > 0 ? (Skat * Qind + So * Qned) / Qop : So;
  return { gyldig: Qop > 0, fejl: [], Qf, Qind, Qud, Qop, Qned, So, Sb, Skat };
}

/* Iltmætning i overfladevand (mmol/m³) ud fra temperatur og salinitet —
   samme formel (Benson & Krause / APHA) som i kursets regneark. */
export function iltmaetning(T, S) {
  const K = T + 273.15;
  const lnC = -139.34411 + 1.575701e5 / K - 6.642308e7 / K ** 2
            + 1.2438e10 / K ** 3 - 8.621949e11 / K ** 4
            - S * (0.017674 - 10.754 / K + 2140 / K ** 2);
  return Math.exp(lnC) * 1000 / M_O2;
}

/* Øvelse 2: fosfor og ilt. Strømmene er kendte.
   Pf, Pkat: biologisk tilgængeligt P (mmol/m³) i åvand og i havvandet,
   der strømmer ind. gamma (m³/s): eksportrate, så algematerialet, der
   synker ud af overfladelaget, er EP = gamma·Po (mmol P/s).
   Os: ilt i overfladelaget, Okat: ilt i havvandet, der strømmer ind.
   (Også her står Qud for Qned i tekstens bundlagsligninger 2.2 og 2.3;
   løsningerne 2.4 og 2.5 er de rigtige.) */
export function naeringOgIlt(q, { Pf, Pkat, gamma, Os, Okat, eta = ETA }) {
  const { Qf, Qind, Qud, Qop, Qned } = q;
  const tilfoersel = Qf * Pf + Qind * Pkat;           // mmol P/s ind i fjorden
  const Po = tilfoersel / Qud;
  const EP = gamma * Po;                               // mmol P/s synker ud
  const Pb = (Qind * Pkat * (Qned + Qud + gamma) + Qf * Pf * (Qned + gamma)) / (Qud * Qop); // Eq. 2.4
  const forbrug = eta * EP;                            // mmol O₂/s i bundlaget
  const tilfoertIlt = Qind * Okat + Qned * Os;         // mmol O₂/s ind i bundlaget
  const Ob = (tilfoertIlt - forbrug) / Qop;            // Eq. 2.5
  return {
    Po, Pb, EP, Ob, forbrug, tilfoertIlt,
    andelFraAa: tilfoersel > 0 ? Qf * Pf / tilfoersel : 0,
  };
}

export function iltTilstand(Ob) {
  if (Ob <= 0) return { navn: 'iltfrit', niveau: 3 };
  if (Ob < ILTSVIND_KRAFTIGT) return { navn: 'kraftigt iltsvind', niveau: 2 };
  if (Ob < ILTSVIND_MODERAT) return { navn: 'moderat iltsvind', niveau: 1 };
  return { navn: 'ikke iltsvind', niveau: 0 };
}
