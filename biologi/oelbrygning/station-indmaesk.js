/* ═══════════════════════════════════════════════════════════
   station-indmaesk.js — 1 · Indmæskning.

   Brygningen starter med råvarerne: en opskrift (eller ens egen),
   maltsorterne og vandet. Vandet fyldes i mæskekarret, og den
   kværnede malt røres i. Malten er kold, så blandingen bliver
   køligere end vandet — derfor skal indmæskningsvandet være et par
   grader varmere end den rast, mæsken skal stå ved. Til højre står
   opskriftens maltskema: hvor meget af hver malt, hvilken farve den
   giver, og hvor meget enzym der er til at omsætte stivelsen.
   ═══════════════════════════════════════════════════════════ */
import * as B from './brygning.js';
import {OPSKRIFTER, opskrift} from './opskrifter.js';
import {INK, SLATE, GRAF, PAPIR, blaek, boks, maerkat, tekst, skilt, komma,
        termometer, ebcFarve} from './model.js';
import {GRYDE, grydeNiveau, tegnGryde, tegnVarmeplade, tegnSaek, tegnStraale} from './udstyr.js';

const VAND_SLUT = 3, MALT_SLUT = 7, SLUT = 8;   /* min */
const VAND = '#CFEAF7', MAESK = '#E8D6A6';

function blandFarve(a, b, u){
  const h = s => [1, 3, 5].map(i => parseInt(s.slice(i, i + 2), 16));
  const [x, y] = [h(a), h(b)];
  return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * u)).join(',')})`;
}

const malt = v => Object.fromEntries(B.MALTE.map(m => [m.id, v['m-' + m.id] || 0]));

/* ── Stationen ─────────────────────────────────────────── */
export default {
  id:'indmaesk', nr:1, navn:'Indmæskning',
  tid:{maks:SLUT, fart:1, skridt:0.02, proeve:0.25, auto:SLUT,
       tekst:t => Math.floor(t + 1e-6) + ' min'},
  kolonner:6,

  knapper:[
    {id:'opskrift', type:'valg', navn:'Opskrift', vaerdi:'blond', spaend:2, laas:true, adr:'opskrift',
     valg:[...OPSKRIFTER.map(o => ({id:o.id, navn:o.navn})), {id:'egen', navn:'Egen opskrift'}]},
    {id:'vand', navn:'Vand', min:8, max:24, step:0.5, vaerdi:13, enhed:'L', decimaler:1,
     laas:true, genstart:true, adr:'vand', track:'linear-gradient(90deg,#EAF6FC,#0E86C8)', kc:'var(--blue)'},
    {id:'vandT', navn:'Vandtemperatur', min:40, max:90, step:1, vaerdi:72, enhed:'°C',
     laas:true, genstart:true, adr:'vandT', track:'linear-gradient(90deg,#9BE0F5,#FFB300 55%,#FF6A3D)', kc:'var(--coral)'},
    ...B.MALTE.map(m => {
      const basis = m.enzym > 0.4;
      return {id:'m-' + m.id, navn:m.kort, min:0, max:basis ? 7 : 1.5, step:basis ? 0.05 : 0.05,
              vaerdi:0, enhed:'kg', decimaler:2, laas:true, genstart:true, adr:m.id, klasse:'knob-malt',
              track:`linear-gradient(90deg,#FFFDF6,${m.farve})`, kc:m.farve};
    }),
  ],

  ligninger:[
    {id:'varme', titel:'Varmebalance · vandet afgiver, malten optager', tone:'#FFE3A0',
     html:'m<sub>v</sub> · c<sub>v</sub> · (T<sub>v</sub> − T)<span class="pil">=</span>m<sub>m</sub> · c<sub>m</sub> · (T − T<sub>m</sub>)'},
    {id:'forhold', titel:'Mæskens tykkelse · vand pr. kg malt', tone:'#E7F4FB',
     html:'V / m'},
  ],

  maalere:[
    {id:'kg', navn:'Malt i alt', klasse:'g-gul', cc:'linear-gradient(90deg,#FFF1CF,#D99B3A)'},
    {id:'forhold', navn:'Vand : malt', klasse:'g-blaa', cc:'linear-gradient(90deg,#9BD7F3,#0E86C8)'},
    {id:'T', navn:'Blandingstemperatur', klasse:'g-pink', cc:'linear-gradient(90deg,#FFD9C9,#FF6A3D)'},
    {id:'og', navn:'Forventet OG · 22 L', klasse:'g-lilla', cc:'linear-gradient(90deg,#C6AEF0,#7A4FD6)'},
  ],

  signatur(v){
    const o = opskrift(v.opskrift);
    if(!o) return `<span class="fact">Egen opskrift <b>vælg malt og vand</b></span>
      <span class="fact">Basismalt har enzymer · karamel og ristet malt har ingen</span>`;
    return `<span class="fact">Opskrift <b>${o.navn}</b></span>
      <span class="fact">Mål <b>OG ${komma(o.maal.og, 3)} · ${komma(o.maal.ibu)} IBU · ${komma(o.maal.abv, 1)} %</b></span>
      <span class="fact">Efter <b>${o.kilde}</b></span>`;
  },

  start(batch, v){
    const m = malt(v), kg = B.maltKg(m);
    return {v, m, kg, t:0, T:v.vandT, V:0, andel:0, Tmix:B.blandingsT(v.vand, v.vandT, kg)};
  },

  skridt(st, dt){
    st.t = Math.min(SLUT, st.t + dt);
    const {v, kg} = st;
    st.V = v.vand * Math.min(1, st.t / VAND_SLUT);
    st.andel = Math.max(0, Math.min(1, (st.t - VAND_SLUT) / (MALT_SLUT - VAND_SLUT)));
    st.T = st.andel > 0 ? B.blandingsT(v.vand, v.vandT, kg * st.andel) : v.vandT;
  },
  maal(){},

  tegn(g, st, rt){
    const {v, kg} = st;
    const V = st.V + kg * st.andel * B.KORN_VOL;
    const koerer = st.t > 0 && st.t < MALT_SLUT;
    tegnGryde(g, {vaeske:blandFarve(VAND, MAESK, st.andel), niveau:grydeNiveau(Math.max(0.01, V)),
                  rt, korn:Math.min(1, kg / 5) * st.andel, bobler:0});
    tegnVarmeplade(g, false, rt);
    termometer(g, GRYDE.x + GRYDE.b - 62, GRYDE.y - 40, 170, st.V > 0 ? st.T : 20, {min:10, max:90});
    skilt(g, komma(st.V > 0 ? st.T : 20, 1) + ' °C', GRYDE.x + GRYDE.b - 62, GRYDE.y - 56, {stort:false, størrelse:11.5});
    maerkat(g, 'Mæskekar', GRYDE.x + 8, GRYDE.y - 18, {justering:'left', størrelse:10.5});

    /* vand og malt, der hældes i */
    if(st.t > 0 && st.t < VAND_SLUT){
      g.beginPath(); g.moveTo(GRYDE.x + 20, 40); g.lineTo(GRYDE.x + 60, 40); g.lineTo(GRYDE.x + 60, 58);
      g.lineWidth = 8; g.strokeStyle = INK; g.stroke(); g.lineWidth = 4.5; g.strokeStyle = '#9BD7F3'; g.stroke();
      tegnStraale(g, GRYDE.x + 60, 60, grydeNiveau(V), '#9BD7F3', rt, 6);
    }
    if(st.andel > 0 && st.t < MALT_SLUT){
      for(let i = 0; i < 26; i++){
        const u = ((rt * 1.3 + i * 0.137) % 1);
        const kx = GRYDE.x + 125 + Math.sin(i * 2.1) * 10, ky = 70 + u * (grydeNiveau(V) - 70);
        g.save(); g.translate(kx, ky); g.rotate(i);
        g.beginPath(); g.ellipse(0, 0, 4.5, 2.2, 0, 0, Math.PI * 2);
        g.fillStyle = '#C99A4B'; g.fill(); g.restore();
      }
    }
    if(st.t === 0) skilt(g, 'Tryk Start for at fylde karret', GRYDE.x + GRYDE.b / 2, GRYDE.y + GRYDE.h - 40);

    /* maltsækkene */
    const sække = B.MALTE.filter(m => st.m[m.id] > 0);
    if(!sække.length) maerkat(g, 'Ingen malt valgt', 465, 220, {størrelse:10, farve:SLATE});
    const y0 = 236 - Math.ceil(sække.length / 2) * 52;
    sække.forEach((m, i) => {
      const x = 408 + (i % 2) * 118, y = y0 + Math.floor(i / 2) * 104;
      tegnSaek(g, x, y, {navn:m.kort, kg:st.m[m.id], farve:m.farve,
                         fyld:1 - st.andel, tom:st.andel >= 1});
    });

    this.tegnSkema(g, st);
  },

  /* Maltskemaet i grafens plads. */
  tegnSkema(g, st){
    const {x, y, b, h} = GRAF;
    boks(g, x, y, b, h, 12); blaek(g, '#fff', 2);
    maerkat(g, 'Maltskema', x + 14, y + 17, {justering:'left', størrelse:10.5, farve:SLATE});
    const o = opskrift(st.v.opskrift);
    tekst(g, o ? o.navn : 'Egen opskrift', x + 16, y + 44, {størrelse:16, justering:'left'});
    g.font = "400 12.5px 'Source Serif 4',Georgia,serif"; g.fillStyle = SLATE;
    g.textAlign = 'left'; g.textBaseline = 'middle';
    g.fillText(o ? o.tekst : 'Vælg maltsorterne med skyderne under figuren.', x + 16, y + 66);

    const kg = st.kg;
    const rækker = B.MALTE.filter(m => st.m[m.id] > 0);
    const rh = Math.min(42, 236 / Math.max(1, rækker.length));
    const bx = x + 38, bw = b - 54;
    rækker.forEach((m, i) => {
      const yy = y + 92 + i * rh;
      const andel = st.m[m.id] / Math.max(0.01, kg);
      g.beginPath(); g.arc(x + 24, yy + 3, 7, 0, Math.PI * 2); blaek(g, m.farve, 1.6);
      maerkat(g, m.navn, bx, yy, {justering:'left', størrelse:9.5, spær:0.6});
      maerkat(g, komma(st.m[m.id], 2) + ' kg · ' + komma(andel * 100) + ' %', x + b - 16, yy,
              {justering:'right', størrelse:9.5, stort:false, spær:0.3});
      boks(g, bx, yy + 8, bw, 7, 3.5); blaek(g, '#F4F6F5', 1.2);
      boks(g, bx, yy + 8, Math.max(7, bw * andel), 7, 3.5); blaek(g, m.farve, 1.2);
      if(rh >= 36){
        g.font = "400 11.5px 'Source Serif 4',Georgia,serif"; g.fillStyle = SLATE;
        g.textAlign = 'left'; g.textBaseline = 'middle';
        g.fillText(m.smag + (m.enzym > 0.4 ? '' : ' · ingen enzymer'), bx, yy + 25);
      }
    });
    if(!rækker.length) maerkat(g, 'Ingen malt endnu', x + 16, y + 100, {justering:'left', størrelse:10, farve:SLATE});

    /* nederst: enzymer og forventet farve */
    const yb = y + h - 78;
    g.beginPath(); g.moveTo(x + 14, yb - 14); g.lineTo(x + b - 14, yb - 14);
    g.lineWidth = 1.2; g.strokeStyle = 'rgba(23,33,31,.18)'; g.stroke();
    const enz = B.enzymkraft(st.m);
    maerkat(g, 'Enzymer', x + 16, yb + 4, {justering:'left', størrelse:9.5, farve:SLATE});
    boks(g, x + 110, yb - 3, 150, 14, 7); blaek(g, '#F4F6F5', 1.4);
    if(enz > 0.01){ boks(g, x + 110, yb - 3, Math.max(14, 150 * enz), 14, 7); blaek(g, '#0FA593', 1.4); }
    maerkat(g, komma(enz * 100) + ' %', x + 270, yb + 4, {justering:'left', størrelse:9.5, stort:false, spær:0.3});
    const ebc = kg > 0 ? B.farveEBC(st.m, 22) : 0;
    maerkat(g, 'Farve', x + 16, yb + 36, {justering:'left', størrelse:9.5, farve:SLATE});
    boks(g, x + 110, yb + 24, 150, 24, 8); blaek(g, kg > 0 ? ebcFarve(ebc) : '#F4F6F5', 1.6);
    maerkat(g, komma(ebc) + ' EBC', x + 270, yb + 36, {justering:'left', størrelse:9.5, stort:false, spær:0.3});
  },

  aflaes(st){
    const {v, kg} = st;
    const r = v.vand / Math.max(0.01, kg);
    const og = kg > 0 ? B.forventetOG(st.m) : 1;
    return {
      kg:{tal:komma(kg, 2), enhed:'kg', andel:kg / 8},
      forhold:{tal:kg > 0 ? komma(r, 1) : '–', enhed:'L/kg', andel:Math.min(1, r / 5)},
      T:{tal:komma(st.Tmix, 1), enhed:'°C', andel:(st.Tmix - 40) / 50},
      og:{tal:komma(og, 3), enhed:'≈ ' + komma(kg > 0 ? B.farveEBC(st.m, 22) : 0) + ' EBC', andel:(og - 1) / 0.1},
    };
  },

  lignTekst(st){
    const {v, kg} = st, T = st.Tmix;
    const afgiv = v.vand * B.VAND_C * (v.vandT - T);
    return {
      varme:`${komma(v.vand, 1)} · 4,18 · (${komma(v.vandT)} − ${komma(T, 1)})<span class="pil">=</span>` +
            `${komma(kg, 2)} · 1,7 · (${komma(T, 1)} − 20) <span class="lys">≈ ${komma(afgiv)} kJ</span>`,
      forhold:`${komma(v.vand, 1)} L / ${komma(kg, 2)} kg<span class="pil">=</span>` +
              `${kg > 0 ? komma(v.vand / kg, 1) : '–'} L/kg <span class="lys">(tyk under 2,5 · tynd over 4)</span>`,
    };
  },

  aktiv(st){ return {varme:st.t >= VAND_SLUT, forhold:st.t < VAND_SLUT}; },

  nu(st){ return st.t; },
  faerdig(st){ return st.t >= SLUT - 1e-9; },
  stop(st){ return st.t >= SLUT - 1e-9; },

  status(st){
    const fase = st.t === 0 ? 'klar' : st.t < VAND_SLUT ? 'vand fyldes i' : st.t < MALT_SLUT ? 'malten røres i' : 'mæsken er rørt';
    return 'Indmæskning · ' + fase + ' · ' + komma(st.V > 0 ? st.T : st.v.vandT, 1) + ' °C';
  },

  fortael(st){
    const a = this.aflaes(st);
    return `Indmæskning: ${a.kg.tal} kg malt i ${komma(st.v.vand, 1)} liter vand ved ${komma(st.v.vandT)} grader. ` +
           `Blandingen bliver ${a.T.tal} grader. Forventet OG ${a.og.tal}.`;
  },

  afslut(st, batch){
    batch.opskrift = st.v.opskrift;
    batch.indmaesk = {malt:{...st.m}, kg:st.kg, vand:st.v.vand, vandT:st.v.vandT, T:st.Tmix};
  },
};
