// Missioner og checkpoints. Hver mission har et mål og en tjek-funktion,
// der læser af den fælles fremgangs-tilstand, som side.js opdaterer hver frame.
import { tilfaeldigVejPunkt } from './verden.js';

export const MISSIONS_REGISTER = [
  {
    id: 'checkpoint', navn: 'Kør til checkpointet', belønning: 250,
    beskrivelse: () => 'Kør hen til det markerede checkpoint',
    tjek: (frem) => frem.checkpointNaaet,
    fremgang: () => '',
  },
  {
    id: 'afstand-sikkert', navn: 'Kør sikkert', belønning: 200,
    beskrivelse: () => 'Kør 350 m uden at ramme nogen',
    tjek: (frem) => frem.distanceSidenUheld >= 350,
    fremgang: (frem) => Math.min(350, Math.round(frem.distanceSidenUheld)) + ' / 350 m',
  },
  {
    id: 'fart', navn: 'Fuld fart', belønning: 180,
    beskrivelse: () => 'Nå en fart på 90 km/t',
    tjek: (frem) => frem.fartKmt >= 90,
    fremgang: (frem) => Math.min(90, Math.round(frem.fartKmt)) + ' / 90 km/t',
  },
  {
    id: 'tid-uden-uheld', navn: 'Rolig kørsel', belønning: 220,
    beskrivelse: () => 'Kør i 25 sekunder uden uheld',
    tjek: (frem) => frem.tidUdenUheld >= 25,
    fremgang: (frem) => Math.min(25, Math.round(frem.tidUdenUheld)) + ' / 25 sek.',
  },
  {
    id: 'langtur', navn: 'Langturschauffør', belønning: 300,
    beskrivelse: () => 'Kør 1000 m i alt til denne mission',
    tjek: (frem) => frem.distanceDenneMission >= 1000,
    fremgang: (frem) => Math.min(1000, Math.round(frem.distanceDenneMission)) + ' / 1000 m',
  },
];

export function nytMissionsSystem() {
  const foerste = MISSIONS_REGISTER[1];
  return { aktiv: foerste };
}

export function vaelgNyMission(sys) {
  const muligheder = MISSIONS_REGISTER.filter(m => m.id !== sys.aktiv.id);
  sys.aktiv = muligheder[(Math.random() * muligheder.length) | 0];
}

export function tjekMission(sys, frem) {
  return sys.aktiv.tjek(frem);
}

export function nytCheckpoint(spillerX, spillerY) {
  const p = tilfaeldigVejPunkt(spillerX, spillerY, 260, 520);
  return { x: p.x, y: p.y };
}

export function tjekCheckpointNaaet(checkpoint, spillerBil) {
  return Math.hypot(checkpoint.x - spillerBil.x, checkpoint.y - spillerBil.y) < 26;
}

export function tegnCheckpoint(g, checkpoint, t) {
  g.save();
  g.translate(checkpoint.x, checkpoint.y);
  const puls = 22 + Math.sin(t * 4) * 4;
  g.strokeStyle = '#FFB300';
  g.lineWidth = 4;
  g.beginPath();
  g.arc(0, 0, puls, 0, Math.PI * 2);
  g.stroke();
  g.fillStyle = '#17211F';
  g.fillRect(-2, -34, 4, 22);
  g.fillStyle = '#E8336D';
  g.beginPath();
  g.moveTo(2, -34);
  g.lineTo(20, -27);
  g.lineTo(2, -20);
  g.closePath();
  g.fill();
  g.restore();
}
