// aktivitetsperiode.js — hvornår i skoleåret en aktivitet ligger
//
// Et hold eller en opgave kan have en valgfri periode (fra–til, begge dage
// med), fx et grundforløb aug–nov eller eksamen i maj–juni. Uden periode
// ligger aktiviteten over hele skoleåret, som før. Perioden bruges to steder:
//
//   optjent  — en løbende opgave (og et hold uden normgrundlag) optjener sit
//              budget jævnt over arbejdsdagene i perioden i stedet for over
//              hele året (se akkord.js)
//   skema    — den tid, der «burde» være registreret, regner med, at
//              aktivitetens budget bruges i perioden. Resten af normen
//              fordeles jævnt over året som før:
//
//     forventet = norm × årets andel + Σ budget × (periodens andel − årets andel)
//
//   Summen er den samme ved årets slut; det er kun fordelingen hen over
//   året, der ændres.
//
// Gemmes på aktiviteten som fra: 'ÅÅÅÅ-MM-DD' og til: 'ÅÅÅÅ-MM-DD' (eller
// null). En under-opgave uden egen periode ligger i forælderens.

import { forloebIArbejdsdage, tilDato } from './ferie.js';
import { addDays } from './periode.js';
import { budgetTimer } from './normer.js';

export const DATO = /^\d{4}-\d{2}-\d{2}$/;

// Aktivitetens periode, evt. arvet fra forælderen — eller null
export function periodeFor(a, acts = []) {
  if (a?.fra || a?.til) return { fra: a.fra || null, til: a.til || null };
  const far = a?.parentId ? acts.find(p => p.id === a.parentId) : null;
  return far && (far.fra || far.til) ? { fra: far.fra || null, til: far.til || null } : null;
}

// Hvor stor en del af aktivitetens arbejdsdage, der er gået ved `nu`.
// Perioden klippes til normperioden [start, slut).
export function aktivitetsAndel(a, acts, { start, slut, ferie, nu = new Date() }) {
  const p = periodeFor(a, acts);
  if (!p) return forloebIArbejdsdage(start, slut, ferie, nu);
  const fra = p.fra ? tilDato(p.fra) : start;
  const til = p.til ? addDays(tilDato(p.til), 1) : slut;
  const f = fra < start ? start : fra, t = til > slut ? slut : til;
  if (t <= f) return nu >= f ? 1 : 0;           // perioden ligger uden for året
  return forloebIArbejdsdage(f, t, ferie, nu);
}

// Den tid, der burde være registreret ved `nu`, i minutter (se øverst).
// Kun aktiviteter med periode og budget flytter noget.
export function forventetM({ acts, aar, normM, start, slut, ferie, nu = new Date() }) {
  const aaret = forloebIArbejdsdage(start, slut, ferie, nu);
  let m = normM * aaret;
  const aarets = acts.filter(a => a.schoolYear === aar);
  const budgetM = a => { const b = budgetTimer(a); return b != null ? b * 60 : 0; };
  aarets.forEach(a => {
    if (!periodeFor(a, aarets)) return;
    let b = budgetM(a);
    // Forælderens budget rummer børnenes — de med eget budget tæller selv
    if (!a.parentId) b -= aarets.filter(c => c.parentId === a.id).reduce((s, c) => s + budgetM(c), 0);
    if (b <= 0) return;
    m += b * (aktivitetsAndel(a, aarets, { start, slut, ferie, nu }) - aaret);
  });
  return Math.round(m);
}

// '2026-08-10' → '10. aug.' — kort, til lister og rapporten
const MDR = ['jan.', 'feb.', 'mar.', 'apr.', 'maj', 'jun.', 'jul.', 'aug.', 'sep.', 'okt.', 'nov.', 'dec.'];
const kort = s => { const d = tilDato(s); return `${d.getDate()}. ${MDR[d.getMonth()]}`; };
export function periodeTekst(p) {
  if (!p) return '';
  if (p.fra && p.til) return `${kort(p.fra)}–${kort(p.til)}`;
  return p.fra ? `fra ${kort(p.fra)}` : `til ${kort(p.til)}`;
}

// Datoer i import og formular: '2027-05-01', '1/5-2027', '1.5.2027', '1-5-2027'
export function tolkDato(s) {
  s = (s || '').trim();
  if (!s) return null;
  if (DATO.test(s)) return gyldig(s);
  const m = s.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  if (!m) return undefined;
  return gyldig(`${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`);
}
const gyldig = s => {
  const d = tilDato(s);
  const ok = !isNaN(d) && d.getMonth() + 1 === Number(s.slice(5, 7));
  return ok ? s : undefined;
};

// Samme dato et år senere (29. feb. → 28. feb.) — når et år kopieres
export function etAarSenere(s) {
  if (!s) return null;
  const [y, m, d] = s.split('-').map(Number);
  const dag = Math.min(d, new Date(y + 1, m, 0).getDate());
  return `${y + 1}-${String(m).padStart(2, '0')}-${String(dag).padStart(2, '0')}`;
}
