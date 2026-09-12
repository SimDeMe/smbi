// Cyklister: kører i vejens yderste kant, langsommere og federe at ramme
// end en bilist, men stadig minuspoint hvis det sker.
import { BLOK, VEJBREDDE } from './verden.js';

const ANTAL = 8;
const SPAWN_R = 560, DESPAWN_R = 720;
const RADIUS = 8;
const KANT = VEJBREDDE / 2 - 7;

function tilfaeldigCykelPunkt(cx, cy) {
  const vinkel = Math.random() * Math.PI * 2;
  const r = SPAWN_R * 0.35 + Math.random() * (SPAWN_R * 0.65);
  const maalX = cx + Math.cos(vinkel) * r;
  const maalY = cy + Math.sin(vinkel) * r;
  const vandret = Math.random() < 0.5;
  const retning = Math.random() < 0.5 ? 1 : -1;
  if (vandret) {
    const by = Math.round(maalY / BLOK);
    return { x: maalX, y: by * BLOK + retning * KANT, vandret: true, retning };
  }
  const bx = Math.round(maalX / BLOK);
  return { x: bx * BLOK - retning * KANT, y: maalY, vandret: false, retning };
}

function nyCyklist(cx, cy) {
  const p = tilfaeldigCykelPunkt(cx, cy);
  return { ...p, fart: 14 + Math.random() * 8, paavirket: false, genstartTid: 0 };
}

export function nytCyklistSystem() {
  return { cyklister: [] };
}

export function opdaterCyklister(sys, dt, spillerX, spillerY) {
  while (sys.cyklister.length < ANTAL) sys.cyklister.push(nyCyklist(spillerX, spillerY));

  for (const c of sys.cyklister) {
    if (c.paavirket) {
      c.genstartTid -= dt;
      if (c.genstartTid <= 0) Object.assign(c, nyCyklist(spillerX, spillerY));
      continue;
    }
    const d = c.fart * dt * c.retning;
    if (c.vandret) c.x += d; else c.y += d;
  }

  for (let i = sys.cyklister.length - 1; i >= 0; i--) {
    const c = sys.cyklister[i];
    if (Math.hypot(c.x - spillerX, c.y - spillerY) > DESPAWN_R) {
      sys.cyklister.splice(i, 1, nyCyklist(spillerX, spillerY));
    }
  }
}

export function tjekCyklistKollision(sys, spillerBil) {
  for (const c of sys.cyklister) {
    if (c.paavirket) continue;
    const dist = Math.hypot(c.x - spillerBil.x, c.y - spillerBil.y);
    if (dist < RADIUS + 11) {
      c.paavirket = true;
      c.genstartTid = 1.4;
      return true;
    }
  }
  return false;
}

export function tegnCyklister(g, sys) {
  for (const c of sys.cyklister) {
    if (c.paavirket) continue;
    g.save();
    g.translate(c.x, c.y);
    const vinkel = c.vandret ? (c.retning > 0 ? Math.PI / 2 : -Math.PI / 2) : (c.retning > 0 ? Math.PI : 0);
    g.rotate(vinkel);
    g.strokeStyle = '#17211F';
    g.lineWidth = 2;
    g.beginPath();
    g.arc(-4, 4, 4, 0, Math.PI * 2);
    g.arc(4, 4, 4, 0, Math.PI * 2);
    g.stroke();
    g.beginPath();
    g.moveTo(-4, 4); g.lineTo(0, -3); g.lineTo(4, 4);
    g.moveTo(0, -3); g.lineTo(0, -8);
    g.stroke();
    g.fillStyle = '#FFB300';
    g.beginPath();
    g.arc(0, -10, 3, 0, Math.PI * 2);
    g.fill();
    g.restore();
  }
}
