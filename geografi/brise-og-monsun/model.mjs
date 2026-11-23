// Idealiseret overflademodel for land og hav:
//   C · dT/dt = F · S(t) − λ · (T − Tb)
// Land og hav får samme solindstråling S(t) og samme afkøling. Kun den
// effektive varmekapacitet er forskellig: tidskonstanten τ = C/λ er lille for
// land (kun et tyndt lag opvarmes) og stor for hav (varmen blandes ned).
// Tallene er valgt til et typisk kystdøgn og et skematisk monsunår; det er
// ikke målinger fra et bestemt sted.

// Døgn: tid 0 = kl. 6 (solopgang), solnedgang kl. 18.
export const DOEGN = {
  periode: 24,
  tauLand: 4,      // timer
  tauHav: 150,     // timer
  F: 20,           // °C ved fuld sol i ligevægt over Tb
  Tb: 12,          // °C
  sol: tid => Math.max(0, Math.sin(Math.PI * tid / 12)),
};

// År: tid 0 = 1. januar, måneder. Ved ca. 25° N er der sol hele året, men
// mest omkring sommersolhverv (ca. 21. juni ≈ 5,7 måneder).
export const AAR = {
  periode: 12,
  tauLand: 0.7,    // måneder
  tauHav: 4,       // måneder
  F: 20,
  Tb: 10,
  sol: tid => 0.6 + 0.4 * Math.cos(2 * Math.PI * (tid - 5.7) / 12),
};

const PUNKTER = 2400;

// Den periodiske løsning: kør mange perioder, så starttilstanden er glemt.
export function periodisk(cfg, perioder = 30) {
  const dt = cfg.periode / PUNKTER;
  const middelSol = Array.from({ length: PUNKTER }, (_, i) => cfg.sol(i * dt)).reduce((a, b) => a + b) / PUNKTER;
  let land = cfg.Tb + cfg.F * middelSol, hav = land;
  const ud = { land: new Float64Array(PUNKTER + 1), hav: new Float64Array(PUNKTER + 1), cfg };
  for (let p = 0; p < perioder; p++) {
    for (let i = 0; i <= PUNKTER; i++) {
      if (p === perioder - 1) { ud.land[i] = land; ud.hav[i] = hav; }
      if (i === PUNKTER) break;
      // Midtpunktsmetode for nøjagtighed med få skridt.
      const s = cfg.sol((i + 0.5) * dt);
      const dLand = (cfg.F * s - (land - cfg.Tb)) / cfg.tauLand;
      const dHav = (cfg.F * s - (hav - cfg.Tb)) / cfg.tauHav;
      const lm = land + dLand * dt / 2, hm = hav + dHav * dt / 2;
      land += dt * (cfg.F * s - (lm - cfg.Tb)) / cfg.tauLand;
      hav += dt * (cfg.F * s - (hm - cfg.Tb)) / cfg.tauHav;
    }
  }
  let maks = 0;
  for (let i = 0; i <= PUNKTER; i++) maks = Math.max(maks, ud.land[i] - ud.hav[i]);
  ud.maksForskel = maks;
  return ud;
}

function interpoler(arr, periode, tid) {
  const t = ((tid % periode) + periode) % periode;
  const x = t / periode * PUNKTER;
  const i = Math.floor(x), f = x - i;
  return arr[i] * (1 - f) + arr[Math.min(PUNKTER, i + 1)] * f;
}

// Vind: positiv = fra hav mod land ved jorden (søbrise/sommermonsun).
// Normaliseret, så den kraftigste søbrise/sommermonsun er 1. Den antages
// proportional med temperaturforskellen land − hav (termisk tryk).
export function tilstand(serie, tid) {
  const p = serie.cfg.periode;
  const land = interpoler(serie.land, p, tid);
  const hav = interpoler(serie.hav, p, tid);
  const forskel = land - hav;
  return { land, hav, forskel, vind: forskel / serie.maksForskel, sol: serie.cfg.sol(((tid % p) + p) % p) };
}
