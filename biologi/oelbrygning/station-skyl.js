/* ═══════════════════════════════════════════════════════════
   station-skyl.js — 3 · Skylning.

   Mæsken er færdig. Hanen i bunden af mæskekarret åbnes, og den
   søde urt løber fra gennem kornlaget, der virker som filter
   (forurten). Når væsken står lige over kornene, begynder
   eftergydningen: varmt skyllevand fordeles over kornlaget i samme
   tempo, som urten løber fra, og vasker sukkeret ud af kornene.
   Man vælger skyllevandets temperatur og hvor meget urt, man vil
   have i kogekarret. Luppen viser kornene i laget: sukkeret
   diffunderer ud af dem og skylles med nedad.
   ═══════════════════════════════════════════════════════════ */
import * as B from './brygning.js';
import {INK, SLATE, FARVE, BLØDT, blaek, maerkat, skilt, komma,
        lup, juster, tilfaeldigPlads, ebcFarve} from './model.js';
import {HLT, SIKAR, KAR2, tegnSkyllevand, tegnSpreder, tegnSikar, tegnKar2, kar2Niveau,
        tegnStraale} from './udstyr.js';
import {nySerie, tilfoej} from './graf.js';

const LUP_STED = {x:476, y:178, r:112};
const LUP_FRA = {x:SIKAR.x + 150, y:SIKAR.y + 128, r:16};
const KORN = [[-52, -40], [40, -52], [-8, 6], [62, 30], [-60, 46], [8, 72], [-20, -86]];

function urtFarve(ebc, c, c0){
  return ebcFarve(ebc, Math.max(0.25, 1 - 0.75 * Math.min(1, c / Math.max(1, c0))));
}

/* ── Stationen ─────────────────────────────────────────── */
export default {
  id:'skyl', nr:3, navn:'Skylning',
  tid:{maks:150, fart:3, skridt:0.1, proeve:0.5, enhed:'min', auto:150,
       tekst:t => Math.floor(t + 1e-6) + ' min'},

  knapper:[
    {id:'skylT', navn:'Skyllevandets temperatur', min:55, max:95, step:1, vaerdi:77, enhed:'°C', adr:'skylT',
     track:'linear-gradient(90deg,#9BE0F5,#D6EFC4 45%,#5FB030 55%,#FFB300 68%,#FF6A3D)', kc:'var(--coral)'},
    {id:'urtV', navn:'Urt til kogekarret', min:16, max:36, step:1, vaerdi:26, enhed:'L', adr:'urtV',
     track:'linear-gradient(90deg,#FFF3C4,#D99B3A)', kc:'#D99B3A'},
  ],

  ligninger:[
    {id:'forurt', titel:'Forurt · urten løber fra kornlaget', tone:'#FFF1D6',
     html:'mæsk<span class="pil">→</span>sød urt + kornlag <span class="lys">(avnerne er filteret)</span>'},
    {id:'skyl', titel:'Eftergydning · skyllevandet vasker sukkeret ud', tone:'#E7F4FB',
     html:'sukker i kornene<span class="pil">→</span>sukker i skyllevandet <span class="lys">(diffusion · hurtigere, jo varmere)</span>'},
  ],

  maalere:[
    {id:'vol', navn:'Urt i kogekarret', klasse:'g-gul', cc:'linear-gradient(90deg,#FFE3A0,#D98A00)'},
    {id:'sgud', navn:'Afløbets vægtfylde', klasse:'g-blaa', cc:'linear-gradient(90deg,#9BD7F3,#0E86C8)'},
    {id:'udb', navn:'Sukker skyllet ud', klasse:'g-groen', cc:'linear-gradient(90deg,#D6EFC4,#5FB030)'},
    {id:'tb', navn:'Kornlagets temperatur', klasse:'g-pink', cc:'linear-gradient(90deg,#FFD9C9,#FF6A3D)'},
  ],

  signatur:`
    <span class="fact"><svg width="26" height="14" viewBox="-13 -7 26 14" aria-hidden="true"><ellipse rx="11" ry="5" fill="#C99A4B" stroke="#17211F" stroke-width="1.4"/></svg>Korn med avner</span>
    <span class="fact"><svg width="14" height="14" viewBox="-7 -7 14 14" aria-hidden="true"><circle r="4.4" fill="${FARVE.sukkerLys}" stroke="#17211F" stroke-width="1.3"/></svg>Sukker</span>
    <span class="fact"><svg width="16" height="16" viewBox="-8 -8 16 16" aria-hidden="true"><path d="M5 0L2.5 4.3H-2.5L-5 0L-2.5 -4.3H2.5Z" fill="#8A5A3C" stroke="#17211F" stroke-width="1.3"/></svg>Garvestof · snerper</span>
    <span class="fact">Skyllevand <b>75–78</b> <span class="enhed">°C</span></span>
    <span class="fact">Stop før afløbet er under <b>1,010</b></span>`,

  start(batch, v){
    const s = B.nySkylning(batch.maeskUd);
    const c0 = s.Eb / s.Vb;
    const st = {
      s, v, c0, sg0:B.vaegtfylde(c0), ebc:B.farveEBC(s.malt, 22),
      serier:{
        vol:nySerie('urt i kogekar', FARVE.sukker, {stil:'fuld', tykkelse:3.4}),
        sgud:nySerie('afløbets vægtfylde', FARVE.dextrin, {stil:'stiplet', akse:'h', tykkelse:3}),
        sgk:nySerie('kogekarrets vægtfylde', INK, {stil:'prik', akse:'h', tykkelse:2.4}),
      },
      lup:[], garvUr:0,
    };
    this.maal(st);
    return st;
  },

  skridt(st, dt, v){ if(st.s.Vk < v.urtV) B.skridtSkyl(st.s, dt, v.skylT); },

  maal(st){
    const {s} = st;
    tilfoej(st.serier.vol, s.t, s.Vk);
    tilfoej(st.serier.sgud, s.t, s.sgUd);
    if(s.Vk > 0.3) tilfoej(st.serier.sgk, s.t, B.kogekarSG(s));
  },

  animer(st, dt){
    const {s, lup:L} = st;
    const r = LUP_STED.r;
    const løber = st.s.t > 0 && st.s.Vk < st.v.urtV;
    const cg = s.Eg / s.A, cb = s.Eb / s.Vb;
    /* Sukker i kornene: prikker inde i kornene. Når de bliver færre,
       dukker de op i væsken ved siden af — de er diffunderet ud. */
    const udAfKorn = [];
    juster(L, 'iKorn', Math.round(cg / st.c0 * 28), () => {
      const k = KORN[Math.floor(Math.random() * KORN.length)];
      return {type:'iKorn', k, dx:(Math.random() - 0.5) * 28, dy:(Math.random() - 0.5) * 10};
    }, liste => { const p = liste[Math.floor(Math.random() * liste.length)]; udAfKorn.push(p); return p; });
    for(const p of udAfKorn) L.push({type:'sukker', x:p.k[0] + p.dx, y:p.k[1] + p.dy + 14});
    juster(L, 'sukker', Math.round(cb / st.c0 * 24), () => ({type:'sukker', ...tilfaeldigPlads(r, 14)}),
      liste => liste.reduce((a, b) => (b.y > a.y ? b : a)));
    /* Garvestoffer, når det er for varmt eller afløbet for tyndt. */
    const garv = Math.exp((s.Tb - 79) / 2.5) + Math.pow(Math.max(0, (1.012 - s.sgUd) / 0.004), 2);
    st.garvUr += løber ? dt * garv * 1.5 : 0;
    if(st.garvUr > 1 && BLØDT){
      st.garvUr = 0;
      const k = KORN[Math.floor(Math.random() * KORN.length)];
      L.push({type:'garv', x:k[0], y:k[1] + 14, v:Math.random() * 6});
    }
    /* Væsken strømmer nedad, når hanen er åben. */
    const fart = løber ? 34 : 0;
    for(const p of L){
      if(p.type === 'iKorn') continue;
      p.y += (fart + (BLØDT ? Math.sin(p.x * 0.1 + s.t * 3) * 4 : 0)) * dt;
      p.x += (BLØDT ? (Math.random() - 0.5) * 18 : 0) * dt;
      if(p.y > r){ if(p.type === 'garv'){ p.fjern = true; } else { p.y = -r + 4; } }
      if(Math.hypot(p.x, p.y) > r - 8){ const d = Math.hypot(p.x, p.y); p.x *= (r - 8) / d; if(p.y < 0) p.y *= (r - 8) / d; }
    }
    for(let i = L.length - 1; i >= 0; i--) if(L[i].fjern) L.splice(i, 1);
  },

  tegn(g, st, rt){
    const {s, v} = st;
    const løber = s.t > 0 && s.Vk < v.urtV;
    const skyller = løber && s.fase === 'skyl';
    const brugt = s.Vs / 30;
    tegnSkyllevand(g, 1 - brugt, v.skylT);
    tegnSpreder(g, skyller, rt);

    /* væskens overflade i sikarret */
    const bund = SIKAR.y + SIKAR.h - 14;
    const lagTop = bund - Math.min(SIKAR.h - 40, 20 + s.kg * 17);
    const over = s.Vb - B.FRI * s.kg;
    const top = Math.max(SIKAR.y + 8, lagTop - 6 - Math.max(0, over) * 9);
    const cb = s.Eb / s.Vb;
    const {hane} = tegnSikar(g, {kg:s.kg, vaeskeTop:top, vaeske:urtFarve(st.ebc, cb, st.c0), rt, loeber:løber});
    maerkat(g, 'Mæskekar · sikar', SIKAR.x + 6, SIKAR.y - 40, {justering:'left', størrelse:10});
    skilt(g, komma(s.Tb, 0) + ' °C', SIKAR.x + 40, SIKAR.y + 22, {stort:false, størrelse:11,
          fyld:s.Tb > 80 ? '#FFD9C9' : '#FFF3DC'});

    const kf = s.Vk > 0 ? s.Ek / s.Vk : 0;
    tegnKar2(g, s.Vk, urtFarve(st.ebc, kf, st.c0), rt);
    if(løber) tegnStraale(g, hane.x, hane.y, kar2Niveau(s.Vk), urtFarve(st.ebc, cb, st.c0), rt, 5);
    maerkat(g, 'Kogekar · ' + komma(s.Vk, 1) + ' / ' + v.urtV + ' L', KAR2.x + KAR2.b, KAR2.y - 16,
            {justering:'right', størrelse:10});
    /* afløbets vægtfylde, målt ved hanen */
    if(s.t > 0){
      const tynd = s.sgUd < 1.010;
      skilt(g, "Afløb " + komma(s.sgUd, 3), hane.x - 88, hane.y + 20,
            {stort:false, størrelse:10.5, fyld:tynd ? '#FFE9DC' : '#fff'});
    } else skilt(g, 'Tryk Start for at åbne hanen', SIKAR.x + SIKAR.b / 2, SIKAR.y + SIKAR.h + 24);

    lup(g, LUP_FRA, '#FFFDF6', (g2) => {
      for(const [kx, ky] of KORN){
        g2.save(); g2.translate(kx, ky);
        g2.beginPath(); g2.ellipse(0, 0, 32, 13, 0.15, 0, Math.PI * 2);
        blaek(g2, '#E6C88E', 2);
        g2.beginPath(); g2.ellipse(0, 0, 32, 13, 0.15, Math.PI * 0.95, Math.PI * 1.9);
        g2.lineWidth = 3.5; g2.strokeStyle = '#B58340'; g2.stroke();
        g2.restore();
      }
      for(const p of st.lup){
        if(p.type === 'iKorn'){
          g2.beginPath(); g2.arc(p.k[0] + p.dx, p.k[1] + p.dy, 3.6, 0, Math.PI * 2);
          blaek(g2, FARVE.sukkerLys, 1.1);
        } else if(p.type === 'sukker'){
          g2.beginPath(); g2.arc(p.x, p.y, 4.4, 0, Math.PI * 2); blaek(g2, FARVE.sukkerLys, 1.3);
        } else if(p.type === 'garv'){
          g2.save(); g2.translate(p.x, p.y); g2.rotate(p.v);
          g2.beginPath();
          for(let i = 0; i < 6; i++){ const a = i * Math.PI / 3; g2.lineTo(Math.cos(a) * 6, Math.sin(a) * 6); }
          g2.closePath(); blaek(g2, '#8A5A3C', 1.3); g2.restore();
        }
      }
      if(løber){
        for(let i = 0; i < 5; i++){
          const x = -80 + i * 40, y = -60 + ((rt * 40 + i * 37) % 120);
          g2.beginPath(); g2.moveTo(x, y); g2.lineTo(x, y + 12); g2.lineTo(x - 4, y + 7); g2.moveTo(x, y + 12); g2.lineTo(x + 4, y + 7);
          g2.lineWidth = 1.6; g2.strokeStyle = 'rgba(14,134,200,.45)'; g2.stroke();
        }
      }
    }, LUP_STED);
    maerkat(g, 'Lup · kornlaget', LUP_STED.x, LUP_STED.y - LUP_STED.r - 14, {størrelse:9.5, farve:SLATE});
    if(løber && (s.Tb > 80 || s.sgUd < 1.010)){
      skilt(g, s.Tb > 80 ? 'For varmt · garvestoffer' : 'Tyndt afløb · garvestoffer', LUP_STED.x, LUP_STED.y + LUP_STED.r + 18,
            {fyld:'#FFE9DC'});
    }
  },

  graf(st){
    const tMaks = Math.min(150, Math.max(40, Math.ceil((st.v.urtV / B.HANE + 6) / 10) * 10));
    const top = Math.ceil((st.sg0 - 1) * 100 + 0.3) / 100 + 1;
    return {
      titel:'Afløbet og urten i kogekarret',
      tMaks, tTrin:tMaks > 80 ? 20 : 10, tNavn:'tid (min)',
      venstre:{min:0, maks:40, trin:10, navn:'L'},
      hoejre:{min:1, maks:top, trin:top - 1 > 0.06 ? 0.02 : 0.01, navn:'vægtfylde', tal:v => komma(v, 2)},
      serier:Object.values(st.serier),
      nu:st.s.t,
    };
  },

  aflaes(st){
    const {s, v} = st;
    const u = B.skylUdbytte(s);
    return {
      vol:{tal:komma(s.Vk, 1), enhed:'L af ' + v.urtV, andel:s.Vk / 36},
      sgud:{tal:komma(s.sgUd, 3), enhed:komma(B.plato(s.sgUd), 1) + ' °P', andel:(s.sgUd - 1) / (st.sg0 - 1)},
      udb:{tal:komma(u * 100), enhed:'%', andel:u},
      tb:{tal:komma(s.Tb, 1), enhed:'°C', andel:(s.Tb - 40) / 55},
    };
  },

  aktiv(st){
    const løber = st.s.t > 0 && st.s.Vk < st.v.urtV;
    return {forurt:løber && st.s.fase === 'forurt', skyl:løber && st.s.fase === 'skyl'};
  },

  nu(st){ return st.s.t; },
  faerdig(st){ return st.s.Vk >= st.v.urtV - 1e-6; },
  stop(st){ return st.s.Vk >= st.v.urtV - 1e-6; },

  status(st){
    const {s} = st;
    const fase = s.t === 0 ? 'hanen er lukket' : this.faerdig(st) ? 'kogekarret er fyldt'
               : s.fase === 'forurt' ? 'forurten løber fra' : 'eftergydning';
    return 'Skylning · ' + Math.floor(s.t + 1e-6) + ' min · ' + fase;
  },

  fortael(st){
    const a = this.aflaes(st);
    return `Skylning efter ${Math.floor(st.s.t + 1e-6)} minutter. ${a.vol.tal} liter urt i kogekarret, ` +
           `afløbets vægtfylde ${a.sgud.tal}, ${a.udb.tal} procent af sukkeret er skyllet ud, kornlaget er ${a.tb.tal} grader.`;
  },

  afslut(st, batch){
    batch.skyl = {skylT:st.v.skylT, V:st.s.Vk, udbytte:B.skylUdbytte(st.s), sgUd:st.s.sgUd, Vs:st.s.Vs, Tmaks:st.s.Tmaks};
    batch.urt = B.urtAfSkyl(st.s);
  },
};
