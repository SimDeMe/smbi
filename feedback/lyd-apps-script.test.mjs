// Kører lyd-apps-script.gs i Node mod en falsk Google. node feedback/lyd-apps-script.test.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const SESSION = '3f2b8c1e-7a4d-4e5f-9b6a-1c2d3e4f5a6b';
const KODE = 'god-kode-til-test-123';
const WEBM = Buffer.from([0x1a, 0x45, 0xdf, 0xa3, 1, 2, 3, 4, 5]).toString('base64');
const DAG = 86400e3;

function nyGoogle() {
  const ark = new Map(), filer = [], triggere = [], lager = { mappe: 'M' };
  const google = { ark, filer, triggere, lager, fejlVedFil: false, mails: [] };
  const fane = navn => {
    const r = { data: [],
      appendRow: raekke => { r.data.push(raekke); },
      getDataRange: () => ({ getValues: () => r.data.map(x => [...x]) }),
      getLastRow: () => r.data.length,
      getRange: (a, b) => ({ getValue: () => r.data[a - 1][b - 1], setFontWeight: () => {} }),
      deleteRow: n => { r.data.splice(n - 1, 1); },
      setFrozenRows: () => {} };
    ark.set(navn, r);
    return r;
  };
  const nyFil = (navn, indhold, type) => {
    if (google.fejlVedFil) throw new Error('Drive nede');
    const f = { navn, indhold, type, trashed: false, oprettet: new Date(),
      getUrl: () => `https://drive.test/${navn}`, getDateCreated: () => f.oprettet, setTrashed: v => { f.trashed = v; } };
    filer.push(f);
    return f;
  };
  const iter = liste => ({ hasNext: () => liste.length > 0, next: () => liste.shift() });
  const mappe = {
    createFile: (a, b, c) => typeof a === 'string' ? nyFil(a, b, c) : nyFil(a.navn, a.bytes, a.type),
    getFilesByName: navn => iter(filer.filter(f => f.navn === navn && !f.trashed)),
    getFiles: () => iter(filer.filter(f => !f.trashed)),
  };
  google.kontekst = vm.createContext({
    console: { error: () => {} },
    LockService: { getScriptLock: () => ({ waitLock: () => {}, releaseLock: () => {} }) },
    ContentService: { MimeType: { JSON: 'json' }, createTextOutput: t => ({ tekst: t, setMimeType() { return this; } }) },
    SpreadsheetApp: {
      getActiveSpreadsheet: () => ({ getSheetByName: n => ark.get(n) ?? null, insertSheet: n => fane(n) }),
      getUi: () => ({ alert: t => { google.besked = t; }, createMenu: () => ({ addItem() { return this; }, addToUi() {} }) }),
    },
    DriveApp: { getFolderById: () => mappe, createFolder: () => ({ getId: () => 'NY' }) },
    PropertiesService: { getScriptProperties: () => ({ getProperty: k => lager[k] ?? null, setProperty: (k, v) => { lager[k] = v; } }) },
    Utilities: {
      // Som i Apps Script: bytes er fortegnsheltal.
      base64Decode: s => [...Buffer.from(s, 'base64')].map(b => b > 127 ? b - 256 : b),
      newBlob: (bytes, type, navn) => ({ bytes, type, navn }),
      getUuid: () => 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
    },
    MailApp: { sendEmail: (...a) => { google.mails.push(a); } },
    ScriptApp: {
      getProjectTriggers: () => triggere.map(t => ({ getHandlerFunction: () => t })),
      deleteTrigger: t => { triggere.splice(triggere.indexOf(t.getHandlerFunction()), 1); },
      newTrigger: n => ({ timeBased: () => ({ everyDays: () => ({ atHour: () => ({ create: () => { triggere.push(n); } }) }) }) }),
    },
  });
  vm.runInContext(readFileSync(new URL('./lyd-apps-script.gs', import.meta.url), 'utf8'), google.kontekst);
  vm.runInContext('fane_("Koder", KODER); fane_("Afleveringer", AFLEVERINGER);', google.kontekst);
  google.kode = (kode = KODE, felter = {}) => ark.get('Koder').data.push([kode, felter.simulation ?? 'geografi/luftmasser', felter.aktiv ?? true,
    felter.udloeber ?? new Date(Date.now() + DAG), felter.maks ?? 3, '']);
  google.post = krop => JSON.parse(google.kontekst.doPost({ postData: { contents: typeof krop === 'string' ? krop : JSON.stringify(krop) } }).tekst);
  google.rader = () => ark.get('Afleveringer').data.slice(1);
  google.aktive = () => filer.filter(f => !f.trashed);
  return google;
}
const felter = (ekstra = {}) => ({
  kode: KODE, session: SESSION, simulation: 'geografi/luftmasser', version: 'luftpakke16', opgave: '',
  startet: '2026-11-01T10:00:00Z', varighed_ms: 65000, lydformat: 'audio/webm;codecs=opus',
  starttilstand: { profil: 'afkoeling' }, log: [{ t: 24000, handling: 'klik stabil', tilstand: { profil: 'stabil', luft: 'toer', hoejde_m: 0 } }],
  lyd: WEBM, ...ekstra,
});

// Godkendt aflevering: to filer, én række og kvittering.
{
  const g = nyGoogle(); g.kode();
  assert.deepEqual(g.post(felter()), { ok: true, kvittering: '3F2B8C1E' });
  assert.equal(g.rader().length, 1);
  assert.equal(g.aktive().length, 2);
  const lyd = g.aktive().find(f => f.navn.endsWith('.webm'));
  assert.equal(lyd.type, 'audio/webm');
  assert.equal(lyd.indhold.length, 9);
  const log = g.aktive().find(f => f.navn.endsWith('-log.txt')).indhold;
  assert.match(log, /00:24 {2}klik stabil {2}· {2}stabil, toer, 0 m/);
  assert.match(g.rader()[0][9], /drive\.test/);
  assert.equal(g.rader()[0][6], '01:05');
}
// Dobbeltafsendelse giver samme kvittering og ingen nye filer.
{
  const g = nyGoogle(); g.kode();
  g.post(felter());
  assert.deepEqual(g.post(felter()), { ok: true, kvittering: '3F2B8C1E' });
  assert.equal(g.rader().length, 1);
  assert.equal(g.aktive().length, 2);
}
// Drive fejler: ingen kvittering og ingen række; genforsøget giver ingen dublet af resterne.
{
  const g = nyGoogle(); g.kode();
  g.fejlVedFil = true;
  assert.deepEqual(g.post(felter()), { ok: false, fejl: 'server' });
  assert.equal(g.rader().length, 0);
  g.fejlVedFil = false;
  // Halv aflevering: lyden blev gemt, men rækken nåede aldrig frem.
  g.kontekst.DriveApp.getFolderById().createFile({ navn: `geografi-luftmasser-${SESSION}.webm`, bytes: [], type: 'audio/webm' });
  assert.equal(g.post(felter()).ok, true);
  assert.equal(g.aktive().filter(f => f.navn.endsWith('.webm')).length, 1);
}
// Koder: forkert, slukket, udløbet eller til en anden simulation.
for (const opsaet of [
  g => g.kode('anden-kode-end-denne'),
  g => g.kode(KODE, { aktiv: false }),
  g => g.kode(KODE, { udloeber: new Date(Date.now() - DAG) }),
  g => g.kode(KODE, { simulation: 'biologi/andet' }),
]) {
  const g = nyGoogle(); opsaet(g);
  assert.deepEqual(g.post(felter()), { ok: false, fejl: 'kode' });
  assert.equal(g.filer.length, 0);
}
// Ugyldigt indhold afvises, før noget gemmes.
for (const [ekstra, fejl] of [
  [{ session: '../../andres-fil' }, 'session'],
  [{ kode: '' }, 'kode'],
  [{ lyd: Buffer.from('<script>x</script>').toString('base64') }, 'lydformat'],
  [{ lydformat: 'text/html' }, 'lydformat'],
  [{ lydformat: 'constructor' }, 'lydformat'],
  [{ lyd: '' }, 'lyd'],
  [{ lyd: 'A'.repeat(30 * 1024 * 1024) }, 'stoerrelse'],
  [{ varighed_ms: 0 }, 'varighed'],
  [{ varighed_ms: 16 * 60 * 1000 }, 'varighed'],
  [{ log: 'ikke en liste' }, 'log'],
  [{ log: Array(2001).fill({}) }, 'log'],
  [{ startet: 'igår' }, 'startet'],
]) {
  const g = nyGoogle(); g.kode();
  assert.equal(g.post(felter(ekstra)).fejl, fejl, JSON.stringify(Object.keys(ekstra)));
  assert.equal(g.filer.length, 0);
  assert.equal(g.rader().length, 0);
}
// Ulæselig krop giver et svar, ikke en fejlside.
{
  const g = nyGoogle();
  assert.deepEqual(g.post('ikke json'), { ok: false, fejl: 'server' });
}
// Tekst fra browseren kan ikke blive til en formel i arket.
{
  const g = nyGoogle(); g.kode();
  g.post(felter({ version: '=IMPORTXML("https://ond.test","//a")', opgave: '@ond' }));
  assert.equal(g.rader()[0][3].slice(0, 2), "'=");
  assert.equal(g.rader()[0][4].slice(0, 2), "'@");
}
// Kvoten: kodens loft stopper nye, men ikke et genforsøg af en allerede modtaget.
{
  const g = nyGoogle(); g.kode();
  const id = i => `3f2b8c1e-7a4d-4e5f-9b6a-1c2d3e4f5a6${i}`;
  for (let i = 0; i < 3; i++) assert.equal(g.post(felter({ session: id(i) })).ok, true);
  assert.deepEqual(g.post(felter({ session: id(3) })), { ok: false, fejl: 'kvote' });
  assert.equal(g.post(felter({ session: id(0) })).ok, true);
}
// Safari optager mp4.
{
  const g = nyGoogle(); g.kode();
  const mp4 = Buffer.from([0, 0, 0, 28, 0x66, 0x74, 0x79, 0x70, 1]).toString('base64');
  assert.equal(g.post(felter({ lyd: mp4, lydformat: 'audio/mp4' })).ok, true);
  assert.ok(g.aktive().some(f => f.navn.endsWith('.m4a')));
}
// Mail er valgfri, og en fejl i den vælter ikke kvitteringen.
{
  const g = nyGoogle(); g.kode();
  vm.runInContext('MAIL_TIL = "e@x.test"', g.kontekst);
  g.kontekst.MailApp.sendEmail = () => { throw new Error('kvote'); };
  assert.equal(g.post(felter()).ok, true);
}
// Oprydningen: gamle filer i papirkurven og gamle rækker væk; nye står. Også rester uden række.
{
  const g = nyGoogle(); g.kode();
  g.post(felter());
  g.post(felter({ session: '3f2b8c1e-7a4d-4e5f-9b6a-1c2d3e4f5a60' }));
  // Datoen skal komme fra scriptets egen verden, ellers svigter instanceof Date.
  const gammel = vm.runInContext(`new Date(${Date.now() - 61 * DAG})`, g.kontekst);
  g.rader()[0][0] = gammel;
  g.filer.slice(0, 2).forEach(f => { f.oprettet = gammel; });
  const rest = g.kontekst.DriveApp.getFolderById().createFile({ navn: 'rest.webm', bytes: [], type: 'audio/webm' });
  rest.oprettet = gammel;
  g.kontekst.ryd();
  assert.equal(g.rader().length, 1);
  assert.equal(g.filer.filter(f => f.trashed).length, 3);
  assert.equal(g.aktive().length, 2);
}
// Opsætning kan køres igen uden at lave to oprydninger, og linket bliver rigtigt.
{
  const g = nyGoogle();
  delete g.lager.mappe;
  g.kontekst.saetOp(); g.kontekst.saetOp();
  assert.equal(g.lager.mappe, 'NY');
  assert.equal(g.triggere.length, 1);
  g.kontekst.nytLink();
  assert.match(g.besked, /https:\/\/smbi\.dk\/geografi\/luftmasser\/\?afproevning=[0-9a-z]{32}/);
  const kode = g.ark.get('Koder').data.at(-1);
  assert.equal(kode[2], true);
  assert.ok(kode[3] > new Date());
}
// 60 dage plus Googles 30 i papirkurven skal passe med løftet til deltageren.
{
  const dage = vm.runInContext('OPBEVARING_DAGE', nyGoogle().kontekst);
  const lovet = readFileSync(new URL('./lyd-config.js', import.meta.url), 'utf8').match(/opbevaringDage:\s*(\d+)/)[1];
  assert.equal(dage + 30, Number(lovet));
}
console.log('lyd-apps-script.test.mjs: alt bestået');
