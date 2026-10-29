// To hydrostatiske, isoterme luftsøjler. Tryk i hPa, højde i m, temperatur i K.
export const R = 287.05, g = 9.81, grundtemperatur = 288.15;
export function beregn(opvarmning, overfoersel) {
  const koldT = grundtemperatur, varmT = koldT + 30 * opvarmning;
  // Samme tværsnit: tab af masse i den varme søjle tilføres den kolde.
  const tab = 10 * overfoersel;
  const koldBund = 1000 + tab, varmBund = 1000 - tab;
  const tryk = (p, t, z) => p * Math.exp(-g * z / (R * t));
  return {koldT, varmT, koldBund, varmBund,
    koldTop: tryk(koldBund, koldT, 3000), varmTop: tryk(varmBund, varmT, 3000),
    laghoejde: 4000 * varmT / koldT};
}
