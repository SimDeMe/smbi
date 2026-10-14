// 3D-blokdiagram af tværsnittet (#49, milepæl C).
// Forsiden er selve SVG-tværsnittet; oversiden og siderne er tegnet ud fra
// samme geometri og sat sammen med CSS 3D. Intet WebGL: uden CSS 3D (eller
// i 2D) vises forsiden alene som almindelig figur.
//
// Blokken er et skematisk stykke af ryggen: oversiden viser havet, ryggen og
// pladernes bevægelse set ovenfra (nord væk fra beskueren), siderne viser, at
// lagene fortsætter langs ryggen. Ingen målfaste afstande eller stedfaste data.

import { geometri } from './tvaersnit.js';

const f = n => Math.round(n * 10) / 10;

export const GRAENSER = { drej: [-60, 60], hæld: [0, 45] };
export const STANDARD = { drej: -28, hæld: 20 };

export const kanTreD = () => typeof CSS !== 'undefined' && CSS.supports?.('transform-style', 'preserve-3d');

export const dybde = (W, H) => Math.round(Math.min(W * .45, H * 1.1));

// Oversiden, set ovenfra. y = D er forkanten (mod beskueren, syd), y = 0 er nord.
export function tegnOverside({ bredde: W, hoejde: H, tilstand, skjul = new Set() }) {
  const D = dybde(W, H), island = tilstand === 'island';
  const g = geometri(W, H, island);
  const x0 = g.x0;
  let land = '';
  if (island) {
    // Kystlinjen ved forkanten er den samme som i tværsnittet; længere væk
    // runder landet skematisk af. Ikke Islands rigtige omrids.
    let v = x0, h = x0;
    while (v > 0 && g.overflade(v) < g.hav) v -= 2;
    while (h < W && g.overflade(h) < g.hav) h += 2;
    const l = D * .72, r = (h - v) / 2;
    const y = n => f(D - n);
    land = `<path d="M${f(v)} ${D}L${f(v)} ${y(l - r * .6)}C${f(v)} ${y(l + r * .25)} ${f(h)} ${y(l + r * .25)} ${f(h)} ${y(l - r * .6)}L${f(h)} ${D}Z" class="land-flade"/>`;
  }
  const vis = lag => !skjul.has(lag);
  const pa = W * .27, pl = W * .1, py = D * .5;
  return `<defs><marker id="pilhoved-top" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" class="hoved-pladepil"/></marker></defs>
    ${vis('overflade') ? `<g data-lag="overflade"><rect width="${W}" height="${D}" class="hav-flade top"/>${land}
      ${island ? `<text x="${f(x0 - W * .12)}" y="${f(D * .65)}" text-anchor="middle" class="etiket lille">Island</text>` : ''}
      <text x="${f(W - 12)}" y="22" text-anchor="end" class="etiket lille">Hav</text></g>` : ''}
    ${vis('plader') ? `<g data-lag="graense"><path d="M${f(x0)} 0V${D}" class="graense-ydre"/><path d="M${f(x0)} 0V${D}" class="graense-indre"/></g>
    <g data-lag="plader">
      <path d="M${f(x0 - pa + pl / 2)} ${f(py)}L${f(x0 - pa - pl / 2)} ${f(py)}" class="pladepil" marker-end="url(#pilhoved-top)"/>
      <path d="M${f(x0 + pa - pl / 2)} ${f(py)}L${f(x0 + pa + pl / 2)} ${f(py)}" class="pladepil" marker-end="url(#pilhoved-top)"/>
    </g>` : ''}
    <g data-lag="navne"><text x="${f(x0 + 12)}" y="24" class="etiket lille">↑ Nord</text></g>`;
}

// En side af blokken: et snit langs ryggen ved figurens kant. Lagene ligger
// vandret, fordi blokken er et skematisk stykke af en lang ryg.
export function tegnSide({ bredde: W, hoejde: H, tilstand, side, skjul = new Set() }) {
  const D = dybde(W, H), g = geometri(W, H, tilstand === 'island');
  const x = side === 'oest' ? W : 0;
  const o = g.overflade(x), s = g.skorpebund(x), p = g.pladebund(x);
  const vis = lag => !skjul.has(lag);
  const baand = (y1, y2, klasse) => `<rect x="0" y="${f(y1)}" width="${D}" height="${f(y2 - y1)}" class="${klasse}"/>`;
  return `${vis('kappe') ? `<g data-lag="kappe">${baand(p, H, 'kappe-flade')}</g>` : ''}
    ${vis('plader') ? `<g data-lag="plader">${baand(s, p, 'plade-flade')}</g>` : ''}
    ${vis('skorpe') ? `<g data-lag="skorpe">${baand(o, s, 'skorpe-flade')}</g>` : ''}
    ${vis('overflade') && o > g.hav ? `<g data-lag="overflade">${baand(g.hav, o, 'hav-flade')}</g>` : ''}
    <rect x="0" y="${f(g.hav)}" width="${D}" height="${f(H - g.hav)}" class="sidekant"/>`;
}

// CSS-transformationen for en given drejning. Blokkens hjørner projiceres
// med samme perspektiv som browseren, så skala og forskydning altid får hele
// blokken til at passe i figuren og stå midt i den. `bund` holder et stykke
// forneden fri til drejeknapper og mærker.
export function transformation({ bredde: W, hoejde: H, drej, hæld, bund = 0 }) {
  const D = dybde(W, H), r = Math.PI / 180;
  const P = Math.round(Math.max(W, H) * 2.4), px = W / 2, py = H * .45;
  const cx = W / 2, cy = H / 2, cz = -D / 2;
  const [sa, ca, sb, cb] = [Math.sin(drej * r), Math.cos(drej * r), Math.sin(-hæld * r), Math.cos(-hæld * r)];
  const hjoerner = [];
  for (const x of [0, W]) for (const y of [0, H]) for (const z of [0, -D]) hjoerner.push([x - cx, y - cy, z - cz]);
  const kasse = (s, ty) => {
    let [v, o, h, n] = [Infinity, Infinity, -Infinity, -Infinity];
    for (const [x, y, z] of hjoerner) {
      const x1 = x * ca + z * sa, z1 = -x * sa + z * ca;
      const y2 = y * cb - z1 * sb, z2 = y * sb + z1 * cb;
      // scale() i CSS er todimensional: x og y skaleres, dybden z gør ikke.
      const X = cx + s * x1, Y = cy + s * y2 + ty, Z = cz + z2;
      const k = P / (P - Z);
      const sxp = px + (X - px) * k, syp = py + (Y - py) * k;
      v = Math.min(v, sxp); h = Math.max(h, sxp); o = Math.min(o, syp); n = Math.max(n, syp);
    }
    return { v, o, h, n };
  };
  let s = 1, ty = 0;
  for (let i = 0; i < 4; i++) {
    const k = kasse(s, ty);
    s *= Math.min(W * .94 / (k.h - k.v), (H - bund) * .92 / (k.n - k.o));
    const k2 = kasse(s, ty);
    ty += (H - bund) / 2 - (k2.o + k2.n) / 2;
  }
  return {
    oprindelse: `50% 50% ${f(cz)}px`,
    transform: `translateY(${f(ty)}px) scale(${s.toFixed(3)}) rotateX(${-hæld}deg) rotateY(${f(drej)}deg)`,
    perspektiv: P,
    dybde: D
  };
}

export const begraens = (v, [a, b]) => Math.max(a, Math.min(b, v));
