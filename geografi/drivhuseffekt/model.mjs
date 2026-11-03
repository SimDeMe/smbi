// En kvalitativ tolagsmodel. Tid og temperatur er normaliserede og vises ikke.
// Overfladen er sort i det langbølgede område. Atmosfæren er transparent for
// sollys og har samme langbølgede absorptivitet og emissivitet (Kirchhoffs lov).
// Begge lag har varmekapacitet; udsendelsen følger temperatur i fjerde potens.
export const ABSORPTION = 0.78;
export function starttilstand() {
  return { jord: 0.94, luft: 0.79 };
}
export function energistroemme(tilstand, sol = true, gas = true) {
  const absorption = gas ? ABSORPTION : 0;
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
  // Små deltrin gør simulationen stabil også efter et langsomt browserbillede.
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
