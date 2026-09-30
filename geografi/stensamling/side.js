/* ─────────────────────────────────────────────────────────
   Stensamlingen — indgangen: liste, nøgle og detaljevisning.

   Data ligger i én fil pr. hovedgruppe (mineraler.js osv.),
   samling.js samler dem, noegle.js er bestemmelsesnøglen og
   tegning.js tegner en sten, der endnu ikke er fotograferet.
   ───────────────────────────────────────────────────────── */

import {grupper, gruppe, alle, efterId, bjergarterMed, findKodeEllerNr, soeg, delNr, visNr} from './samling.js';
import {spoergsmaal, passer, antalPrSvar} from './noegle.js';
import {tegnSten} from './tegning.js';

const $ = s => document.querySelector(s);
const el = {
  grupper: $('#grupper'), soeg: $('#soeg'), noegleKnap: $('#btn-noegle'),
  noegle: $('#noegle'), liste: $('#liste'), antal: $('#antal'),
  detalje: $('#detalje'), sr: $('#sr-status'), facts: $('#facts')
};

const BILLEDMAPPE = 'stensamling/billeder/';

const tilstand = {gruppe:'alle', tekst:'', valg:{}, valgt:null, noegle:false};

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* ── Filtrering ─────────────────────────────────────────── */
function iGruppe(){
  const soegt = soeg(tilstand.tekst);
  return alle.filter(p =>
    (tilstand.gruppe === 'alle' || p.gruppe === tilstand.gruppe) &&
    (!soegt || soegt.includes(p)));
}
const synlige = () => iGruppe().filter(p => passer(p, tilstand.valg));

/* ── Gruppeknapper ──────────────────────────────────────── */
function bygGrupper(){
  const knapper = [{id:'alle', kortnavn:'Alle'}, ...grupper];
  el.grupper.innerHTML = knapper.map(g =>
    `<button type="button" class="btn-mini" data-g="${g.id}" aria-pressed="false"`
    + (g.flade ? ` style="--gf:${g.flade}"` : '') + `>${esc(g.kortnavn)}</button>`).join('');
  el.grupper.addEventListener('click', e => {
    const b = e.target.closest('button[data-g]');
    if(!b) return;
    tilstand.gruppe = b.dataset.g;
    tegnAlt();
  });
}

/* ── Nøglen ─────────────────────────────────────────────── */
function tegnNoegle(){
  el.noegle.hidden = !tilstand.noegle;
  el.noegleKnap.setAttribute('aria-pressed', tilstand.noegle);
  if(!tilstand.noegle) return;
  const antal = antalPrSvar(iGruppe(), tilstand.valg);
  el.noegle.querySelector('.n-raekker').innerHTML = spoergsmaal.map(s => `
    <div class="n-raekke" role="group" aria-label="${esc(s.navn)}">
      <div class="n-spm"><span class="mono">${esc(s.navn)}</span><small>${esc(s.hjaelp)}</small></div>
      <div class="n-svar">${s.svar.map(([v, tekst]) => {
        const valgt = tilstand.valg[s.id] === v, n = antal[s.id][v];
        return `<button type="button" class="chip" data-s="${s.id}" data-v="${v}" aria-pressed="${valgt}"`
          + (n === 0 && !valgt ? ' disabled' : '') + `>${esc(tekst)} <b>${n}</b></button>`;
      }).join('')}</div>
    </div>`).join('');
  el.noegle.querySelector('#n-nulstil').disabled = !Object.values(tilstand.valg).some(Boolean);
}

el.noegle.addEventListener('click', e => {
  const b = e.target.closest('button.chip');
  if(b){
    const {s, v} = b.dataset;
    tilstand.valg[s] = tilstand.valg[s] === v ? null : v;
    tegnAlt();
    /* fokus bliver på samme knap, selv om nøglen tegnes forfra */
    el.noegle.querySelector(`button.chip[data-s="${s}"][data-v="${v}"]`)?.focus();
    return;
  }
  if(e.target.closest('#n-nulstil')){ tilstand.valg = {}; tegnAlt(); }
});

el.noegleKnap.addEventListener('click', () => {
  tilstand.noegle = !tilstand.noegle;
  if(!tilstand.noegle) tilstand.valg = {};
  tegnAlt();
});

/* ── Listen ─────────────────────────────────────────────── */
function figur(post){
  const b = post.billeder?.[0];
  return b
    ? `<img src="${BILLEDMAPPE}${esc(b.fil)}" alt="${esc(b.tekst || post.navn)}" loading="lazy" data-id="${post.id}">`
    : tegnSten(post);
}

function kort(p){
  /* på kortet kun tallet, som det står på stenen — systemet står i detaljen */
  const nr = p.nr?.length
    ? `<span class="kort-nr" title="${esc(p.nr.map(visNr).join(', '))}">nr. ${esc(p.nr.map(v => delNr(v)?.tal ?? v).join(', '))}</span>`
    : '';
  return `<li><button type="button" class="kort" data-id="${p.id}" style="--gf:${gruppe[p.gruppe].flade}"
      aria-pressed="${tilstand.valgt === p}">
    <span class="kort-fig">${figur(p)}</span>
    <span class="kort-top"><span class="kort-kode">${p.kode}</span>${nr}</span>
    <span class="kort-navn">${esc(p.navn)}</span>
    <span class="kort-type">${esc(p.type)}</span>
  </button></li>`;
}

function tegnListe(){
  const vis = synlige();
  el.antal.textContent = vis.length === alle.length
    ? `${alle.length} i samlingen`
    : `${vis.length} af ${alle.length} passer`;

  if(!vis.length){
    el.liste.innerHTML = `<p class="tom">Ingen sten passer. Prøv at fjerne et svar i nøglen eller et ord i søgningen.</p>`;
    return;
  }
  const dele = tilstand.gruppe === 'alle' ? grupper : [gruppe[tilstand.gruppe]];
  el.liste.innerHTML = dele.map(g => {
    const her = vis.filter(p => p.gruppe === g.id);
    if(!her.length) return '';
    return `<section class="l-grp" style="--gf:${g.flade}">
      <h2 class="l-grp-h"><span class="l-grp-mark"></span>${esc(g.navn)}<span class="mono">${g.prefiks} · ${her.length}</span></h2>
      <ul class="kortgitter">${her.map(kort).join('')}</ul>
    </section>`;
  }).join('');
}

el.liste.addEventListener('click', e => {
  const b = e.target.closest('button.kort');
  if(b) vaelg(efterId[b.dataset.id], true);
});

/* Et foto, der ikke kan hentes, erstattes af tegningen. */
document.addEventListener('error', e => {
  const img = e.target;
  if(img.tagName !== 'IMG' || !img.dataset.id) return;
  const post = efterId[img.dataset.id];
  if(post) img.outerHTML = tegnSten(post);
}, true);

/* ── Detaljen ───────────────────────────────────────────── */
function tal(dt, dd, enhed){
  if(!dd) return '';
  return `<div><dt>${dt}</dt><dd>${esc(dd)}${enhed ? ` <small class="enhed">${enhed}</small>` : ''}</dd></div>`;
}
function afsnit(titel, tekst){
  return tekst ? `<section class="d-afs"><h3>${titel}</h3><p>${esc(tekst)}</p></section>` : '';
}

function tegnDetalje(){
  const p = tilstand.valgt;
  if(!p){
    el.detalje.innerHTML = `
      <div class="d-tom">
        <span class="mono">Stensamlingen</span>
        <h2>Vælg en sten</h2>
        <p>Klik på en sten i listen, eller skriv nummeret fra stenen i søgefeltet og tryk Enter.</p>
        <p>Ved du ikke, hvad du har i hånden? Tryk <b>Bestem sten</b>, og svar på det, du kan se og teste.</p>
      </div>`;
    return;
  }
  const g = gruppe[p.gruppe];
  const foto = p.billeder?.length;
  const fig = foto
    ? `<img src="${BILLEDMAPPE}${esc(p.billeder[0].fil)}" alt="${esc(p.billeder[0].tekst || p.navn)}" data-id="${p.id}" id="d-foto">`
    : tegnSten(p);
  const miniaturer = foto > 1
    ? `<div class="d-miniaturer" role="group" aria-label="Flere billeder">${p.billeder.map((b, i) =>
        `<button type="button" data-i="${i}" aria-pressed="${i === 0}"><img src="${BILLEDMAPPE}${esc(b.fil)}" alt="${esc(b.tekst || p.navn + ', billede ' + (i+1))}" loading="lazy"></button>`).join('')}</div>`
    : '';
  const billedtekst = foto
    ? `<p class="d-billedtekst" id="d-billedtekst">${esc(p.billeder[0].tekst || '')}${p.billeder[0].foto ? ` <span class="mono">Foto: ${esc(p.billeder[0].foto)}</span>` : ''}</p>`
    : `<p class="d-billedtekst"><span class="mono">Tegning — stenen er ikke fotograferet endnu</span></p>`;

  const erMineral = p.gruppe === 'mineral';
  const taltabel = erMineral
    ? tal('Formel', p.formel) + tal('Hårdhed', p.haardhed, 'Mohs') + tal('Densitet', p.densitet, 'g/cm³')
      + tal('Streg', p.streg) + tal('Glans', p.glans) + tal('Spaltning', p.spaltning)
    : tal('Kornstørrelse', p.kornstoerrelse) + tal('Densitet', p.densitet, 'g/cm³');

  const mineraler = (p.mineraler || []).length
    ? `<section class="d-afs"><h3>Mineralindhold</h3><ul class="d-min">${p.mineraler.map(m => {
        const navn = m.id ? efterId[m.id]?.navn || m.id : m.navn;
        const andel = m.andel ? ` <small>${esc(m.andel)}</small>` : '';
        return m.id && efterId[m.id]
          ? `<li><button type="button" class="d-link" data-id="${m.id}">${esc(navn)}${andel}</button></li>`
          : `<li><span>${esc(navn)}${andel}</span></li>`;
      }).join('')}</ul></section>`
    : '';

  const iBjergarter = erMineral ? bjergarterMed(p.id) : [];
  const findesI = iBjergarter.length
    ? `<section class="d-afs"><h3>Findes i samlingens bjergarter</h3><ul class="d-min">${iBjergarter.map(b =>
        `<li><button type="button" class="d-link" data-id="${b.id}">${esc(b.navn)} <small>${b.kode}</small></button></li>`).join('')}</ul></section>`
    : '';

  const se = (p.se || []).length
    ? `<section class="d-afs"><h3>Se også</h3><ul class="d-se">${p.se.map(s =>
        `<li><a href="${esc(s.href)}">${esc(s.tekst)} →</a></li>`).join('')}</ul></section>`
    : '';

  const nr = p.nr?.length
    ? p.nr.map(v => `<span class="d-pille"><span class="mono">Nr.</span> <b>${esc(visNr(v))}</b></span>`).join('')
    : `<span class="d-pille tom"><span class="mono">Intet nr. registreret</span></span>`;
  const sted = p.placering
    ? `<span class="d-pille"><span class="mono">Står</span> <b>${esc(p.placering)}</b></span>`
    : `<span class="d-pille tom"><span class="mono">Placering ikke registreret</span></span>`;

  el.detalje.innerHTML = `
    <div class="d-fig" style="--gf:${g.flade}">${fig}</div>
    ${miniaturer}${billedtekst}
    <div class="d-id">
      <span class="d-kode" title="Samlingens referencekode">${p.kode}</span>
      ${nr}${sted}
    </div>
    <span class="d-grp mono"><span class="d-grp-mark" style="--gf:${g.flade}"></span>${esc(g.ental)} · ${esc(p.type)}</span>
    <h2 class="d-navn" id="d-navn" tabindex="-1">${esc(p.navn)}</h2>
    ${p.andreNavne?.length ? `<p class="d-alias">Også: ${esc(p.andreNavne.join(', '))}</p>` : ''}
    <p class="d-kort">${esc(p.kort)}</p>
    ${taltabel ? `<dl class="d-tal">${taltabel}</dl>` : ''}
    ${afsnit('Sådan kendes den', p.kendetegn)}
    ${mineraler}
    ${afsnit('Dannelse', p.dannelse)}
    ${afsnit('Hvor findes den', p.findested)}
    ${afsnit('Anvendelse', p.anvendelse)}
    ${afsnit('Forveksles med', p.forveksles)}
    ${findesI}
    ${se}
    <div class="d-bund">
      <button type="button" class="btn-mini" id="d-kopier">Kopiér link til stenen</button>
      <button type="button" class="btn-mini" id="d-print">Udskriv</button>
    </div>`;
}

el.detalje.addEventListener('click', e => {
  const l = e.target.closest('.d-link');
  if(l){ vaelg(efterId[l.dataset.id], true); el.detalje.querySelector('#d-navn')?.focus({preventScroll:true}); return; }

  const m = e.target.closest('.d-miniaturer button');
  if(m){
    const b = tilstand.valgt.billeder[+m.dataset.i];
    const foto = el.detalje.querySelector('#d-foto');
    if(foto){ foto.src = BILLEDMAPPE + b.fil; foto.alt = b.tekst || tilstand.valgt.navn; }
    el.detalje.querySelectorAll('.d-miniaturer button').forEach(x => x.setAttribute('aria-pressed', x === m));
    const t = el.detalje.querySelector('#d-billedtekst');
    if(t) t.innerHTML = esc(b.tekst || '') + (b.foto ? ` <span class="mono">Foto: ${esc(b.foto)}</span>` : '');
    return;
  }

  if(e.target.closest('#d-kopier')){
    const url = new URL(location.href);
    url.search = ''; url.hash = 'sten=' + tilstand.valgt.kode;
    const knap = e.target.closest('#d-kopier');
    navigator.clipboard?.writeText(url.href).then(
      () => { knap.textContent = 'Kopieret ✓'; setTimeout(() => knap.textContent = 'Kopiér link til stenen', 1600); },
      () => prompt('Kopiér linket:', url.href));
    return;
  }
  if(e.target.closest('#d-print')) print();
});

/* ── Tilstand ↔ adresse ─────────────────────────────────── */
function skrivAdresse(){
  const p = new URLSearchParams();
  if(tilstand.valgt) p.set('sten', tilstand.valgt.kode);
  if(tilstand.gruppe !== 'alle') p.set('gruppe', tilstand.gruppe);
  if(tilstand.noegle) p.set('noegle', '1');
  const ny = p.toString() ? '#' + p : '';
  if(location.hash !== ny || location.search) history.replaceState(null, '', location.pathname + ny);
}

function laesAdresse(){
  const p = new URLSearchParams(location.search);
  new URLSearchParams(location.hash.replace(/^#/, '')).forEach((v, k) => p.set(k, v));
  const g = p.get('gruppe');
  if(g && gruppe[g]) tilstand.gruppe = g;
  if(p.get('noegle') === '1') tilstand.noegle = true;
  /* ?nr=17 er tænkt til en QR-kode på stenens etiket */
  const s = p.get('sten') || p.get('nr');
  tilstand.valgt = s ? findKodeEllerNr(s) : null;
  /* peger nummeret på flere sten, vises de i listen */
  if(s && !tilstand.valgt && p.get('nr')){ tilstand.tekst = el.soeg.value = s; }
}

/* ── Samlet ─────────────────────────────────────────────── */
function tegnAlt(){
  el.grupper.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b.dataset.g === tilstand.gruppe));
  tegnNoegle();
  tegnListe();
  skrivAdresse();
}

function vaelg(post, fraKlik){
  if(!post) return;
  tilstand.valgt = post;
  el.liste.querySelectorAll('button.kort').forEach(b => b.setAttribute('aria-pressed', b.dataset.id === post.id));
  tegnDetalje();
  el.detalje.scrollTop = 0;
  skrivAdresse();
  el.sr.textContent = `${post.navn}, ${post.kode}`;
  /* på én spalte står detaljen under listen — så rulles der ned til den */
  if(fraKlik && matchMedia('(max-width:960px)').matches)
    el.detalje.scrollIntoView({behavior: matchMedia('(prefers-reduced-motion:reduce)').matches ? 'auto' : 'smooth', block:'start'});
}

el.soeg.addEventListener('input', () => { tilstand.tekst = el.soeg.value; tegnAlt(); });
el.soeg.addEventListener('keydown', e => {
  if(e.key === 'Enter'){
    const hit = findKodeEllerNr(el.soeg.value);
    const vis = synlige();
    vaelg(hit || (vis.length === 1 ? vis[0] : null), true);
  }
  if(e.key === 'Escape'){ el.soeg.value = ''; tilstand.tekst = ''; tegnAlt(); }
});

function tegnFacts(){
  const medNr = alle.filter(p => p.nr?.length).length;
  const medSted = alle.filter(p => p.placering).length;
  const medFoto = alle.filter(p => p.billeder?.length).length;
  el.facts.innerHTML = grupper.map(g =>
    `<span class="fact" style="--fc:${g.flade}">${g.prefiks} · ${esc(g.kortnavn)} <b>${g.poster.length}</b></span>`).join('')
    + `<span class="fact" style="--fc:var(--ink)">Med nr. <b>${medNr}</b></span>`
    + `<span class="fact" style="--fc:var(--ink)">Med foto <b>${medFoto}</b></span>`
    + `<span class="fact" style="--fc:var(--ink)">Med placering <b>${medSted}</b></span>`;
}

addEventListener('hashchange', () => {
  const før = tilstand.valgt;
  laesAdresse();
  tegnAlt();
  if(tilstand.valgt !== før) tegnDetalje();
});

bygGrupper();
laesAdresse();
tegnFacts();
tegnAlt();
tegnDetalje();
