import {beregn, trykIHoejde, hoejdeAfTryk, grundtemperatur} from './model.js';
const $ = id => document.getElementById(id);
const reduceret = matchMedia('(prefers-reduced-motion: reduce)');
const figur = $('figur'), tegning = $('tegning');
const trinKnapper = [...document.querySelectorAll('[data-trin]')];
const trinTekster = [
  ['Tre ens luftsøjler', 'Søjlerne har samme temperatur og lige meget luft. Trykfladerne ligger vandret, så trykket er ens i alle højder.'],
  ['Luften udvider sig', 'Jorden varmer den midterste søjle, og luften udvider sig. Trykfladerne løftes – mest højt oppe. I 5 km er der nu mere luft over den varme søjle: højere tryk. Ved jorden er trykket uændret, for ingen luft er fjernet.'],
  ['Luften strømmer ud i højden', 'I højden strømmer luften fra det højere tryk ud mod de kølige søjler. Den varme søjle mister luft, så trykket ved jorden falder. Nabosøjlerne får mere luft og højere bundtryk.'],
  ['Et termisk lavtryk', 'Ved jorden blæser vinden ind mod lavtrykket. Luften stiger op i den varme søjle, strømmer ud i højden og synker over de kølige sider. Så længe solen varmer, holdes cirkulationen i gang.']
];
// Mål for hvert trin: opvarmning, masseoverførsel, udstrømning i højden, hele kredsløbet.
const maal = [[0, 0, 0, 0], [1, 0, 0, 0], [1, 1, 1, 0], [1, 1, 1, 1]];
const trykflader = [900, 800, 700, 600, 500];
const zMaks = 6900, zRef = 5000;
let trin = 0, nu = [0, 0, 0, 0], fra = [0, 0, 0, 0], skiftTid = 0, afspiller = false, holdTil = 0, bevaegTil = 0, fase = 0, sidst = null;

const tal = n => Math.round(n).toLocaleString('da-DK');
const bland = (a, b, t) => '#' + [0, 2, 4].map(i => Math.round(parseInt(a.substr(i + 1, 2), 16) * (1 - t) + parseInt(b.substr(i + 1, 2), 16) * t).toString(16).padStart(2, '0')).join('');
const temp = T => (T - 273.15).toLocaleString('da-DK', {maximumFractionDigits: 0});

function tegn() {
  const W = figur.clientWidth, H = figur.clientHeight;
  if (!W || !H) return;
  const smal = W < 560;
  const mL = smal ? 8 : 62, mR = smal ? 8 : 44, top = 50, bund = H - 38;
  const gab = Math.max(14, (W - mL - mR) * .035), sW = (W - mL - mR - 2 * gab) / 3;
  const x0 = i => mL + i * (sW + gab), cx = i => x0(i) + sW / 2;
  const y = z => bund - z / zMaks * (bund - top);
  const [v, m, ud, kreds] = nu;
  const s = beregn(v, m);
  const sojler = [[s.koldBund, s.koldT], [s.varmBund, s.varmT], [s.koldBund, s.koldT]];
  const varmFarve = bland('#cfe2ea', '#f4c38f', v);
  const o = [];

  o.push(`<defs>
    <linearGradient id="kold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cfe2ea" stop-opacity="0"/><stop offset=".25" stop-color="#cfe2ea"/></linearGradient>
    <linearGradient id="varm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${varmFarve}" stop-opacity="0"/><stop offset=".25" stop-color="${varmFarve}"/></linearGradient>
    <marker id="spids" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="4.2" markerHeight="4.2" orient="auto"><path d="M0 0 10 5 0 10z" fill="context-stroke"/></marker>
  </defs>`);

  // Søjlerne og deres temperatur.
  for (let i = 0; i < 3; i++) {
    const varm = i === 1;
    o.push(`<rect x="${x0(i)}" y="${top - 18}" width="${sW}" height="${bund - top + 18}" fill="url(#${varm ? 'varm' : 'kold'})"/>`);
    const navn = varm ? (v > .02 ? 'Opvarmet luft' : 'Luft') : 'Kølig luft';
    o.push(`<text x="${cx(i)}" y="20" text-anchor="middle" font-family="Archivo,sans-serif" font-weight="700" font-size="${smal ? 12 : 14}" fill="${varm && v > .02 ? '#9a4520' : '#172b2b'}">${navn}</text>`);
    o.push(`<text x="${cx(i)}" y="37" text-anchor="middle" font-size="${smal ? 11 : 12}" fill="#4f6667">${temp(sojler[i][1])} °C</text>`);
  }

  // Varmeflimmer over den solopvarmede jord.
  if (v > .01) {
    const bolge = (reduceret.matches ? 0 : fase * 40) % 24;
    for (let k = 0; k < 3; k++) {
      const x = cx(1) + (k - 1) * sW * .22, y1 = bund - 8 - bolge, y2 = y1 - 30;
      o.push(`<path d="M${x} ${y1} q6 -7.5 0 -15 t0 -15" fill="none" stroke="#c4622e" stroke-width="2" stroke-linecap="round" opacity="${(.55 * v * (1 - bolge / 30)).toFixed(2)}"/>`);
    }
  }

  // Trykflader: vandrette i hver søjle, bløde overgange mellem søjlerne.
  trykflader.forEach((p, n) => {
    const yy = sojler.map(([pb, T]) => y(hoejdeAfTryk(p, pb, T)));
    let d = `M${mL} ${yy[0]}`;
    for (let i = 0; i < 2; i++) {
      const a = x0(i) + sW - gab * .6, b = x0(i + 1) + gab * .6, k = (b - a) / 2;
      d += ` H${a} C${a + k} ${yy[i]} ${b - k} ${yy[i + 1]} ${b} ${yy[i + 1]}`;
    }
    d += ` H${W - mR}`;
    o.push(`<path d="${d}" fill="none" stroke="#172b2b" stroke-opacity=".55" stroke-width="1.4"/>`);
    o.push(smal
      ? `<text x="${mL + 3}" y="${yy[0] - 4}" font-size="9.5" fill="#4f6667">${p} hPa</text>`
      : `<text x="${mL - 8}" y="${yy[0] + 4}" text-anchor="end" font-size="11" fill="#4f6667">${p} hPa</text>`);
    // Hvor meget den øverste flade er løftet over den varme søjle.
    if (n === trykflader.length - 1 && v > .05) {
      const dz = hoejdeAfTryk(p, s.varmBund, s.varmT) - hoejdeAfTryk(p, s.koldBund, s.koldT);
      o.push(`<text x="${cx(1)}" y="${yy[1] - 7}" text-anchor="middle" font-size="${smal ? 10 : 11.5}" font-weight="600" fill="#9a4520" opacity="${Math.min(1, v * 2)}">↑ ${tal(dz)} m</text>`);
    }
  });

  // Strømning: udstrømning i højden (trin 3) og hele kredsløbet (trin 4).
  const yUd = y(zRef) - Math.min(30, (bund - top) * .07), yInd = bund - 16;
  const pil = (d, farve, synlig) => synlig > .01 && o.push(`<path d="${d}" fill="none" stroke="${farve}" stroke-width="${smal ? 2.4 : 3}" stroke-linecap="round" stroke-dasharray="1 7" stroke-dashoffset="${(-fase * 30).toFixed(1)}" marker-end="url(#spids)" opacity="${synlig.toFixed(2)}"/>`);
  for (const r of [-1, 1]) {
    const side = r < 0 ? 0 : 2, xs = cx(side) - r * sW * .12, xm = cx(1) + r * sW * .2, luft = 12;
    pil(`M${xm + r * luft} ${yUd}H${xs - r * luft}`, '#b5502d', ud);
    pil(`M${xs} ${yUd + luft}V${yInd - luft}`, '#2a6c8b', kreds);
    pil(`M${xs - r * luft} ${yInd}H${xm + r * luft}`, '#2a6c8b', kreds);
    pil(`M${xm} ${yInd - luft}V${yUd + luft}`, '#b5502d', kreds);
  }

  // 5 km-linjen og jorden.
  o.push(`<path d="M${mL} ${y(zRef)}H${W - mR}" stroke="#0e86c8" stroke-width="1.6" stroke-dasharray="6 5"/>`);
  o.push(smal
    ? `<text x="${W - mR - 3}" y="${y(zRef) - 16}" text-anchor="end" font-size="9.5" fill="#0b6c9f" font-weight="600">5 km</text>`
    : `<text x="${W - mR + 6}" y="${y(zRef) + 4}" font-size="11" fill="#0b6c9f" font-weight="600">5 km</text>`);
  o.push(`<rect x="0" y="${bund}" width="${W}" height="${H - bund}" fill="#ddd3b4"/>`);
  o.push(`<rect x="${x0(1)}" y="${bund}" width="${sW}" height="${H - bund}" fill="${bland('#ddd3b4', '#eaa56d', v)}"/>`);
  o.push(`<path d="M0 ${bund}H${W}" stroke="#172b2b" stroke-width="2"/>`);

  // Tryk i samme højde: H og L er relative til nabosøjlerne.
  const maerke = (i, p, nabo, yy) => {
    const f = p - nabo, bogstav = Math.abs(f) < .5 ? '' : f > 0 ? 'H' : 'L';
    const tekst = `${tal(p)} hPa`, b = tekst.length * (smal ? 6 : 6.8) + (bogstav ? (smal ? 20 : 24) : 0) + 14;
    const farve = bogstav === 'H' ? '#9a3a1d' : bogstav === 'L' ? '#16597a' : '#172b2b';
    o.push(`<g transform="translate(${cx(i)} ${yy})">
      <rect x="${-b / 2}" y="-12" width="${b}" height="24" rx="12" fill="#fff9ee" stroke="${farve}" stroke-width="${bogstav ? 1.6 : 1}" stroke-opacity="${bogstav ? 1 : .4}"/>
      ${bogstav ? `<text x="${-b / 2 + 9}" y="5.5" font-family="Archivo,sans-serif" font-weight="800" font-size="${smal ? 15 : 17}" fill="${farve}">${bogstav}</text>` : ''}
      <text x="${bogstav ? b / 2 - 8 : 0}" y="4" text-anchor="${bogstav ? 'end' : 'middle'}" font-size="${smal ? 10 : 11.5}" fill="#172b2b">${tekst}</text></g>`);
  };
  const ref = sojler.map(([pb, T]) => trykIHoejde(pb, T, zRef));
  for (let i = 0; i < 3; i++) {
    maerke(i, ref[i], ref[i === 1 ? 0 : 1], y(zRef));
    maerke(i, sojler[i][0], sojler[i === 1 ? 0 : 1][0], bund + (H - bund) / 2);
  }
  tegning.setAttribute('viewBox', `0 0 ${W} ${H}`);
  tegning.innerHTML = o.join('');
}

function beskrivTryk() {
  // Sluttilstanden for trinnet, så skærmlæseren ikke får mellemværdier.
  const [v, m] = maal[trin], s = beregn(v, m);
  const top = [trykIHoejde(s.koldBund, s.koldT, zRef), trykIHoejde(s.varmBund, s.varmT, zRef)];
  $('trykliste').textContent = `Midtersøjlen ${temp(s.varmT)} °C, siderne ${temp(grundtemperatur)} °C. ` +
    `I 5 km: siderne ${tal(top[0])} hPa, midten ${tal(top[1])} hPa. Ved jorden: siderne ${tal(s.koldBund)} hPa, midten ${tal(s.varmBund)} hPa.`;
}

function vaelgTrin(n, {fraAfspil = false} = {}) {
  trin = n;
  trinKnapper.forEach(k => k.setAttribute('aria-pressed', String(Number(k.dataset.trin) === trin)));
  $('trin-titel').textContent = `${trin + 1} · ${trinTekster[trin][0]}`;
  $('trin-tekst').textContent = trinTekster[trin][1];
  $('naeste').disabled = trin === 3;
  if (!fraAfspil) afspiller = false;
  bevaegTil = performance.now() + 9000;
  holdTil = performance.now() + 6500;
  fra = [...nu]; skiftTid = performance.now();
  if (reduceret.matches) nu = [...maal[trin]];
  beskrivTryk(); opdaterAfspil(); tegn();
}
function opdaterAfspil() {
  $('afspil').innerHTML = afspiller ? '<span aria-hidden="true">❚❚</span> Pause' : '<span aria-hidden="true">▶</span> ' + (trin === 3 ? 'Afspil igen' : 'Afspil');
  $('afspil').setAttribute('aria-pressed', String(afspiller));
}

function billede(tid) {
  const dt = sidst === null ? 0 : Math.min((tid - sidst) / 1000, .1); sidst = tid;
  let aendret = false;
  // Blød overgang mod trinnets mål over 1,8 s.
  const q = reduceret.matches ? 1 : Math.min(1, (tid - skiftTid) / 1800), glat = q * q * (3 - 2 * q);
  const ny = maal[trin].map((b, i) => fra[i] + (b - fra[i]) * glat);
  if (ny.some((b, i) => b !== nu[i])) { nu = ny; aendret = true; }
  const fart = reduceret.matches ? 0 : Math.min(1, Math.max(0, (bevaegTil - tid) / 1500));
  if (fart > 0 && (nu[0] > .01 || nu[2] > .01)) { fase += dt * fart * .9; aendret = true; }
  if (afspiller) {
    bevaegTil = tid + 9000;
    if (tid > holdTil) {
      if (trin < 3) vaelgTrin(trin + 1, {fraAfspil: true});
      else { afspiller = false; opdaterAfspil(); }
    }
  }
  if (aendret) tegn();
  requestAnimationFrame(billede);
}

trinKnapper.forEach(k => k.addEventListener('click', () => vaelgTrin(Number(k.dataset.trin))));
document.querySelector('.trin').addEventListener('keydown', e => {
  const ny = {ArrowRight: trin + 1, ArrowDown: trin + 1, ArrowLeft: trin - 1, ArrowUp: trin - 1, Home: 0, End: 3}[e.key];
  if (ny === undefined) return;
  e.preventDefault();
  vaelgTrin(Math.max(0, Math.min(3, ny)));
  trinKnapper[trin].focus();
});
$('naeste').addEventListener('click', () => vaelgTrin(Math.min(3, trin + 1)));
$('afspil').addEventListener('click', () => {
  if (afspiller) { afspiller = false; opdaterAfspil(); return; }
  vaelgTrin(trin === 3 ? 0 : trin, {fraAfspil: true});
  if (trin === 0) nu = fra = [0, 0, 0, 0];
  afspiller = true; holdTil = performance.now() + (trin === 0 ? 2500 : 6500); opdaterAfspil();
});
$('fokus').addEventListener('click', () => {
  const fokus = document.body.classList.toggle('fokus');
  $('fokus').setAttribute('aria-pressed', String(fokus));
  $('fokus').textContent = fokus ? 'Afslut fokus' : 'Fokus';
});
new ResizeObserver(tegn).observe(figur);
document.addEventListener('visibilitychange', () => { sidst = null; });
vaelgTrin(0); requestAnimationFrame(billede);
