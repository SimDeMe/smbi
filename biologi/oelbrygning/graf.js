/* ═══════════════════════════════════════════════════════════
   graf.js — tidsgrafen i figurens højre side.

   Hver station fortæller, hvad der skal tegnes (serier, akser,
   tidsakse), og grafen tegner det. Kurverne navngives for enden i
   stedet for i en signaturforklaring, og hver kurve har sin egen
   stregtype, så farven aldrig er det eneste, der skiller dem ad.
   ═══════════════════════════════════════════════════════════ */
import {GRAF, INK, SLATE, boks, blaek, maerkat, komma} from './model.js';

const STREG = {fuld:[], stiplet:[9, 5], prik:[2, 5]};

/** En serie, der fylder sig op, mens tiden går. */
export function nySerie(navn, farve, {stil = 'fuld', akse = 'v', tykkelse = 3} = {}){
  return {navn, farve, stil, akse, tykkelse, data:[]};
}

export function tilfoej(serie, t, v){
  const d = serie.data, sidste = d[d.length - 1];
  if(sidste && t - sidste[0] < 1e-9){ sidste[1] = v; return; }
  d.push([t, v]);
}

/**
 * @param opsaet {titel, tMaks, tTrin, tNavn, tTal(t),
 *                venstre:{min, maks, trin, navn, tal(v)},
 *                hoejre: {…} | null, serier:[…], nu}
 */
export function tegnGraf(g, opsaet){
  const {x, y, b, h} = GRAF;
  const px = x + 46, pb = b - 46 - (opsaet.hoejre ? 46 : 12);
  const py = y + 56, ph = h - 56 - 40;

  /* Kortet */
  boks(g, x, y, b, h, 12);
  blaek(g, '#fff', 2);
  maerkat(g, opsaet.titel, x + 14, y + 17, {justering:'left', størrelse:10.5, farve:SLATE});

  const tx = t => px + pb * Math.min(1, t / opsaet.tMaks);
  const akseY = a => v => py + ph - ph * (v - a.min) / (a.maks - a.min);
  const yv = akseY(opsaet.venstre);
  const yh = opsaet.hoejre ? akseY(opsaet.hoejre) : null;

  /* Gitter og tal */
  g.save();
  g.lineWidth = 1; g.strokeStyle = 'rgba(23,33,31,.1)';
  const V = opsaet.venstre;
  for(let v = V.min; v <= V.maks + 1e-9; v += V.trin){
    const yy = yv(v);
    g.beginPath(); g.moveTo(px, yy); g.lineTo(px + pb, yy); g.stroke();
    maerkat(g, V.tal ? V.tal(v) : komma(v), px - 7, yy, {justering:'right', størrelse:9.5, farve:SLATE, stort:false, spær:0.4});
  }
  for(let t = 0; t <= opsaet.tMaks + 1e-9; t += opsaet.tTrin){
    const xx = tx(t);
    g.beginPath(); g.moveTo(xx, py); g.lineTo(xx, py + ph); g.stroke();
    maerkat(g, opsaet.tTal ? opsaet.tTal(t) : komma(t), xx, py + ph + 13, {størrelse:9.5, farve:SLATE, stort:false, spær:0.4});
  }
  if(opsaet.hoejre){
    const H = opsaet.hoejre;
    for(let v = H.min; v <= H.maks + 1e-9; v += H.trin){
      maerkat(g, H.tal ? H.tal(v) : komma(v), px + pb + 7, yh(v), {justering:'left', størrelse:9.5, farve:SLATE, stort:false, spær:0.4});
    }
  }
  g.restore();

  /* Akser */
  g.beginPath();
  g.moveTo(px, py); g.lineTo(px, py + ph); g.lineTo(px + pb, py + ph);
  if(opsaet.hoejre) g.lineTo(px + pb, py);
  blaek(g, null, 2);
  maerkat(g, opsaet.tNavn, px + pb / 2, py + ph + 29, {størrelse:9.5, farve:SLATE, stort:false, spær:0.8});
  maerkat(g, V.navn, px, py - 12, {størrelse:9.5, farve:SLATE, stort:false, spær:0.6, justering:'left'});
  if(opsaet.hoejre){
    maerkat(g, opsaet.hoejre.navn, px + pb, py - 12, {størrelse:9.5, farve:SLATE, stort:false, spær:0.6, justering:'right'});
  }

  /* «Nu»-streg */
  if(opsaet.nu > 0){
    const xx = tx(opsaet.nu);
    g.save();
    g.setLineDash([3, 4]); g.lineWidth = 1.5; g.strokeStyle = SLATE;
    g.beginPath(); g.moveTo(xx, py); g.lineTo(xx, py + ph); g.stroke();
    g.restore();
  }

  /* Kurverne */
  const navne = [];
  g.save();
  g.beginPath(); g.rect(px - 2, py - 4, pb + 4, ph + 8); g.clip();
  for(const s of opsaet.serier){
    if(s.data.length < 1) continue;
    const yy = s.akse === 'h' ? yh : yv;
    g.beginPath();
    s.data.forEach(([t, v], i) => i ? g.lineTo(tx(t), yy(v)) : g.moveTo(tx(t), yy(v)));
    g.setLineDash(STREG[s.stil]);
    g.lineCap = 'round'; g.lineJoin = 'round';
    g.lineWidth = s.tykkelse + 2.5; g.strokeStyle = '#fff'; g.stroke();
    g.lineWidth = s.tykkelse; g.strokeStyle = s.farve; g.stroke();
    const [tS, vS] = s.data[s.data.length - 1];
    navne.push({navn:s.navn, farve:s.farve, x:tx(tS), y:yy(vS)});
  }
  g.restore();

  /* Navnene for enden af kurverne — skubbet fra hinanden. */
  navne.sort((a, b) => a.y - b.y);
  for(let i = 1; i < navne.length; i++){
    if(navne[i].y - navne[i - 1].y < 17) navne[i].y = navne[i - 1].y + 17;
  }
  for(const n of navne){
    const venstre = n.x > px + pb - 110;
    const ly = Math.max(py + 6, Math.min(py + ph - 6, n.y));
    g.beginPath(); g.arc(n.x, Math.max(py, Math.min(py + ph, n.y)), 3.5, 0, Math.PI * 2);
    blaek(g, n.farve, 1.5);
    const bredde = maerkat(g, n.navn, 0, -100, {størrelse:9.5, stort:false, spær:0.5});
    const lx = venstre ? n.x - 10 - bredde : n.x + 10;
    g.fillStyle = 'rgba(255,255,255,.88)';
    g.fillRect(lx - 3, ly - 8, bredde + 6, 16);
    maerkat(g, n.navn, lx, ly, {størrelse:9.5, stort:false, spær:0.5, justering:'left', farve:INK});
  }
}
