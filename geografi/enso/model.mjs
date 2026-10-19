// ENSO-procesmodel v1. Enheder og tidskonstanter er illustrative, ikke kalibrerede.
// T: central temperaturafvigelse i °C. H: langsom varmebalance (relativ).
// dT/dt = 0,85(1-W) + 0,32H - 0,24T - 0,055T³
// dH/dt = -0,11T - 0,055H. W = grundvind - 0,16T - vindpust.
// Den negative, langsomme varmebalance repræsenterer afladning/genopladning.
export const begræns = (x, min, max) => Math.max(min, Math.min(max, x));
export function nyModel(grundvind = 1, feedback = true) {
  return {tid: 0, temperatur: 0, varme: 0, grundvind, feedback, pustTil: -1};
}
export function effektivVind(m) {
  return begræns(m.grundvind - (m.feedback ? .16 * m.temperatur : 0) - (m.tid < m.pustTil ? 1 : 0), -.6, 2.2);
}
export function beregn(m, måneder) {
  // Små trin gør udfaldet uafhængigt af skærmens billedfrekvens og tempo.
  const slutTid = m.tid + måneder;
  let rest = måneder;
  while (rest > 1e-9) {
    const dt = Math.min(rest, 1 / 120, m.pustTil > m.tid ? m.pustTil - m.tid : rest);
    const t = m.temperatur;
    const ændring = .85 * (1 - effektivVind(m)) + .32 * m.varme - .24 * t - .055 * t ** 3;
    m.temperatur += dt * ændring;
    m.varme += dt * (-.11 * t - .055 * m.varme);
    m.tid += dt;
    rest -= dt;
  }
  // Undgå at afrunding holder et to måneder langt vindpust aktivt ved måned 2.
  m.tid = slutTid;
  return m;
}
export function fase(m) {
  return m.temperatur > .5 ? 'El Niño' : m.temperatur < -.5 ? 'La Niña' : 'Neutral';
}
export function havTilstand(m) {
  const a = begræns(m.temperatur, -2.5, 2.5);
  return {
    vestDybde: 180 - 24 * a,
    østDybde: begræns(60 + 29 * a, 15, 160),
    opvelling: begræns(effektivVind(m) * (1 - .22 * a), .07, 2),
    regnX: begræns(.24 + .15 * a, .13, .68),
    vestTemperatur: 29 - .3 * a,
    østTemperatur: 24 + 2.3 * a,
  };
}
