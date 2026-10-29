// Tre hydrostatiske, isoterme luftsøjler med ens tværsnit: side – midte – side.
// Tryk i hPa, højde i m, temperatur i K.
export const R = 287.05, g = 9.81, grundtemperatur = 288.15;
// Fast temperaturændring af den midterste søjle og største masseoverførsel (hPa ved jorden).
export const opvarmningK = 20, maksTab = 10;
export const skalahoejde = T => R * T / g;
export const trykIHoejde = (pBund, T, z) => pBund * Math.exp(-z / skalahoejde(T));
export const hoejdeAfTryk = (p, pBund, T) => skalahoejde(T) * Math.log(pBund / p);

// opvarmning og overfoersel er andele −1–1 af det fulde forløb. Positiv: midten
// opvarmes og afgiver luft (termisk lavtryk). Negativ: midten afkøles og får luft
// (termisk højtryk).
export function beregn(opvarmning, overfoersel) {
  const sideT = grundtemperatur, midtT = sideT + opvarmningK * opvarmning;
  // Det, midtersøjlen afgiver, deles ligeligt mellem de to sidesøjler.
  const tab = maksTab * overfoersel;
  return {sideT, midtT, sideBund: 1000 + tab / 2, midtBund: 1000 - tab};
}
