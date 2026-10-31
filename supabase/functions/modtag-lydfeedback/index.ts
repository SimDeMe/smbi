// Modtager én lydaflevering. Deltagerne har ingen Supabase-konto, så funktionen
// kører uden JWT-krav (se supabase/config.toml); adgangen afgøres af afprøvningskoden.
import { createClient } from 'npm:@supabase/supabase-js@2.118.0';
import { modtag } from './logik.js';

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false },
});
const OPRINDELSER = ['https://smbi.dk', 'https://www.smbi.dk', 'http://localhost:8777'];

const tjek = <T extends { error: unknown }>(r: T): T => {
  if (r.error) throw r.error;
  return r;
};

const lager = {
  hentKode: async (kode: string) =>
    tjek(await db.from('afproevningskoder').select('aktiv,udloeber,simulation,maks_afleveringer').eq('kode', kode).maybeSingle()).data,
  hentAflevering: async (session: string) =>
    tjek(await db.from('lydfeedback').select('status,kode,lydsti').eq('session', session).maybeSingle()).data,
  tael: async ({ kode, siden }: { kode?: string; siden?: Date }) => {
    let q = db.from('lydfeedback').select('session', { count: 'exact', head: true });
    if (kode) q = q.eq('kode', kode);
    if (siden) q = q.gte('oprettet', siden.toISOString());
    return tjek(await q).count ?? 0;
  },
  opret: async (raekke: Record<string, unknown>) => { tjek(await db.from('lydfeedback').insert(raekke)); },
  gemLyd: async (sti: string, bytes: Uint8Array, type: string) => {
    tjek(await db.storage.from('lydfeedback').upload(sti, bytes, { contentType: type, upsert: true }));
  },
  bekraeft: async (session: string) => {
    tjek(await db.from('lydfeedback').update({ status: 'modtaget' }).eq('session', session));
  },
};

Deno.serve(async (req) => {
  const oprindelse = req.headers.get('origin') ?? '';
  const cors = {
    'Access-Control-Allow-Origin': OPRINDELSER.includes(oprindelse) ? oprindelse : OPRINDELSER[0],
    'Access-Control-Allow-Headers': 'content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  };
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  const svar = (status: number, krop: unknown) =>
    new Response(JSON.stringify(krop), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
  if (req.method !== 'POST') return svar(405, { ok: false, fejl: 'metode' });
  if (Number(req.headers.get('content-length') ?? 0) > 13 * 1024 * 1024) return svar(413, { ok: false, fejl: 'stoerrelse' });
  try {
    const { status, svar: krop } = await modtag(Object.fromEntries(await req.formData()), lager);
    return svar(status, krop);
  } catch (fejl) {
    console.error(fejl);
    return svar(500, { ok: false, fejl: 'server' });
  }
});
