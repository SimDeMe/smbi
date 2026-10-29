// Havstrømme: betjening, trin og animationsløkke (bygget som cirkulationsmodellens app.js).
import { lavGlobus, beskriv } from './globus.js';
import { hentHavtemperatur, KLASSER } from './havtemperatur.js';
import { TRIN } from './tekst.js';
import { lavFelt } from './model.js';

const $ = s => document.querySelector(s);
const roligt = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const tilstand = {
  vind: false, hvirvler: false, baand: false, havtemp: false, etiketter: true, pause: roligt,
  fremhaev: [], flaske: false, sst: null,
};
const hent = () => tilstand;
const KONTAKTER = ['vind', 'hvirvler', 'baand', 'havtemp', 'etiketter'];
const BESKED = {
  vind: ['Vindpilene vises: passat mod vest ved ækvator, vestenvind mod øst længere mod polerne.', 'Vindpilene er skjult.'],
  hvirvler: ['Hvirvlerne vises: med uret på den nordlige halvkugle, mod uret på den sydlige.', 'Hvirvlerne er skjult.'],
  baand: ['Transportbåndet vises: varm overfladegren mod Nordatlanten, kold dybgren tilbage.', 'Transportbåndet er skjult.'],
  havtemp: ['Havtemperaturen vises: målt årsmiddel 1991–2020, fra under 2 °C ved polerne til over 29 °C i troperne.', 'Havtemperaturen er skjult.'],
  etiketter: ['Navnene vises.', 'Navnene er skjult.'],
};

function meddel(tekst) { $('#meddelelse').textContent = tekst; }
function visFejl(tekst) { const f = $('#fejl'); f.hidden = false; f.textContent = tekst; }

// Landmasken: landene tegnes ækvidistant på et 360×180-lærred, én pixel pr. grad.
function landmaske(land) {
  const c = document.createElement('canvas'); c.width = 360; c.height = 180;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  const proj = window.d3.geoEquirectangular().scale(180 / Math.PI).translate([180, 90]);
  ctx.beginPath(); window.d3.geoPath(proj, ctx)(land); ctx.fill();
  const data = ctx.getImageData(0, 0, 360, 180).data;
  return (lon, lat) => {
    const i = Math.min(359, Math.max(0, Math.floor(lon + 180))), j = Math.min(179, Math.max(0, Math.floor(90 - lat)));
    return data[(j * 360 + i) * 4 + 3] > 127;
  };
}

async function start() {
  if (!window.d3?.geoOrthographic || !window.topojson?.feature) throw new Error('Kortbiblioteket kunne ikke indlæses.');
  const svar = await fetch(new URL('../data/countries-110m.json', import.meta.url), { signal: AbortSignal.timeout(12000) });
  if (!svar.ok) throw new Error('Kortdata kunne ikke indlæses.');
  const topo = await svar.json();
  const land = window.topojson.feature(topo, topo.objects.countries);
  const felt = lavFelt(landmaske(land));

  const globus = lavGlobus($('#globus'), land, felt, hent);
  const tilpas = () => { globus.tilpas(); globus.rydSpor(); };
  new ResizeObserver(tilpas).observe($('#globus'));
  tilpas();

  // Havtemperaturen hentes i baggrunden; uden den virker resten af modellen.
  hentHavtemperatur().then(sst => { tilstand.sst = sst; }).catch(() => {
    const k = $('#havtemp'); k.disabled = true; k.title = 'Havtemperaturen kunne ikke hentes';
    if (tilstand.havtemp) saet('havtemp', false, false);
  });

  betjening(globus, felt);
  trinvisning(globus);

  let sidst = performance.now(), tid = 0;
  function loekke(nu) {
    const dt = Math.min(0.05, (nu - sidst) / 1000); sidst = nu;
    if (!tilstand.pause) tid += dt;
    globus.trin(tilstand.pause ? 0 : dt, tid);
    requestAnimationFrame(loekke);
  }
  requestAnimationFrame(loekke);
}

function saet(navn, v, annoncer = true) {
  if ($('#' + navn).disabled) v = false; // Fx havtemperatur, der ikke kunne hentes.
  tilstand[navn] = v;
  $('#' + navn).setAttribute('aria-pressed', String(v));
  const signatur = $('.signatur');
  signatur.classList.toggle('med-vind', tilstand.vind);
  signatur.classList.toggle('med-baand', tilstand.baand);
  signatur.classList.toggle('med-temp', tilstand.havtemp);
  if (annoncer) meddel(BESKED[navn][v ? 0 : 1]);
}

function betjening(globus, felt) {
  // Farveskalaen i signaturen: et felt pr. klasse med grænsen som tooltip.
  const skala = $('#tempskala');
  KLASSER.forEach((k, i) => {
    const b = document.createElement('b'); b.style.background = k.farve;
    b.title = i === KLASSER.length - 1 ? `over ${k.fra} °C` : `${k.fra}–${KLASSER[i + 1].fra} °C`;
    skala.append(b);
  });
  for (const navn of KONTAKTER) $('#' + navn).addEventListener('click', () => saet(navn, !tilstand[navn]));

  const pause = $('#pause');
  function saetPause(v) {
    tilstand.pause = v; pause.setAttribute('aria-pressed', String(v));
    pause.innerHTML = v ? '▶ <span>Fortsæt</span>' : '❚❚ <span>Pause</span>';
  }
  saetPause(tilstand.pause);
  pause.addEventListener('click', () => saetPause(!tilstand.pause));

  $('#fokus').addEventListener('click', e => {
    const v = document.body.classList.toggle('fokus'); e.currentTarget.setAttribute('aria-pressed', String(v));
  });
  $('#om').addEventListener('click', () => $('#om-dialog').showModal());

  const slip = (lon, lat, hvor) => {
    if (globus.slipFlaske(lon, lat)) meddel(`Flaskepost sluppet ${hvor}.`);
    else meddel('Det er land – slip flaskeposten i havet.');
  };
  const flaske = $('#flaske');
  flaske.addEventListener('click', () => {
    tilstand.flaske = !tilstand.flaske;
    flaske.setAttribute('aria-pressed', String(tilstand.flaske));
    $('#flasketip').hidden = !tilstand.flaske;
    $('.globusfelt').classList.toggle('ballonmode', tilstand.flaske);
    if (tilstand.flaske) {
      const [lon, lat] = globus.centrum;
      if (!felt.erLand(lon, lat)) slip(lon, lat, 'midt på globussen');
      else meddel('Klik på havet for at slippe en flaskepost.');
    }
  });

  // Træk, klik og aflæsning.
  const c = $('#globus');
  let traek = null;
  const pos = e => { const r = c.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  c.addEventListener('pointerdown', e => { c.setPointerCapture(e.pointerId); traek = { p: pos(e), flyttet: 0 }; });
  c.addEventListener('pointermove', e => {
    const p = pos(e);
    if (traek) {
      const dx = p[0] - traek.p[0], dy = p[1] - traek.p[1];
      traek.flyttet += Math.abs(dx) + Math.abs(dy);
      const k = 160 / Math.max(120, c.clientHeight);
      globus.drej(-dx * k * 0.6, dy * k * 0.6);
      traek.p = p;
    }
    aflaes(globus, felt, ...p);
  });
  c.addEventListener('pointerup', e => {
    if (traek && traek.flyttet < 6) {
      const p = globus.aflaes(...pos(e));
      if (p && tilstand.flaske) slip(p[0], p[1], 'her');
      else if (p) aflaes(globus, felt, ...pos(e), true);
    }
    traek = null;
  });
  c.addEventListener('pointercancel', () => { traek = null; });
  c.addEventListener('keydown', e => {
    const t = { ArrowLeft: [-10, 0], ArrowRight: [10, 0], ArrowUp: [0, 8], ArrowDown: [0, -8] }[e.key];
    if (t) { e.preventDefault(); globus.drej(t[0], t[1]); aflaesMidt(globus, felt); }
    if ((e.key === 'Enter' || e.key === ' ') && tilstand.flaske) {
      e.preventDefault(); const [lon, lat] = globus.centrum; slip(lon, lat, 'midt på globussen');
    }
  });
  c.addEventListener('focus', () => aflaesMidt(globus, felt));
}

function tekstFor(felt, lon, lat) {
  const d = beskriv(lon, lat, felt);
  const t = tilstand.sst?.temperatur(lon, lat);
  if (t != null && d.navn !== 'Land') d.tekst = `${d.tekst} · ${t.toLocaleString('da-DK', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} °C`;
  const sted = `${Math.abs(lat).toFixed(0)}° ${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lon).toFixed(0)}° ${lon >= 0 ? 'Ø' : 'V'}`;
  return { sted, ...d };
}
const linje = t => `${t.sted} · <b>${t.navn}</b>${t.tekst ? ' · ' + t.tekst : ''}`;
function aflaes(globus, felt, x, y, annoncer = false) {
  const p = globus.aflaes(x, y);
  if (!p) return;
  const t = tekstFor(felt, ...p);
  $('#aflaesning').innerHTML = linje(t);
  if (annoncer) meddel(`${t.sted}: ${t.navn}${t.tekst ? ', ' + t.tekst : ''}.`);
}
function aflaesMidt(globus, felt) {
  const t = tekstFor(felt, ...globus.centrum);
  $('#aflaesning').innerHTML = 'Midt på: ' + linje(t);
  meddel(`Midt på globussen, ${t.sted}: ${t.navn}${t.tekst ? ', ' + t.tekst : ''}.`);
}

function trinvisning(globus) {
  let nr = 0;
  const prikker = $('#prikker');
  TRIN.forEach((t, i) => {
    const b = document.createElement('button');
    b.textContent = i + 1; b.setAttribute('aria-label', `Trin ${i + 1}: ${t.titel}`);
    b.addEventListener('click', () => vis(i));
    prikker.append(b);
  });
  function vis(i) {
    nr = Math.max(0, Math.min(TRIN.length - 1, i));
    const t = TRIN[nr];
    $('#trin-nr').textContent = `${nr + 1} / ${TRIN.length}`;
    $('#trin-titel').textContent = t.titel;
    $('#trin-tekst').textContent = t.tekst;
    $('#trin-proev').textContent = t.proev;
    [...prikker.children].forEach((b, j) => { if (j === nr) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); });
    $('#forrige').disabled = nr === 0;
    $('#naeste').disabled = nr === TRIN.length - 1;
    tilstand.fremhaev = t.fremhaev;
    if (t.saet) for (const [navn, v] of Object.entries(t.saet)) saet(navn, v, false);
    globus.flyvTil(...t.fokus);
  }
  $('#forrige').addEventListener('click', () => vis(nr - 1));
  $('#naeste').addEventListener('click', () => vis(nr + 1));
  vis(0);
}

start().catch(fejl => {
  visFejl(`${fejl.message} Prøv at genindlæse siden. Forklaringen til højre virker stadig.`);
  try { trinvisning({ flyvTil() {} }); } catch { /* intet */ }
});
