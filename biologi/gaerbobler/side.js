/* ═══════════════════════════════════════════════════════════
   side.js — indgangen.

   Binder DOM'en i gaerbobler.html sammen med modulerne: bygger
   bordet, kører løkken, håndterer at man trækker ting rundt med
   mus, finger eller tastatur, og holder instrumenter, journal og
   adresse ajour.

   Al kode om *knapper og tilstand* hører hjemme her. Alt om
   *fagligheden* hører hjemme i gaering.js, og alt om *figuren* i
   model.js, bord.js, kolbe.js, gaerroer.js og redskaber.js.
   ═══════════════════════════════════════════════════════════ */
import {byggLaerred, blaek, boks, maerkat, tekst} from './model.js';
import {opretPladser, pladsKasse, stativPunkt, spandKasse, BORD_TOP, HYLDE_Y,
        tegnRum, tegnHylde, tegnStativ, tegnPlade, tegnSpand,
        tegnMaal, tegnFokus, tegnSkilt} from './bord.js';
import {REDSKABER, redskabKasse, tegnRedskab} from './redskaber.js';
import {RUM, opretKolbe, opretRoer, opdaterKolbe, opdaterRoer,
        toemKolbe, toemRoer, roerPH, btbNavn} from './gaering.js';
import {K, kolbeKasse, kolbePos, propPunkt,
        tegnKolbe, tegnTermometer, opdaterIndreBobler} from './kolbe.js';
import {roerKasse, tegnRoer, tegnStativRoer, opdaterRoerBobler, STATIV_SKALA} from './gaerroer.js';
import {tegnTrin, tegnJournal, skemaTekst, urTekst, btbKlat} from './journal.js';

const el = id => document.getElementById(id);
const komma = (n, d = 0) => Number(n).toFixed(d).replace('.', ',');
const FARTER = [1, 2, 5, 10, 20, 60];

/* ── Bordet ────────────────────────────────────────────── */
function byggVerden(){
  const pladser = opretPladser();
  const kolber  = [1, 2, 3].map(n => opretKolbe(n - 1, `Kolbe ${n}`));
  const roer    = [0, 1, 2].map(i => { const r = opretRoer(i); r.slot = i; return r; });
  kolber.forEach((k, i) => { const p = pladser[2 + i]; p.kolbe = k; k.plads = p; });
  return {
    tid:0,               /* simuleret tid siden start, s              */
    rt:0,                /* virkelig tid — til korte animationer      */
    fart:FARTER[3],
    kolber, roer, pladser,
    ur:{løber:false, start:0},
    valgt:0,
    haand:null, maaler:null, roerer:null, taelling:null,
    besked:'Bordet er klar',
  };
}

let v = byggVerden();
const forsøgstid = () => v.ur.løber ? v.tid - v.ur.start : 0;
const valgtKolbe = () => v.kolber[v.valgt];

function sig(t){
  v.besked = t;
  el('rig-status').textContent = t;
  el('status').textContent = t;
}

/* ── Hvad man kan gribe fat i ──────────────────────────── *
 * Rækkefølgen er også rækkefølgen, der rammes i: det, der ligger
 * forrest på bordet, prøves først.                                */
function roerPunkt(r){
  return r.paa ? propPunkt(r.paa) : stativPunkt(r.slot);
}
function roerHitKasse(r){
  const p = roerPunkt(r);
  return roerKasse(p.x, p.y, r.paa ? 1 : STATIV_SKALA);
}

function gribelige(){
  const ud = [];
  for(const r of v.roer)      ud.push({slags:'roer', ting:r, navn:`Gærrør ${r.slot + 1}`, kasse:roerHitKasse(r)});
  for(const k of v.kolber)    ud.push({slags:'kolbe', ting:k, navn:k.navn, kasse:kolbeKasse(k)});
  for(const r of REDSKABER)   ud.push({slags:'redskab', ting:r, navn:r.navn, kasse:redskabKasse(r)});
  return ud;
}

/** De modtagere, det, man har i hånden, kan slippes på. */
function maalFor(h){
  const ud = [];
  if(h.slags === 'redskab'){
    if(h.ting.maal.includes('kolbe'))
      for(const k of v.kolber) ud.push({slags:'kolbe', ting:k, navn:k.navn, kasse:kolbeKasse(k)});
    if(h.ting.maal.includes('roer'))
      for(const r of v.roer) if(!r.paa)
        ud.push({slags:'roer', ting:r, navn:`Gærrør ${r.slot + 1}`, kasse:roerHitKasse(r)});
  } else if(h.slags === 'roer'){
    for(const k of v.kolber) if(!k.roer)
      ud.push({slags:'kolbe', ting:k, navn:k.navn, kasse:kolbeKasse(k)});
    for(let i = 0; i < 3; i++){
      const optaget = v.roer.some(r => r !== h.ting && !r.paa && r.slot === i);
      if(!optaget){
        const p = stativPunkt(i);
        ud.push({slags:'slot', ting:i, navn:`Stativets plads ${i + 1}`,
                 kasse:roerKasse(p.x, p.y, STATIV_SKALA)});
      }
    }
  } else if(h.slags === 'kolbe'){
    for(const p of v.pladser) if(!p.kolbe || p.kolbe === h.ting)
      ud.push({slags:'plads', ting:p, navn:p.navn, kasse:pladsKasse(p)});
  }
  /* Kolber og gærrør kan altid hældes ud. */
  if(h.slags === 'kolbe' || h.slags === 'roer')
    ud.push({slags:'spand', ting:null, navn:'Spanden', kasse:spandKasse()});
  return ud;
}

const iKasse = (k, p) => p.x >= k.x0 && p.x <= k.x1 && p.y >= k.y0 && p.y <= k.y1;
const find = (liste, p) => liste.find(o => iKasse(o.kasse, p)) || null;

/* En kolbe sættes der, hvor dens bund havner — ikke der, hvor
   markøren er. Man sigter med kolben, ikke med musen. */
function slipPunkt(h){
  if(!h.pos) return null;
  return h.slags === 'kolbe'
    ? {x:h.pos.x - h.dx, y:h.pos.y - h.dy}
    : h.pos;
}
const underHaanden = h => { const p = slipPunkt(h); return p ? find(maalFor(h), p) : null; };

/* ── At gøre noget ─────────────────────────────────────── */
function tag(o){
  v.haand = {...o};
  /* Vinket om, hvordan man betjener bordet, har gjort sit, når man
     har fat i noget første gang. */
  document.querySelector('.hint')?.remove();
  sig(`I hånden: ${o.navn}`);
}

function læg(){
  if(v.haand && v.haand.slags === 'kolbe') v.haand.ting.hånd = null;
  v.haand = null;
}

/** Returnerer true, hvis handlingen blev udført. */
function slip(m){
  const h = v.haand;
  if(!h) return false;
  if(!m){ sig(`${h.navn} lagt på plads igen`); læg(); return false; }

  if(h.slags === 'redskab'){
    const ctx = {slags:m.slags, verden:v};
    const svar = h.ting.kan(m.ting, ctx);
    if(svar !== true){ sig(svar); læg(); return false; }
    sig(h.ting.brug(m.ting, ctx));
    læg(); return true;
  }

  if(m.slags === 'spand'){
    if(h.slags === 'roer'){
      const r = h.ting;
      if(r.paa){ r.paa.roer = null; r.paa = null; }
      toemRoer(r);
      sig('Gærrøret tømt og skyllet — det står i stativet igen');
      læg(); return true;
    }
    const k = h.ting;
    if(k.roer){ sig('Tag først gærrøret af kolben — proppen skal af, før du kan hælde ud'); læg(); return false; }
    toemKolbe(k);
    sig(`${k.navn} tømt og skyllet — den er klar til at blive brugt forfra`);
    læg(); return true;
  }

  if(h.slags === 'roer'){
    const r = h.ting;
    if(m.slags === 'kolbe'){
      if(r.paa) r.paa.roer = null;
      r.paa = m.ting; m.ting.roer = r;
      sig(r.vand && r.btb
        ? `Gærrør med BTB sat på ${m.ting.navn}`
        : `Gærrøret sat på ${m.ting.navn} — men der mangler vand og BTB i det`);
    } else {
      if(r.paa) r.paa.roer = null;
      r.paa = null; r.slot = m.ting;
      sig('Gærrøret sat tilbage i stativet');
    }
    læg(); return true;
  }

  if(h.slags === 'kolbe'){
    const k = h.ting, p = m.ting;
    if(p !== k.plads){
      if(k.plads) k.plads.kolbe = null;
      p.kolbe = k; k.plads = p;
      sig(p.type === 'plade'
        ? `${k.navn} sat på ${p.navn}${p.temp > RUM ? ` (${Math.round(p.temp)} °C)` : ' — husk at tænde'}`
        : `${k.navn} sat på bordet`);
    }
    læg(); return true;
  }
  læg(); return false;
}

/* ── Løkken ────────────────────────────────────────────── */
const model = byggLaerred({lærred:el('bord'), boks:el('view')});

model.naarSkridt(dtReal => {
  const dt = Math.min(2, dtReal * v.fart);
  v.tid += dt;
  v.rt  += dtReal;

  for(const k of v.kolber){
    const ud = opdaterKolbe(k, dt);
    opdaterIndreBobler(k, dtReal);
    if(!k.roer) continue;
    const hele = opdaterRoer(k.roer, ud, dt);
    opdaterRoerBobler(k.roer, hele, dtReal);
    if(hele > 0) registrerBobler(k, hele);
    registrerBTB(k);
  }

  if(v.taelling && forsøgstid() >= v.taelling.slut) afslutTaelling();
  if(v.maaler && v.rt > v.maaler.til) v.maaler = null;
  if(v.roerer && v.rt > v.roerer.til) v.roerer = null;

  visInstrumenter(dtReal);
});

function registrerBobler(k, hele){
  if(k.foersteBoble === null && v.ur.løber) k.foersteBoble = Math.round(forsøgstid());
  if(v.taelling && v.taelling.kolbe === k) v.taelling.tal += hele;
}

function registrerBTB(k){
  const r = k.roer;
  if(!r || !r.vand || !r.btb || !v.ur.løber) return;
  const pH = roerPH(r);
  if(!k.skift.groen && pH < 7.6) k.skift.groen = Math.round(forsøgstid());
  if(!k.skift.gul   && pH < 6.0) k.skift.gul   = Math.round(forsøgstid());
}

/* ── Tegning ───────────────────────────────────────────── */
model.naarTegn(g => {
  tegnRum(g);
  for(const p of v.pladser) if(p.type === 'plade') tegnPlade(g, p);
  tegnSpand(g);
  tegnHylde(g);
  for(const r of REDSKABER)
    tegnRedskab(g, r, {skygget:v.haand?.ting === r});
  tegnStativ(g);
  for(const r of v.roer)
    if(!r.paa && v.haand?.ting !== r){
      const p = stativPunkt(r.slot);
      tegnStativRoer(g, r, p.x, p.y);
    }

  for(const k of v.kolber){
    tegnKolbe(g, k, {valgt:valgtKolbe() === k, ur:v.rt});
    if(k.roer && v.haand?.ting !== k.roer){
      const p = propPunkt(k);
      tegnRoer(g, k.roer, p.x, p.y, {prop:true});
    }
    if(v.roerer?.kolbe === k) tegnSpatel(g, k);
    if(v.maaler?.kolbe === k) tegnTermometer(g, k);
    if(k.plads) tegnSkilt(g, k.plads.x, BORD_TOP + 24, k.navn, valgtKolbe() === k);
  }

  /* Modtagerne, mens man har noget i hånden */
  if(v.haand){
    const mål = maalFor(v.haand);
    const under = v.haand.pos ? underHaanden(v.haand) : mål[tast.i % Math.max(1, mål.length)];
    for(const m of mål) tegnMaal(g, m.kasse, {aktiv:m === under, puls:v.rt});
  }

  /* Det, tastaturet peger på */
  if(tast.aktiv && document.activeElement === el('bord')){
    const liste = v.haand ? maalFor(v.haand) : gribelige();
    const o = liste[tast.i % Math.max(1, liste.length)];
    if(o) tegnFokus(g, o.kasse);
  }

  /* Det, man har i hånden — kun når det trækkes med markøren */
  if(v.haand?.pos && v.haand.slags === 'redskab'){
    tegnRedskab(g, v.haand.ting, {x:v.haand.pos.x - v.haand.dx, y:v.haand.pos.y - v.haand.dy});
  }
  if(v.haand?.pos && v.haand.slags === 'roer'){
    const r = v.haand.ting;
    tegnRoer(g, r, v.haand.pos.x - v.haand.dx, v.haand.pos.y - v.haand.dy,
             {skala:r.paa ? 1 : STATIV_SKALA, prop:!!r.paa});
  }

  tegnBobletaeller(g);
});

/** Spatlen, mens der bliver rørt rundt. */
function tegnSpatel(g, k){
  const {x, y} = kolbePos(k);
  const f = Math.sin(v.rt * 9) * 0.42;
  g.save();
  g.translate(x, y - K.halsTop + 4);
  g.rotate(f);
  boks(g, -3.5, -26, 7, 120, 3.5);
  blaek(g, '#C9D2D0', 2.2);
  g.restore();
}

/** Tælleren, mens man tæller bobler i ét minut. Den står frit på
    væggen mellem hylden og kolberne, hvor der aldrig er noget andet. */
function tegnBobletaeller(g){
  if(!v.taelling) return;
  const t = v.taelling;
  const tilbage = Math.max(0, t.slut - forsøgstid());
  const x = 520, y = 198, b = 236, h = 54;
  g.save();
  boks(g, x - b / 2, y, b, h, 13);
  blaek(g, '#FFF9EE', 2.8);
  boks(g, x - b / 2 + 3, y + h - 9, (b - 6) * (1 - tilbage / 60), 6, 3);
  blaek(g, '#E8336D', 0);
  maerkat(g, `Tæller · ${t.kolbe.navn}`, x - b / 2 + 14, y + 16,
          {størrelse:10, farve:'#5A6C69', midt:false});
  maerkat(g, `${Math.ceil(tilbage)} s`, x + b / 2 - 32, y + 16,
          {størrelse:10, farve:'#5A6C69'});
  tekst(g, `${t.tal} bobler`, x, y + 34, {størrelse:20});
  g.restore();
}

/* ── Instrumenterne ────────────────────────────────────── */
let siden = 0;
function visInstrumenter(dt){
  siden += dt;
  if(siden < 0.14) return;
  siden = 0;
  const k = valgtKolbe(), r = k.roer;

  el('m-tid').textContent = v.ur.løber ? urTekst(forsøgstid()) : 'Ikke startet';

  el('m-temp-navn').textContent = `Temperatur · ${k.navn.toLowerCase()}`;
  el('m-temp').innerHTML = `${komma(k.temp, 1)}<span class="enhed">°C</span>`;

  /* Instrumentet tæller op — hvor hurtigt det går, må man selv
     måle med tællingen. Det er hele pointen i øvelsen. */
  if(v.taelling && v.taelling.kolbe === k){
    el('m-fart-navn').textContent = 'Tælling i gang';
    el('m-fart').innerHTML = `${v.taelling.tal}<span class="enhed">bobler indtil nu</span>`;
  } else {
    el('m-fart-navn').textContent = `Bobler i alt · ${k.navn.toLowerCase()}`;
    el('m-fart').innerHTML = `${r ? r.talt : 0}<span class="enhed">bobler</span>`;
  }

  if(r && r.vand && r.btb){
    const pH = roerPH(r);
    el('m-btb').innerHTML =
      `<span class="btb-prik" style="--bf:${btbKlat(r)}"></span>${btbNavn(pH)}` +
      `<span class="enhed">pH ${komma(pH, 1)}</span>`;
  } else {
    el('m-btb').innerHTML = `<span class="btb-prik" style="--bf:${btbKlat(r)}"></span>` +
      (r ? (r.vand ? 'Vand uden BTB' : 'Tomt rør') : 'Intet gærrør');
  }

  for(const b of document.querySelectorAll('.fact')){
    const kk = v.kolber[Number(b.dataset.kolbe)];
    b.dataset.note = `${Math.round(kk.temp)} °C`;
  }

  el('btn-taelling').disabled = !v.ur.løber || !!v.taelling;
  opdaterPaneler();
}

/* Panelerne skrives kun om, når der faktisk er noget nyt — ellers
   ville markøren hoppe ud af teksten flere gange i sekundet. */
let sidsteTrin = '', sidsteJournal = '';
function opdaterPaneler(){
  const t = v.kolber.map(k => [k.sukker, k.gaer, k.vand, k.roert,
                               !!k.roer, k.taellinger.length].join()).join('|')
          + v.roer.map(r => `${r.vand}${r.btb}`).join() + v.ur.løber
          + v.kolber.map(k => k.maaltTemp === null ? '-' : Math.round(k.maaltTemp)).join()
          + v.kolber.map(k => `${k.foersteBoble}${k.skift.groen}${k.skift.gul}`).join();
  if(t !== sidsteTrin){
    sidsteTrin = t;
    tegnTrin(el('krop-trin'), v);
  }
  const j = t + v.kolber.map(k => Math.round(k.temp)).join()
              + v.kolber.map(k => k.roer ? btbNavn(roerPH(k.roer)) : '-').join();
  if(j !== sidsteJournal && !el('krop-journal').hidden){
    sidsteJournal = j;
    tegnJournal(el('krop-journal'), v);
    el('btn-kopi').addEventListener('click', kopiérSkema);
  }
}

function kopiérSkema(){
  if(!navigator.clipboard){ sig('Browseren vil ikke lade siden kopiere'); return; }
  navigator.clipboard.writeText(skemaTekst(v))
    .then(() => sig('Skemaet er kopieret — sæt det ind i et regneark'))
    .catch(() => sig('Kunne ikke kopiere skemaet'));
}

/* ── Bobletællingen ────────────────────────────────────── */
function startTaelling(){
  if(!v.ur.løber || v.taelling) return;
  const k = valgtKolbe();
  v.taelling = {kolbe:k, start:Math.round(forsøgstid()), slut:forsøgstid() + 60, tal:0};
  sig(`Tæller bobler fra ${k.navn} i ét minut`);
}

function afslutTaelling(){
  const t = v.taelling;
  v.taelling = null;
  t.kolbe.taellinger.push({tid:t.start, antal:t.tal});
  t.kolbe.taellinger.sort((a, b) => a.tid - b.tid);
  sig(`${t.kolbe.navn}: ${t.tal} bobler/min ved ${urTekst(t.start)}`);
  sidsteJournal = '';
}

/* ── Mus og finger ─────────────────────────────────────── */
const lærred = el('bord');
const rude   = el('view');
let start = null, trækker = false, skub = null;

lærred.addEventListener('pointerdown', ev => {
  lærred.setPointerCapture(ev.pointerId);
  const p = model.tilLogisk(ev);
  tast.aktiv = false;
  if(v.haand){ slip(find(maalFor(v.haand), p)); return; }
  const o = find(gribelige(), p);
  start = o ? {o, p, skærm:{x:ev.clientX, y:ev.clientY}} : null;
  /* Er bordet bredere end skærmen — telefon — så skubber et tag i
     den tomme væg bordet til side. Lærredet har touch-action:none,
     så browseren ruller det ikke selv, mens man trækker i tingene. */
  if(!o && rude.scrollWidth > rude.clientWidth + 1)
    skub = {x:ev.clientX, fra:rude.scrollLeft};
});

lærred.addEventListener('pointermove', ev => {
  if(skub){ rude.scrollLeft = skub.fra - (ev.clientX - skub.x); return; }
  const p = model.tilLogisk(ev);
  if(start && !trækker){
    const d = Math.hypot(ev.clientX - start.skærm.x, ev.clientY - start.skærm.y);
    if(d > 5){
      trækker = true;
      tag(start.o);
      const hjem = hjemPunkt(start.o);
      v.haand.dx = start.p.x - hjem.x;
      v.haand.dy = start.p.y - hjem.y;
      lærred.classList.add('griber');
    }
  }
  if(trækker && v.haand){
    v.haand.pos = p;
    if(v.haand.slags === 'kolbe')
      v.haand.ting.hånd = {x:p.x - v.haand.dx, y:p.y - v.haand.dy};
  }
});

lærred.addEventListener('pointerup', () => {
  lærred.classList.remove('griber');
  if(skub){ skub = null; start = null; return; }
  if(trækker && v.haand){
    slip(underHaanden(v.haand));
  } else if(start && start.o.slags === 'kolbe'){
    vælgKolbe(start.o.ting.id);
  } else if(start && start.o.slags === 'redskab'){
    sig(`${start.o.navn} — træk den ned på ${start.o.ting.maal.includes('roer') ? 'et gærrør' : 'en kolbe'}`);
  }
  start = null; trækker = false;
});

lærred.addEventListener('pointercancel', () => {
  læg(); start = null; trækker = false; skub = null;
  lærred.classList.remove('griber');
});

function hjemPunkt(o){
  if(o.slags === 'redskab') return {x:o.ting.x, y:HYLDE_Y};
  if(o.slags === 'roer')    return roerPunkt(o.ting);
  return kolbePos(o.ting);
}

/* ── Tastatur ──────────────────────────────────────────── *
 * Hele bordet skal kunne betjenes uden mus: piletasterne går
 * gennem tingene, Enter tager op og sætter fra, Esc fortryder.   */
const tast = {i:0, aktiv:false};

lærred.addEventListener('keydown', ev => {
  const liste = v.haand ? maalFor(v.haand) : gribelige();
  if(!liste.length) return;
  if(ev.key === 'ArrowRight' || ev.key === 'ArrowDown'){
    tast.aktiv = true; tast.i = (tast.i + 1) % liste.length;
  } else if(ev.key === 'ArrowLeft' || ev.key === 'ArrowUp'){
    tast.aktiv = true; tast.i = (tast.i - 1 + liste.length) % liste.length;
  } else if(ev.key === 'Enter' || ev.key === ' '){
    tast.aktiv = true;
    const o = liste[tast.i % liste.length];
    if(v.haand) slip(o); else tag(o);
    tast.i = 0;
  } else if(ev.key === 'Escape'){
    if(!v.haand) return;
    læg(); sig('Lagt på plads igen');
  } else return;
  ev.preventDefault();
  /* Sig højt, hvad der nu er under markøren */
  const nu = v.haand ? maalFor(v.haand) : gribelige();
  const o  = nu[tast.i % Math.max(1, nu.length)];
  if(o) el('status').textContent = v.haand ? `Slip på ${o.navn}` : o.navn;
});

lærred.addEventListener('focus', () => { tast.aktiv = true; });
lærred.addEventListener('blur',  () => { tast.aktiv = false; });

/* ── Knapper og skydere ────────────────────────────────── */
function vælgKolbe(i){
  v.valgt = i;
  for(const b of document.querySelectorAll('.fact'))
    b.setAttribute('aria-pressed', String(Number(b.dataset.kolbe) === i));
  history.replaceState(null, '', `#kolbe=${i + 1}`);
  siden = 1;
}

for(const b of document.querySelectorAll('.fact'))
  b.addEventListener('click', () => vælgKolbe(Number(b.dataset.kolbe)));

el('btn-ur').addEventListener('click', () => {
  if(v.ur.løber) return;
  v.ur.løber = true; v.ur.start = v.tid;
  el('btn-ur').disabled = true;
  el('btn-ur').textContent = 'Stopuret kører';
  sig('Stopuret er startet for alle tre kolber');
});

el('btn-taelling').addEventListener('click', startTaelling);

el('btn-pause').addEventListener('click', () => {
  const på = el('btn-pause').getAttribute('aria-pressed') !== 'true';
  el('btn-pause').setAttribute('aria-pressed', String(på));
  model.sætPause(på);
  sig(på ? 'Bordet står stille' : 'Forsøget kører igen');
});

el('btn-nulstil').addEventListener('click', () => {
  v = byggVerden();
  for(const id of ['plade-a', 'plade-b']){ el(id).value = 20; visPlade(id); }
  el('fart').value = 3; v.fart = FARTER[3]; el('v-fart').textContent = '× 10';
  el('btn-ur').disabled = false;
  el('btn-ur').textContent = 'Start stopur';
  sidsteTrin = sidsteJournal = '';
  vælgKolbe(0);
  sig('Bordet er ryddet — forsøget kan begynde forfra');
});

el('btn-projektor').addEventListener('click', () => {
  const på = document.body.dataset.projektor !== '1';
  document.body.dataset.projektor = på ? '1' : '0';
  el('btn-projektor').setAttribute('aria-pressed', String(på));
  model.tilpasStoerrelse();
});

/* Fanebladene i journalruden */
function vælgFane(journal){
  el('fane-trin').setAttribute('aria-pressed', String(!journal));
  el('fane-journal').setAttribute('aria-pressed', String(journal));
  el('krop-trin').hidden = journal;
  el('krop-journal').hidden = !journal;
  sidsteJournal = '';
  opdaterPaneler();
}
el('fane-trin').addEventListener('click', () => vælgFane(false));
el('fane-journal').addEventListener('click', () => vælgFane(true));

/* Varmepladerne. Skyderen er selve pladens knap, så tallet sættes
   direkte ind i bordet her — også når forsøget står på pause. */
function visPlade(id){
  const t = Number(el(id).value);
  const p = v.pladser.find(p => p.id === id);
  if(p) p.temp = t;
  el(id === 'plade-a' ? 'v-plade-a' : 'v-plade-b').innerHTML =
    t <= RUM ? 'Slukket' : `${t}<span class="enhed"> °C</span>`;
}
for(const id of ['plade-a', 'plade-b']){
  el(id).addEventListener('input', () => { visPlade(id); siden = 1; });
  visPlade(id);
}

el('fart').addEventListener('input', () => {
  v.fart = FARTER[Number(el('fart').value)];
  el('v-fart').textContent = `× ${v.fart}`;
});

/* ── Instruksen ────────────────────────────────────────── *
 * Briefingen er det første skærmbillede: et lag over hele siden, så
 * den altid står midt i synsfeltet — uanset hvor langt man er rullet
 * ned. Mens den er åben, gøres siden bagved `inert`, så hverken mus
 * eller tastatur kan famle rundt i et bord, man ikke kan se.
 * Forsøget kører videre bagved — det er "Pause", der stopper tiden,
 * ikke den her.                                                    */
const instruks = el('instruks');
const bagved = ['#site-top', 'main', '.foot'].map(s => document.querySelector(s));

function visInstruks(vis, flytFokus = true){
  instruks.hidden = !vis;
  for(const del of bagved) del?.toggleAttribute('inert', vis);
  if(!flytFokus) return;
  (vis ? el('btn-luk-instruks') : el('btn-instruks')).focus();
}

el('btn-instruks').addEventListener('click', () => visInstruks(true));
el('btn-luk-instruks').addEventListener('click', () => visInstruks(false));
addEventListener('keydown', ev => {
  if(ev.key === 'Escape' && !instruks.hidden) visInstruks(false);
});

/* ── Adresse og start ──────────────────────────────────── */
const søg = new URLSearchParams(location.search);
if(søg.get('projektor') === '1' || søg.get('mode') === 'teach'){
  document.body.dataset.projektor = '1';
  el('btn-projektor').setAttribute('aria-pressed', 'true');
}
const fraHash = /kolbe=([1-3])/.exec(location.hash + location.search);
vælgKolbe(fraHash ? Number(fraHash[1]) - 1 : 0);

/* Instruksen er det første, man møder — men den må ikke rive
   fokus til sig ved indlæsning og rulle siden ned forbi titlen.
   `?instruks=0` springer den over, fx når siden vises i en anden
   sammenhæng, hvor briefingen allerede er givet. */
visInstruks(søg.get('instruks') !== '0', false);

tegnTrin(el('krop-trin'), v);
model.start();
window.tilpasFigur = () => model.tilpasStoerrelse();
