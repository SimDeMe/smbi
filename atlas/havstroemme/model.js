// Skematisk model af havets overfladestrømme og det termohaline transportbånd.
// Ren model uden tegning. Strømmene er generaliserede hovedlinjer fra
// lærebogskort (NOAA, Talley m.fl. 2011): retningerne og placeringen skal være
// rigtige; bredder og hastigheder er afrundede og kun relative.
// Koordinater som i GeoJSON: [længdegrad, breddegrad].

const RAD = Math.PI / 180;

// type: 'varm' eller 'kold' i forhold til omgivende vand; 'blandet' for de
// brede, østgående strømme, hvor det ikke giver mening at sige varm/kold.
// fart: relativ (1 = Golfstrømmen); bredde: halv bredde i grader.
// randstrøm: smal, hurtig vestlig randstrøm (fremhæves i trin 3–4).
export const STROEMME = [
  // Nordatlanten – hvirvel med uret.
  { navn: 'Golfstrømmen', type: 'varm', fart: 1, bredde: 2.2, randstroem: true,
    punkter: [[-81, 24.6], [-79.8, 27], [-79.5, 30], [-77.5, 33], [-74.5, 35.5], [-70, 38], [-62, 40], [-52, 41.5]] },
  { navn: 'Nordatlantiske strøm', type: 'varm', fart: 0.65, bredde: 3.5,
    punkter: [[-52, 41.5], [-44, 45], [-36, 49], [-27, 52.5], [-18, 55.5], [-11, 58.5], [-6, 61]] },
  { navn: 'Norske strøm', type: 'varm', fart: 0.5, bredde: 2.5,
    punkter: [[-6, 61], [0, 63.5], [6, 66.5], [12, 69.5], [19, 71.5], [30, 72.5], [40, 72.5]] },
  { navn: 'Kanariske strøm', type: 'kold', fart: 0.45, bredde: 3.5,
    punkter: [[-17, 41], [-14, 36], [-13, 31], [-16.5, 26], [-19.5, 21], [-22, 16]] },
  { navn: 'Azorstrømmen', type: 'blandet', fart: 0.35, bredde: 3.5,
    punkter: [[-45, 36], [-35, 35], [-25, 35], [-17, 34.5]] },
  { navn: 'Nordlige ækvatorialstrøm', type: 'varm', fart: 0.5, bredde: 4,
    punkter: [[-22, 16], [-32, 15], [-42, 14.5], [-52, 14.5], [-60, 15]] },
  { navn: 'Caribiske strøm', type: 'varm', fart: 0.6, bredde: 2.5,
    punkter: [[-60, 13.5], [-67, 14], [-74, 14.5], [-80, 15.5], [-84, 18.5], [-86, 21.5], [-85.5, 23.5], [-83, 24.3], [-81, 24.6]] },
  { navn: 'Antillestrømmen', type: 'varm', fart: 0.4, bredde: 2.5,
    punkter: [[-58, 18], [-64, 21.5], [-70, 24.5], [-75, 27], [-78.5, 29.5]] },
  { navn: 'Labradorstrømmen', type: 'kold', fart: 0.5, bredde: 2.5,
    punkter: [[-65, 70], [-62, 65], [-60, 60.5], [-56, 56], [-52, 51.5], [-50, 47], [-51, 43.5]] },
  { navn: 'Østgrønlandske strøm', type: 'kold', fart: 0.55, bredde: 2.5,
    punkter: [[-5, 80], [-12, 76], [-18, 71.5], [-25, 67.5], [-33, 64.5], [-40, 61.5], [-44.5, 59.3]] },
  { navn: 'Vestgrønlandske strøm', type: 'varm', fart: 0.35, bredde: 2,
    punkter: [[-44.5, 59.3], [-49, 61], [-52.5, 64], [-55, 67.5], [-58, 71]] },

  // Sydatlanten – hvirvel mod uret.
  { navn: 'Sydlige ækvatorialstrøm', type: 'varm', fart: 0.55, bredde: 4.5,
    punkter: [[5, -1], [0, -2.5], [-10, -3.5], [-20, -4.5], [-30, -5.5], [-34, -6.5]] },
  { navn: 'Nordbrasilianske strøm', type: 'varm', fart: 0.6, bredde: 2.5,
    punkter: [[-34, -5.5], [-38, -2.5], [-43, 0], [-48, 3], [-53, 6], [-57, 9], [-60, 12]] },
  { navn: 'Brasilianske strøm', type: 'varm', fart: 0.45, bredde: 2.5,
    punkter: [[-34, -8], [-36, -13], [-38.5, -18], [-41.5, -23], [-46, -27], [-50, -32], [-53, -37]] },
  { navn: 'Falklandsstrømmen', type: 'kold', fart: 0.5, bredde: 2.5,
    punkter: [[-64, -55], [-61, -50], [-58.5, -45], [-56.5, -41], [-55, -37.5]] },
  { navn: 'Sydatlantiske strøm', type: 'blandet', fart: 0.35, bredde: 4,
    punkter: [[-53, -38.5], [-42, -40], [-30, -40], [-18, -39], [-6, -37.5], [6, -36], [14, -34.5]] },
  { navn: 'Benguelastrømmen', type: 'kold', fart: 0.45, bredde: 3.5,
    punkter: [[16, -34.5], [14, -30], [12.3, -25], [10.5, -20], [7, -15], [2, -11], [-5, -7]] },

  // Nordstillehavet – hvirvel med uret.
  { navn: 'Kuroshio', type: 'varm', fart: 1, bredde: 2.2, randstroem: true,
    punkter: [[122.5, 21], [124, 24.5], [127.5, 28.5], [132, 30.8], [136, 32.8], [141.5, 35], [146, 36.5]] },
  { navn: 'Nordpacifiske strøm', type: 'blandet', fart: 0.4, bredde: 4,
    punkter: [[146, 37], [158, 39.5], [170, 41], [-178, 42], [-165, 43], [-150, 44], [-138, 44.5], [-130, 44]] },
  { navn: 'Californiske strøm', type: 'kold', fart: 0.45, bredde: 3.5,
    punkter: [[-130, 47], [-128, 42], [-125.5, 37], [-122, 32], [-118, 27], [-115, 22], [-113, 18]] },
  { navn: 'Nordlige ækvatorialstrøm', type: 'varm', fart: 0.5, bredde: 4.5,
    punkter: [[-113, 16], [-125, 14], [-140, 13], [-155, 13], [-170, 13], [175, 13], [160, 13.5], [145, 14], [132, 15], [124, 18]] },
  { navn: 'Alaskastrømmen', type: 'varm', fart: 0.35, bredde: 2.5,
    punkter: [[-130, 47.5], [-134, 53], [-140, 58], [-147, 59.6], [-153, 56.3], [-162, 54.5], [-172, 52.5]] },
  { navn: 'Oyashio', type: 'kold', fart: 0.5, bredde: 2.5,
    punkter: [[166, 57], [162, 53], [157, 49.5], [151.5, 45.5], [147, 42.5], [145, 40]] },
  { navn: 'Ækvatoriale modstrøm', type: 'varm', fart: 0.4, bredde: 2.5,
    punkter: [[128, 6], [140, 6], [155, 6.5], [170, 7], [-175, 7], [-160, 7], [-140, 7], [-120, 7], [-100, 6.5], [-88, 6]] },

  // Sydstillehavet – hvirvel mod uret.
  { navn: 'Sydlige ækvatorialstrøm', type: 'varm', fart: 0.55, bredde: 4.5,
    punkter: [[-84, -2], [-95, -2.5], [-110, -3.5], [-125, -4.5], [-140, -6], [-155, -8], [-170, -10.5], [175, -12.5], [162, -14.5], [154, -16]] },
  { navn: 'Østaustralske strøm', type: 'varm', fart: 0.75, bredde: 2.2, randstroem: true,
    punkter: [[154, -16], [155.2, -21], [154.5, -26], [153.8, -30.5], [154, -34], [157, -37], [162, -39]] },
  { navn: 'Sydpacifiske strøm', type: 'blandet', fart: 0.35, bredde: 4,
    punkter: [[164, -42], [178, -44], [-168, -45], [-150, -45], [-132, -43], [-114, -41], [-96, -40], [-82, -40]] },
  { navn: 'Humboldtstrømmen', type: 'kold', fart: 0.5, bredde: 3.5,
    punkter: [[-77, -44], [-75.5, -38], [-74, -32], [-73, -26], [-73.5, -20], [-77.5, -15], [-81.5, -9], [-84, -4]] },

  // Det Indiske Ocean – hvirvel mod uret på den sydlige halvkugle.
  { navn: 'Sydlige ækvatorialstrøm', type: 'varm', fart: 0.5, bredde: 4,
    punkter: [[115, -11.5], [105, -12.5], [95, -13.5], [85, -14.5], [75, -15], [65, -15], [56, -14.5], [51, -13]] },
  { navn: 'Agulhasstrømmen', type: 'varm', fart: 1, bredde: 2.2, randstroem: true,
    punkter: [[41.5, -15], [40, -19], [37.5, -24], [34.5, -28.5], [31.5, -31.5], [28, -34], [24, -35.8], [20.5, -37.5], [18.5, -39.5], [21, -41], [27, -41.5], [34, -41], [42, -40.5]] },
  { navn: 'Sydindiske strøm', type: 'blandet', fart: 0.35, bredde: 4,
    punkter: [[42, -40.5], [55, -40], [68, -39], [82, -38.5], [96, -38.5], [108, -38.5]] },
  { navn: 'Vestaustralske strøm', type: 'kold', fart: 0.35, bredde: 3.5,
    punkter: [[109, -38.5], [110.5, -33], [110, -28], [108.5, -23], [106, -18], [104, -14]] },

  // Sydhavet: den antarktiske cirkumpolarstrøm løber hele vejen rundt mod øst.
  { navn: 'Antarktiske cirkumpolarstrøm', type: 'kold', fart: 0.6, bredde: 5,
    punkter: [[-180, -57.5], [-160, -59.5], [-140, -60], [-120, -60], [-100, -59.5], [-82, -58.5], [-68, -58], [-55, -56], [-40, -53.5], [-25, -51.5], [-10, -50.5],
      [5, -50], [20, -49.5], [35, -49], [50, -49], [65, -50], [80, -50], [95, -51], [110, -52], [125, -53], [140, -54.5], [155, -55.5], [170, -56.5], [180, -57.5]] },
];

// De fem store subtropiske hvirvler: centrum, halvakser i grader og
// omløbsretning set ovenfra (Corioliseffekten: med uret i nord, mod uret i syd).
export const HVIRVLER = [
  { navn: 'Nordatlantiske hvirvel', centrum: [-45, 30], rx: 28, ry: 11, medUret: true },
  { navn: 'Sydatlantiske hvirvel', centrum: [-15, -25], rx: 22, ry: 11, medUret: false },
  { navn: 'Nordpacifiske hvirvel', centrum: [-170, 28], rx: 48, ry: 12, medUret: true },
  { navn: 'Sydpacifiske hvirvel', centrum: [-125, -27], rx: 42, ry: 13, medUret: false },
  { navn: 'Indiske Oceans hvirvel', centrum: [78, -27], rx: 26, ry: 10, medUret: false },
];

// Det termohaline transportbånd (Broeckers «global conveyor», stærkt forenklet):
// overfladegrenen er varm og løber mod Nordatlanten; dybgrenen er kold og salt.
export const BAAND = {
  overflade: [[-160, 38], [-170, 20], [175, 5], [150, 0], [128, -3], [115, -10], [95, -15], [70, -18], [50, -25], [32, -33], [18, -38],
    [5, -25], [-10, -12], [-28, -4], [-45, 4], [-60, 13], [-75, 19], [-80, 26], [-72, 37], [-50, 43], [-32, 52], [-25, 60]],
  dyb: [[-30, 62], [-42, 55], [-50, 40], [-45, 20], [-35, 0], [-30, -20], [-25, -38], [-10, -50], [15, -52], [45, -52], [75, -52],
    [105, -53], [140, -55], [170, -55], [-170, -45], [-160, -25], [-155, 0], [-155, 25], [-158, 36]],
  grenIndisk: [[75, -52], [80, -40], [82, -25], [80, -15]],
  synker: [{ navn: 'Grønlandspumpen', punkt: [-30, 61] }, { navn: 'Weddellhavet', punkt: [-40, -68] }],
  stiger: [{ navn: 'Opstigning i Stillehavet', punkt: [-160, 36] }, { navn: 'Opstigning i Det Indiske Ocean', punkt: [80, -14] }],
};

// ----- Strømfeltet -----

const laengdeforskel = (a, b) => ((a - b + 540) % 360) - 180;

// Linjestykkerne i en strøm som [a, b, enhedsvektor øst/nord, længde i grader].
function stykker(strom) {
  const ud = [];
  for (let i = 0; i < strom.punkter.length - 1; i++) {
    const [l1, b1] = strom.punkter[i], [l2, b2] = strom.punkter[i + 1];
    const k = Math.cos((b1 + b2) / 2 * RAD);
    const dx = laengdeforskel(l2, l1) * k, dy = b2 - b1;
    const n = Math.hypot(dx, dy);
    if (n > 0) ud.push({ a: [l1, b1], dx, dy, n, k });
  }
  return ud;
}

// Afstand i grader (øst skaleret med cos) fra et punkt til et linjestykke, og
// hvor langt hen ad stykket punktet ligger (0–1).
function afstand(lon, lat, s) {
  const px = laengdeforskel(lon, s.a[0]) * s.k, py = lat - s.a[1];
  const t = Math.max(0, Math.min(1, (px * s.dx + py * s.dy) / (s.n * s.n)));
  return [Math.hypot(px - t * s.dx, py - t * s.dy), t];
}

// Bygger strømfeltet på et 1°-gitter. erLand(lon, lat) → true på land; uden
// funktion regnes hele kloden som hav (bruges i modelprøven).
// u, v: fart mod øst og nord (relativ); hvem: index i STROEMME for den strøm,
// der dominerer cellen, eller -1.
export function lavFelt(erLand = () => false) {
  const B = 360, H = 180;
  const u = new Float32Array(B * H), v = new Float32Array(B * H), hvem = new Int16Array(B * H).fill(-1), land = new Uint8Array(B * H);
  const alle = STROEMME.map(stykker);
  for (let j = 0; j < H; j++) {
    const lat = 89.5 - j;
    for (let i = 0; i < B; i++) {
      const lon = -179.5 + i, c = j * B + i;
      if (erLand(lon, lat)) { land[c] = 1; continue; }
      let su = 0, sv = 0, bedst = 0, hvis = -1;
      for (let s = 0; s < STROEMME.length; s++) {
        const strom = STROEMME[s];
        for (const st of alle[s]) {
          const [d] = afstand(lon, lat, st);
          if (d > strom.bredde * 2.5) continue;
          const w = Math.exp(-((d / strom.bredde) ** 2)) * strom.fart;
          su += w * st.dx / st.n; sv += w * st.dy / st.n;
          if (w > bedst) { bedst = w; hvis = s; }
        }
      }
      // Overlappende stykker af samme strøm må ikke lægges sammen til mere
      // end strømmens egen fart.
      const f = Math.hypot(su, sv), maks = hvis >= 0 ? STROEMME[hvis].fart : 0;
      const skala = f > maks && f > 0 ? maks / f : 1;
      u[c] = su * skala; v[c] = sv * skala;
      hvem[c] = bedst > 0.08 ? hvis : -1;
    }
  }
  const indeks = (lon, lat) => {
    const i = Math.floor(((lon + 180) % 360 + 360) % 360), j = Math.floor(90 - lat);
    return Math.max(0, Math.min(H - 1, j)) * B + Math.min(B - 1, i);
  };
  // Startsteder til partikler: hav, hvor strømmen er tydelig.
  const starter = [];
  for (let c = 0; c < B * H; c++) if (!land[c] && Math.hypot(u[c], v[c]) > 0.12) starter.push(c);
  return {
    u, v, hvem, land, starter,
    erLand: (lon, lat) => land[indeks(lon, lat)] === 1,
    // Bilineær interpolation, så partiklerne glider jævnt.
    stroem(lon, lat) {
      const x = ((lon + 179.5) % 360 + 360) % 360, y = Math.max(0, Math.min(H - 1.001, 89.5 - lat));
      const i0 = Math.floor(x), j0 = Math.floor(y), fx = x - i0, fy = y - j0;
      const i1 = (i0 + 1) % B, j1 = Math.min(H - 1, j0 + 1);
      const m = (a, b, cc, d) => (a * (1 - fx) + b * fx) * (1 - fy) + (cc * (1 - fx) + d * fx) * fy;
      const [a, b, cc, d] = [j0 * B + i0, j0 * B + i1, j1 * B + i0, j1 * B + i1];
      return { u: m(u[a], u[b], u[cc], u[d]), v: m(v[a], v[b], v[cc], v[d]) };
    },
    hvem: (lon, lat) => { const h = hvem[indeks(lon, lat)]; return h >= 0 ? STROEMME[h] : null; },
    startpunkt() {
      const c = starter[Math.floor(Math.random() * starter.length)];
      return [-180 + (c % B) + Math.random(), 90 - Math.floor(c / B) - Math.random()];
    },
  };
}

export const fart = ({ u, v }) => Math.hypot(u, v);

// Retningen strømmen løber MOD (havstrømme angives mod, vind fra).
const RETNINGER = ['nord', 'nordøst', 'øst', 'sydøst', 'syd', 'sydvest', 'vest', 'nordvest'];
export const modRetning = ({ u, v }) => RETNINGER[Math.round(((Math.atan2(u, v) / RAD + 360) % 360) / 45) % 8];

export const TYPENAVN = { varm: 'varm strøm', kold: 'kold strøm', blandet: 'hverken varm eller kold' };
