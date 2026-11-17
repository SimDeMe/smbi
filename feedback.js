/* feedback.js — én feedback-knap på hvert kort og på hver side.
 * På en simulering sidder sidens knap inde i panelets .rig-head i stedet for
 * i sidefoden, så den også er der, når figuren ligger i en iframe.
 *
 * Indsættes med  <script src="/feedback.js" defer></script>  før </body>.
 * Siden skal ikke have markup eller ID'er: knapperne sættes ind herfra, og
 * hvert kort identificerer sig selv med sit eget link i <h4>.
 *
 * Nøglen til en øvelsesvejledning er MAPPEN, ikke filen. Så havner feedback
 * fra kortet på geografi.html og fra selve vejledningen under det samme
 * punkt — også selv om den ene pegede på .pdf og den anden på .html.
 *
 * Dialogen spørger først, om man er underviser, elev eller andet, og viser
 * så rollens enkeltvalg. Øverst er der en direkte vej til en fejlmelding
 * eller besked. Kun de svar, der er synlige, når der trykkes Send, sendes.
 *
 * Modtageren er et Google-ark bag en Apps Script-webapp; koden til den
 * ligger i feedback/apps-script.gs, og opsætningen i feedback/LÆS-MIG.md.
 * Kvitteringen vises kun, når modtageren selv har svaret ok.
 */
(function(){
'use strict';

/* ── Indstillinger ──────────────────────────────────────────────────── */

/* Apps Script-webappens /exec-adresse. Så længe den er tom, sættes der
   ingen knapper ind — en knap, der ikke kan sende, er værre end ingen. */
var MODTAGER = 'https://script.google.com/macros/s/AKfycbzxN4BPMuaJUV_uFOLyZhurs58xqkwdaSoQ3fU2oND4MJ6N1w21QoRNegsA8QkBUNO4tg/exec';

var MINDST_TEGN     = 10;   /* hvor en besked er påkrævet; samme grænse som modtageren */
var MINDST_SEKUNDER = 3;    /* tidsfælde: så hurtigt skriver et menneske ikke */
var MAKS_PR_TIME    = 6;    /* fra denne browser — serveren har sin egen grænse */

/* Kategorier i den direkte beskedvisning. «Mangler» og «Idé» er samlet i «Forslag». */
var TYPER = ['Fejl','Forslag','Spørgsmål','Ros'];

/* ── Skal siden overhovedet have knapper? ───────────────────────────── */

if (!MODTAGER){
  console.info('feedback.js: ingen modtager sat — knapperne springes over. Se feedback/LÆS-MIG.md.');
  return;
}
/* I en iframe er sidens krom skjult; kun knappen i simuleringen kommer med. */
var iIframe = (function(){ try { return window.top !== window.self; } catch (e){ return true; } })();

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
/* Værtspladsen i en header: står den direkte i atlassets .site-linje, holder
   den sig ved logoet, så højresidens link bliver i højre side. */
'[data-feedback-vaert]{display:inline-flex;align-items:center}',
'.site-linje>[data-feedback-vaert]{margin-right:auto}',
/* Sidens egne knapregler (min-højde, skygge) skal ikke gøre den til en stor knap. */
'[data-feedback-vaert] .fb-knap{min-height:0;min-width:0;width:auto;box-shadow:none;white-space:nowrap}',
'@media(max-width:500px){[data-feedback-vaert] .fb-knap{letter-spacing:0.02em;padding:2px 6px}}',
/* Knappen i simuleringens .rig-head låner sidens egen .btn-mini og skal
   bare holde sig væk fra tavlen. */
'body[data-projektor="1"] .fb-knap-rig{display:none}',
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
'  width:min(460px,calc(100vw - 24px));margin:auto;padding:0;color:var(--ink,#17211F);',
  /* sidernes reset sætter margin:0 på alt — uden margin:auto klæber dialogen til hjørnet */
'  max-height:calc(100dvh - 24px);overflow:auto;overscroll-behavior:contain;',
'  background:var(--paper,#FFF9EE);border:2.5px solid var(--ink,#17211F);',
'  border-radius:18px;box-shadow:7px 7px 0 var(--ink,#17211F);',
'  font-family:var(--body,Georgia,serif);font-size:16px;line-height:1.4}',
'.fb-dialog::backdrop{background:rgba(23,33,31,.45)}',
'.fb-dialog [hidden]{display:none!important}',
'.fb-bar{height:9px;background:var(--accent,var(--geo,#0E86C8));border-radius:15px 15px 0 0}',
'.fb-form,.fb-kvittering{padding:14px 18px 18px;display:flex;flex-direction:column;gap:12px}',
'.fb-top{display:flex;align-items:center;gap:10px}',
'.fb-eyebrow{font-family:var(--mono,ui-monospace,monospace);font-size:0.6rem;font-weight:600;',
'  letter-spacing:0.13em;text-transform:uppercase;color:var(--slate,#566B68)}',
'.fb-luk{margin-left:auto;background:none;border:0;font-size:1.5rem;line-height:1;',
'  cursor:pointer;color:var(--slate,#566B68);padding:2px 6px;border-radius:8px}',
'.fb-dialog h2{font-family:var(--display,system-ui,sans-serif);font-weight:800;',
'  font-size:1.12rem;letter-spacing:-0.01em;margin:0}',
'.fb-hoved{display:flex;flex-direction:column;gap:3px}',
'.fb-emne{font-size:0.86rem;color:#3E4E4C;margin:0;line-height:1.4}',
'.fb-emne b{font-weight:700;color:var(--ink,#17211F)}',
/* Den hurtige vej til en fejlmelding: diskret, men altid synlig øverst. */
'.fb-skift{align-self:flex-start;background:none;border:0;padding:2px 0;cursor:pointer;',
'  font-family:var(--display,system-ui,sans-serif);font-weight:700;font-size:0.82rem;',
'  color:var(--ink,#17211F);text-decoration:underline;text-decoration-thickness:1.5px;',
'  text-underline-offset:3px;border-radius:4px}',
'.fb-skift:hover{color:var(--accent,var(--geo,#0E86C8))}',
'.fb-del{display:flex;flex-direction:column;gap:12px}',
/* Enkeltvalg: rigtige radioknapper, klædt ud som sidens piller. */
'.fb-valg{border:0;padding:0;margin:0;min-width:0}',
'.fb-valg legend{padding:0;margin:0 0 6px;font-family:var(--body,Georgia,serif);',
'  font-size:0.92rem;font-weight:600;color:var(--ink,#17211F)}',
'.fb-valg legend.fb-skjult{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}',
'.fb-muligheder{display:flex;flex-wrap:wrap;gap:6px}',
'.fb-pille{position:relative;display:inline-flex;cursor:pointer}',
'.fb-pille input{position:absolute;inset:0;width:100%;height:100%;margin:0;opacity:0;cursor:pointer}',
'.fb-pille span{',
'  font-family:var(--mono,ui-monospace,monospace);font-size:0.7rem;font-weight:600;',
'  letter-spacing:0.03em;line-height:1.3;color:var(--ink,#17211F);',
'  border:1.5px solid var(--ink,#17211F);border-radius:12px;padding:5px 11px;background:#fff;',
'  transition:background .12s,color .12s}',
'.fb-pille:hover span{background:#F1EBDD}',
'.fb-pille input:checked + span{background:var(--ink,#17211F);color:#FFF6E0}',
'.fb-pille input:focus-visible + span{outline:3px solid var(--grape,#7A4FD6);outline-offset:2px}',
/* Rollen er det første valg og får lidt større piller. */
'.fb-rolle .fb-pille span{font-family:var(--display,system-ui,sans-serif);font-size:0.9rem;',
'  font-weight:700;letter-spacing:0;padding:6px 14px;border-width:2px}',
'.fb-dialog label.fb-mrk{font-family:var(--body,Georgia,serif);font-size:0.92rem;font-weight:600}',
'.fb-felt{display:flex;flex-direction:column;gap:5px}',
'.fb-dialog textarea,.fb-dialog input[type=email]{',
'  font-family:var(--body,Georgia,serif);font-size:16px;width:100%;box-sizing:border-box;',
'  background:#fff;border:2px solid var(--ink,#17211F);border-radius:10px;padding:7px 10px;',
'  color:var(--ink,#17211F)}',
'.fb-dialog textarea{resize:vertical;min-height:3.4em;max-height:45vh;line-height:1.35}',
'.fb-dialog [aria-invalid="true"]{border-color:#B3123F;background:#FFF4F6}',
'.fb-hjaelp{font-size:0.78rem;color:var(--slate,#566B68);margin:0;line-height:1.4}',
'.fb-note{font-size:0.78rem;color:var(--slate,#566B68);margin:0;line-height:1.45;',
'  border-top:1.5px dashed rgba(23,33,31,.25);padding-top:10px}',
'.fb-handlinger{display:flex;gap:8px;justify-content:flex-end;margin-top:2px}',
'.fb-handlinger button{',
'  font-family:var(--display,system-ui,sans-serif);font-weight:800;font-size:0.85rem;cursor:pointer;',
'  color:var(--ink,#17211F);border:2px solid var(--ink,#17211F);border-radius:12px;padding:8px 15px;',
'  background:#fff;box-shadow:3px 3px 0 var(--ink,#17211F);transition:transform .14s,box-shadow .14s}',
'.fb-handlinger button:hover{transform:translate(-2px,-2px);box-shadow:5px 5px 0 var(--ink,#17211F)}',
'.fb-handlinger button:active{transform:translate(2px,2px);box-shadow:1px 1px 0 var(--ink,#17211F)}',
'.fb-handlinger button:disabled{opacity:.6;cursor:progress;transform:none;box-shadow:3px 3px 0 var(--ink,#17211F)}',
'.fb-send{background:var(--accent,var(--geo,#0E86C8))!important;color:#fff!important}',
'.fb-status{font-size:0.86rem;margin:0}',
'.fb-status:empty{display:none}',
'.fb-status.fb-fejl{color:#B3123F;font-weight:600}',
'.fb-kvittering p{margin:0;font-size:0.95rem}',
'.fb-kvittering h2:focus{outline:none}',
'.fb-dialog :focus-visible{outline:3px solid var(--grape,#7A4FD6);outline-offset:2px}',
'.fb-dialog h2:focus-visible{outline:none}',
/* Honningkrukken: skjult for øjet, men ikke for en bot. Uden for skærmen
   frem for display:none — det gennemskuer færre af dem. */
'.fb-honning{position:absolute!important;left:-9999px!important;',
'  width:1px!important;height:1px!important;overflow:hidden!important}',
'@media (max-width:620px){.fb-dialog{box-shadow:4px 4px 0 var(--ink,#17211F)}',
'  .fb-form,.fb-kvittering{padding:12px 14px 16px}}',
'@media (prefers-reduced-motion:reduce){.fb-knap,.fb-knap-side,.fb-handlinger button,.fb-pille span{transition:none}}',
'@media print{.fb-knap,.fb-knap-side,.fb-dialog{display:none!important}}'
].join('\n');

var stil = document.createElement('style');
stil.textContent = CSS;
document.head.appendChild(stil);

/* ── Formularens indhold ────────────────────────────────────────────── */

/* Spørgsmålene. Navnet er også feltets navn i arket (se apps-script.gs). */
var SPG = {
  rolle:      { tekst: 'Jeg er …', valg: ['Underviser','Elev','Andet'] },
  anvendelse: { tekst: 'Hvordan har du brugt materialet?',
                valg: ['Kun afprøvet','På tavlen','Eleverne arbejdede selv','Begge dele'] },
  fungerede:  { tekst: 'Hvordan fungerede det i undervisningen?', valg: ['Godt','Delvist','Dårligt'] },
  igen:       { tekst: 'Ville du bruge det igen?', valg: ['Ja','Måske','Nej','Ved ikke endnu'] },
  tydeligt:   { tekst: 'Var det tydeligt, hvad du skulle gøre?', valg: ['Ja','Delvist','Nej'] },
  forstaaet:  { tekst: 'Hjalp materialet dig med at forstå emnet?', valg: ['Ja','Lidt','Nej','Ved ikke'] },
  type:       { tekst: 'Hvad drejer det sig om? (valgfrit)', valg: TYPER }
};

function radiogruppe(navn, klasse){
  var s = SPG[navn];
  return '<fieldset class="fb-valg' + (klasse ? ' ' + klasse : '') + '" data-spg="' + navn + '">' +
    '<legend>' + s.tekst + '</legend><div class="fb-muligheder">' +
    s.valg.map(function(v){
      return '<label class="fb-pille"><input type="radio" name="fb-' + navn + '" value="' + v + '">' +
             '<span>' + v + '</span></label>';
    }).join('') + '</div></fieldset>';
}

function tekstfelt(id, tekst, paakraevet){
  return '<div class="fb-felt"><label class="fb-mrk" for="' + id + '">' + tekst + '</label>' +
    '<textarea id="' + id + '" rows="2"' + (paakraevet ? ' aria-required="true"' : '') +
    ' maxlength="4000"></textarea></div>';
}

/* ── Dialogen ───────────────────────────────────────────────────────── */

var dialog, felter = {}, aabnet = 0, emne = null, sender = false;
var visning = 'evaluering';   /* eller 'besked' — den direkte vej */

function byg(){
  dialog = document.createElement('dialog');
  dialog.className = 'fb-dialog';
  dialog.setAttribute('aria-labelledby','fb-titel');
  dialog.setAttribute('aria-describedby','fb-emne');
  dialog.innerHTML =
    '<div class="fb-bar"></div>' +
    '<form class="fb-form" novalidate>' +
      '<div class="fb-top"><span class="fb-eyebrow">Feedback til smbi.dk</span>' +
        '<button type="button" class="fb-luk" aria-label="Luk">&times;</button></div>' +
      '<div class="fb-hoved">' +
        '<h2 id="fb-titel" tabindex="-1">Hvordan fungerede materialet?</h2>' +
        '<p class="fb-emne" id="fb-emne"></p>' +
      '</div>' +

      /* Evaluering: rolle først, så de spørgsmål, der hører til rollen. */
      '<div class="fb-del" data-visning="evaluering">' +
        '<button type="button" class="fb-skift" data-til="besked">Meld en fejl eller skriv en besked</button>' +
        radiogruppe('rolle', 'fb-rolle') +
        '<div class="fb-del" data-rolle="Underviser" hidden>' +
          radiogruppe('anvendelse') +
          '<div data-naar-brugt hidden>' + radiogruppe('fungerede') + '</div>' +
          radiogruppe('igen') +
          tekstfelt('fb-tekst-underviser', 'Hvad fungerede godt, eller hvad skal ændres? <span class="fb-hjaelp">(valgfrit)</span>') +
        '</div>' +
        '<div class="fb-del" data-rolle="Elev" hidden>' +
          radiogruppe('tydeligt') +
          radiogruppe('forstaaet') +
          tekstfelt('fb-tekst-elev', 'Hvor gik du i stå, eller hvad hjalp dig? <span class="fb-hjaelp">(valgfrit)</span>') +
        '</div>' +
        '<div class="fb-del" data-rolle="Andet" hidden>' +
          tekstfelt('fb-tekst-andet', 'Din besked', true) +
        '</div>' +
      '</div>' +

      /* Den direkte vej: ingen rolle, ingen evaluering — bare en besked. */
      '<div class="fb-del" data-visning="besked" hidden>' +
        '<button type="button" class="fb-skift" data-til="evaluering">Tilbage til spørgsmålene</button>' +
        radiogruppe('type') +
        tekstfelt('fb-tekst-besked', 'Din besked', true) +
      '</div>' +

      '<div class="fb-felt">' +
        '<label class="fb-mrk" for="fb-email">E-mail — valgfrit</label>' +
        '<input type="email" id="fb-email" autocomplete="email" inputmode="email" ' +
          'spellcheck="false" maxlength="200" aria-describedby="fb-email-hjaelp">' +
        '<p class="fb-hjaelp" id="fb-email-hjaelp">Kun hvis du gerne vil have svar, eller jeg må spørge ind til din feedback.</p>' +
      '</div>' +
      '<div class="fb-honning" aria-hidden="true">' +
        '<label for="fb-hjemmeside">Hjemmeside</label>' +
        '<input type="text" id="fb-hjemmeside" name="hjemmeside" tabindex="-1" autocomplete="off">' +
      '</div>' +
      '<p class="fb-status" id="fb-status" role="status" aria-live="polite"></p>' +
      '<div class="fb-handlinger">' +
        '<button type="button" class="fb-annuller">Annullér</button>' +
        '<button type="submit" class="fb-send">Send</button>' +
      '</div>' +
      '<p class="fb-note">Tak, fordi du hjælper mig med at forbedre materialet. Dit svar sendes til Simon ' +
        'og offentliggøres ikke. Undlad oplysninger om andre personer.</p>' +
    '</form>' +
    '<div class="fb-kvittering" hidden>' +
      '<div class="fb-top"><span class="fb-eyebrow">Feedback til smbi.dk</span></div>' +
      '<h2 tabindex="-1">Tak — din feedback er sendt</h2>' +
      '<p class="fb-kvit-tekst"></p>' +
      '<div class="fb-handlinger"><button type="button" class="fb-luk-kvit">Luk</button></div>' +
    '</div>';
  document.body.appendChild(dialog);

  felter.form       = dialog.querySelector('form');
  felter.titel      = dialog.querySelector('#fb-titel');
  felter.emne       = dialog.querySelector('.fb-emne');
  felter.email      = dialog.querySelector('#fb-email');
  felter.honning    = dialog.querySelector('#fb-hjemmeside');
  felter.status     = dialog.querySelector('.fb-status');
  felter.send       = dialog.querySelector('.fb-send');
  felter.kvittering = dialog.querySelector('.fb-kvittering');
  felter.tekst = {
    Underviser: dialog.querySelector('#fb-tekst-underviser'),
    Elev:       dialog.querySelector('#fb-tekst-elev'),
    Andet:      dialog.querySelector('#fb-tekst-andet'),
    besked:     dialog.querySelector('#fb-tekst-besked')
  };

  dialog.querySelector('.fb-luk').addEventListener('click', luk);
  dialog.querySelector('.fb-annuller').addEventListener('click', luk);
  dialog.querySelector('.fb-luk-kvit').addEventListener('click', luk);
  dialog.querySelectorAll('.fb-skift').forEach(function(b){
    b.addEventListener('click', function(){ skiftVisning(b.getAttribute('data-til'), true); });
  });
  felter.form.addEventListener('change', function(e){
    if (e.target.type === 'radio') opdater();
  });
  felter.form.addEventListener('input', function(e){
    if (e.target.tagName === 'TEXTAREA') voks(e.target);
    if (e.target.getAttribute('aria-invalid')) e.target.removeAttribute('aria-invalid');
  });
  felter.form.addEventListener('submit', indsend);
}

/* Tekstfelterne starter små og vokser med teksten, op til en grænse. */
function voks(t){
  t.style.height = 'auto';
  t.style.height = Math.min(t.scrollHeight + 4, Math.round(window.innerHeight * 0.4)) + 'px';
}

function valgt(navn){
  var r = felter.form.querySelector('input[name="fb-' + navn + '"]:checked');
  return r ? r.value : '';
}

/* Vis de dele, der hører til den valgte rolle og anvendelse. */
function opdater(){
  var rolle = valgt('rolle');
  dialog.querySelectorAll('[data-rolle]').forEach(function(d){
    d.hidden = d.getAttribute('data-rolle') !== rolle;
  });
  var a = valgt('anvendelse');
  dialog.querySelector('[data-naar-brugt]').hidden = !a || a === 'Kun afprøvet';
}

function skiftVisning(ny, flytFokus){
  visning = ny;
  dialog.querySelectorAll('[data-visning]').forEach(function(d){
    d.hidden = d.getAttribute('data-visning') !== ny;
  });
  felter.titel.textContent = ny === 'besked'
    ? 'Meld en fejl eller skriv en besked' : 'Hvordan fungerede materialet?';
  saetStatus('', false);
  if (flytFokus) felter.titel.focus();
}

function aabn(sag){
  if (!dialog) byg();
  emne = sag;
  felter.emne.innerHTML = 'Om <b></b>';
  felter.emne.querySelector('b').textContent = sag.titel;
  if (sag.tilstand) felter.emne.insertAdjacentText('beforeend', ' (' + sag.tilstand + ')');
  felter.form.hidden = false;
  felter.kvittering.hidden = true;
  saetStatus('', false);
  felter.send.disabled = sender;
  felter.send.textContent = sender ? 'Sender…' : 'Send';
  aabnet = Date.now();
  if (dialog.showModal) dialog.showModal(); else dialog.setAttribute('open','');
  var start = visning === 'besked'
    ? felter.form.querySelector('[data-visning="besked"] input')
    : (felter.form.querySelector('input[name="fb-rolle"]:checked') ||
       felter.form.querySelector('input[name="fb-rolle"]'));
  if (start) start.focus();
}

function luk(){
  if (dialog.close) dialog.close(); else dialog.removeAttribute('open');
}

function saetStatus(tekst, fejl){
  felter.status.textContent = tekst;
  felter.status.classList.toggle('fb-fejl', !!fejl);
}

/* Efter en vellykket afsendelse: alt tilbage til start. */
function nulstil(){
  felter.form.reset();
  Object.keys(felter.tekst).forEach(function(k){ felter.tekst[k].style.height = ''; });
  felter.form.querySelectorAll('[aria-invalid]').forEach(function(f){ f.removeAttribute('aria-invalid'); });
  skiftVisning('evaluering', false);
  opdater();
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

/* ── Hvad der sendes ────────────────────────────────────────────────── */

function gyldigEmail(s){ return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s); }

/* Samler KUN de svar, der er synlige i den aktuelle visning og rolle.
   Giver { data } eller { fejl, felt }. */
function saml(){
  var d = {}, tekst;

  if (visning === 'besked'){
    tekst = felter.tekst.besked.value.trim();
    if (tekst.length < MINDST_TEGN)
      return { fejl: tekst ? 'Skriv lidt mere — mindst ' + MINDST_TEGN + ' tegn.' : 'Skriv din besked først.',
               felt: felter.tekst.besked };
    d.visning = 'besked';
    d.type = valgt('type');
    d.besked = tekst;
  } else {
    var rolle = valgt('rolle');
    if (!rolle) return { fejl: 'Vælg først, om du er underviser, elev eller andet.',
                         felt: felter.form.querySelector('input[name="fb-rolle"]') };
    d.visning = 'evaluering';
    d.rolle = rolle;
    tekst = felter.tekst[rolle].value.trim();

    if (rolle === 'Andet'){
      if (tekst.length < MINDST_TEGN)
        return { fejl: tekst ? 'Skriv lidt mere — mindst ' + MINDST_TEGN + ' tegn.' : 'Skriv din besked først.',
                 felt: felter.tekst.Andet };
    } else if (rolle === 'Underviser'){
      d.anvendelse = valgt('anvendelse');
      if (d.anvendelse && d.anvendelse !== 'Kun afprøvet') d.fungerede = valgt('fungerede');
      d.igen = valgt('igen');
      if (!d.fungerede && !d.igen && !tekst)
        return { fejl: 'Besvar mindst ét af spørgsmålene om, hvordan materialet fungerede.',
                 felt: felter.form.querySelector('[data-naar-brugt]:not([hidden]) input, input[name="fb-igen"]') };
    } else {
      d.tydeligt = valgt('tydeligt');
      d.forstaaet = valgt('forstaaet');
      if (!d.tydeligt && !d.forstaaet && !tekst)
        return { fejl: 'Besvar mindst ét af spørgsmålene.',
                 felt: felter.form.querySelector('input[name="fb-tydeligt"]') };
    }
    d.besked = tekst;
  }

  var email = felter.email.value.trim();
  if (email && !gyldigEmail(email))
    return { fejl: 'E-mailadressen ser ikke rigtig ud. Ret den, eller lad feltet stå tomt.', felt: felter.email };
  d.email = email;
  return { data: d };
}

/* ── Afsendelse ─────────────────────────────────────────────────────── */

function indsend(e){
  e.preventDefault();
  if (sender) return;                                  /* ingen dobbeltindsendelse */

  var s = saml();
  if (s.fejl){
    saetStatus(s.fejl, true);
    if (s.felt){
      if (s.felt.tagName !== 'INPUT' || s.felt.type !== 'radio') s.felt.setAttribute('aria-invalid','true');
      s.felt.focus();
    }
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
    saetStatus('Du har sendt en del svar den seneste time. Prøv igen senere.', true);
    return;
  }

  var d = s.data;
  var krop = new URLSearchParams({
    skema:      '2',
    noegle:     emne.noegle,
    titel:      emne.titel,
    kilde:      emne.kilde,
    tilstand:   emne.tilstand || '',
    url:        emne.url || '',
    hjemmeside: felter.honning.value,                 /* honningkrukken */
    skaerm:     window.innerWidth + '×' + window.innerHeight,
    browser:    navigator.userAgent
  });
  Object.keys(d).forEach(function(k){ if (d[k]) krop.set(k, d[k]); });

  sender = true;
  felter.send.disabled = true;
  felter.send.textContent = 'Sender…';
  saetStatus('Sender …', false);

  var afbryd = window.AbortController ? new AbortController() : null;
  var ur = setTimeout(function(){ if (afbryd) afbryd.abort(); }, 20000);

  /* Almindelig CORS-forespørgsel uden forhåndstjek: Apps Script svarer med
     Access-Control-Allow-Origin: *, så svaret kan læses — og kun et rigtigt
     «ok» fra modtageren giver en kvittering. */
  fetch(MODTAGER, { method: 'POST', body: krop, signal: afbryd ? afbryd.signal : undefined })
    .then(function(r){
      if (!r.ok) throw new Error('http ' + r.status);
      return r.text();
    })
    .then(function(tekst){
      var svar = null;
      try { svar = JSON.parse(tekst); } catch (x){}
      if (svar && svar.ok === true) return lykkedes(bremse);
      if (svar && svar.fejl === 'travlt')
        throw synlig('Der kommer mange svar lige nu. Prøv igen om lidt.');
      if (svar && svar.fejl === 'ugyldig')
        throw synlig('Modtageren afviste svaret. Tjek felterne, og prøv igen.');
      /* Den gamle modtager (skema 1) svarer bare «ok» og gemmer kun rækker
         med en besked på mindst 10 tegn — alt andet smider den stille væk. */
      if (!svar && tekst.trim() === 'ok'){
        if ((d.besked || '').length >= 10) return lykkedes(bremse);
        throw synlig('Modtageren er ikke opdateret til de nye spørgsmål endnu, så svaret blev ikke gemt. ' +
                     'Skriv gerne et par ord i tekstfeltet, eller brug »Meld en fejl eller skriv en besked«.');
      }
      throw new Error('uventet svar');
    })
    .catch(function(fejl){
      var forklaring = fejl && fejl.synlig ? fejl.message
        : fejl && fejl.name === 'AbortError'
          ? 'Det tog for lang tid at sende. Tjek forbindelsen, og prøv igen.'
          : 'Svaret kunne ikke sendes. Tjek forbindelsen, og prøv igen — eller skriv via Kontakt.';
      saetStatus(forklaring + ' Dine svar er ikke slettet.', true);
      felter.send.disabled = false;
      felter.send.textContent = 'Send';
    })
    .then(function(){ clearTimeout(ur); sender = false; });
}

function synlig(tekst){ var f = new Error(tekst); f.synlig = true; return f; }

function lykkedes(bremse){
  bremse.gem();
  var email = felter.email.value.trim();
  nulstil();
  saetStatus('', false);
  felter.send.disabled = false;
  felter.send.textContent = 'Send';
  dialog.querySelector('.fb-kvit-tekst').textContent = email
    ? 'Den er gemt hos Simon sammen med din e-mail, så jeg kan svare dig.'
    : 'Den er gemt hos Simon. Tak for hjælpen.';
  felter.form.hidden = true;
  felter.kvittering.hidden = false;
  felter.kvittering.querySelector('h2').focus();
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
      kilde:  'kort på ' + sidensNoegle(),
      url:    link.href
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

/* Tilstanden læses, når der trykkes — ikke da siden blev indlæst. */
function sidensSag(kilde){
  return {
    noegle:   sidensNoegle(),
    titel:    sidensTitel(),
    kilde:    kilde,
    tilstand: tilstand(),
    url:      location.href
  };
}

/* Simuleringer: knappen bor i panelet, efter den sidste .btn-mini i samme
   række (inde i .rig-tools/.hoejre, hvis knapperne står dér). */
function knapISimuleringen(){
  var hoved = document.querySelector('.rig .rig-head');
  if (!hoved) return false;
  if (!sidensNoegle()) return false;        /* forsidens panel er en smagsprøve */
  if (hoved.querySelector('.fb-knap-rig')) return true;

  var kilde = iIframe ? 'simuleringen i en iframe' +
      (document.referrer ? ' på ' + noegle(document.referrer) : '') : 'simuleringen';
  var b = document.createElement('button');
  b.type = 'button';
  b.className = 'btn-mini fb-knap-rig';
  b.textContent = 'Feedback';
  b.title = 'Giv feedback om simuleringen';
  b.addEventListener('click', function(){ aabn(sidensSag(kilde)); });

  var knapper = Array.prototype.filter.call(hoved.querySelectorAll('.btn-mini'), function(k){
    return !k.closest('[role="group"]');                  /* ikke ind i en knapgruppe */
  });
  var sidste = knapper[knapper.length - 1];
  if (sidste) sidste.parentNode.insertBefore(b, sidste.nextSibling);
  else hoved.appendChild(b);
  return true;
}

function knapPaaSiden(){
  var sag = sidensSag('siden selv');

  /* En side kan selv sige, hvor knappen skal stå, og låne sine egne
     knapklasser — fx Tid-appen, hvor en svævende knap ville dække
     bundnavigationen:
       <div data-feedback-vaert data-feedback-klasse="btn btn-secondary"></div> */
  var egen = document.querySelector('[data-feedback-vaert]');
  if (egen){
    var b = lavKnap(sag, '');
    b.className = egen.getAttribute('data-feedback-klasse') || 'fb-knap';
    b.textContent = 'Giv feedback';
    egen.appendChild(b);
    return;
  }

  var knap = lavKnap(sag, 'fb-knap-side');
  knap.textContent = 'Giv feedback';

  var vaert = document.querySelector('.foot .foot-links') || document.querySelector('.foot .foot-in');
  if (vaert) vaert.appendChild(knap);
  else document.body.appendChild(knap);     /* gamle sider uden sidefod */
}

function start(){
  if (knapISimuleringen()) return;          /* én knap pr. side: i panelet */
  if (iIframe) return;
  knapperPaaKort();
  knapPaaSiden();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
else start();

})();
