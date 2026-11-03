// Idealiseret tolagsmodel med temperatur normaliseret til 255,15 K.
// Overfladen er sort i det langbølgede område. Atmosfæren er transparent for
// sollys og har samme langbølgede absorptivitet og emissivitet (Kirchhoffs lov).
// Referencepunkterne er valgte sluttemperaturer, ikke en CO₂-prognose.
export const TEMPERATUR_UDEN = 255.15;
const absorptionVed = celsius => 2 * (1 - (TEMPERATUR_UDEN / (celsius + 273.15)) ** 4);
export const ABSORPTION = absorptionVed(15);
export const FORSTAERKET_ABSORPTION = absorptionVed(18);
export const SCENARIER = [
  { navn: 'Uden drivhuseffekt', temperatur: -18, absorption: 0 },
  { navn: 'Nuværende reference', temperatur: 15, absorption: ABSORPTION },
  { navn: 'Forstærket · eksempel', temperatur: 18, absorption: FORSTAERKET_ABSORPTION },
];
export function starttilstand() {
  return { jord: 0.94, luft: 0.79 };
}
export function temperaturC(tilstand) {
  return tilstand.jord * TEMPERATUR_UDEN - 273.15;
}
export function energistroemme(tilstand, sol = true, gas = true) {
  const absorption = typeof gas === 'number' ? Math.max(0, Math.min(1, gas)) : gas ? ABSORPTION : 0;
  const jordUd = tilstand.jord ** 4;
  const luftEnVej = absorption * tilstand.luft ** 4;
  return {
    solInd: sol ? 1 : 0,
    jordUd,
    luftAbsorberet: absorption * jordUd,
    modstraaling: luftEnVej,
    luftTilRum: luftEnVej,
    jordTilRum: (1 - absorption) * jordUd,
  };
}
export function udvikl(tilstand, sekunder, sol = true, gas = true) {
  let rest = Math.max(0, sekunder);
  while (rest > 1e-9) {
    const dt = Math.min(rest, 0.04);
    const f = energistroemme(tilstand, sol, gas);
    tilstand.jord += dt * (f.solInd + f.modstraaling - f.jordUd) / 5;
    tilstand.luft += dt * (f.luftAbsorberet - f.modstraaling - f.luftTilRum) / 2.5;
    rest -= dt;
  }
  return tilstand;
}
