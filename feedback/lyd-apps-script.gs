/**
 * lyd-apps-script.gs — modtager lydfeedback fra smbi.dk og gemmer den i Google Drive.
 *
 * Koden hører ikke til på hjemmesiden. Den indsættes i et Apps Script-projekt,
 * der er knyttet til et eget regneark, og rulles ud som webapp. Fremgangsmåden
 * står i feedback/LYD.md. Testes med  node feedback/lyd-apps-script.test.mjs
 *
 * Adgangen afgøres af afprøvningskoden i fanen Koder. Lyd og log lægges i en
 * privat Drive-mappe; rækken i fanen Afleveringer skrives til sidst, og først da
 * får deltageren kvittering.
 *
 * Sletning: ryd() flytter filer til papirkurven efter OPBEVARING_DAGE, og Google
 * tømmer papirkurven efter 30 dage. Tilsammen er det de 90 dage, deltageren får at vide.
 */

var MAIL_TIL        = '';     // din mail — tom betyder ingen besked
var OPBEVARING_DAGE = 60;
var SIMULATION      = 'geografi/luftmasser';   // bruges af «Nyt afprøvningslink»

var MAKS_BYTES       = 20 * 1024 * 1024;
var MAKS_VARIGHED_MS = 15 * 60 * 1000 + 5000;
var MAKS_LOG         = 2000;
var MAKS_PR_KODE_TIME = 20;
var MAKS_I_DOEGN     = 50;

var KODER        = ['Kode','Simulation','Aktiv','Udløber','Maks afleveringer','Note'];
var AFLEVERINGER = ['Modtaget','Kvittering','Simulation','Version','Opgave','Startet','Varighed',
                    'Format','MB','Lydfil','Log','Starttilstand','Handlinger','Session','Kode'];
var FORMATER = {
  'audio/webm': { endelse: 'webm', passer: function(b){ return b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3; } },
  'audio/ogg':  { endelse: 'ogg',  passer: function(b){ return b[0] === 0x4f && b[1] === 0x67 && b[2] === 0x67 && b[3] === 0x53; } },
  'audio/mp4':  { endelse: 'm4a',  passer: function(b){ return b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70; } }
};
var UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

function doPost(e){
  var svar, laas = LockService.getScriptLock();
  try {
    laas.waitLock(60000);       // to afleveringer ad gangen må ikke snyde kvoten eller give dubletter
    svar = modtag_(JSON.parse(e.postData.contents), new Date());
  } catch (fejl) {
    console.error(fejl);
    svar = { ok: false, fejl: 'server' };
  }
  try { laas.releaseLock(); } catch (fejl) {}
  return ContentService.createTextOutput(JSON.stringify(svar)).setMimeType(ContentService.MimeType.JSON);
}

function doGet(){
  return ContentService.createTextOutput('smbi.dk tager imod lydfeedback her.');
}

function modtag_(d, nu){
  var afvis = function(fejl){ return { ok: false, fejl: fejl }; };
  if (typeof d.kode !== 'string' || !d.kode) return afvis('kode');
  if (typeof d.session !== 'string' || !UUID.test(d.session)) return afvis('session');
  if (typeof d.lyd !== 'string' || !d.lyd) return afvis('lyd');
  if (d.lyd.length > MAKS_BYTES * 4 / 3 + 8) return afvis('stoerrelse');

  var kode = raekker_('Koder').filter(function(r){ return r.Kode === d.kode; })[0];
  if (!kode || kode.Aktiv !== true || !(kode['Udløber'] > nu) || kode.Simulation !== d.simulation) return afvis('kode');

  var kvittering = d.session.slice(0, 8).toUpperCase();
  var afleveringer = raekker_('Afleveringer');
  // Et genforsøg efter et tabt svar må ikke give en dublet.
  if (afleveringer.some(function(r){ return r.Session === d.session; })) return { ok: true, kvittering: kvittering };

  var lydformat = String(d.lydformat || '');
  var type = lydformat.split(';')[0].trim();
  var format = FORMATER.hasOwnProperty(type) ? FORMATER[type] : null;
  if (!format) return afvis('lydformat');
  var bytes = Utilities.base64Decode(d.lyd);
  if (!bytes.length || bytes.length > MAKS_BYTES) return afvis('stoerrelse');
  if (!format.passer(bytes.slice(0, 8).map(function(b){ return b & 0xff; }))) return afvis('lydformat');

  if (!(Number.isInteger(d.varighed_ms) && d.varighed_ms > 0 && d.varighed_ms <= MAKS_VARIGHED_MS)) return afvis('varighed');
  var startet = new Date(d.startet);
  if (isNaN(startet.getTime())) return afvis('startet');
  if (!Array.isArray(d.log) || d.log.length > MAKS_LOG) return afvis('log');

  var time = nu.getTime() - 3600e3, doegn = nu.getTime() - 86400e3;
  var fraKoden = afleveringer.filter(function(r){ return r.Kode === d.kode; });
  if (fraKoden.length >= Number(kode['Maks afleveringer'])) return afvis('kvote');
  if (fraKoden.filter(function(r){ return r.Modtaget.getTime() > time; }).length >= MAKS_PR_KODE_TIME) return afvis('kvote');
  if (afleveringer.filter(function(r){ return r.Modtaget.getTime() > doegn; }).length >= MAKS_I_DOEGN) return afvis('kvote');

  var mappe = hentMappe_();
  var stamme = d.simulation.replace(/[^a-zA-Z0-9-]+/g, '-') + '-' + d.session;
  fjernRester_(mappe, stamme + '.' + format.endelse);
  fjernRester_(mappe, stamme + '-log.txt');
  var lydfil = mappe.createFile(Utilities.newBlob(bytes, type, stamme + '.' + format.endelse));
  var logfil = mappe.createFile(stamme + '-log.txt', logTekst_(d, kvittering), 'text/plain');

  fane_('Afleveringer', AFLEVERINGER).appendRow([
    nu, kvittering, d.simulation, ren_(d.version, 80), ren_(d.opgave, 200), startet, tid_(d.varighed_ms),
    ren_(lydformat, 40), Math.round(bytes.length / 104857.6) / 10, lydfil.getUrl(), logfil.getUrl(),
    ren_(JSON.stringify(d.starttilstand || {}), 500), d.log.length, d.session, d.kode
  ]);
  sendMail_(d, kvittering, lydfil.getUrl());
  return { ok: true, kvittering: kvittering };
}

/** Loggen som tekst, der kan læses ved siden af lyden. */
function logTekst_(d, kvittering){
  var linjer = [
    'Kvittering ' + kvittering, 'Simulation ' + d.simulation, 'Version ' + (d.version || 'ukendt'),
    'Start ' + JSON.stringify(d.starttilstand || {}), ''
  ];
  d.log.forEach(function(h){
    var t = h && h.tilstand ? h.tilstand : {};
    var tilstand = [t.profil, t.luft, t.hoejde_m != null ? t.hoejde_m + ' m' : null].filter(Boolean).join(', ');
    linjer.push(tid_(Number(h && h.t) || 0) + '  ' + String(h && h.handling || '').slice(0, 200) + (tilstand ? '  ·  ' + String(tilstand).slice(0, 200) : ''));
  });
  return linjer.join('\n');
}

/** En mislykket aflevering kan have efterladt filer, som genforsøget ellers ville dublere. */
function fjernRester_(mappe, navn){
  var filer = mappe.getFilesByName(navn);
  while (filer.hasNext()) filer.next().setTrashed(true);
}

/** Kaldes en gang i døgnet. Fejer efter dato i mappen, så også rester uden række forsvinder. */
function ryd(){
  var graense = Date.now() - OPBEVARING_DAGE * 86400e3;
  var filer = hentMappe_().getFiles();
  while (filer.hasNext()) {
    var fil = filer.next();
    if (fil.getDateCreated().getTime() < graense) fil.setTrashed(true);
  }
  var ark = fane_('Afleveringer', AFLEVERINGER);
  for (var r = ark.getLastRow(); r > 1; r--) {
    var modtaget = ark.getRange(r, 1).getValue();
    if (modtaget instanceof Date && modtaget.getTime() < graense) ark.deleteRow(r);
  }
}

/* ── Opsætning, køres fra menuen i arket ───────────────────────────────── */

function onOpen(){
  SpreadsheetApp.getUi().createMenu('Lydfeedback')
    .addItem('Sæt op', 'saetOp')
    .addItem('Nyt afprøvningslink', 'nytLink')
    .addToUi();
}

/** Laver faner, den private mappe og den daglige oprydning. Kan køres igen uden skade. */
function saetOp(){
  fane_('Koder', KODER);
  fane_('Afleveringer', AFLEVERINGER);
  var lager = PropertiesService.getScriptProperties();
  if (!lager.getProperty('mappe')) lager.setProperty('mappe', DriveApp.createFolder('smbi.dk lydfeedback').getId());
  ScriptApp.getProjectTriggers().forEach(function(t){
    if (t.getHandlerFunction() === 'ryd') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('ryd').timeBased().everyDays(1).atHour(3).create();
  SpreadsheetApp.getUi().alert('Klar. Optagelserne havner i Drive-mappen «smbi.dk lydfeedback».');
}

function nytLink(){
  var kode = Utilities.getUuid().replace(/-/g, '');
  var udloeber = new Date(Date.now() + 30 * 86400e3);
  fane_('Koder', KODER).appendRow([kode, SIMULATION, true, udloeber, 30, '']);
  SpreadsheetApp.getUi().alert('Linket gælder 30 dage og 30 afleveringer. Luk det ved at sætte Aktiv til FALSE.\n\n' +
    'https://smbi.dk/' + SIMULATION + '/?afproevning=' + kode);
}

/* ── Hjælpere ───────────────────────────────────────────────────────────── */

function hentMappe_(){
  var id = PropertiesService.getScriptProperties().getProperty('mappe');
  if (!id) throw new Error('Kør Lydfeedback → Sæt op i arket først.');
  return DriveApp.getFolderById(id);
}

function fane_(navn, kolonner){
  var bog = SpreadsheetApp.getActiveSpreadsheet();
  var ark = bog.getSheetByName(navn);
  if (!ark) {
    ark = bog.insertSheet(navn);
    ark.appendRow(kolonner);
    ark.setFrozenRows(1);
    ark.getRange(1, 1, 1, kolonner.length).setFontWeight('bold');
  }
  return ark;
}

function raekker_(navn){
  var ark = fane_(navn, navn === 'Koder' ? KODER : AFLEVERINGER);
  var data = ark.getDataRange().getValues(), hoved = data[0];
  return data.slice(1).map(function(raekke){
    var r = {};
    hoved.forEach(function(k, i){ r[k] = raekke[i]; });
    return r;
  });
}

function tid_(ms){
  var s = Math.floor(ms / 1000), m = Math.floor(s / 60);
  return (m < 10 ? '0' : '') + m + ':' + (s % 60 < 10 ? '0' : '') + (s % 60);
}

/** Tekst fra browseren må ikke kunne blive til en formel i arket. */
function ren_(vaerdi, maks){
  var tekst = String(vaerdi == null ? '' : vaerdi).slice(0, maks);
  return /^[=+\-@\t\r]/.test(tekst) ? "'" + tekst : tekst;
}

function sendMail_(d, kvittering, adresse){
  if (!MAIL_TIL) return;
  try {
    MailApp.sendEmail(MAIL_TIL, 'Lydfeedback: ' + d.simulation,
      'Ny optagelse på ' + tid_(d.varighed_ms) + '. Kvittering ' + kvittering + '.\n' + adresse);
  } catch (fejl) {
    console.error(fejl);          // afleveringen er gemt; en mail må ikke vælte kvitteringen
  }
}
