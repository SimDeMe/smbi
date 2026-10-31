// Modtagelsen af én aflevering, uden Supabase-kode, så den kan testes i Node.
// `lager` er en lille grænseflade, som index.ts opfylder med den rigtige klient.

export const GRAENSER = {
  bytes: 12 * 1024 * 1024,   // samme loft som bucketten
  varighedMs: 15 * 60 * 1000 + 5000,
  logBytes: 256 * 1024,
  logRaekker: 2000,
  prKodePrTime: 20,
  iAltPrDoegn: 50,
};

const FORMATER = {
  'audio/webm': { endelse: 'webm', passer: b => b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3 },
  'audio/ogg': { endelse: 'ogg', passer: b => String.fromCharCode(b[0], b[1], b[2], b[3]) === 'OggS' },
  'audio/mp4': { endelse: 'm4a', passer: b => String.fromCharCode(b[4], b[5], b[6], b[7]) === 'ftyp' },
};
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

const afvis = (status, fejl) => ({ status, svar: { ok: false, fejl } });
const kvittering = session => ({ status: 200, svar: { ok: true, kvittering: session.slice(0, 8).toUpperCase() } });
const json = tekst => { try { return JSON.parse(tekst); } catch { return undefined; } };

// felter: kode, session, simulation, version, opgave, startet, varighed_ms,
// lydformat, starttilstand, log (tekst) og lyd (Blob).
export async function modtag(felter, lager, nu = new Date()) {
  const { kode, session, simulation, lyd } = felter;
  if (typeof kode !== 'string' || !kode) return afvis(403, 'kode');
  if (typeof session !== 'string' || !UUID.test(session)) return afvis(400, 'session');
  if (typeof simulation !== 'string' || !simulation) return afvis(400, 'simulation');
  if (!lyd || typeof lyd.arrayBuffer !== 'function') return afvis(400, 'lyd');
  if (lyd.size === 0 || lyd.size > GRAENSER.bytes) return afvis(413, 'stoerrelse');

  const koden = await lager.hentKode(kode);
  if (!koden || !koden.aktiv || new Date(koden.udloeber) <= nu || koden.simulation !== simulation) return afvis(403, 'kode');

  const lydformat = String(felter.lydformat || '');
  const format = FORMATER[lydformat.split(';')[0].trim()];
  if (!format) return afvis(415, 'lydformat');
  const bytes = new Uint8Array(await lyd.arrayBuffer());
  if (!format.passer(bytes)) return afvis(415, 'lydformat');

  const varighed = Number(felter.varighed_ms);
  if (!Number.isInteger(varighed) || varighed <= 0 || varighed > GRAENSER.varighedMs) return afvis(400, 'varighed');
  const startet = new Date(felter.startet);
  if (Number.isNaN(startet.getTime())) return afvis(400, 'startet');
  const logTekst = String(felter.log ?? '[]');
  const log = json(logTekst);
  if (!Array.isArray(log) || logTekst.length > GRAENSER.logBytes || log.length > GRAENSER.logRaekker) return afvis(400, 'log');
  const starttilstandTekst = String(felter.starttilstand ?? '{}');
  const starttilstand = json(starttilstandTekst);
  if (!starttilstand || typeof starttilstand !== 'object' || starttilstandTekst.length > 4096) return afvis(400, 'starttilstand');

  // Et genforsøg efter et tabt svar må hverken give en dublet eller overskrive.
  const findes = await lager.hentAflevering(session);
  if (findes?.status === 'modtaget') return kvittering(session);
  if (findes && findes.kode !== kode) return afvis(403, 'kode');

  if (!findes) {
    const time = new Date(nu.getTime() - 3600e3), doegn = new Date(nu.getTime() - 86400e3);
    if (await lager.tael({ kode }) >= koden.maks_afleveringer) return afvis(429, 'kvote');
    if (await lager.tael({ kode, siden: time }) >= GRAENSER.prKodePrTime) return afvis(429, 'kvote');
    if (await lager.tael({ siden: doegn }) >= GRAENSER.iAltPrDoegn) return afvis(429, 'kvote');
  }

  const lydsti = findes?.lydsti ?? `${simulation.replace(/[^a-zA-Z0-9-]+/g, '-')}/${session}.${format.endelse}`;
  if (!findes) await lager.opret({
    session, kode, simulation, lydsti,
    version: String(felter.version || '').slice(0, 80),
    opgave: String(felter.opgave || '').slice(0, 200),
    startet: startet.toISOString(), varighed_ms: varighed, lydformat,
    stoerrelse: bytes.length, starttilstand, log,
  });
  await lager.gemLyd(lydsti, bytes, lydformat.split(';')[0].trim());
  // Først her er både lyd og metadata på plads, og først nu får deltageren kvittering.
  await lager.bekraeft(session);
  return kvittering(session);
}
