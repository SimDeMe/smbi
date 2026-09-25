/* ═══════════════════════════════════════════════════════════
   felt.js — beregningsmodellen.

   Jordens magnetfelt som én stangmagnet (en dipol) i jordens
   centrum, med aksen gennem den magnetiske nordpol. Alt regnes i
   klodens eget system, samme konvention som three.js' kugle-
   tekstur: +Y er omdrejningsaksen (geografisk nord), længdegrad
   0° ligger på +X og 90° Ø på −Z. Kloden har radius 1.

   Ingen three.js her — kun tal ind og tal ud, så modellen kan
   afprøves for sig selv.
   ═══════════════════════════════════════════════════════════ */

const GRAD = Math.PI/180;
export const R_JORD_KM = 6371;

const prik  = (a, b) => a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
const kryds = (a, b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
const norm  = a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0]/l, a[1]/l, a[2]/l]; };

/** Punkt på enhedskuglen for en bredde- og længdegrad. */
export function kropPos(lat, lon){
  const p = lat*GRAD, l = lon*GRAD;
  return [Math.cos(p)*Math.cos(l), Math.sin(p), -Math.cos(p)*Math.sin(l)];
}

/** Det omvendte: bredde- og længdegrad for et punkt. */
export function latLon(v){
  const n = norm(v);
  let lon = Math.atan2(-n[2], n[0])/GRAD;
  if(lon <= -180) lon += 360;
  return {lat: Math.asin(Math.max(-1, Math.min(1, n[1])))/GRAD, lon};
}

/** Lodret op, øst og nord på et sted. Nord er retningen langs
    jordoverfladen mod omdrejningsaksens nordende. */
export function lokaltSystem(p){
  const op = norm(p);
  let oest = kryds([0,1,0], op);
  /* På selve polerne findes der ingen øst — vælg en fast retning. */
  if(Math.hypot(...oest) < 1e-9) oest = [0,0,-1];
  oest = norm(oest);
  return {op, oest, nord: kryds(op, oest)};
}

/** Feltet på jordoverfladen i punktet p, i enheder af feltstyrken
    ved den magnetiske ækvator.

    For en dipol med moment m er B ∝ 3(m·r̂)r̂ − m. Jordens dipol-
    moment peger mod syd: den magnetiske nordpol er magnetens
    sydende, og det er dér, feltlinjerne går ind i jorden. Med
    m = −pol giver det B = pol − 3(pol·p)p. Er feltet vendt, skifter
    B fortegn.                                                    */
export function feltVektor(p, pol, vendt){
  const s = vendt ? -1 : 1, k = prik(pol, p);
  return [s*(pol[0]-3*k*p[0]), s*(pol[1]-3*k*p[1]), s*(pol[2]-3*k*p[2])];
}

/**
 * Det, et kompas og en inklinationsnål viser på et sted.
 * @returns {D, I, F, vandret}
 *   D  misvisning i grader, positiv mod øst (−180…180)
 *   I  inklination i grader, positiv nedad
 *   F  feltstyrke i µT
 *   vandret  enhedsvektor langs jorden, dér hvor nålens nordende peger
 */
export function aflaes(lat, lon, polLat, polLon, vendt, b0){
  const p = kropPos(lat, lon), pol = kropPos(polLat, polLon);
  const B = feltVektor(p, pol, vendt);
  const {op, oest, nord} = lokaltSystem(p);
  const bn = prik(B, nord), be = prik(B, oest), bd = -prik(B, op);
  const bh = Math.hypot(bn, be);
  const vandret = bh > 1e-9
    ? norm([B[0]+bd*op[0], B[1]+bd*op[1], B[2]+bd*op[2]])
    : nord;
  return {
    D: Math.atan2(be, bn)/GRAD,
    I: Math.atan2(bd, bh)/GRAD,
    F: b0*Math.hypot(bn, be, bd),
    vandret
  };
}

/** Misvisningen alene — bruges til farvekortet, der regner den
    ud i en halv million punkter, så her spares på det hele. */
export function misvisning(p, pol, vendt){
  const k = prik(pol, p), s = vendt ? -1 : 1;
  const bx = s*(pol[0]-3*k*p[0]), by = s*(pol[1]-3*k*p[1]), bz = s*(pol[2]-3*k*p[2]);
  /* øst = (Y × p)/|…|, nord = p × øst — skrevet ud */
  const ex = p[2], ez = -p[0], el = Math.hypot(ex, ez) || 1e-9;
  const be = (bx*ex + bz*ez)/el;
  const nx = p[1]*ez/el, ny = (p[2]*ex - p[0]*ez)/el, nz = -p[1]*ex/el;
  const bn = bx*nx + by*ny + bz*nz;
  return Math.atan2(be, bn)/GRAD;
}

/** Afstand langs jordoverfladen i km. */
export function afstandKm(a, b){
  return Math.acos(Math.max(-1, Math.min(1, prik(norm(a), norm(b))))) * R_JORD_KM;
}

/** Punkter på storcirklen fra a til b, løftet til radius r. */
export function storcirkel(a, b, n, r = 1){
  const A = norm(a), B = norm(b);
  const w = Math.acos(Math.max(-1, Math.min(1, prik(A, B))));
  const ud = [];
  for(let i=0;i<=n;i++){
    const t = i/n;
    let v;
    if(w < 1e-6) v = A;
    else {
      const s = Math.sin(w), fa = Math.sin((1-t)*w)/s, fb = Math.sin(t*w)/s;
      v = [A[0]*fa+B[0]*fb, A[1]*fa+B[1]*fb, A[2]*fa+B[2]*fb];
    }
    ud.push([v[0]*r, v[1]*r, v[2]*r]);
  }
  return ud;
}

/** Én feltlinje for en dipol, i et system hvor +Y er den magnetiske
    akse (mod den magnetiske nordpol) og φ er den magnetiske længde.
    Feltlinjen følger r = L·cos²λ og rammer jorden, hvor cos²λ = 1/L.
    Punkterne går fra den sydlige til den nordlige fodende — samme
    vej som feltet, når det ikke er vendt.                        */
export function feltlinje(L, phi, n = 72){
  const l0 = Math.acos(Math.sqrt(1/L));
  const ud = [];
  for(let i=0;i<=n;i++){
    const lam = -l0 + 2*l0*i/n, r = L*Math.cos(lam)**2;
    ud.push([r*Math.cos(lam)*Math.cos(phi), r*Math.sin(lam), r*Math.cos(lam)*Math.sin(phi)]);
  }
  return ud;
}
