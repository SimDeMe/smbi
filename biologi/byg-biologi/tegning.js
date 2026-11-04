// Fælles tegnedele til de seks selvstændige fagfigurer.
export const blaek = '#31445b';
export const blaa = '#83bbdf';
export const roed = '#e18a93';
export const groen = '#a5ca91';
export const gul = '#f1cb77';
export const lilla = '#b8a1d3';
export const papir = '#fff4df';

const toner = [
  [blaa, '#e0f4ff', '#5f9ac7'],
  [roed, '#ffd8dd', '#cb6379'],
  [groen, '#e3f4c7', '#79aa69'],
  [gul, '#fff3c8', '#d9a04c'],
  [lilla, '#f1e5ff', '#9275b4'],
  [papir, '#fffdf5', '#f7e0ba'],
];
const udfyld = farve => toner.some(([midt]) => midt === farve)
  ? `url(#bio-tone-${farve.slice(1)})` : farve;

export const tegnedefinitioner = `<defs>${toner.map(([midt, lys, moerk]) =>
  `<linearGradient id="bio-tone-${midt.slice(1)}" x2="0%" y2="100%">
    <stop stop-color="${lys}"/><stop offset="52%" stop-color="${midt}"/><stop offset="100%" stop-color="${moerk}"/>
  </linearGradient>`).join('')}</defs>`;

export const roedBlodcelle = (x, y) =>
  oval(x, y, 13, 7, roed) + oval(x, y, 6, 2.6, '#e8a3ad');

export const flade = (d, farve) =>
  `<path d="${d}" fill="${udfyld(farve)}" stroke="${blaek}" stroke-width="2"/>`;
export const streg = (d, farve = blaek, bredde = 3) =>
  `<path d="${d}" fill="none" stroke="${farve}" stroke-width="${bredde}" stroke-linecap="round" stroke-linejoin="round"/>`;
export const felt = (x, y, w, h, farve, r = 7) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${udfyld(farve)}" stroke="${blaek}" stroke-width="2"/>`;
export const oval = (x, y, rx, ry, farve) =>
  `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${udfyld(farve)}" stroke="${blaek}" stroke-width="2"/>`;
export const tekst = (x, y, t) =>
  `<text x="${x}" y="${y}" text-anchor="middle" class="fig-navn">${t}</text>`;
export const pil = (x, y, tx, ty, farve = blaek) => {
  const v = Math.atan2(ty - y, tx - x);
  const hoved = [v - 0.52, v + 0.52].map(a => `L${tx - 10 * Math.cos(a)} ${ty - 10 * Math.sin(a)}`);
  return streg(`M${x} ${y} L${tx} ${ty}`, farve, 3.5)
    + `<path d="M${tx} ${ty} ${hoved.join(' ')}Z" fill="${farve}" stroke="${farve}" stroke-width="1.5"/>`;
};
