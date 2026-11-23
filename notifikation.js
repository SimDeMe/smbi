/* notifikation.js — en lille besked oppe i højre hjørne.
 *
 * Indsættes med  <script src="/notifikation.js" defer></script>  før </body>.
 * Beskederne står i listen BESKEDER herunder. En besked vises, når
 *   · siden er nævnt i «sider» (stier uden domæne; '/' er forsiden),
 *   · datoen ikke er passeret «til» (til og med den dag),
 *   · brugeren ikke har klikket den væk eller fulgt linket før.
 * Klik på X eller linket huskes i browseren under beskedens «id».
 * Vil du vise en besked igen for alle, så giv den et nyt id.
 *
 * Intet vises i en iframe, i projektor-/tavlevisning eller på selve
 * målsiden. Kun én besked ad gangen — den første i listen, der passer.
 */
(function(){
'use strict';

var BESKEDER = [
  {
    id:    'drivhus-opgaver-2026-11',
    titel: 'Nyt: opgaver om drivhuseffekten',
    tekst: 'Peg på figuren, svar på spørgsmål og byg årsagskæden selv.',
    link:  '/geografi/drivhuseffekt/#opgaver',
    knap:  'Prøv opgaverne',
    farve: 'geo',                       /* 'geo' (blå) eller 'bio' (pink) */
    sider: ['/', '/index.html', '/geografi.html'],
    til:   '2027-01-31'
  }
];

/* ── Skal der overhovedet vises noget? ──────────────────────────────── */

var iIframe = (function(){ try { return window.top !== window.self; } catch (e){ return true; } })();
if (iIframe) return;
var soeg = new URLSearchParams(location.search);
if (soeg.has('projektor') || soeg.get('mode') === 'teach') return;

function husket(id){
  try { return localStorage.getItem('notifikation:' + id) === 'set'; } catch (e){ return false; }
}
function husk(id){
  try { localStorage.setItem('notifikation:' + id, 'set'); } catch (e){}
}

var sti = location.pathname.replace(/\/+$/, '') || '/';
var idag = new Date().toISOString().slice(0, 10);

var besked = BESKEDER.filter(function(b){
  var maal = new URL(b.link, location.href).pathname.replace(/\/+$/, '') || '/';
  return b.sider.some(function(s){ return (s.replace(/\/+$/, '') || '/') === sti; })
      && maal !== sti
      && (!b.til || idag <= b.til)
      && !husket(b.id);
})[0];
if (!besked) return;

/* ── Udseende: sitets tokens, med reserver til sider uden forside.css ─ */

var css = [
  '.notif{--c:var(--geo,#0E86C8);position:fixed;z-index:900;top:16px;right:16px;',
  'width:min(340px,calc(100vw - 32px));box-sizing:border-box;padding:14px 44px 14px 16px;',
  'background:var(--panel,#fff);color:var(--ink,#17211F);border:2px solid var(--ink,#17211F);',
  'border-left:8px solid var(--c);border-radius:10px;box-shadow:var(--hard,4px 4px 0 #17211F);',
  "font:400 15px/1.4 var(--body,'Source Serif 4',Georgia,serif);",
  'animation:notif-ind .35s ease-out both}',
  '.notif.bio{--c:var(--bio,#E8336D)}',
  ".notif h2{margin:0 0 4px;font:700 16px/1.25 var(--display,'Archivo',system-ui,sans-serif)}",
  '.notif p{margin:0 0 10px}',
  ".notif .notif-link{display:inline-block;padding:6px 12px;border:2px solid var(--ink,#17211F);",
  "border-radius:6px;background:var(--c);color:#fff;font:600 14px/1.2 var(--display,'Archivo',system-ui,sans-serif);",
  'text-decoration:none}',
  '.notif .notif-link:hover{filter:brightness(1.08)}',
  '.notif .notif-x{position:absolute;top:6px;right:6px;width:32px;height:32px;padding:0;',
  'border:0;border-radius:6px;background:transparent;color:inherit;font:400 22px/1 system-ui,sans-serif;cursor:pointer}',
  '.notif .notif-x:hover{background:rgba(23,33,31,.08)}',
  '.notif a:focus-visible,.notif button:focus-visible{outline:3px solid var(--amber,#FFB300);outline-offset:2px}',
  '.notif.ud{animation:notif-ud .2s ease-in both}',
  '@keyframes notif-ind{from{opacity:0;transform:translateY(-10px)}}',
  '@keyframes notif-ud{to{opacity:0;transform:translateY(-10px)}}',
  '@media (prefers-reduced-motion:reduce){.notif,.notif.ud{animation:none}}',
  '@media print{.notif{display:none}}'
].join('');

var stil = document.createElement('style');
stil.textContent = css;
document.head.appendChild(stil);

/* ── Selve boksen ──────────────────────────────────────────────────── */

var boks = document.createElement('aside');
boks.className = 'notif' + (besked.farve === 'bio' ? ' bio' : '');
boks.setAttribute('aria-label', 'Nyhed');
boks.setAttribute('role', 'status');

var h = document.createElement('h2');
h.textContent = besked.titel;
var p = document.createElement('p');
p.textContent = besked.tekst;
var a = document.createElement('a');
a.className = 'notif-link';
a.href = besked.link;
a.textContent = besked.knap + ' →';
var x = document.createElement('button');
x.type = 'button';
x.className = 'notif-x';
x.setAttribute('aria-label', 'Luk beskeden');
x.textContent = '×';

boks.append(h, p, a, x);

function luk(){
  husk(besked.id);
  if (matchMedia('(prefers-reduced-motion: reduce)').matches){ boks.remove(); return; }
  boks.classList.add('ud');
  boks.addEventListener('animationend', function(){ boks.remove(); }, { once:true });
}
x.addEventListener('click', luk);
a.addEventListener('click', function(){ husk(besked.id); });
boks.addEventListener('keydown', function(e){ if (e.key === 'Escape') luk(); });

/* Lidt forsinket, så den ikke konkurrerer med sidens første indtryk. */
/* Under sitets klæbende header, så menuen stadig kan bruges. */
function placer(){
  var hd = document.querySelector('header.top');
  var bund = hd ? Math.max(0, hd.getBoundingClientRect().bottom) : 0;
  boks.style.top = (bund + 12) + 'px';
}
setTimeout(function(){
  placer();
  document.body.appendChild(boks);
  addEventListener('resize', placer);
}, 800);
})();
