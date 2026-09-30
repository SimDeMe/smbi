/* ═══════════════════════════════════════════════════════════
   station-gaer.js — 3 · Gæring.

   Den kogte urt er kølet og iltet, og gæren er tilsat. Gæren
   bruger først ilten til at formere sig og gærer derefter
   sukkeret til ethanol og CO₂. CO₂'en bobler ud gennem gærlåsen,
   og vægtfylden falder. Luppen viser gærcellerne, der optager
   maltose og afgiver ethanol og CO₂.
   ═══════════════════════════════════════════════════════════ */
import * as B from './brygning.js';
import {INK, SLATE, FARVE, BLØDT, blaek, maerkat, skilt, komma,
        lup, drift, juster, naermest, tilfaeldigPlads, ebcFarve} from './model.js';
import {BALLON, tegnBallon} from './udstyr.js';
import {nySerie, tilfoej} from './graf.js';

const LUP_FRA = {x:BALLON.x + 20, y:BALLON.y + 200, r:18};
const O = '#FF6A3D', C = '#566B68';
const FASE = {lag:'lagfase', vækst:'vækstfase', gæring:'fuld gæring', hvile:'færdig · gæren synker', død:'gæren er død'};

/* ── Luppens molekyler og celler ───────────────────────── */
function atom(g, x, y, r, farve){ g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); blaek(g, farve, 1.3); }

function tegnPartikel(g, p, rt){
  g.save(); g.translate(p.x, p.y); g.rotate(p.v);
  switch(p.type){
    case 'gaer':{
      /* knop, når gæren formerer sig */
      if(p.knop > 0.05){
        g.beginPath(); g.ellipse(17, -3, 7 * p.knop, 6 * p.knop, 0, 0, Math.PI * 2);
        blaek(g, FARVE.gaer, 1.8);
      }
      g.beginPath(); g.ellipse(0, 0, 15, 11.5, 0, 0, Math.PI * 2); blaek(g, FARVE.gaer, 2);
      g.beginPath(); g.arc(-4, 1, 3.6, 0, Math.PI * 2); blaek(g, '#D9C08A', 1.2);
      if(p.blink > 0){
        g.beginPath(); g.ellipse(0, 0, 15 + 5 * (1 - p.blink), 11.5 + 5 * (1 - p.blink), 0, 0, Math.PI * 2);
        g.lineWidth = 2; g.strokeStyle = `rgba(217,138,0,${p.blink})`; g.stroke();
      }
      break;
    }
    case 'doed':{
      g.beginPath();
      for(let i = 0; i <= 16; i++){
        const a = i / 16 * Math.PI * 2, r = 1 + 0.12 * Math.sin(i * 3);
        g.lineTo(Math.cos(a) * 13 * r, Math.sin(a) * 9.5 * r);
      }
      g.closePath(); blaek(g, '#D5DAD8', 1.6, SLATE);
      break;
    }
    case 'maltose':
      g.beginPath(); g.moveTo(-5, 0); g.lineTo(5, 0); g.lineWidth = 2; g.strokeStyle = INK; g.stroke();
      atom(g, -5, 0, 4.8, FARVE.sukkerLys); atom(g, 5, 0, 4.8, FARVE.sukkerLys);
      break;
    case 'ethanol':
      g.beginPath(); g.moveTo(-6, 2); g.lineTo(0, -2); g.lineTo(6, 2); g.lineWidth = 1.6; g.strokeStyle = INK; g.stroke();
      atom(g, -6, 2, 3.6, C); atom(g, 0, -2, 3.6, C); atom(g, 6, 2, 3.2, O);
      break;
    case 'ilt':
      atom(g, -3.5, 0, 3.8, O); atom(g, 3.5, 0, 3.8, O);
      break;
    case 'co2':
      g.beginPath(); g.arc(0, 0, 11, 0, Math.PI * 2); blaek(g, 'rgba(255,255,255,.8)', 1.2, SLATE);
      atom(g, -5.5, 0, 2.8, O); atom(g, 0, 0, 3, C); atom(g, 5.5, 0, 2.8, O);
      break;
  }
  g.restore();
}

/* ── Stationen ─────────────────────────────────────────── */
export default {
  id:'gaer', nr:3, navn:'Gæring',
  tid:{maks:21 * 24, fart:12, skridt:0.1, proeve:2, enhed:'døgn',
       tekst:t => 'dag ' + komma(t / 24, 1)},

  knapper:[
    {id:'temp', navn:'Gæringstemperatur', min:4, max:42, step:1, vaerdi:20, enhed:'°C',
     track:'linear-gradient(90deg,#9BE0F5,#D6EFC4 40%,#FFB300 70%,#FF6A3D)', kc:'var(--coral)'},
    {id:'gaer', navn:'Tørgær', min:2, max:30, step:0.5, vaerdi:11.5, enhed:'g', decimaler:1,
     laasVedStart:true, track:'linear-gradient(90deg,#FFF6E0,#E6D2A2)', kc:'#E6D2A2'},
  ],

  ligninger:[
    {id:'aand', titel:'Respiration · med ilt · gæren formerer sig', tone:'#EDF8E4',
     html:'C₆H₁₂O₆ + 6 O₂<span class="pil">→</span>6 CO₂ + 6 H₂O <span class="lys">+ energi</span>'},
    {id:'gaer', titel:'Alkoholgæring · uden ilt', tone:'#FFF1D6',
     html:'C₁₂H₂₂O₁₁ + H₂O<span class="pil">→</span>4 C₂H₅OH + 4 CO₂ <span class="lys">+ energi</span>'},
  ],

  maalere:[
    {id:'gaer', navn:'Gærceller', klasse:'g-gul', cc:'linear-gradient(90deg,#FFF1CF,#E6C27A)'},
    {id:'sg', navn:'Vægtfylde · hydrometer', klasse:'g-blaa', cc:'linear-gradient(90deg,#FFE3A0,#D98A00)'},
    {id:'alk', navn:'Alkohol', klasse:'g-lilla', cc:'linear-gradient(90deg,#C6AEF0,#7A4FD6)'},
    {id:'co2', navn:'CO₂ ud gennem gærlåsen', klasse:'g-groen', cc:'linear-gradient(90deg,#D6EFC4,#5FB030)'},
  ],

  signatur:`
    <span class="fact"><svg width="26" height="18" viewBox="-13 -9 26 18" aria-hidden="true"><ellipse rx="11" ry="8" fill="${FARVE.gaer}" stroke="#17211F" stroke-width="1.6"/><circle cx="-3" cy="1" r="2.6" fill="#D9C08A" stroke="#17211F" stroke-width="1"/></svg>Gærcelle</span>
    <span class="fact"><svg width="24" height="14" viewBox="-12 -7 24 14" aria-hidden="true"><path d="M-5 0h10" stroke="#17211F" stroke-width="2"/><circle cx="-5" cy="0" r="4.4" fill="${FARVE.sukkerLys}" stroke="#17211F" stroke-width="1.3"/><circle cx="5" cy="0" r="4.4" fill="${FARVE.sukkerLys}" stroke="#17211F" stroke-width="1.3"/></svg>Maltose</span>
    <span class="fact"><svg width="24" height="14" viewBox="-12 -7 24 14" aria-hidden="true"><path d="M-6 2L0 -2L6 2" stroke="#17211F" stroke-width="1.5" fill="none"/><circle cx="-6" cy="2" r="3.3" fill="${C}" stroke="#17211F"/><circle cx="0" cy="-2" r="3.3" fill="${C}" stroke="#17211F"/><circle cx="6" cy="2" r="3" fill="${O}" stroke="#17211F"/></svg><span class="enhed">C₂H₅OH</span> ethanol</span>
    <span class="fact"><svg width="22" height="14" viewBox="-11 -7 22 14" aria-hidden="true"><circle cx="-5.5" r="2.8" fill="${O}" stroke="#17211F"/><circle r="3" fill="${C}" stroke="#17211F"/><circle cx="5.5" r="2.8" fill="${O}" stroke="#17211F"/></svg><span class="enhed">CO₂</span></span>
    <span class="fact"><svg width="18" height="14" viewBox="-9 -7 18 14" aria-hidden="true"><circle cx="-3.5" r="3.5" fill="${O}" stroke="#17211F"/><circle cx="3.5" r="3.5" fill="${O}" stroke="#17211F"/></svg><span class="enhed">O₂</span> ilt</span>`,

  start(batch, v){
    const urt = batch.urtKogt;
    const g = B.nyGaering(urt, v.gaer, v.temp);
    const st = {
      g, urt, v, gaer0:g.gaer, sukker0:g.sukker,
      temperaturer:[v.temp],
      serier:{
        sukker:nySerie('sukker', FARVE.sukker, {stil:'fuld', tykkelse:3.6}),
        ethanol:nySerie('ethanol', FARVE.stivelse, {stil:'stiplet', tykkelse:3}),
        sg:nySerie('vægtfylde', INK, {stil:'prik', akse:'h', tykkelse:2.4}),
      },
      lup:[], bobler:[], laas:[], laasUr:0,
    };
    this.maal(st);
    return st;
  },

  ilt(st){
    const {g} = st;
    return Math.max(0, Math.min(1, 1 - (g.gaer + g.doed - st.gaer0) / (B.X_MAKS * 0.95 - st.gaer0)));
  },

  skridt(st, dt, v){
    if(v.temp !== st.temperaturer[st.temperaturer.length - 1]) st.temperaturer.push(v.temp);
    st.g.T = v.temp;
    B.skridtGaering(st.g, dt);
  },

  maal(st){
    const {g} = st;
    tilfoej(st.serier.sukker, g.t, g.sukker);
    tilfoej(st.serier.ethanol, g.t, g.ethanol);
    tilfoej(st.serier.sg, g.t, B.gaeringSG(g));
  },

  animer(st, dt, rt){
    const {g, lup:L} = st;
    const r = 122;
    const fase = B.fase(g);
    const levende = () => L.filter(p => p.type === 'gaer');
    const vedGaer = () => {
      const c = levende();
      if(!c.length) return {...tilfaeldigPlads(r, 30)};
      const valgt = c[Math.floor(Math.random() * c.length)];
      return {x:valgt.x + (Math.random() - 0.5) * 30, y:valgt.y + (Math.random() - 0.5) * 30, celle:valgt};
    };
    const ny = (type, pos, radius) => ({type, x:pos.x, y:pos.y, v:Math.random() * 6, vr:(Math.random() - 0.5) * 0.8, radius});

    /* gærcellerne: en ny celle dukker op, når bestanden vokser (knopperne
       ses på cellerne, mens de formerer sig) */
    const mål = Math.max(1, Math.min(10, Math.round(g.gaer / B.X_MAKS * 10)));
    juster(L, 'gaer', mål, () => ({...ny('gaer', tilfaeldigPlads(r, 34), 20), knop:0, blink:1}));
    juster(L, 'doed', Math.min(8, Math.round(g.doed / B.X_MAKS * 10)), () => ny('doed', tilfaeldigPlads(r, 30), 16));
    const vokser = fase === 'vækst' || (fase === 'gæring' && g.gaer < B.X_MAKS * 0.9);
    for(const c of levende()) c.knop = vokser ? 0.5 + 0.5 * Math.sin(rt * 1.3 + c.v * 5) : Math.max(0, (c.knop ?? 0) - dt);

    /* sukker ind, ethanol og CO₂ ud */
    const optaget = [];
    juster(L, 'maltose', Math.round(g.sukker / st.sukker0 * 22), () => ny('maltose', tilfaeldigPlads(r, 20), 10),
      liste => {
        const c = levende()[Math.floor(Math.random() * levende().length)];
        const p = c ? naermest(liste, c) : liste[0];
        if(c){ c.blink = 1; optaget.push(c); }
        return p;
      });
    for(const c of optaget){
      if(st.bobler.length < 40 && BLØDT) st.bobler.push({type:'co2', x:c.x, y:c.y, v:0, vy:-40 - Math.random() * 30});
    }
    juster(L, 'ethanol', Math.min(24, Math.round(g.ethanol / Math.max(1, st.sukker0 * B.ETHANOL_PR_G) * 20)),
      () => ny('ethanol', vedGaer(), 9));
    juster(L, 'ilt', Math.round(this.ilt(st) * 8), () => ny('ilt', tilfaeldigPlads(r, 20), 8),
      liste => { const c = levende()[0]; return c ? naermest(liste, c) : liste[0]; });

    /* Cellerne skubber blidt til hinanden, så de ikke klumper sammen,
       når nye knopper skilles af. */
    const celler = L.filter(p => p.type === 'gaer' || p.type === 'doed');
    for(let i = 0; i < celler.length; i++) for(let j = i + 1; j < celler.length; j++){
      const a = celler[i], b = celler[j];
      const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1;
      if(d < 40){
        const k = (40 - d) * 1.5 * dt / d;
        a.x -= dx * k; a.y -= dy * k; b.x += dx * k; b.y += dy * k;
      }
    }

    const fart = 10 + 16 * B.gaerTempo(g.T);
    for(const p of L){
      drift(p, dt, r, p.type === 'gaer' || p.type === 'doed' ? fart * 0.35 : fart);
      if(p.blink) p.blink = Math.max(0, p.blink - dt * 2.5);
    }
    /* døde celler synker til bunds */
    for(const p of L) if(p.type === 'doed' && p.y < r - 30) p.y += 6 * dt;
    for(const b of st.bobler){ b.y += b.vy * dt; b.x += Math.sin(b.y * 0.08) * 10 * dt; }
    st.bobler = st.bobler.filter(b => b.y > -r - 20);

    /* gærlåsen: bobler i takt med CO₂-dannelsen */
    st.laasUr += dt * Math.min(7, g.co2Rate * 5);
    if(st.laasUr > 1 && BLØDT){
      st.laasUr = 0;
      st.laas.push({dx:(Math.random() - 0.5) * 8, y:BALLON.y - 62, r:3 + Math.random() * 2.5});
    }
    for(const b of st.laas) b.y -= 70 * dt;
    st.laas = st.laas.filter(b => b.y > BALLON.y - 96);
  },

  tegn(g, st, rt){
    const {g:gg, urt} = st;
    const fase = B.fase(gg);
    const aktivitet = Math.min(1, gg.co2Rate / 1.2);
    const i_bund = fase === 'hvile' || fase === 'død';
    tegnBallon(g, {
      vaeske:ebcFarve(urt.ebc), rt, T:gg.T,
      uklar:i_bund ? 0.15 : 0.35 + 0.6 * aktivitet,
      skum:aktivitet,
      bundfald:Math.min(1, (gg.doed + (i_bund ? gg.gaer : gg.gaer * 0.15)) / 4),
      boblerIGaerlaas:st.laas,
    });
    maerkat(g, 'Gærballon · ' + komma(gg.V, 1) + ' L', BALLON.x, BALLON.y + BALLON.h + 22, {størrelse:10.5, stort:true});
    skilt(g, komma(gg.T, 0) + ' °C', BALLON.x + BALLON.b / 2 - 27, BALLON.y + 114, {stort:false, størrelse:11});

    lup(g, LUP_FRA, '#FFFCF3', (g2) => {
      const lag = ['doed', 'maltose', 'ilt', 'ethanol', 'gaer'];
      for(const t of lag) for(const p of st.lup) if(p.type === t) tegnPartikel(g2, p, rt);
      for(const b of st.bobler) tegnPartikel(g2, b, rt);
    });
    maerkat(g, 'Lup · gær, sukker og ethanol', 462, 116, {størrelse:9.5, farve:SLATE});
    skilt(g, FASE[fase], 462, 400, {fyld:fase === 'død' ? '#FFE9DC' : '#FFF3DC'});
  },

  graf(st){
    const maks = Math.max(60, Math.ceil(st.sukker0 / 20) * 20);
    const og = st.urt.og;
    const top = Math.ceil((og - 1) * 100 + 0.2) / 100 + 1;
    return {
      titel:'Sukker, ethanol og vægtfylde',
      tMaks:21 * 24, tTrin:72, tNavn:'tid (døgn)', tTal:t => komma(t / 24),
      venstre:{min:0, maks, trin:20, navn:'g/L'},
      hoejre:{min:1, maks:top, trin:top - 1 > 0.06 ? 0.02 : 0.01, navn:'vægtfylde', tal:v => komma(v, 2)},
      serier:Object.values(st.serier),
      nu:st.g.t,
    };
  },

  aflaes(st){
    const {g} = st;
    const sg = B.gaeringSG(g), abv = B.alkoholVol(g.ethanol), co2L = g.co2 * B.CO2_L_PR_G;
    const maksCO2 = st.sukker0 * B.CO2_PR_G * g.V * B.CO2_L_PR_G;
    return {
      gaer:{tal:komma(g.gaer * 20), enhed:'mio./mL', andel:g.gaer / B.X_MAKS},
      sg:{tal:komma(sg, 3), enhed:'OG ' + komma(st.urt.og, 3), andel:(sg - 0.99) / (st.urt.og - 0.99)},
      alk:{tal:komma(abv, 1), enhed:'% vol', andel:abv / 10},
      co2:{tal:komma(co2L), enhed:'L', andel:co2L / Math.max(1, maksCO2)},
    };
  },

  aktiv(st){
    const f = B.fase(st.g);
    return {aand:this.ilt(st) > 0.05 && (f === 'vækst' || f === 'gæring' || f === 'lag') && st.g.vaagen > 0.2,
            gaer:st.g.co2Rate > 0.05};
  },

  nu(st){ return st.g.t; },
  faerdig(st){ const f = B.fase(st.g); return f === 'hvile' || f === 'død'; },

  status(st){
    return 'Gæring · ' + this.tid.tekst(st.g.t) + ' · ' + FASE[B.fase(st.g)];
  },

  fortael(st){
    const a = this.aflaes(st);
    return `Gæring, ${this.tid.tekst(st.g.t)}, ${FASE[B.fase(st.g)]}. ${a.gaer.tal} millioner gærceller pr. milliliter, ` +
           `vægtfylde ${a.sg.tal}, ${a.alk.tal} procent alkohol, ${a.co2.tal} liter CO₂ er boblet ud.`;
  },

  afslut(st, batch){
    batch.gaering = {temperaturer:st.temperaturer.slice(), gaer:st.v.gaer, tid:st.g.t, fase:B.fase(st.g)};
    batch.oel = B.resultat(batch.urtKogt, st.g);
  },
};
