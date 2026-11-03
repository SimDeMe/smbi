// Tegnehjælp til figurerne i «Byg cellen». Alt returnerer SVG som tekst.
// Farverne er de færdige farver; motoren laver selv den grå udgave.

const r1 = (v) => Math.round(v * 10) / 10;

/** Lukket, blød kurve gennem punkterne (Catmull-Rom → Bézier). */
export function glat(punkter) {
  const n = punkter.length;
  let d = `M${r1(punkter[0][0])} ${r1(punkter[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = punkter[(i - 1 + n) % n], p1 = punkter[i];
    const p2 = punkter[(i + 1) % n], p3 = punkter[(i + 2) % n];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${r1(c1[0])} ${r1(c1[1])} ${r1(c2[0])} ${r1(c2[1])} ${r1(p2[0])} ${r1(p2[1])}`;
  }
  return d + 'Z';
}

/** En let ujævn ellipse — en celle er sjældent helt rund. */
export function klat(cx, cy, rx, ry, bulk = [[3, 0.03, 0.4], [5, 0.018, 1.3]], n = 48) {
  const p = [];
  for (let i = 0; i < n; i++) {
    const v = (i / n) * Math.PI * 2;
    let f = 1;
    for (const [k, a, fase] of bulk) f += a * Math.sin(k * v + fase);
    p.push([cx + rx * f * Math.cos(v), cy + ry * f * Math.sin(v)]);
  }
  return glat(p);
}

/** Punkt på ellipsen (grader, 0 = højre, 90 = ned). */
export function paaEllipse(cx, cy, rx, ry, grader) {
  const v = (grader * Math.PI) / 180;
  return [cx + rx * Math.cos(v), cy + ry * Math.sin(v)];
}

/** En bue af en ellipse fra vinkel a til b (grader). */
export function bue(cx, cy, rx, ry, a, b) {
  const [x1, y1] = paaEllipse(cx, cy, rx, ry, a);
  const [x2, y2] = paaEllipse(cx, cy, rx, ry, b);
  const stor = Math.abs(b - a) > 180 ? 1 : 0;
  return `M${r1(x1)} ${r1(y1)} A${rx} ${ry} 0 ${stor} 1 ${r1(x2)} ${r1(y2)}`;
}

/** Mitokondrie: aflang med indre folder (cristae). */
export function mitokondrie(x, y, grader = 0, l = 88, h = 42) {
  const hl = l / 2, hh = h / 2;
  // folderne skiftevis fra over- og underkant
  let folder = '';
  const n = 5;
  for (let i = 0; i < n; i++) {
    const fx = -hl + 14 + (i * (l - 28)) / (n - 1);
    const fra = i % 2 ? hh - 4 : -hh + 4;
    const til = i % 2 ? -hh * 0.25 : hh * 0.25;
    folder += `M${r1(fx)} ${r1(fra)} L${r1(fx)} ${r1(til)} `;
  }
  return `<g transform="translate(${x} ${y}) rotate(${grader})">
    <rect x="${-hl}" y="${-hh}" width="${l}" height="${h}" rx="${hh}" fill="#FFB59E" stroke="#C93E22" stroke-width="3"/>
    <rect x="${-hl + 5}" y="${-hh + 5}" width="${l - 10}" height="${h - 10}" rx="${hh - 5}" fill="#FFD3C4" stroke="#C93E22" stroke-width="1.6"/>
    <path d="${folder}" stroke="#C93E22" stroke-width="3.2" stroke-linecap="round" fill="none"/>
  </g>`;
}

/** Kloroplast: grøn, aflang, med stakke af thylakoider (grana). */
export function kloroplast(x, y, grader = 0, l = 78, h = 36) {
  const hl = l / 2, hh = h / 2;
  let grana = '';
  const n = 4;
  for (let i = 0; i < n; i++) {
    const gx = -hl + 15 + (i * (l - 30)) / (n - 1);
    for (let j = 0; j < 3; j++) {
      grana += `<rect x="${r1(gx - 5)}" y="${r1(-7 + j * 5)}" width="10" height="3.6" rx="1.5" fill="#1F5E24"/>`;
    }
  }
  return `<g transform="translate(${x} ${y}) rotate(${grader})">
    <ellipse rx="${hl}" ry="${hh}" fill="#86CB6C" stroke="#2C7A30" stroke-width="3"/>
    <path d="M${-hl + 14} 1 H${hl - 14}" stroke="#2C7A30" stroke-width="1.6"/>
    ${grana}
  </g>`;
}

/** Små prikker (ribosomer) i en klynge omkring et punkt. */
export function ribosomer(punkter, r = 4.2, farve = '#24306E') {
  return punkter.map(([x, y]) => `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r}" fill="${farve}"/>`).join('');
}

/** Ribosomer jævnt fordelt langs en ellipsebue (til ru ER). */
export function ribosomerPaaBue(cx, cy, rx, ry, a, b, n, r = 3.8) {
  const p = [];
  for (let i = 0; i < n; i++) p.push(paaEllipse(cx, cy, rx, ry, a + ((b - a) * (i + 0.5)) / n));
  return ribosomer(p, r);
}

/** En bølget linje fra (x1,y1) til (x2,y2) — glat ER, flagel, kromosom. */
export function boelge(x1, y1, x2, y2, amp, perioder, trin = 40) {
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy);
  const nx = -dy / L, ny = dx / L;
  let d = '';
  for (let i = 0; i <= trin; i++) {
    const t = i / trin;
    const s = amp * Math.sin(t * perioder * Math.PI * 2);
    const x = x1 + dx * t + nx * s, y = y1 + dy * t + ny * s;
    d += (i ? ' L' : 'M') + r1(x) + ' ' + r1(y);
  }
  return d;
}
