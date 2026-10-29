import {beregn} from './model.js';
const $ = id => document.getElementById(id);
const reduceret = matchMedia('(prefers-reduced-motion: reduce)');
const trinKnapper = [...document.querySelectorAll('[data-trin]')];
const beskrivelser = [
  ['1 · Samme temperatur, samme tryk', 'De to søjler indeholder lige meget luft. Trykket er ens ved jorden og ens i 3.000 meters højde.'],
  ['2 · Luften udvider sig — trykket i højden stiger', 'Den varme søjle bliver højere, og luftpakkerne får større afstand. Mere luft ligger nu over 3.000 m: trykket her bliver højere end i den kølige søjle. Bundtrykket er stadig ens, fordi ingen luftmasse er fjernet.'],
  ['3 · Luft strømmer ud i højden — bundtrykket falder', 'Trykforskellen i højden driver luft fra den varme mod den kølige søjle. Den varme søjle mister masse: dens tryk ved jorden falder. Den kølige søjle får mere masse og højere bundtryk.'],
  ['4 · Lavtryk ved jorden, højere tryk i højden', 'Ved jorden strømmer luften ind mod den varme søjles lavtryk. I højden strømmer den ud. Fortsat opvarmning kan holde kredsløbet i gang, mens ind- og udstrømning balancerer.']
];
let trin = 0, varme = 0, masse = 0, afspil = false, tidITrin = 0, fase = 0, sidst = null;
const y = z => 330 - z * (310 / 5500);
const svg = navn => document.createElementNS('http://www.w3.org/2000/svg', navn);
// Samme udvalgte luftpakker følges under udvidelsen. Ikke et molekyletælleskema.
const pakker = [];
for (const side of [0, 1]) {
  for (let raekke = 0; raekke < 8; raekke++) {
    for (let kolonne = 0; kolonne < 5; kolonne++) {
      const cirkel = svg('circle');
      cirkel.setAttribute('r', '4');
      cirkel.setAttribute('fill', side ? '#9e4926' : '#326d84');
      cirkel.setAttribute('cx', (side ? 524 : 124) + kolonne * 38);
      $('luftpakker').append(cirkel);
      pakker.push({cirkel, side, z: 180 + raekke * 500});
    }
  }
}
const vind = ['ud', 'ind'].map(id => {
  const sti = $(id), laengde = sti.getTotalLength();
  const prikker = Array.from({length: 4}, (_, i) => {
    const cirkel = svg('circle'); cirkel.setAttribute('r', '4');
    cirkel.setAttribute('fill', id === 'ud' ? '#a74926' : '#2a6c8b');
    $('vindprikker').append(cirkel); return {cirkel, start: i / 4};
  });
  return {id, sti, laengde, prikker};
});
const tal = n => n.toLocaleString('da-DK', {minimumFractionDigits: 1, maximumFractionDigits: 1});
function maal(id, vaerdi, forskel) {
  const el = $(id);
  // Bogstav og tekst gør retningen tydelig også uden farvesyn.
  const relativ = Math.abs(forskel) < .05 ? 'ens' : forskel > 0 ? 'H · højere' : 'L · lavere';
  el.textContent = `${tal(vaerdi)} hPa · ${relativ}`;
  el.className = Math.abs(forskel) < .05 ? '' : forskel > 0 ? 'hoejtryk' : 'lavtryk';
}
function tegn() {
  const m = beregn(varme, masse);
  const maalvarme = Number($('varme').value) / 100;
  $('varmetal').textContent = `${$('varme').value} %`;
  $('varme').setAttribute('aria-valuetext', `${$('varme').value} procent opvarmning`);
  $('kold-temp').textContent = '15 °C';
  $('varm-temp').textContent = `${tal(m.varmT - 273.15)} °C`;
  const top = y(m.laghoejde);
  $('varmt-lag').setAttribute('y', top); $('varmt-lag').setAttribute('height', 330 - top);
  $('lagtop').setAttribute('d', `M500 ${top}H700`);
  $('udvidelse').setAttribute('d', `M725 ${y(4000)}V${top}`);
  $('udvidelse').style.opacity = varme > .02 ? 1 : 0;
  $('jordvarme').style.opacity = trin > 0 ? maalvarme : 0;
  $('laglabel').textContent = varme > .015 ? `Luftlaget er ${Math.round(m.laghoejde - 4000)} m højere` : 'Markeret luftlag · før opvarmning';
  for (const {cirkel, side, z} of pakker) {
    cirkel.setAttribute('cy', y(z * (side ? m.varmT / m.koldT : 1)));
  }
  maal('kold-top', m.koldTop, m.koldTop - m.varmTop);
  maal('varm-top', m.varmTop, m.varmTop - m.koldTop);
  maal('kold-bund', m.koldBund, m.koldBund - m.varmBund);
  maal('varm-bund', m.varmBund, m.varmBund - m.koldBund);
  for (const {id, sti, laengde, prikker} of vind) {
    const aktiv = maalvarme > 0 && (id === 'ud' ? trin >= 2 : trin === 3);
    sti.style.opacity = aktiv ? 1 : 0;
    $(id + 'tekst').hidden = !aktiv;
    for (const {cirkel, start} of prikker) {
      const p = sti.getPointAtLength(((fase + start) % 1) * laengde);
      cirkel.setAttribute('cx', p.x); cirkel.setAttribute('cy', p.y);
      cirkel.style.opacity = aktiv ? 1 : 0;
    }
  }
  $('afspil').textContent = afspil ? 'Pause' : trin === 3 ? 'Afspil igen' : 'Afspil forløbet';
  $('afspil').setAttribute('aria-pressed', String(afspil));
  $('naeste').disabled = trin === 3;
}
function vaelgTrin(n) {
  trin = n; tidITrin = 0;
  for (const knap of trinKnapper) knap.setAttribute('aria-pressed', String(Number(knap.dataset.trin) === trin));
  $('trin-titel').textContent = beskrivelser[trin][0];
  $('figurtekst').textContent = Number($('varme').value) === 0 && trin > 0 ? 'Opvarmningen er 0 %. Søjlerne forbliver ens, så der opstår ingen trykforskel eller vind. Skru op for varmen.' : beskrivelser[trin][1];
  // Manuelle trin er stillbilleder, så sammenhængen kan undersøges i ro.
  varme = trin > 0 ? Number($('varme').value) / 100 : 0;
  masse = trin >= 2 ? Number($('varme').value) / 100 : 0;
  tegn();
}
function billede(tid) {
  const dt = sidst === null ? 0 : Math.min((tid - sidst) / 1000, .1); sidst = tid;
  if (afspil) {
    tidITrin += dt;
    const q = Math.min(tidITrin / 3, 1);
    const glat = reduceret.matches ? 1 : q * q * (3 - 2 * q), styrke = Number($('varme').value) / 100;
    varme = trin === 0 ? 0 : trin === 1 ? glat * styrke : styrke;
    masse = trin < 2 ? 0 : trin === 2 ? glat * styrke : styrke;
    if (!reduceret.matches) fase += dt * .23;
    if (tidITrin >= 5) {
      if (trin === 3) afspil = false;
      else {
        const naeste = trin + 1; vaelgTrin(naeste);
        // Næste trin starter, hvor det forrige sluttede.
        if (naeste === 1) varme = 0;
        if (naeste === 2) masse = 0;
      }
    }
    tegn();
  }
  requestAnimationFrame(billede);
}
trinKnapper.forEach(knap => knap.addEventListener('click', () => { afspil = false; vaelgTrin(Number(knap.dataset.trin)); }));
$('varme').addEventListener('input', () => { afspil = false; vaelgTrin(trin); });
$('naeste').addEventListener('click', () => { afspil = false; vaelgTrin(Math.min(3, trin + 1)); });
$('afspil').addEventListener('click', () => {
  if (afspil) { afspil = false; tegn(); return; }
  // Afspilning begynder altid fra udgangspunktet; pause kan genoptages.
  if (trin === 0 || trin === 3) { vaelgTrin(1); varme = 0; }
  afspil = true; tegn();
});
$('nulstil').addEventListener('click', () => { afspil = false; fase = 0; vaelgTrin(0); });
$('fokus').addEventListener('click', () => {
  const fokus = document.body.classList.toggle('fokus');
  $('fokus').setAttribute('aria-pressed', String(fokus)); $('fokus').textContent = fokus ? 'Afslut fokus' : 'Fokus';
});
document.addEventListener('visibilitychange', () => { sidst = null; });
vaelgTrin(0); requestAnimationFrame(billede);
