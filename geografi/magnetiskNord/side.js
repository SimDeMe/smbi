/* ═══════════════════════════════════════════════════════════
   side.js — indgangen.

   Binder DOM'en i magnetiskNord.html sammen med modulerne, holder
   styr på sidens tilstand og på adressen. Alt, der handler om
   knapper og tilstand, hører hjemme her; beregningerne ligger i
   felt.js, fagdata i poler.js og figurens dele i klode.js,
   feltlinjer.js og kompas.js.
   ═══════════════════════════════════════════════════════════ */
import * as THREE from 'three';
import {byggScene}      from './model.js';
import {byggKlode, kortFarve, KORT_MAKS} from './klode.js';
import {byggFeltlinjer} from './feltlinjer.js';
import {byggKompas}     from './kompas.js';
import {byggPolkort}    from './polkort.js';
import {aflaes, kropPos, latLon, afstandKm} from './felt.js';
import {POLSPOR, AAR_MIN, AAR_MAX, AAR_KNAPPER, VENDING, STEDER, polI, aekvatorFelt} from './poler.js';

const el  = id => document.getElementById(id);
const dec = (v, n = 1) => v.toFixed(n).replace('.', ',').replace('-', '−');
const bredde  = v => dec(Math.abs(v)) + '° ' + (v >= 0 ? 'N' : 'S');
const laengde = v => dec(Math.abs(v)) + '° ' + (v >= 0 ? 'Ø' : 'V');

/* ── Tilstand ──────────────────────────────────────────── *
 * `pol` er den ene ende af magnetens akse. Så længe feltet ikke
 * er vendt, er det den magnetiske nordpol — dér hvor kompassets
 * nordende peger hen, og dér hvor feltlinjerne går ind i jorden.
 * `aar` er null, når polen er sat frit med skyderne.           */
const S = {
  aar: 2025, epoke: null,
  pol: polI(2025), vendt: false, b0: aekvatorFelt(2025),
  kompas: {...STEDER[0]},
  linjer: true, akser: true, magnet: false, kort: false, drej: false, projektor: false,
};
const antipode = p => ({lat: -p.lat, lon: p.lon > 0 ? p.lon-180 : p.lon+180});

/* ── Figuren ───────────────────────────────────────────── */
const model = byggScene({
  lærred: el('scene'),
  boks:   el('view'),
  hint:   el('hint'),
  /* Kameraet ser skråt ned på Nordatlanten, så både Europa,
     Grønland og Canada — og polen — er med fra start. */
  start:  {az: 60*Math.PI/180, el: 0.75, dist: 6.4},
  vedKlik: klikPaaKloden,
});
window.tilpasFigur = model.tilpasStoerrelse;

const klode  = byggKlode(model.scene);
const felt   = byggFeltlinjer(klode.jord);
const kompas = byggKompas(klode.jord);
const polkort = byggPolkort(el('polkort'));

/* ── Mærkater på figuren ───────────────────────────────── */
function nyMærkat(tekst, bg, fg, klasse){
  const d = document.createElement('div');
  d.className = 'ovl ' + (klasse || '');
  d.style.background = bg; d.style.color = fg;
  d.textContent = tekst;
  el('view').appendChild(d);
  return d;
}
const mærkater = [
  {d: nyMærkat('Geografisk nordpol', '#FFF6E0', '#17211F', 'ovl-geo'), anker: klode.ankre.geoNord, vis: () => S.akser},
  {d: nyMærkat('Geografisk sydpol',  '#FFF6E0', '#17211F', 'ovl-geo'), anker: klode.ankre.geoSyd,  vis: () => S.akser},
  {d: nyMærkat('Magnetisk nordpol',  '#E8336D', '#FFFFFF', 'ovl-mag'), anker: klode.ankre.magNord, vis: () => true},
  {d: nyMærkat('Magnetisk sydpol',   '#E4E0D4', '#17211F', 'ovl-mag'), anker: klode.ankre.magSyd,  vis: () => true},
  {d: nyMærkat('S', '#0E86C8', '#FFFFFF', 'ovl-magnet'), anker: felt.ankre.magnetS, vis: () => S.magnet, inde: true},
  {d: nyMærkat('N', '#E8336D', '#FFFFFF', 'ovl-magnet'), anker: felt.ankre.magnetN, vis: () => S.magnet, inde: true},
];
const kompasMærkat = {d: nyMærkat('København', '#FFFFFF', '#17211F', 'ovl-kompas'), anker: kompas.anker, vis: () => true};
mærkater.push(kompasMærkat);

/* Ligger punktet bag kloden set fra kameraet? Linjestykket fra
   kameraet til punktet må ikke skære kuglen med radius 1. */
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _w = new THREE.Vector3();
function bagJorden(P){
  const K = model.kamera.position;
  _a.copy(P).sub(K);
  const l2 = _a.lengthSq();
  const s = Math.max(0, Math.min(1, l2 > 0 ? -K.dot(_a)/l2 : 0));
  _b.copy(K).addScaledVector(_a, s);
  return _b.length() < 0.995;
}

function placerMærkater(){
  const lærred = model.lærred, w = lærred.clientWidth, h = lærred.clientHeight;
  for(const m of mærkater){
    if(!m.vis()){ m.d.style.opacity = '0'; continue; }
    m.anker.getWorldPosition(_w);
    const skjult = !m.inde && bagJorden(_w);
    const v = _w.clone().project(model.kamera);
    /* Med gennemsigtig klode kan man se, hvad der er bagved. */
    m.d.style.opacity = v.z > 1 ? '0' : (skjult ? (S.magnet ? '0.5' : '0') : '1');
    m.d.style.left = (lærred.offsetLeft + (v.x*0.5+0.5)*w) + 'px';
    m.d.style.top  = (lærred.offsetTop  + (-v.y*0.5+0.5)*h) + 'px';
  }
}

/* ── Legenden til misvisningskortet ────────────────────── */
{
  const stop = [];
  for(let i=0;i<=40;i++){
    const D = -KORT_MAKS + i/40*2*KORT_MAKS, c = kortFarve(D);
    stop.push(`rgb(${c[0]|0},${c[1]|0},${c[2]|0}) ${(i/40*100).toFixed(1)}%`);
  }
  el('lg-bar').style.background = `linear-gradient(90deg,${stop.join(',')})`;
}

/* ── Knapper til steder og årstal ──────────────────────── */
function pille(tekst, fn, klasse){
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'pill' + (klasse ? ' '+klasse : '');
  b.textContent = tekst;
  b.setAttribute('aria-pressed', 'false');
  b.addEventListener('click', fn);
  return b;
}
for(const s of STEDER){
  const b = pille(s.navn, () => vaelgSted(s.id, true));
  b.dataset.sted = s.id;
  el('grp-kompas').appendChild(b);
}
for(const aar of AAR_KNAPPER){
  const b = pille(String(aar), () => saetAar(aar));
  b.dataset.aar = aar;
  el('grp-aar').appendChild(b);
}
{
  const b = pille('780 000 år siden', vaelgVending, 'vending');
  b.dataset.aar = 'vending';
  b.title = 'Før den seneste polvending pegede kompasset mod syd';
  el('grp-aar').appendChild(b);
}

function vaelgSted(id, flyv){
  const s = STEDER.find(x => x.id === id); if(!s) return;
  S.kompas = {...s};
  if(flyv) drejHenTil(s.lat, s.lon);
  skift();
}

/* Drej kameraet, så kompasset står midt i billedet. */
function drejHenTil(lat, lon){
  const p = kropPos(lat, lon);
  const v = new THREE.Vector3(...p);
  klode.jord.localToWorld(v);
  model.flyvTil({
    az: Math.atan2(v.x, v.z),
    el: Math.max(-1.1, Math.min(1.1, Math.asin(Math.max(-1, Math.min(1, v.y)))*0.85 + 0.12)),
  }, 0.9);
}

function klikPaaKloden(e){
  const træf = model.peg(e, [klode.jord])[0];
  if(!træf) return;
  const lok = klode.jord.worldToLocal(træf.point.clone());
  const {lat, lon} = latLon([lok.x, lok.y, lok.z]);
  S.kompas = {id: null, navn: null, lat, lon};
  skift();
}

function saetAar(aar){
  S.aar = Math.max(AAR_MIN, Math.min(AAR_MAX, Math.round(aar)));
  S.epoke = null; S.vendt = false;
  S.pol = polI(S.aar);
  S.b0 = aekvatorFelt(S.aar);
  skift();
}

function vaelgVending(){
  S.aar = null; S.epoke = 'vending';
  S.pol = {lat: VENDING.lat, lon: VENDING.lon};
  S.vendt = true;
  skift();
}

/* ── Trykknapper ───────────────────────────────────────── */
function trykknap(id, noegle, fn){
  const b = el(id);
  b.addEventListener('click', () => {
    S[noegle] = !S[noegle];
    if(fn) fn(S[noegle]);
    skift();
  });
  return b;
}
trykknap('btn-linjer', 'linjer');
trykknap('btn-akser',  'akser');
trykknap('btn-magnet', 'magnet');
trykknap('btn-kort',   'kort');
trykknap('btn-vend',   'vendt', () => { S.epoke = null; });
trykknap('btn-drej',   'drej');
trykknap('btn-projektor', 'projektor', v => {
  document.body.dataset.projektor = v ? '1' : '0';
  requestAnimationFrame(model.tilpasStoerrelse);
});

/* ── Skydere ───────────────────────────────────────────── */
const inpAar = el('inp-aar'), inpLat = el('inp-lat'), inpLon = el('inp-lon');
inpAar.addEventListener('input', () => saetAar(+inpAar.value));
for(const inp of [inpLat, inpLon]){
  inp.addEventListener('input', () => {
    /* Når polen flyttes frit, er den ikke længere knyttet til et år. */
    S.aar = null; S.epoke = null;
    S.pol = {lat: +inpLat.value, lon: +inpLon.value};
    skift();
  });
}

/* ── Opdatering ────────────────────────────────────────── *
 * Alt, der følger af tilstanden, regnes om ét sted og højst én
 * gang pr. billede — misvisningskortet er en halv million
 * punkter, og skyderne kan sende mange hændelser i sekundet.   */
let beskidt = true, sidstKort = '';
function skift(){ beskidt = true; gemTilstand(); }

function tegnTilstand(){
  beskidt = false;
  const polVek = kropPos(S.pol.lat, S.pol.lon);
  const mod = S.vendt ? antipode(S.pol) : S.pol;       // dér peger nålen hen
  const nordlig = S.pol.lat >= 0 ? S.pol : antipode(S.pol);

  /* figuren */
  const kortNøgle = S.kort ? `${S.pol.lat},${S.pol.lon},${S.vendt}` : 'simpel';
  const nytKort = kortNøgle !== sidstKort;
  sidstKort = kortNøgle;
  if(nytKort) klode.tegnTekstur(polVek, S.vendt, S.kort);
  klode.saetPol(polVek, S.vendt);
  felt.saetPol(polVek, S.vendt);
  felt.visLinjer(S.linjer);
  felt.visMagnet(S.magnet);
  klode.visAkser(S.akser);
  klode.gennemsigtig(S.magnet);

  const a = aflaes(S.kompas.lat, S.kompas.lon, S.pol.lat, S.pol.lon, S.vendt, S.b0);
  kompas.saet(S.kompas.lat, S.kompas.lon, a.D, kropPos(mod.lat, mod.lon));

  /* knapper */
  const tryk = (id, v) => el(id).setAttribute('aria-pressed', String(v));
  tryk('btn-linjer', S.linjer); tryk('btn-akser', S.akser); tryk('btn-magnet', S.magnet);
  tryk('btn-kort', S.kort); tryk('btn-vend', S.vendt); tryk('btn-drej', S.drej);
  tryk('btn-projektor', S.projektor);
  el('legend').classList.toggle('slukket', !S.kort);
  document.querySelectorAll('.pill[data-sted]').forEach(b =>
    b.setAttribute('aria-pressed', String(b.dataset.sted === S.kompas.id)));
  document.querySelectorAll('.pill[data-aar]').forEach(b =>
    b.setAttribute('aria-pressed', String(
      b.dataset.aar === 'vending' ? S.epoke === 'vending' : (+b.dataset.aar === S.aar && !S.vendt))));

  /* skydere */
  if(S.aar != null) inpAar.value = S.aar;
  inpLat.value = S.pol.lat.toFixed(1);
  inpLon.value = S.pol.lon.toFixed(1);
  el('v-aar').textContent = S.aar != null ? S.aar : (S.epoke === 'vending' ? '−780 000' : '—');
  el('v-lat').textContent = bredde(S.pol.lat);
  el('v-lon').textContent = laengde(S.pol.lon);
  const frit = S.aar == null && S.epoke == null;
  el('knob-lat').classList.toggle('frit', frit);
  el('knob-lon').classList.toggle('frit', frit);

  /* kompasset */
  const stedNavn = S.kompas.navn || 'Valgt sted';
  el('sted-navn').textContent = stedNavn;
  el('sted-koord').textContent = bredde(S.kompas.lat) + ' · ' + laengde(S.kompas.lon);
  kompasMærkat.d.textContent = S.kompas.navn || 'Kompas';

  /* instrumenterne */
  const D = a.D, retning = D >= 0 ? 'øst' : 'vest';
  el('val-misv').innerHTML = dec(Math.abs(D)) + '°<small>' + retning + '</small>';
  el('rose-naal').setAttribute('transform', `rotate(${D.toFixed(1)})`);
  el('sub-misv').innerHTML = Math.abs(D) > 90
    ? 'Nålen peger<br>mod syd'
    : `Nålen peger<br>${retning} for nord`;

  const I = a.I;
  el('val-inkl').innerHTML = dec(Math.abs(I), 0) + '°<small>' + (I >= 0 ? 'ned' : 'op') + '</small>';
  el('inkl-naal').setAttribute('transform', `rotate(${I.toFixed(1)})`);
  el('sub-inkl').innerHTML = I >= 0 ? 'Nordenden<br>dykker ned' : 'Nordenden<br>peger op';

  el('val-felt').innerHTML = dec(a.F, 0) + '<small>µT</small>';
  el('anim-felt').style.width = Math.max(0, Math.min(100, (a.F-20)/50*100)).toFixed(1) + '%';

  const km = afstandKm(kropPos(mod.lat, mod.lon), [0, 1, 0]);
  const vinkel = 90 - Math.abs(S.pol.lat);
  el('val-pol').innerHTML = String(Math.round(km/10)*10).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
    + '<small>km fra Nordpolen</small>';
  el('akse-mag').setAttribute('transform', `rotate(${(S.pol.lat >= 0 ? 1 : -1)*vinkel})`);
  el('sub-pol').innerHTML = dec(vinkel) + '° mellem<br>akserne';

  /* figurens forklaring */
  let tekst, pc = 'var(--pink)';
  if(S.epoke === 'vending'){
    tekst = VENDING.tekst + ': feltet var vendt, og nålen pegede mod syd'; pc = 'var(--grape)';
  } else if(S.aar != null){
    const p = POLSPOR.find(x => x.aar === S.aar);
    if(S.vendt){ tekst = `År ${S.aar} med vendt felt — nålen peger mod syd`; pc = 'var(--grape)'; }
    else tekst = `År ${S.aar} — magnetisk nordpol ved ${bredde(S.pol.lat)}, ${laengde(S.pol.lon)}`
               + (p && p.note ? ` · ${p.note}` : '');
  } else {
    tekst = `Egen placering — magnetisk nordpol ved ${bredde(mod.lat)}, ${laengde(mod.lon)}`;
    pc = 'var(--amber)';
  }
  el('badge-txt').textContent = tekst;
  el('badge').style.setProperty('--pc', pc);

  /* polkortet */
  polkort.tegn({pol: nordlig, nordpol: (S.pol.lat >= 0) !== S.vendt, kompas: S.kompas,
    etiket: S.aar != null ? String(S.aar) : (S.epoke === 'vending' ? '−780 000 ÅR' : 'EGEN PLACERING')});
  el('polkort-sr').textContent =
    `Kort over Arktis. Den magnetiske nordpol er flyttet fra ${bredde(POLSPOR[0].lat)}, ${laengde(POLSPOR[0].lon)} i ${POLSPOR[0].aar} `
    + `til ${bredde(POLSPOR[POLSPOR.length-1].lat)}, ${laengde(POLSPOR[POLSPOR.length-1].lon)} i ${AAR_MAX}.`;

  fortæl(`Kompas i ${stedNavn}: misvisning ${dec(Math.abs(D))} grader ${retning}, `
    + `inklination ${dec(Math.abs(I), 0)} grader ${I >= 0 ? 'nedad' : 'opad'}, feltstyrke ${dec(a.F, 0)} mikrotesla. `
    + `Magnetisk nordpol ${Math.round(km)} kilometer fra den geografiske nordpol.`);
}

/* Skjult besked til skærmlæsere — roligt, ikke for hver skyder-tik. */
let fortælTimer = null;
function fortæl(tekst){
  clearTimeout(fortælTimer);
  fortælTimer = setTimeout(() => { el('live').textContent = tekst; }, 400);
}

/* ── Tilstand i adressen ───────────────────────────────── *
 * #aar=1904&kompas=kbh — eller #pol=60,-40&vendt=1&kompas=55.7,12.6 */
let gemTimer = null;
function gemTilstand(){
  clearTimeout(gemTimer);
  gemTimer = setTimeout(() => {
    const d = [];
    if(S.epoke === 'vending') d.push('epoke=vending');
    else if(S.aar != null) d.push('aar=' + S.aar);
    else d.push(`pol=${S.pol.lat.toFixed(1)},${S.pol.lon.toFixed(1)}`);
    if(S.vendt && S.epoke !== 'vending') d.push('vendt=1');
    d.push('kompas=' + (S.kompas.id || `${S.kompas.lat.toFixed(2)},${S.kompas.lon.toFixed(2)}`));
    if(S.kort) d.push('kort=1');
    history.replaceState(null, '', '#' + d.join('&'));
  }, 250);
}

(function laesTilstand(){
  const q = new URLSearchParams(location.search);
  const h = new URLSearchParams(location.hash.replace(/^#/, ''));
  const hent = k => h.get(k) ?? q.get(k);
  if(hent('epoke') === 'vending') vaelgVending();
  else if(hent('aar')) saetAar(+hent('aar') || AAR_MAX);
  else if(hent('pol')){
    const [la, lo] = hent('pol').split(',').map(Number);
    if(isFinite(la) && isFinite(lo)){
      S.aar = null;
      S.pol = {lat: Math.max(-90, Math.min(90, la)), lon: Math.max(-180, Math.min(180, lo))};
    }
  }
  if(hent('vendt') === '1') S.vendt = true;
  const k = hent('kompas');
  if(k){
    if(STEDER.some(s => s.id === k)) vaelgSted(k, false);
    else {
      const [la, lo] = k.split(',').map(Number);
      if(isFinite(la) && isFinite(lo)) S.kompas = {id: null, navn: null,
        lat: Math.max(-90, Math.min(90, la)), lon: Math.max(-180, Math.min(180, lo))};
    }
  }
  if(hent('kort') === '1') S.kort = true;
  if(q.get('projektor') === '1' || q.get('mode') === 'teach'){
    S.projektor = true; document.body.dataset.projektor = '1';
    requestAnimationFrame(model.tilpasStoerrelse);
  }
  skift();
})();

/* ── Løkken ────────────────────────────────────────────── */
model.naarOpdater(dt => {
  if(S.drej) klode.jord.rotation.y += dt*0.3;
  if(beskidt) tegnTilstand();
  placerMærkater();
});
model.start();

/* Iframe-krom: figuren skal kunne lægges ind på en anden side. */
if(window.top !== window.self){
  document.querySelectorAll('#site-top,.foot,.head').forEach(n => n.style.display = 'none');
  requestAnimationFrame(model.tilpasStoerrelse);
}
