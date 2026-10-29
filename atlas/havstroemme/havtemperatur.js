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

export async function hentHavtemperatur() {
  if (typeof DecompressionStream === 'undefined') throw new Error('Browseren kan ikke pakke data ud');
  const svar = await fetch(new URL('../data/havtemperatur.bin', import.meta.url), { signal: AbortSignal.timeout(20000) });
  if (!svar.ok) throw new Error('Havtemperaturen kunne ikke hentes');
  const ud = svar.body.pipeThrough(new DecompressionStream('gzip'));
  return afkod(new Uint8Array(await new Response(ud).arrayBuffer()));
}
