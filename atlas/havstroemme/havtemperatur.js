// Målt havoverfladetemperatur: årsmiddel 1991–2020 fra NOAA OISST v2 på
// 1°-gitter. Dannes af ../data/havtemperatur.py; se ../data/havtemperatur.LICENSE.
// Afkodningen og farverne bruger ikke DOM, så de kan testes i node.

export const NX = 360, NY = 180;
const LAND = -32768;

// Trin i °C med farver fra koldt blåt til varmt rødt; vises dæmpet under strømmene.
export const KLASSER = [
  [-2, '#2b3f8f'], [2, '#3463ae'], [6, '#3f8fc2'], [10, '#5db5c0'], [14, '#8fcea6'],
  [18, '#d3da86'], [22, '#f1bd5c'], [25, '#ea8944'], [27, '#d6553a'], [29, '#a52a3c'],
].map(([fra, farve]) => ({ fra, farve, rgb: [1, 3, 5].map(i => parseInt(farve.slice(i, i + 2), 16)) }));
export function klasseFor(t) {
  let k = 0;
  while (k < KLASSER.length - 1 && t >= KLASSER[k + 1].fra) k++;
  return k;
}

// Filen (efter gunzip): 'SST1', bredde og højde (uint16 LE), derefter
// int16 i tiendedele °C række for række fra nord; −32768 = land.
export function afkod(bytes) {
  const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (String.fromCharCode(...bytes.subarray(0, 4)) !== 'SST1' || v.getUint16(4, true) !== NX ||
      v.getUint16(6, true) !== NY || bytes.length !== 8 + 2 * NX * NY) {
    throw new Error('Havtemperaturen er ugyldig eller ufuldstændig');
  }
  const data = new Int16Array(NX * NY);
  for (let i = 0; i < data.length; i++) data[i] = v.getInt16(8 + 2 * i, true);
  return {
    data,
    // °C i cellen eller null på land.
    temperatur(lon, lat) {
      const i = Math.min(NX - 1, Math.max(0, Math.floor(((lon + 180) % 360 + 360) % 360)));
      const j = Math.min(NY - 1, Math.max(0, Math.floor(90 - lat)));
      const t = data[j * NX + i];
      return t === LAND ? null : t / 10;
    },
  };
}

export const hentHavtemperatur = async () => afkod(await hentGzip('havtemperatur.bin', 'Havtemperaturen kunne ikke hentes'));

// Målt afvigelse under El Niño 1997/98 og La Niña 2010/11 (NOAA ERSST v5,
// nov–jan minus 1991–2020). Dannes af ../data/enso.py; se ../data/enso.LICENSE.
// Filen (efter gunzip): 'ENSO', bredde og højde (uint16 LE), antal (uint8),
// derefter pr. hændelse int8 i tiendedele °C række for række fra nord; −128 = ingen.
export const HAENDELSER = ['elnino', 'lanina'];
export function afkodEnso(bytes) {
  const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (String.fromCharCode(...bytes.subarray(0, 4)) !== 'ENSO' || v.getUint16(4, true) !== NX ||
      v.getUint16(6, true) !== NY || v.getUint8(8) !== HAENDELSER.length || bytes.length !== 9 + HAENDELSER.length * NX * NY) {
    throw new Error('El Niño-data er ugyldige eller ufuldstændige');
  }
  const ud = {};
  HAENDELSER.forEach((navn, h) => {
    const data = new Int8Array(bytes.buffer, bytes.byteOffset + 9 + h * NX * NY, NX * NY);
    ud[navn] = (lon, lat) => {
      const i = Math.min(NX - 1, Math.max(0, Math.floor(((lon + 180) % 360 + 360) % 360)));
      const j = Math.min(NY - 1, Math.max(0, Math.floor(90 - lat)));
      const a = data[j * NX + i];
      return a === -128 ? 0 : a / 10;
    };
  });
  return ud;
}

// Normal temperatur plus fasens afvigelse; havis holder vandet ved frysepunktet.
// afvigelse(lon, lat) → °C eller null, når fasen er normal.
export function medFase(sst, enso, fase) {
  const afv = enso?.[fase];
  if (!sst) return null;
  if (!afv) return { temperatur: sst.temperatur, afvigelse: () => null, fase: 'normal' };
  return {
    fase,
    afvigelse: (lon, lat) => sst.temperatur(lon, lat) === null ? null : afv(lon, lat),
    temperatur(lon, lat) {
      const t = sst.temperatur(lon, lat);
      return t === null ? null : Math.max(-1.8, Math.round((t + afv(lon, lat)) * 10) / 10);
    },
  };
}

async function hentGzip(navn, fejl) {
  if (typeof DecompressionStream === 'undefined') throw new Error('Browseren kan ikke pakke data ud');
  const svar = await fetch(new URL(`../data/${navn}`, import.meta.url), { signal: AbortSignal.timeout(20000) });
  if (!svar.ok) throw new Error(fejl);
  const ud = svar.body.pipeThrough(new DecompressionStream('gzip'));
  return new Uint8Array(await new Response(ud).arrayBuffer());
}
export const hentEnso = async () => afkodEnso(await hentGzip('enso.bin', 'El Niño-data kunne ikke hentes'));
