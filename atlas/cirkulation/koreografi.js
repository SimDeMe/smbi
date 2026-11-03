// Motion design: når man går ét trin frem, tegnes det nye i den rækkefølge,
// det sker (som i drivhuseffekten). Hvert trin i tekst.js kan have en
// koreografi: [{ el, fra, til }] i sekunder. Globus og snit spørger med
// fremdrift(s, el), hvor langt et element er nået (0–1). Uden koreografi
// er svaret altid 1, så det færdige billede er det samme som før.

const klem = x => Math.max(0, Math.min(1, x));
const glat = p => p * p * (3 - 2 * p);

function trinFor(s) {
  return s.koreo?.trin.koreografi || null;
}

// Er elementet med i det trin, der spiller nu?
export function har(s, el) {
  return !!trinFor(s)?.some(c => c.el === el);
}

export function fremdrift(s, el) {
  const liste = trinFor(s);
  const c = liste?.find(k => k.el === el);
  if (!c) return 1;
  return glat(klem((s.koreo.t - c.fra) / (c.til - c.fra)));
}

export function slut(trin) {
  return (trin.koreografi || []).reduce((m, c) => Math.max(m, c.til), 0);
}
