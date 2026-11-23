// Opgavedelen efter de seks trin: peg på figuren, multiple choice og «byg kæden».
// Første svar tæller. Efter svaret vises tydeligt rigtigt/forkert, det rigtige
// svar markeres, og figurens etiketter kommer frem igen.
import { OPGAVER, DELE } from './opgavedata.js';

const $ = id => document.getElementById(id);
const svgNS = 'http://www.w3.org/2000/svg';

function afstandTilLinje(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1;
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}
function delForBane(b) {
  if (b.type === 'sol') return 'solstraaling';
  if (b.type === 'jord') return b.direkte ? 'jordstraaling-direkte' : 'jordstraaling';
  return b.absorberes ? 'modstraaling' : 'atmosfaere-ud';
}
function bland(liste) {
  const a = [...liste];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

export function lavOpgaver({ figur, landskab, geometri, tilTrin }) {
  const panel = $('opgaver');
  const lag = $('opg-lag');
  const fremhaev = $('opg-fremhaev');
  const maerker = $('opg-maerker');
  const punkter = $('opg-punkter');
  const valgBoks = $('opg-valg');
  const svarTekst = $('opg-svar');
  const naeste = $('opg-naeste');
  let nr = 0;
  let svar = [];          // svar[i] = true/false efter første forsøg – det er det, der tæller
  let loest = [];         // loest[i] = true, når eleven må gå videre
  let venter = false;     // forkert peg: det rigtige vises, og eleven skal prøve igen
  let aktiv = false;
  let kaede = null;       // tilstand for «byg kæden»

  // ── Figurens geometri i skærmpixel ────────────────────────────────────
  function maal() {
    const r = landskab.getBoundingClientRect();
    return { r, sx: r.width / 1200, sy: r.height / 500 };
  }
  // Hvilken del af figuren ligger punktet (i viewBox-koordinater) på?
  function find(vx, vy) {
    const { sx, sy } = maal();
    const g = geometri();
    const px = vx * sx, py = vy * sy;
    if (Math.hypot(px - 156 * sx, py - 103 * sy) < 44 * sy + 8) return 'sol';
    for (const [x, y] of g.molekyler) if (Math.hypot(px - x * sx, py - y * sy) < Math.max(16, 22 * sy) + 6) return 'gas';
    if (py >= g.overflade(vx) * sy - 6) return 'jordoverflade';
    let bedst = null, mindst = 16;
    for (const b of g.baner) {
      const d = afstandTilLinje(px, py, b.x * sx, b.y * sy, b.slutX * sx, b.slutY * sy);
      if (d < mindst) { mindst = d; bedst = b; }
    }
    return bedst ? delForBane(bedst) : 'luften';
  }

  // Tastaturalternativ: en fast række pegepunkter, også på forkerte dele.
  function pegepunkter() {
    const g = geometri();
    const midt = b => [(b.x + b.slutX) / 2, (b.y + b.slutY) / 2];
    const foerste = del => g.baner.find(b => delForBane(b) === del);
    const liste = [[156, 103], midt(foerste('solstraaling')), [430, g.overflade(430) + 18], g.molekyler[0].slice(0, 2)];
    for (const del of ['jordstraaling', 'modstraaling', 'atmosfaere-ud', 'jordstraaling-direkte']) {
      const b = foerste(del); if (b) liste.push(midt(b));
    }
    liste.push([360, 210]);
    return liste;
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

  // ── Markeringer i figuren ────────────────────────────────────────────
  function ryd() { fremhaev.replaceChildren(); maerker.replaceChildren(); }
  function maerke(x, y, rigtigt) {
    const m = document.createElement('span');
    m.className = `opg-maerke ${rigtigt ? 'rigtig' : 'forkert'}`;
    m.textContent = rigtigt ? '✓' : '✗';
    m.style.left = `${x / 12}%`; m.style.top = `${y / 5}%`;
    maerker.append(m);
  }
  function ring(x, y, radius) {
    const { sx, sy } = maal();
    const m = document.createElement('span');
    m.className = 'opg-ring';
    m.style.left = `${x / 12}%`; m.style.top = `${y / 5}%`;
    m.style.width = m.style.height = `${2 * radius * sy + 16}px`;
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
    for (const del of dele) {
      if (del === 'sol') ring(156, 103, 44);
      if (del === 'gas') for (const [x, y] of g.molekyler) ring(x, y, 22);
      if (del === 'jordoverflade') {
        let d = '';
        for (let x = 0; x <= 1200; x += 20) d += `${x ? 'L' : 'M'}${x} ${g.overflade(x) + 4}`;
        linje(d);
      }
      for (const b of g.baner) if (delForBane(b) === del) linje(`M${b.x} ${b.y}L${b.slutX} ${b.slutY}`);
    }
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
    ryd();
    panel.classList.remove('resultat');
    document.body.classList.toggle('opgave-kaede', o.type === 'kaede');
    document.body.classList.toggle('opgave-skjul', !besvaret);
    figur.classList.toggle('opg-peg', o.type === 'peg' && !besvaret);
    const art = { peg: 'PEG PÅ FIGUREN', valg: 'VÆLG ET SVAR', kaede: 'BYG KÆDEN' }[o.type];
    $('opg-nr').textContent = `OPGAVE ${nr + 1} AF ${OPGAVER.length} · ${art}`;
    $('opg-spm').textContent = o.spm;
    valgBoks.replaceChildren();
    valgBoks.className = `opg-valg opg-${o.type}`;
    naeste.style.visibility = besvaret ? '' : 'hidden';
    naeste.innerHTML = naesteTekst();
    tegnPegepunkter(o.type === 'peg' && !besvaret);
    prikker();
    if (besvaret) { saetSvarTekst('Du har besvaret denne opgave.', 'hint'); return; }
    if (o.type === 'peg') saetSvarTekst(svar[nr] === false
      ? '<strong>Prøv igen:</strong> klik selv det rigtige sted i figuren. <span class="sr">Med tastaturet: brug Tab til pegepunkterne i figuren.</span>'
      : 'Klik i figuren. <span class="sr">Med tastaturet: brug Tab til pegepunkterne i figuren.</span>', 'hint');
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
  // «igen» = eleven skal løse samme opgave igen, før der kan gås videre.
  function afslut(rigtigt, tekst, { igen = false, overskrift } = {}) {
    if (svar[nr] === undefined) svar[nr] = rigtigt;
    if (!igen) loest[nr] = true;
    venter = igen;
    const o = OPGAVER[nr];
    overskrift ??= rigtigt ? '✓ Rigtigt!' : '✗ Ikke rigtigt.';
    saetSvarTekst(`<strong>${overskrift}</strong> ${tekst ? tekst + ' ' : ''}${o.forklaring}`, rigtigt ? 'rigtig' : 'forkert');
    document.body.classList.remove('opgave-skjul');
    figur.classList.remove('opg-peg');
    tegnPegepunkter(false);
    naeste.innerHTML = igen ? 'Prøv igen <span aria-hidden="true">↺</span>' : naesteTekst();
    naeste.style.visibility = '';
    prikker();
    naeste.focus({ preventScroll: true });
  }

  function pegSvar(vx, vy) {
    if (loest[nr] || venter || OPGAVER[nr].type !== 'peg') return;
    const o = OPGAVER[nr];
    const del = find(vx, vy);
    const rigtigt = o.rigtig.includes(del);
    const andetForsoeg = svar[nr] === false;
    maerke(vx, vy, rigtigt);
    if (!rigtigt) visRigtigDel(o.rigtig);
    const tekst = rigtigt
      ? (andetForsoeg ? 'Nu fandt du det. Kun første forsøg tæller i pointene.' : '')
      : `Du pegede på ${DELE[del]}. ${o.forkert?.[del] ?? ''} Det rigtige er markeret med grønt. Se efter, og prøv så selv igen.`;
    afslut(rigtigt, tekst.trim(), { igen: !rigtigt, overskrift: rigtigt && andetForsoeg ? '✓ Rigtigt.' : undefined });
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
  // Kort kan trækkes (mus og touch med pointer events) eller vælges med
  // klik/Enter og derefter placeres ved at klikke/Enter på et felt.
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
  // Placér et udsagn i felt i (null = tilbage i bunken). Et optaget felt bytter.
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
    const under = ev => document.elementFromPoint(ev.clientX, ev.clientY)?.closest('.kaede-felt, .kaede-bunke');
    const slip = ev => {
      removeEventListener('pointermove', flyt);
      removeEventListener('pointerup', slip);
      removeEventListener('pointercancel', slip);
      if (!spoegelse) return;
      spoegelse.remove();
      const maal = ev.type === 'pointerup' ? under(ev) : null;
      kilde.classList.remove('traekkes');
      if (maal?.classList.contains('kaede-felt')) placer(tekst, +maal.dataset.felt);
      else if (maal) placer(tekst, null);
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
    ryd(); tegnPegepunkter(false);
    document.body.classList.remove('opgave-skjul', 'opgave-kaede');
    figur.classList.remove('opg-peg');
    panel.classList.add('resultat');
    const rigtige = svar.filter(Boolean).length, i_alt = OPGAVER.length;
    $('opg-nr').textContent = 'RESULTAT';
    $('opg-spm').textContent = `Du fik ${rigtige} af ${i_alt} rigtige`;
    saetSvarTekst(rigtige === i_alt ? 'Flot! Du kan følge drivhuseffekten hele vejen fra Solen til den varmere jordoverflade.'
      : rigtige >= i_alt - 3 ? 'Godt gået. De røde prikker viser, hvor du tog fejl – gå de trin igennem igen.'
      : 'Gå trinene igennem igen, og prøv så opgaverne en gang til. De røde prikker viser, hvor du tog fejl.', rigtige === i_alt ? 'rigtig' : '');
    valgBoks.className = 'opg-valg opg-slut';
    valgBoks.innerHTML = '<button type="button" class="forsoeg-knap" data-igen>↺ Tag opgaverne igen</button><button type="button" class="forsoeg-knap" data-trin1>Gå trinene igennem igen</button>';
    valgBoks.querySelector('[data-igen]').addEventListener('click', () => { nr = 0; svar = []; loest = []; vis(); });
    valgBoks.querySelector('[data-trin1]').addEventListener('click', () => tilTrin(0));
    naeste.style.visibility = 'hidden';
    nr = OPGAVER.length;
    prikker();
  }

  naeste.addEventListener('click', () => {
    if (venter) { vis(); $('opg-spm').focus({ preventScroll: true }); return; }   // samme pegeopgave igen
    if (nr < OPGAVER.length - 1) { nr++; vis(); } else resultat();
    $('opg-spm').focus({ preventScroll: true });
  });
  figur.addEventListener('click', e => {
    if (!aktiv || OPGAVER[nr]?.type !== 'peg') return;
    const { r } = maal();
    pegSvar((e.clientX - r.left) / r.width * 1200, (e.clientY - r.top) / r.height * 500);
  });
  addEventListener('resize', () => { if (aktiv && venter) { const m = [...maerker.querySelectorAll('.opg-maerke')]; ryd(); maerker.append(...m); visRigtigDel(OPGAVER[nr].rigtig); } });

  return {
    aktiver(til) {
      aktiv = til;
      lag.hidden = !til;
      if (til) { if (nr >= OPGAVER.length) resultat(); else vis(); }
      else { document.body.classList.remove('opgave-skjul', 'opgave-kaede'); figur.classList.remove('opg-peg'); tegnPegepunkter(false); }
    },
    // Til test: hvilken del af figuren ligger et viewBox-punkt på?
    find,
  };
}
