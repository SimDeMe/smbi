/* ═══════════════════════════════════════════════════════════
   station-maesk.js — 2 · Mæskning.

   Maltens egne amylaser klipper stivelsen i stykker. Temperaturen
   bestemmer, hvilket af de to enzymer der vinder — og dermed hvor
   meget af sukkeret gæren senere kan bruge. Man vælger et
   mæskeprogram (en eller flere raster og til sidst udmæskning ved
   78 °C), eller styrer temperaturen selv. Luppen viser kæderne af
   glukose og de to enzymer; jodprøverne under luppen viser,
   hvornår stivelsen er væk.
   ═══════════════════════════════════════════════════════════ */
import * as B from './brygning.js';
import {INK, SLATE, FARVE, BLØDT, blaek, boks, maerkat, skilt, komma,
        lup, termometer, drift, juster, naermest, tilfaeldigPlads} from './model.js';
import {GRYDE, grydeNiveau, tegnGryde, tegnVarmeplade} from './udstyr.js';
import {nySerie, tilfoej} from './graf.js';

const JOD_TIDER = [10, 20, 30, 40, 50, 60];
const LUP_FRA = {x:GRYDE.x + 150, y:GRYDE.y + 150, r:18};

/* ── Luppens molekyler ─────────────────────────────────── */
const PERLE = 5.2, AFSTAND = 10.4;
const FORM = {
  stivelse:{n:9, gren:[3, 3], radius:50},
  dextrin:{n:4, radius:22},
  graense:{n:3, gren:[1, 1], radius:18},
  maltose:{n:2, radius:11},
  alfa:{radius:14}, beta:{radius:14},
};
const FYLD = {
  stivelse:FARVE.stivelseLys, dextrin:FARVE.dextrinLys,
  graense:'#9FCDEB', maltose:FARVE.sukkerLys,
};

function perler(p){
  const f = FORM[p.type], ud = [];
  const cv = Math.cos(p.v), sv = Math.sin(p.v);
  const bølge = i => Math.sin(i * 1.3 + (p.fase ?? 0)) * 3;
  for(let i = 0; i < f.n; i++){
    const a = (i - (f.n - 1) / 2) * AFSTAND, b = bølge(i);
    ud.push([p.x + cv * a - sv * b, p.y + sv * a + cv * b]);
  }
  const gren = [];
  if(f.gren){
    const [fra, n] = f.gren;
    const [gx, gy] = ud[fra];
    const gv = p.v - 1.05;
    for(let i = 1; i <= n; i++){
      gren.push([gx + Math.cos(gv) * AFSTAND * i, gy + Math.sin(gv) * AFSTAND * i]);
    }
  }
  return {kaede:ud, gren, fra:f.gren ? ud[f.gren[0]] : null};
}

function tegnKaede(g, p){
  const {kaede, gren, fra} = perler(p);
  g.beginPath();
  kaede.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y));
  if(gren.length){ g.moveTo(...fra); for(const pt of gren) g.lineTo(...pt); }
  g.lineWidth = 2.2; g.strokeStyle = INK; g.stroke();
  for(const [x, y] of [...kaede, ...gren]){
    g.beginPath(); g.arc(x, y, PERLE, 0, Math.PI * 2);
    blaek(g, FYLD[p.type], 1.5);
  }
  /* forgreningen (α-1,6) markeres med en lille prik */
  if(fra){ g.beginPath(); g.arc(fra[0], fra[1], 2, 0, Math.PI * 2); g.fillStyle = INK; g.fill(); }
}

export function tegnEnzym(g, x, y, v, type, aktiv, rt = 0){
  const farve = type === 'alfa' ? FARVE.alfa : FARVE.beta;
  const bogstav = type === 'alfa' ? 'α' : 'β';
  g.save(); g.translate(x, y);
  if(aktiv){
    const mund = 0.35 + 0.25 * Math.abs(Math.sin(rt * 6));
    g.rotate(v);
    g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, 13, mund, Math.PI * 2 - mund); g.closePath();
    blaek(g, farve, 2);
    g.rotate(-v);
    g.font = "800 12px Archivo,system-ui,sans-serif";
    g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(bogstav, -2, 1);
  } else {
    /* Denatureret: kæden er foldet ud og har mistet sin form. */
    g.rotate(v);
    g.beginPath(); g.moveTo(-15, 0);
    for(let i = 0; i <= 12; i++) g.lineTo(-15 + i * 2.5, Math.sin(i * 1.9) * 6);
    g.lineWidth = 3.2; g.strokeStyle = farve; g.globalAlpha = 0.45; g.stroke();
    g.globalAlpha = 1;
    g.rotate(-v);
    g.font = "800 10px Archivo,system-ui,sans-serif";
    g.fillStyle = SLATE; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(bogstav, 0, -11);
  }
  g.restore();
}

function nyPartikel(type, pos){
  return {type, x:pos.x, y:pos.y, v:Math.random() * Math.PI * 2,
          vr:(Math.random() - 0.5) * 0.5, fase:Math.random() * 6, radius:FORM[type].radius};
}

/* ── Jodprøven ─────────────────────────────────────────── */
function jodFarve(rest){
  if(rest <= 0.03) return '#C98B2E';                   /* gulbrun: jodens egen farve */
  const u = Math.min(1, (rest - 0.03) / 0.3);
  const a = [110, 90, 168], b = [34, 28, 70];          /* fra violet til blåsort */
  return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * u)).join(',')})`;
}

function tegnJodplade(g, st){
  const x = 348, y = 402, b = 232, h = 58;
  boks(g, x, y, b, h, 10); blaek(g, '#fff', 2.2);
  maerkat(g, 'Jodprøve', x + 12, y - 11, {justering:'left', størrelse:9.5, farve:SLATE});
  JOD_TIDER.forEach((t, i) => {
    const cx = x + 22 + i * 37.5, cy = y + 24;
    g.beginPath(); g.arc(cx, cy, 13, 0, Math.PI * 2);
    const prøve = st.jod[i];
    blaek(g, prøve == null ? '#F1F3F2' : jodFarve(prøve), 1.6);
    maerkat(g, t + ' min', cx, y + h - 9, {størrelse:8, stort:false, spær:0.2, farve:SLATE});
  });
}

/* ── Stationen ─────────────────────────────────────────── */
export default {
  id:'maesk', nr:2, navn:'Mæskning',
  tid:{maks:150, fart:3, skridt:0.05, proeve:0.5, enhed:'min', auto:150,
       tekst:t => Math.floor(t + 1e-6) + ' min'},

  knapper:[
    {id:'program', type:'valg', navn:'Mæskeprogram', vaerdi:'infusion', laas:true, genstart:true, adr:'program',
     valg:B.PROGRAMMER.map(p => ({id:p.id, navn:p.navn}))},
    {id:'rast', navn:'Rasttemperatur', min:50, max:80, step:1, vaerdi:66, enhed:'°C', adr:'rast',
     laas:v => v.program === 'infusion', genstart:true, deaktiv:v => v.program === 'trin',
     track:'linear-gradient(90deg,#9BE0F5,#FFB300 45%,#FF6A3D)', kc:'var(--coral)'},
    {id:'tid', navn:'Rasttid', min:20, max:90, step:5, vaerdi:60, enhed:'min', adr:'rasttid',
     laas:true, genstart:true, deaktiv:v => v.program !== 'infusion',
     track:'linear-gradient(90deg,#FFF3C4,#D99B3A)', kc:'#D99B3A'},
  ],

  ligninger:[
    {id:'beta', titel:'β-amylase · klipper maltose af enderne', tone:'#FBD3E1',
     html:'stivelse + H₂O<span class="pil">→</span>maltose <span class="lys">C₁₂H₂₂O₁₁</span> + grænsedextrin'},
    {id:'alfa', titel:'α-amylase · klipper midt i kæderne', tone:'#D2F1EC',
     html:'stivelse + H₂O<span class="pil">→</span>dextriner + lidt sukker'},
  ],

  maalere:[
    {id:'beta', navn:'β-amylase · aktivt enzym', klasse:'g-pink', cc:'linear-gradient(90deg,#F7A8C2,#E8336D)'},
    {id:'alfa', navn:'α-amylase · aktivt enzym', klasse:'g-teal', cc:'linear-gradient(90deg,#8FE0D4,#0FA593)'},
    {id:'jod', navn:'Stivelse tilbage · jodprøve', klasse:'g-lilla', cc:'linear-gradient(90deg,#C6AEF0,#7A4FD6)'},
    {id:'gaerbar', navn:'Gærbart sukker · af ekstraktet', klasse:'g-gul', cc:'linear-gradient(90deg,#FFE3A0,#D98A00)'},
  ],

  signatur:`
    <span class="fact"><svg width="58" height="14" viewBox="0 0 58 14" aria-hidden="true"><path d="M6 7h46" stroke="#17211F" stroke-width="2"/>${[6,16,26,36,46].map(x => `<circle cx="${x+3}" cy="7" r="4.6" fill="${FARVE.stivelseLys}" stroke="#17211F" stroke-width="1.4"/>`).join('')}</svg>Stivelse</span>
    <span class="fact"><svg width="38" height="14" viewBox="0 0 38 14" aria-hidden="true"><path d="M6 7h26" stroke="#17211F" stroke-width="2"/>${[6,16,26].map(x => `<circle cx="${x+3}" cy="7" r="4.6" fill="${FARVE.dextrinLys}" stroke="#17211F" stroke-width="1.4"/>`).join('')}</svg>Dextrin</span>
    <span class="fact"><svg width="26" height="14" viewBox="0 0 26 14" aria-hidden="true"><path d="M7 7h12" stroke="#17211F" stroke-width="2"/>${[7,19].map(x => `<circle cx="${x}" cy="7" r="4.6" fill="${FARVE.sukkerLys}" stroke="#17211F" stroke-width="1.4"/>`).join('')}</svg>Maltose · gærbar</span>
    <span class="fact"><svg width="18" height="18" viewBox="-9 -9 18 18" aria-hidden="true"><path d="M0 0L7.4 3.4A8 8 0 1 1 7.4 -3.4Z" fill="${FARVE.alfa}" stroke="#17211F" stroke-width="1.5"/></svg><span><span class="enhed">α</span>-amylase</span></span>
    <span class="fact"><svg width="18" height="18" viewBox="-9 -9 18 18" aria-hidden="true"><path d="M0 0L7.4 3.4A8 8 0 1 1 7.4 -3.4Z" fill="${FARVE.beta}" stroke="#17211F" stroke-width="1.5"/></svg><span><span class="enhed">β</span>-amylase</span></span>
    <span class="fact"><svg width="30" height="14" viewBox="0 0 30 14" aria-hidden="true"><path d="M2 7l3-5 3 10 3-10 3 10 3-10 3 10 3-10 3 10 2-5" fill="none" stroke="#9AA6A4" stroke-width="2.4"/></svg>Denatureret</span>`,

  start(batch, v){
    const ind = batch.indmaesk;
    const m = B.nyMaesk(ind.malt, ind.vand, ind.T);
    const prog = B.program(v.program);
    const trin = prog.trin ? prog.trin(v) : null;
    const st = {
      m, S0:Math.max(1, m.stivelse), v, prog, p:B.nyKoersel(trin),
      tMaks:Math.min(150, Math.max(60, Math.ceil((B.programTid(trin, ind.T, m.kg, m.vand) + 8) / 30) * 30)),
      maalT:trin ? trin[0].T : v.rast,
      jod:JOD_TIDER.map(() => null),
      temperaturer:[Math.round(ind.T)],
      serier:{
        stivelse:nySerie('stivelse', FARVE.stivelse, {stil:'fuld'}),
        dextrin:nySerie('dextriner', FARVE.dextrin, {stil:'stiplet'}),
        sukker:nySerie('gærbart sukker', FARVE.sukker, {stil:'fuld', tykkelse:3.6}),
        temp:nySerie('temperatur', FARVE.varme, {stil:'prik', akse:'h', tykkelse:2.4}),
        maal:nySerie('program', '#B9C4C2', {stil:'stiplet', akse:'h', tykkelse:1.8}),
      },
      lup:[], blink:[],
    };
    this.maal(st);
    return st;
  },

  /* Et skridt i modellen. v er skydernes værdier lige nu. */
  skridt(st, dt, v){
    const {m} = st;
    const maal = st.p.trin ? B.programMaal(st.p, m, dt) : v.rast;
    if(maal != null) st.maalT = maal;
    if(maal != null && maal !== st.temperaturer[st.temperaturer.length - 1]) st.temperaturer.push(maal);
    B.skridtMaesk(m, dt, maal);
    JOD_TIDER.forEach((t, i) => {
      if(st.jod[i] == null && m.t >= t) st.jod[i] = B.jodproeve(m, st.S0).rest;
    });
  },

  maal(st){
    const {m, serier} = st;
    tilfoej(serier.stivelse, m.t, m.stivelse);
    tilfoej(serier.dextrin, m.t, m.dextrin + m.graense);
    tilfoej(serier.sukker, m.t, m.sukker);
    tilfoej(serier.temp, m.t, m.T);
    tilfoej(serier.maal, m.t, st.maalT);
  },

  /* Luppens molekyler følger modellens puljer. Kører også, når uret står. */
  animer(st, dt, rt){
    const {m, S0, lup:L} = st;
    const r = 122;
    const tempo = B.enzymTempo(m);
    const aktive = type => L.filter(p => p.type === type && p.aktiv);
    const klip = (enzym, x, y) => {
      st.blink.push({x, y, t:0, farve:enzym === 'alfa' ? FARVE.alfa : FARVE.beta});
    };
    const vedEnzym = (type, fallback) => {
      const e = aktive(type);
      if(!e.length) return fallback ?? tilfaeldigPlads(r, 30);
      const valgt = e[Math.floor(Math.random() * e.length)];
      return {x:valgt.x + (Math.random() - 0.5) * 24, y:valgt.y + (Math.random() - 0.5) * 24, enzym:valgt};
    };

    /* enzymerne: tre af hver, og så mange er denaturerede, som modellen siger */
    for(const [type, A] of [['alfa', m.alfa], ['beta', m.beta]]){
      juster(L, type, 3, () => ({...nyPartikel(type, tilfaeldigPlads(r, 30)), aktiv:true}));
      const mine = L.filter(p => p.type === type);
      const døde = Math.round((1 - A) * 3);
      mine.forEach((p, i) => { p.aktiv = i >= døde; });
    }

    /* kulhydraterne */
    const S = S0;
    const mål = {
      stivelse:Math.round(m.stivelse / S * 6),
      dextrin:Math.round(m.dextrin / S * 14),
      graense:Math.round(m.graense / S * 12),
      maltose:Math.min(34, Math.round(m.sukker / S * 30)),
    };
    /* Stivelse, der forsvinder, er klippet af α-amylase (den nærmeste). */
    juster(L, 'stivelse', mål.stivelse, () => nyPartikel('stivelse', tilfaeldigPlads(r, 50)), liste => {
      const e = aktive('alfa')[0] || aktive('beta')[0];
      const p = e ? naermest(liste, e) : liste[0];
      if(e) klip('alfa', p.x, p.y);
      return p;
    });
    juster(L, 'dextrin', mål.dextrin, () => {
      const pos = vedEnzym('alfa'); if(pos.enzym) klip('alfa', pos.x, pos.y);
      return nyPartikel('dextrin', pos);
    }, liste => naermest(liste, aktive('beta')[0] || aktive('alfa')[0] || {x:0, y:0}));
    juster(L, 'graense', mål.graense, () => nyPartikel('graense', vedEnzym('alfa')));
    juster(L, 'maltose', mål.maltose, () => {
      const pos = vedEnzym(Math.random() < tempo.beta / (tempo.beta + tempo.alfa * 0.3 + 1e-6) ? 'beta' : 'alfa');
      if(pos.enzym) klip(pos.enzym.type, pos.x, pos.y);
      return nyPartikel('maltose', pos);
    });

    for(const p of L){
      const fart = p.type === 'alfa' ? 16 + 50 * tempo.alfa
                 : p.type === 'beta' ? 16 + 50 * tempo.beta
                 : p.type === 'stivelse' ? 5 : p.type === 'maltose' ? 26 : 12;
      drift(p, dt, r, (p.aktiv === false ? 6 : fart) * (0.6 + m.T / 150));
    }
    for(const b of st.blink) b.t += dt;
    st.blink = st.blink.filter(b => b.t < 0.45).slice(-12);
  },

  tegn(g, st, rt){
    const {m} = st;
    const omsat = 1 - m.stivelse / st.S0;
    const væske = `rgb(${Math.round(236 - 8 * omsat)},${Math.round(224 - 44 * omsat)},${Math.round(196 - 110 * omsat)})`;
    tegnGryde(g, {vaeske:væske, niveau:grydeNiveau(m.vand + m.kg * B.KORN_VOL),
                  uklar:(1 - omsat) * 0.6, rt, korn:Math.min(1, m.kg / 5)});
    tegnVarmeplade(g, m.varmer, rt);
    /* termometer i gryden */
    termometer(g, GRYDE.x + GRYDE.b - 62, GRYDE.y - 40, 170, m.T, {min:40, max:90, maal:st.p.faerdig ? null : st.maalT});
    const tr = this.trin(st);
    if(tr) skilt(g, tr, GRYDE.x + GRYDE.b / 2 - 20, GRYDE.y + 22, {fyld:'#FFF3DC'});
    skilt(g, komma(m.T, 1) + ' °C', GRYDE.x + GRYDE.b - 62, GRYDE.y - 56, {stort:false, størrelse:11.5});
    maerkat(g, 'Mæskekar', GRYDE.x + 8, GRYDE.y - 18, {justering:'left', størrelse:10.5});

    lup(g, LUP_FRA, '#FFFDF6', (g2, r) => {
      /* gitter som i et mikroskop */
      g2.strokeStyle = 'rgba(23,33,31,.06)'; g2.lineWidth = 1;
      for(let i = -r; i < r; i += 24){ g2.beginPath(); g2.moveTo(i, -r); g2.lineTo(i, r); g2.moveTo(-r, i); g2.lineTo(r, i); g2.stroke(); }
      const kæder = st.lup.filter(p => FORM[p.type].n);
      for(const p of kæder) tegnKaede(g2, p);
      for(const p of st.lup.filter(p => p.type === 'alfa' || p.type === 'beta')){
        tegnEnzym(g2, p.x, p.y, p.v, p.type, p.aktiv, rt + p.fase);
      }
      for(const b of st.blink){
        const u = b.t / 0.45;
        g2.save(); g2.translate(b.x, b.y);
        g2.strokeStyle = b.farve; g2.lineWidth = 2.2; g2.globalAlpha = 1 - u;
        for(let i = 0; i < 6; i++){
          const v = i * Math.PI / 3;
          g2.beginPath();
          g2.moveTo(Math.cos(v) * (4 + 8 * u), Math.sin(v) * (4 + 8 * u));
          g2.lineTo(Math.cos(v) * (9 + 10 * u), Math.sin(v) * (9 + 10 * u));
          g2.stroke();
        }
        g2.restore();
      }
    });
    maerkat(g, 'Lup · kulhydrater og enzymer', 462, 116, {størrelse:9.5, farve:SLATE});
    tegnJodplade(g, st);
  },

  graf(st){
    const maks = Math.ceil(st.S0 * 1.05 / 500) * 500;
    return {
      titel:'Kulhydraterne i mæsken',
      tMaks:st.tMaks, tTrin:st.tMaks > 90 ? 30 : 15, tNavn:'tid (min)',
      venstre:{min:0, maks, trin:500, navn:'gram'},
      hoejre:{min:40, maks:90, trin:10, navn:'°C'},
      serier:Object.values(st.serier),
      nu:st.m.t,
    };
  },

  aflaes(st){
    const {m, S0} = st;
    const jod = B.jodproeve(m, S0);
    const ekstrakt = m.sukker + m.dextrin + m.graense + m.andet;
    const gb = m.sukker / ekstrakt;
    return {
      beta:{tal:komma(m.beta * 100), enhed:'%', andel:m.beta},
      alfa:{tal:komma(m.alfa * 100), enhed:'%', andel:m.alfa},
      jod:{tal:komma(jod.rest * 100), enhed:jod.positiv ? '% · blåsort' : '% · negativ', andel:jod.rest},
      gaerbar:{tal:komma(gb * 100), enhed:'%', andel:gb},
    };
  },

  aktiv(st){
    const t = B.enzymTempo(st.m);
    return {beta:t.beta > 0.04 && st.m.dextrin + st.m.stivelse > 20,
            alfa:t.alfa > 0.04 && st.m.stivelse > 5};
  },

  nu(st){ return st.m.t; },
  faerdig(st){ return st.p.trin ? st.p.faerdig : st.m.t >= 60; },
  stop(st){ return !!st.p.trin && st.p.faerdig; },

  /** Hvilket trin i programmet mæsken er nået til — til skiltet og statusfeltet. */
  trin(st){
    const {p} = st;
    if(!p.trin) return null;
    if(p.faerdig) return 'Programmet er færdigt';
    const tr = p.trin[p.i];
    return tr.navn + ' ' + tr.T + ' °C · ' + (p.ur > 0 ? Math.floor(p.ur) + '/' + tr.min + ' min' : 'varmer op');
  },

  status(st){
    const tr = this.trin(st);
    return 'Mæskning · ' + Math.floor(st.m.t + 1e-6) + ' min · ' + komma(st.m.T, 0) + ' °C' + (tr ? ' · ' + tr : '');
  },

  fortael(st){
    const a = this.aflaes(st);
    return `Mæskning efter ${Math.floor(st.m.t + 1e-6)} minutter ved ${komma(st.m.T, 0)} grader. ` +
           `β-amylase ${a.beta.tal} procent aktiv, α-amylase ${a.alfa.tal} procent aktiv. ` +
           `Stivelse tilbage ${a.jod.tal} procent, jodprøven er ${B.jodproeve(st.m, st.S0).positiv ? 'positiv' : 'negativ'}. ` +
           `${a.gaerbar.tal} procent af ekstraktet er gærbart sukker.`;
  },

  afslut(st, batch){
    batch.maesk = {
      program:st.prog.id, temperaturer:st.temperaturer.slice(), tid:st.m.t,
      jodNegativ:!B.jodproeve(st.m, st.S0).positiv,
      stivelseRest:st.m.stivelse / st.S0,
      gaerbar:st.m.sukker / Math.max(1, st.m.sukker + st.m.dextrin + st.m.graense + st.m.andet),
    };
    batch.maeskUd = {...st.m, malt:{...st.m.malt}};
  },
};
