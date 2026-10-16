// Del 2 · Hvor dannes stenene? Et skematisk snit fra en hotspot over en
// spredningsryg og en subduktionszone til en bjergkæde. Stederne er knapper over
// tegningen; i quizzen trykker eleven der, hvor en sten fra samlingen er dannet.
import { STEDER, QUIZSTEN, stederFor } from './model.js';
import { el, efterId, stenbillede, stenlink } from './sten.js';

const NS = 'http://www.w3.org/2000/svg';
const svg = (navn, attr = {}, tekst) => {
  const e = document.createElementNS(NS, navn);
  for (const [k, v] of Object.entries(attr)) e.setAttribute(k, v);
  if (tekst !== undefined) e.textContent = tekst;
  return e;
};
const HAV = 110;   // havoverfladen i snittet

function tegnSnit(rod) {
  const defs = svg('defs');
  defs.innerHTML = `
    <linearGradient id="himmel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e7f3f8"/><stop offset="1" stop-color="#f6fbfc"/></linearGradient>
    <linearGradient id="kappe" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d9a46a"/><stop offset="1" stop-color="#c26f43"/></linearGradient>
    <linearGradient id="hav" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7dbcd8"/><stop offset="1" stop-color="#3f7fa6"/></linearGradient>
    <pattern id="lag" width="30" height="8" patternUnits="userSpaceOnUse"><rect width="30" height="8" fill="#ecd48a"/><path d="M0 4h30" stroke="#c9a94f" stroke-width="1.2"/></pattern>
    <pattern id="skifrig" width="14" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(-18)"><rect width="14" height="10" fill="#9db8cb"/><path d="M0 3h14M0 8h14" stroke="#6f8ea6" stroke-width="1.3"/></pattern>
    <pattern id="krystal" width="10" height="10" patternUnits="userSpaceOnUse"><rect width="10" height="10" fill="#e9a07a"/><path d="M2 2l2 1-1 2zM6 6l3 1-2 2z" fill="#b35b3a"/></pattern>
    <marker id="pspids" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#17211f"/></marker>`;
  rod.append(defs);
  const lag = (d, fyld, attr = {}) => rod.append(svg('path', { d, fill: fyld, ...attr }));
  rod.append(svg('rect', { x: 0, y: 0, width: 1000, height: 520, fill: 'url(#himmel)' }));
  // Kappen (asthenosfæren) bag det hele.
  rod.append(svg('rect', { x: 0, y: 150, width: 1000, height: 370, fill: 'url(#kappe)' }));
  // Hotspotsøjlen stiger op fra dybet.
  lag('M70 520 C72 400 66 300 50 250 C70 228 120 228 140 250 C120 300 112 400 116 520Z', '#ef8a4a', { opacity: .75 });
  // Smeltezone under ryggen.
  lag('M232 160 C215 190 200 230 190 262 L274 262 C264 230 250 190 232 160Z', '#ef7a3d', { opacity: .8 });
  // Oceanpladens litosfære (kappedelen) – tykkere, jo ældre.
  lag('M0 192 L232 158 L440 214 C480 240 540 300 600 380 L700 520 L620 520 C560 420 520 370 470 330 C420 296 330 268 232 236 L0 262Z', '#8f9c6c');
  // Havet.
  lag(`M0 ${HAV} H440 V214 C420 205 380 190 340 186 C300 182 262 164 232 148 C205 160 160 172 128 176 L0 178Z`, 'url(#hav)');
  // Oceanbunden: basalt og gabbro (tynd skorpe) på hver side af ryggen, ned i subduktionszonen.
  lag('M0 178 L128 176 C160 172 205 160 232 148 C262 164 300 182 340 186 C380 190 420 205 440 214 C480 240 540 300 600 380 L612 396 C548 316 488 258 440 232 C400 214 360 205 320 202 C280 198 256 184 232 166 C205 178 160 190 128 194 L0 196Z', '#3a474c');
  // Dybhavssediment oven på den gamle havbund.
  lag('M290 184 C320 186 340 186 360 188 C390 192 420 203 440 212 L440 216 C420 208 390 197 360 193 C335 190 312 190 290 188Z', '#e6cf86');
  // Eklogit: den nedadgående plade bliver tungere og mørkere med dybden.
  lag('M560 336 C580 356 592 372 612 396 L700 520 L668 520 C630 460 600 410 556 360Z', '#26343a');
  // Hotspotvulkanen (skjoldvulkan) på oceanpladen.
  lag(`M40 178 C60 140 80 92 92 86 C104 92 124 140 146 176Z`, '#3d3a37');
  // Kontinentet: skorpe fra vulkanbuen til bjergkæden med den fortykkede rod.
  lag(`M444 214 C470 200 500 140 520 ${HAV} L1000 ${HAV} L1000 360 C960 380 900 390 860 370 C820 340 760 260 700 240 C640 226 560 236 500 250 C470 236 455 224 444 214Z`, '#d6c1ad');
  lag(`M520 ${HAV} L1000 ${HAV} L1000 120 C940 130 860 132 800 128 Z`, '#d6c1ad');
  // Den nederste skorpe er mørkere.
  lag('M500 250 C560 236 640 226 700 240 C760 260 820 340 860 370 C900 390 960 380 1000 360 L1000 300 C950 300 900 300 860 290 C820 270 760 214 700 206 C640 200 560 214 500 230Z', '#bba48f');
  // Bjergkæden og dens rod med omdannede bjergarter.
  lag(`M770 ${HAV} C800 80 820 40 850 30 C870 20 880 50 900 26 C920 14 940 40 960 34 C980 30 990 60 1000 70 L1000 ${HAV}Z`, '#bfae94');
  lag('M806 170 C840 200 870 260 880 310 C900 340 950 344 1000 330 L1000 170 C950 160 880 156 806 170Z', 'url(#skifrig)');
  lag('M890 300 C910 290 930 296 940 312 C930 326 900 326 890 300Z', '#f2a2b4', { opacity: .9 });
  lag('M944 286 C958 278 974 284 980 298 C968 310 950 304 944 286Z', '#f2a2b4', { opacity: .9 });
  // Sne på toppene.
  lag('M842 38 C850 30 858 28 866 34 L858 40 L850 36Z M890 32 C898 22 908 20 916 26 L906 32Z M948 40 C955 33 962 32 968 36 L960 41Z', '#fff');
  // Lavland og sokkelhav med lag af sediment; floden fra bjergene.
  lag(`M600 ${HAV} C640 112 690 114 740 112 C770 111 790 110 810 ${HAV} L810 150 C760 150 690 152 600 140Z`, 'url(#lag)');
  lag(`M610 ${HAV} H770 C760 114 740 120 700 122 C670 123 640 120 610 ${HAV + 3}Z`, '#7dbcd8', { opacity: .85 });
  lag(`M790 ${HAV - 1} C815 104 830 96 850 80`, 'none', { stroke: '#4a93bd', 'stroke-width': 3, 'fill-opacity': 0 });
  // Vulkanbuen: stratovulkan og magmakammer (pluton) under den.
  lag(`M500 ${HAV} C520 90 532 62 540 54 C548 62 560 90 580 ${HAV}Z`, '#6d625a');
  lag('M540 62 L540 54', 'none', { stroke: '#e8562a', 'stroke-width': 4 });
  lag('M532 222 C530 196 548 184 566 186 C588 188 596 210 590 228 C580 242 540 244 532 222Z', 'url(#krystal)', { stroke: '#a24b2b', 'stroke-width': 1.5 });
  // Smeltning i kappekilen og magma, der stiger op.
  lag('M520 300 C536 286 560 282 576 296 C588 312 572 330 548 330 C528 330 512 316 520 300Z', '#ef7a3d', { opacity: .9 });
  for (const [x1, y1, x2, y2] of [[548, 284, 556, 246], [558, 180, 542, 66]]) {
    rod.append(svg('path', { d: `M${x1} ${y1} L${x2} ${y2}`, stroke: '#e8562a', 'stroke-width': 3, 'stroke-dasharray': '6 5', fill: 'none' }));
  }
  // Vand fra pladen.
  for (const [x, y] of [[548, 350], [574, 372]]) {
    rod.append(svg('path', { d: `M${x} ${y} q-6 -12 0 -24 q6 -12 0 -24`, stroke: '#2f7fb5', 'stroke-width': 2, fill: 'none' }));
  }
  // Magma under hotspotten og ryggen.
  lag('M92 86 L92 176', 'none', { stroke: '#e8562a', 'stroke-width': 3, 'stroke-dasharray': '6 5' });
  lag('M232 150 L232 236', 'none', { stroke: '#e8562a', 'stroke-width': 3, 'stroke-dasharray': '6 5' });
  // Navne på lagene.
  const navn = (x, y, t, farve = '#17211f') => rod.append(svg('text', { x, y, class: 'lagnavn', fill: farve }, t));
  navn(14, 214, 'Oceanbund (basalt og gabbro)', '#fff');
  navn(14, 236, 'Litosfære (kappe)', '#17211f');
  navn(14, 500, 'Kappe', '#17211f');
  navn(640, 200, 'Kontinental skorpe', '#17211f');
  navn(840, 186, 'Bjergkædens rod', '#17211f');

  // Pladernes bevægelse.
  const bevaegelse = svg('g', { class: 'bevaegelse' });
  for (const [x1, x2, y] of [[200, 150, 128], [264, 314, 128], [372, 420, 128], [700, 660, 98], [990, 950, 98]]) {
    bevaegelse.append(svg('path', { d: `M${x1} ${y} L${x2} ${y}`, stroke: '#17211f', 'stroke-width': 3, 'marker-end': 'url(#pspids)' }));
  }
  rod.append(bevaegelse);

  // Temperatur: skematiske isotermer (sat sammen af kendte forløb, ikke beregnet).
  const temp = svg('g', { class: 'temperatur', hidden: '' });
  const iso = [
    [200, 'M0 210 L130 204 C180 196 215 168 232 156 C250 168 300 196 360 206 C400 214 430 226 450 240 C490 270 520 310 560 380 L640 520 M590 230 C640 196 700 170 760 170 C840 168 920 168 1000 172'],
    [600, 'M0 252 L130 246 C180 236 215 196 232 172 C250 196 300 236 360 248 C400 256 430 272 470 300 C500 324 520 360 540 400 L580 520 M560 262 C600 250 650 260 700 270 C760 280 830 296 880 284 C930 274 970 270 1000 268'],
    [1000, 'M0 300 L130 292 C180 280 215 230 232 196 C250 230 300 280 360 292 C400 300 440 318 470 338 L500 360 C520 380 530 420 534 520 M520 320 C560 300 640 330 700 340 C780 352 860 358 940 350 L1000 346']
  ];
  for (const [grader, d] of iso) {
    temp.append(svg('path', { d, fill: 'none', stroke: '#b3122e', 'stroke-width': 2, 'stroke-dasharray': '8 5' }));
  }
  for (const [x, y, t] of [[372, 212, '200 °C'], [372, 254, '600 °C'], [372, 304, '1000 °C'], [700, 164, '200 °C'], [700, 264, '600 °C'], [740, 342, '1000 °C']]) {
    temp.append(svg('text', { x, y, class: 'isonavn' }, t));
  }
  rod.append(temp);
  return { temp, bevaegelse };
}

export function start(rodDel) {
  const tegning = rodDel.querySelector('#snit');
  const figur = rodDel.querySelector('.snitfigur');
  const knaprum = rodDel.querySelector('#stedknapper');
  const stedkort = rodDel.querySelector('#stedkort');
  const quiz = rodDel.querySelector('#quiz');
  const quizsten = rodDel.querySelector('#quizsten');
  const quizsvar = rodDel.querySelector('#quizsvar');
  const quiznaeste = rodDel.querySelector('#quiznaeste');
  const quizpoint = rodDel.querySelector('#quizpoint');
  const { temp, bevaegelse } = tegnSnit(tegning);
  let tilstand = 'udforsk', valgt = null;
  let runde = [], nr = 0, point = 0, svaret = false;

  // Knapper over stederne, placeret efter tegningens skala.
  const knapper = Object.entries(STEDER).map(([id, s], i) => {
    const knap = el('button', '', 'stedknap');
    knap.dataset.sted = id;
    knap.append(el('span', String(i + 1)), el('span', s.navn, 'navn'));
    knap.setAttribute('aria-label', `${i + 1}: ${s.navn}`);
    knap.onclick = () => tilstand === 'quiz' ? svar(id) : vaelg(id);
    knaprum.append(knap);
    return knap;
  });
  function placer() {
    const ctm = tegning.getScreenCTM(), boks = knaprum.getBoundingClientRect();
    if (!ctm || !boks.width) return;
    const p = tegning.createSVGPoint();
    for (const knap of knapper) {
      const s = STEDER[knap.dataset.sted];
      p.x = s.x; p.y = s.y;
      const q = p.matrixTransform(ctm);
      knap.style.left = `${q.x - boks.left}px`; knap.style.top = `${q.y - boks.top}px`;
    }
    figur.classList.toggle('smal', boks.width < 720);
  }
  new ResizeObserver(placer).observe(knaprum);

  function vaelg(id) {
    valgt = id;
    for (const k of knapper) k.setAttribute('aria-pressed', String(k.dataset.sted === id));
    const s = STEDER[id];
    const dannes = el('div', '', 'dannes');
    for (const sten of s.dannes) {
      const a = el('a');
      a.href = stenlink(sten);
      a.append(stenbillede(sten), el('span', efterId[sten].navn));
      dannes.append(a);
    }
    stedkort.replaceChildren(el('h3', `${knapper.findIndex(k => k.dataset.sted === id) + 1}. ${s.navn}`), el('p', s.tekst),
      el('p', `Eksempler: ${s.eksempel}.`, 'eksempel'), el('p', 'Her dannes fx:', 'eksempel'), dannes);
  }

  // ---------- Quiz ----------
  function nyRunde() {
    const bunke = [...QUIZSTEN].sort(() => Math.random() - .5);
    runde = bunke.slice(0, 8); nr = 0; point = 0;
    visSten();
  }
  function visSten() {
    svaret = false;
    for (const k of knapper) { k.classList.remove('rigtig', 'forkert'); k.setAttribute('aria-pressed', 'false'); }
    const post = efterId[runde[nr]];
    const tekst = el('div');
    tekst.append(el('h3', post.navn), el('p', post.kendetegn || post.kort));
    quizsten.replaceChildren(stenbillede(post.id), tekst);
    quizsten.dataset.sten = post.id;
    quizsvar.hidden = true; quiznaeste.hidden = true;
    quizpoint.textContent = `Sten ${nr + 1} af ${runde.length} · ${point} rigtige`;
  }
  function svar(id) {
    if (svaret) return;
    svaret = true;
    const post = efterId[runde[nr]], rigtige = stederFor(post.id);
    const ok = rigtige.includes(id);
    if (ok) point++;
    for (const k of knapper) {
      if (rigtige.includes(k.dataset.sted)) k.classList.add('rigtig');
      else if (k.dataset.sted === id) k.classList.add('forkert');
    }
    const navne = rigtige.map(r => STEDER[r].navn.toLowerCase());
    quizsvar.className = `kort quizsvar ${ok ? 'rigtigt' : 'forkert'}`;
    const link = el('a', 'Se stenen i samlingen →');
    link.href = stenlink(post.id);
    quizsvar.replaceChildren(el('h3', ok ? 'Rigtigt!' : `Ikke helt – ${post.navn.toLowerCase()} dannes ${navne.length > 1 ? 'fx ' : ''}ved: ${navne.join(' og ')}.`),
      el('p', post.dannelse), link);
    quizsvar.hidden = false;
    quizpoint.textContent = `Sten ${nr + 1} af ${runde.length} · ${point} rigtige`;
    quiznaeste.hidden = false;
    quiznaeste.textContent = nr + 1 < runde.length ? 'Næste sten →' : `Færdig: ${point} af ${runde.length} – ny runde ↻`;
    quiznaeste.focus({ preventScroll: true });
  }
  quiznaeste.onclick = () => { if (nr + 1 < runde.length) { nr++; visSten(); } else nyRunde(); };

  const valg = [...rodDel.querySelectorAll('[data-tilstand]')];
  function skiftTilstand(ny) {
    tilstand = ny;
    for (const v of valg) { v.setAttribute('aria-checked', String(v.dataset.tilstand === ny)); v.tabIndex = v.dataset.tilstand === ny ? 0 : -1; }
    stedkort.hidden = ny === 'quiz'; quiz.hidden = ny !== 'quiz';
    if (ny === 'quiz') nyRunde();
    else { for (const k of knapper) k.classList.remove('rigtig', 'forkert'); vaelg(valgt || 'ryg'); }
  }
  for (const v of valg) {
    v.onclick = () => skiftTilstand(v.dataset.tilstand);
    v.onkeydown = e => {
      const i = valg.indexOf(v), ny = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (ny === undefined) return;
      e.preventDefault();
      const n = valg[(i + ny + valg.length) % valg.length];
      n.focus(); skiftTilstand(n.dataset.tilstand);
    };
  }
  const tempKnap = rodDel.querySelector('#temperatur'), bevKnap = rodDel.querySelector('#bevaegelse');
  tempKnap.onclick = () => {
    const til = tempKnap.getAttribute('aria-pressed') !== 'true';
    tempKnap.setAttribute('aria-pressed', String(til));
    temp.toggleAttribute('hidden', !til);
  };
  bevKnap.onclick = () => {
    const til = bevKnap.getAttribute('aria-pressed') !== 'true';
    bevKnap.setAttribute('aria-pressed', String(til));
    bevaegelse.toggleAttribute('hidden', !til);
  };
  skiftTilstand('udforsk');
  return {
    vis() { requestAnimationFrame(placer); },
    skjul() {},
    visSted(id) { if (tilstand !== 'udforsk') skiftTilstand('udforsk'); vaelg(id); knapper.find(k => k.dataset.sted === id)?.focus({ preventScroll: true }); }
  };
}
