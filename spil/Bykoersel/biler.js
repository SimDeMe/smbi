// Spillerbilens fysik og de andre biler i trafikken.
import { BLOK, VEJBREDDE, loesKollision, tilfaeldigVejPunkt } from './verden.js';

const BIL_RADIUS = 11;
const SVING_REF_FART = 55; // km/t hvor fuld sving-effekt er nået
const BREMSE_BASIS = 95;   // km/t/s
const NATURLIG_BREMSNING = 22; // km/t/s uden gas eller bremse
const BAKKE_MAX = -35;     // km/t

export function nytSpillerBil(stats) {
  return {
    x: 0, y: 0, vinkel: 0, fart: 0,
    stats,
    skadeTimer: 0,
  };
}

export function opdaterSpiller(bil, input, dt) {
  const maxFartUnits = bil.stats.maxFart;
  const accelUnits = bil.stats.accel;
  const drejRate = 2.5 * bil.stats.haandtering;
  const bremseUnits = BREMSE_BASIS * bil.stats.bremseEffekt;

  if (input.op) bil.fart += accelUnits * dt;
  else if (input.ned) bil.fart -= bremseUnits * dt;
  else {
    const fortegn = Math.sign(bil.fart);
    bil.fart -= fortegn * NATURLIG_BREMSNING * dt;
    if (Math.sign(bil.fart) !== fortegn) bil.fart = 0;
  }
  bil.fart = Math.max(BAKKE_MAX, Math.min(maxFartUnits, bil.fart));

  const fartFaktor = Math.min(Math.abs(bil.fart) / SVING_REF_FART, 1);
  const drejRetning = bil.fart < 0 ? -1 : 1;
  if (input.venstre) bil.vinkel -= drejRate * fartFaktor * drejRetning * dt;
  if (input.hoejre) bil.vinkel += drejRate * fartFaktor * drejRetning * dt;

  const fartUnitsPerSec = (bil.fart / 3.6);
  const dx = Math.sin(bil.vinkel) * fartUnitsPerSec * dt;
  const dy = -Math.cos(bil.vinkel) * fartUnitsPerSec * dt;
  bil.x += dx;
  bil.y += dy;

  const ramt = loesKollision(bil, BIL_RADIUS);
  if (ramt) {
    bil.fart *= -0.25;
    bil.skadeTimer = 0.35;
  }
  if (bil.skadeTimer > 0) bil.skadeTimer -= dt;

  const distance = Math.abs(fartUnitsPerSec * dt);
  return { distance, ramtBygning: ramt };
}

export function tegnSpiller(g, bil, farve) {
  g.save();
  g.translate(bil.x, bil.y);
  g.rotate(bil.vinkel);
  if (bil.skadeTimer > 0) g.globalAlpha = 0.6 + 0.4 * Math.sin(bil.skadeTimer * 60);
  g.fillStyle = farve;
  g.strokeStyle = '#17211F';
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(0, -16);
  g.lineTo(9, 10);
  g.lineTo(6, 14);
  g.lineTo(-6, 14);
  g.lineTo(-9, 10);
  g.closePath();
  g.fill();
  g.stroke();
  g.fillStyle = '#BFE9FF';
  g.fillRect(-6, -8, 12, 10);
  g.restore();
}

// --- Trafik -----------------------------------------------------------

const TRAFIK_ANTAL = 14;
const SPAWN_R = 620, DESPAWN_R = 780;
const TRAFIK_RADIUS = 12;
const TRAFIK_FARVER = ['#0E86C8', '#7A4FD6', '#FF6A3D', '#0FA593', '#566B68'];

export function nytTrafikSystem() {
  return { biler: [] };
}

function nyTrafikBil(cx, cy) {
  const p = tilfaeldigVejPunkt(cx, cy, SPAWN_R * 0.4, SPAWN_R);
  const fart = 35 + Math.random() * 30;
  return {
    x: p.x, y: p.y, vandret: p.vandret, retning: p.retning, fart,
    farve: TRAFIK_FARVER[(Math.random() * TRAFIK_FARVER.length) | 0],
  };
}

export function opdaterTrafik(sys, dt, spillerX, spillerY) {
  while (sys.biler.length < TRAFIK_ANTAL) sys.biler.push(nyTrafikBil(spillerX, spillerY));

  for (const b of sys.biler) {
    const d = (b.fart / 3.6) * dt * b.retning;
    if (b.vandret) b.x += d; else b.y += d;
  }

  for (let i = sys.biler.length - 1; i >= 0; i--) {
    const b = sys.biler[i];
    const dist = Math.hypot(b.x - spillerX, b.y - spillerY);
    if (dist > DESPAWN_R) sys.biler.splice(i, 1, nyTrafikBil(spillerX, spillerY));
  }
}

export function tjekTrafikKollision(sys, spillerBil) {
  for (const b of sys.biler) {
    const dist = Math.hypot(b.x - spillerBil.x, b.y - spillerBil.y);
    if (dist < BIL_RADIUS + TRAFIK_RADIUS) {
      const dx = spillerBil.x - b.x, dy = spillerBil.y - b.y;
      const n = Math.max(dist, 0.001);
      spillerBil.x += (dx / n) * 3;
      spillerBil.y += (dy / n) * 3;
      spillerBil.fart *= -0.3;
      spillerBil.skadeTimer = 0.35;
      return true;
    }
  }
  return false;
}

export function tegnTrafik(g, sys) {
  for (const b of sys.biler) {
    g.save();
    g.translate(b.x, b.y);
    const vinkel = b.vandret ? (b.retning > 0 ? Math.PI / 2 : -Math.PI / 2) : (b.retning > 0 ? Math.PI : 0);
    g.rotate(vinkel);
    g.fillStyle = b.farve;
    g.strokeStyle = '#17211F';
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(0, -15);
    g.lineTo(8, 9);
    g.lineTo(5, 13);
    g.lineTo(-5, 13);
    g.lineTo(-8, 9);
    g.closePath();
    g.fill();
    g.stroke();
    g.restore();
  }
}

export { BIL_RADIUS };
