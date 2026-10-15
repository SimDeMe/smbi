// Holocæne vulkaner fra Smithsonians Global Volcanism Program (GVP),
// Volcanoes of the World. Data dannes af data/vulkaner.py; se data/vulkaner.LICENSE.
// Signaturen er sort, så den ikke forveksles med skælvenes dybdefarver:
// fyldt trekant = udbrud siden 1900, åben = ældre holocænt eller udateret.

export const ORDEN = 2;
export const AFLAESNING = '#vulkanaflaesning';
export const NYLIG = 1900;

const PLACERING = {
  subduktion: 'subduktionszone', rift: 'riftzone (fra hinanden)',
  intraplade: 'inde på en plade, fx over en hotspot', ukendt: 'ukendt placering'
};

let data = null;
let henter = null;
let tegnede = [];

function kontrollerData(raa) {
  const v = raa?.vulkaner;
  if (!Array.isArray(v) || v.length < 1000 || v.some(x => !Array.isArray(x) || x.length !== 8 ||
      typeof x[0] !== 'string' || !x[0] || !Number.isFinite(x[1]) || Math.abs(x[1]) > 180 ||
      !Number.isFinite(x[2]) || Math.abs(x[2]) > 90 || !(x[4] in PLACERING) ||
      !(x[5] === null || Number.isInteger(x[5])))) {
    throw new Error('Vulkandata er ugyldige eller ufuldstændige');
  }
}

export function hent() {
  if (data) return Promise.resolve(data);
  henter ??= (async () => {
    const svar = await fetch(new URL('./data/vulkaner.json', import.meta.url), { signal: AbortSignal.timeout(12000) });
    if (!svar.ok) throw new Error('Vulkandata kunne ikke indlæses');
    const raa = await svar.json();
    kontrollerData(raa);
    data = raa.vulkaner.map(([navn, lon, lat, type, placering, aar, land, hoejde]) =>
      ({ navn, punkt: [lon, lat], type, placering, aar, land, hoejde }));
    return data;
  })().catch(fejl => { henter = null; throw fejl; });
  return henter;
}

// Antal pr. tektonisk placering, til tekstalternativet.
export function optaelling() {
  if (!data) return null;
  const antal = { subduktion: 0, rift: 0, intraplade: 0, ukendt: 0 };
  for (const v of data) antal[v.placering]++;
  return { i_alt: data.length, nylige: data.filter(v => v.aar >= NYLIG).length, ...antal };
}

export function tegn(ctx, { projektion, centrum, skala }) {
  if (!data) return;
  const d3 = window.d3;
  const s = Math.max(3.2, Math.min(6.5, skala / 60));
  tegnede = [];
  ctx.save();
  ctx.lineJoin = 'round';
  // Ældre først, så de nyligt aktive ligger øverst (filen er sorteret efter år).
  for (const v of data) {
    if (d3.geoDistance(centrum, v.punkt) >= Math.PI / 2 - .01) continue;
    const [x, y] = projektion(v.punkt);
    tegnede.push([v, x, y]);
    ctx.beginPath();
    ctx.moveTo(x, y - s * 1.15); ctx.lineTo(x + s, y + s * .6); ctx.lineTo(x - s, y + s * .6); ctx.closePath();
    ctx.lineWidth = 3; ctx.strokeStyle = '#fff9eecc'; ctx.stroke();
    ctx.lineWidth = 1.3; ctx.strokeStyle = '#17211f';
    if (v.aar >= NYLIG) { ctx.fillStyle = '#17211f'; ctx.fill(); }
    else { ctx.fillStyle = '#fff9ee'; ctx.fill(); ctx.stroke(); }
  }
  ctx.restore();
}

export function aar(v) {
  if (v.aar === null) return 'intet dateret udbrud';
  return v.aar < 0 ? `sidste udbrud ca. ${-v.aar} f.Kr.` : `sidste udbrud ${v.aar}`;
}

export function beskriv(v) {
  return `${v.navn} (${v.land}): ${v.type}, ${PLACERING[v.placering]}, ${aar(v)}`;
}

// Nærmeste tegnede vulkan inden for få pixel af skærmpunktet xy.
export function aflaes([x, y]) {
  let bedst = null, bedstAfstand = 12;
  for (const [v, vx, vy] of tegnede) {
    const afstand = Math.hypot(vx - x, vy - y);
    if (afstand < bedstAfstand) { bedst = v; bedstAfstand = afstand; }
  }
  return bedst ? beskriv(bedst) : 'ingen vulkan lige her';
}
