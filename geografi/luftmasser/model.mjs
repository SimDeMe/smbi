// Modeltal kan justeres her. Temperaturer i °C, højder i meter.
export const KONFIG = { top: 4000, toer: 9.8, maettet: 6, dugpunkt: 1.8, g: 9.81 };
export const LUFTMASSER = {
  maritimTropisk: { navn: 'Varm havluft', fag: 'Maritim tropisk luft (mT)', temperatur: 22, dugpunkt: 18, tekst: 'Fra et varmt hav: varm og fugtig. I modellen skal den kun løftes 500 m, før vanddamp begynder at kondensere.' },
  kontinentalTropisk: { navn: 'Varm fastlandsluft', fag: 'Kontinental tropisk luft (cT)', temperatur: 26, dugpunkt: 6, tekst: 'Fra et varmt fastland: varm og tør. Den skal løftes langt, før der dannes en sky.' },
  maritimPolar: { navn: 'Kølig havluft', fag: 'Maritim polar luft (mP)', temperatur: 12, dugpunkt: 8, tekst: 'Fra et køligt hav: kølig og fugtig. Over en varm overflade kan den give bygeskyer.' },
  kontinentalPolar: { navn: 'Kold fastlandsluft', fag: 'Kontinental polar luft (cP)', temperatur: 2, dugpunkt: -14, tekst: 'Fra et koldt fastland: kold og tør. Den kan fx nå Danmark fra øst om vinteren.' }
};
export const PROFILER = {
  stabil: { navn: 'Stabil', fald: 4, tekst: 'Omgivelserne køles langsomt med højden. En løftet luftpakke bliver koldere end luften omkring den og søger ned igen.' },
  ustabil: { navn: 'Ustabil', fald: 11, tekst: 'Omgivelserne køles hurtigt med højden. En løftet luftpakke er varmere end luften omkring den og får opdrift.' },
  betinget: { navn: 'Betinget stabil', fald: 7, tekst: 'Umættet luft modstår opstigning. Efter skydannelse køles pakken langsommere; med tilstrækkeligt løft kan den blive varmere end omgivelserne.' },
  inversion: { navn: 'Inversion', fald: 7, tekst: 'I de nederste 800 m stiger temperaturen med højden. Den varme luft over den kolde luft hæmmer lodret blanding.' }
};
export function skybase(masse) {
  return (masse.temperatur - masse.dugpunkt) / (KONFIG.toer - KONFIG.dugpunkt) * 1000;
}
export function pakketemperatur(z, masse) {
  const base = skybase(masse);
  return masse.temperatur - KONFIG.toer * Math.min(z, base) / 1000 - KONFIG.maettet * Math.max(0, z - base) / 1000;
}
export function omgivelser(z, masse, profil) {
  if (profil === 'inversion') return masse.temperatur + 6 * Math.min(z, 800) / 1000 - 7 * Math.max(0, z - 800) / 1000;
  return masse.temperatur - PROFILER[profil].fald * z / 1000;
}
export function tilstand(z, masse, profil) {
  const pakke = pakketemperatur(z, masse), ude = omgivelser(z, masse, profil);
  return { z, pakke, ude, forskel: pakke - ude, sky: z >= skybase(masse), acceleration: KONFIG.g * (pakke - ude) / (ude + 273.15) };
}
// Første højde over skybasen, hvor pakken bliver varmere end omgivelserne.
export function fritLoeft(masse, profil) {
  let negativ = false;
  for (let z = 10; z <= KONFIG.top; z += 10) {
    const d = tilstand(z, masse, profil).forskel;
    if (d < -0.001) negativ = true;
    if (d > 0.001 && (negativ || z === 10)) return z;
  }
  return null;
}
