/* ═══════════════════════════════════════════════════════════
   polkort.js — polens vandring set fra oven.

   Et fladt kort over Arktis (azimutal ækvidistant projektion
   med centrum i den geografiske nordpol) med polens spor siden
   1831, polen lige nu og kompassets plads. Rækker polen længere
   mod syd, end kortet når, vokser kortet med.
   ═══════════════════════════════════════════════════════════ */
import {RINGE} from './kyst.js';
import {POLSPOR} from './poler.js';

const GRAD = Math.PI/180;
const INK = '#17211F';

export function byggPolkort(lærred){
  const g = lærred.getContext('2d');

  /**
   * @param pol     {lat, lon} — den magnetiske pol på den nordlige halvkugle
   * @param nordpol er `pol` den magnetiske nordpol (ellers er feltet vendt)
   * @param kompas  {lat, lon}
   * @param etiket  årstallet eller en kort tekst til kortets hjørne
   */
  function tegn({pol, nordpol, kompas, etiket}){
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const bw = lærred.clientWidth || 280, bh = bw;
    if(lærred.width !== Math.round(bw*dpr)){
      lærred.width = Math.round(bw*dpr); lærred.height = Math.round(bh*dpr);
      lærred.style.height = bh+'px';
    }
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, bw, bh);

    /* Kortets kant: 55° N, eller længere ude, hvis polen er der. */
    const kantLat = Math.max(-20, Math.min(55, pol.lat-12));
    const cx = bw/2, cy = bh/2, R = bw/2-6;
    const k = R/(90-kantLat);
    const xy = (lat, lon) => {
      const r = (90-lat)*k;
      return [cx + r*Math.sin(lon*GRAD), cy + r*Math.cos(lon*GRAD)];
    };

    g.save();
    g.beginPath(); g.arc(cx, cy, R, 0, Math.PI*2); g.clip();
    g.fillStyle = '#1B5E86'; g.fillRect(0, 0, bw, bh);

    /* land */
    g.fillStyle = '#F4EEDF'; g.strokeStyle = INK; g.lineWidth = 1; g.lineJoin = 'round';
    for(const r of RINGE){
      let maks = -90;
      for(let i=1;i<r.length;i+=2) if(r[i] > maks) maks = r[i];
      if(maks < kantLat-5) continue;           // ringe helt uden for kortet
      g.beginPath();
      for(let i=0;i<r.length;i+=2){
        const [x, y] = xy(Math.max(r[i+1], kantLat-30), r[i]);
        if(i === 0) g.moveTo(x, y); else g.lineTo(x, y);
      }
      g.closePath(); g.fill(); g.stroke();
    }

    /* bredde- og længdegrader */
    g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 1;
    for(let la=80; la>kantLat; la-=10){
      g.beginPath(); g.arc(cx, cy, (90-la)*k, 0, Math.PI*2); g.stroke();
    }
    for(let lo=0; lo<360; lo+=30){
      const [x, y] = xy(kantLat, lo);
      g.beginPath(); g.moveTo(cx, cy); g.lineTo(x, y); g.stroke();
    }

    /* polens spor */
    g.strokeStyle = INK; g.lineWidth = 4.5; g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath();
    POLSPOR.forEach((p, i) => { const [x, y] = xy(p.lat, p.lon); i ? g.lineTo(x, y) : g.moveTo(x, y); });
    g.stroke();
    g.strokeStyle = '#FFB300'; g.lineWidth = 2;
    g.stroke();
    for(const p of POLSPOR){
      const [x, y] = xy(p.lat, p.lon);
      g.beginPath(); g.arc(x, y, 2.6, 0, Math.PI*2);
      g.fillStyle = '#FFB300'; g.fill(); g.strokeStyle = INK; g.lineWidth = 1.2; g.stroke();
    }
    g.font = '600 9px "IBM Plex Mono", monospace';
    g.textAlign = 'center';
    const FORSKYD = {1831:[-4, 15], 2001:[0, -8], 2025:[14, -8]};
    for(const p of POLSPOR.filter(p => FORSKYD[p.aar])){
      const [x, y] = xy(p.lat, p.lon);
      const tx = x + FORSKYD[p.aar][0], ty = y + FORSKYD[p.aar][1];
      g.lineWidth = 3; g.strokeStyle = 'rgba(255,249,238,0.95)'; g.strokeText(p.aar, tx, ty);
      g.fillStyle = INK; g.fillText(p.aar, tx, ty);
    }

    /* geografisk nordpol: et kryds */
    g.strokeStyle = '#FFF6E0'; g.lineWidth = 2.2;
    g.beginPath(); g.moveTo(cx-6, cy); g.lineTo(cx+6, cy); g.moveTo(cx, cy-6); g.lineTo(cx, cy+6); g.stroke();

    /* kompasset, hvis det er med på kortet */
    if(kompas.lat > kantLat){
      const [x, y] = xy(kompas.lat, kompas.lon);
      g.beginPath(); g.arc(x, y, 5, 0, Math.PI*2);
      g.fillStyle = '#fff'; g.fill(); g.strokeStyle = INK; g.lineWidth = 2; g.stroke();
      g.beginPath(); g.moveTo(x, y-2.5); g.lineTo(x, y+2.5); g.stroke();
    }

    /* polen nu: rombe for nordpol, ring for sydpol (vendt felt) */
    {
      const [x, y] = xy(pol.lat, pol.lon);
      g.lineWidth = 2.2; g.strokeStyle = INK;
      g.beginPath();
      if(nordpol){ g.moveTo(x, y-8); g.lineTo(x+7, y); g.lineTo(x, y+8); g.lineTo(x-7, y); g.closePath();
        g.fillStyle = '#E8336D'; }
      else { g.arc(x, y, 6.5, 0, Math.PI*2); g.fillStyle = '#FFF6E0'; }
      g.fill(); g.stroke();
    }
    g.restore();

    g.beginPath(); g.arc(cx, cy, R, 0, Math.PI*2);
    g.strokeStyle = INK; g.lineWidth = 2; g.stroke();

    /* kantens breddegrad */
    g.font = '600 8px "IBM Plex Mono", monospace'; g.textAlign = 'left'; g.fillStyle = '#5A6C69';
    g.fillText(Math.round(kantLat)+'° N', 4, bh-4);
    g.textAlign = 'right';
    g.fillText(etiket, bw-4, bh-4);
  }

  return {tegn};
}
