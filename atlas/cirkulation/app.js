// Global cirkulation: betjening, trin og animationsløkke.
import { lavGlobus, beskriv } from './globus.js';
import { lavSnit } from './snit.js';
import { TRIN } from './tekst.js';
import { maanedsnavn, retningsnavn, fraRetning, itkBredde, solbredde } from './model.js';

const $ = s => document.querySelector(s);
const roligt = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Tilstanden; rotation og kontinenter glider mod deres mål.
const tilstand = {
  maaned: 1, rotation: 1, kontinenter: 0, etiketter: true, pause: roligt,
  fremhaev: null, afspil: false, ballon: false,
  maal: { rotation: 1, kontinenter: 0 },
};
const hent = () => tilstand;

function meddel(tekst) { $('#meddelelse').textContent = tekst; }

function visFejl(tekst) {
  const f = $('#fejl'); f.hidden = false; f.textContent = tekst;
}

async function start() {
  if (!window.d3?.geoOrthographic || !window.topojson?.feature) throw new Error('Kortbiblioteket kunne ikke indlæses.');
  const svar = await fetch(new URL('../data/countries-110m.json', import.meta.url), { signal: AbortSignal.timeout(12000) });
  if (!svar.ok) throw new Error('Kortdata kunne ikke indlæses.');
  const topo = await svar.json();
  const land = window.topojson.feature(topo, topo.objects.countries);

  const globus = lavGlobus($('#globus'), land, hent);
  const snit = lavSnit($('#snit'), hent);
  const tilpas = () => { globus.tilpas(); snit.tilpas(); globus.rydSpor(); };
  new ResizeObserver(tilpas).observe($('#globus'));
  new ResizeObserver(() => snit.tilpas()).observe($('#snit'));
  tilpas();

  betjening(globus);
  trinvisning(globus);

  let sidst = performance.now(), tid = 0;
  function loekke(nu) {
    const dt = Math.min(0.05, (nu - sidst) / 1000); sidst = nu;
    if (!tilstand.pause) tid += dt;
    const glid = (navn, fart) => {
      const d = tilstand.maal[navn] - tilstand[navn];
      tilstand[navn] = Math.abs(d) < 0.01 ? tilstand.maal[navn] : tilstand[navn] + d * Math.min(1, dt * fart);
    };
    glid('rotation', roligt || tilstand.pause ? 99 : 1.6); glid('kontinenter', roligt || tilstand.pause ? 99 : 2);
    if (tilstand.afspil && !tilstand.pause) {
      let m = tilstand.maaned + dt * 0.9;
      if (m >= 13) m -= 12;
      saetMaaned(m, false);
    }
    globus.trin(tilstand.pause ? 0 : dt, tid);
    snit.trin(tilstand.pause ? 0 : dt);
    requestAnimationFrame(loekke);
  }
  requestAnimationFrame(loekke);
}

function saetMaaned(m, annoncer = true) {
  tilstand.maaned = m;
  const input = $('#maaned');
  if (Math.abs(+input.value - m) > 0.05) input.value = Math.min(12.9, m).toFixed(1);
  const navn = maanedsnavn(Math.floor(m));
  input.setAttribute('aria-valuetext', navn);
  $('#maanedsnavn').textContent = navn;
  if (annoncer) {
    const sol = solbredde(m), itk = itkBredde(m, 0, 0);
    meddel(`${navn}: solen står lodret over ${Math.abs(sol).toFixed(0)}° ${sol >= 0 ? 'nord' : 'syd'}; ITK ligger i gennemsnit ved ${Math.abs(itk).toFixed(0)}° ${itk >= 0 ? 'nord' : 'syd'}.`);
  }
}

// Kontakterne «Jorden drejer» og «Kontinenter»: trykket ind = slået til.
const knapFor = { rotation: '#rotation', kontinenter: '#kontinenter' };
function saet(navn, v) {
  tilstand.maal[navn] = v;
  $(knapFor[navn]).setAttribute('aria-pressed', String(!!v));
  if (navn === 'rotation') meddel(v ? 'Jorden drejer: vinden bøjes af, og der er tre celler på hver halvkugle.' : 'Jorden står stille: vinden går lige mod ITK, og der er kun én celle på hver halvkugle.');
  if (navn === 'kontinenter') meddel(v ? 'Kontinenter til: ITK flytter sig langt ind over land.' : 'Kontinenter fra: den symmetriske model.');
}

function betjening(globus) {
  for (const navn of Object.keys(knapFor)) {
    $(knapFor[navn]).addEventListener('click', () => saet(navn, tilstand.maal[navn] > 0.5 ? 0 : 1));
  }

  $('#maaned').addEventListener('input', e => { stopAfspil(); saetMaaned(+e.target.value); });

  const afspil = $('#afspil');
  function stopAfspil() { tilstand.afspil = false; afspil.setAttribute('aria-pressed', 'false'); afspil.firstChild.textContent = '▶ '; }
  afspil.addEventListener('click', () => {
    tilstand.afspil = !tilstand.afspil;
    afspil.setAttribute('aria-pressed', String(tilstand.afspil));
    afspil.firstChild.textContent = tilstand.afspil ? '❚❚ ' : '▶ ';
    if (tilstand.afspil && tilstand.pause) saetPause(false);
  });

  const pause = $('#pause');
  function saetPause(v) {
    tilstand.pause = v; pause.setAttribute('aria-pressed', String(v));
    pause.innerHTML = v ? '▶ <span>Fortsæt</span>' : '❚❚ <span>Pause</span>';
  }
  saetPause(tilstand.pause);
  pause.addEventListener('click', () => saetPause(!tilstand.pause));

  $('#etiketter').addEventListener('click', e => {
    tilstand.etiketter = !tilstand.etiketter; e.currentTarget.setAttribute('aria-pressed', String(tilstand.etiketter));
  });
  $('#fokus').addEventListener('click', e => {
    const v = document.body.classList.toggle('fokus'); e.currentTarget.setAttribute('aria-pressed', String(v));
  });

  const ballon = $('#ballon');
  ballon.addEventListener('click', () => {
    tilstand.ballon = !tilstand.ballon;
    ballon.setAttribute('aria-pressed', String(tilstand.ballon));
    $('#ballontip').hidden = !tilstand.ballon;
    $('.globusfelt').classList.toggle('ballonmode', tilstand.ballon);
    if (tilstand.ballon) {
      const [lon, lat] = globus.centrum;
      globus.slipBallon(lon, lat);
      meddel('En ballon er sluppet midt på globussen. Klik et andet sted for at slippe flere.');
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
    aflaes(globus, ...p);
  });
  c.addEventListener('pointerup', e => {
    if (traek && traek.flyttet < 6) {
      const p = globus.aflaes(...pos(e));
      if (p && tilstand.ballon) { globus.slipBallon(p[0], p[1]); meddel('Ballon sluppet.'); }
      else if (p) aflaes(globus, ...pos(e), true);
    }
    traek = null;
  });
  c.addEventListener('pointercancel', () => { traek = null; });
  c.addEventListener('keydown', e => {
    const t = { ArrowLeft: [-10, 0], ArrowRight: [10, 0], ArrowUp: [0, 8], ArrowDown: [0, -8] }[e.key];
    if (t) { e.preventDefault(); globus.drej(t[0], t[1]); aflaesMidt(globus); }
    if ((e.key === 'Enter' || e.key === ' ') && tilstand.ballon) {
      e.preventDefault(); const [lon, lat] = globus.centrum; globus.slipBallon(lon, lat); meddel('Ballon sluppet midt på globussen.');
    }
  });
  c.addEventListener('focus', () => aflaesMidt(globus));
}

function tekstFor(lon, lat) {
  const d = beskriv(lon, lat, tilstand);
  const sted = `${Math.abs(lat).toFixed(0)}° ${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lon).toFixed(0)}° ${lon >= 0 ? 'Ø' : 'V'}`;
  const vind = d.fart < 1.2 ? 'næsten stille' : `fra ${retningsnavn(fraRetning(d.w))}`;
  return { sted, navn: d.navn, vind };
}
function aflaes(globus, x, y, annoncer = false) {
  const p = globus.aflaes(x, y);
  if (!p) return;
  const t = tekstFor(p[0], p[1]);
  $('#aflaesning').innerHTML = `${t.sted} · <b>${t.navn}</b> · ${t.vind}`;
  if (annoncer) meddel(`${t.sted}: ${t.navn}, ${t.vind}.`);
}
function aflaesMidt(globus) {
  const [lon, lat] = globus.centrum;
  const t = tekstFor(lon, lat);
  $('#aflaesning').innerHTML = `Midt på: ${t.sted} · <b>${t.navn}</b> · ${t.vind}`;
  meddel(`Midt på globussen, ${t.sted}: ${t.navn}, ${t.vind}.`);
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
    if (t.saet) {
      for (const navn of ['rotation', 'kontinenter']) if (navn in t.saet) saet(navn, t.saet[navn]);
      if ('maaned' in t.saet) saetMaaned(t.saet.maaned, false);
    }
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
