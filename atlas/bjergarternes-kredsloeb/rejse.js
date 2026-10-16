// Del 1 · Stenens rejse: én sten gennem kredsløbet. Eleven vælger hvert trin i
// panelet; diagrammet viser grupperne, de mulige veje og den vej, stenen har taget.
import { BJERGARTER, GRUPPER, PROCESSER, OVERGANGE, STEDER, MAAL, opfyldt, samletTid, tidstekst } from './model.js';
import { el, bjergartskort } from './sten.js';

const NS = 'http://www.w3.org/2000/svg';
const svg = (navn, attr = {}, tekst) => {
  const e = document.createElementNS(NS, navn);
  for (const [k, v] of Object.entries(attr)) e.setAttribute(k, v);
  if (tekst !== undefined) e.textContent = tekst;
  return e;
};

// Knuder i diagrammet (viewBox 640 × 540): midtpunkt, bredde og højde.
const KNUDER = {
  sediment: { x: 320, y: 78, b: 230, h: 82 },
  magmatisk: { x: 118, y: 250, b: 206, h: 96 },
  sedimentaer: { x: 522, y: 250, b: 206, h: 96 },
  metamorf: { x: 455, y: 430, b: 222, h: 98 },
  magma: { x: 168, y: 425, b: 196, h: 78 },
  kappe: { x: 168, y: 512, b: 150, h: 36 }
};
// Pilene mellem grupperne. etiket: [x, y, anker, linjer].
const PILE = [
  { id: 'smeltning', fra: 'kappe', til: 'magma', proces: 'smeltning', d: 'M168 494 L168 468', etiket: [182, 486, 'start', ['smeltning']] },
  { id: 'stoerkning', fra: 'magma', til: 'magmatisk', proces: 'stoerkning', d: 'M110 386 C92 360 88 330 92 300', etiket: [20, 350, 'start', ['størkning']] },
  { id: 'genopsmeltning', fra: 'magmatisk', til: 'magma', proces: 'opsmeltning', d: 'M162 300 C172 330 182 356 190 384', etiket: [134, 352, 'middle', ['opsmelt-', 'ning']] },
  { id: 'erosion-magmatisk', fra: 'magmatisk', til: 'sediment', proces: 'erosion', d: 'M150 202 C170 150 190 118 204 104', etiket: [168, 140, 'end', ['forvitring', 'og erosion']] },
  { id: 'erosion-sedimentaer', fra: 'sedimentaer', til: 'sediment', proces: 'erosion', d: 'M480 202 C462 160 446 132 430 118', etiket: [466, 144, 'start', ['erosion']] },
  { id: 'diagenese', fra: 'sediment', til: 'sedimentaer', proces: 'diagenese', d: 'M435 64 C520 58 578 120 584 200', etiket: [560, 100, 'start', ['aflejring og', 'sammen-', 'kitning']] },
  { id: 'omdannelse-sedimentaer', fra: 'sedimentaer', til: 'metamorf', proces: 'omdannelse', d: 'M532 298 C530 330 520 356 506 380', etiket: [538, 345, 'start', ['omdannelse']] },
  { id: 'omdannelse-magmatisk', fra: 'magmatisk', til: 'metamorf', proces: 'omdannelse', d: 'M210 280 C270 300 320 350 352 392', etiket: [292, 314, 'start', ['omdannelse']] },
  { id: 'erosion-metamorf', fra: 'metamorf', til: 'sediment', proces: 'erosion', d: 'M420 380 C396 300 352 190 330 120', etiket: [384, 262, 'middle', ['hævning', 'og erosion']] },
  { id: 'opsmeltning', fra: 'metamorf', til: 'magma', proces: 'opsmeltning', d: 'M344 446 C310 456 290 452 268 444', etiket: [306, 474, 'middle', ['opsmeltning']] },
  { id: 'hoejere-grad', fra: 'metamorf', til: 'metamorf', proces: 'omdannelse', d: 'M566 410 C624 398 628 470 566 456', etiket: [598, 494, 'middle', ['højere grad']] }
];
const pilFor = (fra, til) => PILE.find(p => p.fra === BJERGARTER[fra].gruppe && p.til === BJERGARTER[til].gruppe);
const KORTNAVN = { 'magma-basaltisk': 'basaltisk', 'magma-andesitisk': 'andesitisk', 'magma-granitisk': 'granitisk', lersten: 'lersten', grus: 'grus', ler: 'ler', kridt: 'kridt' };
const kortnavn = id => KORTNAVN[id] || BJERGARTER[id].navn.toLowerCase();

export function start(rod) {
  const tegning = rod.querySelector('#diagram');
  const startvalg = rod.querySelector('#start');
  const stenkort = rod.querySelector('#stenkort');
  const muligheder = rod.querySelector('#muligheder');
  const forklaring = rod.querySelector('#forklaring');
  const rejseliste = rod.querySelector('#rejse');
  const rejsetid = rod.querySelector('#rejsetid');
  const maalliste = rod.querySelector('#maal');
  let rejse = ['granit'], trin = [];
  let klaret = new Set();
  try { klaret = new Set(JSON.parse(localStorage.getItem('kredsloeb-maal') || '[]')); } catch { /* ingen lagring */ }

  // ---------- Diagrammet bygges én gang ----------
  const defs = svg('defs');
  const spids = svg('marker', { id: 'spids', viewBox: '0 0 10 10', refX: 7, refY: 5, markerWidth: 5, markerHeight: 5, orient: 'auto-start-reverse' });
  spids.append(svg('path', { d: 'M0 0L10 5L0 10z', fill: '#17211f' }));
  defs.append(spids);
  tegning.append(defs);
  const pilelag = svg('g'), sporlag = svg('g', { class: 'spor' }), knudelag = svg('g');
  tegning.append(pilelag, knudelag, sporlag);
  const pilElementer = {};
  for (const p of PILE) {
    const g = svg('g', { class: 'pil', 'data-pil': p.id });
    const sti = svg('path', { d: p.d, 'marker-end': 'url(#spids)' });
    const [x, y, anker, linjer] = p.etiket;
    const t = svg('text', { x, y, 'text-anchor': anker });
    linjer.forEach((l, i) => t.append(svg('tspan', { x, dy: i ? 13 : 0 }, l)));
    g.append(sti, t);
    pilelag.append(g);
    pilElementer[p.id] = { g, sti };
  }
  const navneElementer = {};
  for (const [gruppe, k] of Object.entries(KNUDER)) {
    const g = svg('g', { class: 'knude', 'data-gruppe': gruppe });
    g.append(svg('rect', { x: k.x - k.b / 2, y: k.y - k.h / 2, width: k.b, height: k.h, rx: 12, fill: GRUPPER[gruppe].farve }));
    const titel = gruppe === 'sedimentaer' ? 'Sedimentære' : gruppe === 'magmatisk' ? 'Magmatiske' : gruppe === 'metamorf' ? 'Metamorfe' : GRUPPER[gruppe].navn;
    g.append(svg('text', { x: k.x, y: k.y - k.h / 2 + 20, 'text-anchor': 'middle' }, titel));
    // Bjergarternes navne i gruppen, højst tre pr. linje.
    const ids = Object.keys(BJERGARTER).filter(id => BJERGARTER[id].gruppe === gruppe);
    const navne = svg('text', { class: 'navne', 'text-anchor': 'middle' });
    const pr = gruppe === 'kappe' ? 1 : ['magmatisk', 'sediment'].includes(gruppe) ? 3 : 2;
    ids.forEach((id, i) => {
      const linje = Math.floor(i / pr), forste = i % pr === 0;
      const ts = svg('tspan', forste ? { x: k.x, y: k.y - k.h / 2 + 38 + 13 * linje } : {}, (forste ? '' : ' · ') + kortnavn(id));
      ts.dataset.id = id;
      navne.append(ts);
    });
    if (gruppe === 'kappe') { navne.firstChild.setAttribute('y', k.y + 5); g.querySelector('text').remove(); navne.firstChild.textContent = 'Kappen (peridotit)'; }
    g.append(navne);
    knudelag.append(g);
    for (const ts of navne.querySelectorAll('tspan')) navneElementer[ts.dataset.id] = ts;
  }
  const token = svg('g', { class: 'token' });
  token.append(svg('circle', { r: 9 }), svg('circle', { r: 3.5, fill: 'var(--s)', stroke: 'none' }));
  tegning.append(token);

  // ---------- Startvalg og udfordringer ----------
  for (const gruppe of Object.keys(GRUPPER)) {
    const og = document.createElement('optgroup');
    og.label = GRUPPER[gruppe].navn;
    for (const [id, b] of Object.entries(BJERGARTER)) if (b.gruppe === gruppe) og.append(new Option(b.navn, id));
    startvalg.append(og);
  }
  startvalg.value = 'granit';
  startvalg.onchange = () => nulstil(startvalg.value);
  function tegnMaal() {
    maalliste.replaceChildren(...MAAL.map(m => {
      const li = el('li');
      const knap = el('button');
      knap.dataset.klaret = String(klaret.has(m.id));
      knap.append(el('span', klaret.has(m.id) ? '✓' : '', 'flueben'), el('span', m.tekst));
      knap.setAttribute('aria-label', `${m.tekst}${klaret.has(m.id) ? ' – klaret' : ''}. Start med ${BJERGARTER[m.start].navn}.`);
      knap.onclick = () => { startvalg.value = m.start; nulstil(m.start); muligheder.querySelector('button')?.focus(); };
      li.append(knap);
      return li;
    }));
  }

  // ---------- Tilstand ----------
  function nulstil(id) {
    rejse = [id]; trin = [];
    forklaring.replaceChildren();
    tegn();
  }
  function gaa(o) {
    const fra = rejse.at(-1);
    rejse.push(o.til); trin.push({ ...o, fra });
    const p = PROCESSER[o.proces];
    const h3 = el('h3', `${BJERGARTER[fra].navn} → ${BJERGARTER[o.til].navn}`);
    const meta = el('p', `${p.navn} · ${tidstekst(o.tid)} · ${STEDER[o.sted].navn}`, 'meta');
    const link = el('button', `Se stedet ved pladegrænserne →`, 'lille');
    link.onclick = () => window.dispatchEvent(new CustomEvent('vis-del', { detail: { del: 2, sted: o.sted } }));
    forklaring.replaceChildren(h3, el('p', o.tekst), meta, link);
    for (const m of MAAL) {
      if (!klaret.has(m.id) && opfyldt(m, rejse)) {
        klaret.add(m.id);
        try { localStorage.setItem('kredsloeb-maal', JSON.stringify([...klaret])); } catch { /* ingen lagring */ }
        forklaring.append(el('p', `✓ Udfordring klaret: ${m.tekst}!`, 'klaret'));
      }
    }
    tegn();
    muligheder.querySelector('button')?.focus({ preventScroll: true });
  }
  rod.querySelector('#fortryd').onclick = () => {
    if (!trin.length) return;
    rejse.pop(); trin.pop(); forklaring.replaceChildren(); tegn();
  };
  rod.querySelector('#forfra').onclick = () => nulstil(rejse[0]);

  function tegn() {
    const nu = rejse.at(-1), b = BJERGARTER[nu];
    stenkort.replaceChildren(...bjergartskort(nu).childNodes);
    // Mulighederne
    muligheder.replaceChildren(...OVERGANGE[nu].map(o => {
      const knap = el('button', '', 'mulighed');
      knap.dataset.proces = o.proces;
      knap.style.borderLeftColor = GRUPPER[BJERGARTER[o.til].gruppe].farve;
      knap.append(el('span', '→', 'pil'), el('span', `${PROCESSER[o.proces].navn}: ${BJERGARTER[o.til].navn}`),
        el('small', `${tidstekst(o.tid)} · ${STEDER[o.sted].navn}`));
      knap.onclick = () => gaa(o);
      return knap;
    }));
    // Diagrammet: mulige pile, stenens navn, markøren og sporet.
    const mulige = new Set(OVERGANGE[nu].map(o => pilFor(nu, o.til).id));
    for (const [id, { g }] of Object.entries(pilElementer)) g.classList.toggle('mulig', mulige.has(id));
    for (const [id, ts] of Object.entries(navneElementer)) ts.classList.toggle('her', id === nu);
    const k = KNUDER[b.gruppe];
    token.setAttribute('transform', `translate(${k.x + k.b / 2 - 14} ${k.y - k.h / 2 + 14})`);
    sporlag.replaceChildren();
    const paaPil = {};
    trin.forEach((t, i) => (paaPil[pilFor(t.fra, t.til).id] ??= []).push(i + 1));
    for (const [id, numre] of Object.entries(paaPil)) {
      const { sti } = pilElementer[id];
      sporlag.append(svg('path', { d: sti.getAttribute('d') }));
      const l = sti.getTotalLength(), p = sti.getPointAtLength(l * .5);
      const tekst = numre.length > 3 ? `${numre.slice(0, 2).join(',')}…` : numre.join(',');
      const r = 7 + 3 * Math.max(0, tekst.length - 1);
      sporlag.append(svg('rect', { x: p.x - r, y: p.y - 8, width: 2 * r, height: 16, rx: 8, fill: 'var(--s)', stroke: '#fff', 'stroke-width': 1.5 }));
      sporlag.append(svg('text', { x: p.x, y: p.y + 3.5, 'text-anchor': 'middle' }, tekst));
    }
    tegning.setAttribute('aria-label', `Kredsløbet. Stenen er nu ${b.navn} (${GRUPPER[b.gruppe].navn}). Mulige veje: ${OVERGANGE[nu].map(o => `${PROCESSER[o.proces].navn.toLowerCase()} til ${BJERGARTER[o.til].navn.toLowerCase()}`).join('; ')}.`);
    tegning.removeAttribute('aria-labelledby');
    // Rejsen
    rejseliste.replaceChildren(el('li', `Start: ${BJERGARTER[rejse[0]].navn}`), ...trin.map(t => {
      const li = el('li', `${PROCESSER[t.proces].navn} → ${BJERGARTER[t.til].navn} `);
      li.append(el('small', `(${tidstekst(t.tid).replace(/ \(.*\)$/, '')})`));
      return li;
    }));
    rejseliste.scrollTop = rejseliste.scrollHeight;
    const ialt = samletTid(trin);
    rejsetid.textContent = !trin.length ? '' : ialt < .01 ? 'I alt under 10.000 år'
      : `I alt ca. ${ialt < 1 ? ialt.toLocaleString('da-DK', { maximumSignificantDigits: 1 }) : Math.round(ialt).toLocaleString('da-DK')} mio. år`;
    rod.querySelector('#fortryd').disabled = !trin.length;
    tegnMaal();
  }
  tegn();
  return { vis() {}, skjul() {} };
}
