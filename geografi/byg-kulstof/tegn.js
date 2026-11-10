// Tegnehjælp til tre selvtegnede figurer. Ingen lærebogsillustrationer kopieres.
export const FARVE = { luft:'#bcdfee', groen:'#64a67c', hav:'#4299c5', jord:'#b39067', sten:'#b3a398', proces:'#217b9c', geologi:'#b77048', menneske:'#c35846' };
export const tekst = (x,y,s,stoerrelse=20) => `<text x="${x}" y="${y}" text-anchor="middle" font-family="Archivo, sans-serif" font-size="${stoerrelse}" fill="#405d59">${s}</text>`;
export const del = (ord,svg) => ({ord,svg});
export const rect = (x,y,w,h,fill,rx=24) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="#405d59" stroke-width="2.5"/>`;
export const ellipse = (x,y,rx,ry,fill) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="#405d59" stroke-width="2.5"/>`;
export const trae = (x,y,s=1) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 0V-65" stroke="#745b3d" stroke-width="12"/><path d="M-43 -51 Q-68 -83 -30 -102 Q-22 -139 9 -120 Q51 -131 48 -93 Q77 -52 32 -44Z" fill="#64a67c" stroke="#376e4c" stroke-width="3"/></g>`;
export const skal = (x,y,s=1) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-22 -5 Q-25 -38 0 -38 Q25 -38 22 -5 L8 10H-8Z" fill="#faf1d2" stroke="#667c75" stroke-width="2"/><path d="M0 7V-32M-3 7L-16 -23M3 7L16 -23" stroke="#9b9d7d" fill="none"/></g>`;
export const defs = `<defs><marker id="kc-spids" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="3" markerHeight="3" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="context-stroke"/></marker><pattern id="kc-kalk" width="60" height="28" patternUnits="userSpaceOnUse"><rect width="60" height="28" fill="#e3d9b9"/><path d="M0 27H60M30 0V27" stroke="#b3a385" stroke-width="2"/></pattern></defs>`;
export function pil(ord,sti,farve=FARVE.proces,dobbelt=false) {
  return del(ord,`<path d="${sti}" fill="none" stroke="${farve}" stroke-width="8" stroke-linecap="round" marker-end="url(#kc-spids)"${dobbelt?' marker-start="url(#kc-spids)"':''}/>`);
}
export const pilOmr = sti => `<path d="${sti}" fill="none" stroke-width="27" stroke-linecap="round"/>`;
export function plads(ord,x,y,maal,omr,fejl) { return {ord,x,y,maal,omr,fejl}; }
export const ramme = (x,y,w,h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="18" fill="none" stroke-width="8"/>`;
export function grund() { return del(null,`${defs}<rect width="1400" height="820" fill="#fffdf8"/>`); }
