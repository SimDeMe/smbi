// Fælles tegnehjælp til «Byg hjertet og kredsløbet». Alt returnerer SVG som tekst.
// Farverne er de færdige farver; motoren laver selv den grå udgave.

export const F = {
  blaek: '#3A2430',
  muskel: '#C8655F', muskelLys: '#E08C80', muskelMoerk: '#8E3640',
  iltfattig: '#7FAEE3', iltfattigLys: '#B9D6F5', iltfattigMoerk: '#2F5E9E',
  iltrig: '#EE7B7B', iltrigLys: '#F8B5AE', iltrigMoerk: '#A1262F',
  klap: '#F7EDD2', klapKant: '#8C7449',
  fedt: '#F6D98A',
};

const r1 = (v) => Math.round(v * 10) / 10;

/** Gradienter, der bruges af flere figurer. Lægges i baggrunden. */
export const defs = `<defs>
  <radialGradient id="hj-muskel" cx="38%" cy="32%" r="78%">
    <stop offset="0" stop-color="${F.muskelLys}"/><stop offset=".55" stop-color="${F.muskel}"/><stop offset="1" stop-color="#A9474C"/>
  </radialGradient>
  <linearGradient id="hj-fattig" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${F.iltfattigLys}"/><stop offset="1" stop-color="${F.iltfattig}"/>
  </linearGradient>
  <linearGradient id="hj-rig" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${F.iltrigLys}"/><stop offset="1" stop-color="${F.iltrig}"/>
  </linearGradient>
  <pattern id="hj-fibre" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(-62)">
    <rect width="10" height="10" fill="#B4505A"/><path d="M0 5H10" stroke="#9A3B47" stroke-width="2.4"/>
  </pattern>
</defs>`;

/** Et blodkar som rør: mørk kant, farvet indre og en lys stribe. Butte ender, så røret kan munde ud i et hulrum. */
export function roer(d, b, farve, kant, lys) {
  return `<path d="${d}" fill="none" stroke="${kant}" stroke-width="${b + 6}" stroke-linejoin="round"/>
    <path d="${d}" fill="none" stroke="${farve}" stroke-width="${b}" stroke-linejoin="round"/>
    <path d="${d}" fill="none" stroke="${lys}" stroke-width="${Math.max(2, b * 0.16)}" stroke-linejoin="round" opacity=".75" transform="translate(${-b * 0.18} ${-b * 0.18})"/>`;
}
export const vene = (d, b) => roer(d, b, F.iltfattig, F.iltfattigMoerk, F.iltfattigLys);
export const arterie = (d, b) => roer(d, b, F.iltrig, F.iltrigMoerk, F.iltrigLys);

/** En lille pil, der viser blodets retning: spids i (x, y), peger i vinklen v (grader, 0 = højre, 90 = ned). */
export function stroemPil(x, y, v, farve = '#fff', s = 11) {
  const a = (v * Math.PI) / 180;
  const p = (l, t) => [x - Math.cos(a) * l - Math.sin(a) * t, y - Math.sin(a) * l + Math.cos(a) * t];
  const pt = [[x, y], p(s * 1.5, s * 0.75), p(s * 1.05, 0), p(s * 1.5, -s * 0.75)];
  return `<path d="M${pt.map((q) => q.map(r1).join(' ')).join(' L')}Z" fill="${farve}" stroke="${F.blaek}" stroke-width="1.6" stroke-linejoin="round" opacity=".95"/>`;
}

/** Lige pil med spids i (tx, ty). */
export function pil(x, y, tx, ty, farve = F.blaek, b = 3.5) {
  const v = Math.atan2(ty - y, tx - x);
  const hoved = [v - 0.5, v + 0.5].map((a) => `L${r1(tx - 13 * Math.cos(a))} ${r1(ty - 13 * Math.sin(a))}`);
  return `<path d="M${x} ${y} L${r1(tx - 6 * Math.cos(v))} ${r1(ty - 6 * Math.sin(v))}" stroke="${farve}" stroke-width="${b}" stroke-linecap="round" fill="none"/>
    <path d="M${tx} ${ty} ${hoved.join(' ')}Z" fill="${farve}"/>`;
}

/** Rødt blodlegeme set skråt: en bikonkav skive. */
export function blodlegeme(x, y, g = 0, s = 1) {
  return `<g transform="translate(${x} ${y}) rotate(${g}) scale(${s})">
    <ellipse rx="15" ry="9" fill="#D9404B" stroke="#8E1F2A" stroke-width="1.6"/>
    <ellipse rx="7.5" ry="3.6" fill="#B92F3B"/>
  </g>`;
}

export const navn = (x, y, t, str = 20, farve = F.blaek) =>
  `<text x="${x}" y="${y}" text-anchor="middle" font-family="Archivo, sans-serif" font-weight="800" font-size="${str}" fill="${farve}">${t}</text>`;
export const lille = (x, y, t, farve = F.blaek, anker = 'middle') =>
  `<text x="${x}" y="${y}" text-anchor="${anker}" font-family="IBM Plex Mono, monospace" font-weight="500" font-size="14" fill="${farve}">${t}</text>`;
