// Psykrometermodel — relativ luftfugtighed ud fra tør- og vådtemperatur.
//
// Mættet damptryk: Magnus-formlen (WMO, over vand), hPa.
// Psykrometerligningen: e = es(Tv) − A · p · (Tt − Tv)
// A = 8,0·10⁻⁴ °C⁻¹ svarer til et uventileret psykrometer, der hænger stille
// (et ventileret/aspirationspsykrometer har ca. 6,6·10⁻⁴). Med denne værdi
// genskabes tabellen på klassens psykrometer (fx 20 °C: 91, 81, 73, 64, 56, 48 %).

export const A_UVENTILERET = 8.0e-4;
export const NORMALTRYK = 1013.25; // hPa

export function mættetDamptryk(t) {
  return 6.112 * Math.exp((17.62 * t) / (243.12 + t));
}

export function damptryk(tør, våd, tryk = NORMALTRYK, A = A_UVENTILERET) {
  return mættetDamptryk(våd) - A * tryk * (tør - våd);
}

/** Relativ luftfugtighed i % (0–100). Våd over tør giver 100 %. */
export function relativFugtighed(tør, våd, tryk = NORMALTRYK, A = A_UVENTILERET) {
  if (våd >= tør) return 100;
  const rf = (100 * damptryk(tør, våd, tryk, A)) / mættetDamptryk(tør);
  return Math.max(0, Math.min(100, rf));
}

/** Tabellens heltalsværdi, som den står trykt på psykrometeret. */
export function tabelværdi(tør, forskel) {
  return Math.round(relativFugtighed(tør, tør - forskel));
}

// ── Mætningskurven fra Dugpunkt.html ───────────────────────────────
// Sitets forenklede kurve for, hvor meget vanddamp luften højst kan rumme:
// 5 · e^(0,06·T) g/m³. Den afviger under ca. 5 % fra den rigtige værdi
// mellem 0 og 35 °C og er den kurve, eleverne aflæser på.
export function kapacitet(t) {
  return 5 * Math.exp(0.06 * t);
}

/** Temperaturen, hvor kurven når et givet vandindhold (dugpunktet). */
export function dugpunktFraKurve(gram) {
  return Math.log(gram / 5) / 0.06;
}
