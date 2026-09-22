/* feedback.js — én feedback-knap på hvert kort og på hver side.
 *
 * Indsættes med  <script src="/feedback.js" defer></script>  før </body>.
 * Siden skal ikke have markup eller ID'er: knapperne sættes ind herfra, og
 * hvert kort identificerer sig selv med sit eget link i <h4>.
 *
 * Nøglen til en øvelsesvejledning er MAPPEN, ikke filen. Så havner feedback
 * fra kortet på geografi.html og fra selve vejledningen under det samme
 * punkt — også selv om den ene pegede på .pdf og den anden på .html.
 *
 * Modtageren er et Google-ark bag en Apps Script-webapp; koden til den
 * ligger i feedback/apps-script.gs, og opsætningen i feedback/LÆS-MIG.md.
 */
(function(){
'use strict';

/* ── Indstillinger ──────────────────────────────────────────────────── */

/* Apps Script-webappens /exec-adresse. Så længe den er tom, sættes der
   ingen knapper ind — en knap, der ikke kan sende, er værre end ingen. */
var MODTAGER = 'https://script.google.com/macros/s/AKfycbzxN4BPMuaJUV_uFOLyZhurs58xqkwdaSoQ3fU2oND4MJ6N1w21QoRNegsA8QkBUNO4tg/exec';

var MINDST_TEGN     = 15;   /* kortere beskeder kan vi ikke bruge til noget */
var MINDST_SEKUNDER = 3;    /* tidsfælde: så hurtigt skriver et menneske ikke */
var MAKS_PR_TIME    = 6;    /* fra denne browser — serveren har sin egen grænse */

var TYPER = ['Fejl','Mangler','Idé','Spørgsmål','Ros'];

/* ── Skal siden overhovedet have knapper? ───────────────────────────── */

if (!MODTAGER){
  console.info('feedback.js: ingen modtager sat — knapperne springes over. Se feedback/LÆS-MIG.md.');
  return;
}
if (window.top !== window.self) return;              /* figuren ligger i en iframe */

var soeg = new URLSearchParams(location.search);
if (soeg.get('projektor') === '1' || soeg.get('mode') === 'teach') return;   /* tavlen */

/* ── Hvem er der tale om? ───────────────────────────────────────────── */

/* Sti uden domæne, uden forreste skråstreg, og uden filnavn hvis det er en
   øvelsesvejledning — så er de tre formater ét og samme punkt. */
function noegle(adresse){
  var sti;
  try { sti = new URL(adresse, location.href).pathname; }
  catch (e){ return ''; }
  sti = decodeURIComponent(sti).replace(/^\/+/, '');
  if (/^Øvelser\//.test(sti)) sti = sti.replace(/\/[^/]+$/, '');
  return sti;
}

function sidensTitel(){
  var h1 = document.querySelector('.head h1, main h1, h1');
  var t  = h1 ? h1.textContent : document.title;
  return t.replace(/\s*[—–-]\s*smbi\.dk\s*$/i, '').replace(/\s+/g, ' ').trim();
}

function sidensNoegle(){
  var kanonisk = document.querySelector('link[rel="canonical"]');
  return noegle(kanonisk ? kanonisk.href : location.href);
}

/* Trin og tilstand står i adressen på de sider, der har dem (#trin=3,
   ?mode=explore). Det er tit præcis dér, fejlen blev set. */
function tilstand(){
  var dele = [];
  if (location.hash)   dele.push(location.hash.replace(/^#/, ''));
  var m = soeg.get('mode'); if (m) dele.push('mode=' + m);
  var t = soeg.get('trin'); if (t) dele.push('trin=' + t);
  return dele.join(' · ');
}

/* ── Udseende ───────────────────────────────────────────────────────── */
/* Tokens med reserveværdi, så knappen også ser rigtig ud på de sider,
   der endnu kører det gamle design og ikke har :root-blokken. */

var CSS = [
'.fb-knap{',
'  font-family:var(--mono,ui-monospace,monospace);font-size:0.55rem;font-weight:600;',
'  letter-spacing:0.1em;text-transform:uppercase;cursor:pointer;',
'  background:#fff;color:var(--ink,#17211F);border:1.5px solid var(--ink,#17211F);',
'  border-radius:12px;padding:2px 8px;line-height:1.7;',
'  position:relative;z-index:2;transition:background .15s,color .15s}',
'.fb-knap:hover{background:var(--ink,#17211F);color:#FFF6E0}',
'.fb-knap-side{',
'  position:fixed;right:16px;bottom:16px;z-index:60;',
'  font-size:0.6rem;padding:8px 14px;border-width:2px;border-radius:999px;',
'  background:var(--paper,#FFF9EE);box-shadow:3px 3px 0 var(--ink,#17211F)}',
'.fb-knap-side:hover{transform:translate(-2px,-2px);box-shadow:5px 5px 0 var(--ink,#17211F)}',
'.fb-knap-side:active{transform:translate(2px,2px);box-shadow:1px 1px 0 var(--ink,#17211F)}',
/* I sidefoden låner knappen navigationens form — en mono-pille blandt
   display-piller ser ud som noget, der er hængt på bagefter. */
'.foot .fb-knap-side{',
'  position:static;box-shadow:none;background:transparent;color:#FFF6E0;',
'  font-family:var(--display,system-ui,sans-serif);font-size:0.83rem;font-weight:700;',
'  letter-spacing:normal;text-transform:none;',
'  border:2px solid #FFF6E0;border-radius:20px;padding:5px 13px}',
'.foot .fb-knap-side:hover{background:#FFF6E0;color:var(--ink,#17211F);transform:none;box-shadow:none}',

'.fb-dialog{',
'  width:min(440px,calc(100vw - 32px));margin:auto;padding:0;color:var(--ink,#17211F);',
  /* sidernes reset sætter margin:0 på alt — uden margin:auto klæber dialogen til hjørnet */
'  max-height:calc(100vh - 32px);overflow:auto;',
'  background:var(--paper,#FFF9EE);border:2.5px solid var(--ink,#17211F);',
'  border-radius:18px;box-shadow:7px 7px 0 var(--ink,#17211F);',
'  font-family:var(--body,Georgia,serif);font-size:16px}',
'.fb-dialog::backdrop{background:rgba(23,33,31,.45)}',
'.fb-bar{height:9px;background:var(--accent,var(--geo,#0E86C8));border-radius:15px 15px 0 0}',
'.fb-form{padding:16px 18px 18px;display:flex;flex-direction:column;gap:10px}',
'.fb-top{display:flex;align-items:center;gap:10px}',
'.fb-eyebrow{font-family:var(--mono,ui-monospace,monospace);font-size:0.6rem;font-weight:600;',
'  letter-spacing:0.13em;text-transform:uppercase;color:var(--slate,#566B68)}',
'.fb-luk{margin-left:auto;background:none;border:0;font-size:1.4rem;line-height:1;',
'  cursor:pointer;color:var(--slate,#566B68);padding:0 4px}',
'.fb-dialog h2{font-family:var(--display,system-ui,sans-serif);font-weight:800;',
'  font-size:1.12rem;letter-spacing:-0.01em;margin:0}',
'.fb-emne{font-size:0.84rem;color:#3E4E4C;margin:0;line-height:1.4}',
'.fb-emne b{font-weight:700}',
'.fb-typer{display:flex;flex-wrap:wrap;gap:6px;border:0;padding:0;margin:2px 0 0}',
'.fb-typer legend{position:absolute;left:-9999px}',
'.fb-typer label{',
'  font-family:var(--mono,ui-monospace,monospace);font-size:0.55rem;font-weight:600;',
'  letter-spacing:0.1em;text-transform:uppercase;cursor:pointer;',
'  border:1.5px solid var(--ink,#17211F);border-radius:12px;padding:3px 9px;background:#fff}',
'.fb-typer input{position:absolute;opacity:0;width:0;height:0}',
'.fb-typer input:checked + span{color:#FFF6E0}',
'.fb-typer label:has(input:checked){background:var(--ink,#17211F);color:#FFF6E0}',
'.fb-typer label:has(input:focus-visible){outline:3px solid var(--grape,#7A4FD6);outline-offset:2px}',
'.fb-dialog label.fb-mrk{font-family:var(--mono,ui-monospace,monospace);font-size:0.6rem;',
'  font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:var(--slate,#566B68)}',
'.fb-dialog textarea,.fb-dialog input[type=text]{',
'  font-family:var(--body,Georgia,serif);font-size:0.95rem;width:100%;box-sizing:border-box;',
'  background:#fff;border:2px solid var(--ink,#17211F);border-radius:10px;padding:8px 10px}',
'.fb-dialog textarea{resize:vertical;min-height:92px}',
'.fb-note{font-size:0.74rem;color:var(--slate,#566B68);margin:0;line-height:1.4}',
'.fb-handlinger{display:flex;gap:8px;justify-content:flex-end;margin-top:2px}',
'.fb-handlinger button{',
'  font-family:var(--display,system-ui,sans-serif);font-weight:800;font-size:0.82rem;cursor:pointer;',
'  border:2px solid var(--ink,#17211F);border-radius:12px;padding:7px 14px;background:#fff;',
'  box-shadow:3px 3px 0 var(--ink,#17211F);transition:transform .14s,box-shadow .14s}',
'.fb-handlinger button:hover{transform:translate(-2px,-2px);box-shadow:5px 5px 0 var(--ink,#17211F)}',
'.fb-handlinger button:active{transform:translate(2px,2px);box-shadow:1px 1px 0 var(--ink,#17211F)}',
'.fb-send{background:var(--accent,var(--geo,#0E86C8))!important;color:#fff}',
'.fb-status{font-size:0.84rem;margin:0;min-height:1.2em}',
'.fb-status.fb-fejl{color:#B3123F}',
'.fb-dialog :focus-visible{outline:3px solid var(--grape,#7A4FD6);outline-offset:2px}',
/* Honningkrukken: skjult for øjet, men ikke for en bot. Uden for skærmen
   frem for display:none — det gennemskuer færre af dem. */
'.fb-honning{position:absolute!important;left:-9999px!important;',
'  width:1px!important;height:1px!important;overflow:hidden!important}',
'@media (max-width:620px){.fb-dialog{box-shadow:4px 4px 0 var(--ink,#17211F)}}',
'@media (prefers-reduced-motion:reduce){.fb-knap,.fb-knap-side,.fb-handlinger button{transition:none}}',
'@media print{.fb-knap,.fb-knap-side,.fb-dialog{display:none!important}}'
].join('\n');

var stil = document.createElement('style');
stil.textContent = CSS;
document.head.appendChild(stil);

/* ── Dialogen ───────────────────────────────────────────────────────── */

var dialog, felter = {}, aabnet = 0, emne = null;

function byg(){
  dialog = document.createElement('dialog');
  dialog.className = 'fb-dialog';
  dialog.setAttribute('aria-labelledby','fb-titel');
  dialog.innerHTML =
    '<div class="fb-bar"></div>' +
    '<form class="fb-form" novalidate>' +
      '<div class="fb-top"><span class="fb-eyebrow">Feedback til smbi.dk</span>' +
        '<button type="button" class="fb-luk" aria-label="Luk">&times;</button></div>' +
      '<h2 id="fb-titel">Hvad drejer det sig om?</h2>' +
      '<p class="fb-emne"></p>' +
      '<fieldset class="fb-typer"><legend>Hvad slags besked er det?</legend>' +
        TYPER.map(function(t,i){
          return '<label><input type="radio" name="fb-type" value="' + t + '"' +
                 (i===0 ? ' checked' : '') + '><span>' + t + '</span></label>';
        }).join('') +
      '</fieldset>' +
      '<label class="fb-mrk" for="fb-besked">Din besked</label>' +
      '<textarea id="fb-besked" required></textarea>' +
      '<label class="fb-mrk" for="fb-navn">Dit navn — valgfrit</label>' +
      '<input type="text" id="fb-navn" autocomplete="name">' +
      '<div class="fb-honning" aria-hidden="true">' +
        '<label for="fb-hjemmeside">Hjemmeside</label>' +
        '<input type="text" id="fb-hjemmeside" name="hjemmeside" tabindex="-1" autocomplete="off">' +
      '</div>' +
      '<p class="fb-note">Skriv ikke personfølsomme oplysninger. Beskeden lander i et ark, som kun Simon kan se.</p>' +
      '<p class="fb-status" role="status" aria-live="polite"></p>' +
      '<div class="fb-handlinger">' +
        '<button type="button" class="fb-annuller">Annullér</button>' +
        '<button type="submit" class="fb-send">Send</button>' +
      '</div>' +
    '</form>';
  document.body.appendChild(dialog);

  felter.form    = dialog.querySelector('form');
  felter.emne    = dialog.querySelector('.fb-emne');
  felter.besked  = dialog.querySelector('#fb-besked');
  felter.navn    = dialog.querySelector('#fb-navn');
  felter.honning = dialog.querySelector('#fb-hjemmeside');
  felter.status  = dialog.querySelector('.fb-status');
  felter.send    = dialog.querySelector('.fb-send');

  dialog.querySelector('.fb-luk').addEventListener('click', luk);
  dialog.querySelector('.fb-annuller').addEventListener('click', luk);
  felter.form.addEventListener('submit', indsend);
}

function aabn(sag){
  if (!dialog) byg();
  emne = sag;
  felter.emne.innerHTML = 'Du skriver om <b></b>';
  felter.emne.querySelector('b').textContent = sag.titel;
  if (sag.tilstand) felter.emne.insertAdjacentText('beforeend', ' (' + sag.tilstand + ')');
  saetStatus('', false);
  felter.send.disabled = false;
  felter.send.textContent = 'Send';
  aabnet = Date.now();
  if (dialog.showModal) dialog.showModal(); else dialog.setAttribute('open','');
  felter.besked.focus();
}

function luk(){
  if (dialog.close) dialog.close(); else dialog.removeAttribute('open');
}

function saetStatus(tekst, fejl){
  felter.status.textContent = tekst;
  felter.status.classList.toggle('fb-fejl', !!fejl);
}

/* ── Bremsen i denne browser ────────────────────────────────────────── */

function sendteForNylig(){
  try {
    var nu = Date.now();
    var liste = JSON.parse(localStorage.getItem('fb-sendt') || '[]')
                  .filter(function(t){ return nu - t < 3600e3; });
    return { antal: liste.length, gem: function(){
      liste.push(nu); localStorage.setItem('fb-sendt', JSON.stringify(liste));
    }};
  } catch (e){ return { antal: 0, gem: function(){} }; }   /* privat vindue */
}

/* ── Afsendelse ─────────────────────────────────────────────────────── */

function indsend(e){
  e.preventDefault();
  var besked = felter.besked.value.trim();

  if (besked.length < MINDST_TEGN){
    saetStatus('Skriv lidt mere — mindst ' + MINDST_TEGN + ' tegn, så jeg kan bruge det til noget.', true);
    felter.besked.focus();
    return;
  }
  /* Tidsfælden. Et menneske må gerne prøve igen — en bot plejer ikke at vente. */
  if (Date.now() - aabnet < MINDST_SEKUNDER * 1000){
    saetStatus('Vent et øjeblik, og tryk så igen.', true);
    aabnet = Date.now() - MINDST_SEKUNDER * 1000;
    return;
  }
  var bremse = sendteForNylig();
  if (bremse.antal >= MAKS_PR_TIME){
    saetStatus('Du har sendt en del beskeder den seneste time. Prøv igen senere.', true);
    return;
  }

  var valgt = felter.form.querySelector('input[name="fb-type"]:checked');
  var krop = new URLSearchParams({
    noegle:     emne.noegle,
    titel:      emne.titel,
    kilde:      emne.kilde,
    tilstand:   emne.tilstand || '',
    type:       valgt ? valgt.value : TYPER[0],
    besked:     besked,
    navn:       felter.navn.value.trim(),
    hjemmeside: felter.honning.value,                 /* honningkrukken */
    skaerm:     window.innerWidth + '×' + window.innerHeight,
    browser:    navigator.userAgent
  });

  felter.send.disabled = true;
  felter.send.textContent = 'Sender…';
  saetStatus('', false);

  fetch(MODTAGER, {
    method: 'POST',
    mode: 'no-cors',
    headers: {'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},
    body: krop
  }).then(function(){
    /* Svaret kan ikke læses (no-cors), så vi ved kun, at den kom af sted. */
    bremse.gem();
    felter.besked.value = '';
    felter.navn.value   = '';
    saetStatus('Tak — beskeden er sendt.', false);
    felter.send.textContent = 'Sendt';
    setTimeout(luk, 1200);
  }).catch(function(){
    felter.send.disabled = false;
    felter.send.textContent = 'Send';
    saetStatus('Beskeden kunne ikke sendes. Prøv igen — eller skriv via Kontakt.', true);
  });
}

/* ── Knapperne ──────────────────────────────────────────────────────── */

function lavKnap(sag, klasse){
  var b = document.createElement('button');
  b.type = 'button';
  b.className = 'fb-knap' + (klasse ? ' ' + klasse : '');
  b.textContent = 'Feedback';
  b.setAttribute('aria-label', 'Giv feedback om ' + sag.titel);
  b.addEventListener('click', function(){ aabn(sag); });
  return b;
}

function knapperPaaKort(){
  document.querySelectorAll('.sim, .item').forEach(function(kort){
    if (kort.querySelector('.fb-knap')) return;
    var link = kort.querySelector('h4 a[href]');
    if (!link) return;

    var sag = {
      noegle: noegle(link.getAttribute('href')),
      titel:  link.textContent.replace(/\s+/g,' ').trim(),
      kilde:  'kort på ' + sidensNoegle()
    };
    if (!sag.noegle) return;

    var sub = kort.querySelector('.sub');
    if (!sub){
      sub = document.createElement('div');
      sub.className = 'sub';
      (kort.querySelector('.sim-body') || kort).appendChild(sub);
    }
    sub.appendChild(lavKnap(sag));
  });
}

function knapPaaSiden(){
  var sag = {
    noegle:   sidensNoegle(),
    titel:    sidensTitel(),
    kilde:    'siden selv',
    tilstand: tilstand()
  };
  var knap = lavKnap(sag, 'fb-knap-side');
  knap.textContent = 'Giv feedback';

  var vaert = document.querySelector('.foot .foot-links') || document.querySelector('.foot .foot-in');
  if (vaert) vaert.appendChild(knap);
  else document.body.appendChild(knap);     /* gamle sider uden sidefod */
}

function start(){
  knapperPaaKort();
  knapPaaSiden();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
else start();

})();
