// Statisk, skematisk tværsnit på tværs af Den Midtatlantiske Ryg (#49, milepæl B).
// Figuren er tegnet efter ISLAND-MODEL.md afsnit 4. Alle mål er skematiske:
// kun rækkefølgen og forholdet mellem de to tilstande er faglige påstande
// (Island: tykkere skorpe, dybere smeltestart, mere magma, land over havet).
// Der står bevidst ingen tal i figuren, før referencerne er slået op.

const RAND = 10;

const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const f = n => Math.round(n * 10) / 10;

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
    return lerp(hav - H * .035, hav + H * (.03 + .04 * Math.sqrt(r)), t) + riftdal(x);
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

export function tegnTvaersnit({ bredde: W, hoejde: H, tilstand, hotspot = true }) {
  const island = tilstand === 'island';
  const smal = W < 560;
  const g = geometri(W, H, island);
  const { x0, hav, overflade, skorpebund, pladebund } = g;
  const tilf = tilfaeldig(island ? 4242 : 1717);

  // Lag nedefra og op, så de øverste dækker grænserne pænt.
  const kappe = `<rect x="0" y="0" width="${W}" height="${H}" class="kappe-flade"/>`;
  const plade = `<path d="${kurve(0, W, overflade)}${tilbage(0, W, pladebund)}Z" class="plade-flade"/>`;
  const skorpe = `<path d="${kurve(0, W, overflade)}${tilbage(0, W, skorpebund)}Z" class="skorpe-flade"/>`;
  const havflade = `<path d="M0 ${f(hav)}H${W}${tilbage(0, W, overflade)}Z" class="hav-flade"/>`;
  const luft = `<rect x="0" y="0" width="${W}" height="${f(hav)}" class="luft-flade"/>`;

  // Hotspot: bred søjle af ekstra varm kappe med stiplet (usikker) kant.
  const hb = W * (smal ? .15 : .12), htop = g.smeltestart - H * .05;
  const hotspotlag = island && hotspot ? `<g data-lag="hotspot">
      <path d="M${f(x0 - hb)} ${H + 2}C${f(x0 - hb)} ${f(htop + H * .04)} ${f(x0 - hb * .7)} ${f(htop)} ${f(x0)} ${f(htop)}C${f(x0 + hb * .7)} ${f(htop)} ${f(x0 + hb)} ${f(htop + H * .04)} ${f(x0 + hb)} ${H + 2}Z" class="hotspot-flade"/>
      ${etiket(x0, Math.min(g.smeltestart + H * .075, H - (W < 800 ? 50 : 30)), W < 800 ? 'Hotspot' : 'Hotspot: ekstra varm kappe', { anker: 'middle', klasse: 'midt', maerke: 'Fortolkning' })}
    </g>` : '';

  // Kappen stiger langsomt op mod ryggen (pile med hoved opad).
  let kappepile = '';
  for (const s of [-1, 1]) for (const k of smal ? [0, 2] : [0, 1, 2]) {
    const sx = x0 + s * W * (.13 + .12 * k), sy = H - 8;
    const ex = x0 + s * W * (.025 + .035 * k), ey = pladebund(ex) + H * (.07 + .02 * k);
    const cx = x0 + s * W * (.09 + .07 * k), cy = lerp(sy, ey, .45);
    kappepile += `<path d="M${f(sx)} ${f(sy)}Q${f(cx)} ${f(cy)} ${f(ex)} ${f(ey)}" class="kappepil" marker-end="url(#pilhoved-kappepil)"/>`;
  }

  // Smeltezonen: fra smeltestarten op til pladernes bund under ryggen.
  const sb = g.smeltebredde, st = g.smeltetop, ys = g.smeltestart;
  const topV = pladebund(x0 - st), topH = pladebund(x0 + st);
  const smeltezone = `M${f(x0 - st)} ${f(topV)}Q${f(x0)} ${f(pladebund(x0) - 2)} ${f(x0 + st)} ${f(topH)}L${f(x0 + sb)} ${f(ys)}Q${f(x0)} ${f(ys + H * .03)} ${f(x0 - sb)} ${f(ys)}Z`;
  let draaber = '';
  const antal = island ? 46 : 22;
  for (let i = 0; i < antal; i++) {
    // Flere dråber højt oppe: smeltningen tiltager, mens kappen stiger.
    const v = Math.sqrt(tilf());
    const y = lerp(ys - H * .02, pladebund(x0) + H * .02, v);
    const andel = (ys - y) / (ys - pladebund(x0));
    const b = lerp(sb, st, andel) * .85;
    const x = x0 + (tilf() * 2 - 1) * b;
    draaber += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(1.6 + 1.6 * v)}"/>`;
  }
  const smeltlag = `<g data-lag="smelt">
      <path d="${smeltezone}" class="smelte-flade"/>
      <g class="draaber">${draaber}</g>
      <path d="M${f(x0 - sb - 12)} ${f(ys)}H${f(x0 + sb + 12)}" class="smeltestart"/>
      ${etiket(x0 + sb + 16, ys + 4, smal ? 'Smeltningen\nbegynder' : 'Her begynder\nsmeltningen', { klasse: 'lille' })}
      ${etiket(x0, lerp(pladebund(x0), ys, .62), 'Her smelter\nstenen', { anker: 'middle', klasse: 'midt', maerke: 'Model' })}
    </g>`;

  // Magmaens vej: gange op gennem pladen til magmakamre og ud i riftzonen.
  const kd = island ? lerp(overflade(x0), skorpebund(x0), .3) : lerp(overflade(x0), skorpebund(x0), .55);
  const kamre = island
    ? [[x0 - W * .03, kd, W * .035, H * .018], [x0 + W * .045, kd + H * .045, W * .03, H * .016]]
    : [[x0, kd, W * .018, H * .009]];
  const fod = pladebund(x0) + H * .03;
  let magma = `<path d="M${f(x0 - 3)} ${f(fod)}C${f(x0 - 8)} ${f(lerp(fod, kd, .5))} ${f(x0 + 6)} ${f(lerp(fod, kd, .6))} ${f(kamre[0][0])} ${f(kamre[0][1])}" class="gang"/>`;
  if (island) magma += `<path d="M${f(x0 + 4)} ${f(fod)}C${f(x0 + 10)} ${f(lerp(fod, kamre[1][1], .5))} ${f(kamre[1][0])} ${f(kamre[1][1] + H * .04)} ${f(kamre[1][0])} ${f(kamre[1][1])}" class="gang"/>`;
  for (const [x, y] of kamre) magma += `<path d="M${f(x)} ${f(y)}L${f(x + (x < x0 ? 4 : -4))} ${f(overflade(x0 + (x - x0) * .4))}" class="gang tynd"/>`;
  for (const [x, y, rx, ry] of kamre) magma += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rx)}" ry="${f(ry)}" class="kammer"/>`;
  if (island) {
    // En spalte og en lille vulkan i riftzonen.
    const vx = x0 + W * .06, vy = overflade(vx);
    magma += `<path d="M${f(vx - W * .025)} ${f(vy + 1)}L${f(vx)} ${f(vy - H * .03)}L${f(vx + W * .025)} ${f(vy + 1)}Z" class="vulkan"/>`;
    magma += `<path d="M${f(x0 - W * .012)} ${f(overflade(x0 - W * .012) - 1)}l3 -6m4 7l3 -7m4 7l2 -6" class="lava"/>`;
  }
  const [kx, ky, krx] = kamre[kamre.length - 1];
  const kammerEtiket = island
    ? etiket(kx + krx + 8, ky + 4, smal ? 'Magma-\nkamre' : 'Magmakamre', { klasse: 'lille' })
    : `<path d="M${f(x0 + W * .065)} ${f(skorpebund(x0 + W * .07) + H * .03)}L${f(kx + krx)} ${f(ky + 2)}" class="henvisning"/>` +
      etiket(x0 + W * .07, skorpebund(x0 + W * .07) + H * .045, 'Magmakammer', { klasse: 'lille' });
  const magmalag = `<g data-lag="magma">${magma}${kammerEtiket}</g>`;

  // Pladernes bevægelse: pile i lithosfæren, hver sin vej.
  const pa = W * (smal ? .3 : .27), pl = W * (smal ? .12 : .1);
  const py = x => lerp(skorpebund(x), pladebund(x), .5);
  const pladelag = `<g data-lag="plader">
      ${pil(x0 - pa + pl / 2, py(x0 - pa), x0 - pa - pl / 2, py(x0 - pa), 'pladepil')}
      ${pil(x0 + pa - pl / 2, py(x0 + pa), x0 + pa + pl / 2, py(x0 + pa), 'pladepil')}
      ${etiket(RAND, 18, smal ? '← Vest\nNordamerikanske\nplade' : '← Vest\nNordamerikanske plade', { klasse: 'plade', maerke: 'Målt' })}
      ${etiket(W - RAND, 18, smal ? 'Øst →\nEurasiske\nplade' : 'Øst →\nEurasiske plade', { anker: 'end', klasse: 'plade', maerke: 'Målt' })}
    </g>`;

  // Ny skorpe føres væk fra ryggen: små pile og alder i skorpen.
  const sy = x => lerp(overflade(x) - (island ? 0 : 0), skorpebund(x), .55);
  const sp = W * (island ? (smal ? .2 : .25) : .14);
  const skorpelag = `<g data-lag="skorpe">
      ${pil(x0 - sp + 14, sy(x0 - sp), x0 - sp - 14, sy(x0 - sp), 'skorpepil')}
      ${pil(x0 + sp - 14, sy(x0 + sp), x0 + sp + 14, sy(x0 + sp), 'skorpepil')}
      ${island && !smal ? etiket(x0 - sp - 22, sy(x0 - sp) + 4, 'ældre', { anker: 'end', klasse: 'lille' }) + etiket(x0 + sp + 22, sy(x0 + sp) + 4, 'ældre', { klasse: 'lille' }) : ''}
    </g>`;

  // Pladegrænsen i overfladen: samme røde dobbeltlinje som på globussen.
  const gy = overflade(x0);
  const graense = `<g data-lag="graense">
      <path d="M${f(x0)} ${f(gy - H * .055)}V${f(gy - 3)}" class="graense-ydre"/><path d="M${f(x0)} ${f(gy - H * .055)}V${f(gy - 3)}" class="graense-indre"/>
      ${etiket(x0, gy - H * .055 - 6, 'Ryggen', { anker: 'middle', klasse: 'lille' })}
    </g>`;

  // Lagnavne i venstre side.
  const lx = RAND, mx = W * (smal ? .04 : .05);
  const lagnavne = `<g data-lag="navne">
      ${etiket(lx, hav + (island ? 16 : Math.min(16, (overflade(mx) - hav) / 2 + 5)), 'Hav', { klasse: 'lille' })}
      ${etiket(lx, lerp(overflade(mx), skorpebund(mx), .5) + 5, island ? 'Skorpe' : 'Skorpe', { klasse: 'lille lagnavn' })}
      ${etiket(lx, lerp(skorpebund(mx), pladebund(mx), .45) + 5, smal ? 'Lithosfære-\nplade' : 'Lithosfæreplade', { klasse: 'lille lagnavn' })}
      ${etiket(lx, Math.max(pladebund(mx) + 26, H * .62), 'Kappe', { klasse: 'lille lagnavn' })}
      ${etiket(lx, Math.max(pladebund(mx) + 26, H * .62) + 17, smal ? 'fast sten,\nder flyder\nlangsomt' : 'fast sten, der\nflyder langsomt', { klasse: 'lille note' })}
      ${island ? etiket(x0 - g.kyst * .55, overflade(x0 - g.kyst * .55) - 8, 'Island', { anker: 'middle', klasse: 'lille' }) : ''}
      ${island ? etiket(W - lx, lerp(overflade(W - mx), skorpebund(W - mx), .5) + 5, 'Tyk skorpe', { anker: 'end', klasse: 'lille', maerke: 'Målt' }) : ''}
    </g>`;

  return `<defs>
      ${['pladepil', 'kappepil', 'skorpepil'].map(k => `<marker id="pilhoved-${k}" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="${k === 'pladepil' ? 4 : 5}" markerHeight="${k === 'pladepil' ? 4 : 5}" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" class="hoved-${k}"/></marker>`).join('')}
      <linearGradient id="hotspotfarve" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ff6a3d" stop-opacity=".55"/><stop offset="1" stop-color="#ff6a3d" stop-opacity=".15"/></linearGradient>
    </defs>
    <g data-lag="kappe">${kappe}</g>
    ${hotspotlag}
    <g data-lag="kappe">${kappepile}</g>
    <g data-lag="plader">${plade}</g>
    ${smeltlag}
    <g data-lag="overflade">${luft}${havflade}</g>
    <g data-lag="skorpe">${skorpe}</g>
    <g data-lag="overflade"><path d="${kurve(0, W, overflade)}" class="overflade-linje"/></g>
    ${magmalag}
    ${skorpelag}
    ${pladelag}
    ${graense}
    ${lagnavne}`;
}
