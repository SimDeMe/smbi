/**
 * apps-script.gs — modtager feedback fra smbi.dk og skriver den i et Google-ark.
 *
 * Koden hører ikke til på hjemmesiden. Den indsættes i et Apps Script-projekt,
 * der er knyttet til arket, og rulles ud som webapp. Fremgangsmåden står i
 * feedback/LÆS-MIG.md.
 *
 * Tre spærringer mod spam:
 *   1. honningkrukken — feltet «hjemmeside» er skjult på siden, så kun en bot
 *      udfylder det. Er der noget i det, skrives rækken ikke.
 *   2. længden — under 10 eller over 4000 tegn er ikke en tilbagemelding.
 *   3. timegrænsen — over MAKS_PR_TIME rækker på en time, og scriptet holder
 *      op med at skrive. Det er den eneste af de tre, der hjælper mod én, der
 *      poster direkte til adressen uden om formularen.
 *
 * Afsenderen får altid det samme svar. En bot skal ikke kunne se, hvad der
 * virkede, og hvad der ikke gjorde.
 */

var ARK_NAVN     = 'Feedback';   // fanen i regnearket
var MAIL_TIL     = '';           // din mail — tom betyder ingen besked
var MAKS_PR_TIME = 50;

var KOLONNER = ['Tidspunkt','Nøgle','Titel','Kilde','Tilstand','Type',
                'Besked','Navn','Skærm','Browser','Status'];

function doPost(e){
  try {
    var p = (e && e.parameter) || {};

    if (p.hjemmeside) return kvittering();                    // 1. honningkrukken

    var besked = String(p.besked || '').trim();               // 2. længden
    if (besked.length < 10 || besked.length > 4000) return kvittering();

    var ark = hentArk_();
    if (forMangeDenSenesteTime_(ark)) {                       // 3. timegrænsen
      advarEnGang_();
      return kvittering();
    }

    ark.appendRow([
      new Date(),
      klip_(p.noegle, 200),
      klip_(p.titel, 200),
      klip_(p.kilde, 120),
      klip_(p.tilstand, 80),
      klip_(p.type, 40),
      besked,
      klip_(p.navn, 80),
      klip_(p.skaerm, 40),
      klip_(p.browser, 300),
      ''                                                      // din egen statuskolonne
    ]);

    sendMail_(p, besked);

  } catch (fejl) {
    console.error(fejl);                                      // ses i Apps Scripts log
  }
  return kvittering();
}

/** Åbnes adressen i en browser, skal den sige noget venligt — så kan du se,
 *  at udrulningen virker, uden at skulle sende en rigtig besked. */
function doGet(){
  return ContentService.createTextOutput('smbi.dk tager imod feedback her.');
}

function kvittering(){
  return ContentService.createTextOutput('ok');
}

function hentArk_(){
  var bog = SpreadsheetApp.getActiveSpreadsheet();
  var ark = bog.getSheetByName(ARK_NAVN);
  if (!ark) {
    ark = bog.insertSheet(ARK_NAVN);
    ark.appendRow(KOLONNER);
    ark.setFrozenRows(1);
    ark.getRange(1, 1, 1, KOLONNER.length).setFontWeight('bold');
  }
  return ark;
}

function forMangeDenSenesteTime_(ark){
  var sidste = ark.getLastRow();
  if (sidste <= 1) return false;
  var antal = Math.min(MAKS_PR_TIME, sidste - 1);
  var tider = ark.getRange(sidste - antal + 1, 1, antal, 1).getValues();
  var graense = Date.now() - 3600 * 1000;
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

function sendMail_(p, besked){
  if (!MAIL_TIL) return;
  var titel = String(p.titel || p.noegle || 'smbi.dk');
  MailApp.sendEmail(MAIL_TIL,
    'Feedback: ' + titel,
    besked + '\n\n' +
    '— — —\n' +
    'Punkt:    ' + (p.noegle || '') + '\n' +
    'Fra:      ' + (p.kilde || '') + (p.tilstand ? ' (' + p.tilstand + ')' : '') + '\n' +
    'Type:     ' + (p.type || '') + '\n' +
    'Navn:     ' + (p.navn || 'ikke oplyst') + '\n' +
    'Skærm:    ' + (p.skaerm || '') + '\n' +
    'https://smbi.dk/' + (p.noegle || ''));
}

function klip_(vaerdi, maks){
  return String(vaerdi || '').slice(0, maks);
}
