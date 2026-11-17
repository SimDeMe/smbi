/**
 * apps-script.gs — modtager feedback fra smbi.dk og skriver den i et Google-ark.
 *
 * Koden hører ikke til på hjemmesiden. Den indsættes i et Apps Script-projekt,
 * der er knyttet til arket, og rulles ud som webapp. Fremgangsmåden står i
 * feedback/LÆS-MIG.md.
 *
 * Skema 2 (november 2026): feedback.js sender enten en struktureret evaluering
 * (rolle + enkeltvalg) eller en direkte besked (kategori + tekst). Svarene får
 * hver sin kolonne. Rækker fra det gamle skema og fra browsere, der stadig har
 * den gamle feedback.js i cachen, tages fortsat imod.
 *
 * Kolonnerne skrives efter overskrift, ikke efter plads: mangler en kolonne i
 * arket, lægges den til sidst. Så bliver de gamle rækker og din egen
 * «Status»-kolonne stående, hvor de er.
 *
 * Svaret er JSON — {"ok":true} eller {"ok":false,"fejl":"…"} — så siden kan
 * vise en ærlig kvittering. Eneste undtagelse er honningkrukken: en bot får
 * altid «ok», så den ikke kan læse sig til, hvad der afslørede den.
 *
 * Spærringer mod spam:
 *   1. honningkrukken — feltet «hjemmeside» er skjult på siden, så kun en bot
 *      udfylder det. Er der noget i det, skrives rækken ikke.
 *   2. indholdet — kun kendte svarværdier, og en besked på 10–4000 tegn, hvor
 *      en besked er påkrævet.
 *   3. timegrænsen — over MAKS_PR_TIME rækker på en time, og scriptet holder
 *      op med at skrive.
 */

var ARK_NAVN     = 'Feedback';   // fanen i regnearket
var MAIL_TIL     = '';           // din mail — tom betyder ingen besked
var MAKS_PR_TIME = 50;
var SKEMA        = '2';

/* De første elleve er det oprindelige ark. Nye kolonner kommer bagefter. */
var KOLONNER = ['Tidspunkt','Nøgle','Titel','Kilde','Tilstand','Type',
                'Besked','Navn','Skærm','Browser','Status',
                'Visning','Rolle','Anvendelse','Fungerede','Brug igen',
                'Tydeligt','Forstået','E-mail','URL','Skema'];

/* Tilladte svar. Alt andet afvises — også fra en, der poster direkte. */
var VALG = {
  rolle:      ['Underviser','Elev','Andet'],
  anvendelse: ['Kun afprøvet','På tavlen','Eleverne arbejdede selv','Begge dele'],
  fungerede:  ['Godt','Delvist','Dårligt'],
  igen:       ['Ja','Måske','Nej','Ved ikke endnu'],
  tydeligt:   ['Ja','Delvist','Nej'],
  forstaaet:  ['Ja','Lidt','Nej','Ved ikke'],
  /* «Mangler» og «Idé» er samlet i «Forslag», men gamle sider i en
     browsercache kan stadig sende dem. */
  type:       ['Fejl','Forslag','Spørgsmål','Ros','Mangler','Idé']
};

function doPost(e){
  var svar;
  try {
    svar = modtag_((e && e.parameter) || {}, new Date());
  } catch (fejl) {
    console.error(fejl);                                      // ses i Apps Scripts log
    svar = { ok: false, fejl: 'server' };
  }
  return json_(svar);
}

/** Åbnes adressen i en browser, skal den sige noget venligt — så kan du se,
 *  at udrulningen virker, uden at skulle sende en rigtig besked. */
function doGet(){
  return ContentService.createTextOutput('smbi.dk tager imod feedback her (skema ' + SKEMA + ').');
}

function json_(svar){
  return ContentService.createTextOutput(JSON.stringify(svar))
    .setMimeType(ContentService.MimeType.JSON);
}

/** Selve kontrollen og skrivningen. Adskilt fra doPost, så den kan testes. */
function modtag_(p, nu){
  if (p.hjemmeside) return { ok: true };                      // 1. honningkrukken

  var raekke = fortolk_(p);                                   // 2. indholdet
  if (!raekke) return { ok: false, fejl: 'ugyldig' };

  var ark = hentArk_();
  if (forMangeDenSenesteTime_(ark, nu)) {                     // 3. timegrænsen
    advarEnGang_();
    return { ok: false, fejl: 'travlt' };
  }

  raekke['Tidspunkt'] = nu;
  raekke['Nøgle']     = tekst_(p.noegle, 200);
  raekke['Titel']     = tekst_(p.titel, 200);
  raekke['Kilde']     = tekst_(p.kilde, 120);
  raekke['Tilstand']  = tekst_(p.tilstand, 80);
  raekke['URL']       = tekst_(p.url, 500);
  raekke['Skærm']     = tekst_(p.skaerm, 40);
  raekke['Browser']   = tekst_(p.browser, 300);
  raekke['Status']    = '';                                   // din egen kolonne

  var overskrifter = ark.getRange(1, 1, 1, ark.getLastColumn()).getValues()[0];
  ark.appendRow(overskrifter.map(function(navn){
    return Object.prototype.hasOwnProperty.call(raekke, navn) ? raekke[navn] : '';
  }));

  sendMail_(raekke);
  return { ok: true };
}

/** Lægger afsendelsen ud i kolonner — eller giver null, hvis den ikke duer.
 *  Kun de svar, der hører til den valgte rolle og visning, kommer med. */
function fortolk_(p){
  var besked = String(p.besked || '').trim();
  if (besked.length > 4000) return null;

  var r = { 'Besked': tekst_(besked, 4000) };

  /* Gammel feedback.js (intet skema): kategori, besked og evt. navn. */
  if (!p.skema){
    if (besked.length < 10) return null;
    r['Visning'] = 'besked';
    r['Type']    = valg_('type', p.type);
    r['Navn']    = tekst_(p.navn, 80);
    r['Skema']   = '1';
    return r;
  }

  var email = String(p.email || '').trim();
  if (email && !gyldigEmail_(email)) return null;
  r['E-mail'] = tekst_(email, 200);
  r['Skema']  = SKEMA;

  if (p.visning === 'besked'){
    if (besked.length < 10) return null;
    if (p.type && !valg_('type', p.type)) return null;
    r['Visning'] = 'besked';
    r['Type']    = valg_('type', p.type);
    return r;
  }

  if (p.visning !== 'evaluering') return null;
  var rolle = valg_('rolle', p.rolle);
  if (!rolle) return null;
  r['Visning'] = 'evaluering';
  r['Rolle']   = rolle;

  if (rolle === 'Andet'){
    if (besked.length < 10) return null;
    return r;
  }

  var felter = rolle === 'Underviser'
    ? { anvendelse: 'Anvendelse', fungerede: 'Fungerede', igen: 'Brug igen' }
    : { tydeligt: 'Tydeligt', forstaaet: 'Forstået' };
  for (var navn in felter){
    if (p[navn] && !valg_(navn, p[navn])) return null;        // ukendt svar
    r[felter[navn]] = valg_(navn, p[navn]);
  }
  /* «Hvordan fungerede det?» giver kun mening, når det er brugt i undervisning. */
  if (rolle === 'Underviser' && (!r['Anvendelse'] || r['Anvendelse'] === 'Kun afprøvet'))
    r['Fungerede'] = '';

  var besvaret = rolle === 'Underviser'
    ? r['Fungerede'] || r['Brug igen']
    : r['Tydeligt'] || r['Forstået'];
  if (!besvaret && !besked) return null;                      // rolle alene er ikke nok
  return r;
}

function valg_(navn, vaerdi){
  vaerdi = String(vaerdi || '');
  return VALG[navn].indexOf(vaerdi) >= 0 ? vaerdi : '';
}

function gyldigEmail_(s){
  return s.length <= 200 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s);
}

function hentArk_(){
  var bog = SpreadsheetApp.getActiveSpreadsheet();
  var ark = bog.getSheetByName(ARK_NAVN);
  if (!ark) {
    ark = bog.insertSheet(ARK_NAVN);
    ark.appendRow(KOLONNER);
    ark.setFrozenRows(1);
    ark.getRange(1, 1, 1, KOLONNER.length).setFontWeight('bold');
    return ark;
  }
  /* Det eksisterende ark: læg de manglende overskrifter til sidst. */
  var har = ark.getRange(1, 1, 1, Math.max(1, ark.getLastColumn())).getValues()[0];
  var mangler = KOLONNER.filter(function(k){ return har.indexOf(k) < 0; });
  if (mangler.length){
    var start = ark.getLastColumn() + 1;
    ark.getRange(1, start, 1, mangler.length).setValues([mangler]).setFontWeight('bold');
  }
  return ark;
}

function forMangeDenSenesteTime_(ark, nu){
  var sidste = ark.getLastRow();
  if (sidste <= 1) return false;
  var antal = Math.min(MAKS_PR_TIME, sidste - 1);
  var tider = ark.getRange(sidste - antal + 1, 1, antal, 1).getValues();
  var graense = nu.getTime() - 3600 * 1000;
  var nye = tider.filter(function(r){
    return r[0] instanceof Date && r[0].getTime() > graense;
  });
  return nye.length >= MAKS_PR_TIME;
}

/** Løber grænsen fuld, skal du vide det — men ikke få 500 mails om det. */
function advarEnGang_(){
  if (!MAIL_TIL) return;
  var lager = PropertiesService.getScriptProperties();
  var sidst = Number(lager.getProperty('advaret') || 0);
  if (Date.now() - sidst < 6 * 3600 * 1000) return;
  lager.setProperty('advaret', String(Date.now()));
  MailApp.sendEmail(MAIL_TIL, 'smbi.dk: timegrænsen for feedback er nået',
    'Der er kommet over ' + MAKS_PR_TIME + ' tilbagemeldinger på en time.\n' +
    'Resten skrives ikke i arket, før det falder til ro. Se efter spam.');
}

function sendMail_(r){
  if (!MAIL_TIL) return;
  var titel = String(r['Titel'] || r['Nøgle'] || 'smbi.dk');
  var linjer = ['Rolle','Anvendelse','Fungerede','Brug igen','Tydeligt','Forstået','Type']
    .filter(function(k){ return r[k]; })
    .map(function(k){ return (k + ':          ').slice(0, 12) + r[k]; });
  var valg = r['E-mail'] ? { replyTo: r['E-mail'] } : {};
  MailApp.sendEmail(MAIL_TIL,
    'Feedback: ' + titel + (r['Rolle'] ? ' (' + r['Rolle'].toLowerCase() + ')' : ''),
    (linjer.length ? linjer.join('\n') + '\n\n' : '') +
    (r['Besked'] || '(ingen tekst)') + '\n\n' +
    '— — —\n' +
    'Punkt:      ' + r['Nøgle'] + '\n' +
    'Fra:        ' + r['Kilde'] + (r['Tilstand'] ? ' (' + r['Tilstand'] + ')' : '') + '\n' +
    'E-mail:     ' + (r['E-mail'] || r['Navn'] || 'ikke oplyst') + '\n' +
    'Skærm:      ' + r['Skærm'] + '\n' +
    (r['URL'] || 'https://smbi.dk/' + r['Nøgle']),
    valg);
}

/** Klipper og afvæbner: en celle, der begynder med = + - @, ville Sheets
 *  ellers læse som en formel. */
function tekst_(vaerdi, maks){
  var s = String(vaerdi || '').slice(0, maks);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}
