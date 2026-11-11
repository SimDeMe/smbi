// Udtræk fra FAO CLIMWAT 2.0 uden at køre Windows-installationsprogrammet.
// Hent CLIMWAT2.zip fra FAO, pak ZIP ud, og kør:
// node atlas/data/fao-klima.mjs <CLIMWAT_2.0_for_CROPWAT_Setup.EXE>
// Se fao-klima.LICENSE for kilde, metode og begrænsninger.
import { readFileSync, writeFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';

export const KILDESHA = '885685ef01b7ba92115ff44afefc757d5a7c42d6a382f1c3fbde50b7b204bddd';
export const KILDEURL = 'https://www.fao.org/fileadmin/user_upload/faowater/Applications/CLIMWAT2.zip';

function udpak(exe) {
  if (createHash('sha256').update(exe).digest('hex') !== KILDESHA) {
    throw new Error('Ukendt CLIMWAT-arkiv. Kontrollér filformat og kilde før import.');
  }
  // GkWare SFX: zlib-strøm med filposter (520 byte UTF-16-navn, uint64-længde).
  const filer = inflateSync(exe.subarray(75132), { maxOutputLength: 20_000_000 });
  for (let o = 0; o + 528 <= filer.length;) {
    const navn = filer.subarray(o, o + 520).toString('utf16le').split('\0')[0];
    const n = Number(filer.readBigUInt64LE(o + 520));
    if (!Number.isSafeInteger(n) || o + 528 + n > filer.length) throw new Error('Ugyldig filpost');
    if (navn === 'SETUP.DA_') {
      return inflateSync(filer.subarray(o + 536, o + 528 + n), { maxOutputLength: 40_000_000 });
    }
    o += 528 + n;
  }
  throw new Error('FAO-databasen mangler i arkivet');
}

export function laesStation(database, kode) {
  const navneposition = database.indexOf(kode, 0, 'ascii');
  // CLIMWAT2_data.raw: int16 bredde/længde (1/100°) og højde (m),
  // otte felter med 13 int32 (1/100 enhed; plads 0 ubrugt), derefter 59 byte navn.
  const o = navneposition - 422;
  if (o < 0 || navneposition + 59 > database.length) throw new Error(`Station mangler: ${kode}`);
  const felt = nr => Array.from({ length: 12 }, (_, i) => database.readInt32LE(o + 6 + nr * 52 + (i + 1) * 4) / 100);
  const station = {
    navn: database.subarray(navneposition + 35, navneposition + 59).toString('ascii').trim(),
    kode, omraade: 'Somalia', punkt: [database.readInt16LE(o + 2) / 100, database.readInt16LE(o) / 100],
    hoejde: database.readInt16LE(o + 4), kilde: 'FAO CLIMWAT 2.0',
    kildeurl: 'https://www.fao.org/land-water/land/land-governance-and-planning/land-resources-planning-toolbox/detail/climwat---climatic-database-to-be-used-with-cropwat/en',
    periode: 'Måleperiode ikke oplyst', tmin: felt(1), tmax: felt(0), n: felt(7)
  };
  station.t = station.tmin.map((v, i) => +((v + station.tmax[i]) / 2).toFixed(2));
  if (station.t.some((v, i) => v < -60 || v > 45 || station.tmin[i] > station.tmax[i]) ||
      station.n.some(v => v < 0 || v > 2000)) throw new Error(`Ugyldige værdier: ${kode}`);
  return station;
}

export function udtraek(exe) {
  const database = udpak(exe);
  const stationer = ['SO25MGDS', 'SO32LGGN', 'SO02CHSM', 'SO94HRGS'].map(k => laesStation(database, k));
  // Uafhængig kontrol mod Rome-tabellen i FAO's medfølgende CLIMWAT_2.pdf.
  const rom = laesStation(database, 'IT12RMCL');
  if (rom.punkt[0] !== 12.48 || rom.punkt[1] !== 41.9 || rom.tmin[0] !== 4.5 ||
      rom.tmax[6] !== 30.4 || rom.n.reduce((a, b) => a + b, 0) !== 818) throw new Error('Kontrol mod FAO-manualens Rome-tabel fejlede');
  const mog = stationer[0];
  if (mog.punkt[0] !== 45.35 || mog.punkt[1] !== 2.03 || mog.hoejde !== 9) throw new Error('Forkert stationsplacering');
  return { kilde: 'FAO CLIMWAT 2.0 (2006)', kildeurl: KILDEURL, arkivsha256: KILDESHA, lande: { '706': stationer } };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (!process.argv[2]) throw new Error('Angiv FAO-installationsarkivet (.EXE). Programmet køres ikke.');
  const supplement = udtraek(readFileSync(process.argv[2]));
  writeFileSync(new URL('./fao-klima.json', import.meta.url), JSON.stringify(supplement, null, 2) + '\n');
  const sti = new URL('./klima.json', import.meta.url);
  const klima = JSON.parse(readFileSync(sti));
  Object.assign(klima.lande, supplement.lande);
  klima.supplement = supplement.kilde;
  writeFileSync(sti, JSON.stringify(klima));
  console.log('Somalia: fire FAO-stationer; øvrige lande bevaret.');
}
