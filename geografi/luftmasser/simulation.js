import { PROFILER, LUFT, TOP, tilstand, bevaeg, skybase, ligevaegt, omgivelser, pakketemperatur } from './model.mjs';
const $ = id => document.getElementById(id);
const svg = $('landskab'), figur = $('figur'), skyder = $('hoejde');
const reduceret = matchMedia('(prefers-reduced-motion: reduce)');
let profil = 'stabil', luft = 'toer', z = 0, v = 0, afspiller = false, frame, sidst, startet = false, afsluttet = false;
const tal = (v, n = 1) => v.toLocaleString('da-DK', { minimumFractionDigits:n, maximumFractionDigits:n });
const hundrede = h => tal(Math.round(h / 10) * 10, 0);
const TMIN = -20, TMAX = 28;

// Sky fra skybasen op til pakken: flad, når den er lav; et tårn, når den er høj.
function sky(x, yBase, yTop, b) {
  const h = yBase - yTop;
  if (h < 2) return '';
  const lag = Math.max(1, Math.ceil(h / (b * .8))), klumper = [];
  for (let i = 0; i <= lag; i++) {
    const f = i / lag, bred = b * Math.min(1, .7 + h / 160) * (1 - .3 * f), r = bred * (.62 + .1 * (i % 2));
    for (const side of [-1, 0, 1]) klumper.push(`<circle cx="${x + side * bred * .72 + (i % 2 ? b * .1 : -b * .1)}" cy="${yBase - f * h}" r="${side ? r * .8 : r}"/>`);
  }
  const form = klumper.join('');
  return `<clipPath id="skyklip"><rect x="0" y="0" width="${x + b * 3}" height="${yBase}"/></clipPath><g clip-path="url(#skyklip)"><g fill="#fdfdf7" stroke="#8fa9b6" stroke-width="2">${form}</g><g fill="#fdfdf7">${form}</g></g><path d="M${x - b * 1.25} ${yBase}H${x + b * 1.25}" stroke="#8fa9b6" stroke-width="1.5"/>`;
}

function tegnGraf(s, g, y, text) {
  const tx = t => g.x + (t - TMIN) / (TMAX - TMIN) * g.b;
  const hoejder = Array.from({ length: 61 }, (_, i) => i * TOP / 60);
  const omgLinje = hoejder.map(h => `${tx(omgivelser(profil, h))},${y(h)}`).join(' ');
  const pakkeLinje = hoejder.map(h => `${tx(pakketemperatur(luft, h))},${y(h)}`).join(' ');
  // Områderne mellem kurverne: orange hvor pakken er varmest, blå hvor den er koldest.
  let felter = '';
  for (let i = 0; i < 60; i++) {
    const a = hoejder[i], b = hoejder[i + 1], m = (a + b) / 2;
    const varm = pakketemperatur(luft, m) > omgivelser(profil, m);
    felter += `<polygon points="${tx(pakketemperatur(luft, a))},${y(a)} ${tx(pakketemperatur(luft, b))},${y(b)} ${tx(omgivelser(profil, b))},${y(b)} ${tx(omgivelser(profil, a))},${y(a)}" fill="${varm ? '#e58a3c' : '#3f8fbd'}" opacity="${varm ? .3 : .17}"/>`;
  }
  const akse = [-20, -10, 0, 10, 20].map(t => `<path d="M${tx(t)} ${y(TOP)}V${y(0)}" stroke="#476d7f" opacity="${t ? .13 : .3}"/>${text(tx(t), y(0) + 15, `${t}`, 'akse', 'middle')}`).join('');
  const base = skybase(luft), lig = ligevaegt(profil, luft);
  const px = tx(s.temperatur), ox = tx(s.omgivelser), hoejre = px > ox;
  const gap = Math.abs(px - ox);
  const sporPakke = Array.from({ length: 41 }, (_, i) => i * z / 40).map(h => `${tx(pakketemperatur(luft, h))},${y(h)}`).join(' ');
  const pl = hoejre ? px + 8 : px - 8, ol = hoejre ? ox - 8 : ox + 8;
  return `<rect x="${g.x}" y="${y(TOP)}" width="${g.b}" height="${y(0) - y(TOP)}" fill="#fffdf6" opacity=".82"/>
  ${akse}${felter}
  ${base < TOP ? `<path d="M${g.x} ${y(base)}H${g.x + g.b}" stroke="#608c99" stroke-dasharray="5 5"/>` : ''}
  <polyline points="${omgLinje}" fill="none" stroke="#172b2b" stroke-width="2.4"/>
  <polyline points="${pakkeLinje}" fill="none" stroke="#b85b29" stroke-width="1.6" stroke-dasharray="5 4"/>
  ${z > 0 ? `<polyline points="${sporPakke}" fill="none" stroke="#b85b29" stroke-width="3.4"/>` : ''}
  ${lig !== null ? `<circle cx="${tx(omgivelser(profil, lig))}" cy="${y(lig)}" r="4.5" fill="#fffdf6" stroke="#172b2b" stroke-width="1.6"/>` : ''}
  <path d="M${g.xStart} ${y(z)}H${Math.max(px, ox)}" stroke="#7796a0" stroke-dasharray="2 4" opacity=".9"/>
  ${gap > 1 ? `<path d="M${px} ${y(z)}H${ox}" stroke="${hoejre ? '#b85b29' : '#216c98'}" stroke-width="3"/>` : ''}
  <circle cx="${ox}" cy="${y(z)}" r="5" fill="#172b2b"/>
  <circle cx="${px}" cy="${y(z)}" r="5.5" fill="#b85b29" stroke="#fffdf6" stroke-width="1.5"/>
  ${text(pl, y(z) - 10, `${tal(s.temperatur)}°`, 'grafvaerdi pakkefarve', hoejre ? 'start' : 'end')}
  ${text(ol, y(z) - 10, `${tal(s.omgivelser)}°`, 'grafvaerdi', hoejre ? 'end' : 'start')}
  ${text(g.x, 26, 'Temperatur · °C', 'lille')}`;
}

function resultat(s) {
  const base = skybase(luft), lig = ligevaegt(profil, luft);
  if (z >= TOP) return [`Stadig varmere ved ${tal(TOP, 0)} m`, base < TOP ? `Pakken blev mættet ved ${tal(base, 0)} m, og skyen vokser videre op over figuren. ${profil === 'betinget' && luft === 'fugtig' ? 'Prøv nu den tørre pakke i samme luft.' : profil === 'ustabil' ? 'Skift tør/fugtig: pakken stiger begge gange, men skybasen flytter sig.' : ''}` : ''];
  const hint = profil === 'betinget' && luft === 'toer' ? 'Prøv nu den fugtige pakke, eller tving den tørre over 2.750 m.' : profil === 'betinget' ? '' : 'Skift tør/fugtig: udfaldet er det samme.';
  return [`Stopper ved ca. ${hundrede(s.z)} m`, `Her er pakken lige så kold som omgivelserne, så opdriften er væk.${s.z < base ? ` Dugpunktet nås ikke, så der kommer ingen sky.` : ''} ${hint}`.trim()];
}

function tegn() {
  const s = tilstand(profil, luft, z), w = figur.clientWidth, h = figur.clientHeight;
  const smal = w < 560, top = 60, bund = h - 74;
  const y = hoejde => bund - hoejde / TOP * (bund - top);
  const delX = Math.round(w * (smal ? .47 : .53));
  const x = 46 + (delX - 46) * .5;
  const r0 = Math.min(22, w * .055), r = r0 * Math.cbrt(s.volumen), cy = y(z) - r0 * .35;
  const varm = s.forskel > .05, kold = s.forskel < -.05;
  const farve = varm ? '#b85b29' : kold ? '#216c98' : '#587779';
  const text = (xx, yy, t, cls = '', anchor = 'start') => `<text x="${xx}" y="${yy}" class="${cls}" text-anchor="${anchor}">${t}</text>`;
  const base = skybase(luft), g = { x: delX + 8, b: w - delX - 22, xStart: x + r + 4 };

  $('hoejde-tal').textContent = `${tal(z, 0)} m`;
  skyder.value = z;
  skyder.setAttribute('aria-valuetext', `${tal(z, 0)} meter. Luftpakken ${tal(s.temperatur)} grader, omgivelserne ${tal(s.omgivelser)} grader. ${s.maettet ? 'Mættet' : 'Umættet'} luft.`);
  const stiger = v > .1, synker = v < -.1;
  $('bevaegelse').textContent = afsluttet ? (z >= TOP ? 'Stiger videre ud af figuren ↑' : 'Pakken er faldet til ro') : startet ? (stiger ? 'Pakken stiger ↑' : synker ? 'Pakken synker ↓' : 'Pakken vender') : z > 0 ? 'Pakken holdes i denne højde' : 'Jorden har varmet pakken 2 °C';
  $('trin-titel').textContent = s.maettet ? 'Fugtadiabatisk: 0,5 °C pr. 100 m' : 'Tøradiabatisk: 1,0 °C pr. 100 m';
  $('trin-tekst').textContent = s.maettet ? 'Pakken er mættet. Vanddamp kondenserer til skydråber og frigiver latent varme, så afkølingen bremses.' : `Pakken er umættet og afkøles, mens den udvider sig. ${base < TOP ? `Ved ${tal(base, 0)} m når den dugpunktet.` : ''}`;
  if (afsluttet) {
    const [titel, tekst] = resultat(s);
    $('opdrift-titel').textContent = titel; $('opdrift-tekst').textContent = tekst;
  } else {
    $('opdrift-titel').textContent = varm ? `↑ ${tal(s.forskel)} °C varmere · opdrift` : kold ? `↓ ${tal(-s.forskel)} °C koldere · søger ned` : 'Samme temperatur · ingen opdrift';
    $('opdrift-tekst').textContent = varm ? 'Pakken er mindre tæt end omgivelserne i samme højde.' : kold ? 'Pakken er tættere end omgivelserne i samme højde.' : 'Pakken har samme densitet som omgivelserne.';
  }
  $('figurtekst').textContent = `${PROFILER[profil].navn}, ${LUFT[luft].navn.toLowerCase()}. ${tal(z, 0)} m. Luftpakke ${tal(s.temperatur)} °C, dugpunkt ${tal(s.dugpunkt)} °C, omgivelser ${tal(s.omgivelser)} °C. ${$('opdrift-titel').textContent}.`;

  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  const ticks = [0, 1000, 2000, 3000].map(v => `<path d="M46 ${y(v)}H${delX}" stroke="#476d7f" opacity=".2"/>${text(40, y(v) + 4, v ? tal(v, 0) : '0', 'akse', 'end')}`).join('');
  const dots = s.maettet ? '' : Array.from({ length: 10 }, (_, i) => { const a = i * 2.39996, d = Math.sqrt((i + .5) / 10) * r * .75; return `<circle cx="${x + Math.cos(a) * d}" cy="${cy + Math.sin(a) * d}" r="1.3" fill="#7c4f26" opacity=".55"/>`; }).join('');
  const skybredde = Math.min(46, (delX - 46) * .24);
  const skyen = s.maettet ? sky(x, y(base), y(z), skybredde) : '';
  svg.innerHTML = `<defs>
    <linearGradient id="himmel" x2="0" y2="1"><stop stop-color="#b7d4e2"/><stop offset="1" stop-color="#f3f4e9"/></linearGradient>
    <radialGradient id="pakke" cx="30%" cy="25%" r="80%"><stop stop-color="#fffef3" stop-opacity=".97"/><stop offset=".55" stop-color="${s.maettet ? '#eaf5fa' : '#f9dca8'}" stop-opacity=".92"/><stop offset="1" stop-color="${s.maettet ? '#8db9cf' : '#d9a765'}" stop-opacity=".97"/></radialGradient>
    <marker id="pil" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5 0 10Z" fill="${farve}"/></marker>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#himmel)"/>
  ${profil === 'inversion' ? `<rect x="46" y="${y(1000)}" width="${delX - 46}" height="${bund - y(1000)}" fill="#edb578" opacity=".3"/><path d="M46 ${y(1000)}H${delX}" stroke="#a9692f" stroke-width="2"/>${text(52, y(1000) - 6, smal ? 'Inversionens top' : 'Inversionens top · varmest her', 'akse')}` : ''}
  ${text(10, 26, 'Højde · m', 'lille')}
  ${ticks}
  ${base < TOP ? `<path d="M46 ${y(base)}H${delX}" stroke="#608c99" stroke-dasharray="5 5"/>` : ''}
  <path d="M0 ${bund + 8}Q${delX * .4} ${bund + 3} ${delX * .75} ${bund + 7}T${w} ${bund + 8}V${h}H0Z" fill="#97ae93"/>
  <path d="M0 ${bund + 22}Q${w * .3} ${bund + 14} ${w * .6} ${bund + 24}T${w} ${bund + 18}V${h}H0Z" fill="#6f8f78"/>
  ${tegnGraf(s, g, y, text)}
  ${skyen}
  ${base < TOP ? text(delX - 4, y(base) - 6, s.maettet ? `Skybase ${tal(base, 0)} m` : smal ? `Mættes ${tal(base, 0)} m` : `Bliver mættet ved ${tal(base, 0)} m`, 'akse halo', 'end') : ''}
  <circle cx="${x}" cy="${cy}" r="${r}" fill="url(#pakke)" stroke="${farve}" stroke-width="1.8"/>
  ${dots}<circle cx="${x}" cy="${cy}" r="${r0}" fill="none" stroke="#496c7c" stroke-dasharray="3 3" opacity=".55"/>
  ${varm || kold ? `<path d="M${x - r - 11} ${cy + (varm ? 13 : -13)}v${varm ? -24 : 24}" stroke="${farve}" stroke-width="3" marker-end="url(#pil)"/>` : ''}
  ${text(x, cy - r - 7, 'Luftpakke', 'pakke-label', 'middle')}
  <rect x="10" y="${h - 36}" width="${w - 20}" height="28" rx="7" fill="#fff9ee" opacity=".95"/>
  ${text(20, h - 17, `${tal(s.tryk, 0)} hPa`, 'maaling')}${text(w * .5, h - 17, `Volumen × ${tal(s.volumen, 2)}`, 'maaling', 'middle')}${text(w - 20, h - 17, `Dugpunkt ${tal(s.dugpunkt)}°`, 'maaling', 'end')}`;
}
function stop() { afspiller = false; cancelAnimationFrame(frame); sidst = null; knap(); }
function knap() {
  $('afspil').textContent = afspiller ? '❚❚ Pause' : afsluttet ? '↻ Slip en ny pakke' : reduceret.matches && startet ? 'Næste trin →' : startet ? '▶ Fortsæt' : z > 0 ? '▶ Slip pakken her' : '▶ Slip varm luftpakke';
  $('afspil').setAttribute('aria-pressed', String(afspiller));
}
function frem(realSekunder) {
  const ny = bevaeg(profil, luft, z, v, realSekunder * 30);
  z = ny.z; v = ny.v;
  if (ny.slut) { afsluttet = true; stop(); }
  tegn(); knap();
}
function tick(t) {
  if (!afspiller) return;
  if (sidst !== null) frem(Math.min((t - sidst) / 1000, .08));
  sidst = t;
  if (afspiller) frame = requestAnimationFrame(tick);
}
function start() {
  startet = true; afsluttet = false;
  if (reduceret.matches) { frem(1); return; }
  afspiller = true; sidst = null; knap(); frame = requestAnimationFrame(tick);
}
function nulstil() { stop(); z = 0; v = 0; startet = false; afsluttet = false; tegn(); knap(); }
skyder.addEventListener('input', () => { stop(); z = +skyder.value; v = 0; startet = false; afsluttet = false; tegn(); knap(); });
function vaelg(attribut, saet) {
  document.querySelectorAll(`[${attribut}]`).forEach(b => b.addEventListener('click', () => {
    saet(b.getAttribute(attribut));
    document.querySelectorAll(`[${attribut}]`).forEach(k => k.setAttribute('aria-pressed', String(k === b)));
    $('scenenavn').textContent = PROFILER[profil].navn; $('profiltekst').textContent = PROFILER[profil].tekst;
    nulstil();
  }));
}
vaelg('data-profil', p => { profil = p; });
vaelg('data-luft', l => { luft = l; });
$('afspil').addEventListener('click', () => {
  if (afspiller) return stop();
  if (afsluttet) nulstil();
  start();
});
$('nulstil').addEventListener('click', nulstil);
$('fokus').addEventListener('click', () => { const aktiv = document.body.classList.toggle('fokus'); $('fokus').setAttribute('aria-pressed',String(aktiv)); $('fokus').textContent = aktiv ? 'Afslut fokus' : 'Fokus'; });
document.addEventListener('keydown', e => { if(e.key === 'Escape' && document.body.classList.contains('fokus')) $('fokus').click(); });
document.addEventListener('visibilitychange', () => { sidst = null; });
reduceret.addEventListener('change', stop);
new ResizeObserver(tegn).observe(figur);
$('profiltekst').textContent = PROFILER[profil].tekst;
tegn(); knap();
