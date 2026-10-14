// Island på kortet (#49, forløbets trin 2 «Zoom»): terræn, havbund og
// vulkansystemer fra målte og kortlagte data. Data dannes af
// data/islandskort.py; kilder og licenser står i data/islandskort.LICENSE.
//
// Reliefbilledet er tegnet i D3's sfæriske geoConicConformal (paralleller og
// rotation fra islandskort.json). Vektorerne projiceres her med samme
// projektion, så de ligger præcist oven på billedet.

const svg = document.querySelector('#islandskort');
const figur = document.querySelector('.kortfigur');
const aflaesning = document.querySelector('.aflaesning');
const kortstatus = document.querySelector('.kortstatus');
const lagValg = [...document.querySelectorAll('[data-vislag]')];

// Udsnittet, der altid skal kunne ses ved zoom 1: Island med ryggens start.
const FOKUS = { lon: [-25.4, -12.9], lat: [63.05, 66.75] };
const ZOOM = [1, 1.5, 2.25, 3.4, 5];
// Hotspot (fortolkning): langsomme jordskælvsbølger under det centrale Island og
// det vestlige Vatnajökull (Wolfe m.fl. 1997; Allen m.fl. 2002). Omtrentlig placering.
export const HOTSPOT = { centrum: [-17.6, 64.6], radius_km: 125 };
// Ryggene under havet: navnenes placering (fagligt navngivne strukturer, ikke data).
const RYGGE = [
  { navn: 'Reykjanesryggen', lon: -24.15, lat: 63.3, anker: 'end' },
  { navn: 'Kolbeinseyryggen', lon: -18.15, lat: 66.9, anker: 'start' }
];
const PLADER = [
  { navn: '← Nordamerikanske plade', lon: -24.9, lat: 66.85, anker: 'start' },
  { navn: 'Eurasiske plade →', lon: -13.3, lat: 63.55, anker: 'end' }
];

const tilstand = { zoom: 0, midte: null, skjul: new Set(['hotspot']), maal: { W: 0, H: 0 }, kryds: null };
let data, projektion, hoejder, graenselinjer;

const f = n => Math.round(n * 10) / 10;
const tal = n => Math.round(n).toLocaleString('da-DK');
const koord = ([lon, lat]) => `${Math.abs(lat).toFixed(2).replace('.', ',')}° ${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lon).toFixed(2).replace('.', ',')}° ${lon < 0 ? 'V' : 'Ø'}`;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

async function hent() {
  const [d, pg, bin] = await Promise.all([
    fetch('data/islandskort.json').then(s => { if (!s.ok) throw new Error(s.status); return s.json(); }),
    fetch('../data/pladegraenser.json').then(s => s.ok ? s.json() : null).catch(() => null),
    fetch('data/islandskort-hoejde.bin').then(s => s.ok ? s.arrayBuffer() : null).catch(() => null)
  ]);
  data = d;
  const p = d.projektion;
  projektion = d3.geoConicConformal().parallels(p.paralleller).rotate(p.rotation).precision(.2);
  if (bin && bin.byteLength === d.hoejde.bredde * d.hoejde.hoejde * 2) hoejder = new Int16Array(bin);
  // Pladegrænserne nær Island (Bird 2003), som linjer i lon/lat.
  graenselinjer = !pg ? [] : pg.linjer
    .map(([, , , , flad]) => { const l = []; for (let i = 0; i < flad.length; i += 2) l.push([flad[i], flad[i + 1]]); return l; })
    .filter(l => l.some(([lon, lat]) => lon > -32 && lon < -6 && lat > 61 && lat < 69));
}

// Projektion ved scale 1/translate 0 → skærm. Rasterets grænser er i de samme enheder.
function saetVisning() {
  const { W, H } = tilstand.maal;
  projektion.scale(1).translate([0, 0]);
  const hj = [[FOKUS.lon[0], FOKUS.lat[0]], [FOKUS.lon[1], FOKUS.lat[0]], [FOKUS.lon[0], FOKUS.lat[1]], [FOKUS.lon[1], FOKUS.lat[1]], [-19, FOKUS.lat[0]]].map(p => projektion(p));
  const xs = hj.map(p => p[0]), ys = hj.map(p => p[1]);
  const fokus = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
  // Hele fokusudsnittet skal kunne ses, og reliefbilledet skal dække hele figuren.
  const [X0, Y0, X1, Y1] = data.graenser;
  const k0 = Math.max(Math.min(W / (fokus[2] - fokus[0]), H / (fokus[3] - fokus[1])) * .97, W / (X1 - X0), H / (Y1 - Y0));
  if (!tilstand.midte) tilstand.midte = [(fokus[0] + fokus[2]) / 2, (fokus[1] + fokus[3]) / 2];
  const k = k0 * ZOOM[tilstand.zoom];
  // Midten holdes inden for rasteret, så der ikke trækkes ud i det tomme.
  const hx = W / 2 / k, hy = H / 2 / k;
  const klem = (v, a, b) => a > b ? (a + b) / 2 : Math.max(a, Math.min(b, v));
  tilstand.midte = [klem(tilstand.midte[0], X0 + hx, X1 - hx), klem(tilstand.midte[1], Y0 + hy, Y1 - hy)];
  projektion.scale(k).translate([W / 2 - k * tilstand.midte[0], H / 2 - k * tilstand.midte[1]]);
  return k;
}

function skaerm(X, Y) { const k = projektion.scale(), t = projektion.translate(); return [t[0] + k * X, t[1] + k * Y]; }
function enheder(x, y) { const k = projektion.scale(), t = projektion.translate(); return [(x - t[0]) / k, (y - t[1]) / k]; }

function tegn() {
  const { width, height } = figur.getBoundingClientRect();
  if (!width || !height || !data) return;
  tilstand.maal = { W: Math.round(width), H: Math.round(height) };
  const { W, H } = tilstand.maal;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  saetVisning();
  const sti = d3.geoPath(projektion);
  const [X0, Y0, X1, Y1] = data.graenser;
  const [ax, ay] = skaerm(X0, Y0), [bx, by] = skaerm(X1, Y1);
  const vis = lag => !tilstand.skjul.has(lag);
  const uddoede = vis('uddoed');
  const objekter = data.vulkansystemer.filter(o => o.properties.aktiv || uddoede);
  const af = (slags, aktiv) => objekter.filter(o => o.properties.slags === slags && o.properties.aktiv === aktiv)
    .map(o => `<path d="${sti(o)}"/>`).join('');

  let ud = `<image href="data/${data.relief.fil}" x="${f(ax)}" y="${f(ay)}" width="${f(bx - ax)}" height="${f(by - ay)}" preserveAspectRatio="none"/>`;
  if (vis('svaerm')) ud += `<g data-lag="svaerm"><g class="sig-uddoed">${af('svaerm', false)}</g><g class="sig-svaerm aktiv">${af('svaerm', true)}</g></g>`;
  if (vis('centralvulkan')) ud += `<g data-lag="centralvulkan"><g class="sig-uddoed">${af('centralvulkan', false)}${af('kaldera', false)}</g><g class="sig-vulkan aktiv">${af('centralvulkan', true)}</g><g class="sig-kaldera">${af('kaldera', true)}</g></g>`;
  if (vis('graense') && graenselinjer.length) {
    const d = graenselinjer.map(l => sti({ type: 'LineString', coordinates: l })).join('');
    ud += `<g data-lag="graense"><path class="graense-ydre" d="${d}"/><path class="graense-indre" d="${d}"/></g>`;
  }
  if (vis('hotspot')) {
    const cirkel = d3.geoCircle().center(HOTSPOT.centrum).radius(HOTSPOT.radius_km / 111.195)();
    const [cx, cy] = projektion(HOTSPOT.centrum);
    const r = Math.abs(projektion([HOTSPOT.centrum[0], HOTSPOT.centrum[1] + HOTSPOT.radius_km / 111.195])[1] - cy);
    ud += `<g data-lag="hotspot"><path class="hotspot-cirkel" d="${sti(cirkel)}"/><text class="etiket hotspot-etiket" x="${f(cx)}" y="${f(cy + r + 16)}" text-anchor="middle">Hotspot <tspan class="maerke">(fortolkning)</tspan></text></g>`;
  }
  ud += etiketter(vis);
  ud += maalestok();
  svg.innerHTML = ud;
  if (tilstand.kryds) visKryds();
  beskriv();
  document.querySelector('#zoomind').disabled = tilstand.zoom === ZOOM.length - 1;
  document.querySelector('#zoomud').disabled = tilstand.zoom === 0;
  figur.classList.toggle('zoomet', tilstand.zoom > 0);
}

// Navne: højst prioriterede først, og ingen der overlapper hinanden eller ligger uden for figuren.
let synligeNavne = [];
function etiketter(vis) {
  const { W, H } = tilstand.maal;
  const optaget = [];
  const fri = (x0, y0, x1, y1) => x0 > 4 && y0 > 4 && x1 < W - 4 && y1 < H - 34 && !optaget.some(b => x0 < b[2] && x1 > b[0] && y0 < b[3] && y1 > b[1]);
  const bredde = (s, px) => s.length * px * .62;
  synligeNavne = [];
  if (!vis('navne')) return '';
  let ud = '';
  // Rygge og plader først, så vulkannavne viger for dem.
  ud += '<g data-lag="navne" class="havnavne">';
  for (const r of RYGGE) {
    const [x, y] = projektion([r.lon, r.lat]);
    const b = bredde(r.navn, 13), x0 = r.anker === 'start' ? x : x - b;
    if (!fri(x0, y - 13, x0 + b, y + 3)) continue;
    optaget.push([x0, y - 13, x0 + b, y + 3]);
    ud += `<text class="etiket ryg" x="${f(x)}" y="${f(y)}" text-anchor="${r.anker}">${esc(r.navn)}</text>`;
  }
  for (const p of PLADER) {
    const [x, y] = projektion([p.lon, p.lat]);
    const b = bredde(p.navn, 13), x0 = p.anker === 'start' ? x : x - b;
    if (!fri(x0, y - 13, x0 + b, y + 3)) continue;
    optaget.push([x0, y - 13, x0 + b, y + 3]);
    ud += `<text class="etiket plade" x="${f(x)}" y="${f(y)}" text-anchor="${p.anker}">${esc(p.navn)}</text>`;
  }
  ud += '</g>';
  const maxPrio = W < 520 ? 1 + (tilstand.zoom > 0) : W < 900 ? 2 + (tilstand.zoom > 0) : 3;
  ud += '<g data-lag="navne">';
  for (const v of data.navne) {
    if (v.prioritet > maxPrio) continue;
    const [x, y] = projektion([v.lon, v.lat]);
    const b = bredde(v.navn, 13);
    // Navnet til højre for punktet; ellers til venstre.
    let x0 = x + 7, anker = 'start';
    if (!fri(x0, y - 9, x0 + b, y + 6)) { x0 = x - 7 - b; anker = 'end'; }
    if (!fri(x0, y - 9, x0 + b, y + 6) || x < 0 || x > W || y < 0 || y > H) continue;
    optaget.push([x0, y - 9, x0 + b, y + 6], [x - 5, y - 5, x + 5, y + 5]);
    synligeNavne.push(v);
    const senest = v.senest == null ? 'ingen kendte udbrud i nutiden' : v.senest < 0 ? `seneste udbrud ca. ${tal(-v.senest)} f.Kr.` : `seneste udbrud ${v.senest}`;
    ud += `<g class="navn"><title>${esc(v.navn)}: ${senest} (GVP)</title><circle cx="${f(x)}" cy="${f(y)}" r="3.5"/><text class="etiket lille" x="${f(anker === 'start' ? x + 7 : x - 7)}" y="${f(y + 4)}" text-anchor="${anker}">${esc(v.navn)}</text></g>`;
  }
  return ud + '</g>';
}

// Målestok nederst til højre og nordpil. Projektionen er vinkeltro, så målestokken
// gælder hele kortet med få procents afvigelse.
function maalestok() {
  const { W, H } = tilstand.maal;
  const km = d3.geoDistance(projektion.invert([W / 2 - 50, H / 2]), projektion.invert([W / 2 + 50, H / 2])) * 6371 / 100;
  const laengde = [10, 20, 50, 100, 200].find(l => l / km >= 60) || 200;
  const px = laengde / km, x1 = W - 14, x0 = x1 - px, y = H - 16;
  return `<g class="maalestok" aria-hidden="true"><rect x="${f(x0 - 8)}" y="${y - 22}" width="${f(px + 16)}" height="30" rx="4"/>`
    + `<path d="M${f(x0)} ${y - 5}V${y}H${f(x1)}V${y - 5}"/><text x="${f((x0 + x1) / 2)}" y="${y - 8}" text-anchor="middle">${laengde} km</text>`
    + `<text x="${f(x0 - 22)}" y="${y - 2}" text-anchor="middle" class="nord">↑N</text></g>`;
}

// Aflæsning af højde/dybde under markøren eller ved tastaturets kryds.
function hoejdeVed(x, y) {
  if (!hoejder) return null;
  const [X, Y] = enheder(x, y);
  const [X0, Y0] = data.graenser;
  const px = (data.graenser[2] - X0) / data.relief.bredde;
  const j = Math.floor((X - X0) / px / data.hoejde.trin), i = Math.floor((Y - Y0) / px / data.hoejde.trin);
  if (i < 0 || j < 0 || i >= data.hoejde.hoejde || j >= data.hoejde.bredde) return null;
  return hoejder[i * data.hoejde.bredde + j];
}
function aflaes(x, y) {
  const z = hoejdeVed(x, y);
  if (z == null) { aflaesning.hidden = true; return ''; }
  const tekst = z > 0 ? `${tal(z)} m over havet` : z < 0 ? `${tal(-z)} m under havet` : 'ved havoverfladen';
  aflaesning.innerHTML = `<strong>${tekst}</strong><span>${koord(projektion.invert([x, y]))}</span>`;
  aflaesning.hidden = false;
  return tekst;
}
function visKryds() {
  const { W, H } = tilstand.maal;
  const [x, y] = [W / 2, H / 2];
  svg.insertAdjacentHTML('beforeend', `<g class="kryds" aria-hidden="true"><path d="M${x - 10} ${y}H${x + 10}M${x} ${y - 10}V${y + 10}"/></g>`);
  return aflaes(x, y);
}

function beskriv() {
  const vis = lag => !tilstand.skjul.has(lag);
  const dele = ['Skyggelagt terræn og havbund i farver efter højde og dybde.'];
  if (vis('svaerm') || vis('centralvulkan')) dele.push('De aktive vulkansystemer ligger i et bælte fra Reykjanes i sydvest over det centrale Island til Nordisland og følger pladegrænsen.' + (vis('uddoed') ? ' Uddøde vulkaner ligger mod øst- og vestkysten.' : ''));
  if (vis('graense')) dele.push('Pladegrænsen mellem den Nordamerikanske og den Eurasiske plade er tegnet som rød linje.');
  if (vis('hotspot')) dele.push('En stiplet cirkel under det centrale Island og det vestlige Vatnajökull viser hotspottet – en fortolkning.');
  if (vis('navne') && synligeNavne.length) dele.push('Navngivne vulkaner: ' + synligeNavne.map(v => v.navn + (v.senest > 0 ? ` (seneste udbrud ${v.senest})` : '')).join(', ') + '.');
  if (tilstand.zoom) dele.push(`Zoomet ${String(ZOOM[tilstand.zoom]).replace('.', ',')} gange.`);
  document.querySelector('#kortbeskrivelse').textContent = dele.join(' ');
}

function zoom(trin, om = null) {
  const ny = Math.max(0, Math.min(ZOOM.length - 1, tilstand.zoom + trin));
  if (ny === tilstand.zoom) return;
  // Zoom om et punkt på skærmen (standard: midten), så det bliver liggende.
  const { W, H } = tilstand.maal;
  const [x, y] = om || [W / 2, H / 2];
  const P = enheder(x, y), k = projektion.scale() * ZOOM[ny] / ZOOM[tilstand.zoom];
  tilstand.midte = [P[0] - (x - W / 2) / k, P[1] - (y - H / 2) / k];
  tilstand.zoom = ny;
  tegn();
  status(`Zoom ${String(ZOOM[ny]).replace('.', ',')} gange.`);
}
function flyt(dx, dy) {
  const k = projektion.scale();
  tilstand.midte = [tilstand.midte[0] + dx / k, tilstand.midte[1] + dy / k];
  tegn();
}
function status(t) { kortstatus.textContent = t; }

// Betjening ---------------------------------------------------------------
document.querySelector('#zoomind').addEventListener('click', () => zoom(1));
document.querySelector('#zoomud').addEventListener('click', () => zoom(-1));
document.querySelector('#nulstil').addEventListener('click', () => {
  tilstand.zoom = 0; tilstand.midte = null; tilstand.kryds = null; aflaesning.hidden = true; tegn(); status('Viser hele Island.');
});

// Træk for at flytte, når der er zoomet ind. Uden zoom ruller et lodret
// strøg siden som normalt på touch; et tryk aflæser højden.
let træk = null;
svg.addEventListener('pointerdown', e => {
  if (e.button > 0) return;
  træk = { x: e.clientX, y: e.clientY, id: e.pointerId, i_gang: false };
});
svg.addEventListener('pointermove', e => {
  const r = svg.getBoundingClientRect();
  if (træk && e.pointerId === træk.id && tilstand.zoom > 0) {
    const dx = e.clientX - træk.x, dy = e.clientY - træk.y;
    if (!træk.i_gang && Math.hypot(dx, dy) < 5) return;
    if (!træk.i_gang) { træk.i_gang = true; svg.setPointerCapture(e.pointerId); figur.classList.add('traekker'); }
    træk.x = e.clientX; træk.y = e.clientY;
    flyt(-dx, -dy);
    return;
  }
  if (e.pointerType === 'mouse') { tilstand.kryds = null; aflaes(e.clientX - r.left, e.clientY - r.top); }
});
const slip = e => {
  if (træk && !træk.i_gang && e.type === 'pointerup') {
    const r = svg.getBoundingClientRect();
    aflaes(e.clientX - r.left, e.clientY - r.top);
  }
  træk = null; figur.classList.remove('traekker');
};
svg.addEventListener('pointerup', slip);
svg.addEventListener('pointercancel', slip);
svg.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse' && !tilstand.kryds) aflaesning.hidden = true; });
svg.addEventListener('dblclick', e => { const r = svg.getBoundingClientRect(); zoom(1, [e.clientX - r.left, e.clientY - r.top]); });

// Tastatur på kortet: pile flytter (med et kryds, der aflæser højden), + og − zoomer.
svg.addEventListener('keydown', e => {
  if (e.altKey || e.ctrlKey || e.metaKey) return;
  const pil = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
  if (pil) {
    e.preventDefault();
    const trin = e.shiftKey ? 120 : 40;
    tilstand.kryds = true;
    flyt(pil[0] * trin, pil[1] * trin);
    // tegn() har sat krydset i midten; meddel det aflæste til skærmlæsere.
    if (!aflaesning.hidden) status(`Ved krydset: ${aflaesning.querySelector('strong').textContent}, ${aflaesning.querySelector('span').textContent}.`);
  } else if (e.key === '+' || e.key === '=') { e.preventDefault(); zoom(1); }
  else if (e.key === '-') { e.preventDefault(); zoom(-1); }
  else if (e.key === 'Home') { e.preventDefault(); document.querySelector('#nulstil').click(); }
});
svg.addEventListener('blur', () => { if (tilstand.kryds) { tilstand.kryds = null; aflaesning.hidden = true; tegn(); } });

// Lag
const lagknap = document.querySelector('#lagknap'), lagpanel = document.querySelector('#lagpanel');
const lagnavn = Object.fromEntries(lagValg.map(v => [v.dataset.vislag, v.closest('label').textContent.trim()]));
function aabnLag(til) { lagpanel.hidden = !til; lagknap.setAttribute('aria-expanded', String(til)); }
lagknap.addEventListener('click', () => aabnLag(lagpanel.hidden));
lagpanel.addEventListener('change', e => {
  const v = e.target.closest('[data-vislag]');
  if (!v) return;
  tilstand.skjul[v.checked ? 'delete' : 'add'](v.dataset.vislag);
  tegn();
  status(`${lagnavn[v.dataset.vislag]} ${v.checked ? 'vises' : 'er skjult'}.`);
});
document.addEventListener('click', e => { if (!lagpanel.hidden && !e.target.closest('.lagvalg')) aabnLag(false); });
for (const v of lagValg) v.checked = !tilstand.skjul.has(v.dataset.vislag);

// Fokus
const fokus = document.querySelector('#fokus');
function saetFokus(til) { document.body.classList.toggle('fokus', til); fokus.setAttribute('aria-pressed', String(til)); }
fokus.addEventListener('click', () => saetFokus(!document.body.classList.contains('fokus')));
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (!lagpanel.hidden) { aabnLag(false); lagknap.focus(); }
  else if (document.body.classList.contains('fokus')) saetFokus(false);
});

// Højdeskalaens farver fra samme stop som reliefbilledet.
function skala() {
  const { hav, land } = data.farver;
  const stop = [...hav.filter(([m]) => m <= 2000).reverse().map(([m, c]) => [50 - m / 40, c]), ...land.filter(([m]) => m <= 2100).map(([m, c]) => [50 + Math.min(m, 2000) / 40, c])];
  document.querySelector('.skalabaand').style.background = `linear-gradient(90deg,${stop.map(([p, c]) => `${c} ${p}%`).join(',')})`;
}

try {
  await hent();
  skala();
  kortstatus.textContent = '';
  kortstatus.classList.add('skjult');
  let ventende = 0;
  new ResizeObserver(() => { cancelAnimationFrame(ventende); ventende = requestAnimationFrame(tegn); }).observe(figur);
  tegn();
  figur.classList.add('klar');
} catch (fejl) {
  console.warn('Kortet kunne ikke hentes', fejl);
  kortstatus.textContent = 'Kortet kunne ikke hentes. Kort fortalt: De aktive vulkaner på Island ligger i et bælte fra Reykjanes til Nordisland langs pladegrænsen; uddøde vulkaner ligger mod øst- og vestkysten.';
  kortstatus.classList.add('fejl');
}

// Til browsertesten (atlas/test/island.py): samme modulinstans ved import().
export const proeve = { tilstand, hoejdeVed, projektion: () => projektion, data: () => data };
