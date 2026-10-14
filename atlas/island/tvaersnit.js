// Skematisk tværsnit på tværs af Den Midtatlantiske Ryg (#49, milepæl B og C).
// Figuren er tegnet efter ISLAND-MODEL.md afsnit 4. Alle mål er skematiske:
// kun rækkefølgen og forholdet mellem de to tilstande er faglige påstande
// (Island: tykkere skorpe, dybere smeltestart, mere magma, land over havet).
// Der står bevidst ingen tal i figuren, før referencerne er slået op.
//
// Milepæl C: lag kan udelades (`skjul`), og `bevaegelse()` tegner de dele,
// der flytter sig i den illustrative animation (afsnit 5). Hastighederne er
// kun indbyrdes: kappen stiger meget langsommere end magmaen. Ingen udbrud.

const RAND = 10;

const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const f = n => Math.round(n * 10) / 10;
const rest = (a, n) => ((a % n) + n) % n;

// Animationens hastigheder. Kappen og dråberne: brøkdel af vejen pr. sekund;
// pladerne: figurbredder pr. sekund; magma i gangene: figurhøjder pr. sekund,
// så den altid er langt hurtigere end kappen, uanset hvor kort gangen er.
const FART = { plade: .012, kappe: .015, draabe: .15, gang: .12 };

// Fast pseudotilfældig række, så dråberne ligger samme sted hver gang.
function tilfaeldig(frø) {
  let s = frø;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

export function geometri(W, H, island) {
  const x0 = W / 2, halv = W / 2;
  const hav = H * .17;
  const d = x => Math.abs(x - x0) / halv;               // 0 ved ryggen, 1 ved kanten
  const riftdal = x => H * .014 * Math.exp(-(((x - x0) / (W * .025)) ** 2));
  const kyst = .6;
  const overflade = x => {
    const r = d(x);
    const ryg = hav + H * (.045 + .06 * Math.sqrt(r));
    if (!island) return ryg + riftdal(x);
    const t = smooth(kyst - .06, kyst + .1, r);
    const relief = H * .008 * (Math.cos((x - x0) / W * 38) + .4 * Math.sin(x / W * 73));
    return lerp(hav - H * .04 + relief, hav + H * (.03 + .04 * Math.sqrt(r)), t) + riftdal(x);
  };
  const skorpetykkelse = x => island ? lerp(H * .17, H * .075, smooth(.35, .95, d(x))) : H * .045;
  const skorpebund = x => overflade(x) - riftdal(x) + skorpetykkelse(x);
  const pladebund = x => Math.max(skorpebund(x0) + H * .025 + H * .2 * Math.sqrt(d(x)), skorpebund(x) + H * .02);
  return {
    x0, hav, overflade, skorpebund, pladebund,
    kyst: W * .5 * kyst,
    smeltestart: island ? H * .86 : hav + H * .5,
    smeltebredde: island ? W * .24 : W * .15,
    smeltetop: W * .035
  };
}

// Figurens bevægelige dele som geometri, så den statiske tegning og
// animationen bruger præcis de samme kurver.
function former(W, H, island) {
  const smal = W < 560;
  const g = geometri(W, H, island);
  const { x0, overflade, skorpebund, pladebund } = g;

  const kappekurver = [];
  for (const s of [-1, 1]) for (const k of smal ? [0, 2] : [0, 1, 2]) {
    const sx = x0 + s * W * (.13 + .12 * k), sy = H - 8;
    const ex = x0 + s * W * (.025 + .035 * k), ey = pladebund(ex) + H * (.07 + .02 * k);
    const cx = x0 + s * W * (.09 + .07 * k), cy = lerp(sy, ey, .45);
    kappekurver.push([sx, sy, cx, cy, ex, ey]);
  }

  const kd = island ? lerp(overflade(x0), skorpebund(x0), .3) : lerp(overflade(x0), skorpebund(x0), .55);
  const kamre = island
    ? [[x0 - W * .03, kd, W * .035, H * .018], [x0 + W * .045, kd + H * .045, W * .03, H * .016]]
    : [[x0, kd, W * .018, H * .009]];
  const fod = pladebund(x0) + H * .03;
  // Gange som kubiske kurver [x0 y0 x1 y1 x2 y2 x3 y3]; de tynde er rette linjer.
  const gange = [[x0 - 3, fod, x0 - 8, lerp(fod, kd, .5), x0 + 6, lerp(fod, kd, .6), kamre[0][0], kamre[0][1]]];
  if (island) gange.push([x0 + 4, fod, x0 + 10, lerp(fod, kamre[1][1], .5), kamre[1][0], kamre[1][1] + H * .04, kamre[1][0], kamre[1][1]]);
  const spalter = kamre.map(([x, y]) => {
    const topX = x + (x < x0 ? 4 : -4);
    return [x, y, topX, overflade(topX)];
  });

  return { smal, g, kappekurver, kamre, fod, gange, spalter };
}

const kvadratisk = ([sx, sy, cx, cy, ex, ey], u) => [
  (1 - u) ** 2 * sx + 2 * (1 - u) * u * cx + u * u * ex,
  (1 - u) ** 2 * sy + 2 * (1 - u) * u * cy + u * u * ey
];
const kubisk = ([a, b, c, d, e, g, h, i], u) => {
  const v = 1 - u;
  return [v ** 3 * a + 3 * v * v * u * c + 3 * v * u * u * e + u ** 3 * h, v ** 3 * b + 3 * v * v * u * d + 3 * v * u * u * g + u ** 3 * i];
};
const toning = u => Math.min(1, u * 6, (1 - u) * 6);
const laengde = (fn, n = 24) => {
  let l = 0, [x, y] = fn(0);
  for (let i = 1; i <= n; i++) { const [x2, y2] = fn(i / n); l += Math.hypot(x2 - x, y2 - y); [x, y] = [x2, y2]; }
  return l;
};

function kurve(fra, til, fn, trin = 60) {
  let s = '';
  for (let i = 0; i <= trin; i++) {
    const x = fra + (til - fra) * i / trin;
    s += `${i ? 'L' : 'M'}${f(x)} ${f(fn(x))}`;
  }
  return s;
}
const tilbage = (fra, til, fn, trin = 60) => kurve(til, fra, fn, trin).replace(/^M/, 'L');

function etiket(x, y, tekst, { anker = 'start', klasse = '', maerke = '' } = {}) {
  const linjer = tekst.split('\n');
  const tsp = linjer.map((l, i) => `<tspan x="${f(x)}" dy="${i ? '1.2em' : 0}">${l}</tspan>`).join('');
  const m = maerke ? `<tspan x="${f(x)}" dy="1.25em" class="maerke">${maerke}</tspan>` : '';
  return `<text x="${f(x)}" y="${f(y)}" text-anchor="${anker}" class="etiket ${klasse}">${tsp}${m}</text>`;
}

function pil(x1, y1, x2, y2, klasse) {
  return `<path d="M${f(x1)} ${f(y1)}L${f(x2)} ${f(y2)}" class="${klasse}" marker-end="url(#pilhoved-${klasse})"/>`;
}

// Det, der bevæger sig. `tid` i sekunder; `spor` viser kappens og magmaens
// sporpunkter (kun når animationen er sat i gang, så den statiske figur er rolig).
export function bevaegelse({ bredde: W, hoejde: H, tilstand, tid = 0, spor = false }) {
  const island = tilstand === 'island';
  const { g, kappekurver, gange, spalter } = former(W, H, island);
  const { x0, pladebund } = g;

  // Pladerne og den nye skorpe føres væk fra ryggen: lyse bånd, der dannes
  // ved ryggen og flytter sig lige hurtigt til begge sider.
  const b = W * .03, forskud = rest(FART.plade * W * tid, 2 * b);
  let baand = '';
  for (const s of [-1, 1]) for (let a = forskud - 2 * b; a < W / 2; a += 2 * b) {
    const fra = Math.max(0, a), til = Math.min(W / 2, a + b);
    if (til <= fra) continue;
    const x = s < 0 ? x0 - til : x0 + fra;
    baand += `<rect x="${f(x)}" y="0" width="${f(til - fra)}" height="${H}"/>`;
  }

  // Dråber dannes i forskellig højde i smeltezonen og stiger op mod ryggen.
  // Fordi nogle dannes dybt og andre højt, er der flest dråber øverst.
  const tilf = tilfaeldig(island ? 4242 : 1717);
  const sb = g.smeltebredde, st = g.smeltetop, ys = g.smeltestart;
  const bund = ys - H * .02, top = pladebund(x0) + H * .02;
  let draaber = '';
  for (let i = 0, n = island ? 46 : 22; i < n; i++) {
    const foedt = tilf() * .9, side = tilf() * 2 - 1, fase = tilf();
    const vej = 1 - foedt;
    const p = foedt + rest(fase * vej + FART.draabe * tid, vej);
    const y = lerp(bund, top, p);
    const andel = (ys - y) / (ys - pladebund(x0));
    const x = x0 + side * lerp(sb, st, Math.min(1, Math.max(0, andel))) * .85;
    const synlig = Math.min(1, (p - foedt) * 12 + (tid ? 0 : 1));
    draaber += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(1.6 + 1.6 * p)}"${synlig < 1 ? ` opacity="${f(synlig)}"` : ''}/>`;
  }

  let kappe = '', magma = '';
  if (spor) {
    for (const k of kappekurver) for (let i = 0; i < 3; i++) {
      const u = rest(i / 3 + FART.kappe * tid, 1);
      const [x, y] = kvadratisk(k, u);
      kappe += `<circle cx="${f(x)}" cy="${f(y)}" r="3.2" opacity="${f(toning(u))}"/>`;
    }
    for (const k of gange) for (let i = 0; i < 2; i++) {
      const u = rest(i / 2 + FART.gang * H * tid / laengde(u => kubisk(k, u)), 1);
      const [x, y] = kubisk(k, u);
      magma += `<circle cx="${f(x)}" cy="${f(y)}" r="2.6" opacity="${f(toning(u))}"/>`;
    }
    for (const [x1, y1, x2, y2] of spalter) {
      const u = rest(.3 + FART.gang * H * tid / Math.hypot(x2 - x1, y2 - y1), 1);
      magma += `<circle cx="${f(lerp(x1, x2, u))}" cy="${f(lerp(y1, y2, u))}" r="2" opacity="${f(toning(u))}"/>`;
    }
  }
  return { plader: spor ? baand : '', skorpe: spor ? baand : '', smelt: draaber, kappe, magma };
}

// Pladsholdere, som animationen fylder ud billede for billede.
const anim = (navn, indhold, ekstra = '') => `<g data-anim="${navn}"${ekstra}>${indhold}</g>`;

export function tegnTvaersnit({ bredde: W, hoejde: H, tilstand, hotspot = true, skjul = new Set(), tid = 0, spor = false }) {
  const island = tilstand === 'island';
  const vis = lag => !skjul.has(lag);
  const { smal, g, kappekurver, kamre, gange, spalter } = former(W, H, island);
  const { x0, hav, overflade, skorpebund, pladebund } = g;
  const b = bevaegelse({ bredde: W, hoejde: H, tilstand, tid, spor });

  // Lag nedefra og op, så de øverste dækker grænserne pænt.
  // Kappen begynder ved havoverfladen, så luften er tom, når blokken drejes.
  const kappe = `<rect x="0" y="${f(hav)}" width="${W}" height="${f(H - hav)}" class="kappe-flade"/>`;
  const pladeform = `${kurve(0, W, overflade)}${tilbage(0, W, pladebund)}Z`;
  const skorpeform = `${kurve(0, W, overflade)}${tilbage(0, W, skorpebund)}Z`;
  const plade = `<path d="${pladeform}" class="plade-flade"/>`;
  const skorpe = `<path d="${skorpeform}" class="skorpe-flade"/>`;
  const havflade = `<path d="M0 ${f(hav)}H${W}${tilbage(0, W, overflade)}Z" class="hav-flade"/>`;
  const luft = `<rect x="0" y="0" width="${W}" height="${f(hav)}" class="luft-flade"/>`;

  // Hotspot: bred søjle af ekstra varm kappe med stiplet (usikker) kant.
  const hb = W * (smal ? .15 : .12), htop = g.smeltestart - H * .05;
  const hotspotlag = island && hotspot && vis('hotspot') ? `<g data-lag="hotspot">
      <path d="M${f(x0 - hb)} ${H + 2}C${f(x0 - hb)} ${f(htop + H * .04)} ${f(x0 - hb * .7)} ${f(htop)} ${f(x0)} ${f(htop)}C${f(x0 + hb * .7)} ${f(htop)} ${f(x0 + hb)} ${f(htop + H * .04)} ${f(x0 + hb)} ${H + 2}Z" class="hotspot-flade"/>
      ${etiket(x0, Math.min(g.smeltestart + H * .075, H - (W < 800 ? 50 : 30)), W < 800 ? 'Hotspot' : 'Hotspot: ekstra varm kappe', { anker: 'middle', klasse: 'midt', maerke: 'Fortolkning' })}
    </g>` : '';

  // Kappen stiger langsomt op mod ryggen (pile med hoved opad).
  const kappepile = kappekurver.map(([sx, sy, cx, cy, ex, ey]) =>
    `<path d="M${f(sx)} ${f(sy)}Q${f(cx)} ${f(cy)} ${f(ex)} ${f(ey)}" class="kappepil" marker-end="url(#pilhoved-kappepil)"/>`).join('');

  // Smeltezonen: fra smeltestarten op til pladernes bund under ryggen.
  const sb = g.smeltebredde, st = g.smeltetop, ys = g.smeltestart;
  const topV = pladebund(x0 - st), topH = pladebund(x0 + st);
  const smeltezone = `M${f(x0 - st)} ${f(topV)}Q${f(x0)} ${f(pladebund(x0) - 2)} ${f(x0 + st)} ${f(topH)}L${f(x0 + sb)} ${f(ys)}Q${f(x0)} ${f(ys + H * .03)} ${f(x0 - sb)} ${f(ys)}Z`;
  const smeltlag = vis('smelt') ? `<g data-lag="smelt">
      <path d="${smeltezone}" class="smelte-flade"/>
      ${anim('smelt', b.smelt, ' class="draaber"')}
      <path d="M${f(x0 - sb - 12)} ${f(ys)}H${f(x0 + sb + 12)}" class="smeltestart"/>
      ${etiket(x0 + sb + 16, ys + 4, smal ? 'Smeltningen\nbegynder' : 'Her begynder\nsmeltningen', { klasse: 'lille' })}
      ${etiket(x0, lerp(pladebund(x0), ys, .62), 'Delvis\nsmeltning', { anker: 'middle', klasse: 'midt', maerke: 'Model' })}
    </g>` : '';

  // Magmaens vej: gange op gennem pladen til magmakamre og ud i riftzonen.
  let magma = gange.map(([a, c, d, e, h, i, j, k]) => `<path d="M${f(a)} ${f(c)}C${f(d)} ${f(e)} ${f(h)} ${f(i)} ${f(j)} ${f(k)}" class="gang"/>`).join('');
  for (const [x1, y1, x2, y2] of spalter) magma += `<path d="M${f(x1)} ${f(y1)}L${f(x2)} ${f(y2)}" class="gang tynd"/>`;
  for (const [x, y, rx, ry] of kamre) magma += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rx)}" ry="${f(ry)}" class="kammer"/>`;
  magma += anim('magma', b.magma, ' class="magmaspor"');
  if (island) {
    // En spalte og en lille vulkan i riftzonen.
    const [, , vx, vy] = spalter[spalter.length - 1];
    magma += `<path d="M${f(vx - W * .025)} ${f(vy + 1)}L${f(vx)} ${f(vy - H * .016)}L${f(vx + W * .025)} ${f(vy + 1)}Z" class="vulkan"/>`;
    magma += `<path d="M${f(vx)} ${f(vy)}v${f(-H * .016)}l${f(W * .019)} ${f(H * .014)}" class="lava"/>`;
  }
  const [kx, ky, krx] = kamre[kamre.length - 1];
  const kammerEtiket = island
    ? (smal
      ? `<path d="M${f(kx + krx)} ${f(ky)}L${f(W * .68)} ${f(skorpebund(x0) + H * .018)}" class="henvisning"/>` + etiket(W * .68, skorpebund(x0) + H * .045, 'Magma-\nkamre', { klasse: 'lille' })
      : etiket(kx + krx + 8, ky + 4, 'Magmakamre', { klasse: 'lille' }))
    : `<path d="M${f(x0 + W * .065)} ${f(skorpebund(x0 + W * .07) + H * .03)}L${f(kx + krx)} ${f(ky + 2)}" class="henvisning"/>` +
      etiket(x0 + W * .07, skorpebund(x0 + W * .07) + H * .045, 'Magmakammer', { klasse: 'lille' });
  const magmalag = vis('magma') ? `<g data-lag="magma">${magma}${kammerEtiket}</g>` : '';

  // Pladernes bevægelse: pile i lithosfæren, hver sin vej.
  const pa = W * (smal ? .3 : .27), pl = W * (smal ? .12 : .1);
  const py = x => lerp(skorpebund(x), pladebund(x), .5);
  const pladelag = vis('plader') ? `<g data-lag="plader">
      ${pil(x0 - pa + pl / 2, py(x0 - pa), x0 - pa - pl / 2, py(x0 - pa), 'pladepil')}
      ${pil(x0 + pa - pl / 2, py(x0 + pa), x0 + pa + pl / 2, py(x0 + pa), 'pladepil')}
      ${etiket(RAND, 18, smal ? '← Vest\nNordamerikanske\nplade' : '← Vest\nNordamerikanske plade', { klasse: 'plade', maerke: 'Målt' })}
      ${etiket(W - RAND, 18, smal ? 'Øst →\nEurasiske\nplade' : 'Øst →\nEurasiske plade', { anker: 'end', klasse: 'plade', maerke: 'Målt' })}
    </g>` : '';

  // Ny skorpe føres væk fra ryggen: små pile og alder i skorpen.
  const sy = x => lerp(overflade(x), skorpebund(x), .55);
  const sp = W * (island ? (smal ? .2 : .25) : .14);
  const skorpelag = vis('skorpe') ? `<g data-lag="skorpe">
      ${pil(x0 - sp + 14, sy(x0 - sp), x0 - sp - 14, sy(x0 - sp), 'skorpepil')}
      ${pil(x0 + sp - 14, sy(x0 + sp), x0 + sp + 14, sy(x0 + sp), 'skorpepil')}
      ${island && !smal ? etiket(x0 - sp - 22, sy(x0 - sp) + 4, 'ældre', { anker: 'end', klasse: 'lille' }) + etiket(x0 + sp + 22, sy(x0 + sp) + 4, 'ældre', { klasse: 'lille' }) : ''}
    </g>` : '';

  // Pladegrænsen i overfladen: samme røde dobbeltlinje som på globussen.
  const gy = overflade(x0);
  const graense = vis('plader') ? `<g data-lag="graense">
      <path d="M${f(x0)} ${f(gy - H * .055)}V${f(gy - 3)}" class="graense-ydre"/><path d="M${f(x0)} ${f(gy - H * .055)}V${f(gy - 3)}" class="graense-indre"/>
      ${etiket(x0, gy - H * .055 - 6, island ? 'Riftzone' : 'Ryggen', { anker: 'middle', klasse: 'lille' })}
    </g>` : '';

  // Lagnavne i venstre side; et skjult lag mister også sit navn.
  const lx = RAND, mx = W * (smal ? .04 : .05);
  const ky2 = Math.max(pladebund(mx) + 26, H * .62);
  const lagnavne = `<g data-lag="navne">
      ${vis('overflade') ? etiket(lx, hav + (island ? 16 : Math.min(16, (overflade(mx) - hav) / 2 + 5)), 'Hav', { klasse: 'lille' }) : ''}
      ${vis('skorpe') ? etiket(lx, lerp(overflade(mx), skorpebund(mx), .5) + 5, 'Skorpe', { klasse: 'lille lagnavn' }) : ''}
      ${vis('plader') ? etiket(lx, lerp(skorpebund(mx), pladebund(mx), .45) + 5, 'Stiv kappe', { klasse: 'lille lagnavn' }) : ''}
      ${vis('kappe') ? etiket(lx, ky2, 'Kappe under pladerne', { klasse: 'lille lagnavn' }) + etiket(lx, ky2 + 17, smal ? 'fast sten,\nder flyder\nlangsomt' : 'fast sten, der\nflyder langsomt', { klasse: 'lille note' }) : ''}
      ${island && vis('overflade') ? etiket(x0 - g.kyst * .55, overflade(x0 - g.kyst * .55) - 8, 'Island', { anker: 'middle', klasse: 'lille' }) : ''}
      ${island && vis('skorpe') && !smal ? etiket(x0 - W * .13, lerp(overflade(x0 - W * .13), skorpebund(x0 - W * .13), .6), 'Tyk skorpe', { anker: 'end', klasse: 'lille', maerke: 'Målt' }) : ''}
    </g>`;

  return `<defs>
      ${['pladepil', 'kappepil', 'skorpepil'].map(k => `<marker id="pilhoved-${k}" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="${k === 'pladepil' ? 4 : 5}" markerHeight="${k === 'pladepil' ? 4 : 5}" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" class="hoved-${k}"/></marker>`).join('')}
      <linearGradient id="hotspotfarve" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ff6a3d" stop-opacity=".55"/><stop offset="1" stop-color="#ff6a3d" stop-opacity=".15"/></linearGradient>
      <linearGradient id="havfarve" x2="0" y2="1"><stop stop-color="#d3eef5"/><stop offset="1" stop-color="#8fc4d9"/></linearGradient>
      <linearGradient id="skorpefarve" x2="0" y2="1"><stop stop-color="#637b78"/><stop offset="1" stop-color="#435c5d"/></linearGradient>
      <linearGradient id="pladefarve" x2="0" y2="1"><stop stop-color="#c0b195"/><stop offset="1" stop-color="#a99476"/></linearGradient>
      <linearGradient id="kappefarve" x2="0" y2="1"><stop stop-color="#f0e3c7"/><stop offset="1" stop-color="#dfc69f"/></linearGradient>
      <clipPath id="pladeklip"><path d="${pladeform}"/></clipPath>
      <clipPath id="skorpeklip"><path d="${skorpeform}"/></clipPath>
    </defs>
    ${vis('kappe') ? `<g data-lag="kappe">${kappe}</g>` : ''}
    ${hotspotlag}
    ${vis('kappe') ? `<g data-lag="kappe">${kappepile}${anim('kappe', b.kappe, ' class="kappespor"')}</g>` : ''}
    ${vis('plader') ? `<g data-lag="plader">${plade}${anim('plader', b.plader, ' class="baand" clip-path="url(#pladeklip)"')}</g>` : ''}
    ${smeltlag}
    ${vis('overflade') ? `<g data-lag="overflade">${luft}${havflade}</g>` : ''}
    ${vis('skorpe') ? `<g data-lag="skorpe">${skorpe}${anim('skorpe', b.skorpe, ' class="baand" clip-path="url(#skorpeklip)"')}</g>` : ''}
    ${vis('overflade') ? `<g data-lag="overflade"><path d="M0 ${f(hav)}H${W}" class="havniveau"/><path d="${kurve(0, W, overflade)}" class="overflade-linje"/></g>` : ''}
    ${magmalag}
    ${skorpelag}
    ${pladelag}
    ${graense}
    ${lagnavne}`;
}
