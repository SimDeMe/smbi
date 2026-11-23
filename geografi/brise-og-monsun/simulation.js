import { DOEGN, AAR, periodisk, tilstand } from './model.mjs';
import { lavOpgaver } from './opgaver.js';

const $ = id => document.getElementById(id);
const laerred = $('luft');
const pensel = laerred.getContext('2d');
const reduceret = matchMedia('(prefers-reduced-motion: reduce)');
const svgNS = 'http://www.w3.org/2000/svg';
const serier = { brise: periodisk(DOEGN), monsun: periodisk(AAR) };
const MAANEDER = ['januar','februar','marts','april','maj','juni','juli','august','september','oktober','november','december'];

// tid: brise i timer efter kl. 6, monsun i måneder efter 1. januar.
// loeb: tiden løber automatisk frem til 'til' (timer eller måneder pr. sekund).
const trin = [
  { navn: 'Land og hav opvarmes', scene: 'brise', tid: 0, loeb: { til: 8, fart: 1.3 },
    kaede: 'SOLEN → LAND OG HAV', spoergsmaal: 'Hvorfor bliver land varmere end hav om dagen?',
    tekst: 'Land og hav får lige meget solenergi. Men vand har høj specifik varmekapacitet: 1 kg vand skal have ca. fem gange så meget energi som 1 kg tørt sand for at blive 1 °C varmere. Desuden opvarmes kun et tyndt lag på land, mens havet blander varmen ned i dybden.',
    naeste: 'Luften over land', hint: 'Se, hvilken kurve der stiger hurtigst.',
    beskrivelse: 'En kyst med hav til venstre og land til højre. Solen står op og opvarmer begge. Grafen viser, at landets temperatur stiger hurtigt, mens havets næsten ikke ændrer sig.' },
  { navn: 'Luften udvider sig', scene: 'brise', tid: 8, isobarer: 1, opstigning: true,
    kaede: 'VARMT LAND → VARM LUFT → UDVIDELSE', spoergsmaal: 'Hvad sker der med luften over det varme land?',
    tekst: 'Luften over land opvarmes nedefra og udvider sig. Trykfladerne løftes over land. Højt oppe er trykket derfor højere over land end over havet i samme højde.',
    naeste: 'Vinden begynder',
    beskrivelse: 'Varm luft stiger op over land. Stiplede trykflader buer opad over land, mest højt oppe. Højt over land er der højtryk, højt over havet lavtryk. Ved jorden er trykket endnu ens.' },
  { navn: 'Søbrise', scene: 'brise', tid: 8, isobarer: 2, celle: true, foelg: true,
    kaede: 'HØJT OPPE: LAND → HAV · VED JORDEN: HAV → LAND', spoergsmaal: 'Hvorfor blæser det ind fra havet om eftermiddagen?',
    tekst: 'Højt oppe strømmer luft fra land ud over havet. Så falder trykket ved jorden over land (lavtryk) og stiger over havet (højtryk). Ved jorden blæser det fra højtryk mod lavtryk: søbrisen. Luften stiger over land og synker over havet.',
    naeste: 'Når solen går ned',
    beskrivelse: 'En lukket cirkulation: ved jorden blæser søbrisen fra havet ind over land, luften stiger over land, strømmer ud over havet højt oppe og synker over havet. Lavtryk ved jorden over land, højtryk over havet.' },
  { navn: 'Landbrise', scene: 'brise', tid: 22, isobarer: 2, celle: true, foelg: true,
    kaede: 'NAT: KOLDT LAND → HØJTRYK OVER LAND → LANDBRISE', spoergsmaal: 'Hvorfor vender vinden om natten?',
    tekst: 'Om natten udstråler både land og hav varme. Land har lav specifik varmekapacitet og kun et tyndt varmt lag, så det køler hurtigt af og bliver koldere end havet. Nu er der højtryk ved jorden over land og lavtryk over havet, så det blæser fra land ud mod havet. Landbrisen er svagere, fordi temperaturforskellen er mindre.',
    naeste: 'Samme princip i stor skala',
    beskrivelse: 'Nat ved kysten. Landet er koldere end havet. En lavere og svagere cirkulation går den modsatte vej: ved jorden blæser landbrisen fra land ud over havet.' },
  { navn: 'Sommermonsun', scene: 'monsun', tid: 6.5, celle: true, foelg: true,
    kaede: 'VARMT KONTINENT → LAVTRYK → FUGTIG VIND FRA HAVET', spoergsmaal: 'Hvorfor regner det så meget i Indien om sommeren?',
    tekst: 'Om sommeren bliver det asiatiske kontinent meget varmere end Det Indiske Ocean. Over land dannes et stort termisk lavtryk, og fugtig luft strømmer ind fra havet fra sydvest. Luften stiger, afkøles og kondenserer til kraftig regn. Kondensationen frigiver varme, så luften stiger endnu mere.',
    naeste: 'Vinterhalvåret',
    beskrivelse: 'Snit fra Det Indiske Ocean i syd over Indien til Himalaya i nord, om sommeren. Fugtig luft strømmer fra havet ind over land, stiger op mod bjergene og danner skyer og kraftig regn. Lavtryk over land, højtryk over havet.' },
  { navn: 'Vintermonsun', scene: 'monsun', tid: 12, celle: true, foelg: true, forklar: true, sammenlign: true,
    kaede: 'KOLDT KONTINENT → HØJTRYK → TØR VIND MOD HAVET', spoergsmaal: 'Hvorfor er vinteren tør i Indien?',
    tekst: 'Om vinteren er kontinentet koldere end havet. Over Asien ligger et kraftigt højtryk, og tør luft strømmer fra nordøst ud mod havet. Luften synker over land, så der dannes kun få skyer. Regnen falder i stedet over havet.',
    naeste: 'Til opgaverne',
    beskrivelse: 'Samme snit om vinteren. Kontinentet er koldt, højtryk over land og lavtryk over havet. Tør luft strømmer fra land ud over havet, hvor den stiger og giver skyer og regn.' },
];

let aktuelt = 0, tid = 0, loeb = null, pause = reduceret.matches, forklarSelv = false;
// Opgavetilstand (trin 6): figuren står som et af trinnene; grafHel viser hele kurven.
let opgaveAktiv = false, grafHel = false;
let animTid = 0, fase = 0, sidste = null, overgang = 0, sidsteStatus = '';
let bredde = 1200, hoejde = 500, sx = 1, sy = 1;
// Lærredet tegnes i skærmpixels; X/Y omregner fra viewBox (1200 × 500), så
// stregtykkelser er ens i alle retninger, selvom figuren strækkes.
const X = x => x * sx, Y = y => y * sy;
// Streger og pile tyndere på små figurer.
const K = () => Math.max(0.5, Math.min(1, bredde / 900));
const scene = () => trin[aktuelt].scene;

// ---------- Landskaber ----------
function jordBrise(x) {
  if (x < 560) return 404;
  if (x < 625) return 410 - 14 * (x - 560) / 65;
  return 396 - 5 * Math.sin(x / 70) - 8 * ((x - 625) / 575) ** 2;
}
function jordMonsun(x) {
  if (x < 470) return 404;
  if (x < 520) return 410 - 12 * (x - 470) / 50;
  if (x < 850) return 398 - (x - 520) * 0.04;
  if (x < 1080) {
    const f = (x - 850) / 230, glat = f * f * (3 - 2 * f);
    return 385 - 265 * glat + 14 * Math.sin(x / 13) * Math.sin(Math.PI * f);
  }
  return 170 + 8 * Math.sin(x / 25);
}
const jordY = x => (scene() === 'brise' ? jordBrise : jordMonsun)(x);
const kyst = () => scene() === 'brise' ? 560 : 470;

function tegnLandskab() {
  const s = scene();
  const j = s === 'brise' ? jordBrise : jordMonsun;
  let d = `M${kyst() - 8} 500`;
  for (let x = kyst() - 8; x <= 1200; x += 6) d += `L${x} ${j(Math.max(x, kyst() + 0.1)).toFixed(1)}`;
  d += 'L1200 500Z';
  $('land').setAttribute('d', d);
  $('havflade').setAttribute('d', `M0 404H${kyst() + 30}V500H0Z`);
  // Sne på de højeste dele af Himalaya.
  let sne = '';
  if (s === 'monsun') {
    sne = 'M985 ' + j(985).toFixed(1);
    for (let x = 985; x <= 1075; x += 5) sne += `L${x} ${j(x).toFixed(1)}`;
    for (let x = 1075; x >= 985; x -= 5) sne += `L${x} ${(Math.min(j(x) + 30, 260 - (x - 985) * 0.9)).toFixed(1)}`;
    sne += 'Z';
  }
  $('sne').setAttribute('d', sne);
  const pynt = $('pynt');
  pynt.innerHTML = '';
  const tilfoej = html => pynt.insertAdjacentHTML('beforeend', html);
  if (s === 'brise') {
    for (const x of [700, 735, 1080]) tilfoej(`<g fill="#4d795c" transform="translate(${x} ${j(x)})"><rect x="-2" y="-16" width="4" height="16" fill="#5b4a3a"/><ellipse cy="-28" rx="12" ry="17"/></g>`);
    for (const x of [860, 905]) tilfoej(`<g transform="translate(${x} ${j(x)})"><rect x="-16" y="-20" width="32" height="20" fill="#e9dcc1" stroke="#7d6a55"/><path d="M-20-20 0-34 20-20Z" fill="#b3593d"/></g>`);
    tilfoej('<path d="M565 405q30 4 60-4" stroke="#e7f1e0" stroke-width="3" fill="none" opacity=".7"/>');
    tilfoej('<g fill="none" stroke="#e4f0de" stroke-linecap="round" opacity=".45"><path d="M80 425q40-3 80 1M260 445q50-3 100 2M140 470q45-2 90 2M400 430q35-2 70 1" stroke-width="1.5"/></g>');
  } else {
    tilfoej('<g fill="none" stroke="#e4f0de" stroke-linecap="round" opacity=".45"><path d="M60 430q40-3 80 1M220 450q50-3 100 2M120 475q45-2 90 2M330 435q35-2 70 1" stroke-width="1.5"/></g>');
    for (const x of [560, 610, 700, 780]) tilfoej(`<g fill="#5f8a4f" transform="translate(${x} ${j(x)})"><rect x="-1.5" y="-10" width="3" height="10" fill="#5b4a3a"/><ellipse cy="-17" rx="8" ry="10"/></g>`);
  }
  $('land-varme').setAttribute('x', kyst() + 20); $('land-varme').setAttribute('y', s === 'brise' ? 340 : 330);
  $('land-varme').setAttribute('width', s === 'brise' ? 600 : 380); $('land-varme').setAttribute('height', 80);
  for (const a of ['x', 'y', 'width', 'height']) $('land-kulde').setAttribute(a, $('land-varme').getAttribute(a));
  tegnSkyer();
  byggEtiketter();
}

function tegnSkyer() {
  const g = $('skyer');
  g.innerHTML = '';
  if (scene() !== 'monsun') return;
  const sky = (id, xs, y) => `<g id="${id}" opacity="0">${xs.map((x, i) => `<g transform="translate(${x} ${y + (i % 2) * 14})"><ellipse rx="58" ry="22" fill="#eef1f2"/><ellipse cx="-30" cy="6" rx="34" ry="16" fill="#e2e7ea"/><ellipse cx="34" cy="4" rx="38" ry="18" fill="#dde3e7"/><ellipse cx="6" cy="-14" rx="36" ry="18" fill="#f5f6f6"/><path d="M-62 14H66" stroke="#9aa8b1" stroke-width="10" stroke-linecap="round" opacity=".5"/></g>`).join('')}</g>`;
  g.innerHTML = sky('sommerskyer', [640, 740, 840, 930], 200) + sky('vinterskyer', [130, 240], 250);
}

// ---------- Etiketter i figuren (placeret i viewBox-koordinater) ----------
const etiketter = {};
function etiket(navn, x, y, klasse) {
  const el = document.createElement('span');
  el.className = 'etiket ' + klasse;
  el.style.left = (x / 12) + '%';
  el.style.top = (y / 5) + '%';
  $('etiketter').append(el);
  etiketter[navn] = el;
}
function byggEtiketter() {
  $('etiketter').innerHTML = '';
  for (const k in etiketter) delete etiketter[k];
  if (scene() === 'brise') {
    etiket('hav', 250, 455, 'sted');
    etiket('land', 900, 455, 'sted');
    etiket('tryk-jord-hav', 300, 330, 'tryk');
    etiket('tryk-jord-land', 840, 330, 'tryk');
    etiket('tryk-top-hav', 300, 115, 'tryk');
    etiket('tryk-top-land', 840, 115, 'tryk');
    etiket('vind', 570, 345, 'proces vind');
    etiket('op', 1015, 235, 'proces valgfri');
    etiket('ned', 112, 235, 'proces valgfri');
    etiket('top', 570, 135, 'proces valgfri');
    etiket('trykflade', 1120, 345, 'proces valgfri lille');
    etiket('varm', 880, 285, 'proces skilt varm');
    etiket('havtekst', 300, 300, 'proces skilt');
  } else {
    etiket('hav', 220, 455, 'sted');
    etiket('land', 680, 445, 'sted');
    etiket('bjerg', 980, 330, 'sted lys');
    etiket('syd', 18, 20, 'kompas');
    etiket('nord', 1182, 20, 'kompas');
    etiket('tryk-jord-hav', 260, 330, 'tryk');
    etiket('tryk-jord-land', 690, 330, 'tryk');
    etiket('tryk-top-hav', 260, 70, 'tryk');
    etiket('tryk-top-land', 690, 70, 'tryk');
    etiket('vind', 470, 345, 'proces vind');
    etiket('regn', 700, 150, 'proces skilt');
    etiket('sibirien', 1120, 95, 'proces lille');
  }
}
function saetEtiket(navn, tekst) {
  const el = etiketter[navn];
  if (!el) return;
  const html = tekst || '';
  if (el.dataset.html !== html) { el.innerHTML = html; el.dataset.html = html; }
  el.hidden = !html;
  if (el.classList.contains('tryk')) el.classList.toggle('hoej', html.startsWith('H'));
}

// ---------- Graf ----------
const GRAF = { x0: 32, x1: 252, y0: 10, y1: 122 };
function grafSkala() {
  if (scene() === 'brise') return { min: 10, max: 30, periode: 24 };
  const s = serier.monsun;
  const alle = [...s.land, ...s.hav];
  const min = Math.min(...alle), max = Math.max(...alle), luft = (max - min) * 0.1;
  return { min: min - luft, max: max + luft, periode: 12 };
}
let skala = grafSkala();
const gx = t => GRAF.x0 + (GRAF.x1 - GRAF.x0) * t / skala.periode;
const gy = T => GRAF.y1 - (GRAF.y1 - GRAF.y0) * (T - skala.min) / (skala.max - skala.min);
function byggGraf() {
  skala = grafSkala();
  const g = $('graf');
  let h = '';
  if (scene() === 'brise') {
    // Nat (sol under horisonten) som baggrund: svarer til »lampen slukket«.
    h += `<rect x="${gx(12)}" y="${GRAF.y0}" width="${gx(24) - gx(12)}" height="${GRAF.y1 - GRAF.y0}" fill="#1d3a52" opacity=".09"/>`;
    h += `<text x="${(gx(0) + gx(12)) / 2}" y="${GRAF.y0 + 9}" class="g-zone">dag</text><text x="${(gx(12) + gx(24)) / 2}" y="${GRAF.y0 + 9}" class="g-zone">nat</text>`;
    for (let T = 10; T <= 30; T += 5) h += `<line x1="${GRAF.x0}" x2="${GRAF.x1}" y1="${gy(T)}" y2="${gy(T)}" class="g-net"/><text x="${GRAF.x0 - 4}" y="${gy(T) + 3}" class="g-y">${T}</text>`;
    h += `<text x="4" y="${GRAF.y0 + 2}" class="g-enhed">°C</text>`;
    for (let t = 0; t <= 24; t += 6) h += `<text x="${gx(t)}" y="${GRAF.y1 + 13}" class="g-x">${String((t + 6) % 24 || 24).padStart(2, '0')}</text>`;
    h += `<text x="${GRAF.x1}" y="${GRAF.y1 + 25}" class="g-akse" text-anchor="end">klokken</text>`;
  } else {
    h += `<rect x="${gx(5)}" y="${GRAF.y0}" width="${gx(9) - gx(5)}" height="${GRAF.y1 - GRAF.y0}" fill="#2f7da1" opacity=".09"/>`;
    h += `<text x="${(gx(5) + gx(9)) / 2}" y="${GRAF.y1 - 4}" class="g-zone">regntid</text>`;
    h += `<text x="${GRAF.x0 - 6}" y="${GRAF.y0 + 8}" class="g-y">varm</text><text x="${GRAF.x0 - 6}" y="${GRAF.y1}" class="g-y">kold</text>`;
    'JFMAMJJASOND'.split('').forEach((m, i) => { h += `<text x="${gx(i + 0.5)}" y="${GRAF.y1 + 13}" class="g-x">${m}</text>`; });
    h += `<text x="${GRAF.x1}" y="${GRAF.y1 + 25}" class="g-akse" text-anchor="end">måned</text>`;
  }
  h += `<path d="M${GRAF.x0} ${GRAF.y0}V${GRAF.y1}H${GRAF.x1}" class="g-akser"/>`;
  h += '<path id="g-hav" class="g-hav"/><path id="g-land" class="g-land"/>';
  h += '<line id="g-nu" class="g-nu"/><circle id="g-p-hav" r="3.6" class="g-p-hav"/><circle id="g-p-land" r="3.6" class="g-p-land"/>';
  g.innerHTML = h;
}
function opdaterGraf(t) {
  const s = serier[scene()];
  for (const id of ['g-nu', 'g-p-land', 'g-p-hav']) $(id).style.display = grafHel ? 'none' : '';
  if (grafHel) t = skala.periode;
  const n = Math.max(1, Math.round(t / skala.periode * 300));
  let dl = '', dh = '';
  for (let i = 0; i <= n; i++) {
    const ti = t * i / n, v = tilstand(s, ti);
    dl += (i ? 'L' : 'M') + gx(ti).toFixed(1) + ' ' + gy(v.land).toFixed(1);
    dh += (i ? 'L' : 'M') + gx(ti).toFixed(1) + ' ' + gy(v.hav).toFixed(1);
  }
  const v = tilstand(s, t);
  $('g-land').setAttribute('d', dl);
  $('g-hav').setAttribute('d', dh);
  $('g-nu').setAttribute('x1', gx(t)); $('g-nu').setAttribute('x2', gx(t));
  $('g-nu').setAttribute('y1', GRAF.y0); $('g-nu').setAttribute('y2', GRAF.y1);
  $('g-p-land').setAttribute('cx', gx(t)); $('g-p-land').setAttribute('cy', gy(v.land));
  $('g-p-hav').setAttribute('cx', gx(t)); $('g-p-hav').setAttribute('cy', gy(v.hav));
}

// ---------- Tilstand og tekst ----------
function klokke(t) {
  if (scene() === 'brise') {
    const min = Math.round(((t + 6) % 24) * 60) % 1440;
    return `kl. ${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
  }
  return MAANEDER[Math.floor(((t % 12) + 12) % 12)];
}
const fmt = T => T.toFixed(0).replace('-', '−') + ' °C';
function opdaterVisning() {
  const t = trin[aktuelt], v = tilstand(serier[scene()], tid), vind = v.vind;
  $('ur').textContent = grafHel ? (scene() === 'brise' ? 'hele døgnet' : 'hele året') : klokke(tid);
  if (scene() === 'brise') {
    $('t-land').textContent = fmt(v.land); $('t-hav').textContent = fmt(v.hav);
    const d = Math.round(v.forskel);
    $('forskel').textContent = d > 0 ? `Land er ${d} °C varmere end havet` : d < 0 ? `Land er ${-d} °C koldere end havet` : 'Land og hav er lige varme';
  } else {
    $('t-land').textContent = ''; $('t-hav').textContent = '';
    $('forskel').textContent = vind > 0.15 ? 'Land er varmere end havet' : vind < -0.15 ? 'Land er koldere end havet' : 'Land og hav er næsten lige varme';
  }
  if (grafHel) { $('t-land').textContent = ''; $('t-hav').textContent = ''; $('forskel').textContent = ''; }
  opdaterGraf(tid);

  // Himmel: dag/nat for brisen; altid dag i monsunsnittet.
  const lys = scene() === 'brise' ? Math.min(1, Math.max(0, (v.sol + 0.12) / 0.3)) : 1;
  $('nat').setAttribute('opacity', (1 - lys) * 0.92);
  $('stjerner').setAttribute('opacity', Math.max(0, 1 - lys * 2));
  $('maane').setAttribute('opacity', Math.max(0, 1 - lys * 2));
  const solTid = scene() === 'brise' ? ((tid % 24) + 24) % 24 : 6;
  const solX = 120 + solTid / 12 * 960, solY = 330 - 250 * Math.sin(Math.PI * Math.min(12, solTid) / 12);
  const forhold = (hoejde / 500) / (bredde / 1200);
  $('sol').setAttribute('transform', `translate(${solX} ${solY}) scale(${forhold} 1)`);
  $('sol').setAttribute('opacity', scene() === 'brise' ? (solTid < 12.4 ? 1 : 0) : 1);
  if (scene() === 'monsun') {
    $('sol').setAttribute('transform', `translate(140 80) scale(${forhold * 0.8} .8)`);
    $('land').setAttribute('fill', blandFarve('#b9a774', '#86ad6b', (vind + 1) / 2));
    $('sommerskyer')?.setAttribute('opacity', Math.max(0, vind) ** 0.7);
    $('vinterskyer')?.setAttribute('opacity', Math.max(0, -vind) ** 0.7 * 0.85);
  } else {
    $('land').setAttribute('fill', blandFarve('#5d7f69', '#8fb47a', lys));
  }
  $('maane').setAttribute('transform', `translate(1050 80) scale(${forhold} 1) translate(-1050 -80)`);
  // Varme og kulde ved overfladen af land.
  const varm = scene() === 'brise' ? Math.max(0, v.land - v.hav) / 9 : Math.max(0, vind);
  const kold = scene() === 'brise' ? Math.max(0, v.hav - v.land) / 6 : Math.max(0, -vind);
  $('land-varme').setAttribute('opacity', Math.min(1, varm));
  $('land-kulde').setAttribute('opacity', Math.min(1, kold) * 0.8);

  // Etiketter.
  const celle = t.celle && !forklarSelv, pil = vind > 0;
  const tydelig = Math.abs(vind) > 0.12;
  const visTryk = (t.celle || t.isobarer) && tydelig;
  if (scene() === 'brise') {
    saetEtiket('hav', 'Hav'); saetEtiket('land', 'Land');
    saetEtiket('vind', celle && tydelig ? (pil ? 'Søbrise<small>fra havet mod land</small>' : 'Landbrise<small>fra land mod havet</small>') : '');
    saetEtiket('op', celle && tydelig ? (pil ? 'Luften stiger' : 'Luften synker') : '');
    saetEtiket('ned', celle && tydelig ? (pil ? 'Luften synker' : 'Luften stiger') : '');
    saetEtiket('top', celle && tydelig ? (pil ? 'Strømmer ud over havet højt oppe' : 'Strømmer ind over land') : '');
    if (etiketter.top) etiketter.top.style.top = (pil ? 135 : 235) / 5 + '%';
    for (const n of ['op', 'ned']) if (etiketter[n]) etiketter[n].style.top = (pil ? 235 : 300) / 5 + '%';
    saetEtiket('trykflade', t.isobarer && !forklarSelv ? 'Trykflader' : '');
    saetEtiket('varm', aktuelt === 0 && !forklarSelv && vind > -0.5 && tid > 1 ? 'Lav specifik varmekapacitet<br>tyndt lag opvarmes' : aktuelt === 1 && !forklarSelv ? 'Varm luft<br>udvider sig' : '');
    saetEtiket('havtekst', aktuelt === 0 && !forklarSelv && tid > 1 ? 'Høj specifik varmekapacitet<br>varmen blandes ned' : '');
  } else {
    saetEtiket('hav', 'Det Indiske Ocean'); saetEtiket('land', 'Indien'); saetEtiket('bjerg', 'Himalaya');
    saetEtiket('syd', 'S'); saetEtiket('nord', 'N');
    saetEtiket('vind', celle && tydelig ? (pil ? 'Sydvestmonsun<small>fugtig luft fra havet</small>' : 'Nordøstmonsun<small>tør luft fra land</small>') : '');
    saetEtiket('regn', celle && vind > 0.3 ? 'Skyer og kraftig regn<small>kondensation frigiver varme</small>' : '');
    saetEtiket('sibirien', celle && vind < -0.3 ? 'Højtryk over det<br>kolde Centralasien' : '');
  }
  // Tryk: ved jorden lavtryk over det varme område, højt oppe omvendt.
  // I trin 1 er kun trykket i højden ændret.
  const jordTryk = t.isobarer === 1 ? false : visTryk;
  saetEtiket('tryk-jord-land', jordTryk ? (pil ? 'L' : 'H') : '');
  saetEtiket('tryk-jord-hav', jordTryk ? (pil ? 'H' : 'L') : '');
  saetEtiket('tryk-top-land', visTryk ? (pil ? 'H' : 'L') : '');
  const topY = scene() === 'brise' && !pil && t.celle ? 215 : scene() === 'brise' ? 115 : 70;
  for (const n of ['tryk-top-land', 'tryk-top-hav']) if (etiketter[n]) etiketter[n].style.top = topY / 5 + '%';
  saetEtiket('tryk-top-hav', visTryk ? (pil ? 'L' : 'H') : '');

  let status = '';
  if (aktuelt === 0) status = tid < t.loeb.til - 0.01 ? 'Tiden løber fra solopgang til eftermiddag.' : 'Land er blevet meget varmere end havet. Hvad sker der med luften over land?';
  else if (aktuelt === 1) status = 'Det høje tryk over land i højden er starten på en vind.';
  else if (t.foelg && loeb) status = scene() === 'brise' ? 'Følg vinden og kurverne gennem døgnet. Hvornår vender vinden?' : 'Følg vinden og kurverne gennem året. Hvornår vender monsunen?';
  else if (aktuelt === 2) status = 'Tryk på »Følg et døgn«, og se, hvornår søbrisen bliver til landbrise.';
  else if (aktuelt === 3) status = 'Sammenlign med søbrisen: cirkulationen er lavere og svagere.';
  else if (aktuelt === 4) status = 'Samme princip som søbrisen, men over et helt kontinent og en hel årstid.';
  else if (aktuelt === 5) status = 'Samme princip som landbrisen, men over et helt kontinent og en hel årstid.';
  if (forklarSelv) status = '';
  if (status !== sidsteStatus) { $('observation').textContent = status; sidsteStatus = status; }
  $('figur-beskrivelse').textContent = `${t.beskrivelse} ${klokke(tid)[0].toUpperCase() + klokke(tid).slice(1)}: ${$('forskel').textContent.toLowerCase()}.`;
}
function blandFarve(a, b, f) {
  const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [p(a), p(b)];
  return '#' + x.map((c, i) => Math.round(c + (y[i] - c) * Math.max(0, Math.min(1, f))).toString(16).padStart(2, '0')).join('');
}

function opdaterUI() {
  const t = trin[aktuelt];
  $('trin-navn').textContent = opgaveAktiv ? 'Opgaver' : t.navn;
  $('skala').textContent = scene() === 'brise' ? 'Kyst · ét døgn' : 'Sydasien · ét år · skematisk snit';
  $('trin-overlinje').textContent = forklarSelv ? 'FORKLAR MED DINE EGNE ORD' : t.kaede;
  $('spoergsmaal').textContent = forklarSelv ? 'Hvordan opstår brise og monsun?' : t.spoergsmaal;
  $('forklaring').textContent = forklarSelv ? 'Brug figuren og grafen til at forklare hele kæden: fra forskellig opvarmning af land og hav til tryk, vind, skyer og regn.' : t.tekst;
  $('naeste').innerHTML = `${t.naeste} <span aria-hidden="true">→</span>`;
  $('forrige').disabled = aktuelt === 0;
  $('foelg-knap').hidden = !t.foelg;
  const enhed = scene() === 'brise' ? 'døgn' : 'år';
  $('foelg-knap').textContent = loeb && t.foelg ? 'Stop tiden' : `Følg et ${enhed}`;
  $('foelg-knap').setAttribute('aria-pressed', String(!!(loeb && t.foelg)));
  $('forklar-knap').hidden = !t.forklar;
  $('forklar-knap').textContent = forklarSelv ? 'Vis forklaringer' : 'Forklar selv';
  $('forklar-knap').setAttribute('aria-pressed', String(forklarSelv));
  $('start-hint').hidden = !t.hint;
  $('start-hint').textContent = t.hint || '';
  $('sammenlign').hidden = !t.sammenlign;
  $('pause').textContent = pause ? '▷ Fortsæt' : 'Ⅱ Pause';
  $('pause').setAttribute('aria-pressed', String(pause));
  $('graf-titel').textContent = scene() === 'brise' ? 'Overfladetemperatur' : 'Temperatur · skematisk';
  document.body.classList.toggle('forklar-selv', forklarSelv);
  document.body.dataset.scene = scene();
  document.body.classList.toggle('opgave-tilstand', opgaveAktiv);
  document.querySelectorAll('[data-trin]').forEach((b, i) => {
    if (i === (opgaveAktiv ? 6 : aktuelt)) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
  });
  opdaterVisning();
}

function vaelgTrin(n) {
  // Trin 6 er opgaverne; de stiller selv figuren via visFigur.
  if (n === 6) { opgaveAktiv = true; opgaver.aktiver(true); opdaterUI(); return; }
  opgaveAktiv = false; grafHel = false;
  opgaver.aktiver(false);
  stil(n);
  loeb = trin[n].loeb ? { ...trin[n].loeb } : null;
  // Ved pause/reduceret bevægelse vises sluttilstanden med det samme.
  if (loeb && pause) { tid = loeb.til; loeb = null; }
  opdaterUI(); tegn();
}
function stil(n) {
  const gammelScene = scene();
  aktuelt = n; forklarSelv = false; overgang = 0; loeb = null;
  tid = trin[n].tid;
  if (gammelScene !== scene() || !$('land').getAttribute('d')) { tegnLandskab(); }
  byggGraf();
}
function visFigur(n, hel) {
  stil(n); grafHel = hel; overgang = 2;
  opdaterUI(); tegn();
}

// ---------- Luftstrømme på lærredet ----------
function celleGeometri(vind) {
  if (scene() === 'brise') return { x0: 200, x1: 930, yb: 372, yt: vind > 0 ? 165 : 262, r: 70 };
  return vind > 0 ? { x0: 170, x1: 860, yb: 372, yt: 110, r: 90 } : { x0: 170, x1: 840, yb: 365, yt: 190, r: 80 };
}
// Lukket bane som polylinje: ved jorden fra hav mod land, op over land,
// tilbage i højden og ned over havet. Vendes, når vinden skifter.
function cellebane(g, vind) {
  const p = [];
  const bue = (cx, cy, a0, a1) => { for (let i = 0; i <= 8; i++) { const a = a0 + (a1 - a0) * i / 8; p.push([cx + g.r * Math.cos(a), cy + g.r * Math.sin(a)]); } };
  p.push([g.x0 + g.r, g.yb]);
  bue(g.x1 - g.r, g.yb - g.r, Math.PI / 2, 0);
  bue(g.x1 - g.r, g.yt + g.r, 0, -Math.PI / 2);
  bue(g.x0 + g.r, g.yt + g.r, -Math.PI / 2, -Math.PI);
  bue(g.x0 + g.r, g.yb - g.r, Math.PI, Math.PI / 2);
  return vind >= 0 ? p : p.reverse();
}
function tegnCelle(vind) {
  const styrke = Math.min(1, Math.abs(vind));
  if (styrke < 0.04) return;
  const bane = cellebane(celleGeometri(vind), vind);
  const laengder = [0];
  for (let i = 1; i < bane.length; i++) laengder.push(laengder[i - 1] + Math.hypot(bane[i][0] - bane[i - 1][0], bane[i][1] - bane[i - 1][1]));
  const L = laengder.at(-1);
  const frem = pause ? 1 : Math.min(1, overgang / 1.2);
  const farve = scene() === 'monsun' && vind > 0 ? '#1d5f86' : scene() === 'monsun' ? '#8a5a2b' : '#1f5a70';
  pensel.save();
  pensel.lineCap = 'round'; pensel.lineJoin = 'round';
  pensel.globalAlpha = frem * (0.25 + 0.2 * styrke);
  pensel.strokeStyle = farve;
  pensel.lineWidth = (8 + 10 * styrke) * K();
  pensel.beginPath(); bane.forEach(([x, y], i) => i ? pensel.lineTo(X(x), Y(y)) : pensel.moveTo(X(x), Y(y))); pensel.stroke();
  pensel.globalAlpha = frem * 0.9;
  pensel.lineWidth = (2.2 + 1.5 * styrke) * K();
  pensel.setLineDash([16 * K(), 18 * K()]);
  pensel.lineDashOffset = -fase * 60 * sx;
  pensel.stroke();
  pensel.setLineDash([]);
  // Pilehoveder glider langs banen; farten følger vindstyrken.
  const punkt = s => {
    const d = ((s % 1) + 1) % 1 * L;
    let i = 1; while (laengder[i] < d) i++;
    const f = (d - laengder[i - 1]) / (laengder[i] - laengder[i - 1] || 1);
    const [ax, ay] = bane[i - 1], [bx, by] = bane[i];
    return [X(ax + (bx - ax) * f), Y(ay + (by - ay) * f), Math.atan2(Y(by - ay), X(bx - ax))];
  };
  pensel.fillStyle = farve;
  for (let k = 0; k < 6; k++) {
    const [x, y, a] = punkt(k / 6 + fase * 60 / L);
    pensel.save(); pensel.translate(x, y); pensel.rotate(a);
    const s = (7 + 4 * styrke) * K();
    pensel.beginPath(); pensel.moveTo(s, 0); pensel.lineTo(-s * 0.8, -s * 0.75); pensel.lineTo(-s * 0.35, 0); pensel.lineTo(-s * 0.8, s * 0.75); pensel.closePath(); pensel.fill();
    pensel.restore();
  }
  pensel.restore();
}
// Trykflader: løftes over varm luft, mest højt oppe. Efter udstrømningen i
// højden falder trykket ved jorden over land (fladen bøjer ned).
function tegnIsobarer(vind, type) {
  const niveauer = [385, 315, 245, 175];
  pensel.save();
  pensel.strokeStyle = '#2c4f63'; pensel.globalAlpha = 0.55; pensel.lineWidth = 1.4;
  pensel.setLineDash([7, 6]);
  niveauer.forEach((y0, i) => {
    const andel = i / (niveauer.length - 1);
    const k = type === 1 ? andel : andel - 0.4;
    pensel.beginPath();
    for (let x = 0; x <= 1200; x += 12) {
      const w = 1 / (1 + Math.exp(-(x - 600) / 70)) - 0.5;
      const y = y0 - 50 * k * vind * w * 2 * Math.min(1, overgang / 1.5 + (pause ? 1 : 0));
      x ? pensel.lineTo(X(x), Y(y)) : pensel.moveTo(X(x), Y(y));
    }
    pensel.stroke();
  });
  pensel.restore();
}
function tegnOpstigning(styrke) {
  pensel.save();
  pensel.strokeStyle = '#b24d32'; pensel.lineWidth = 2.4; pensel.lineCap = 'round';
  for (const [x, f] of [[720, 0], [850, 1.3], [980, 2.4]]) {
    const top = 220, bund = jordBrise(x) - 10;
    const op = (fase * 1.6 + f) % 1;
    pensel.globalAlpha = 0.75 * styrke;
    pensel.beginPath();
    for (let y = bund; y >= top; y -= 4) {
      const xx = x + 7 * Math.sin((y + fase * 90) / 16);
      y === bund ? pensel.moveTo(X(xx), Y(y)) : pensel.lineTo(X(xx), Y(y));
    }
    pensel.stroke();
    const ty = top, tx = x + 7 * Math.sin((ty + fase * 90) / 16);
    pensel.beginPath(); pensel.moveTo(X(tx) - 7, Y(ty) + 8); pensel.lineTo(X(tx), Y(ty)); pensel.lineTo(X(tx) + 7, Y(ty) + 8); pensel.stroke();
    // En lille »boble« varm luft på vej op.
    pensel.globalAlpha = 0.35 * styrke;
    pensel.fillStyle = '#e48b5c';
    pensel.beginPath(); pensel.ellipse(X(x), Y(bund - (bund - top) * op), 10, 8, 0, 0, Math.PI * 2); pensel.fill();
  }
  pensel.restore();
}
function tegnRegn(x0, x1, ytop, styrke) {
  if (styrke < 0.05) return;
  pensel.save();
  pensel.strokeStyle = '#3f6f93'; pensel.lineWidth = 1.5; pensel.globalAlpha = 0.6 * styrke;
  pensel.beginPath();
  for (let x = x0; x <= x1; x += 14) {
    const bund = jordY(x);
    for (let y = ytop + ((fase * 220 + x * 3.7) % 40); y < bund - 8; y += 40) { pensel.moveTo(X(x), Y(y)); pensel.lineTo(X(x) - 3, Y(y) + 9); }
  }
  pensel.stroke();
  pensel.restore();
}
function tegn() {
  pensel.clearRect(0, 0, bredde, hoejde);
  const t = trin[aktuelt], v = tilstand(serier[scene()], tid);
  if (t.isobarer && !forklarSelv) tegnIsobarer(Math.max(-1, Math.min(1, v.vind)), t.isobarer);
  if (t.opstigning) tegnOpstigning(Math.min(1, overgang / 1.2 + (pause ? 1 : 0)));
  if (scene() === 'monsun') {
    tegnRegn(600, 980, 225, Math.max(0, v.vind));
    tegnRegn(90, 290, 275, Math.max(0, -v.vind) * 0.7);
  }
  if (t.celle) tegnCelle(v.vind);
}

function tilpas() {
  const r = laerred.getBoundingClientRect();
  bredde = r.width || 1200; hoejde = r.height || 500;
  const pixel = Math.min(devicePixelRatio || 1, 2);
  laerred.width = Math.round(bredde * pixel);
  laerred.height = Math.round(hoejde * pixel);
  pensel.setTransform(laerred.width / bredde, 0, 0, laerred.height / hoejde, 0, 0);
  sx = bredde / 1200; sy = hoejde / 500;
  opdaterVisning(); tegn();
}
new ResizeObserver(tilpas).observe(laerred);

function billede(nu) {
  if (sidste === null) sidste = nu;
  const dt = Math.min((nu - sidste) / 1000, 0.1); sidste = nu;
  if (!pause && !document.hidden) {
    animTid += dt; overgang += dt;
    const v = tilstand(serier[scene()], tid);
    // Strømningens fart følger vindstyrken, så skiftet kan ses.
    fase += dt * (0.25 + 0.75 * Math.abs(v.vind)) * (trin[aktuelt].celle ? 1 : 0.6);
    if (loeb) {
      tid = Math.min(loeb.til, tid + dt * loeb.fart);
      if (tid >= loeb.til - 1e-9) { loeb = null; opdaterUI(); }
    }
    opdaterVisning(); tegn();
  }
  requestAnimationFrame(billede);
}

document.querySelectorAll('[data-trin]').forEach(b => b.addEventListener('click', () => vaelgTrin(+b.dataset.trin)));
$('naeste').addEventListener('click', () => vaelgTrin(aktuelt + 1));
$('forrige').addEventListener('click', () => vaelgTrin(Math.max(0, aktuelt - 1)));
$('nulstil').addEventListener('click', () => vaelgTrin(opgaveAktiv ? 6 : aktuelt));
$('pause').addEventListener('click', () => { pause = !pause; sidste = null; opdaterUI(); });
$('foelg-knap').addEventListener('click', () => {
  if (loeb) { loeb = null; }
  else {
    const periode = serier[scene()].cfg.periode;
    tid = 0; overgang = 2;
    loeb = { til: periode, fart: periode / 20 };
    if (pause) { pause = false; sidste = null; }
  }
  opdaterUI(); tegn();
});
$('forklar-knap').addEventListener('click', () => { forklarSelv = !forklarSelv; opdaterUI(); tegn(); });
$('fokus').addEventListener('click', () => {
  const aktiv = document.body.classList.toggle('fokus');
  $('fokus').textContent = aktiv ? 'Afslut fokusvisning ↙' : 'Fokusvisning ↗';
  $('fokus').setAttribute('aria-pressed', String(aktiv));
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && document.body.classList.contains('fokus')) $('fokus').click();
});
reduceret.addEventListener('change', e => { if (e.matches) { pause = true; opdaterUI(); } });
if (new URLSearchParams(location.search).has('projektor')) $('fokus').click();

const opgaver = lavOpgaver({
  figur: document.querySelector('.scene'),
  geometri: () => {
    const v = tilstand(serier[scene()], tid).vind;
    return { scene: scene(), kyst: kyst(), jordY, vind: v, celle: celleGeometri(v), periode: serier[scene()].cfg.periode, graf: GRAF };
  },
  visFigur,
  tilTrin: vaelgTrin,
});
// Direkte link til opgaverne: …/brise-og-monsun/#opgaver
vaelgTrin(location.hash === '#opgaver' ? 6 : 0); tilpas(); requestAnimationFrame(billede);
