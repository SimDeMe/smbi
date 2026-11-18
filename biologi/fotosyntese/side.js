/* ═══════════════════════════════════════════════════════════
   side.js — simuleringen.

   Binder DOM'en i fotosyntese.html sammen med modellen og
   figuren: klik, træk og tastatur, molekylernes vej gennem
   planten, aflæsningerne, adressefeltet og fokusvisningen.
   Regnestykkerne står i model.js, tegningen i scene.js.

   Opgaverne (trin.js) taler med simuleringen gennem `sim`:
   de lytter på hændelser som 'reaktion' og 'doegn' og bestemmer,
   hvilke dele af sidepanelet der er fremme.
   ═══════════════════════════════════════════════════════════ */
import {tegnMolekyle, MOLEKYLER} from '../faelles/molekyler.js';
import {plop} from '../faelles/fejring.js';
import * as S from './scene.js';
import * as M from './model.js';
import {nyRing} from './reaktion.js';

const el = id => document.getElementById(id);
const svg = el('scene');
const scene = S.byggScene(svg);
const roligt = () => !!window.matchMedia?.('(prefers-reduced-motion:reduce)')?.matches;

/* ── Hændelser til opgaverne ───────────────────────────── */
const lyttere = {};
export const sim = {
  on(navn, fn){ (lyttere[navn] ??= new Set()).add(fn); return () => lyttere[navn].delete(fn); },
  udsend(navn, data){ for (const fn of lyttere[navn] ?? []) fn(data); },
  tilstand:M.tilstand,
  model:M,
};

/* ── Baner: en blød kurve gennem en række punkter ──────── */
function bane(punkter){
  if (punkter.length === 2){
    const [a, b] = punkter;
    punkter = [a, {x:(a.x+b.x)/2 + (Math.random()-0.5)*50, y:(a.y+b.y)/2 - 30 - Math.random()*30}, b];
  }
  const P = [punkter[0], ...punkter, punkter[punkter.length-1]];
  const pts = [];
  for (let i=1;i<P.length-2;i++){
    const [p0,p1,p2,p3] = [P[i-1],P[i],P[i+1],P[i+2]];
    for (let s=0;s<12;s++){
      const t = s/12, t2 = t*t, t3 = t2*t;
      pts.push({
        x:0.5*((2*p1.x) + (-p0.x+p2.x)*t + (2*p0.x-5*p1.x+4*p2.x-p3.x)*t2 + (-p0.x+3*p1.x-3*p2.x+p3.x)*t3),
        y:0.5*((2*p1.y) + (-p0.y+p2.y)*t + (2*p0.y-5*p1.y+4*p2.y-p3.y)*t2 + (-p0.y+3*p1.y-3*p2.y+p3.y)*t3),
      });
    }
  }
  pts.push(punkter[punkter.length-1]);
  const laengde = [0];
  for (let i=1;i<pts.length;i++)
    laengde.push(laengde[i-1] + Math.hypot(pts[i].x-pts[i-1].x, pts[i].y-pts[i-1].y));
  return {pts, laengde, total:laengde[laengde.length-1]};
}
function paaBane(b, u){
  const maal = u * b.total;
  let i = 1;
  while (i < b.laengde.length-1 && b.laengde[i] < maal) i++;
  const a = b.laengde[i-1], d = (b.laengde[i] - a) || 1;
  const f = (maal - a)/d;
  return {x:b.pts[i-1].x + (b.pts[i].x - b.pts[i-1].x)*f, y:b.pts[i-1].y + (b.pts[i].y - b.pts[i-1].y)*f};
}

/* ── Molekyler, der er på vej et sted hen ──────────────── */
const flyvende = [];

function nyFlugt(node, punkter, {fart=560, min=0.45, maks=2.6, naarFremme} = {}){
  const b = bane(punkter);
  const tid = Math.max(min, Math.min(maks, b.total/fart));
  flyt(node, punkter[0].x, punkter[0].y);
  flyvende.push({node, b, tid, t:0, naarFremme});
}

function flyt(node, x, y, skala){
  node.setAttribute('transform','translate('+x.toFixed(1)+','+y.toFixed(1)+')'+(skala ? ' scale('+skala+')' : ''));
}

function flytFlyvende(dt){
  for (let i=flyvende.length-1;i>=0;i--){
    const f = flyvende[i];
    f.t += dt;
    const u = Math.min(1, f.t/f.tid);
    const e = u<0.5 ? 2*u*u : 1-Math.pow(-2*u+2,2)/2;
    const p = paaBane(f.b, e);
    flyt(f.node, p.x, p.y);
    if (u >= 1){
      flyvende.splice(i,1);
      f.naarFremme?.();
    }
  }
}

function nyToken(type, x, y, klasse){
  const g = tegnMolekyle(type, {navn:type !== 'glukose'});
  if (klasse) g.classList.add(klasse);
  flyt(g, x, y);
  scene.lag.molekyler.appendChild(g);
  return g;
}

function udtoning(g){
  g.animate?.([{opacity:1},{opacity:0}],{duration:380,fill:'forwards'});
  setTimeout(() => g.remove(), 390);
}

/* Et molekyle, der forlader cellen gennem spalteåbningerne. */
function sendUd(type, fra){
  if (flyvende.length > 150) return;
  const g = nyToken(type, fra.x, fra.y, 'flyver');
  nyFlugt(g, S.VEJ.ud(scene.geometri(), fra, S.luftPos()), {fart:480, maks:2.4, naarFremme:() => udtoning(g)});
}

/* ── Råvarerne i luften og i jorden ────────────────────── */
const puljen = [];

function etiket(type){
  return MOLEKYLER[type].navn+' '+MOLEKYLER[type].formel+' '+MOLEKYLER[type].hvor+
         ' — klik for at sende det ind i bladet, eller træk det derind';
}

function lavKort(kort){
  const node = nyToken(kort.type, kort.hjem.x, kort.hjem.y, 'pulje');
  node.setAttribute('tabindex','0');
  node.setAttribute('role','button');
  node.setAttribute('aria-label', etiket(kort.type));
  kort.node = node; kort.ledig = true;
  bindGreb(kort);
}

function byggPulje(){
  for (const p of puljen) p.node?.remove();
  puljen.length = 0;
  for (const type of ['co2','h2o']){
    S.PLADSER[type].forEach(([x,y]) => {
      const kort = {type, hjem:{x,y}};
      lavKort(kort);
      puljen.push(kort);
    });
  }
  visPulje();
}

function visPulje(){
  const vist = M.tilstand.modus === 'traek';
  for (const p of puljen){
    p.node.style.display = vist ? '' : 'none';
    if (vist && p.ledig) p.node.setAttribute('tabindex','0');
    else p.node.removeAttribute('tabindex');
  }
}

/* Pladsen fyldes op igen, så der altid ligger seks af hver. */
function genopfyld(kort){
  kort.ledig = false;
  setTimeout(() => {
    lavKort(kort);
    if (M.tilstand.modus !== 'traek') kort.node.style.display = 'none';
    kort.node.animate?.([{opacity:0, transform:kort.node.getAttribute('transform')+' scale(.4)'},
                         {opacity:1, transform:kort.node.getAttribute('transform')}],{duration:320});
  }, 650);
}

/* ── Træk og slip ──────────────────────────────────────── */
const punkt = svg.createSVGPoint();
function tilScene(e){
  punkt.x = e.clientX; punkt.y = e.clientY;
  return punkt.matrixTransform(svg.getScreenCTM().inverse());
}
const iZone = (z,p) => {
  const x = +z.getAttribute('x'), y = +z.getAttribute('y');
  return p.x >= x && p.x <= x + +z.getAttribute('width') &&
         p.y >= y && p.y <= y + +z.getAttribute('height');
};

let traek = null;
const SLOER = 6;

/* Et klik sender molekylet ind i bladet af sig selv, et træk lader
   eleven selv føre det derind. Først når pegeren har flyttet sig mere
   end nogle få pixels, bliver det til et træk. */
function bindGreb(kort){
  const node = kort.node;
  node.addEventListener('pointerdown', e => {
    if (!kort.ledig || M.tilstand.modus !== 'traek') return;
    e.preventDefault();
    const i = flyvende.findIndex(f => f.node === node);
    if (i >= 0) flyvende.splice(i,1);
    scene.lag.molekyler.appendChild(node);
    node.setPointerCapture(e.pointerId);
    traek = {kort, id:e.pointerId, x0:e.clientX, y0:e.clientY, traekker:false};
  });
  node.addEventListener('pointermove', e => {
    if (!traek || traek.id !== e.pointerId) return;
    if (!traek.traekker){
      if (Math.hypot(e.clientX-traek.x0, e.clientY-traek.y0) < SLOER) return;
      traek.traekker = true;
      node.classList.add('traekkes');
      visZoner(true);
    }
    const p = tilScene(e);
    flyt(node, p.x, p.y, 1.15);
    for (const z of Object.values(scene.zoner)) z.classList.toggle('over', iZone(z,p));
  });
  const slip = e => {
    if (!traek || traek.id !== e.pointerId) return;
    const traekker = traek.traekker;
    traek = null;
    if (!traekker){ sendInd(kort, kort.hjem); return; }
    const p = tilScene(e);
    node.classList.remove('traekkes');
    visZoner(false);
    if (iZone(scene.zoner.celle, p)) sendInd(kort, p, 'celle');
    else if (iZone(scene.zoner.plante, p)) sendInd(kort, p, 'plante');
    else nyFlugt(node, [p, kort.hjem], {min:0.3, maks:0.5});
  };
  node.addEventListener('pointerup', slip);
  node.addEventListener('pointercancel', slip);
  node.addEventListener('keydown', e => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    sendInd(kort, kort.hjem);
  });
}

function visZoner(til){
  for (const z of Object.values(scene.zoner)){
    z.classList.toggle('aktiv', til);
    if (!til) z.classList.remove('over');
  }
}

function sendInd(kort, fra, hvor){
  const type = kort.type;
  if (!M.erPlads(type)){
    const anden = type === 'co2' ? 'h2o' : 'co2';
    besked(M.tilstand[anden] + M.paaVej[anden] < 6
      ? 'Kloroplasten har allerede 6 '+MOLEKYLER[type].formel+' — den mangler '+MOLEKYLER[anden].formel+'.'
      : 'Kloroplasten er fuld. Tryk på «Udfør fotosyntese».', true);
    nyFlugt(kort.node, [fra, kort.hjem], {min:0.3, maks:0.5});
    sim.udsend('fuld', type);
    return;
  }
  const node = kort.node;
  node.classList.add('flyver');
  node.classList.remove('pulje');
  node.removeAttribute('tabindex');
  genopfyld(kort);
  flyvTilPlads(type, node, fra, hvor);
}

/* Fælles vej for elevens molekyler og modellens egne. */
function flyvTilPlads(type, node, fra, hvor){
  const i = M.tilstand[type] + M.paaVej[type];
  M.reserver(type);
  const til = S.slotPos(type, Math.min(i,5));
  const geo = scene.geometri();
  let vej;
  if (hvor === 'celle') vej = [fra, til];
  else if (hvor === 'plante') vej = [fra, geo.anker, S.MAAL[type === 'co2' ? 'portLuft' : 'portVand'], til];
  else vej = S.VEJ[type](geo, fra, til);
  /* Modellens egne molekyler flyver på samme tid som i første udgave
     (0,9–1,15 s). I automatisk tilstand venter modellen på, at de lander,
     så en længere flyvetid ville sænke fotosyntesens fart. */
  const tider = hvor === 'auto' ? {fart:620, min:0.9, maks:1.15} : {fart:type === 'h2o' ? 620 : 540, maks:2.3};
  nyFlugt(node, vej, {...tider, naarFremme:() => {
    M.frigiv(type);
    const svar = M.modtag(type);
    node.remove();
    if (!svar.ok) return;
    plop();
    scene.saetSlots(M.tilstand.co2, M.tilstand.h2o);
    sim.udsend('molekyle', type);
    if (svar.reaktion) fotosyntese();
    else if (M.tilstand.co2 === 6 && M.tilstand.h2o === 6){
      if (M.klarTilReaktion()) besked('6 CO₂ og 6 H₂O er samlet — tryk på «Udfør fotosyntese».', true);
      else { besked('6 CO₂ og 6 H₂O er klar — men kloroplasten mangler lys.', true); sim.udsend('fuld-i-moerke'); }
    }
  }});
}

function nytRaastof(type){
  if (flyvende.length > 150) return;
  const fra = type === 'co2' ? S.luftPos() : S.jordPos();
  const node = nyToken(type, fra.x, fra.y, 'flyver');
  flyvTilPlads(type, node, fra, 'auto');
}

/* ── De to processer, når de sker ──────────────────────── */
let fotoBlink = 0, respBlink = 0;
let ring = null;
let ventendeVaekst = 0;

function fotosyntese(){
  fotoBlink = 3;
  sim.udsend('reaktion');
  const kl = S.kloroplastPos();
  if (ring){ udbytte(kl, null); return; }
  const start = [];
  for (let i=0;i<6;i++){
    start.push({type:'co2', fra:S.slotPos('co2',i)});
    start.push({type:'h2o', fra:S.slotPos('h2o',i)});
  }
  scene.saetSlots(0,0);
  ring = nyRing(scene.lag.effekter, kl, start, pladser => { ring = null; udbytte(kl, pladser); },
                {lysFra:{x:S.MAAL.celle.x + 70, y:S.MAAL.celle.y + 4}, grana:S.granaPos()});
}

function udbytte(kl, pladser){
  scene.blink('foto');
  const steder = pladser ?? Array.from({length:6}, () => kl);
  steder.forEach((p, i) => setTimeout(() => sendUd('o2', p), i*80));
  const g = nyToken('glukose', kl.x, kl.y, 'flyver');
  nyFlugt(g, [kl, S.lagerPos(M.tilstand.lager-1)], {min:0.7, maks:0.9, naarFremme:() => {
    g.remove();
    scene.saetLager(M.tilstand.lager);
  }});
}

function respiration(fra){
  respBlink = 1.6;
  sim.udsend('respiration', fra);
  const mi = S.mitokondriePos();
  const geo = scene.geometri();
  scene.saetLager(M.tilstand.lager);
  const g = nyToken('glukose', 0, 0, 'flyver');
  const vej = fra === 'lager' ? [S.lagerPos(M.tilstand.lager), mi] : S.VEJ.fraPlante(geo, mi);
  nyFlugt(g, vej, {min:0.7, maks:1.6, naarFremme:() => g.remove()});
  for (let i=0;i<6;i++) setTimeout(() => {
    const o = nyToken('o2', 0, 0, 'flyver');
    nyFlugt(o, S.VEJ.iltInd(scene.geometri(), S.luftPos(), mi), {fart:620, maks:1.5, naarFremme:() => o.remove()});
  }, i*60);
  setTimeout(() => {
    scene.blink('mito');
    scene.energi();
    for (let i=0;i<6;i++){
      setTimeout(() => sendUd('co2', mi), i*70);
      setTimeout(() => sendUd('h2o', mi), i*70+35);
    }
  }, 1300);
}

function vaekst(){
  ventendeVaekst++;
  const fra = S.lagerPos(M.tilstand.lager);
  scene.saetLager(M.tilstand.lager);
  const g = nyToken('glukose', fra.x, fra.y, 'flyver');
  nyFlugt(g, S.VEJ.vaekst(scene.geometri(), fra), {fart:520, maks:1.8, naarFremme:() => {
    ventendeVaekst = Math.max(0, ventendeVaekst-1);
    udtoning(g);
  }});
}

let sidsteDoegn = M.tilstand.doegn;
function haandter(haendelser){
  for (const h of haendelser){
    if (h.type === 'behov')            nytRaastof(h.molekyle);
    else if (h.type === 'reaktion')    fotosyntese();
    else if (h.type === 'respiration') respiration(h.fra);
    else if (h.type === 'vaekst')      vaekst();
    else if (h.type === 'sult')        besked('Planten har hverken glukose eller biomasse tilbage at forbrænde.', true);
  }
  if (M.tilstand.doegn !== sidsteDoegn){
    sidsteDoegn = M.tilstand.doegn;
    sim.udsend('doegn', sidsteDoegn);
  }
}

/* ── Aflæsningerne ─────────────────────────────────────── */
const felter = {
  bpp:el('val-bpp'), r:el('val-r'), npp:el('val-npp'), lager:el('val-lager'), biomasse:el('val-biomasse'),
  bBpp:el('bar-bpp'), bR:el('bar-r'), bNpp:el('bar-npp'),
  tid:el('val-tid'), lys:el('val-lys'), temp:el('val-temp'),
  standFoto:el('stand-foto'), standResp:el('stand-resp'),
  lignFoto:el('lign-foto'), lignResp:el('lign-resp'),
};
const sliderTid = el('slider-tid'), sliderLys = el('slider-lys'), sliderTemp = el('slider-temp');
const btnFoto = el('btn-foto');

export const klokkeslet = t => {
  const timer = Math.floor(t) % 24;
  const min = Math.round((t - Math.floor(t))*60);
  return String(timer).padStart(2,'0')+':'+String(min === 60 ? 0 : min).padStart(2,'0');
};
export const medFortegn = n => (n > 0 ? '+' : n < 0 ? '−' : '') + Math.abs(n);

let visBiomasse = M.tilstand.biomasse, tegnetBiomasse = -1, tegnetSulten = null;
const tekstCache = new Map();
function saetTekst(node, s){ if (tekstCache.get(node) !== s){ node.textContent = s; tekstCache.set(node, s); } }

function opdaterUdseende(dt){
  const t = M.tilstand;
  const lys = M.lysNu();
  scene.saetHimmel(M.solHoejde(), t.lysstyrke, t.klokken, lys);
  scene.saetUr('Døgn '+t.doegn+' · '+klokkeslet(t.klokken));

  /* planten vokser glidende hen mod biomassen — og venter med det
     sidste stykke, til glukosen faktisk er nået frem */
  const maal = Math.max(0, t.biomasse - ventendeVaekst);
  const fart = roligt() ? 100 : 2.2;
  visBiomasse += Math.sign(maal - visBiomasse) * Math.min(Math.abs(maal - visBiomasse), fart*dt);
  const sulten = t.biomasse === 0 && t.lager === 0;
  if (Math.abs(visBiomasse - tegnetBiomasse) > 0.01 || sulten !== tegnetSulten){
    scene.tegnPlante(visBiomasse, sulten);
    tegnetBiomasse = visBiomasse; tegnetSulten = sulten;
  }

  const skala = Math.max(10, Math.ceil(Math.max(t.bpp, t.r)/10)*10);
  const npp = M.npp();
  saetTekst(felter.bpp, String(t.bpp));
  saetTekst(felter.r, String(t.r));
  saetTekst(felter.npp, medFortegn(npp));
  saetTekst(felter.lager, String(t.lager));
  saetTekst(felter.biomasse, String(t.biomasse));
  felter.bBpp.style.width = (100*t.bpp/skala).toFixed(1)+'%';
  felter.bR.style.width = (100*t.r/skala).toFixed(1)+'%';
  const halv = Math.min(50, 50*Math.abs(npp)/skala);
  felter.bNpp.style.width = halv.toFixed(1)+'%';
  felter.bNpp.style.left = (npp < 0 ? 50-halv : 50).toFixed(1)+'%';
  felter.bNpp.classList.toggle('negativ', npp < 0);

  saetTekst(felter.tid, klokkeslet(t.klokken));
  if (document.activeElement !== sliderTid) sliderTid.value = t.klokken.toFixed(2);

  const manuel = t.modus === 'traek';
  const klar = M.klarTilReaktion();
  btnFoto.disabled = !manuel || !klar;
  btnFoto.classList.toggle('klar', manuel && klar);
  saetTekst(btnFoto, manuel ? 'Udfør fotosyntese' : 'Kører automatisk');

  const koererFoto = fotoBlink > 0 || (t.modus === 'auto' && lys > 0.02 && t.urKoerer);
  felter.lignFoto.dataset.aktiv = koererFoto ? 'true' : 'false';
  saetTekst(felter.standFoto,
    koererFoto ? 'Kører' : lys <= 0.02 ? 'Venter på lys' : manuel && klar ? 'Klar' : 'Venter på råstoffer');
  const braendstof = t.lager > 0 || t.biomasse > 0;
  const koererResp = respBlink > 0 || (t.urKoerer && braendstof);
  felter.lignResp.dataset.aktiv = koererResp ? 'true' : 'false';
  saetTekst(felter.standResp, !braendstof ? 'Intet at forbrænde' : (koererResp ? 'Kører' : 'Hviler'));
}

/* ── Skjult opsummering til skærmlæsere ────────────────── */
let srUr = 0;
function fortael(){
  const t = M.tilstand;
  el('sr-status').textContent =
    'Klokken '+klokkeslet(t.klokken)+', '+(M.erLyst() ? 'lyst' : 'mørkt')+'. '+
    'Kloroplasten har '+t.co2+' af 6 kuldioxid og '+t.h2o+' af 6 vand. '+
    (t.modus === 'traek' && M.klarTilReaktion() ? 'Seks af hver er samlet — tryk på knappen Udfør fotosyntese. ' : '')+
    'Glukose i cellen '+t.lager+', plantens biomasse '+t.biomasse+'.';
}

/* ── Figurteksten under figuren ────────────────────────── */
const figurtekst = el('figurtekst');
let standardTekst = figurtekst.innerHTML;
let beskedUr = 0;
export function besked(tekst, vigtig){
  clearTimeout(beskedUr);
  figurtekst.textContent = tekst;
  figurtekst.classList.toggle('vigtig', !!vigtig);
  beskedUr = setTimeout(() => {
    figurtekst.innerHTML = standardTekst;
    figurtekst.classList.remove('vigtig');
  }, 5200);
}
sim.saetStandardTekst = html => {
  standardTekst = html;
  clearTimeout(beskedUr);
  figurtekst.innerHTML = html;
  figurtekst.classList.remove('vigtig');
};
sim.besked = besked;

/* ── Betjening ─────────────────────────────────────────── */
function saetModus(modus, stille){
  M.tilstand.modus = modus;
  el('btn-traek').setAttribute('aria-pressed', modus === 'traek' ? 'true' : 'false');
  el('btn-auto').setAttribute('aria-pressed', modus === 'auto' ? 'true' : 'false');
  visPulje();
  if (modus === 'auto' && M.tjekReaktion()) fotosyntese();
  if (!stille) besked(modus === 'auto'
    ? 'Nu leverer modellen selv CO₂ og H₂O — lys og temperatur bestemmer farten.'
    : 'Klik 6 CO₂ og 6 H₂O ind i bladet, og tryk så på «Udfør fotosyntese».');
  sim.udsend('modus', modus);
  gemTilstand();
}
sim.saetModus = saetModus;

function saetUr(koerer){
  M.tilstand.urKoerer = koerer;
  const b = el('btn-ur');
  b.setAttribute('aria-pressed', koerer ? 'true' : 'false');
  b.innerHTML = koerer ? '<span aria-hidden="true">❚❚</span> Pause' : '<span aria-hidden="true">▶</span> Start døgnet';
  sim.udsend('ur', koerer);
  gemTilstand();
}
sim.saetUr = saetUr;

el('btn-traek').addEventListener('click', () => saetModus('traek'));
el('btn-auto').addEventListener('click', () => saetModus('auto'));
el('btn-ur').addEventListener('click', () => saetUr(!M.tilstand.urKoerer));
btnFoto.addEventListener('click', () => {
  if (!M.udfoerReaktion()) return;
  fotosyntese();
});

function nulstil(){
  M.nulstil();
  for (const f of flyvende) f.node.remove();
  flyvende.length = 0;
  ring?.ryd();
  ring = null;
  ventendeVaekst = 0;
  visBiomasse = M.tilstand.biomasse;
  sidsteDoegn = M.tilstand.doegn;
  scene.saetSlots(0,0);
  scene.saetLager(0);
  byggPulje();
  sim.udsend('nulstil');
  gemTilstand();
}
sim.nulstil = nulstil;
el('btn-nulstil').addEventListener('click', () => { nulstil(); besked('Planten og regnskabet er nulstillet.'); });

sliderTid.addEventListener('input', e => {
  M.tilstand.klokken = parseFloat(e.target.value) % 24;
  efterAendring();
});
sliderLys.addEventListener('input', e => {
  M.tilstand.lysstyrke = parseInt(e.target.value,10);
  felter.lys.textContent = M.tilstand.lysstyrke;
  efterAendring();
});
sliderTemp.addEventListener('input', e => {
  M.tilstand.temperatur = parseInt(e.target.value,10);
  felter.temp.textContent = M.tilstand.temperatur;
  gemTilstand();
});
function efterAendring(){
  if (M.tjekReaktion()) fotosyntese();
  sim.udsend('lys', M.erLyst());
  gemTilstand();
}

/* ── Sidepanelets dele ─────────────────────────────────── */
sim.visDele = navne => {
  for (const d of document.querySelectorAll('[data-del]'))
    d.hidden = !(navne === 'alle' || navne.includes(d.dataset.del));
  tilpas();
};

/* ── Fokusvisning ──────────────────────────────────────── */
const btnFokus = el('btn-fokus');
function saetFokus(til){
  document.body.classList.toggle('fokus', til);
  btnFokus.setAttribute('aria-pressed', til ? 'true' : 'false');
  tilpas();
}
btnFokus.addEventListener('click', () => saetFokus(!document.body.classList.contains('fokus')));
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && document.body.classList.contains('fokus') && !document.querySelector('dialog[open]')) saetFokus(false);
});

/* ── Figurens størrelse ────────────────────────────────────
   Figuren må fylde, hvad der er tilbage af skærmens højde, når
   alt over den og figurteksten under den er trukket fra. Siden
   rulles ikke med i målingen, så tallet er det samme hver gang. */
const figurFelt = el('figur');
const tekstLinje = el('figurlinje');
function tilpas(){
  const top = figurFelt.getBoundingClientRect().top + scrollY;
  const rest = innerHeight - top - tekstLinje.offsetHeight - 22;
  document.documentElement.style.setProperty('--fig-h', Math.max(250, Math.round(rest)) + 'px');
}
addEventListener('resize', tilpas);
document.fonts?.ready.then(tilpas);
/* Sidepanelet må ikke blive højere end figursøjlen — så ruller det
   selv, og figuren bliver stående på skærmen. */
const figurside = document.querySelector('.figurside');
new ResizeObserver(() => {
  document.documentElement.style.setProperty('--kol-h', Math.round(figurside.getBoundingClientRect().height) + 'px');
}).observe(figurside);
sim.tilpas = tilpas;

/* ── Deling: indstillingerne ligger i adressen ─────────── */
let hashUr = 0, hashSidste = '';
function tilstandStreng(){
  const t = M.tilstand;
  return '#modus='+t.modus+'&kl='+t.klokken.toFixed(1)+'&lys='+t.lysstyrke+
         '&temp='+t.temperatur+'&ur='+(t.urKoerer ? 1 : 0);
}
function gemTilstand(){
  const h = tilstandStreng();
  if (h === hashSidste) return;
  hashSidste = h;
  clearTimeout(hashUr);
  hashUr = setTimeout(() => { if (location.hash !== h) history.replaceState(null,'',location.pathname+location.search+h); }, 500);
}
function laesTilstand(){
  const p = new URLSearchParams(location.search);
  new URLSearchParams(location.hash.replace(/^#/,'')).forEach((v,k) => p.set(k,v));
  const tal = (raa, min, max) => {
    const v = parseFloat(raa);
    return Number.isFinite(v) ? Math.max(min, Math.min(max, v)) : null;
  };
  const modus = p.get('modus');
  if (modus === 'auto' || modus === 'traek') M.tilstand.modus = modus;
  const kl = tal(p.get('kl'), 0, 24), lys = tal(p.get('lys'), 0, 100), temp = tal(p.get('temp'), 0, 40);
  if (kl !== null) M.tilstand.klokken = kl % 24;
  if (lys !== null) M.tilstand.lysstyrke = Math.round(lys/5)*5;
  if (temp !== null) M.tilstand.temperatur = Math.round(temp);
  sliderTid.value = M.tilstand.klokken;
  sliderLys.value = M.tilstand.lysstyrke;
  sliderTemp.value = M.tilstand.temperatur;
  felter.lys.textContent = M.tilstand.lysstyrke;
  felter.temp.textContent = M.tilstand.temperatur;
  saetModus(M.tilstand.modus, true);
  saetUr(p.get('ur') === '1');
  if (/mode=teach|projektor=1|fokus=1/.test(location.search)) saetFokus(true);
  hashSidste = tilstandStreng();
}

/* ── Løkken ────────────────────────────────────────────── */
let sidst = performance.now();
function loep(nu){
  const dt = Math.min(0.1, (nu - sidst)/1000);
  sidst = nu;
  if (M.tilstand.urKoerer) haandter(M.opdater(dt * M.K.timerPrSekund));
  flytFlyvende(dt);
  ring?.opdater(dt);
  scene.opdater(dt);
  fotoBlink = Math.max(0, fotoBlink - dt);
  respBlink = Math.max(0, respBlink - dt);
  opdaterUdseende(dt);
  srUr += dt;
  if (srUr > 4){ srUr = 0; fortael(); }
  requestAnimationFrame(loep);
}

/* ── Start ─────────────────────────────────────────────── */
scene.tegnPlante(M.tilstand.biomasse, false);
scene.saetSlots(0,0);
scene.saetLager(0);
byggPulje();
laesTilstand();
tilpas();
fortael();
requestAnimationFrame(loep);
