// Fodgængere: patruljerer et fortovsstykke om en blok og krydser af og til
// vejen til nabo-blokken — det er dér, de kan blive ramt.
import { BLOK, VEJBREDDE, FORTOV } from './verden.js';

const ANTAL = 16;
const SPAWN_R = 560, DESPAWN_R = 720;
const RADIUS = 7;
const GANGFART = 14; // units/s
const KRYDS_CHANCE = 0.12; // pr. sekund

const NABO = [
  { dbx: 0, dby: -1, spejlEdge: 2 },
  { dbx: 1, dby: 0, spejlEdge: 3 },
  { dbx: 0, dby: 1, spejlEdge: 0 },
  { dbx: -1, dby: 0, spejlEdge: 1 },
];

function edgeEndepunkter(bx, by, edge) {
  const ix = bx * BLOK + VEJBREDDE / 2, iy = by * BLOK + VEJBREDDE / 2;
  const indre = BLOK - VEJBREDDE;
  const wx = ix + FORTOV / 2, wy = iy + FORTOV / 2, ws = indre - FORTOV;
  switch (edge) {
    case 0: return [{ x: wx, y: wy }, { x: wx + ws, y: wy }];
    case 1: return [{ x: wx + ws, y: wy }, { x: wx + ws, y: wy + ws }];
    case 2: return [{ x: wx + ws, y: wy + ws }, { x: wx, y: wy + ws }];
    default: return [{ x: wx, y: wy + ws }, { x: wx, y: wy }];
  }
}

function edgePunkt(bx, by, edge, t) {
  const [a, b] = edgeEndepunkter(bx, by, edge);
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

function nyPerson(cx, cy) {
  const bx = Math.round(cx / BLOK) + ((Math.random() * 6) | 0) - 3;
  const by = Math.round(cy / BLOK) + ((Math.random() * 6) | 0) - 3;
  const edge = (Math.random() * 4) | 0;
  const t = Math.random();
  const pos = edgePunkt(bx, by, edge, t);
  return {
    bx, by, edge, t, dir: Math.random() < 0.5 ? 1 : -1,
    tilstand: 'gaar', krydsT: 0, krydsVarighed: 1, krydsFra: null, krydsTil: null,
    x: pos.x, y: pos.y,
  };
}

export function nytFodgaengerSystem() {
  return { personer: [] };
}

export function opdaterFodgaengere(sys, dt, spillerX, spillerY) {
  while (sys.personer.length < ANTAL) sys.personer.push(nyPerson(spillerX, spillerY));

  for (const p of sys.personer) {
    if (p.tilstand === 'gaar') {
      const [a, b] = edgeEndepunkter(p.bx, p.by, p.edge);
      const laengde = Math.hypot(b.x - a.x, b.y - a.y) || 1;
      p.t += (p.dir * GANGFART * dt) / laengde;
      if (p.t > 1) { p.t = 1; p.dir = -1; }
      if (p.t < 0) { p.t = 0; p.dir = 1; }
      const pos = edgePunkt(p.bx, p.by, p.edge, p.t);
      p.x = pos.x; p.y = pos.y;

      if (Math.random() < KRYDS_CHANCE * dt) {
        const n = NABO[p.edge];
        p.krydsFra = pos;
        p.krydsTil = edgePunkt(p.bx + n.dbx, p.by + n.dby, n.spejlEdge, p.t);
        const afstand = Math.hypot(p.krydsTil.x - p.krydsFra.x, p.krydsTil.y - p.krydsFra.y);
        p.krydsVarighed = afstand / GANGFART;
        p.krydsT = 0;
        p.tilstand = 'kryds';
      }
    } else {
      p.krydsT += dt / p.krydsVarighed;
      if (p.krydsT >= 1) {
        const n = NABO[p.edge];
        p.bx += n.dbx; p.by += n.dby; p.edge = n.spejlEdge;
        p.dir = Math.random() < 0.5 ? 1 : -1;
        p.tilstand = 'gaar';
        const pos = edgePunkt(p.bx, p.by, p.edge, p.t);
        p.x = pos.x; p.y = pos.y;
      } else {
        p.x = p.krydsFra.x + (p.krydsTil.x - p.krydsFra.x) * p.krydsT;
        p.y = p.krydsFra.y + (p.krydsTil.y - p.krydsFra.y) * p.krydsT;
      }
    }
  }

  for (let i = sys.personer.length - 1; i >= 0; i--) {
    const p = sys.personer[i];
    if (Math.hypot(p.x - spillerX, p.y - spillerY) > DESPAWN_R) {
      sys.personer.splice(i, 1, nyPerson(spillerX, spillerY));
    }
  }
}

export function tjekFodgaengerKollision(sys, spillerBil) {
  for (const p of sys.personer) {
    if (p.paavirket) continue;
    const dist = Math.hypot(p.x - spillerBil.x, p.y - spillerBil.y);
    if (dist < RADIUS + 11) {
      p.paavirket = true;
      p.genstartTid = 1.2;
      return true;
    }
  }
  return false;
}

export function ryddOpFodgaengere(sys, dt, spillerX, spillerY) {
  for (const p of sys.personer) {
    if (p.paavirket) {
      p.genstartTid -= dt;
      if (p.genstartTid <= 0) {
        const ny = nyPerson(spillerX, spillerY);
        Object.assign(p, ny);
      }
    }
  }
}

export function tegnFodgaengere(g, sys) {
  for (const p of sys.personer) {
    g.beginPath();
    g.fillStyle = p.paavirket ? '#FF6A3D' : '#17211F';
    g.arc(p.x, p.y, RADIUS, 0, Math.PI * 2);
    g.fill();
  }
}
