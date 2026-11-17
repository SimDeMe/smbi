// Kører apps-script.gs (feedbackmodtageren) i Node mod et falsk Google-ark.
// node feedback/apps-script.test.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const GAMLE = ['Tidspunkt','Nøgle','Titel','Kilde','Tilstand','Type','Besked','Navn','Skærm','Browser','Status'];

function nyGoogle({ ark: start } = {}) {
  const google = { faner: new Map(), mails: [] };
  const fane = (navn, data = []) => {
    const f = { data,
      appendRow: r => { f.data.push([...r]); },
      getLastRow: () => f.data.length,
      getLastColumn: () => Math.max(0, ...f.data.map(r => r.length)),
      setFrozenRows: () => {},
      getRange: (r, c, nr = 1, nc = 1) => ({
        getValues: () => Array.from({ length: nr }, (_, i) =>
          Array.from({ length: nc }, (_, j) => f.data[r - 1 + i]?.[c - 1 + j] ?? '')),
        setValues: v => { v.forEach((rk, i) => rk.forEach((x, j) => {
          const rr = f.data[r - 1 + i] ??= []; rr[c - 1 + j] = x; })); return { setFontWeight() {} }; },
        setFontWeight: () => {},
      }) };
    google.faner.set(navn, f);
    return f;
  };
  if (start) fane('Feedback', start);
  google.kontekst = vm.createContext({
    console: { error: e => { google.fejl = e; } },
    ContentService: { MimeType: { JSON: 'json' }, createTextOutput: t => ({ tekst: t, setMimeType() { return this; } }) },
    SpreadsheetApp: { getActiveSpreadsheet: () => ({ getSheetByName: n => google.faner.get(n) ?? null, insertSheet: n => fane(n) }) },
    PropertiesService: { getScriptProperties: () => ({ getProperty: () => null, setProperty() {} }) },
    MailApp: { sendEmail: (...a) => { google.mails.push(a); } },
  });
  vm.runInContext(readFileSync(new URL('./apps-script.gs', import.meta.url), 'utf8'), google.kontekst);
  google.post = p => JSON.parse(google.kontekst.doPost({ parameter: p }).tekst);
  google.ark = () => google.faner.get('Feedback');
  google.sidste = () => { const a = google.ark(); const h = a.data[0];
    return Object.fromEntries(h.map((k, i) => [k, a.data.at(-1)[i] ?? ''])); };
  return google;
}

const FAELLES = { skema: '2', noegle: 'geografi/Dugpunkt.html', titel: 'Dugpunkt', kilde: 'siden selv',
  url: 'https://smbi.dk/geografi/Dugpunkt.html', skaerm: '1280×577', browser: 'test' };

// Eksisterende ark med gamle rækker: nye kolonner lægges til sidst, intet flyttes.
{
  const gammel = [new Date(0), 'x', 'X', 'kilde', '', 'Idé', 'gammel besked her', 'Ole', '', '', 'set'];
  const g = nyGoogle({ ark: [[...GAMLE], gammel] });
  assert.deepEqual(g.post({ ...FAELLES, visning: 'evaluering', rolle: 'Underviser',
    anvendelse: 'På tavlen', fungerede: 'Godt', igen: 'Ja' }), { ok: true });
  const a = g.ark();
  assert.deepEqual(a.data[0].slice(0, 11), GAMLE, 'de gamle overskrifter står, hvor de stod');
  assert.ok(a.data[0].includes('Rolle') && a.data[0].includes('E-mail') && a.data[0].includes('URL'));
  assert.deepEqual(a.data[1], gammel, 'den gamle række er urørt');
  const r = g.sidste();
  assert.equal(r.Rolle, 'Underviser'); assert.equal(r.Anvendelse, 'På tavlen');
  assert.equal(r.Fungerede, 'Godt'); assert.equal(r['Brug igen'], 'Ja');
  assert.equal(r.Visning, 'evaluering'); assert.equal(r.Skema, '2');
  assert.equal(r.Titel, 'Dugpunkt'); assert.equal(r.URL, FAELLES.url);
  assert.equal(r.Besked, ''); assert.equal(r['E-mail'], '');
  assert.equal(Object.prototype.toString.call(r.Tidspunkt), '[object Date]');
}

// Nyt ark: overskrifter oprettes, elevsvar gemmes; irrelevante felter for rollen smides væk.
{
  const g = nyGoogle();
  assert.deepEqual(g.post({ ...FAELLES, visning: 'evaluering', rolle: 'Elev', tydeligt: 'Delvist',
    forstaaet: 'Ved ikke', anvendelse: 'På tavlen', fungerede: 'Godt', type: 'Fejl', email: 'elev@skole.dk' }), { ok: true });
  const r = g.sidste();
  assert.equal(r.Tydeligt, 'Delvist'); assert.equal(r['Forstået'], 'Ved ikke');
  assert.equal(r.Anvendelse, ''); assert.equal(r.Fungerede, ''); assert.equal(r.Type, '');
  assert.equal(r['E-mail'], 'elev@skole.dk');
}

// «Fungerede» gemmes ikke ved «Kun afprøvet».
{
  const g = nyGoogle();
  g.post({ ...FAELLES, visning: 'evaluering', rolle: 'Underviser', anvendelse: 'Kun afprøvet', fungerede: 'Dårligt', igen: 'Måske' });
  assert.equal(g.sidste().Fungerede, ''); assert.equal(g.sidste()['Brug igen'], 'Måske');
}

// Afvisninger: rolle alene, ukendte værdier, ugyldig e-mail, tom besked i den direkte visning.
{
  const g = nyGoogle();
  for (const p of [
    { visning: 'evaluering', rolle: 'Elev' },
    { visning: 'evaluering', rolle: 'Underviser', anvendelse: 'På tavlen' },
    { visning: 'evaluering', rolle: 'Rektor', tydeligt: 'Ja' },
    { visning: 'evaluering', rolle: 'Elev', tydeligt: 'Måske' },
    { visning: 'evaluering', rolle: 'Elev', tydeligt: 'Ja', email: 'ikke-en-mail' },
    { visning: 'evaluering', rolle: 'Andet', besked: 'kort' },
    { visning: 'besked', besked: '' },
    { visning: 'besked', besked: 'Grafen forsvinder', type: 'Klage' },
    { visning: 'noget', besked: 'Grafen forsvinder' },
  ]) assert.deepEqual(g.post({ ...FAELLES, ...p }), { ok: false, fejl: 'ugyldig' }, JSON.stringify(p));
  assert.equal(g.ark()?.data.length ?? 0, 0, 'intet skrevet');
}

// Direkte besked uden kategori, med kategori, og «Andet».
{
  const g = nyGoogle();
  assert.equal(g.post({ ...FAELLES, visning: 'besked', besked: 'Grafen forsvinder på mobil' }).ok, true);
  assert.equal(g.sidste().Visning, 'besked'); assert.equal(g.sidste().Type, ''); assert.equal(g.sidste().Rolle, '');
  assert.equal(g.post({ ...FAELLES, visning: 'besked', type: 'Forslag', besked: 'En knap til at nulstille' }).ok, true);
  assert.equal(g.sidste().Type, 'Forslag');
  assert.equal(g.post({ ...FAELLES, visning: 'evaluering', rolle: 'Andet', besked: 'Jeg er forælder og kiggede' }).ok, true);
  assert.equal(g.sidste().Rolle, 'Andet');
}

// Gammel feedback.js (uden skema) tages stadig imod.
{
  const g = nyGoogle({ ark: [[...GAMLE]] });
  assert.equal(g.post({ noegle: 'a', titel: 'A', type: 'Idé', besked: 'Gammel klient sender stadig', navn: 'Ida' }).ok, true);
  const r = g.sidste();
  assert.equal(r.Type, 'Idé'); assert.equal(r.Navn, 'Ida'); assert.equal(r.Skema, '1');
  assert.deepEqual(g.post({ noegle: 'a', besked: 'kort' }), { ok: false, fejl: 'ugyldig' });
}

// Honningkrukken: «ok» til botten, men intet skrevet. Formler afvæbnes.
{
  const g = nyGoogle();
  assert.deepEqual(g.post({ ...FAELLES, visning: 'besked', besked: 'Køb billige ure her', hjemmeside: 'x' }), { ok: true });
  assert.equal(g.ark(), undefined);
  g.post({ ...FAELLES, visning: 'besked', besked: '=HYPERLINK("x")  virker ikke' });
  assert.ok(g.sidste().Besked.startsWith("'="));
}

// Timegrænsen giver en ærlig fejl.
{
  const g = nyGoogle({ ark: [[...GAMLE]] });
  const nu = vm.runInContext('new Date()', g.kontekst);   // Date fra scriptets egen verden
  for (let i = 0; i < 50; i++) g.ark().data.push([nu, 'a', '', '', '', '', 'besked her', '', '', '', '']);
  assert.deepEqual(g.post({ ...FAELLES, visning: 'besked', besked: 'Endnu en besked her' }), { ok: false, fejl: 'travlt' });
}

console.log('apps-script.gs: alle test bestået');
