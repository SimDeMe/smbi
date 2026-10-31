// Ejerens oversigt: lyt, læs log, hent og slet. Adgangen håndhæves af Supabases
// regler (supabase/migrations); login her er kun vejen til at bevise, hvem man er.
// supabase-js er valgt for login og fornyelse af sessioner; kun denne side henter den.
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0/+esm';
import { LYD_CONFIG } from './lyd-config.js';

const $ = id => document.getElementById(id);
const besked = (tekst, fejl = false) => { $('besked').textContent = tekst; $('besked').className = fejl ? 'fejl' : ''; };
const tid = ms => `${String(Math.floor(ms / 60000)).padStart(2, '0')}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}`;
const dato = t => new Date(t).toLocaleString('da-DK', { dateStyle: 'medium', timeStyle: 'short' });
const element = (navn, egenskaber = {}, ...boern) => {
  const el = Object.assign(document.createElement(navn), egenskaber);
  el.append(...boern);
  return el;
};

if (!LYD_CONFIG.supabaseUrl) {
  besked('Lydfeedback er ikke sat op endnu. Se feedback/LYD.md.');
} else {
  const db = createClient(LYD_CONFIG.supabaseUrl, LYD_CONFIG.anonNoegle);

  async function visTilstand() {
    const { data: { session } } = await db.auth.getSession();
    $('login').hidden = !!session;
    $('indhold').hidden = !session;
    if (session) await hent();
  }

  async function hent() {
    besked('Henter …');
    const { data, error } = await db.from('lydfeedback').select('*').eq('status', 'modtaget').order('oprettet', { ascending: false });
    if (error) return besked('Kunne ikke hente listen. Er din bruger skrevet ind i tabellen ejere?', true);
    besked(data.length ? `${data.length} afleveringer` : 'Ingen afleveringer endnu.');
    $('liste').replaceChildren(...data.map(post));
  }

  function post(r) {
    const lyd = element('audio', { controls: true, preload: 'none' });
    const afspil = element('button', { type: 'button', textContent: 'Hent lyd til afspilning', className: 'primaer' });
    const klargoer = async () => {
      if (lyd.src) return true;
      const { data, error } = await db.storage.from('lydfeedback').createSignedUrl(r.lydsti, 3600);
      if (error) { besked('Lyden kunne ikke hentes.', true); return false; }
      lyd.src = data.signedUrl;
      afspil.remove();
      return true;
    };
    afspil.addEventListener('click', klargoer);

    const log = element('ol', { className: 'log' }, ...(r.log ?? []).map(h => {
      const hop = element('button', { type: 'button', textContent: tid(h.t) });
      hop.setAttribute('aria-label', `Hop til ${tid(h.t)}`);
      hop.addEventListener('click', async () => {
        if (await klargoer()) { lyd.currentTime = h.t / 1000; lyd.play(); }
      });
      return element('li', {}, hop, `${h.handling} · ${[h.tilstand?.profil, h.tilstand?.luft, h.tilstand?.hoejde_m != null ? `${h.tilstand.hoejde_m} m` : null].filter(Boolean).join(', ')}`);
    }));

    const slet = element('button', { type: 'button', textContent: 'Slet' });
    const kort = element('article', { className: 'post' },
      element('h2', { textContent: r.simulation }),
      element('p', { className: 'meta', textContent: `Kvittering ${r.session.slice(0, 8).toUpperCase()} · ${dato(r.startet)} · ${tid(r.varighed_ms)} · version ${r.version || 'ukendt'} · slettes ${dato(r.slet_efter)}` }),
      lyd,
      element('div', { className: 'raekke' }, afspil, slet),
      element('details', {}, element('summary', { textContent: `Log (${(r.log ?? []).length} handlinger), start: ${JSON.stringify(r.starttilstand)}` }), log));

    slet.addEventListener('click', async () => {
      if (!confirm(`Slet aflevering ${r.session.slice(0, 8).toUpperCase()} for altid?`)) return;
      // Lyden først: fejler det, er rækken der stadig, så intet bliver forældreløst.
      const fjern = await db.storage.from('lydfeedback').remove([r.lydsti]);
      if (fjern.error) return besked('Lyden kunne ikke slettes.', true);
      const { error } = await db.from('lydfeedback').delete().eq('session', r.session);
      if (error) return besked('Lyden er slettet, men metadata kunne ikke slettes.', true);
      kort.remove();
      besked('Slettet.');
    });
    return kort;
  }

  $('login').addEventListener('submit', async e => {
    e.preventDefault();
    const { error } = await db.auth.signInWithPassword({ email: $('mail').value, password: $('kodeord').value });
    $('kodeord').value = '';
    if (error) return besked('Login mislykkedes.', true);
    besked('');
    visTilstand();
  });
  $('logud').addEventListener('click', async () => { await db.auth.signOut(); $('liste').replaceChildren(); besked(''); visTilstand(); });
  $('opdater').addEventListener('click', hent);
  visTilstand();
}
