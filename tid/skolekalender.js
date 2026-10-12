// skolekalender.js — skolens ferieplan og de danske helligdage
//
// Rene data og regler, uden Firebase og uden indstillinger, så de også kan
// læses af sider uden for appen (arbejdstidskalenderen i roden af sitet).
// ferie.js bygger optællingen ovenpå og lægger lærerens egen ferie til.

const datoTekst = d =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const plusDage = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

// ─── Helligdage ───────────────────────────────────────────
// Påskedag efter den gregorianske regel (Meeus/Jones/Butcher)
function paaskedag(aar) {
  const a = aar % 19, b = Math.floor(aar / 100), c = aar % 100;
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const md = Math.floor((h + l - 7 * m + 114) / 31), dag = (h + l - 7 * m + 114) % 31 + 1;
  return new Date(aar, md - 1, dag);
}

// De danske helligdage, der kan falde på en hverdag, som 'ÅÅÅÅ-MM-DD' →
// navn. Store bededag er afskaffet fra 2024; grundlovsdag og juleaftensdag
// er arbejdsdage (skolens ferieplan tæller 24/12 som en feriedag).
const navneCache = new Map();
export function helligdagsnavne(aar) {
  if (navneCache.has(aar)) return navneCache.get(aar);
  const p = paaskedag(aar);
  const dage = [
    [new Date(aar, 0, 1), 'Nytårsdag'],
    [plusDage(p, -3), 'Skærtorsdag'],
    [plusDage(p, -2), 'Langfredag'],
    [plusDage(p, 1), '2. påskedag'],
    ...(aar < 2024 ? [[plusDage(p, 26), 'Store bededag']] : []),
    [plusDage(p, 39), 'Kristi himmelfartsdag'],
    [plusDage(p, 50), '2. pinsedag'],
    [new Date(aar, 11, 25), '1. juledag'],
    [new Date(aar, 11, 26), '2. juledag']
  ];
  const m = new Map(dage.map(([d, navn]) => [datoTekst(d), navn]));
  navneCache.set(aar, m);
  return m;
}

const helligCache = new Map();
export function helligdage(aar) {
  if (!helligCache.has(aar)) helligCache.set(aar, new Set(helligdagsnavne(aar).keys()));
  return helligCache.get(aar);
}

// ─── Ferie ────────────────────────────────────────────────
// Skolens ferieplan for lærerne (Middelfart Gymnasium), som den står i
// «Forslag til lærernes ferie». Den bruges, indtil læreren selv har gemt
// ferie for skoleåret — en gemt liste, også en tom, går forud.
// Ret hvert år efter den nye plan.
//
// Elevernes ferier er fra «Ferieplan for elever og lærere 2026-27», de dage,
// hvor læreren arbejder. Dagene 4.–7. august er ikke med: eleverne har
// stadig ferie, men lærerne er på skolen til møder og forberedelse.
export const SKOLENS_FERIE = {
  '2026/27': [
    { fra: '2026-07-06', til: '2026-07-27', navn: 'Sommerferie' },   // 16 dage (planen skriver 2027, men mener 2026)
    { fra: '2026-12-21', til: '2026-12-24', navn: 'Juleferie' },     // 4 dage
    { fra: '2027-02-15', til: '2027-02-16', navn: 'Vinterferie' },   // uge 7, 2 dage
    { fra: '2027-03-22', til: '2027-03-24', navn: 'Påskeferie' },    // 3 dage — i alt 25
    { fra: '2026-06-29', til: '2026-07-03', elev: true, navn: 'Sommerferie' },   // før lærerens ferie
    { fra: '2026-07-28', til: '2026-08-03', elev: true, navn: 'Sommerferie' },   // til første dag på skolen 4/8
    { fra: '2026-10-12', til: '2026-10-16', elev: true, navn: 'Efterårsferie' }, // uge 42
    { fra: '2026-12-28', til: '2026-12-31', elev: true, navn: 'Juleferie' },
    { fra: '2027-02-17', til: '2027-02-19', elev: true, navn: 'Vinterferie' },   // resten af uge 7
    { fra: '2027-05-07', til: '2027-05-07', elev: true, navn: 'Kr. himmelfartsferie' }  // fredagen efter
  ]
};
