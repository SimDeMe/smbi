import { tegnBy } from './verden.js';
import {
  nytSpillerBil, opdaterSpiller, tegnSpiller,
  nytTrafikSystem, opdaterTrafik, tjekTrafikKollision, tegnTrafik,
} from './biler.js';
import {
  nytFodgaengerSystem, opdaterFodgaengere, tjekFodgaengerKollision,
  ryddOpFodgaengere, tegnFodgaengere,
} from './personer.js';
import {
  nytCyklistSystem, opdaterCyklister, tjekCyklistKollision, tegnCyklister,
} from './cyklister.js';
import {
  nytMissionsSystem, vaelgNyMission, tjekMission,
  nytCheckpoint, tjekCheckpointNaaet, tegnCheckpoint,
} from './missioner.js';
import * as Butik from './butik.js';

const canvas = document.getElementById('scene');
const g = canvas.getContext('2d');

let tilstand = Butik.hentGemtTilstand();
let stats = Butik.beregnEffektiveStats(tilstand);
const bil = nytSpillerBil(stats);

const trafik = nytTrafikSystem();
const fodgaengere = nytFodgaengerSystem();
const cyklister = nytCyklistSystem();
const missioner = nytMissionsSystem();
let checkpoint = nytCheckpoint(bil.x, bil.y);

const frem = {
  distanceSidenUheld: 0, tidUdenUheld: 0, distanceDenneMission: 0,
  fartKmt: 0, checkpointNaaet: false,
};

const input = { op: false, ned: false, venstre: false, hoejre: false };
let butikAaben = false;
let skaermFlash = 0;
let gemTimer = 2;

// --- DOM ---------------------------------------------------------------

const elPoint = document.getElementById('point-tal');
const elFart = document.getElementById('fart-tal');
const elStatus = document.getElementById('status-tekst');
const elMissionNavn = document.getElementById('mission-navn');
const elMissionFremgang = document.getElementById('mission-fremgang');
const elPil = document.getElementById('checkpoint-pil');
const elFactBil = document.getElementById('facts-bil');
const elFactFart = document.getElementById('facts-fart');
const elFactHaandtering = document.getElementById('facts-haandtering');
const srStatus = document.getElementById('sr-status');

const dialogButik = document.getElementById('butik');
const btnButik = document.getElementById('btn-butik');
const btnLukButik = document.getElementById('btn-luk-butik');
const listeBiler = document.getElementById('biler-liste');
const listeOpgraderinger = document.getElementById('opgraderinger-liste');
const elSaldo = document.getElementById('saldo-tal');

function annoncer(tekst) { srStatus.textContent = tekst; }

// --- Butik ---------------------------------------------------------------

function tegnButikIndhold() {
  elSaldo.textContent = Math.round(tilstand.point);

  listeBiler.innerHTML = '';
  for (const b of Butik.BILER) {
    const ejes = tilstand.ejedeBiler.includes(b.id);
    const aktiv = tilstand.aktivBil === b.id;
    const li = document.createElement('li');
    li.className = 'butik-vare';
    const knapTekst = aktiv ? 'Valgt' : ejes ? 'Vælg' : b.pris + ' point';
    li.innerHTML =
      '<span class="vare-farve" style="--vc:' + b.farve + '"></span>' +
      '<span class="vare-navn">' + b.navn + '</span>' +
      '<span class="vare-stats mono">' + b.maxFart + ' km/t</span>' +
      '<button class="btn btn-mini" data-id="' + b.id + '">' + knapTekst + '</button>';
    const knap = li.querySelector('button');
    knap.disabled = aktiv || (!ejes && tilstand.point < b.pris);
    listeBiler.appendChild(li);
  }

  listeOpgraderinger.innerHTML = '';
  for (const o of Butik.OPGRADERINGER) {
    const niveau = tilstand.opgraderinger[o.id] || 0;
    const faerdig = niveau >= o.maxNiveau;
    const pris = faerdig ? null : o.prisPrNiveau[niveau];
    const li = document.createElement('li');
    li.className = 'butik-vare';
    li.innerHTML =
      '<span class="vare-navn">' + o.navn + ' <span class="mono">· niveau ' + niveau + '/' + o.maxNiveau + '</span></span>' +
      '<span class="vare-stats">' + o.beskrivelse + '</span>' +
      '<button class="btn btn-mini" data-id="' + o.id + '">' + (faerdig ? 'Fuldt opgraderet' : pris + ' point') + '</button>';
    const knap = li.querySelector('button');
    knap.disabled = faerdig || tilstand.point < pris;
    listeOpgraderinger.appendChild(li);
  }
}

function genberegnStats() {
  stats = Butik.beregnEffektiveStats(tilstand);
  bil.stats = stats;
}

listeBiler.addEventListener('click', (e) => {
  const knap = e.target.closest('button[data-id]');
  if (!knap) return;
  const id = knap.dataset.id;
  if (!tilstand.ejedeBiler.includes(id)) Butik.koebBil(tilstand, id);
  else Butik.vaelgBil(tilstand, id);
  genberegnStats();
  tegnButikIndhold();
  opdaterHud();
});

listeOpgraderinger.addEventListener('click', (e) => {
  const knap = e.target.closest('button[data-id]');
  if (!knap) return;
  Butik.koebOpgradering(tilstand, knap.dataset.id);
  genberegnStats();
  tegnButikIndhold();
  opdaterHud();
});

function aabnButik() {
  butikAaben = true;
  input.op = input.ned = input.venstre = input.hoejre = false;
  tegnButikIndhold();
  dialogButik.showModal();
  elStatus.textContent = 'I butikken';
}
function lukButik() {
  butikAaben = false;
  if (dialogButik.open) dialogButik.close();
  elStatus.textContent = 'Kører';
}
btnButik.addEventListener('click', aabnButik);
btnLukButik.addEventListener('click', lukButik);
dialogButik.addEventListener('close', () => { butikAaben = false; elStatus.textContent = 'Kører'; });

// --- Input ---------------------------------------------------------------

const TASTER = {
  ArrowUp: 'op', KeyW: 'op',
  ArrowDown: 'ned', KeyS: 'ned',
  ArrowLeft: 'venstre', KeyA: 'venstre',
  ArrowRight: 'hoejre', KeyD: 'hoejre',
};

window.addEventListener('keydown', (e) => {
  if (e.code === 'KeyB' && !e.repeat) { butikAaben ? lukButik() : aabnButik(); return; }
  if (e.code === 'Escape' && butikAaben) { lukButik(); return; }
  const felt = TASTER[e.code];
  if (felt) { input[felt] = true; e.preventDefault(); }
});
window.addEventListener('keyup', (e) => {
  const felt = TASTER[e.code];
  if (felt) input[felt] = false;
});

function bindTouchKnap(id, felt) {
  const el = document.getElementById(id);
  if (!el) return;
  const start = (e) => { e.preventDefault(); input[felt] = true; };
  const slut = () => { input[felt] = false; };
  el.addEventListener('pointerdown', start);
  el.addEventListener('pointerup', slut);
  el.addEventListener('pointercancel', slut);
  el.addEventListener('pointerleave', slut);
}
bindTouchKnap('btn-op', 'op');
bindTouchKnap('btn-ned', 'ned');
bindTouchKnap('btn-venstre', 'venstre');
bindTouchKnap('btn-hoejre', 'hoejre');

// --- Canvas-størrelse ------------------------------------------------------

function tilpasCanvas() {
  const dpr = window.devicePixelRatio || 1;
  const b = canvas.clientWidth, h = canvas.clientHeight;
  canvas.width = Math.round(b * dpr);
  canvas.height = Math.round(h * dpr);
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener('resize', tilpasCanvas);

// --- HUD ---------------------------------------------------------------

function opdaterHud() {
  elPoint.textContent = Math.round(tilstand.point);
  elFart.textContent = Math.round(Math.abs(bil.fart));
  elMissionNavn.textContent = missioner.aktiv.beskrivelse();
  elMissionFremgang.textContent = missioner.aktiv.fremgang(frem);
  const aktivBil = Butik.BILER.find(b => b.id === tilstand.aktivBil) || Butik.BILER[0];
  elFactBil.textContent = aktivBil.navn;
  elFactFart.textContent = Math.round(stats.maxFart);
  elFactHaandtering.textContent = Math.round(stats.haandtering * 100);

  const dx = checkpoint.x - bil.x, dy = checkpoint.y - bil.y;
  const vinkel = Math.atan2(dx, -dy);
  elPil.style.transform = 'rotate(' + vinkel + 'rad)';
}

// --- Spilløkke ---------------------------------------------------------------

function tegn() {
  const bredde = canvas.clientWidth, hoejde = canvas.clientHeight;
  g.clearRect(0, 0, bredde, hoejde);
  const kamera = { x: bil.x, y: bil.y };
  g.save();
  g.translate(bredde / 2 - kamera.x, hoejde / 2 - kamera.y);
  tegnBy(g, kamera, bredde, hoejde);
  tegnCheckpoint(g, checkpoint, performance.now() / 1000);
  tegnCyklister(g, cyklister);
  tegnFodgaengere(g, fodgaengere);
  tegnTrafik(g, trafik);
  tegnSpiller(g, bil, stats.farve);
  g.restore();

  if (skaermFlash > 0) {
    g.fillStyle = 'rgba(232,51,109,' + (skaermFlash * 0.4) + ')';
    g.fillRect(0, 0, bredde, hoejde);
  }
}

let sidst = performance.now();
function loop(nu) {
  let dt = (nu - sidst) / 1000;
  sidst = nu;
  dt = Math.min(dt, 0.05);
  skaermFlash = Math.max(0, skaermFlash - dt);

  if (!butikAaben && !document.hidden) {
    const { distance } = opdaterSpiller(bil, input, dt);
    opdaterTrafik(trafik, dt, bil.x, bil.y);
    opdaterCyklister(cyklister, dt, bil.x, bil.y);
    opdaterFodgaengere(fodgaengere, dt, bil.x, bil.y);
    ryddOpFodgaengere(fodgaengere, dt, bil.x, bil.y);

    tilstand.point += distance;
    frem.distanceSidenUheld += distance;
    frem.distanceDenneMission += distance;
    frem.tidUdenUheld += dt;
    frem.fartKmt = Math.abs(bil.fart);

    const trafikRamt = tjekTrafikKollision(trafik, bil);
    const fodgaengerRamt = tjekFodgaengerKollision(fodgaengere, bil);
    const cyklistRamt = tjekCyklistKollision(cyklister, bil);
    if (fodgaengerRamt || cyklistRamt) {
      tilstand.point = Math.max(0, tilstand.point - 50);
      frem.distanceSidenUheld = 0;
      frem.tidUdenUheld = 0;
      skaermFlash = 0.3;
      annoncer('Uheld: -50 point');
    } else if (trafikRamt) {
      skaermFlash = Math.max(skaermFlash, 0.2);
    }

    frem.checkpointNaaet = tjekCheckpointNaaet(checkpoint, bil);
    if (frem.checkpointNaaet) {
      tilstand.point += 150;
      checkpoint = nytCheckpoint(bil.x, bil.y);
      annoncer('Checkpoint nået: +150 point');
    }

    if (tjekMission(missioner, frem)) {
      const belønning = missioner.aktiv.belønning;
      tilstand.point += belønning;
      annoncer('Mission fuldført: ' + missioner.aktiv.navn + ', +' + belønning + ' point');
      vaelgNyMission(missioner);
      frem.distanceDenneMission = 0;
    }
    frem.checkpointNaaet = false;

    gemTimer -= dt;
    if (gemTimer <= 0) { Butik.gemTilstand(tilstand); gemTimer = 2; }
  }

  tegn();
  opdaterHud();
  requestAnimationFrame(loop);
}

window.addEventListener('pagehide', () => Butik.gemTilstand(tilstand));
document.addEventListener('visibilitychange', () => { if (document.hidden) Butik.gemTilstand(tilstand); });

tilpasCanvas();
opdaterHud();
requestAnimationFrame(loop);

// Iframe-krom: skjul topbjælke og bund, hvis siden lægges i en iframe.
(function () {
  try {
    if (window.top !== window.self) {
      document.getElementById('site-top')?.style.setProperty('display', 'none');
      document.querySelector('.foot')?.style.setProperty('display', 'none');
    }
  } catch { /* cross-origin iframe */ }
})();
