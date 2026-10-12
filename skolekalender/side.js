// side.js — skolekalenderen: filter, månedsvisning, liste, kalenderfil
//
// Dataene står i data.js; helligdagene hentes fra tid-appens rene modul,
// så alle sitets kalendere regner med de samme dage.

import { AAR, HOLD, TYPER, KODER, BEGIVENHEDER, MAANEDSNOTER } from './data.js';
import { helligdagsnavne } from '../tid/skolekalender.js';

// ─── Datoer ───────────────────────────────────────────────
const dato = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const tekst = d =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const plus = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const ugedag = d => (d.getDay() + 6) % 7;          // mandag = 0
function ugenr(d) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  t.setUTCDate(t.getUTCDate() + 3 - ((t.getUTCDay() + 6) % 7));
  const uge1 = new Date(Date.UTC(t.getUTCFullYear(), 0, 4));
  return 1 + Math.round(((t - uge1) / 864e5 - 3 + ((uge1.getUTCDay() + 6) % 7)) / 7);
}
const MDR = ['januar', 'februar', 'marts', 'april', 'maj', 'juni', 'juli', 'august',
  'september', 'oktober', 'november', 'december'];
const DAGE = ['mandag', 'tirsdag', 'onsdag', 'torsdag', 'fredag', 'lørdag', 'søndag'];
const stort = s => s[0].toUpperCase() + s.slice(1);
const kortDato = d => `${d.getDate()}. ${MDR[d.getMonth()].slice(0, 3)}.`;
// 21.–25. sep. eller 28. sep.–2. okt.
const periode = (a, b) => a.getMonth() === b.getMonth() ? `${a.getDate()}.–${kortDato(b)}` : `${kortDato(a)}–${kortDato(b)}`;
const langDato = d => `${stort(DAGE[ugedag(d)])} ${d.getDate()}. ${MDR[d.getMonth()]} ${d.getFullYear()}`;

const START = dato(AAR.fra), SLUT = dato(AAR.til);
const MAANEDER = [];
for (let m = new Date(START); m <= SLUT; m = new Date(m.getFullYear(), m.getMonth() + 1, 1))
  MAANEDER.push(`${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`);

const hellig = new Map([
  ...helligdagsnavne(START.getFullYear()),
  ...helligdagsnavne(SLUT.getFullYear())
]);

// ─── Begivenhederne, gjort klar ───────────────────────────
const ALLE = BEGIVENHEDER.map((b, i) => {
  const hold = b.h === 'alle' ? 'alle' : b.h.split(/\s+/).filter(Boolean);
  const navn = b.kode ? (KODER[b.kode] ? `${b.kode} · ${KODER[b.kode]}` : b.kode) : b.x;
  return { ...b, i, fra: dato(b.d), sidst: dato(b.til || b.d), hold, navn };
}).sort((a, b) => a.fra - b.fra || (a.t === 'ferie' ? -1 : 0) - (b.t === 'ferie' ? -1 : 0) || a.i - b.i);

// Hvad vises under det valgte filter? 'alle' (hele skolen) vises overalt;
// begivenheder uden hold vises kun under «Alle» — personalets dog kun,
// når personaleknappen er slået til.
function synlig(b) {
  if (b.t === 'pers') return tilstand.pers;
  if (b.hold === 'alle') return true;
  if (tilstand.hold === 'alle') return true;
  return b.hold.includes(tilstand.hold);
}
const holdTekst = b => b.hold === 'alle' ? 'Alle' : b.hold.length ? b.hold.join(' · ') : '';

// Pr. dag: liste af begivenheder, der dækker dagen
const pr = new Map();
for (const b of ALLE)
  for (let d = b.fra; d <= b.sidst; d = plus(d, 1)) {
    const k = tekst(d);
    if (!pr.has(k)) pr.set(k, []);
    pr.get(k).push(b);
  }
const dagens = k => (pr.get(k) || []).filter(synlig);

// ─── Tilstand og adresse ──────────────────────────────────
const idag = new Date(); idag.setHours(0, 0, 0, 0);
const idagK = tekst(idag);
const iAaret = idag >= START && idag <= SLUT;
const smal = matchMedia('(max-width:699px)');

const tilstand = {
  hold: 'alle', pers: true, vis: smal.matches ? 'liste' : 'maaned',
  md: iAaret ? idagK.slice(0, 7) : MAANEDER[0],
  dag: iAaret ? idagK : null
};

function laesAdresse() {
  const p = new URLSearchParams(location.hash.slice(1) || location.search.slice(1));
  if (HOLD.includes(p.get('hold'))) tilstand.hold = p.get('hold');
  if (p.get('personale') === '0') tilstand.pers = false;
  if (['maaned', 'liste'].includes(p.get('vis'))) tilstand.vis = p.get('vis');
  if (MAANEDER.includes(p.get('md'))) tilstand.md = p.get('md');
  if (p.get('hold') && !p.get('personale')) tilstand.pers = false;   // elevlink: uden personale
}
function skrivAdresse() {
  const p = new URLSearchParams();
  if (tilstand.hold !== 'alle') p.set('hold', tilstand.hold);
  if (tilstand.hold !== 'alle' && tilstand.pers) p.set('personale', '1');
  if (tilstand.hold === 'alle' && !tilstand.pers) p.set('personale', '0');
  if (tilstand.vis !== 'maaned') p.set('vis', tilstand.vis);
  if (tilstand.vis === 'maaned') p.set('md', tilstand.md);
  history.replaceState(null, '', p.toString() ? '#' + p : location.pathname);
}

// ─── DOM ──────────────────────────────────────────────────
const $ = s => document.querySelector(s);
const el = (tag, cls, txt) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (txt != null) e.textContent = txt;
  return e;
};

function chip(b, d) {
  const T = TYPER[b.t];
  const c = el('span', 'chip t-' + b.t);
  c.style.setProperty('--cf', T.farve);
  c.style.setProperty('--ck', T.kant);
  // en fortsættelse fra dagen før viser kun farven — teksten står på første dag i ugen
  if (d && b.fra < d && ugedag(d) !== 0 && d.getDate() !== 1) c.classList.add('fort');
  if (d && b.sidst > d && ugedag(d) !== 6) c.classList.add('videre');
  c.append(el('i', 'tegn', T.tegn), el('span', 'cx', b.navn));
  if (tilstand.hold === 'alle' && b.hold !== 'alle' && b.hold.length)
    c.append(el('span', 'ch', b.hold.length > 2 ? `${b.hold.length} hold` : b.hold.join('·')));
  c.title = `${T.navn}: ${b.navn}${holdTekst(b) ? ' — ' + holdTekst(b) : ''}${b.n ? '\n' + b.n : ''}`;
  return c;
}

// ─── Månedsvisning ────────────────────────────────────────
function tegnMaaned() {
  const [y, m] = tilstand.md.split('-').map(Number);
  const f = new Date(y, m - 1, 1);
  $('#md-navn').textContent = `${stort(MDR[m - 1])} ${y}`;
  const i = MAANEDER.indexOf(tilstand.md);
  $('#forrige').disabled = i === 0;
  $('#naeste').disabled = i === MAANEDER.length - 1;
  for (const b of document.querySelectorAll('.md-strip button'))
    b.setAttribute('aria-current', b.dataset.md === tilstand.md ? 'true' : 'false');

  const gitter = $('#gitter');
  gitter.replaceChildren();
  for (const n of ['Uge', 'Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn'])
    gitter.append(el('div', 'dow' + (n === 'Uge' ? ' uge' : ''), n));

  let d = plus(f, -ugedag(f));
  const sidste = new Date(y, m, 0);
  while (d <= sidste) {
    gitter.append(el('div', 'ugenr', String(ugenr(d))));
    for (let j = 0; j < 7; j++, d = plus(d, 1)) {
      const k = tekst(d);
      const iMd = d.getMonth() === m - 1;
      const celle = el('button', 'celle');
      celle.type = 'button';
      celle.dataset.dag = k;
      if (!iMd) { celle.classList.add('uden'); celle.tabIndex = -1; }
      if (j >= 5) celle.classList.add('weekend');
      const hd = hellig.get(k);
      if (hd) celle.classList.add('hellig');
      const bs = dagens(k);
      const ferie = bs.find(b => b.t === 'ferie');
      if (ferie) celle.classList.add('ferie');
      if (k === idagK) celle.classList.add('idag');
      if (k === tilstand.dag) celle.classList.add('valgt');
      celle.setAttribute('aria-pressed', k === tilstand.dag ? 'true' : 'false');

      const top = el('span', 'ctop');
      top.append(el('span', 'dn', String(d.getDate())));
      if (hd) top.append(el('span', 'hd', hd));
      else if (ferie && (ferie.fra.getTime() === d.getTime() || j === 0 || d.getDate() === 1))
        top.append(el('span', 'hd', ferie.navn));
      celle.append(top);

      if (iMd) {
        const liste = el('span', 'chips');
        // flerdagsbegivenheder øverst, så de står i samme række dag efter dag
        const vis = bs.filter(b => b.t !== 'ferie')
          .sort((a, b) => !!b.til - !!a.til || a.fra - b.fra || a.i - b.i);
        const max = 4;
        vis.slice(0, vis.length > max ? max - 1 : max).forEach(b => liste.append(chip(b, d)));
        if (vis.length > max) liste.append(el('span', 'mere', `+${vis.length - max + 1} mere`));
        celle.append(liste);
      }
      celle.setAttribute('aria-label',
        `${langDato(d)}${hd ? ', ' + hd : ''}${bs.length ? ': ' + bs.map(b => b.navn).join(', ') : ''}`);
      gitter.append(celle);
    }
  }

  const noter = MAANEDSNOTER[tilstand.md] || [];
  const nb = $('#md-noter');
  nb.replaceChildren();
  nb.hidden = !noter.length;
  if (noter.length) {
    nb.append(el('span', 'mono', `Også i ${MDR[m - 1]}`));
    for (const n of noter) nb.append(el('span', 'note-pille', n));
  }
}

// ─── Listevisning ─────────────────────────────────────────
function tegnListe() {
  const ud = $('#liste');
  ud.replaceChildren();
  let foersteFremtid = null;
  for (const md of MAANEDER) {
    const [y, m] = md.split('-').map(Number);
    const start = new Date(y, m - 1, 1);
    // begivenhederne, der begynder i måneden, og ferier, der fortsætter ind i den
    const egne = ALLE.filter(b => synlig(b) &&
      (tekst(b.fra).slice(0, 7) === md || (b.t === 'ferie' && b.fra < start && b.sidst >= start)));
    const sek = el('section', 'lmd');
    sek.dataset.md = md;
    sek.append(el('h3', null, `${stort(MDR[m - 1])} ${y}`));
    const ol = el('ol', 'lrk');
    for (const b of egne) {
      const li = el('li', 'lr t-' + b.t);
      li.style.setProperty('--cf', TYPER[b.t].farve);
      li.style.setProperty('--ck', TYPER[b.t].kant);
      const tid = el('span', 'ld');
      tid.append(el('b', null, b.til ? periode(b.fra, b.sidst) : kortDato(b.fra)));
      tid.append(el('span', 'mono', b.til ? `uge ${ugenr(b.fra)}${ugenr(b.sidst) !== ugenr(b.fra) ? '–' + ugenr(b.sidst) : ''}` : `${DAGE[ugedag(b.fra)].slice(0, 3)} · uge ${ugenr(b.fra)}`));
      const hvad = el('span', 'lx');
      hvad.append(el('i', 'tegn', TYPER[b.t].tegn), el('b', null, b.navn));
      if (b.n) hvad.append(el('small', null, b.n));
      const hv = el('span', 'lh');
      if (b.hold === 'alle') hv.append(el('span', 'tag alle', 'Alle'));
      else if (b.hold.length) b.hold.forEach(h => hv.append(el('span', 'tag', h)));
      else if (b.t === 'pers') hv.append(el('span', 'tag pers', 'Personale'));
      li.append(tid, hvad, hv);
      if (b.sidst < idag) li.classList.add('forbi');
      else if (!foersteFremtid) { foersteFremtid = li; li.id = 'nu'; }
      ol.append(li);
    }
    for (const n of MAANEDSNOTER[md] || []) {
      const li = el('li', 'lr note');
      const tid = el('span', 'ld'); tid.append(el('b', null, 'Hele måneden'));
      const hvad = el('span', 'lx'); hvad.append(el('i', 'tegn', '…'), el('b', null, n));
      li.append(tid, hvad, el('span', 'lh'));
      ol.append(li);
    }
    if (!ol.children.length) ol.append(el('li', 'tomt', 'Intet for det valgte hold.'));
    sek.append(ol);
    ud.append(sek);
  }
  return foersteFremtid;
}

// ─── Sidespalten: valgt dag og de næste ───────────────────
function tegnDag() {
  const boks = $('#dag');
  boks.replaceChildren();
  if (!tilstand.dag) {
    boks.append(el('p', 'note', 'Klik på en dag i kalenderen for at se alt, der sker den dag.'));
    return;
  }
  const d = dato(tilstand.dag);
  const h = el('div', 'dag-h');
  h.append(el('b', null, langDato(d)), el('span', 'mono', `Uge ${ugenr(d)}${tilstand.dag === idagK ? ' · i dag' : ''}`));
  boks.append(h);
  const hd = hellig.get(tilstand.dag);
  const bs = dagens(tilstand.dag);
  const ul = el('ul', 'dag-l');
  if (hd) { const li = el('li'); li.append(el('i', 'tegn', '☀'), el('span', null, hd)); ul.append(li); }
  for (const b of bs) {
    const li = el('li', 't-' + b.t);
    li.style.setProperty('--cf', TYPER[b.t].farve);
    li.style.setProperty('--ck', TYPER[b.t].kant);
    const tx = el('span');
    tx.append(el('b', null, b.navn));
    const meta = [holdTekst(b) || (b.t === 'pers' ? 'Personale' : ''), b.til ? periode(b.fra, b.sidst) : ''].filter(Boolean).join(' · ');
    if (meta) tx.append(el('small', 'mono', meta));
    if (b.n) tx.append(el('small', null, b.n));
    li.append(el('i', 'tegn', TYPER[b.t].tegn), tx);
    ul.append(li);
  }
  if (!ul.children.length) ul.append(el('li', 'tomt', ugedag(d) >= 5 ? 'Weekend.' : 'Almindelig skoledag.'));
  boks.append(ul);
}

function tegnNaeste() {
  const ul = $('#naeste-l');
  ul.replaceChildren();
  const fra = iAaret ? idag : START;
  const kommende = ALLE.filter(b => synlig(b) && b.sidst >= fra).slice(0, 6);
  for (const b of kommende) {
    const li = el('li', 't-' + b.t);
    li.style.setProperty('--cf', TYPER[b.t].farve);
    li.style.setProperty('--ck', TYPER[b.t].kant);
    const knap = el('button');
    knap.type = 'button';
    knap.append(el('span', 'nd', b.fra <= fra && b.til ? 'Nu' : kortDato(b.fra)), el('i', 'tegn', TYPER[b.t].tegn), el('span', 'nx', b.navn));
    if (tilstand.hold === 'alle' && holdTekst(b) && b.hold !== 'alle') knap.append(el('span', 'ch', holdTekst(b)));
    knap.addEventListener('click', () => vaelgDag(tekst(b.fra < fra ? fra : b.fra), true));
    li.append(knap);
    ul.append(li);
  }
  $('#naeste-t').textContent = iAaret ? 'Det næste' : 'Først i skoleåret';
}

function tegnStatus() {
  let s;
  if (!iAaret) s = `Skoleåret ${AAR.navn}`;
  else {
    const f = dagens(idagK).find(b => b.t === 'ferie');
    s = `I dag · uge ${ugenr(idag)}${f ? ' · ' + f.navn.toLowerCase() : ''}`;
  }
  $('#status').textContent = s;
  $('#tael').textContent = ALLE.filter(synlig).length;
}

// ─── Samlet tegning ───────────────────────────────────────
function tegn() {
  for (const b of document.querySelectorAll('#holdvalg button'))
    b.setAttribute('aria-pressed', b.dataset.hold === tilstand.hold ? 'true' : 'false');
  $('#pers').setAttribute('aria-pressed', tilstand.pers ? 'true' : 'false');
  for (const b of document.querySelectorAll('#visning button'))
    b.setAttribute('aria-pressed', b.dataset.vis === tilstand.vis ? 'true' : 'false');
  $('#rig').dataset.vis = tilstand.vis;
  $('#ics-hold').textContent = tilstand.hold === 'alle' ? 'alle hold' : tilstand.hold;

  tegnMaaned();
  const nu = tegnListe();
  tegnDag();
  tegnNaeste();
  tegnStatus();
  skrivAdresse();
  $('#sr').textContent = `Viser ${tilstand.hold === 'alle' ? 'alle hold' : tilstand.hold}${tilstand.pers ? ' med personale' : ''}, ${tilstand.vis === 'liste' ? 'som liste' : $('#md-navn').textContent}.`;
  return nu;
}

function vaelgDag(k, skift) {
  tilstand.dag = k;
  if (skift && tilstand.md !== k.slice(0, 7) && MAANEDER.includes(k.slice(0, 7))) tilstand.md = k.slice(0, 7);
  if (skift && tilstand.vis === 'liste') tilstand.vis = 'maaned';
  tegn();
  const c = document.querySelector(`.celle[data-dag="${k}"]`);
  if (c && document.activeElement?.classList.contains('celle')) c.focus();
}

// ─── Kalenderfil (.ics) til Outlook, Google og telefonen ──
function ics() {
  const esc = s => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
  const d8 = d => tekst(d).replace(/-/g, '');
  const stempel = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const linjer = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//smbi.dk//Skolekalender//DA', 'CALSCALE:GREGORIAN',
    `X-WR-CALNAME:Skolekalender ${AAR.navn}${tilstand.hold === 'alle' ? '' : ' ' + tilstand.hold}`];
  for (const b of ALLE.filter(synlig)) {
    const hv = holdTekst(b);
    linjer.push('BEGIN:VEVENT',
      `UID:${d8(b.fra)}-${b.i}@smbi.dk`,
      `DTSTAMP:${stempel}`,
      `DTSTART;VALUE=DATE:${d8(b.fra)}`,
      `DTEND;VALUE=DATE:${d8(plus(b.sidst, 1))}`,
      `SUMMARY:${esc(b.navn + (hv && hv !== 'Alle' && tilstand.hold === 'alle' ? ` (${hv})` : ''))}`,
      `CATEGORIES:${esc(TYPER[b.t].navn)}`,
      ...(b.n ? [`DESCRIPTION:${esc(b.n)}`] : []),
      'TRANSP:TRANSPARENT', 'END:VEVENT');
  }
  linjer.push('END:VCALENDAR');
  // linjer over 75 oktetter foldes, som standarden vil have det
  const fold = l => { let u = ''; while (new TextEncoder().encode(l).length > 73) { u += l.slice(0, 60) + '\r\n '; l = l.slice(60); } return u + l; };
  const blob = new Blob([linjer.map(fold).join('\r\n') + '\r\n'], { type: 'text/calendar;charset=utf-8' });
  const a = el('a');
  a.href = URL.createObjectURL(blob);
  a.download = `skolekalender-${AAR.navn.replace('–', '-')}${tilstand.hold === 'alle' ? '' : '-' + tilstand.hold}.ics`;
  document.body.append(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}

// ─── Opsætning ────────────────────────────────────────────
function byg() {
  const strip = $('.md-strip');
  for (const md of MAANEDER) {
    const [y, m] = md.split('-').map(Number);
    const b = el('button', null, MDR[m - 1].slice(0, 3));
    b.type = 'button';
    b.dataset.md = md;
    b.setAttribute('aria-label', `${MDR[m - 1]} ${y}`);
    b.addEventListener('click', () => { tilstand.md = md; tegn(); });
    strip.append(b);
  }
  const holdvalg = $('#holdvalg');
  for (const h of ['alle', ...HOLD]) {
    const b = el('button', 'btn-mini', h === 'alle' ? 'Alle' : h);
    b.type = 'button';
    b.dataset.hold = h;
    b.addEventListener('click', () => { tilstand.hold = h; tegn(); });
    holdvalg.append(b);
  }
  $('#pers').addEventListener('click', () => { tilstand.pers = !tilstand.pers; tegn(); });
  for (const b of document.querySelectorAll('#visning button'))
    b.addEventListener('click', () => {
      tilstand.vis = b.dataset.vis;
      tegn();
      if (tilstand.vis === 'liste') rulTilNu();
    });
  $('#forrige').addEventListener('click', () => { tilstand.md = MAANEDER[MAANEDER.indexOf(tilstand.md) - 1]; tegn(); });
  $('#naeste').addEventListener('click', () => { tilstand.md = MAANEDER[MAANEDER.indexOf(tilstand.md) + 1]; tegn(); });
  $('#idag').hidden = !iAaret;
  $('#idag').addEventListener('click', () => vaelgDag(idagK, true));
  $('#ics').addEventListener('click', ics);
  $('#print').addEventListener('click', () => print());

  $('#gitter').addEventListener('click', e => {
    const c = e.target.closest('.celle');
    if (!c) return;
    vaelgDag(c.dataset.dag, true);
  });
  // piletaster flytter dagen
  $('#gitter').addEventListener('keydown', e => {
    const c = e.target.closest('.celle');
    const trin = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];
    if (!c || !trin) return;
    e.preventDefault();
    const ny = plus(dato(c.dataset.dag), trin);
    if (ny < START || ny > SLUT) return;
    vaelgDag(tekst(ny), true);
    document.querySelector(`.celle[data-dag="${tekst(ny)}"]`)?.focus();
  });

  // signaturforklaring
  const facts = $('#facts');
  for (const [k, T] of Object.entries(TYPER)) {
    const f = el('span', 'fact');
    const sw = el('span', 'sw', T.tegn);
    sw.style.background = T.farve;
    sw.style.borderColor = T.kant;
    f.append(sw, el('span', null, T.navn));
    f.dataset.t = k;
    facts.append(f);
  }
  const koder = Object.entries(KODER).map(([k, v]) => v ? `${k} = ${v.toLowerCase()}` : k).join(' · ');
  facts.append(el('span', 'fact-note', `Personalekoder fra skolens kalender: ${koder}`));
}

function rulTilNu() {
  const nu = document.getElementById('nu');
  if (nu) nu.scrollIntoView({ block: 'center' });
}

laesAdresse();
byg();
tegn();
if (tilstand.vis === 'liste' && iAaret) requestAnimationFrame(rulTilNu);
smal.addEventListener('change', e => { if (e.matches && tilstand.vis === 'maaned') { tilstand.vis = 'liste'; tegn(); } });
