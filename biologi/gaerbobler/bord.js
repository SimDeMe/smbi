/* ═══════════════════════════════════════════════════════════
   bord.js — laboratoriebordet.

   Møblementet: væggen, hylden med redskaberne, stativet til
   gærrørene, de to varmeplader og bordpladen med fire pladser
   til kolberne. Her ligger også bordets mål, så alle de andre
   moduler kan regne ud fra de samme tal.
   ═══════════════════════════════════════════════════════════ */
import {MÅL, INK, blaek, boks, maerkat, tekst} from './model.js';
import {RUM} from './gaering.js';

/* ── Mål ───────────────────────────────────────────────── */
export const HYLDE_TOP = 154;   /* oversiden af hyldebrættet          */
export const HYLDE_BUND = 172;
export const BORD_TOP  = 480;   /* bordpladens overside               */
export const PLADE_H   = 34;    /* varmepladens højde                 */

/* Redskaberne står med bunden på hyldebrættet. */
export const HYLDE_Y = HYLDE_TOP;

/* Stativet til gærrørene fylder højre del af hylden. */
export const STATIV = {x0:648, x1:1016, bund:HYLDE_TOP};
export const STATIV_X = [692, 772, 852, 932];

/** De pladser, en kolbe kan stå på. */
export function opretPladser(){
  return [
    {id:'plade-a', type:'plade', navn:'Varmeplade A', x:96,  top:BORD_TOP - PLADE_H, temp:RUM, kolbe:null},
    {id:'plade-b', type:'plade', navn:'Varmeplade B', x:252, top:BORD_TOP - PLADE_H, temp:RUM, kolbe:null},
    {id:'bord-1',  type:'bord',  navn:'Bordplads 1',  x:424, top:BORD_TOP, kolbe:null},
    {id:'bord-2',  type:'bord',  navn:'Bordplads 2',  x:580, top:BORD_TOP, kolbe:null},
    {id:'bord-3',  type:'bord',  navn:'Bordplads 3',  x:736, top:BORD_TOP, kolbe:null},
    {id:'bord-4',  type:'bord',  navn:'Bordplads 4',  x:892, top:BORD_TOP, kolbe:null},
  ];
}

/* Pladsen rækker langt op og lidt ned: en kolbe sættes der, hvor
   dens bund havner, og den skal ikke skulle rammes på et bånd, der
   er 30 px højt. Kassen bruges kun som modtager, aldrig til at
   gribe med, så den må gerne være rundhåndet. */
export function pladsKasse(p){
  const b = p.type === 'plade' ? 74 : 66;
  return {x0:p.x - b, x1:p.x + b, y0:p.top - 150, y1:BORD_TOP + 72};
}

/* Stativets fire huller — der, hvor et gærrør står, når det ikke
   sidder på en kolbe. */
export const STATIV_Y = STATIV.bund - 30;
export function stativPunkt(i){ return {x:STATIV_X[i], y:STATIV_Y}; }

/* Spanden yderst til højre. Hælder man en kolbe eller et gærrør ned
   i den, er det tømt og skyllet og kan bruges forfra — trin D i
   vejledningen, og redningsplanken, når man kom til at hælde vand i
   for tidligt. */
export const SPAND = {x:992, top:BORD_TOP - 106, halv:36};
/* Kassen rækker ned over bordforkanten af samme grund som pladserne:
   en kolbe slippes der, hvor dens bund havner. Til gengæld må den
   ikke gå ind over bordplads 4 — så ville man komme til at hælde ud,
   når man sigtede efter bordet. */
export function spandKasse(){
  return {x0:SPAND.x - 32, x1:SPAND.x + 40, y0:SPAND.top - 34, y1:BORD_TOP + 72};
}

/* ── Tegning ───────────────────────────────────────────── */

export function tegnRum(g){
  /* Væggen */
  const v = g.createLinearGradient(0, 0, 0, BORD_TOP);
  v.addColorStop(0, '#EDF4F3');
  v.addColorStop(1, '#E3EDEB');
  g.fillStyle = v;
  g.fillRect(0, 0, MÅL.bredde, BORD_TOP);

  /* Fliserne på væggen — kun antydet, så de ikke stjæler opmærksomhed */
  g.save();
  g.strokeStyle = 'rgba(23,33,31,.06)';
  g.lineWidth = 1.5;
  for(let y = 40; y < BORD_TOP; y += 62){
    g.beginPath(); g.moveTo(0, y); g.lineTo(MÅL.bredde, y); g.stroke();
  }
  for(let x = 54; x < MÅL.bredde; x += 78){
    g.beginPath(); g.moveTo(x, 0); g.lineTo(x, BORD_TOP); g.stroke();
  }
  g.restore();

  /* Bordpladen */
  g.fillStyle = '#2E3A38';
  g.fillRect(0, BORD_TOP, MÅL.bredde, MÅL.højde - BORD_TOP);
  g.fillStyle = '#44534F';
  g.fillRect(0, BORD_TOP, MÅL.bredde, 16);
  g.strokeStyle = INK; g.lineWidth = 2.5;
  g.beginPath(); g.moveTo(0, BORD_TOP); g.lineTo(MÅL.bredde, BORD_TOP); g.stroke();
  g.beginPath(); g.moveTo(0, BORD_TOP + 16); g.lineTo(MÅL.bredde, BORD_TOP + 16); g.stroke();

  /* Skuffer i bordet — bare nok til, at det ligner et laboratorium */
  g.save();
  g.strokeStyle = 'rgba(255,246,224,.16)'; g.lineWidth = 2;
  for(let x = 130; x < MÅL.bredde; x += 210){
    g.strokeRect(x - 88, BORD_TOP + 32, 176, 48);
    g.beginPath(); g.moveTo(x - 22, BORD_TOP + 56); g.lineTo(x + 22, BORD_TOP + 56); g.stroke();
  }
  g.restore();
}

export function tegnHylde(g){
  /* Knægtene under brættet */
  g.fillStyle = '#8E9C99';
  for(const x of [70, 330, 600]){
    g.beginPath();
    g.moveTo(x, HYLDE_BUND); g.lineTo(x + 26, HYLDE_BUND); g.lineTo(x, HYLDE_BUND + 30);
    g.closePath();
    blaek(g, '#8E9C99', 2);
  }
  /* Selve brættet */
  boks(g, 24, HYLDE_TOP, MÅL.bredde - 48, HYLDE_BUND - HYLDE_TOP + 4, 4);
  blaek(g, '#E3CFA6', 2.5);
}

/** Stativet med de fire gærrør. */
export function tegnStativ(g){
  boks(g, STATIV.x0, STATIV.bund - 34, STATIV.x1 - STATIV.x0, 34, 7);
  blaek(g, '#CDB489', 2.5);
  g.save();
  g.fillStyle = 'rgba(23,33,31,.28)';
  for(const x of STATIV_X){
    g.beginPath(); g.ellipse(x, STATIV.bund - 30, 13, 5, 0, 0, Math.PI * 2); g.fill();
  }
  g.restore();
  maerkat(g, 'Gærrør', (STATIV.x0 + STATIV.x1) / 2, STATIV.bund + 12, {størrelse:11, farve:'#4A5956'});
}

/** En varmeplade. Rød glød og en lampe, når den er tændt. */
export function tegnPlade(g, p){
  const tændt = p.temp > RUM;
  const b = 74;
  /* Gløden op i luften */
  if(tændt){
    const styrke = Math.min(1, (p.temp - RUM) / 50);
    const gl = g.createRadialGradient(p.x, p.top, 4, p.x, p.top, 120);
    gl.addColorStop(0, `rgba(255,106,61,${0.30 * styrke})`);
    gl.addColorStop(1, 'rgba(255,106,61,0)');
    g.fillStyle = gl;
    g.fillRect(p.x - 120, p.top - 120, 240, 140);
  }
  /* Kabinettet */
  boks(g, p.x - b, p.top, b * 2, PLADE_H, 7);
  blaek(g, '#D8DEDC', 2.5);
  /* Kogepladen */
  boks(g, p.x - b + 9, p.top - 7, (b - 9) * 2, 14, 6);
  blaek(g, tændt ? '#E04A26' : '#9AA6A3', 2.5);
  /* Kontrollampe og skala */
  g.beginPath(); g.arc(p.x + b - 17, p.top + 22, 5.5, 0, Math.PI * 2);
  blaek(g, tændt ? '#FFB300' : '#B9C3C0', 2);
  maerkat(g, tændt ? `${Math.round(p.temp)}°C` : 'Slukket',
          p.x - 12, p.top + 22, {størrelse:11, farve:'#2A3735'});
}

/** Spanden til det, der skal hældes ud. */
export function tegnSpand(g){
  const {x, top, halv} = SPAND;
  const bund = BORD_TOP, smal = halv - 7;

  /* Skygge på bordpladen */
  g.fillStyle = 'rgba(23,33,31,.22)';
  g.beginPath(); g.ellipse(x + 4, bund, smal + 3, 6, 0, 0, Math.PI * 2); g.fill();

  /* Selve spanden */
  g.beginPath();
  g.moveTo(x - halv, top);
  g.lineTo(x - smal, bund - 5);
  g.quadraticCurveTo(x, bund + 3, x + smal, bund - 5);
  g.lineTo(x + halv, top);
  g.closePath();
  blaek(g, '#9FB0AC', 2.5);

  /* Mørket nede i den */
  g.beginPath(); g.ellipse(x, top, halv, 11, 0, 0, Math.PI * 2);
  blaek(g, '#3A4745', 2.5);
  g.save();
  g.beginPath(); g.ellipse(x, top + 3, halv - 5, 8, 0, 0, Math.PI * 2);
  g.fillStyle = '#26312F'; g.fill();
  g.restore();

  /* Båndet med mærkatet */
  g.beginPath();
  g.moveTo(x - halv + 4, top + 38);
  g.lineTo(x + halv - 4, top + 38);
  g.lineTo(x + halv - 7, top + 62);
  g.lineTo(x - halv + 7, top + 62);
  g.closePath();
  blaek(g, '#FFE9DC', 2);
  maerkat(g, 'Tøm her', x, top + 50, {størrelse:9, farve:'#2A3735', spær:1});
}

/** Rammen om en gyldig modtager, mens man trækker i noget. */
export function tegnMaal(g, k, {aktiv = false, puls = 0} = {}){
  g.save();
  g.setLineDash([9, 7]);
  g.lineDashOffset = -puls * 24;
  g.lineWidth = aktiv ? 4 : 2.5;
  g.strokeStyle = aktiv ? '#E8336D' : 'rgba(23,33,31,.42)';
  boks(g, k.x0, k.y0, k.x1 - k.x0, k.y1 - k.y0, 12);
  if(aktiv){ g.fillStyle = 'rgba(232,51,109,.10)'; g.fill(); }
  g.stroke();
  g.restore();
}

/** Den blå ring om det, tastaturet peger på. */
export function tegnFokus(g, k){
  g.save();
  g.lineWidth = 3.5;
  g.strokeStyle = '#7A4FD6';
  boks(g, k.x0 - 3, k.y0 - 3, k.x1 - k.x0 + 6, k.y1 - k.y0 + 6, 13);
  g.stroke();
  g.restore();
}

/** Lille navneskilt under en kolbe. */
export function tegnSkilt(g, x, y, navn, valgt){
  g.save();
  g.font = `800 13px Archivo,system-ui,sans-serif`;
  const b = g.measureText(navn).width + 22;
  boks(g, x - b / 2, y, b, 21, 10);
  blaek(g, valgt ? INK : '#FFF9EE', 2);
  tekst(g, navn, x, y + 11, {størrelse:13, farve:valgt ? '#FFF6E0' : INK});
  g.restore();
}
