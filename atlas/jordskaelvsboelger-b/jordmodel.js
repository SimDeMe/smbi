// Strålegang gennem en kugleformet Jord. Farterne er afrundede værdier fra den
// globale referencemodel ak135 (Kennett, Engdahl & Buland 1995). Strålerne følges
// trin for trin: inde i et lag bøjer de efter fartens ændring med dybden, og ved
// lagenes graenser brydes eller kastes de tilbage efter Snells lov. Ingen DOM.

export const R = 6371;                   // km
export const GRAENSER = { moho: 35, cmb: 2891, icb: 5153.5 };

// [dybde i km, vP, vS] – samme dybde to gange er et spring i farten.
const KAPPE = [
  [0, 5.8, 3.46], [20, 5.8, 3.46], [20, 6.5, 3.85], [35, 6.5, 3.85],
  [35, 8.04, 4.48], [120, 8.05, 4.50], [210, 8.30, 4.52], [310, 8.66, 4.70], [410, 9.03, 4.87],
  [410, 9.36, 5.08], [510, 9.70, 5.28], [610, 10.03, 5.48], [660, 10.20, 5.57],
  [660, 10.79, 5.96], [760, 11.06, 6.21], [1000, 11.46, 6.37], [1500, 12.17, 6.62],
  [2000, 12.78, 6.93], [2500, 13.33, 7.19], [2740, 13.65, 7.30], [2891, 13.66, 7.28]
];
const YDRE_KERNE = [[2891, 8.0, 0], [3200, 8.52, 0], [3600, 9.10, 0], [4000, 9.56, 0], [4500, 9.99, 0], [5153.5, 10.29, 0]];
const INDRE_KERNE = [[5153.5, 11.04, 3.5], [6371, 11.26, 3.67]];
// Uden indre kerne (Jorden før Inge Lehmann, 1936): flydende kerne helt ind til midten.
const HEL_KERNE = [...YDRE_KERNE, [6371, 10.40, 0]];

function lagFra(tabel) {
  const lag = [];
  let aktuel = [];
  for (let i = 0; i < tabel.length; i++) {
    if (i && tabel[i][0] === tabel[i - 1][0]) { lag.push(aktuel); aktuel = []; }
    aktuel.push(tabel[i]);
  }
  lag.push(aktuel);
  return lag;
}

// Lag sorteret udefra og ind, hver med radius-interval og en tabel.
export function jordlag(indreKerne = true) {
  const tabeller = [...lagFra(KAPPE), YDRE_KERNE, ...(indreKerne ? [INDRE_KERNE] : [])];
  if (!indreKerne) tabeller[tabeller.length - 1] = HEL_KERNE;
  return tabeller.map(t => ({ top: R - t[0][0], bund: R - t[t.length - 1][0], tabel: t, flydende: t[0][2] === 0 }));
}

function fartILag(lag, r, type) {
  const dybde = R - r, t = lag.tabel, k = type === 'P' ? 1 : 2;
  if (dybde <= t[0][0]) return t[0][k];
  for (let i = 1; i < t.length; i++) {
    if (dybde <= t[i][0]) {
      const u = (dybde - t[i - 1][0]) / (t[i][0] - t[i - 1][0]);
      return t[i - 1][k] + u * (t[i][k] - t[i - 1][k]);
    }
  }
  return t[t.length - 1][k];
}

// Fartens haeldning dv/dr inde i laget (til strålens krumning).
function haeldning(lag, r, type) {
  const h = 0.5;
  const op = Math.min(lag.top, r + h), ned = Math.max(lag.bund, r - h);
  return (fartILag(lag, op, type) - fartILag(lag, ned, type)) / (op - ned || 1);
}

export function fart(r, type, indreKerne = true) {
  const lagene = jordlag(indreKerne);
  const lag = lagene.find(l => r <= l.top && r >= l.bund) || lagene[lagene.length - 1];
  return fartILag(lag, r, type);
}

// Følg én stråle fra kilden. vinkel = afgangsvinkel målt fra lodret ned (0°) mod vandret (90°).
// Returnerer punkter {x, y, t} (km, s; Jordens centrum i 0,0, kilden øverst) og hvordan den sluttede.
export function foelgStraale({ vinkel, type, indreKerne = true, kildedybde = 10, trin = 8 }) {
  const lagene = jordlag(indreKerne);
  let x = 0, y = R - kildedybde, t = 0;
  let nx = Math.sin(vinkel * Math.PI / 180), ny = -Math.cos(vinkel * Math.PI / 180);
  let li = lagene.findIndex(l => y <= l.top && y >= l.bund);
  const punkter = [{ x, y, t }];
  const faser = [];                      // hvilke lag strålen har været i (til navngivning)
  let slut = 'overflade', kastetFraIndreKerne = false;
  for (let n = 0; n < 20000; n++) {
    const lag = lagene[li];
    if (!faser.length || faser[faser.length - 1] !== li) faser.push(li);
    const r = Math.hypot(x, y), v = fartILag(lag, r, type);
    // Krumning: dn/ds = −(∇v − (n·∇v)n)/v, hvor ∇v = dv/dr · r̂.
    const g = haeldning(lag, r, type), rx = x / r, ry = y / r;
    const nr = nx * rx + ny * ry;
    let kx = -(g * rx - nr * g * nx) / v, ky = -(g * ry - nr * g * ny) / v;
    let mx = nx + 0.5 * trin * kx, my = ny + 0.5 * trin * ky;
    const ml = Math.hypot(mx, my); mx /= ml; my /= ml;
    let x2 = x + trin * mx, y2 = y + trin * my;
    const r2 = Math.hypot(x2, y2);
    // Krydser strålen en lagflade i dette trin?
    let graense = null;
    if (r2 > lag.top) graense = { rb: lag.top, ud: true };
    else if (r2 < lag.bund && lag.bund > 0) graense = { rb: lag.bund, ud: false };
    if (!graense) {
      const v2 = fartILag(lag, Math.max(lag.bund, Math.min(lag.top, r2)), type);
      t += trin * 2 / (v + v2);
      x = x2; y = y2;
      nx = nx + trin * kx; ny = ny + trin * ky;
      const l = Math.hypot(nx, ny); nx /= l; ny /= l;
      punkter.push({ x, y, t });
      continue;
    }
    // Ret linje fra (x,y) i retning (mx,my) til cirklen med radius rb.
    const b = x * mx + y * my, c = x * x + y * y - graense.rb * graense.rb;
    const disk = Math.max(0, b * b - c);
    const s = graense.ud ? -b + Math.sqrt(disk) : -b - Math.sqrt(disk);
    const sx = x + s * mx, sy = y + s * my;
    t += Math.max(0, s) / ((v + fartILag(lag, graense.rb, type)) / 2);
    x = sx; y = sy; nx = mx; ny = my;
    punkter.push({ x, y, t });
    if (graense.ud && li === 0) break;    // nået overfladen
    const nyLi = li + (graense.ud ? -1 : 1);
    const v1 = fartILag(lag, graense.rb, type), v2 = fartILag(lagene[nyLi], graense.rb, type);
    const ux = x / graense.rb, uy = y / graense.rb, cosi = nx * ux + ny * uy;
    if (v2 === 0) { slut = 'stoppet'; break; } // S-bølger kan ikke fortsætte i væske
    const sini = Math.sqrt(Math.max(0, 1 - cosi * cosi)), sin2 = sini * v2 / v1;
    if (sin2 >= 1) {
      // Totalrefleksion: strålen kastes tilbage ind i samme lag.
      nx -= 2 * cosi * ux; ny -= 2 * cosi * uy;
      if (indreKerne && nyLi === lagene.length - 1) kastetFraIndreKerne = true;
    } else {
      const tx = nx - cosi * ux, ty = ny - cosi * uy, tl = Math.hypot(tx, ty) || 1;
      const cos2 = Math.sqrt(1 - sin2 * sin2) * Math.sign(cosi || 1);
      nx = sin2 * tx / tl + cos2 * ux; ny = sin2 * ty / tl + cos2 * uy;
      li = nyLi;
    }
    // Skub et lille stykke væk fra fladen, så næste trin starter inde i laget.
    x += nx * 0.01; y += ny * 0.01;
  }
  const sidste = punkter[punkter.length - 1];
  const afstand = Math.atan2(sidste.x, sidste.y) * 180 / Math.PI; // vinkelafstand i grader
  const kerne = faser.some(i => lagene[i].flydende), indre = indreKerne && faser.includes(lagene.length - 1);
  // Fasenavne som i seismologien: K = ydre kerne, I = indre kerne, i = kastet tilbage fra den.
  const navn = type === 'S' ? 'S' : indre ? 'PKIKP' : kastetFraIndreKerne ? 'PKiKP' : kerne ? 'PKP' : 'P';
  return { punkter, slut, afstand, tid: sidste.t, type, vinkel, navn };
}

// En vifte af stråler. Stejle stråler (under ca. 14°) når ned i kernen og lander
// meget spredt, så dér skydes de tættere. tæt = vinkelskridt for de stejle.
export function vifte({ type, indreKerne = true, taet = 0.5, flad = 2.5, trin = 8 }) {
  const vinkler = [];
  for (let v = taet / 2; v < 14; v += taet) vinkler.push(v);
  for (let v = 14; v <= 89.5; v += flad) vinkler.push(v);
  return vinkler.map(vinkel => foelgStraale({ vinkel, type, indreKerne, trin }));
}

// Gangtid for en bestemt vinkelafstand: søg afgangsvinkler, hvis stråler lander dér.
// Giver alle ankomster (en afstand kan nås ad flere veje, fx P og PKIKP).
export function ankomsterVed(straaler, afstand) {
  const ud = [];
  const sorteret = straaler.filter(s => s.slut === 'overflade').sort((a, b) => a.vinkel - b.vinkel);
  for (let i = 1; i < sorteret.length; i++) {
    const a = sorteret[i - 1], b = sorteret[i];
    if (a.navn !== b.navn) continue;
    if ((a.afstand - afstand) * (b.afstand - afstand) <= 0 && a.afstand !== b.afstand) {
      const u = (afstand - a.afstand) / (b.afstand - a.afstand);
      // Styrke: hvor tæt strålerne lander (få stråler pr. grad = svag ankomst).
      const taethed = Math.abs((b.vinkel - a.vinkel) / (b.afstand - a.afstand));
      ud.push({ navn: a.navn, tid: a.tid + u * (b.tid - a.tid), taethed });
    }
  }
  return ud.sort((a, b) => a.tid - b.tid);
}
