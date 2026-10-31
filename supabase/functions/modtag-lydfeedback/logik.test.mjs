// node supabase/functions/modtag-lydfeedback/logik.test.mjs
import assert from 'node:assert/strict';
import { modtag, GRAENSER } from './logik.js';

const NU = new Date('2026-11-01T12:00:00Z');
const SESSION = '3f2b8c1e-7a4d-4e5f-9b6a-1c2d3e4f5a6b';
const WEBM = new Blob([new Uint8Array([0x1a, 0x45, 0xdf, 0xa3, 1, 2, 3])], { type: 'audio/webm' });

function falskLager(koder = { 'god-kode-til-test': { aktiv: true, udloeber: '2027-01-01', simulation: 'geografi/luftmasser', maks_afleveringer: 3 } }) {
  const raekker = new Map(), filer = new Map();
  return {
    raekker, filer, fejlVedLyd: false,
    hentKode: async k => koder[k] ?? null,
    hentAflevering: async s => raekker.get(s) ?? null,
    tael: async ({ kode, siden }) => [...raekker.values()].filter(r => (!kode || r.kode === kode) && (!siden || r.oprettet >= siden)).length,
    opret: async r => { raekker.set(r.session, { ...r, status: 'modtager', oprettet: NU }); },
    async gemLyd(sti, bytes) { if (this.fejlVedLyd) throw new Error('lager nede'); filer.set(sti, bytes); },
    bekraeft: async s => { raekker.get(s).status = 'modtaget'; },
  };
}
const felter = (ekstra = {}) => ({
  kode: 'god-kode-til-test', session: SESSION, simulation: 'geografi/luftmasser', version: 'luftpakke16',
  startet: NU.toISOString(), varighed_ms: '60000', lydformat: 'audio/webm;codecs=opus',
  starttilstand: '{"profil":"afkoeling"}', log: '[{"t":1000,"handling":"klik"}]', lyd: WEBM, ...ekstra,
});

// Godkendt aflevering: kvittering først, når lyd og metadata er gemt.
{
  const l = falskLager();
  const r = await modtag(felter(), l, NU);
  assert.equal(r.status, 200);
  assert.equal(r.svar.kvittering, '3F2B8C1E');
  assert.equal(l.raekker.get(SESSION).status, 'modtaget');
  assert.equal(l.filer.size, 1);
  assert.ok([...l.filer.keys()][0].endsWith(`${SESSION}.webm`));
  assert.deepEqual(l.raekker.get(SESSION).log, [{ t: 1000, handling: 'klik' }]);
}
// Dobbeltafsendelse giver samme kvittering og ingen ny række eller ny skrivning.
{
  const l = falskLager();
  await modtag(felter(), l, NU);
  l.filer.clear();
  const r = await modtag(felter(), l, NU);
  assert.equal(r.status, 200);
  assert.equal(l.raekker.size, 1);
  assert.equal(l.filer.size, 0);
}
// Lageret fejler: ingen kvittering; genforsøg gør rækken færdig uden dublet.
{
  const l = falskLager();
  l.fejlVedLyd = true;
  await assert.rejects(modtag(felter(), l, NU));
  assert.equal(l.raekker.get(SESSION).status, 'modtager');
  l.fejlVedLyd = false;
  assert.equal((await modtag(felter(), l, NU)).status, 200);
  assert.equal(l.raekker.size, 1);
  assert.equal(l.raekker.get(SESSION).status, 'modtaget');
}
// Koder: forkert, slukket, udløbet eller til en anden simulation.
for (const koder of [{}, { 'god-kode-til-test': { aktiv: false, udloeber: '2027-01-01', simulation: 'geografi/luftmasser', maks_afleveringer: 3 } },
  { 'god-kode-til-test': { aktiv: true, udloeber: '2026-01-01', simulation: 'geografi/luftmasser', maks_afleveringer: 3 } },
  { 'god-kode-til-test': { aktiv: true, udloeber: '2027-01-01', simulation: 'biologi/andet', maks_afleveringer: 3 } }]) {
  const l = falskLager(koder);
  assert.equal((await modtag(felter(), l, NU)).status, 403);
  assert.equal(l.raekker.size, 0);
}
// En anden deltager kan ikke overtage en halvfærdig aflevering med en anden kode.
{
  const koder = { 'god-kode-til-test': { aktiv: true, udloeber: '2027-01-01', simulation: 'geografi/luftmasser', maks_afleveringer: 3 } };
  koder['anden-kode-til-test'] = koder['god-kode-til-test'];
  const l = falskLager(koder);
  l.fejlVedLyd = true;
  await assert.rejects(modtag(felter(), l, NU));
  l.fejlVedLyd = false;
  assert.equal((await modtag(felter({ kode: 'anden-kode-til-test' }), l, NU)).status, 403);
  assert.equal(l.filer.size, 0);
}
// Ugyldigt indhold afvises, før noget gemmes.
for (const [ekstra, status] of [
  [{ session: '../../andres-fil' }, 400],
  [{ lyd: new Blob([new TextEncoder().encode('<script>x</script>')]) }, 415],
  [{ lydformat: 'text/html' }, 415],
  [{ lyd: undefined }, 400],
  [{ lyd: new Blob([]) }, 413],
  [{ lyd: new Blob([new Uint8Array(GRAENSER.bytes + 1)]) }, 413],
  [{ varighed_ms: '0' }, 400],
  [{ varighed_ms: String(GRAENSER.varighedMs + 1) }, 400],
  [{ log: 'ikke json' }, 400],
  [{ log: '{"ikke":"liste"}' }, 400],
  [{ log: JSON.stringify(Array(GRAENSER.logRaekker + 1).fill(0)) }, 400],
  [{ startet: 'igår' }, 400],
]) {
  const l = falskLager();
  assert.equal((await modtag(felter(ekstra), l, NU)).status, status, JSON.stringify(Object.keys(ekstra)));
  assert.equal(l.raekker.size, 0);
  assert.equal(l.filer.size, 0);
}
// Kvoten: kodens loft stopper nye, men ikke et genforsøg af en allerede modtaget.
{
  const l = falskLager();
  const id = i => `3f2b8c1e-7a4d-4e5f-9b6a-1c2d3e4f5a6${i}`;
  for (let i = 0; i < 3; i++) assert.equal((await modtag(felter({ session: id(i) }), l, NU)).status, 200);
  const r = await modtag(felter({ session: id(3) }), l, NU);
  assert.equal(r.status, 429);
  assert.equal(r.svar.fejl, 'kvote');
  assert.equal((await modtag(felter({ session: id(0) }), l, NU)).status, 200);
}
// Safari optager mp4; filnavnet følger formatet.
{
  const l = falskLager();
  const mp4 = new Blob([new Uint8Array([0, 0, 0, 28, 0x66, 0x74, 0x79, 0x70, 1])]);
  assert.equal((await modtag(felter({ lyd: mp4, lydformat: 'audio/mp4' }), l, NU)).status, 200);
  assert.ok([...l.filer.keys()][0].endsWith('.m4a'));
}
console.log('logik.test.mjs: alt bestået');
