// Tre hydrostatiske, isoterme luftsøjler med ens tværsnit: kølig – varm – kølig.
// Tryk i hPa, højde i m, temperatur i K.
export const R = 287.05, g = 9.81, grundtemperatur = 288.15;
// Fast opvarmning af den midterste søjle og største masseoverførsel (hPa ved jorden).
export const opvarmningK = 20, maksTab = 10;
export const skalahoejde = T => R * T / g;
export const trykIHoejde = (pBund, T, z) => pBund * Math.exp(-z / skalahoejde(T));
export const hoejdeAfTryk = (p, pBund, T) => skalahoejde(T) * Math.log(pBund / p);

// opvarmning og overfoersel er andele 0–1 af det fulde forløb.
export function beregn(opvarmning, overfoersel) {
  const koldT = grundtemperatur, varmT = koldT + opvarmningK * opvarmning;
  // Den varme søjle afgiver masse; hver af de to kølige søjler får halvdelen.
  const tab = maksTab * overfoersel;
  return {koldT, varmT, koldBund: 1000 + tab / 2, varmBund: 1000 - tab};
}
