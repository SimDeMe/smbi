/* ─────────────────────────────────────────────────────────
   Flashkort til førstehjælpseksamen — siden selv.

   To tilstande i det samme panel: oversigten over de 24
   spørgsmål, og træningen af ét emnes tre kort. Emnerne er
   fagdata og bor i ./emner/ — én fil pr. spørgsmål.
   ───────────────────────────────────────────────────────── */
import emner from './emner.js';

/* Lyse toner til svarets blokke — farve er aldrig eneste signal,
   hver blok har også sin overskrift. */
const TONER = {
  coral:'#FFD9C9', lilla:'#E2D6F8', groen:'#D6EFC4',
  blaa:'#C7E6F6',  gul:'#FFEFC2',   obs:'#fff'
};
/* Fast farve pr. kort i et emne: hvad — hvad man ser — hvad man gør */
const KORTFARVER = ['var(--coral)','var(--grape)','var(--lime)'];
const GRUPPEFARVER = {
  'Sygdom':'#FFD9C9', 'Skade':'#C7E6F6',
  'Metode':'#D6EFC4', 'Krop':'#E2D6F8'
};

const el = {
  oversigt : document.getElementById('oversigt'),
  emner    : document.getElementById('emner'),
  traening : document.getElementById('traening'),
  bunke    : document.getElementById('bunke'),
  facts    : document.getElementById('facts'),
  trin     : document.getElementById('trin'),
  titel    : document.getElementById('rig-titel'),
  taeller  : document.getElementById('taeller'),
  opgave   : document.getElementById('opgave'),
  opgaveTxt: document.getElementById('opgave-tekst'),
  sr       : document.getElementById('sr-status'),
  hjem     : document.getElementById('btn-hjem'),
  forrige  : document.getElementById('btn-forrige'),
  naeste   : document.getElementById('btn-naeste'),
  vend     : document.getElementById('btn-vend')
};

let emne  = null;   // det emne, der trænes — null betyder oversigt
let aktiv = 1;      // hvilket af emnets kort der ligger øverst
let vendt = false;  // ligger svarsiden opad?

/* ── Oversigten ──────────────────────────────────────────── */
function bygOversigt(){
  el.emner.textContent = '';
  emner.forEach(function(e){
    const knap = document.createElement('button');
    knap.type = 'button';
    knap.className = 'emne';
    knap.style.setProperty('--gc', GRUPPEFARVER[e.gruppe] || 'var(--paper-2)');
    knap.innerHTML =
      '<span class="emne-top">' +
        '<span class="nr">' + e.nr + '</span>' +
        '<span class="gruppe">' + e.gruppe + '</span>' +
      '</span>' +
      '<h3></h3><p></p>';
    knap.querySelector('h3').textContent = e.emne;
    knap.querySelector('p').textContent  = e.kort.map(function(k){ return k.titel; }).join(' · ');
    knap.addEventListener('click', function(){ aabn(e.id, 1); });
    el.emner.appendChild(knap);
  });
}

/* ── Ét kort bygges op af sin fagdata ────────────────────── */
function bygKort(e, nr){
  const data = e.kort[nr - 1];
  const kort = document.createElement('article');
  kort.className = 'kort';
  kort.style.setProperty('--kc', KORTFARVER[nr - 1] || 'var(--accent)');

  const forside = document.createElement('div');
  forside.className = 'side forside';
  forside.innerHTML =
    '<span class="kort-nr mono"><span class="pil"></span>Kort ' + nr + ' af ' + e.kort.length + '</span>' +
    '<p class="sp"></p>' +
    '<span class="vink">Svar højt — vend så kortet</span>';
  forside.querySelector('.sp').textContent = data.spm;

  const bagside = document.createElement('div');
  bagside.className = 'side bagside';
  const hoved = document.createElement('span');
  hoved.className = 'kort-nr mono';
  hoved.innerHTML = '<span class="pil"></span>';
  hoved.append('Kort ' + nr + ' · svar i stikord');
  bagside.appendChild(hoved);

  const svar = document.createElement('div');
  svar.className = 'svar';
  data.svar.forEach(function(b){
    const blok = document.createElement('div');
    blok.className = 'blok' + (b.tone === 'obs' ? ' obs' : '');
    blok.style.setProperty('--lc', TONER[b.tone] || '#fff');
    const h = document.createElement('h3');
    h.textContent = b.h;
    const ul = document.createElement('ul');
    b.punkter.forEach(function(p){
      const li = document.createElement('li');
      li.innerHTML = p;          /* fagdata er vores egne filer — <b> er tilladt */
      ul.appendChild(li);
    });
    blok.append(h, ul);
    svar.appendChild(blok);
  });
  bagside.appendChild(svar);

  kort.append(forside, bagside);
  kort.addEventListener('click', function(){
    /* markerer man tekst i svaret, er det ikke et klik på kortet */
    if(String(getSelection ? getSelection() : '').length) return;
    vendKort();
  });
  return kort;
}

/* Kortets højde følger den side, der vender opad. Så vokser siden
   under et langt svar i stedet for at kortet får sin egen rulning. */
function maalHoejde(){
  const kort = el.bunke.firstElementChild;
  if(!kort) return;
  const side = kort.querySelector(vendt ? '.bagside' : '.forside');
  kort.style.setProperty('--h', Math.ceil(side.getBoundingClientRect().height) + 'px');
}

/* ── Træningen ───────────────────────────────────────────── */
function tegnKort(){
  el.bunke.textContent = '';
  const kort = bygKort(emne, aktiv);
  el.bunke.appendChild(kort);
  /* højden skal måles, før kortet vendes, ellers animerer den fra 0 */
  maalHoejde();
  requestAnimationFrame(function(){ kort.classList.toggle('vendt', vendt); });
  opdaterSider();
}

function opdaterSider(){
  const kort = el.bunke.firstElementChild;
  if(!kort) return;
  kort.querySelector('.forside').setAttribute('aria-hidden', vendt ? 'true'  : 'false');
  kort.querySelector('.bagside').setAttribute('aria-hidden', vendt ? 'false' : 'true');
}

function tegnStyr(){
  const antal = emne.kort.length;
  el.trin.textContent = '';
  emne.kort.forEach(function(k, i){
    const b = document.createElement('b');
    if(i + 1 === aktiv) b.setAttribute('data-aktiv','1');
    el.trin.appendChild(b);
  });

  el.facts.textContent = '';
  emne.kort.forEach(function(k, i){
    const knap = document.createElement('button');
    knap.type = 'button';
    knap.className = 'fact';
    knap.style.setProperty('--fc', KORTFARVER[i] || 'var(--accent)');
    knap.textContent = (i + 1) + ' · ' + k.titel;
    knap.setAttribute('aria-current', i + 1 === aktiv ? 'true' : 'false');
    knap.addEventListener('click', function(){ gaaTil(i + 1); });
    el.facts.appendChild(knap);
  });

  el.forrige.disabled = aktiv === 1;
  /* På det sidste kort fører knappen tilbage til oversigten —
     man træner ét emne og kommer tilbage. */
  const sidste = aktiv === antal;
  el.naeste.innerHTML = sidste
    ? 'Færdig ✓'
    : '<span class="lang">Næste </span>▶';
  el.naeste.setAttribute('aria-label', sidste ? 'Færdig — tilbage til oversigten' : 'Næste kort');
  el.vend.setAttribute('aria-pressed', vendt ? 'true' : 'false');
  el.vend.textContent = vendt ? 'Vis spørgsmålet' : 'Vend kort';

  el.titel.textContent   = emne.nr + '. ' + emne.emne;
  el.taeller.textContent = 'Kort ' + aktiv + ' af ' + antal + ' · ' + (vendt ? 'svar' : 'forside');
  el.sr.textContent      = emne.emne + ', kort ' + aktiv + ' af ' + antal + ' — ' +
                           (vendt ? 'svaret vises' : 'spørgsmålet vises');
}

/* ── Skift mellem de to tilstande ────────────────────────── */
function visOversigt(){
  emne = null; vendt = false; aktiv = 1;
  el.oversigt.hidden = false;
  el.traening.hidden = true;
  el.opgave.hidden   = true;
  el.titel.textContent   = 'Vælg et emne';
  el.taeller.textContent = emner.length + ' emner';
  el.sr.textContent      = 'Oversigt over ' + emner.length + ' emner';
  skrivAdresse();
}

function aabn(id, nr){
  const fundet = emner.find(function(e){ return e.id === id; });
  if(!fundet){ visOversigt(); return; }
  emne  = fundet;
  aktiv = Math.min(emne.kort.length, Math.max(1, nr || 1));
  vendt = false;
  el.oversigt.hidden = true;
  el.traening.hidden = false;
  el.opgave.hidden   = false;
  el.opgaveTxt.textContent = '«' + emne.spoergsmaal + '»';
  tegnKort();
  tegnStyr();
  skrivAdresse();
}

function gaaTil(nr){
  if(nr < 1) return;
  if(nr > emne.kort.length){ visOversigt(); vinduetOp(); return; }
  if(nr === aktiv) return;
  aktiv = nr; vendt = false;
  tegnKort(); tegnStyr(); skrivAdresse();
}

function vendKort(){
  vendt = !vendt;
  const kort = el.bunke.firstElementChild;
  if(kort) kort.classList.toggle('vendt', vendt);
  maalHoejde();
  opdaterSider();
  tegnStyr();
  skrivAdresse();
}

function vinduetOp(){
  try{ scrollTo({top:0, behavior:'smooth'}); }catch(x){ scrollTo(0,0); }
}

/* ── Deling og tavle: emne og kort lever i adressen ──────── */
let egenAendring = false;
function skrivAdresse(){
  const h = emne ? '#emne=' + emne.id + '&kort=' + aktiv : '#oversigt';
  if(location.hash === h) return;
  egenAendring = true;
  history.replaceState(null, '', location.pathname + location.search + h);
  egenAendring = false;
}
function laesAdresse(){
  const tekst = location.hash + '&' + location.search;
  const e = /emne=([a-z0-9-]+)/i.exec(tekst);
  const k = /kort=(\d+)/.exec(tekst);
  if(e) aabn(e[1], k ? Number(k[1]) : 1);
  else  visOversigt();
}

/* ── Betjening ───────────────────────────────────────────── */
el.hjem   .addEventListener('click', function(){ visOversigt(); vinduetOp(); });
el.forrige.addEventListener('click', function(){ gaaTil(aktiv - 1); });
el.naeste .addEventListener('click', function(){ gaaTil(aktiv + 1); });
el.vend   .addEventListener('click', vendKort);

addEventListener('keydown', function(e){
  if(!emne) return;
  const felt = e.target.closest('input,textarea,select,button,a');
  if(e.key === 'ArrowRight'){ gaaTil(aktiv + 1); e.preventDefault(); }
  else if(e.key === 'ArrowLeft'){ gaaTil(aktiv - 1); e.preventDefault(); }
  else if(e.key === 'Escape'){ visOversigt(); vinduetOp(); e.preventDefault(); }
  else if((e.key === ' ' || e.key === 'Enter') && !felt){ vendKort(); e.preventDefault(); }
});

addEventListener('hashchange', function(){ if(!egenAendring) laesAdresse(); });
addEventListener('resize', maalHoejde);
if(document.fonts) document.fonts.ready.then(maalHoejde);

/* ── Projektortilstand ───────────────────────────────────── */
const btnProjektor = document.getElementById('btn-projektor');
function saetProjektor(til){
  document.body.dataset.projektor = til ? '1' : '0';
  btnProjektor.setAttribute('aria-pressed', til ? 'true' : 'false');
  requestAnimationFrame(maalHoejde);
}
btnProjektor.addEventListener('click', function(){
  saetProjektor(document.body.dataset.projektor !== '1');
});
const q = new URLSearchParams(location.search);
if(q.get('projektor') === '1' || q.get('mode') === 'teach') saetProjektor(true);

bygOversigt();
laesAdresse();
