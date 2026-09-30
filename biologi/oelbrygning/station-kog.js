/* ═══════════════════════════════════════════════════════════
   station-kog.js — 4 · Kogning med humle.

   Urten koger, vand damper af, og humlen giver bitterhed og
   aroma. Man vælger humlesort og tilsætter humle, når man vil —
   eller lader opskriftens humleplan gøre det; hver portion husker
   sit tidspunkt og sin sort. Tidlig humle når at blive til bitterstof
   (iso-α-syre), sen humle beholder sin duft. Luppen viser
   α-syrerne, der lukker ringen om, og aromaolierne, der
   forsvinder med dampen.
   ═══════════════════════════════════════════════════════════ */
import * as B from './brygning.js';
import {INK, SLATE, FARVE, BLØDT, blaek, maerkat, skilt, komma,
        lup, termometer, drift, juster, tilfaeldigPlads, ebcFarve} from './model.js';
import {GRYDE, grydeNiveau, tegnGryde, tegnBlus, tegnDamp, tegnHumle} from './udstyr.js';
import {nySerie, tilfoej} from './graf.js';
import {humleplan, opskrift} from './opskrifter.js';

const LUP_FRA = {x:GRYDE.x + 110, y:0, r:18};   /* y følger overfladen */

/* ── Luppens molekyler ─────────────────────────────────── */
function polygon(g, n, r, v){
  g.beginPath();
  for(let i = 0; i < n; i++){
    const a = v + i * Math.PI * 2 / n;
    i ? g.lineTo(Math.cos(a) * r, Math.sin(a) * r) : g.moveTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  g.closePath();
}

function tegnMolekyle(g, p){
  g.save(); g.translate(p.x, p.y);
  if(p.type === 'alfa'){
    /* α-syre: seksring med sidekæder */
    polygon(g, 6, 11, p.v); blaek(g, FARVE.humleLys, 2);
    for(let i = 0; i < 3; i++){
      const a = p.v + i * Math.PI * 2 / 3;
      g.beginPath(); g.moveTo(Math.cos(a) * 11, Math.sin(a) * 11); g.lineTo(Math.cos(a) * 17, Math.sin(a) * 17);
      g.lineWidth = 2; g.strokeStyle = INK; g.stroke();
    }
  } else if(p.type === 'iso'){
    /* iso-α-syre: ringen er lukket om til en femring */
    polygon(g, 5, 10.5, p.v); blaek(g, '#FFD66B', 2);
    for(let i = 0; i < 3; i++){
      const a = p.v + 0.4 + i * Math.PI * 2 / 3;
      g.beginPath(); g.moveTo(Math.cos(a) * 10, Math.sin(a) * 10); g.lineTo(Math.cos(a) * 16, Math.sin(a) * 16);
      g.lineWidth = 2; g.strokeStyle = INK; g.stroke();
    }
  } else if(p.type === 'olie'){
    g.beginPath();
    g.moveTo(0, -8); g.quadraticCurveTo(6, 0, 0, 6); g.quadraticCurveTo(-6, 0, 0, -8);
    blaek(g, '#9FE3D8', 1.5);
  } else if(p.type === 'damp'){
    g.beginPath(); g.arc(0, 0, p.r, 0, Math.PI * 2);
    blaek(g, 'rgba(255,255,255,.85)', 1.3, SLATE);
  }
  g.restore();
}

/* ── Stationen ─────────────────────────────────────────── */
export default {
  id:'kog', nr:4, navn:'Kogning',
  tid:{maks:90, fart:4, skridt:0.1, proeve:1, enhed:'min', auto:60,
       tekst:t => Math.floor(t + 1e-6) + ' min'},

  knapper:[
    {id:'plan', type:'valg', navn:'Humleplan', vaerdi:'opskrift', adr:'plan',
     valg:[{id:'opskrift', navn:'Følg opskriften'}, {id:'selv', navn:'Tilsæt selv'}],
     deaktiv:(v, alle) => !opskrift(alle.indmaesk.opskrift)},
    {id:'sort', type:'valg', navn:'Humlesort', vaerdi:'cascade', adr:'sort',
     valg:B.HUMLER.map(h => ({id:h.id, navn:`${h.navn} · ${komma(h.alfa * 100, 1)} %`}))},
    {id:'portion', navn:'Humleportion', min:5, max:80, step:5, vaerdi:20, enhed:'g', adr:'portion',
     track:'linear-gradient(90deg,#F1F8EA,#5FB030)', kc:'var(--lime)'},
  ],
  handlinger:[
    {id:'humle', navn:'Tilsæt humle', titel:'Kom den valgte portion humle i gryden nu'},
  ],

  ligninger:[
    {id:'iso', titel:'Humlens α-syre · isomerisering', tone:'#D6EFC4',
     html:'α-syre<span class="pil">→</span>iso-α-syre <span class="lys">(varme og tid · bitter)</span>'},
    {id:'damp', titel:'Fordampning · 4 L i timen', tone:'#E7F4FB',
     html:'H₂O (l)<span class="pil">→</span>H₂O (g) <span class="lys">2,26 MJ/kg · ≈ 2,5 kW</span>'},
  ],

  maalere:[
    {id:'vol', navn:'Urt i gryden', klasse:'g-blaa', cc:'linear-gradient(90deg,#9BD7F3,#0E86C8)'},
    {id:'sg', navn:'Vægtfylde · OG', klasse:'g-gul', cc:'linear-gradient(90deg,#FFE3A0,#D98A00)'},
    {id:'ibu', navn:'Bitterhed', klasse:'g-groen', cc:'linear-gradient(90deg,#D6EFC4,#5FB030)'},
    {id:'aroma', navn:'Humlearoma tilbage', klasse:'g-teal', cc:'linear-gradient(90deg,#8FE0D4,#0FA593)'},
  ],

  signatur(v){
    const h = B.humlesort(v.sort);
    return `
    <span class="fact">${h.navn} <b>${komma(h.alfa * 100, 1)} %</b> <span class="enhed">α</span>-syre · ${h.rolle} · ${h.aroma}</span>` + this.signaturFast;
  },
  signaturFast:`
    <span class="fact"><svg width="18" height="18" viewBox="-9 -9 18 18" aria-hidden="true"><path d="M7 0L3.5 6.1H-3.5L-7 0L-3.5 -6.1H3.5Z" fill="${FARVE.humleLys}" stroke="#17211F" stroke-width="1.5"/></svg><span><span class="enhed">α</span>-syre · fra humlen</span></span>
    <span class="fact"><svg width="18" height="18" viewBox="-9 -9 18 18" aria-hidden="true"><path d="M0 -7L6.7 -2.2L4.1 5.7H-4.1L-6.7 -2.2Z" fill="#FFD66B" stroke="#17211F" stroke-width="1.5"/></svg><span>iso-<span class="enhed">α</span>-syre · bitter</span></span>
    <span class="fact"><svg width="14" height="16" viewBox="-7 -9 14 16" aria-hidden="true"><path d="M0 -8Q6 0 0 6Q-6 0 0 -8Z" fill="#9FE3D8" stroke="#17211F" stroke-width="1.4"/></svg>Aromaolie</span>
    <span class="fact"><span><span class="enhed">IBU = mg</span> iso-<span class="enhed">α</span>-syre pr. <span class="enhed">L</span></span></span>`,

  start(batch, v){
    const k = B.nyKog(batch.urt);
    const o = opskrift(batch.opskrift);
    const st = {
      k, urt:batch.urt, v,
      plan:v.plan === 'opskrift' && o ? humleplan(o).sort((a, b) => a.tid - b.tid) : [],
      serier:{
        ibu:nySerie('bitterhed (IBU)', '#8BA81E', {stil:'fuld', tykkelse:3.4}),
        sg:nySerie('vægtfylde', INK, {stil:'prik', akse:'h', tykkelse:2.4}),
      },
      kogler:[], lup:[], flygter:[], blink:[], dampUr:0,
    };
    st.sg0 = B.kogSG(k);
    this.maal(st);
    return st;
  },

  skridt(st, dt, v){
    /* Opskriftens humleplan: portionerne kommer i, når tiden er inde. */
    while(v.plan === 'opskrift' && st.plan.length && st.plan[0].tid <= st.k.t + 1e-9){
      const h = st.plan.shift();
      this.handling('humle', st, {portion:h.g, sort:h.sort});
    }
    B.skridtKog(st.k, dt);
  },

  maal(st){
    tilfoej(st.serier.ibu, st.k.t, B.ibu(st.k));
    tilfoej(st.serier.sg, st.k.t, B.kogSG(st.k));
  },

  handling(id, st, v){
    if(id !== 'humle') return;
    B.tilsaetHumle(st.k, v.portion, v.sort);
    const n = Math.max(1, Math.round(v.portion / 10));
    for(let i = 0; i < n; i++){
      st.kogler.push({x:GRYDE.x + 50 + Math.random() * (GRYDE.b - 100), y:GRYDE.y - 70 - i * 18,
                      v:Math.random() * 6, vy:0, flyder:false});
    }
    st.kogler = st.kogler.slice(-28);
    return `${v.portion} g ${B.humlesort(v.sort).navn} tilsat efter ${Math.floor(st.k.t + 1e-6)} minutter.`;
  },

  animer(st, dt, rt){
    const {k, lup:L} = st;
    const r = 122;
    const overflade = grydeNiveau(k.V);
    /* koglerne falder ned og flyder */
    for(const c of st.kogler){
      if(!c.flyder){
        c.vy += 600 * dt; c.y += c.vy * dt;
        if(c.y >= overflade - 4){ c.y = overflade - 4; c.flyder = true; }
        if(!BLØDT){ c.y = overflade - 4; c.flyder = true; }
      } else {
        c.y = overflade - 4 + Math.sin(rt * 2 + c.v) * 2;
        c.x += Math.sin(rt * 0.8 + c.v * 3) * 8 * dt;
      }
    }

    /* luppen: α-syre bliver til iso-α-syre, olierne damper af */
    let alfa = 0, iso = 0;
    for(const h of k.humle){
      const f = 1 - Math.exp(-0.04 * (k.t - h.tid));
      alfa += h.g * (1 - f); iso += h.g * f;
    }
    const skala = Math.min(1, 28 / Math.max(1, alfa + iso)) / 3;
    const nyeIso = [];
    juster(L, 'alfa', Math.round(alfa * skala), () => ({type:'alfa', ...tilfaeldigPlads(r, 30),
      v:Math.random() * 6, vr:(Math.random() - 0.5) * 0.8, radius:18}),
      liste => { const p = liste[Math.floor(Math.random() * liste.length)]; nyeIso.push(p); return p; });
    for(const p of nyeIso){
      L.push({type:'iso', x:p.x, y:p.y, v:p.v, vr:p.vr, radius:17});
      st.blink.push({x:p.x, y:p.y, t:0});
    }
    juster(L, 'iso', Math.round(iso * skala), () => ({type:'iso', ...tilfaeldigPlads(r, 30),
      v:Math.random() * 6, vr:(Math.random() - 0.5) * 0.8, radius:17}));
    juster(L, 'olie', Math.min(14, Math.round(B.aroma(k) / k.V / 1.2)), () => ({type:'olie', ...tilfaeldigPlads(r, 30),
      v:0, vr:0, radius:10}), liste => {
        const p = liste[0]; st.flygter.push({...p}); return p;
      });

    for(const p of L) drift(p, dt, r, p.type === 'olie' ? 30 : 22);
    /* olie, der er dampet af, stiger ud af luppen */
    for(const p of st.flygter){ p.y -= 90 * dt; p.x += Math.sin(p.y * 0.05) * 20 * dt; }
    st.flygter = st.flygter.filter(p => p.y > -r - 20);
    /* dampbobler */
    st.dampUr += dt;
    if(BLØDT && st.dampUr > 0.12){
      st.dampUr = 0;
      const x = (Math.random() - 0.5) * r * 1.4;
      st.flygter.push({type:'damp', x, y:Math.sqrt(r * r - x * x) - 6, r:3 + Math.random() * 5});
    }
    for(const b of st.blink) b.t += dt;
    st.blink = st.blink.filter(b => b.t < 0.5);
  },

  tegn(g, st, rt){
    const {k} = st;
    const niveau = grydeNiveau(k.V);
    tegnDamp(g, rt, 1);
    tegnGryde(g, {vaeske:ebcFarve(B.farveEBC(k.urt.malt, k.V) * 0.9), niveau, rt, bobler:st.k.t > 0 ? 1 : 0.2});
    for(const c of st.kogler) tegnHumle(g, c.x, c.y, 0.9, c.v * 0.3 + Math.sin(rt + c.v) * 0.15);
    tegnBlus(g, rt);
    termometer(g, GRYDE.x + GRYDE.b - 62, GRYDE.y - 40, 170, 100, {min:40, max:110});
    skilt(g, '100 °C', GRYDE.x + GRYDE.b - 62, GRYDE.y - 56, {stort:false, størrelse:11.5});
    maerkat(g, 'Kogekar', GRYDE.x + 8, GRYDE.y - 18, {justering:'left', størrelse:10.5});

    lup(g, {...LUP_FRA, y:niveau + 30}, '#FBFFF4', (g2, r) => {
      for(const p of st.lup) tegnMolekyle(g2, p);
      for(const p of st.flygter) tegnMolekyle(g2, p);
      for(const b of st.blink){
        const u = b.t / 0.5;
        g2.beginPath(); g2.arc(b.x, b.y, 12 + 14 * u, 0, Math.PI * 2);
        g2.lineWidth = 2.4; g2.strokeStyle = `rgba(200,138,0,${1 - u})`; g2.stroke();
      }
    });
    maerkat(g, 'Lup · humlens stoffer i urten', 462, 116, {størrelse:9.5, farve:SLATE});

    /* humleskemaet under luppen */
    const x0 = 350, y0 = 404;
    maerkat(g, st.plan.length ? 'Humle · tilsat og planlagt' : 'Humle tilsat', x0, y0 - 8, {justering:'left', størrelse:9.5, farve:SLATE});
    const vis = [...k.humle.map(h => ({...h, ventende:false})), ...st.plan.map(h => ({...h, ventende:true}))].slice(-6);
    if(!vis.length){
      maerkat(g, 'Ingen endnu', x0, y0 + 18, {justering:'left', størrelse:10, farve:SLATE});
    }
    vis.forEach((h, i) => {
      const x = x0 + 18 + i * 42, y = y0 + 22;
      g.save(); if(h.ventende) g.globalAlpha = 0.4;
      tegnHumle(g, x, y, 0.8, 0);
      maerkat(g, h.g + ' g', x, y + 22, {størrelse:8.5, stort:false, spær:0.2});
      maerkat(g, B.humlesort(h.sort).kort, x, y + 33, {størrelse:7.5, stort:false, spær:0.1});
      maerkat(g, Math.floor(h.tid) + ' min', x, y + 44, {størrelse:7.5, stort:false, spær:0.2, farve:SLATE});
      g.restore();
    });
  },

  graf(st){
    const ibuMaks = Math.max(60, Math.ceil(B.ibu(st.k) / 20) * 20 + 20);
    const sgMin = Math.floor((st.sg0 - 1) * 100) / 100 + 1;
    return {
      titel:'Bitterhed og vægtfylde under kogningen',
      tMaks:90, tTrin:15, tNavn:'tid (min)',
      venstre:{min:0, maks:ibuMaks, trin:ibuMaks > 100 ? 40 : 20, navn:'IBU'},
      hoejre:{min:sgMin, maks:sgMin + 0.04, trin:0.01, navn:'vægtfylde', tal:v => komma(v, 2)},
      serier:Object.values(st.serier),
      nu:st.k.t,
    };
  },

  aflaes(st){
    const {k} = st;
    const sg = B.kogSG(k), i = B.ibu(k), a = B.aroma(k) / k.V;
    const ord = a > 10 ? 'kraftig' : a > 4 ? 'tydelig' : a > 1 ? 'svag' : 'ingen';
    return {
      vol:{tal:komma(k.V, 1), enhed:'L', andel:k.V / 36},
      sg:{tal:komma(sg, 3), enhed:komma(B.plato(sg), 1) + ' °P', andel:(sg - 1) / 0.1},
      ibu:{tal:komma(i), enhed:'IBU', andel:i / 100},
      aroma:{tal:ord, enhed:komma(a, 1) + ' mg/L', andel:Math.min(1, a / 20)},
    };
  },

  aktiv(st){
    return {iso:st.k.humle.some(h => st.k.t - h.tid < 60), damp:true};
  },

  nu(st){ return st.k.t; },
  faerdig(st){ return st.k.t >= 60; },

  status(st){ return 'Kogning · ' + Math.floor(st.k.t + 1e-6) + ' min · ' + komma(st.k.V, 1) + ' L'; },

  fortael(st){
    const a = this.aflaes(st);
    return `Kogning efter ${Math.floor(st.k.t + 1e-6)} minutter. ${a.vol.tal} liter urt, vægtfylde ${a.sg.tal}, ` +
           `bitterhed ${a.ibu.tal} IBU, humlearoma ${a.aroma.tal}.`;
  },

  afslut(st, batch){
    batch.kog = {tid:st.k.t, humle:st.k.humle.map(h => ({...h})), plan:st.v.plan};
    batch.urtKogt = B.urtAfKog(st.k);
  },
};
