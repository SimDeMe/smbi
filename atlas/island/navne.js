// Fælles navne og placeringer for kortet (kort.js) og 3D-modellen (model3d.js).

// Hotspot (fortolkning): langsomme jordskælvsbølger under det centrale Island og
// det vestlige Vatnajökull (Wolfe m.fl. 1997; Allen m.fl. 2002). Omtrentlig placering.
export const HOTSPOT = { centrum: [-17.6, 64.6], radius_km: 125 };
// Ryggene under havet: navnenes placering (fagligt navngivne strukturer, ikke data).
export const RYGGE = [
  { navn: 'Reykjanesryggen', lon: -24.15, lat: 63.3, anker: 'end' },
  { navn: 'Kolbeinseyryggen', lon: -18.15, lat: 66.9, anker: 'start' }
];
export const PLADER = [
  { navn: '← Nordamerikanske plade', lon: -24.9, lat: 66.85, anker: 'start' },
  { navn: 'Eurasiske plade →', lon: -13.3, lat: 63.55, anker: 'end' }
];
