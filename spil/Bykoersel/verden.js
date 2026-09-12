// Byen: uendeligt gitter af kvarterer, genereret deterministisk pr. blok
// så samme blok altid ser ens ud, uden at hele byen skal gemmes i hukommelsen.

export const BLOK = 240;
export const VEJBREDDE = 46;
export const FORTOV = 12;

const BYGNING_FARVER = ['#C7E6F6', '#FBD3E1', '#D6EFC4', '#E2D6F8', '#FFD9C9', '#EADFC8'];

function hash(bx, by) {
  let a = (bx * 374761393 + by * 668265263) ^ 0x9e3779b9;
  a = Math.imul(a ^ (a >>> 15), 1 | a);
  a = (a + Math.imul(a ^ (a >>> 7), 61 | a)) ^ a;
  return (a ^ (a >>> 14)) >>> 0;
}

function lavRng(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const bygningsCache = new Map();

// Bygninger placeres i en 2×2-celleopdeling af blokkens indre kvadrat,
// med fortovskant hele vejen rundt — bilen kan køre på fortovet, kun
// bygninger er faste forhindringer.
export function hentBygninger(bx, by) {
  const noegle = bx + ',' + by;
  let liste = bygningsCache.get(noegle);
  if (liste) return liste;

  const rng = lavRng(hash(bx, by));
  const x0 = bx * BLOK + VEJBREDDE / 2;
  const y0 = by * BLOK + VEJBREDDE / 2;
  const indre = BLOK - VEJBREDDE;
  const celle = indre / 2;
  liste = [];

  for (let cy = 0; cy < 2; cy++) {
    for (let cx = 0; cx < 2; cx++) {
      if (rng() < 0.12) continue; // tomt grønt hjørne ind imellem
      const maxW = celle - FORTOV * 2;
      const w = maxW * (0.55 + rng() * 0.4);
      const h = maxW * (0.55 + rng() * 0.4);
      const px = x0 + cx * celle + FORTOV + (maxW - w) * rng();
      const py = y0 + cy * celle + FORTOV + (maxW - h) * rng();
      liste.push({
        x: px, y: py, w, h,
        farve: BYGNING_FARVER[(rng() * BYGNING_FARVER.length) | 0],
      });
    }
  }
  bygningsCache.set(noegle, liste);
  return liste;
}

export function bygningerINaerheden(x, y) {
  const bx = Math.floor(x / BLOK), by = Math.floor(y / BLOK);
  let alle = [];
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      alle = alle.concat(hentBygninger(bx + dx, by + dy));
    }
  }
  return alle;
}

// Nærmeste punkt på et rektangel — bruges til cirkel-mod-rektangel-kollision.
export function loesKollision(pos, radius) {
  const bygninger = bygningerINaerheden(pos.x, pos.y);
  for (const b of bygninger) {
    const naermesteX = Math.max(b.x, Math.min(pos.x, b.x + b.w));
    const naermesteY = Math.max(b.y, Math.min(pos.y, b.y + b.h));
    const dx = pos.x - naermesteX, dy = pos.y - naermesteY;
    const distKvadrat = dx * dx + dy * dy;
    if (distKvadrat < radius * radius) {
      const dist = Math.sqrt(distKvadrat) || 0.001;
      const skub = radius - dist;
      pos.x += (dx / dist) * skub;
      pos.y += (dy / dist) * skub;
      return true;
    }
  }
  return false;
}

// Et tilfældigt punkt på en vejbane i nærheden af (cx,cy) — bruges til at
// sætte trafik, cyklister og checkpoints ned et sted, der giver mening.
export function tilfaeldigVejPunkt(cx, cy, minR, maxR, rngFn = Math.random) {
  const vinkel = rngFn() * Math.PI * 2;
  const r = minR + rngFn() * (maxR - minR);
  const maalX = cx + Math.cos(vinkel) * r;
  const maalY = cy + Math.sin(vinkel) * r;
  const vandret = rngFn() < 0.5;
  if (vandret) {
    const by = Math.round(maalY / BLOK);
    const retning = rngFn() < 0.5 ? 1 : -1;
    const laneY = by * BLOK + (retning > 0 ? VEJBREDDE / 4 : -VEJBREDDE / 4);
    return { x: maalX, y: laneY, vandret: true, retning };
  } else {
    const bx = Math.round(maalX / BLOK);
    const retning = rngFn() < 0.5 ? 1 : -1;
    const laneX = bx * BLOK + (retning > 0 ? -VEJBREDDE / 4 : VEJBREDDE / 4);
    return { x: laneX, y: maalY, vandret: false, retning };
  }
}

// Konteksten g forventes allerede at være flyttet til kamera-rummet
// (side.js sætter transformen én gang og deler den med alle tegnefunktioner).
export function tegnBy(g, kamera, bredde, hoejde) {
  const x0 = kamera.x - bredde / 2, y0 = kamera.y - hoejde / 2;
  const bxMin = Math.floor(x0 / BLOK) - 1, bxMax = Math.floor((x0 + bredde) / BLOK) + 1;
  const byMin = Math.floor(y0 / BLOK) - 1, byMax = Math.floor((y0 + hoejde) / BLOK) + 1;

  g.fillStyle = '#8A9490';
  g.fillRect(x0 - BLOK, y0 - BLOK, bredde + BLOK * 2, hoejde + BLOK * 2);

  for (let by = byMin; by <= byMax; by++) {
    for (let bx = bxMin; bx <= bxMax; bx++) {
      const ix = bx * BLOK + VEJBREDDE / 2, iy = by * BLOK + VEJBREDDE / 2;
      const indre = BLOK - VEJBREDDE;
      g.fillStyle = '#C9CFC2';
      g.fillRect(ix, iy, indre, indre);
      for (const b of hentBygninger(bx, by)) {
        g.fillStyle = b.farve;
        g.fillRect(b.x, b.y, b.w, b.h);
        g.lineWidth = 2;
        g.strokeStyle = '#17211F';
        g.strokeRect(b.x, b.y, b.w, b.h);
      }
    }
  }

  g.strokeStyle = '#FFFFFF';
  g.lineWidth = 3;
  g.setLineDash([16, 14]);
  for (let bx = bxMin; bx <= bxMax; bx++) {
    g.beginPath();
    g.moveTo(bx * BLOK, y0 - BLOK);
    g.lineTo(bx * BLOK, y0 + hoejde + BLOK * 2);
    g.stroke();
  }
  for (let by = byMin; by <= byMax; by++) {
    g.beginPath();
    g.moveTo(x0 - BLOK, by * BLOK);
    g.lineTo(x0 + bredde + BLOK * 2, by * BLOK);
    g.stroke();
  }
  g.setLineDash([]);

  g.fillStyle = '#F4F6F2';
  const stribeL = VEJBREDDE * 0.7;
  for (let bx = bxMin; bx <= bxMax; bx++) {
    for (let by = byMin; by <= byMax; by++) {
      const cx = bx * BLOK, cy = by * BLOK;
      g.fillRect(cx - stribeL / 2, cy - VEJBREDDE / 2 - 3, stribeL, 4);
      g.fillRect(cx - stribeL / 2, cy + VEJBREDDE / 2 - 1, stribeL, 4);
      g.fillRect(cx - VEJBREDDE / 2 - 3, cy - stribeL / 2, 4, stribeL);
      g.fillRect(cx + VEJBREDDE / 2 - 1, cy - stribeL / 2, 4, stribeL);
    }
  }
}
