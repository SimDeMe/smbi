// Opgavedelen efter de seks trin: multiple choice, peg på figuren, klik i
// grafen og «byg kæden». Bygget som drivhuseffektens opgaver. Første svar
// tæller. Efter svaret vises rigtigt/forkert, det rigtige markeres, og
// figurens etiketter kommer frem igen. Ved forkert pegning skal eleven selv
// ramme rigtigt, før der kan gås videre.
import { OPGAVER, DELE } from './opgavedata.js';

const $ = id => document.getElementById(id);
const svgNS = 'http://www.w3.org/2000/svg';
const MAANEDER = ['januar','februar','marts','april','maj','juni','juli','august','september','oktober','november','december'];

function afstandTilLinje(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1;
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}
function bland(liste) {
  const a = [...liste];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

// figur: scenen; geometri(): { scene, kyst, jordY, celle:{x0,x1,yb,yt,r}, periode, graf }
// visFigur(trin, helGraf): stil figuren som i et trin. tilTrin(n): gå til et trin.
export function lavOpgaver({ figur, geometri, visFigur, tilTrin }) {
  const panel = $('opgaver');
  const lag = $('opg-lag');
  const fremhaev = $('opg-fremhaev');
  const maerker = $('opg-maerker');
  const punkter = $('opg-punkter');
  const graf = $('graf');
  const grafPunkter = $('opg-grafpunkter');
  const valgBoks = $('opg-valg');
  const svarTekst = $('opg-svar');
  const naeste = $('opg-naeste');
  let nr = 0, svar = [], loest = [], venter = false, aktiv = false, kaede = null;

  // ── Figurens dele ─────────────────────────────────────────────────────
  function maal() {
    const r = figur.getBoundingClientRect();
    return { r, sx: r.width / 1200, sy: r.height / 500 };
  }
  // De fire grene af cirkulationen som linjestykker (viewBox).
  function grene() {
    const { x0, x1, yb, yt, r } = geometri().celle;
    return {
      'vind-jord': [x0 + r, yb, x1 - r, yb],
      'vind-top': [x0 + r, yt, x1 - r, yt],
      'lodret-land': [x1, yt + r, x1, yb - r],
      'lodret-hav': [x0, yt + r, x0, yb - r],
    };
  }
  function regnOmraade() {
    const g = geometri();
    if (g.scene !== 'monsun') return null;
    return g.vind > 0 ? [600, 175, 980, 400] : [80, 230, 340, 404];
  }
  // Alle dele, punktet ligger på – den mest specifikke først.
  function find(vx, vy) {
    const { sx, sy } = maal();
    const g = geometri();
    const px = vx * sx, py = vy * sy;
    const dele = [];
    let bedst = null, mindst = 20;
    for (const [del, [a, b, c, d]] of Object.entries(grene())) {
      const afst = afstandTilLinje(px, py, a * sx, b * sy, c * sx, d * sy);
      if (afst < mindst) { mindst = afst; bedst = del; }
    }
    if (bedst) dele.push(bedst);
    const regn = regnOmraade();
    if (regn && vx >= regn[0] && vx <= regn[2] && vy >= regn[1] && vy <= g.jordY(vx)) dele.push('regn');
    const overLand = vx >= g.kyst;
    if (vy >= g.jordY(vx) - 4) dele.push(!overLand ? 'hav' : g.scene === 'monsun' && vx > 880 ? 'bjerg' : 'land');
    else dele.push((overLand ? 'land' : 'hav') + (vy < (g.celle.yt + g.celle.yb) / 2 ? '-hoejt' : '-lavt'));
    return dele;
  }
  // Repræsentative punkter for de forskellige dele (tastatur og markering).
  function punktFor(del) {
    const g = geometri(), c = g.celle;
    const gr = grene()[del];
    if (gr) return [(gr[0] + gr[2]) / 2, (gr[1] + gr[3]) / 2];
    const midtLand = (Math.max(g.kyst, c.x0) + c.x1) / 2 + 40, midtHav = Math.max(60, (c.x0 + Math.min(g.kyst, c.x1)) / 2);
    const lavt = (c.yb + (c.yt + c.yb) / 2) / 2 + 10, hoejt = Math.max(40, c.yt - 30);
    switch (del) {
      case 'land-lavt': return [midtLand, lavt];
      case 'hav-lavt': return [midtHav, lavt];
      case 'land-hoejt': return [midtLand, hoejt];
      case 'hav-hoejt': return [midtHav, hoejt];
      case 'land': return [g.scene === 'brise' ? 800 : 680, g.jordY(g.scene === 'brise' ? 800 : 680) + 25];
      case 'hav': return [g.scene === 'brise' ? 330 : 300, 440];
      case 'bjerg': return [1010, g.jordY(1010) + 30];
      case 'regn': { const r = regnOmraade(); return r ? [(r[0] + r[2]) / 2, (r[1] + r[3]) / 2 + 30] : null; }
    }
    return null;
  }
  function pegepunkter() {
    const g = geometri();
    const dele = ['vind-jord', 'vind-top', 'lodret-land', 'lodret-hav', 'land-lavt', 'hav-lavt', 'land-hoejt', 'hav-hoejt', 'land', 'hav'];
    if (g.scene === 'monsun') dele.push('regn', 'bjerg');
    return dele.map(punktFor).filter(Boolean);
  }
  function tegnPegepunkter(vis) {
    punkter.replaceChildren();
    if (!vis) return;
    pegepunkter().forEach(([x, y], i) => {
      const k = document.createElement('button');
      k.type = 'button';
      k.className = 'opg-punkt';
      k.style.left = `${x / 12}%`; k.style.top = `${y / 5}%`;
      k.setAttribute('aria-label', `Peg på punkt ${i + 1} i figuren`);
      k.addEventListener('click', e => { e.stopPropagation(); pegSvar(x, y); });
      punkter.append(k);
    });
  }

  // ── Grafen ────────────────────────────────────────────────────────────
  function grafX(t) { const G = geometri().graf; return G.x0 + (G.x1 - G.x0) * t / geometri().periode; }
  function tidTekst(t) {
    if (geometri().scene === 'brise') {
      const min = Math.round(((t + 6) % 24) * 6) * 10 % 1440;
      return `kl. ${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
    }
    return MAANEDER[Math.min(11, Math.floor(t))];
  }
  function grafLag() {
    let g = graf.querySelector('#g-opg');
    if (!g) { g = document.createElementNS(svgNS, 'g'); g.id = 'g-opg'; graf.append(g); }
    return g;
  }
  function tegnGrafpunkter(vis) {
    grafPunkter.replaceChildren();
    if (!vis) return;
    const p = geometri().periode, skridt = p === 24 ? 2 : 1;
    const ramme = grafPunkter.getBoundingClientRect(), ctm = graf.getScreenCTM();
    const G = geometri().graf;
    for (let t = skridt / 2; t < p; t += skridt) {
      const pt = new DOMPoint(grafX(t), (G.y0 + G.y1) / 2).matrixTransform(ctm);
      const k = document.createElement('button');
      k.type = 'button';
      k.className = 'opg-punkt';
      k.style.left = `${pt.x - ramme.left}px`; k.style.top = `${pt.y - ramme.top}px`;
      k.setAttribute('aria-label', `Vælg ${tidTekst(t)} i grafen`);
      k.addEventListener('click', e => { e.stopPropagation(); tidSvar(t); });
      grafPunkter.append(k);
    }
  }

  // ── Markeringer ───────────────────────────────────────────────────────
  function ryd() { fremhaev.replaceChildren(); maerker.replaceChildren(); graf.querySelector('#g-opg')?.remove(); }
  function maerke(x, y, rigtigt) {
    const m = document.createElement('span');
    m.className = `opg-maerke ${rigtigt ? 'rigtig' : 'forkert'}`;
    m.textContent = rigtigt ? '✓' : '✗';
    m.style.left = `${x / 12}%`; m.style.top = `${y / 5}%`;
    maerker.append(m);
  }
  function ring(x, y, radius) {
    const m = document.createElement('span');
    m.className = 'opg-ring';
    m.style.left = `${x / 12}%`; m.style.top = `${y / 5}%`;
    m.style.width = m.style.height = `${radius}px`;
    maerker.append(m);
  }
  function linje(d) {
    const p = document.createElementNS(svgNS, 'path');
    p.setAttribute('d', d);
    p.setAttribute('vector-effect', 'non-scaling-stroke');
    fremhaev.append(p);
  }
  function visRigtigDel(dele) {
    const g = geometri();
    // Er hele luften over havet rigtig, vises én samlet markering af den.
    if (dele.includes('hav-lavt') && dele.includes('lodret-hav')) {
      const top = g.celle.yt - 25, h = Math.min(g.kyst, g.celle.x1);
      linje(`M12 ${top}H${h - 8}V470H12Z`);
      fremhaev.lastChild.classList.add('omraade');
      dele = dele.filter(d => !['hav-lavt', 'hav-hoejt', 'lodret-hav'].includes(d));
    }
    for (const del of dele) {
      const gr = grene()[del];
      if (gr) { linje(`M${gr[0]} ${gr[1]}L${gr[2]} ${gr[3]}`); continue; }
      if (del === 'land' || del === 'hav') {
        let d = '';
        const [fra, til] = del === 'hav' ? [0, g.kyst] : [g.kyst, 1200];
        for (let x = fra; x <= til; x += 20) d += `${x === fra ? 'M' : 'L'}${x} ${(del === 'hav' ? 404 : g.jordY(x)) + 4}`;
        linje(d);
        continue;
      }
      if (del === 'regn' && dele.includes('lodret-land')) { const p = punktFor('regn'); if (p) ring(p[0], p[1], 90); continue; }
      const p = punktFor(del);
      if (p) ring(p[0], p[1], 64);
    }
  }
  function grafMaerke(t, rigtigt) {
    const G = geometri().graf, l = grafLag();
    l.insertAdjacentHTML('beforeend', `<g class="g-maerke ${rigtigt ? 'rigtig' : 'forkert'}" transform="translate(${grafX(t)} ${(G.y0 + G.y1) / 2})"><circle r="8"/><text y="4">${rigtigt ? '✓' : '✗'}</text></g>`);
  }
  function grafRigtig(intervaller) {
    const G = geometri().graf, l = grafLag();
    for (const [a, b] of intervaller) l.insertAdjacentHTML('afterbegin', `<rect class="g-rigtig" x="${grafX(a)}" y="${G.y0}" width="${grafX(b) - grafX(a)}" height="${G.y1 - G.y0}"/>`);
  }

  // ── Visning af en opgave ─────────────────────────────────────────────
  function prikker() {
    const ol = $('opg-prikker');
    ol.replaceChildren(...OPGAVER.map((_, i) => {
      const li = document.createElement('li');
      li.className = svar[i] === true ? 'rigtig' : svar[i] === false ? 'forkert' : i === nr ? 'nu' : '';
      return li;
    }));
    const besvaret = svar.filter(v => v !== undefined).length;
    $('opg-point').textContent = besvaret ? `${svar.filter(Boolean).length} af ${besvaret} rigtige` : '';
  }
  function saetSvarTekst(tekst, klasse = '') {
    svarTekst.className = `opg-svar ${klasse}`;
    svarTekst.innerHTML = tekst;
  }
  function vis() {
    const o = OPGAVER[nr];
    const besvaret = !!loest[nr];
    venter = false;
    visFigur(o.figur, o.type === 'tid');
    ryd();
    panel.classList.remove('resultat');
    document.body.classList.toggle('opgave-kaede', o.type === 'kaede');
    document.body.classList.toggle('opgave-skjul', !besvaret);
    document.body.classList.toggle('opgave-graf', o.type === 'tid' && !besvaret);
    figur.classList.toggle('opg-peg', o.type === 'peg' && !besvaret);
    const art = { peg: 'PEG PÅ FIGUREN', valg: 'VÆLG ET SVAR', kaede: 'BYG KÆDEN', tid: 'KLIK I GRAFEN' }[o.type];
    $('opg-nr').textContent = `OPGAVE ${nr + 1} AF ${OPGAVER.length} · ${art}`;
    $('opg-spm').textContent = o.spm;
    valgBoks.replaceChildren();
    valgBoks.className = `opg-valg opg-${o.type}`;
    naeste.style.visibility = besvaret ? '' : 'hidden';
    naeste.innerHTML = naesteTekst();
    tegnPegepunkter(o.type === 'peg' && !besvaret);
    tegnGrafpunkter(o.type === 'tid' && !besvaret);
    prikker();
    if (besvaret) { saetSvarTekst('Du har besvaret denne opgave.', 'hint'); return; }
    const sr = hvor => `<span class="sr">Med tastaturet: brug Tab til pegepunkterne i ${hvor}.</span>`;
    if (o.type === 'peg') saetSvarTekst((svar[nr] === false ? '<strong>Prøv igen:</strong> klik selv det rigtige sted i figuren. ' : 'Klik i figuren. ') + sr('figuren'), 'hint');
    if (o.type === 'tid') saetSvarTekst((svar[nr] === false ? '<strong>Prøv igen:</strong> klik selv et rigtigt sted i grafen. ' : 'Klik i grafen til højre. ') + sr('grafen'), 'hint');
    if (o.type === 'valg') {
      saetSvarTekst('Vælg det rigtige svar.', 'hint');
      o.valg.forEach((tekst, i) => {
        const k = document.createElement('button');
        k.type = 'button';
        k.innerHTML = `<b>${'ABC'[i]}</b><span>${tekst}</span>`;
        k.addEventListener('click', () => valgSvar(i));
        valgBoks.append(k);
      });
    }
    if (o.type === 'kaede') visKaede();
  }
  function naesteTekst() {
    return `${nr === OPGAVER.length - 1 ? 'Se resultat' : 'Næste opgave'} <span aria-hidden="true">→</span>`;
  }
  function afslut(rigtigt, tekst, { igen = false, overskrift } = {}) {
    if (svar[nr] === undefined) svar[nr] = rigtigt;
    if (!igen) loest[nr] = true;
    venter = igen;
    const o = OPGAVER[nr];
    overskrift ??= rigtigt ? '✓ Rigtigt!' : '✗ Ikke rigtigt.';
    saetSvarTekst(`<strong>${overskrift}</strong> ${tekst ? tekst + ' ' : ''}${o.forklaring}`, rigtigt ? 'rigtig' : 'forkert');
    document.body.classList.remove('opgave-skjul', 'opgave-graf');
    figur.classList.remove('opg-peg');
    tegnPegepunkter(false); tegnGrafpunkter(false);
    naeste.innerHTML = igen ? 'Prøv igen <span aria-hidden="true">↺</span>' : naesteTekst();
    naeste.style.visibility = '';
    prikker();
    naeste.focus({ preventScroll: true });
  }

  function pegSvar(vx, vy) {
    if (loest[nr] || venter || OPGAVER[nr].type !== 'peg') return;
    const o = OPGAVER[nr];
    const dele = find(vx, vy);
    const rigtigt = dele.some(d => o.rigtig.includes(d));
    const andetForsoeg = svar[nr] === false;
    const del = dele.find(d => o.forkert?.[d]) ?? dele[0];
    maerke(vx, vy, rigtigt);
    if (!rigtigt) visRigtigDel(o.rigtig);
    const tekst = rigtigt
      ? (andetForsoeg ? 'Nu fandt du det. Kun første forsøg tæller i pointene.' : '')
      : `Du pegede på ${DELE[del]}. ${o.forkert?.[del] ?? ''} Det rigtige er markeret med grønt. Se efter, og prøv så selv igen.`;
    afslut(rigtigt, tekst.replace(/\s+/g, ' ').trim(), { igen: !rigtigt, overskrift: rigtigt && andetForsoeg ? '✓ Rigtigt.' : undefined });
  }
  function tidSvar(t) {
    if (loest[nr] || venter || OPGAVER[nr].type !== 'tid') return;
    const o = OPGAVER[nr];
    const rigtigt = o.rigtig.some(([a, b]) => t >= a && t <= b);
    const andetForsoeg = svar[nr] === false;
    grafMaerke(t, rigtigt);
    if (!rigtigt) grafRigtig(o.rigtig);
    const tekst = rigtigt
      ? `Du valgte ${tidTekst(t)}.${andetForsoeg ? ' Kun første forsøg tæller i pointene.' : ''}`
      : `Du valgte ${tidTekst(t)}. ${o.forkert} De rigtige tidspunkter er markeret med grønt i grafen. Prøv så selv igen.`;
    afslut(rigtigt, tekst, { igen: !rigtigt, overskrift: rigtigt && andetForsoeg ? '✓ Rigtigt.' : undefined });
  }
  function valgSvar(i) {
    if (loest[nr]) return;
    const o = OPGAVER[nr];
    [...valgBoks.children].forEach((k, j) => {
      k.disabled = true;
      if (j === o.rigtig) { k.classList.add('rigtig'); k.querySelector('b').textContent = '✓'; }
      else if (j === i) { k.classList.add('forkert'); k.querySelector('b').textContent = '✗'; }
      else k.classList.add('daempet');
    });
    afslut(i === o.rigtig, i === o.rigtig ? '' : `Det rigtige svar er ${'ABC'[o.rigtig]}.`);
  }

  // ── Byg kæden ────────────────────────────────────────────────────────
  // Kort kan trækkes (mus og touch) eller vælges med klik/Enter og
  // derefter placeres ved at klikke/Enter på et felt.
  function visKaede() {
    const o = OPGAVER[nr];
    kaede = { felter: o.led.map(() => null), valgt: null, kort: bland([...o.led, ...o.falske]) };
    saetSvarTekst('Træk udsagnene ind i felterne – eller klik på et udsagn og derefter på et felt. Træk et udsagn tilbage i bunken for at fjerne det.', 'hint');
    valgBoks.innerHTML = '<ol class="kaede-raekke"></ol><div class="kaede-bunke" role="list" aria-label="Udsagn"></div><button type="button" class="kaede-tjek primaer" disabled>Tjek kæden</button>';
    valgBoks.querySelector('.kaede-tjek').addEventListener('click', tjekKaede);
    tegnKaede();
  }
  function kortKnap(tekst) {
    const k = document.createElement('button');
    k.type = 'button';
    k.className = 'kaede-kort';
    k.textContent = tekst;
    k.dataset.tekst = tekst;
    k.setAttribute('aria-pressed', String(kaede.valgt === tekst));
    k.addEventListener('pointerdown', e => startTraek(e, tekst));
    k.addEventListener('click', e => {
      if (k.dataset.trukket) { delete k.dataset.trukket; return; }
      e.stopPropagation();
      const felt = k.closest('.kaede-felt');
      if (felt && kaede.valgt && kaede.valgt !== tekst) { placer(kaede.valgt, +felt.dataset.felt); return; }
      kaede.valgt = kaede.valgt === tekst ? null : tekst;
      tegnKaede();
      valgBoks.querySelector(`.kaede-kort[data-tekst="${CSS.escape(tekst)}"]`)?.focus();
    });
    return k;
  }
  function tegnKaede() {
    const raekke = valgBoks.querySelector('.kaede-raekke');
    const bunke = valgBoks.querySelector('.kaede-bunke');
    raekke.replaceChildren(...kaede.felter.map((tekst, i) => {
      const li = document.createElement('li');
      li.className = 'kaede-felt' + (tekst ? ' fyldt' : '');
      li.dataset.felt = i;
      if (tekst) li.append(kortKnap(tekst));
      else {
        const tom = document.createElement('button');
        tom.type = 'button';
        tom.className = 'kaede-tom';
        tom.textContent = kaede.valgt ? 'Sæt her' : `${i + 1}`;
        tom.setAttribute('aria-label', `Felt ${i + 1} i kæden${kaede.valgt ? ': sæt det valgte udsagn her' : ', tomt'}`);
        tom.addEventListener('click', () => placer(kaede.valgt, i));
        li.append(tom);
      }
      return li;
    }));
    bunke.replaceChildren(...kaede.kort.filter(t => !kaede.felter.includes(t)).map(t => {
      const k = kortKnap(t); k.setAttribute('role', 'listitem'); return k;
    }));
    bunke.onclick = e => { if (e.target === bunke && kaede.valgt) placer(kaede.valgt, null); };
    valgBoks.querySelector('.kaede-tjek').disabled = kaede.felter.includes(null);
  }
  function placer(tekst, i) {
    if (!tekst || loest[nr]) return;
    const fra = kaede.felter.indexOf(tekst);
    if (i === null) { if (fra >= 0) kaede.felter[fra] = null; }
    else {
      const der = kaede.felter[i];
      if (fra >= 0) kaede.felter[fra] = der;
      kaede.felter[i] = tekst;
    }
    kaede.valgt = null;
    tegnKaede();
  }
  function startTraek(e, tekst) {
    if (loest[nr] || e.button > 0) return;
    const kilde = e.currentTarget;
    const x0 = e.clientX, y0 = e.clientY;
    let spoegelse = null;
    const under = ev => document.elementFromPoint(ev.clientX, ev.clientY)?.closest('.kaede-felt, .kaede-bunke');
    const flyt = ev => {
      if (!spoegelse && Math.hypot(ev.clientX - x0, ev.clientY - y0) < 6) return;
      if (!spoegelse) {
        const r = kilde.getBoundingClientRect();
        spoegelse = kilde.cloneNode(true);
        spoegelse.classList.add('kaede-spoegelse');
        spoegelse.style.width = `${r.width}px`;
        document.body.append(spoegelse);
        kilde.classList.add('traekkes');
        kilde.dataset.trukket = '1';
      }
      ev.preventDefault();
      spoegelse.style.left = `${ev.clientX}px`; spoegelse.style.top = `${ev.clientY}px`;
      valgBoks.querySelectorAll('.kaede-felt').forEach(f => f.classList.remove('over'));
      under(ev)?.classList.add('over');
    };
    const slip = ev => {
      removeEventListener('pointermove', flyt);
      removeEventListener('pointerup', slip);
      removeEventListener('pointercancel', slip);
      if (!spoegelse) return;
      spoegelse.remove();
      const maalEl = ev.type === 'pointerup' ? under(ev) : null;
      kilde.classList.remove('traekkes');
      if (maalEl?.classList.contains('kaede-felt')) placer(tekst, +maalEl.dataset.felt);
      else if (maalEl) placer(tekst, null);
      else tegnKaede();
    };
    addEventListener('pointermove', flyt, { passive: false });
    addEventListener('pointerup', slip);
    addEventListener('pointercancel', slip);
  }
  function tjekKaede() {
    const o = OPGAVER[nr];
    let antal = 0;
    valgBoks.querySelectorAll('.kaede-felt').forEach((f, i) => {
      const ok = kaede.felter[i] === o.led[i];
      if (ok) antal++;
      f.classList.add(ok ? 'rigtig' : 'forkert');
      const kort = f.querySelector('.kaede-kort');
      kort.disabled = true;
      kort.insertAdjacentHTML('afterbegin', `<b>${ok ? '✓' : '✗'}</b> `);
      if (!ok) f.insertAdjacentHTML('beforeend', `<p class="kaede-facit">✓ ${o.led[i]}</p>`);
    });
    valgBoks.querySelectorAll('.kaede-bunke .kaede-kort').forEach(k => { k.disabled = true; });
    valgBoks.querySelector('.kaede-tjek').remove();
    const alle = antal === o.led.length;
    afslut(alle, alle ? '' : `${antal} af ${o.led.length} led står rigtigt. Den rigtige kæde står med grønt under de forkerte led.`);
  }

  // ── Resultat ─────────────────────────────────────────────────────────
  function resultat() {
    ryd(); tegnPegepunkter(false); tegnGrafpunkter(false);
    document.body.classList.remove('opgave-skjul', 'opgave-kaede', 'opgave-graf');
    figur.classList.remove('opg-peg');
    panel.classList.add('resultat');
    const rigtige = svar.filter(Boolean).length, iAlt = OPGAVER.length;
    $('opg-nr').textContent = 'RESULTAT';
    $('opg-spm').textContent = `Du fik ${rigtige} af ${iAlt} rigtige`;
    saetSvarTekst(rigtige === iAlt ? 'Flot! Du kan forklare brisen og monsunen hele vejen fra solens opvarmning til vinden.'
      : rigtige >= iAlt - 3 ? 'Godt gået. De røde prikker viser, hvor du tog fejl – gå de trin igennem igen.'
      : 'Gå trinene igennem igen, og prøv så opgaverne en gang til. De røde prikker viser, hvor du tog fejl.', rigtige === iAlt ? 'rigtig' : '');
    valgBoks.className = 'opg-valg opg-slut';
    valgBoks.innerHTML = '<button type="button" class="forsoeg-knap" data-igen>↺ Tag opgaverne igen</button><button type="button" class="forsoeg-knap" data-trin1>Gå trinene igennem igen</button>';
    valgBoks.querySelector('[data-igen]').addEventListener('click', () => { nr = 0; svar = []; loest = []; vis(); });
    valgBoks.querySelector('[data-trin1]').addEventListener('click', () => tilTrin(0));
    naeste.style.visibility = 'hidden';
    nr = OPGAVER.length;
    prikker();
  }

  naeste.addEventListener('click', () => {
    if (venter) { vis(); $('opg-spm').focus({ preventScroll: true }); return; }
    if (nr < OPGAVER.length - 1) { nr++; vis(); } else resultat();
    $('opg-spm').focus({ preventScroll: true });
  });
  figur.addEventListener('click', e => {
    if (!aktiv || OPGAVER[nr]?.type !== 'peg') return;
    const { r } = maal();
    pegSvar((e.clientX - r.left) / r.width * 1200, (e.clientY - r.top) / r.height * 500);
  });
  graf.addEventListener('click', e => {
    if (!aktiv || OPGAVER[nr]?.type !== 'tid') return;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(graf.getScreenCTM().inverse());
    const G = geometri().graf;
    if (p.x < G.x0 || p.x > G.x1) return;
    tidSvar((p.x - G.x0) / (G.x1 - G.x0) * geometri().periode);
  });
  addEventListener('resize', () => {
    if (!aktiv) return;
    const o = OPGAVER[nr];
    if (o?.type === 'tid' && !loest[nr] && !venter) tegnGrafpunkter(true);
    if (o?.type === 'peg' && venter) { const m = [...maerker.querySelectorAll('.opg-maerke')]; fremhaev.replaceChildren(); maerker.replaceChildren(...m); visRigtigDel(o.rigtig); }
  });

  return {
    aktiver(til) {
      aktiv = til;
      lag.hidden = !til;
      if (til) { if (nr >= OPGAVER.length) { visFigur(2, false); resultat(); } else vis(); }
      else { ryd(); document.body.classList.remove('opgave-skjul', 'opgave-kaede', 'opgave-graf'); figur.classList.remove('opg-peg'); tegnPegepunkter(false); tegnGrafpunkter(false); }
    },
    // Til test.
    find,
    punktFor,
  };
}
