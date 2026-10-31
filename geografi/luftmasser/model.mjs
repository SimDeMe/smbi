// Idealiseret luftpakke efter NaturgeografiGrundbogen B, 10.5.
// Pakken er varmet af jorden og slippes uden løft: opdriften afgør resten.
export const TOP = 3000;
export const JORD = 20;      // omgivelsernes temperatur ved jorden, °C
export const PAKKE = 22;     // pakkens starttemperatur: 2 °C varmere end omgivelserne
export const TOER = .01;     // tøradiabatisk afkøling, °C/m
export const FUGTIG = .005;  // fugtadiabatisk afkøling, °C/m (bogen: 0,5–0,9 °C/100 m)
const DUGFALD = .002;        // dugpunktets fald før mætning, °C/m

export const LUFT = {
  toer: { navn: 'Tør pakke', dugpunkt: 10 },
  fugtig: { navn: 'Fugtig pakke', dugpunkt: 18.8 }
};
export const PROFILER = {
  stabil: { navn: 'Stabil luft', tekst: 'Omgivelserne afkøles kun 0,4 °C pr. 100 m. Pakken afkøles hurtigere, indhenter dem hurtigt og mister opdriften, uanset om den er tør eller fugtig.' },
  ustabil: { navn: 'Ustabil luft', tekst: 'Omgivelserne afkøles 1,2 °C pr. 100 m, hurtigere end både tør og fugtig luft afkøles. Pakken forbliver varmere og fortsætter opad. Fugten afgør kun, hvor skyen begynder.' },
  betinget: { navn: 'Betinget stabil luft', tekst: 'Omgivelserne afkøles 0,7 °C pr. 100 m, altså mellem de to adiabatiske gradienter. Her afgør pakkens fugt udfaldet: den tørre stopper, den fugtige danner sky og bliver ved.' },
  inversion: { navn: 'Inversion', tekst: 'Op til 1.000 m stiger omgivelsernes temperatur med højden. Selv en varm pakke mister opdriften lige over jorden. Laget virker som et låg, og luften ved jorden kan ikke stige.' }
};

export function omgivelser(profil, z) {
  if (profil === 'inversion') return JORD + .004 * Math.min(z, 1000) - .006 * Math.max(0, z - 1000);
  return JORD - { stabil: .004, ustabil: .012, betinget: .007 }[profil] * z;
}
// Højden hvor pakken bliver mættet: temperatur og dugpunkt mødes.
export function skybase(luft) {
  return (PAKKE - LUFT[luft].dugpunkt) / (TOER - DUGFALD);
}
export function pakketemperatur(luft, z) {
  const base = skybase(luft);
  return PAKKE - TOER * Math.min(z, base) - FUGTIG * Math.max(0, z - base);
}
export function tilstand(profil, luft, hoejde) {
  const z = Math.max(0, Math.min(TOP, hoejde)), base = skybase(luft);
  const temperatur = pakketemperatur(luft, z);
  const dugpunkt = z < base ? LUFT[luft].dugpunkt - DUGFALD * z : temperatur;
  // Hydrostatisk tryk, integreret i den valgte omgivelsesprofil.
  let integral = 0; const dz = z / 60;
  for (let i = 0; i < 60; i++) integral += dz / (omgivelser(profil, (i + .5) * dz) + 273.15);
  const tryk = 1013.25 * Math.exp(-9.81 / 287.05 * integral);
  const volumen = (temperatur + 273.15) / (PAKKE + 273.15) * 1013.25 / tryk;
  const omg = omgivelser(profil, z);
  return { z, temperatur, dugpunkt, tryk, volumen, omgivelser: omg, forskel: temperatur - omg, maettet: z >= base };
}
// Første højde over jorden, hvor pakken ikke længere er varmere end omgivelserne.
// null: pakken har opdrift hele vejen til figurens top.
export function ligevaegt(profil, luft, fra = 0) {
  for (let z = fra; z <= TOP; z += 1) {
    if (pakketemperatur(luft, z) - omgivelser(profil, z) <= 0) return z;
  }
  return null;
}

// Enkel lodret bevægelse: termisk opdrift og lineær modstand.
// Små deltrin gør resultatet uafhængigt af billedhastigheden.
export function bevaeg(profil, luft, z, v, sekunder) {
  while (sekunder > 0) {
    const dt = Math.min(.1, sekunder), s = tilstand(profil, luft, z);
    const acceleration = 9.81 * s.forskel / (s.omgivelser + 273.15) - .015 * v;
    v += acceleration * dt;
    z += v * dt;
    if (z <= 0) { z = 0; v = Math.max(0, v); }
    if (z >= TOP) return { z: TOP, v, slut: true };
    sekunder -= dt;
  }
  const s = tilstand(profil, luft, z);
  return { z, v, slut: Math.abs(v) < .05 && Math.abs(s.forskel) < .03 };
}
