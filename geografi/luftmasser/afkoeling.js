// Fanen «Adiabatisk afkøling»: pakken løftes, så kun afkølingen er i fokus.
import { LUFT, PAKKE, TOP, tilstand, skybase, pakketemperatur, uden_kondensation, latentVarme } from './model.mjs';
const $ = id => document.getElementById(id);
const tal = (v, n = 1) => v.toLocaleString('da-DK', { minimumFractionDigits:n, maximumFractionDigits:n });
const saet = (id, t) => { if ($(id).textContent !== t) $(id).textContent = t; };
const TMIN = -20, TMAX = 28, FART = 250; // m pr. sekund på skærmen
const reduceret = matchMedia('(prefers-reduced-motion: reduce)');
const skyder = $('a-hoejde');
let luft = 'toer', z = 0, retning = 1, afspiller = false, frame, sidst = null;

function forklaring() {
  const base = skybase(luft), paaBase = Math.abs(z - base) < .5;
  if (z === 0) return ['Pakken ved jorden', `Pakken er ${tal(PAKKE, 0)} °C og umættet. Løft den, og følg, hvordan temperaturen falder.`];
  if (paaBase) return [`Dugpunktet er nået ved ${tal(base, 0)} m`, 'Temperatur og dugpunkt er ens, så luften er mættet (RF 100 %). Nu begynder vanddamp at kondensere til skydråber.'];
  if (retning < 0 && afspiller) return z > base
    ? ['Fugtadiabatisk opvarmning: 0,5 °C pr. 100 m', 'Trykket stiger, og pakken presses sammen og varmes. Skydråber fordamper og optager varme, så opvarmningen er langsom.']
    : ['Tøradiabatisk opvarmning: 1,0 °C pr. 100 m', 'Trykket stiger, og pakken presses sammen og varmes. Dråberne er væk, og luften er igen umættet.'];
  return z > base
    ? ['Fugtadiabatisk afkøling: 0,5 °C pr. 100 m', 'Pakken udvider sig stadig og bliver koldere. Men kondensationen frigiver latent varme, som opvejer en del af afkølingen.']
    : ['Tøradiabatisk afkøling: 1,0 °C pr. 100 m', 'Trykket falder, og pakken udvider sig. Arbejdet tager energi fra luften, så temperaturen falder uden varmeudveksling med omgivelserne. RF stiger, fordi koldere luft kan indeholde mindre vanddamp.'];
}
function regnskab() {
  const base = skybase(luft), toer = Math.min(z, base), fugtig = Math.max(0, z - base), fald = PAKKE - pakketemperatur(luft, z);
  if (z === 0) return ['Afkølet 0,0 °C', 'Regnskabet fyldes op, når pakken løftes.'];
  const linjer = [`Umættet: ${tal(toer, 0)} m × 1,0 °C/100 m = ${tal(toer * .01)} °C.`];
  if (fugtig > 0) linjer.push(`Mættet: ${tal(fugtig, 0)} m × 0,5 °C/100 m = ${tal(fugtig * .005)} °C.`, `Latent varme har sparet pakken for ${tal(latentVarme(luft, z))} °C.`);
  return [`Afkølet ${tal(fald)} °C på ${tal(z, 0)} m`, linjer.join(' ')];
}
function knap() {
  $('a-afspil').textContent = afspiller ? '❚❚ Pause' : z >= TOP ? '↓ Lad pakken synke' : z === 0 ? '▶ Løft pakken' : '▶ Løft videre';
  $('a-afspil').setAttribute('aria-pressed', String(afspiller));
}
function tegnGraf(s, y, g, text) {
  const tx = t => g.x + (t - TMIN) / (TMAX - TMIN) * g.b, base = skybase(luft);
  const linje = (fra, til, f) => Array.from({ length: 31 }, (_, i) => { const h = fra + i * (til - fra) / 30; return `${tx(f(h))},${y(h)}`; }).join(' ');
  const akse = [-20, -10, 0, 10, 20].map(t => `<path d="M${tx(t)} ${y(TOP)}V${y(0)}" stroke="#476d7f" opacity="${t ? .13 : .3}"/>${text(tx(t), y(0) + 15, `${t}`, 'akse', 'middle')}`).join('');
  // Feltet mellem kurverne er den varme, kondensationen har frigivet.
  const felt = z > base ? `<polygon points="${linje(base, z, uden_kondensation)} ${linje(z, base, h => pakketemperatur(luft, h))}" fill="#e58a3c" opacity=".3"/>` : '';
  const dug = h => tilstand('stabil', luft, h).dugpunkt, px = tx(s.temperatur);
  const skilt = (t, tekst, h, kort) => {
    const plads = g.x + g.b - tx(t) - 9, valg = tekst.length * 6.1 < plads ? tekst : kort.length * 6.1 < plads ? kort : '';
    return valg ? text(tx(t) + 7, y(h) + 4, valg, 'haeldning') : '';
  };
  // Den frigivne varme aflæses vandret mellem den prikkede kurve og pakken.
  const venstre = tx(uden_kondensation(z)) - g.x - 6, varme = latentVarme(luft, z), lang = `+${tal(varme)} °C latent varme`, kort = `+${tal(varme)} °C`;
  const varmetekst = z > base + 100 ? text(tx(uden_kondensation(z)) - 5, y(z) + 4, lang.length * 5.6 < venstre ? lang : kort, 'haeldning halo', 'end') : '';
  return `<rect x="${g.x}" y="${y(TOP)}" width="${g.b}" height="${y(0) - y(TOP)}" fill="#fffdf6" opacity=".82"/>
  ${akse}${felt}
  <path d="M${g.x} ${y(base)}H${g.x + g.b}" stroke="#608c99" stroke-dasharray="5 5"/>
  <polyline points="${linje(base, TOP, uden_kondensation)}" fill="none" stroke="#6b7c7c" stroke-width="1.4" stroke-dasharray="2 4"/>
  <polyline points="${linje(0, base, dug)}" fill="none" stroke="#197e9c" stroke-width="2"/>
  <polyline points="${linje(0, TOP, h => pakketemperatur(luft, h))}" fill="none" stroke="#b85b29" stroke-width="1.5" stroke-dasharray="5 4"/>
  ${z > 0 ? `<polyline points="${linje(0, z, h => pakketemperatur(luft, h))}" fill="none" stroke="#b85b29" stroke-width="3.4"/>` : ''}
  ${skilt(pakketemperatur(luft, base / 2), '1,0 °C/100 m', base / 2, '1,0/100 m')}
  ${skilt(pakketemperatur(luft, (base + TOP) / 2), '0,5 °C/100 m', (base + TOP) / 2, '0,5/100 m')}
  <path d="M${g.xStart} ${y(z)}H${px}" stroke="#7796a0" stroke-dasharray="2 4" opacity=".9"/>
  ${s.maettet ? '' : `<circle cx="${tx(s.dugpunkt)}" cy="${y(z)}" r="4.5" fill="#197e9c"/>${text(tx(s.dugpunkt) - 7, y(z) - 7, `${tal(s.dugpunkt)}°`, 'grafvaerdi dugfarve', 'end')}`}
  <circle cx="${px}" cy="${y(z)}" r="5.5" fill="#b85b29" stroke="#fffdf6" stroke-width="1.5"/>
  ${text(px + 8, y(z) - 8, `${tal(s.temperatur)}°`, 'grafvaerdi pakkefarve')}
  ${varmetekst}
  ${text(g.x, 26, 'Temperatur · °C', 'lille')}
  <g id="signatur"><rect x="${g.x + 4}" y="${y(0) - 53}" width="92" height="49" rx="4" fill="#fffdf6" stroke="#172b2b" stroke-opacity=".25"/>
  <path d="M${g.x + 10} ${y(0) - 42}h17" stroke="#b85b29" stroke-width="3.4"/>${text(g.x + 32, y(0) - 38, 'Temperatur', 'forklaring')}
  <path d="M${g.x + 10} ${y(0) - 28}h17" stroke="#197e9c" stroke-width="2"/>${text(g.x + 32, y(0) - 24, 'Dugpunkt', 'forklaring')}
  <path d="M${g.x + 10} ${y(0) - 14}h17" stroke="#6b7c7c" stroke-width="1.4" stroke-dasharray="2 4"/>${text(g.x + 32, y(0) - 10, 'Uden sky', 'forklaring')}</g>`;
}
function tegn() {
  const figur = $('figur'), svg = $('landskab'), s = tilstand('stabil', luft, z), w = figur.clientWidth, h = figur.clientHeight;
  if (!w || !h) return;
  const smal = w < 560, top = 60, bund = h - 74, base = skybase(luft);
  const y = hoejde => bund - hoejde / TOP * (bund - top);
  const delX = Math.round(w * (smal ? .47 : .53)), x = 46 + (delX - 46) * .5;
  const r0 = 40, r = r0 * Math.cbrt(s.volumen), cy = y(z) - 14;
  const text = (xx, yy, t, cls = '', anchor = 'start') => `<text x="${xx}" y="${yy}" class="${cls}" text-anchor="${anchor}">${t}</text>`;
  const g = { x: delX + 8, b: w - delX - 22, xStart: x + r + 3 };

  saet('a-hoejde-tal', `${tal(z, 0)} m`);
  skyder.value = z;
  skyder.setAttribute('aria-valuetext', `${tal(z, 0)} meter. Pakken ${tal(s.temperatur)} grader, dugpunkt ${tal(s.dugpunkt)} grader, relativ luftfugtighed ${tal(s.fugtighed, 0)} procent.`);
  const [titel, tekst] = forklaring(), [maal, regn] = regnskab();
  saet('a-titel', titel); saet('a-tekst', tekst); saet('a-maal-titel', maal); saet('a-maal-tekst', regn);
  saet('figurtekst', `${LUFT[luft].navn}, ${tal(z, 0)} m. Temperatur ${tal(s.temperatur)} °C, dugpunkt ${tal(s.dugpunkt)} °C, relativ luftfugtighed ${tal(s.fugtighed, 0)} %. ${titel}.`);

  // Luftmolekyler spredes med volumen; vanddamp bliver til dråber over skybasen.
  const prik = (i, n, f = .86) => { const a = i * 2.39996, d = Math.sqrt((i + .5) / n) * r * f; return [x + Math.cos(a) * d, cy + Math.sin(a) * d]; };
  const friFelt = (a, b) => Math.abs(a - x) > 27 || Math.abs(b - cy - 2) > 18;
  const luftprikker = Array.from({ length: 34 }, (_, i) => { const [a, b] = prik(i, 34); return !friFelt(a, b) ? '' : `<circle cx="${a}" cy="${b}" r="1.5" fill="#55686a" opacity=".5"/>`; }).join('');
  const andel = s.maettet ? Math.min(1, .15 + (z - base) / Math.max(1, TOP - base)) : 0;
  const vand = Array.from({ length: 12 }, (_, i) => { const [a, b] = prik(i * 3 + 1, 36); const draabe = i < andel * 12;
    if (!friFelt(a, b)) return '';
    return draabe ? `<circle cx="${a}" cy="${b}" r="3.6" fill="#fff" stroke="#197e9c" stroke-width="1.3"/>` : `<circle cx="${a}" cy="${b}" r="1.9" fill="#197e9c"/>`; }).join('');
  const ticks = [0, 1000, 2000, 3000].map(v => `<path d="M46 ${y(v)}H${delX}" stroke="#476d7f" opacity=".2"/>${text(40, y(v) + 4, v ? tal(v, 0) : '0', 'akse', 'end')}`).join('');
  const sidetekst = delX - x - r - 10;
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  svg.innerHTML = `<defs>
    <linearGradient id="himmel" x2="0" y2="1"><stop stop-color="#b7d4e2"/><stop offset="1" stop-color="#f3f4e9"/></linearGradient>
    <radialGradient id="pakke" cx="30%" cy="25%" r="80%"><stop stop-color="#fffef3" stop-opacity=".97"/><stop offset=".55" stop-color="${s.maettet ? '#eaf5fa' : '#f9dca8'}" stop-opacity=".92"/><stop offset="1" stop-color="${s.maettet ? '#8db9cf' : '#d9a765'}" stop-opacity=".97"/></radialGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#himmel)"/>
  ${text(10, 26, 'Højde · m', 'lille')}${ticks}
  <path d="M46 ${y(base)}H${delX}" stroke="#608c99" stroke-dasharray="5 5"/>
  <path d="M0 ${bund + 8}Q${delX * .4} ${bund + 3} ${delX * .75} ${bund + 7}T${w} ${bund + 8}V${h}H0Z" fill="#97ae93"/>
  <path d="M0 ${bund + 22}Q${w * .3} ${bund + 14} ${w * .6} ${bund + 24}T${w} ${bund + 18}V${h}H0Z" fill="#6f8f78"/>
  ${tegnGraf(s, y, g, text)}
  <circle cx="${x}" cy="${cy}" r="${r}" fill="url(#pakke)" stroke="#b85b29" stroke-width="1.8"/>
  <circle cx="${x}" cy="${cy}" r="${r0}" fill="none" stroke="#496c7c" stroke-dasharray="3 3" opacity=".6"/>
  ${luftprikker}${vand}
  ${text(x, cy - 1, `${tal(s.temperatur)} °C`, 'pakketal halo', 'middle')}${text(x, cy + 13, `RF ${tal(s.fugtighed, 0)} %`, 'pakkefugt halo', 'middle')}
  ${text(delX - 4, y(base) - 6, s.maettet ? `Skybase ${tal(base, 0)} m` : smal ? `Mættes ${tal(base, 0)} m` : `Dugpunkt nås ved ${tal(base, 0)} m`, 'akse halo', 'end')}
  ${sidetekst > 62 ? text(x + r + 8, cy + 4, retning < 0 && afspiller ? 'presses sammen' : z > 0 ? 'udvider sig' : '', 'akse halo') : ''}
  <rect x="10" y="${h - 36}" width="${w - 20}" height="28" rx="7" fill="#fff9ee" opacity=".95"/>
  ${text(20, h - 17, `${tal(s.tryk, 0)} hPa`, 'maaling')}${text(w * .5, h - 17, `Volumen × ${tal(s.volumen, 2)}`, 'maaling', 'middle')}${text(w - 20, h - 17, `Dugpunkt ${tal(s.dugpunkt)}°`, 'maaling', 'end')}`;
}
function stop() { afspiller = false; cancelAnimationFrame(frame); sidst = null; knap(); }
// Rykker pakken; bremser ved skybasen (på vej op), toppen og jorden, så eleven kan læse.
function frem(meter) {
  const base = skybase(luft);
  const maal = retning > 0 ? (z < base ? base : TOP) : 0;
  z = retning > 0 ? Math.min(maal, z + meter) : Math.max(maal, z - meter);
  if (z === maal) { stop(); if (z === 0) retning = 1; }
  tegn(); knap();
}
function tick(t) {
  if (!afspiller) return;
  if (sidst !== null) frem(Math.min((t - sidst) / 1000, .08) * FART);
  sidst = t;
  if (afspiller) frame = requestAnimationFrame(tick);
}
function spil() {
  if (afspiller) return stop();
  retning = z >= TOP ? -1 : retning < 0 && z > 0 ? -1 : 1;
  if (reduceret.matches) { afspiller = true; frem(TOP); afspiller = false; tegn(); knap(); return; }
  afspiller = true; sidst = null; knap(); tegn(); frame = requestAnimationFrame(tick);
}
function nulstil() { stop(); z = 0; retning = 1; tegn(); knap(); }

const OPGAVER = [
  { q: 'En umættet pakke på 18 °C løftes 400 m. Hvad bliver dens temperatur?', svar: 14, regn: '400 m × 1,0 °C/100 m = 4 °C. 18 − 4 = 14 °C.' },
  { q: 'En mættet pakke er 12 °C ved 1.000 m. Hvad er den ved 1.600 m?', svar: 9, regn: '600 m × 0,5 °C/100 m = 3 °C. 12 − 3 = 9 °C.' },
  { q: 'En pakke er 20 °C ved jorden, og skybasen er ved 800 m. Hvad er den ved 1.800 m?', svar: 7, regn: 'Op til 800 m: 8 °C. Derfra 1.000 m × 0,5 °C/100 m = 5 °C. 20 − 8 − 5 = 7 °C.' },
  { q: 'En umættet pakke på 6 °C synker 700 m. Hvad bliver dens temperatur?', svar: 13, regn: 'Når luft synker, varmes den: 700 m × 1,0 °C/100 m = 7 °C. 6 + 7 = 13 °C.' }
];
function bygOpgaver() {
  $('opgaveliste').innerHTML = OPGAVER.map((o, i) => `<li><form data-opgave="${i}"><label for="svar-${i}">${o.q}</label><span class="svarlinje"><input id="svar-${i}" inputmode="decimal" autocomplete="off"> °C <button>Tjek</button></span><p class="svar" id="svar-tekst-${i}" aria-live="polite"></p></form></li>`).join('');
  $('opgaveliste').addEventListener('submit', e => {
    e.preventDefault();
    const i = +e.target.dataset.opgave, o = OPGAVER[i], felt = $(`svar-${i}`), svar = parseFloat(felt.value.replace(',', '.').replace('−', '-'));
    $(`svar-tekst-${i}`).textContent = Number.isNaN(svar) ? 'Skriv et tal.' : Math.abs(svar - o.svar) < .05 ? `Rigtigt. ${o.regn}` : `Ikke helt. ${o.regn}`;
  });
}
skyder.addEventListener('input', () => { stop(); retning = 1; z = +skyder.value; tegn(); knap(); });
$('a-afspil').addEventListener('click', spil);
$('a-nulstil').addEventListener('click', nulstil);
document.querySelectorAll('[data-aluft]').forEach(b => b.addEventListener('click', () => {
  luft = b.dataset.aluft;
  document.querySelectorAll('[data-aluft]').forEach(k => k.setAttribute('aria-pressed', String(k === b)));
  nulstil();
}));
reduceret.addEventListener('change', stop);
document.addEventListener('visibilitychange', () => { sidst = null; });
bygOpgaver();
export const afkoeling = { tegn, stop, nulstil };
