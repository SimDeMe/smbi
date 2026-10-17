// Idealiseret 3-cellemodel (CIRKULATION-MODEL.md, afsnit 0 og 4).
// Ren model uden tegning: bælternes bredder og vinden ved jorden som funktion
// af bredde, længde, måned (1–12, decimaler tilladt), rotation (0–1) og
// kontinenter (0–1). Tallene er afrundede og må gerne overdrive; retningerne
// skal være rigtige.

const RAD = Math.PI / 180;
const klem = (x, a, b) => Math.max(a, Math.min(b, x));

// Årstidsfaktor: +1 sidst i juli, −1 sidst i januar.
export const aarstid = maaned => Math.cos(2 * Math.PI * (maaned - 7.5) / 12);

// Zonalt gennemsnit: ca. 10° N i august og ca. 2° S i februar.
export const itkMiddel = maaned => 4 + 6 * aarstid(maaned);

// Kontinenternes ekstra udsving (grader), gaussisk i længde.
// jul gælder ved aarstid = +1, jan ved aarstid = −1.
export const OMRAADER = [
  { navn: 'Sydasien', laengde: 82, bredde: 24, jul: 15, jan: -6 },
  { navn: 'Østasien', laengde: 115, bredde: 14, jul: 12, jan: -2 },
  { navn: 'Vestafrika', laengde: 2, bredde: 16, jul: 8, jan: 7 },
  { navn: 'Østafrika', laengde: 38, bredde: 10, jul: 5, jan: -4 },
  { navn: 'Sydlige Afrika', laengde: 27, bredde: 12, jul: 0, jan: -10 },
  { navn: 'Australien', laengde: 133, bredde: 16, jul: 0, jan: -11 },
  { navn: 'Sydamerika', laengde: -55, bredde: 15, jul: 0, jan: -10 },
];

const laengdeforskel = (a, b) => ((a - b + 540) % 360) - 180;

export function itkBredde(maaned, laengde, kontinenter = 0) {
  const s = aarstid(maaned);
  let ekstra = 0;
  if (kontinenter > 0) {
    for (const o of OMRAADER) {
      const d = laengdeforskel(laengde, o.laengde) / o.bredde;
      ekstra += Math.exp(-d * d) * (s > 0 ? o.jul * s : -o.jan * s);
    }
  }
  return itkMiddel(maaned) + kontinenter * ekstra;
}

// Højtryk og polarfront flytter sig med halvdelen/en fjerdedel af ITK.
export function baelter(maaned) {
  const i = itkMiddel(maaned);
  return { nordHoej: 30 + i / 2, nordFront: 60 + i / 4, sydHoej: -30 + i / 2, sydFront: -60 + i / 4 };
}

// Omregner bredden til «modelbredde»: ITK → 0°, højtryk → ±30°, front → ±60°.
export function modelbredde(bredde, maaned, laengde, kontinenter) {
  const itk = itkBredde(maaned, laengde, kontinenter);
  const b = baelter(maaned);
  const nordHoej = Math.max(b.nordHoej, itk + 6), sydHoej = Math.min(b.sydHoej, itk - 6);
  const stk = (x, x0, x1, y0, y1) => y0 + (x - x0) / (x1 - x0) * (y1 - y0);
  if (bredde >= itk) {
    if (bredde < nordHoej) return stk(bredde, itk, nordHoej, 0, 30);
    if (bredde < b.nordFront) return stk(bredde, nordHoej, b.nordFront, 30, 60);
    return stk(bredde, b.nordFront, 90, 60, 90);
  }
  if (bredde > sydHoej) return stk(bredde, itk, sydHoej, 0, -30);
  if (bredde > b.sydFront) return stk(bredde, sydHoej, b.sydFront, -30, -60);
  return stk(bredde, b.sydFront, -90, -60, -90);
}

// Vind ved jorden i m/s: u mod øst, v mod nord.
// Uden rotation: én celle pr. halvkugle, lige fra polen mod ITK.
// Med rotation: tre celler; vind mod ækvator bøjes til østenvind, vind mod
// polen til vestenvind (højre i nord, venstre i syd). Coriolis er nul ved
// ækvator, derfor tanh(bredde).
export function vind(bredde, laengde, maaned, { rotation = 1, kontinenter = 0 } = {}) {
  const m = modelbredde(bredde, maaned, laengde, kontinenter);
  const a = Math.abs(m), fortegn = m >= 0 ? 1 : -1;
  const v1 = -fortegn * 7 * Math.sin(a * 2 * RAD);
  const v3 = -fortegn * 4 * Math.sin(a * 6 * RAD);
  const coriolis = 2.4 * Math.tanh(bredde / 7);
  const u3 = coriolis * v3;
  return { u: rotation * u3, v: (1 - rotation) * v1 + rotation * v3 };
}

export const fart = ({ u, v }) => Math.hypot(u, v);

// Retning vinden kommer FRA, i grader (0 = nord, 90 = øst).
export function fraRetning({ u, v }) {
  return (Math.atan2(-u, -v) / RAD + 360) % 360;
}

const RETNINGER = ['nord', 'nordøst', 'øst', 'sydøst', 'syd', 'sydvest', 'vest', 'nordvest'];
export const retningsnavn = grader => RETNINGER[Math.round(grader / 45) % 8];

const iMonsunomraade = laengde => Math.abs(laengdeforskel(laengde, 82)) < 30;

// Navnet på vindbæltet til etiketter og aflæsning.
export function vindbaelte(bredde, laengde, maaned, valg = {}) {
  const { rotation = 1, kontinenter = 0 } = valg;
  const m = modelbredde(bredde, maaned, laengde, kontinenter);
  const w = vind(bredde, laengde, maaned, valg);
  if (fart(w) < 1.2) return Math.abs(m) < 8 ? 'Stillebælte ved ITK' : 'Svag vind';
  if (rotation < 0.5) return m > 0 ? 'Nordenvind mod ITK' : 'Sønnenvind mod ITK';
  if (Math.abs(m) <= 30) {
    if (m < 0 && bredde > 0 && w.u > 0) return 'Sydvestmonsun';
    if (m > 0 && kontinenter > 0.5 && bredde > 0 && aarstid(maaned) < 0 && iMonsunomraade(laengde)) return 'Nordøstmonsun';
    return m > 0 ? 'Nordøstpassat' : 'Sydøstpassat';
  }
  if (Math.abs(m) <= 60) return 'Vestenvind';
  return 'Polar østenvind';
}

// Strømfunktion for snittet (bredde −90…90, højde 0…1 af tropopausen).
// Positiv værdi = celle, der drejer som Hadleycellen på nordlig halvkugle.
export function stroemfunktion(bredde, hoejde, maaned, rotation = 1) {
  const b = baelter(maaned), itk = itkMiddel(maaned);
  const lodret = Math.sin(Math.PI * klem(hoejde, 0, 1));
  const celle = (x, x0, x1, styrke) => styrke * Math.sin(Math.PI * (x - x0) / (x1 - x0));
  let tre;
  if (bredde >= itk) {
    // Vinterhalvkuglens Hadleycelle er stærkest.
    const hadley = 1 - 0.35 * aarstid(maaned);
    if (bredde < b.nordHoej) tre = celle(bredde, itk, b.nordHoej, hadley);
    else if (bredde < b.nordFront) tre = celle(bredde, b.nordHoej, b.nordFront, -0.45);
    else tre = celle(bredde, b.nordFront, 90, 0.35);
  } else {
    const hadley = 1 + 0.35 * aarstid(maaned);
    if (bredde > b.sydHoej) tre = celle(bredde, b.sydHoej, itk, -hadley);
    else if (bredde > b.sydFront) tre = celle(bredde, b.sydFront, b.sydHoej, 0.45);
    else tre = celle(bredde, -90, b.sydFront, -0.35);
  }
  const en = bredde >= itk ? Math.sin(Math.PI * (bredde - itk) / (90 - itk)) : -Math.sin(Math.PI * (bredde - itk) / (-90 - itk));
  return lodret * ((1 - rotation) * 1.1 * en + rotation * tre);
}

// Tropopausens højde i km (ca. 17 ved ækvator, 9 ved polerne).
export const tropopause = bredde => 9 + 8 * Math.cos(bredde * RAD) ** 2;

// Solens lodrette bredde (deklination) for en decimalmåned.
export const solbredde = maaned => 23.44 * Math.sin(2 * Math.PI * (maaned - 3.7) / 12);

export const MAANEDER = ['januar', 'februar', 'marts', 'april', 'maj', 'juni', 'juli', 'august', 'september', 'oktober', 'november', 'december'];
export const maanedsnavn = maaned => MAANEDER[((Math.round(maaned) - 1) % 12 + 12) % 12];
