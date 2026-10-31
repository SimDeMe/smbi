// Sletter afleveringer efter slet_efter og uploads, der aldrig blev færdige.
// Kaldes en gang i døgnet af pg_cron med hemmeligheden RYD_NOEGLE (se feedback/LYD.md).
import { createClient } from 'npm:@supabase/supabase-js@2.118.0';

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false },
});

Deno.serve(async (req) => {
  const noegle = Deno.env.get('RYD_NOEGLE');
  if (!noegle || req.headers.get('x-ryd-noegle') !== noegle) return new Response('Nej', { status: 403 });
  const nu = new Date(), doegn = new Date(nu.getTime() - 86400e3);
  const { data, error } = await db.from('lydfeedback').select('session,lydsti')
    .or(`slet_efter.lt.${nu.toISOString()},and(status.eq.modtager,oprettet.lt.${doegn.toISOString()})`).limit(500);
  if (error) { console.error(error); return new Response('Fejl', { status: 500 }); }
  if (data.length) {
    // Lyden først: fejler det, står rækken tilbage, og næste kørsel prøver igen.
    const fjern = await db.storage.from('lydfeedback').remove(data.map((r) => r.lydsti));
    if (fjern.error) { console.error(fjern.error); return new Response('Fejl', { status: 500 }); }
    const slet = await db.from('lydfeedback').delete().in('session', data.map((r) => r.session));
    if (slet.error) { console.error(slet.error); return new Response('Fejl', { status: 500 }); }
  }
  return Response.json({ slettet: data.length });
});
