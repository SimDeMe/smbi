/* kasse.js — reserve- og ressourcekassen (McKelvey-kassen).

   Bredden er hele ressourcen, som den var fra start. Fra venstre:
   det, der allerede er udvundet, den kendte del og den uopdagede del.
   Højden i hver søjle er andelen, der er rentabel at udvinde — reserven
   er det mørke felt øverst til venstre. */

import { SAMLET } from './model.js';

export const KASSE = { x: 74, y: 44, w: 318, h: 300 };

const INK = '#17211F', SLATE = '#566B68';
const DISPLAY = "'Archivo', system-ui, sans-serif";
const MONO = "'IBM Plex Mono', monospace";
const tal = v => Math.round(v).toLocaleString('da-DK');

function skravering(c, x, y, w, h, farve, afstand = 7){
  if (w <= 0 || h <= 0) return;
  c.save();
  c.beginPath(); c.rect(x, y, w, h); c.clip();
  c.strokeStyle = farve; c.lineWidth = 1.2;
  c.beginPath();
  for (let d = -h; d < w; d += afstand){
    c.moveTo(x + d, y + h);
    c.lineTo(x + d + h, y);
  }
  c.stroke();
  c.restore();
}

function pille(c, tekst, cx, cy, bg, fg){
  c.font = `600 10px ${MONO}`;
  const w = c.measureText(tekst).width + 14;
  const x = Math.round(cx - w / 2), y = Math.round(cy - 8);
  c.fillStyle = bg;
  c.beginPath(); c.roundRect(x, y, w, 16, 8); c.fill();
  c.strokeStyle = INK; c.lineWidth = 1.5; c.stroke();
  c.fillStyle = fg; c.textAlign = 'center';
  c.fillText(tekst, cx, y + 11.5);
}

// navn (en eller flere linjer) + mængde midt i et felt, hvis der er plads
function feltTekst(c, linjer, maengde, cx, cy, fg, plads){
  const stor = plads.w > 120 && plads.h > 70;
  const lh = stor ? 18 : 15;
  if (plads.w < 70 || plads.h < lh * linjer.length + 22) return false;
  c.textAlign = 'center';
  c.fillStyle = fg;
  c.font = `800 ${stor ? 16 : 13}px ${DISPLAY}`;
  let ty = cy - (linjer.length - 1) * lh / 2 - 4;
  for (const l of linjer){ c.fillText(l, cx, ty); ty += lh; }
  c.font = `600 10px ${MONO}`;
  c.fillText(maengde, cx, ty - 2);
  return true;
}

export function tegn(c, a){
  const { x, y, w, h } = KASSE;
  const wU = w * a.udvundet / SAMLET;
  const wK = w * a.kendt / SAMLET;
  const wN = w - wU - wK;
  const xK = x + wU, xN = xK + wK;
  const hK = a.kendt  > 0 ? h * a.reserve / a.kendt : 0;
  const hN = a.ukendt > 0 ? h * a.rentabelUkendt / a.ukendt : 0;

  // skygge og bund
  c.fillStyle = INK;
  c.fillRect(x + 5, y + 5, w, h);

  // udvundet
  c.fillStyle = '#E9ECEA';
  c.fillRect(x, y, wU, h);
  skravering(c, x, y, wU, h, '#8C9C99');

  // kendt: reserve og ikke rentabel
  c.fillStyle = '#0E86C8';
  c.fillRect(xK, y, wK, hK);
  c.fillStyle = '#C7E6F6';
  c.fillRect(xK, y + hK, wK, h - hK);

  // uopdaget: rentabel del svagt skraveret
  c.fillStyle = '#F2F8FB';
  c.fillRect(xN, y, wN, hN);
  skravering(c, xN, y, wN, hN, 'rgba(14,134,200,.35)', 9);
  c.fillStyle = '#FFFFFF';
  c.fillRect(xN, y + hN, wN, h - hN);

  // rentabilitetsgrænsen: fuld streg gennem det kendte, stiplet gennem det uopdagede
  c.strokeStyle = INK; c.lineWidth = 2.5;
  c.beginPath(); c.moveTo(xK, y + hK); c.lineTo(xN, y + hK); c.stroke();
  c.save();
  c.setLineDash([7, 5]); c.lineWidth = 2;
  c.beginPath(); c.moveTo(xN, y + hN); c.lineTo(x + w, y + hN); c.stroke();
  c.restore();

  // søjlestreger og ramme
  c.lineWidth = 2;
  c.beginPath();
  if (wU > 0.5){ c.moveTo(xK, y); c.lineTo(xK, y + h); }
  c.moveTo(xN, y); c.lineTo(xN, y + h);
  c.stroke();
  c.lineWidth = 2.5;
  c.strokeRect(x, y, w, h);

  // tekst i felterne
  if (!feltTekst(c, ['Reserve'], tal(a.reserve) + ' mio. t', xK + wK / 2, y + hK / 2, '#fff', { w: wK, h: hK })
      && a.reserve >= 0.5){
    pille(c, 'RESERVE ' + tal(a.reserve), xK + Math.max(wK / 2, 50), y + hK + 14, '#0E86C8', '#fff');
  }
  feltTekst(c, ['Kendt,', 'ikke rentabel'], tal(a.kendt - a.reserve) + ' mio. t',
            xK + wK / 2, y + hK + (h - hK) / 2 + 6, '#17211F', { w: wK, h: h - hK - 30 });
  feltTekst(c, ['Uopdaget'], tal(a.ukendt) + ' mio. t',
            xN + wN / 2, y + hN + (h - hN) / 2, '#17211F', { w: wN, h: h - hN - 24 });

  if (wU > 14){
    c.save();
    c.translate(x + wU / 2, y + h / 2);
    c.rotate(-Math.PI / 2);
    c.fillStyle = INK; c.textAlign = 'center';
    c.font = `600 10px ${MONO}`;
    c.fillText(wU > 28 ? 'UDVUNDET ' + tal(a.udvundet) : 'UDVUNDET', 0, 3.5);
    c.restore();
  }

  // grænsens pris, på den stiplede linje i det uopdagede
  const gTxt = '≤ ' + tal(a.graense) + ' USD/t';
  pille(c, gTxt, Math.max(xN + 56, x + w - 58), Math.min(y + h - 12, Math.max(y + 12, y + hN)), '#FFF9EE', INK);

  // akser
  c.fillStyle = SLATE; c.font = `600 10px ${MONO}`; c.textAlign = 'center';
  if (wK > 40) c.fillText('KENDT', xK + wK / 2, y - 10);
  if (wN > 60) c.fillText('UOPDAGET', xN + wN / 2, y - 10);
  c.fillText('RESSOURCE · ' + tal(SAMLET) + ' mio. t fra start', x + w / 2, y + h + 26);
  c.save();
  c.translate(x - 16, y + h / 2);
  c.rotate(-Math.PI / 2);
  c.textAlign = 'left';  c.fillText('IKKE RENTABEL', -h / 2, 0);
  c.textAlign = 'right'; c.fillText('RENTABEL', h / 2, 0);
  c.restore();
  // pil op mod "billigere at udvinde"
  c.strokeStyle = SLATE; c.lineWidth = 1.5;
  c.beginPath();
  c.moveTo(x - 30, y + h - 8); c.lineTo(x - 30, y + 8);
  c.moveTo(x - 34, y + 14); c.lineTo(x - 30, y + 8); c.lineTo(x - 26, y + 14);
  c.stroke();
}
