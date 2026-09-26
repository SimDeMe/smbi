/* strand.js — kystens tværprofil og sandets regnskab.
   Det sand, bølgerne kan flytte, ligger enten oppe på stranden (i bermen)
   eller ude på revlen. Konstruktive bølger flytter det op på stranden
   (sommerprofil), destruktive bølger flytter det ud på revlen
   (vinterprofil). Sandet forsvinder ikke — det skifter bare plads. */

// ── Kanvas og målestok ─────────────────────────────────
export const W = 900, HC = 430;
export const X_MAX  = 118;       // m fra venstre kant til bag klitten
export const XS     = 70;        // m — kystlinjen (hvor havoverfladen møder stranden)
export const TANB   = 0.08;      // strandplanets hældning (ca. 4,6°)
export const KLIT_X = 110;       // m — klitfoden

const Y0 = 190;                  // px — havoverfladen på kanvas
const PX = W / X_MAX;            // 7,6 px pr. m vandret
const PY = 30;                   // 30 px pr. m lodret
export const OVERHOEJDE = PY / PX;   // ca. 4× — står i fakta-foden
export const HAV_Y = Y0;
export const px = x => x * PX;
export const py = z => Y0 - z * PY;

// ── Den faste del af profilen ──────────────────────────
const D0 = 5;                    // m — vanddybden ved venstre kant
const KONKAV = 0.7;              // havbunden er konkav: stejlest tæt ved land
const BAG_Z = 1.45;              // m — hvor strandplanet går over i den flade bagstrand
const BAG_X = XS + BAG_Z / TANB;

function grund(x){
  if (x >= KLIT_X) return BAG_Z + (KLIT_X - BAG_X) * 0.01 + (x - KLIT_X) * 0.36;
  if (x >= BAG_X)  return BAG_Z + (x - BAG_X) * 0.01;
  if (x >= XS)     return (x - XS) * TANB;
  return -D0 * Math.pow((XS - x) / XS, KONKAV);
}

// ── Det flytbare sand ──────────────────────────────────
const REVLE_X = 40, REVLE_B = 8, REVLE_MAKS = 1.0;    // m
const BERM_X  = XS + 12, BERM_B = 5.5, BERM_MAKS = 0.7; // m
export const V_SAND = 60;        // m³ pr. m kyst, der kan flyttes mellem strand og revle
export const START = 0.5;

export const sand = {
  s:   START,   // andel af det flytbare sand, der ligger oppe på stranden (0–1)
  dag: 0        // simuleret tid siden nulstilling (døgn)
};

export function nulstil(){ sand.s = START; sand.dag = 0; }

export function bundZ(x, s = sand.s){
  const b = (x - BERM_X) / BERM_B;
  const r = (x - REVLE_X) / REVLE_B;
  const t = (x - REVLE_X - 13) / 6;
  return grund(x)
       + BERM_MAKS * (s - 0.35) * Math.exp(-b * b)          // bermen — kan også æde sig ind
       + REVLE_MAKS * (1 - s) * Math.exp(-r * r)            // revlen
       - 0.35 * REVLE_MAKS * (1 - s) * Math.exp(-t * t);    // renden bag revlen
}
export const dybde = x => Math.max(0, -bundZ(x));
export const revleHoejde = () => REVLE_MAKS * (1 - sand.s);
export const revleX = () => REVLE_X;
export const bermX  = () => BERM_X;

// netto > 0: sandet vandrer op på stranden. netto < 0: ud på revlen.
export function udvikl(netto, doegn){
  if (!(doegn > 0)) return;
  sand.dag += doegn;
  sand.s = Math.min(1, Math.max(0, sand.s + netto * doegn / V_SAND));
}

// ── Tegning ────────────────────────────────────────────
export function tegnHimmel(c){
  const g = c.createLinearGradient(0, 0, 0, Y0);
  g.addColorStop(0, '#DFF1FB');
  g.addColorStop(1, '#F4FAFD');
  c.fillStyle = g;
  c.fillRect(0, 0, W, Y0 + 2);
}

export function tegnBund(c){
  c.beginPath();
  c.moveTo(px(X_MAX), py(bundZ(X_MAX)));
  for (let x = X_MAX; x >= 0; x -= 0.5) c.lineTo(px(x), py(bundZ(x)));
  c.lineTo(0, HC); c.lineTo(W, HC); c.closePath();
  const g = c.createLinearGradient(0, Y0 - 60, 0, HC);
  g.addColorStop(0, '#EFD9A6');
  g.addColorStop(0.55, '#D9BE7F');
  g.addColorStop(1, '#C9A96A');
  c.fillStyle = g; c.fill();

  // klitten med marehalm
  c.save();
  c.beginPath();
  c.moveTo(px(KLIT_X), py(bundZ(KLIT_X)));
  for (let x = KLIT_X; x <= X_MAX; x += 1) c.lineTo(px(x), py(bundZ(x)));
  c.lineTo(W, HC); c.lineTo(px(KLIT_X), HC); c.closePath();
  c.fillStyle = '#E7CE9A'; c.fill();
  c.clip();
  c.strokeStyle = '#6E8F3A'; c.lineWidth = 1.4;
  for (let x = KLIT_X + 1; x < X_MAX; x += 1.3){
    const y = py(bundZ(x));
    c.beginPath(); c.moveTo(px(x), y); c.lineTo(px(x) - 3, y - 13); c.stroke();
    c.beginPath(); c.moveTo(px(x), y); c.lineTo(px(x) + 4, y - 10); c.stroke();
  }
  c.restore();

  c.lineWidth = 2.2; c.strokeStyle = '#17211F';
  c.beginPath();
  c.moveTo(0, py(bundZ(0)));
  for (let x = 0; x <= X_MAX; x += 0.5) c.lineTo(px(x), py(bundZ(x)));
  c.stroke();
}

// Stranden, som den så ud ved start — stiplet, så ændringen kan ses.
export function tegnStartprofil(c){
  if (Math.abs(sand.s - START) < 0.04) return;
  c.save();
  c.setLineDash([5, 5]); c.lineWidth = 1.5; c.strokeStyle = 'rgba(23,33,31,.6)';
  for (const [a, b] of [[REVLE_X - 22, REVLE_X + 25], [XS + 1, BAG_X + 6]]){
    c.beginPath();
    for (let x = a; x <= b; x += 1) c.lineTo(px(x), py(bundZ(x, START)));
    c.stroke();
  }
  c.restore();
}

export function tegnMaerkater(c, maerk){
  c.save();
  c.font = "600 11px 'IBM Plex Mono', ui-monospace, monospace";
  c.textAlign = 'center';
  const brugt = [];
  for (const m of maerk){
    const w = c.measureText(m.tekst).width + 14;
    let x = Math.max(w / 2 + 3, Math.min(W - w / 2 - 3, m.x));
    let y = Math.max(19, Math.min(HC - 5, m.y));
    while (brugt.some(b => Math.abs(b.y - y) < 21 && Math.abs(b.x - x) < (b.w + w) / 2 + 4)) y -= 23;
    brugt.push({ x, y, w });
    c.fillStyle = m.bund || 'rgba(255,249,238,.94)';
    c.strokeStyle = '#17211F'; c.lineWidth = 1.5;
    c.beginPath(); c.roundRect(x - w / 2, y - 15, w, 19, 9);
    c.fill(); c.stroke();
    c.fillStyle = '#17211F';
    c.fillText(m.tekst, x, y - 1.5);
    if (m.mod !== undefined){                     // lille streg ned til det, mærkatet peger på
      c.beginPath(); c.moveTo(x, y + 4); c.lineTo(m.x, m.mod); c.stroke();
    }
  }
  c.restore();
}
