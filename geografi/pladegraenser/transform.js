/* transform.js — bevarende grænse: en transformforkastning.

   Pladerne glider vandret forbi hinanden. Der dannes ingen ny skorpe,
   og ingen forsvinder — derfor ingen vulkaner. Men forkastningen sidder
   fast, klippen bøjes, og forskydningen spares op, til den springer i
   et jordskælv (model.js). Alle skælvene er lave.

   Tiden regnes her i år, ikke millioner af år: det er jordskælvenes
   rytme, der er pointen. Kortet er et udsnit på 100 km, og
   forskydningen er overdrevet 1 000 gange, så den kan ses. */

import * as M from './model.js';
import * as F from './figur.js';

const { xK, yD, INK, FARVE } = F;
const SKORPE = 30;                          // km — skorpens tykkelse
const OVERDRIV = 1000;
const KORT_KM = 100;                        // kortets bredde i km
const KPX = F.KW / KORT_KM;                 // px pr. km på kortet
const kx = X => F.KW / 2 + X * KPX;
const VEJE = [-170, -20, 150];              // px fra snitlinjen: tre veje over forkastningen

let sidstAntal = null;

export default {
  id: 'transform',
  navn: 'Transformforkastning',
  gruppe: 'Bevarende',
  kort: 'Pladerne glider forbi hinanden — i ryk',
  eksempler: 'San Andreas-forkastningen og Den Nordanatolske Forkastning',
  beskrivelse: 'Blokdiagram i 3/4-perspektiv af en transformforkastning, 100 km langt og 40 km dybt. Den venstre blok bevæger sig væk fra os, den højre mod os. Forreste halvdel af den højre blok er skåret væk, så man ser forkastningsplanet: det er låst fast de øverste 15 km, hvor spændingen bygges op og jordskælvene sker, og kryber længere nede. Vejene på overfladen bøjes mellem jordskælvene og forskydes ved forkastningen. Der er ingen vulkaner.',
  kortTekst: 'Kort set ovenfra, 100 km bredt: forkastningen går lodret gennem kortet. Tre veje krydser den. Mellem jordskælvene bøjes vejene i en blød S-bue; ved et jordskælv springer de, så de er skarpt forskudt ved forkastningen. Forskydningen er overdrevet 1 000 gange.',

  tid: { maks: 1000, skridt: 5, start: 0, tempo: 25, enhed: 'år' },
  fart: { min: 1, maks: 6, skridt: 0.5, start: 3.5, navn: 'Pladernes fart forbi hinanden' },
  skaelvRate: 1.2,

  ryd(){ sidstAntal = null; },
  opdater(){},

  // Et stort jordskælv, når forkastningen springer. Returnerer en besked til skærmlæsere.
  haendelse(ctx){
    const tl = M.transform(ctx.t, ctx.v);
    const ny = sidstAntal !== null && tl.skaelv > sidstAntal;
    sidstAntal = tl.skaelv;
    if (!ny) return null;
    return { stort: true, tekst: `Jordskælv! Forkastningen sprang ${tl.sidst.ryk.toLocaleString('da-DK', { maximumFractionDigits: 1 })} m, magnitude ${M.magnitude(tl.sidst.ryk).toLocaleString('da-DK', { maximumFractionDigits: 1 })}.` };
  },

  skaelv(){
    return { X: (Math.random() - 0.5) * 3, d: 1 + Math.random() * (M.LAASEDYBDE - 1), Y: (Math.random() - 0.5) * KORT_KM * 1.4 };
  },

  /* Blokdiagram i 3/4-perspektiv: to blokke af skorpen med forkastningen
     imellem. Forreste halvdel af den højre blok er skåret væk, så man kan
     se ind på forkastningsplanet, hvor jordskælvene sker. Vejene på
     overfladen er de samme som på kortet: bøjet mellem skælvene og
     forskudt ved forkastningen (overdrevet 1 000 gange). */
  tegnSnit(c, ctx){
    const tl = M.transform(ctx.t, ctx.v);
    // x på tværs af forkastningen (km), y langs den (0 forrest, 100 bagerst), z dybde (km)
    const L = 60, LY = 100, D = 40, KLIP = 50, GAB = 10;
    const P = (x, y, z) => [58 + (x + L) * 3 + (x > 0 ? GAB : 0) + y * 1.55, 285 - y * 1.3 + z * 5.9];
    const poly = (pkt, farve, streg = true) => {
      c.beginPath(); pkt.forEach(([x, y, z], i) => { const [u, v] = P(x, y, z); i ? c.lineTo(u, v) : c.moveTo(u, v); });
      c.closePath(); if (farve){ c.fillStyle = farve; c.fill(); }
      if (streg){ c.strokeStyle = INK; c.lineWidth = 2; c.lineJoin = 'round'; c.stroke(); }
    };
    const linje = (pkt, bredde = 1.2, streg = []) => {
      c.save(); c.strokeStyle = INK; c.lineWidth = bredde; c.setLineDash(streg);
      c.beginPath(); pkt.forEach(([x, y, z], i) => { const [u, v] = P(x, y, z); i ? c.lineTo(u, v) : c.moveTo(u, v); });
      c.stroke(); c.restore();
    };

    // baggrund
    const hg = c.createLinearGradient(0, 0, 0, F.H);
    hg.addColorStop(0, '#CFE9F7'); hg.addColorStop(0.55, '#F3FAFE'); hg.addColorStop(1, '#FFF9EE');
    c.fillStyle = hg; c.fillRect(0, 0, F.W, F.H);

    const blok = (x0, x1, y0, top, siden) => {
      const x0e = x0 === 0 ? 1e-6 : x0, x1e = x1 === 0 ? -1e-6 : x1;
      // forsiden: skorpe og kappe
      poly([[x0e, y0, 0], [x1e, y0, 0], [x1e, y0, SKORPE], [x0e, y0, SKORPE]], siden);
      poly([[x0e, y0, SKORPE], [x1e, y0, SKORPE], [x1e, y0, D], [x0e, y0, D]], FARVE.kappe);
      // højre side
      poly([[x1e, y0, 0], [x1e, LY, 0], [x1e, LY, SKORPE], [x1e, y0, SKORPE]], siden);
      poly([[x1e, y0, SKORPE], [x1e, LY, SKORPE], [x1e, LY, D], [x1e, y0, D]], FARVE.kappe);
      // toppen
      poly([[x0e, y0, 0], [x1e, y0, 0], [x1e, LY, 0], [x0e, LY, 0]], top);
    };

    // venstre blok, hele vejen
    blok(-L, 0, 0, '#E3D6B4', FARVE.kontinent);
    // forkastningsplanet på venstre blok: låst foroven, kryber forneden
    const spaend = Math.min(1, tl.opsparet / tl.naeste);
    poly([[0, 0, 0], [0, KLIP, 0], [0, KLIP, M.LAASEDYBDE], [0, 0, M.LAASEDYBDE]], `rgba(232,51,109,${0.15 + 0.55 * spaend})`);
    poly([[0, 0, M.LAASEDYBDE], [0, KLIP, M.LAASEDYBDE], [0, KLIP, D], [0, 0, D]], '#A8B3A8');
    linje([[0, 0, M.LAASEDYBDE], [0, KLIP, M.LAASEDYBDE]], 1.4, [5, 4]);
    linje([[0, 0, SKORPE], [0, KLIP, SKORPE]], 1, [3, 3]);
    // jordskælvene sidder på planet
    for (const s of ctx.skaelv){
      const y = 4 + (s.Y / 140 + 0.5) * (KLIP - 8);
      if (y < 0 || y > KLIP) continue;
      const [u, v] = P(0, y, s.d);
      F.skaelvTegn(c, u, v, s.d, Math.min(1, (F.SKAELV_LEVETID - s.alder) / 1.5), s.stort ? 1.8 : 1);
      F.skaelvRing(c, u, v, s.alder);
    }
    // højre blok, med forreste halvdel skåret væk
    blok(0, L, KLIP, '#EADFC2', '#CDAE8C');
    // Moho på forsider og sider
    linje([[-L, 0, SKORPE], [0, 0, SKORPE]], 1, [4, 4]);

    // vejene på toppen (de ligger bag det bortskårne stykke)
    const dy = X => M.vejForskydning(X, tl) / 1000 * OVERDRIV;   // km
    for (const y0 of [62, 78, 92]){
      for (const side of [-1, 1]){
        const pkt = [];
        for (let X = side * 0.05; Math.abs(X) <= L; X += side * 0.6){
          const y = y0 + dy(X);
          if (y < (side > 0 ? KLIP : 0) + 1 || y > LY - 1){ if (pkt.length) break; continue; }
          pkt.push(P(X, y, 0));
        }
        if (pkt.length < 2) continue;
        c.save(); c.lineCap = 'round';
        for (const [b, f] of [[6, INK], [3.8, '#6F6A63']]){
          c.strokeStyle = f; c.lineWidth = b;
          c.beginPath(); pkt.forEach(([u, v], i) => i ? c.lineTo(u, v) : c.moveTo(u, v)); c.stroke();
        }
        c.restore();
      }
    }
    // forkastningen på overfladen
    c.save(); c.strokeStyle = '#C21F4B'; c.lineWidth = 3;
    const [a1, b1] = P(-1e-6, 0, 0), [a2, b2] = P(-1e-6, LY, 0);
    c.beginPath(); c.moveTo(a1, b1); c.lineTo(a2, b2); c.stroke(); c.restore();

    // pile på toppen: venstre blok væk fra os, højre mod os
    const pil3 = (x, y, ret) => {
      const l = 16 * ret, b = 3.5, h = 7;
      poly([[x - b, y - l, 0], [x + b, y - l, 0], [x + b, y + l * 0.4, 0], [x + h, y + l * 0.4, 0], [x, y + l, 0], [x - h, y + l * 0.4, 0], [x - b, y + l * 0.4, 0]], '#FFF9EE');
    };
    pil3(-32, 30, 1); pil3(32, 72, -1);

    // dybdeskala på forreste venstre kant
    c.save(); c.font = "600 10px 'IBM Plex Mono', ui-monospace, monospace"; c.fillStyle = INK; c.strokeStyle = INK; c.lineWidth = 1.5;
    c.textAlign = 'right'; c.textBaseline = 'middle';
    for (const z of [0, M.LAASEDYBDE, SKORPE, D]){
      const [u, v] = P(-L, 0, z);
      c.beginPath(); c.moveTo(u - 6, v); c.lineTo(u, v); c.stroke();
      c.fillText(z + ' km', u - 9, v);
    }
    c.restore();

    const m = [
      { tekst: 'FORKASTNINGEN', x: P(0, LY, 0)[0] - 10, y: 58, mod: P(0, LY, 0)[1] - 2, modX: P(0, LY, 0)[0] },
      { tekst: 'LÅST', enhed: 'spænding bygges op', x: 520, y: P(0, 20, 7)[1] + 40, mod: P(0, 25, 7)[1], modX: P(0, 25, 7)[0] + 2, kant: '#E8336D' },
      { tekst: 'KRYBER', x: 520, y: P(0, 20, 28)[1] + 40, mod: P(0, 25, 26)[1], modX: P(0, 25, 26)[0] + 2 },
      { tekst: 'SKORPE', x: P(-40, 0, 12)[0], y: P(-40, 0, 12)[1] + 5 },
      { tekst: 'KAPPE', x: P(-40, 0, 35)[0], y: P(-40, 0, 35)[1] + 5 },
      { tekst: 'VEJ', x: P(L, 92, 0)[0] + 24, y: P(L, 92, 0)[1] + 4 },
      { tekst: 'STYKKE SKÅRET VÆK', x: P(40, 12, 0)[0], y: P(40, 12, 0)[1] + 6 }
    ];
    F.tegnMaerkater(c, m, F.W, 8);
    F.tegnFodnote(c, 'SKEMATISK · 100 km LANGT UDSNIT · FORSKYDNING ×1 000', 8, 'left');
  },

  tegnKort(c, ctx){
    const tl = M.transform(ctx.t, ctx.v);
    // landskabet
    c.fillStyle = '#E3D6B4'; c.fillRect(0, 0, F.KW / 2, F.KH);
    c.fillStyle = '#EADFC2'; c.fillRect(F.KW / 2, 0, F.KW / 2, F.KH);
    // vejene: hvor de lå ved tid 0 (stiplet), og hvor de ligger nu
    const dy = X => M.vejForskydning(X, tl) / 1000 * OVERDRIV * KPX;  // m → km → px
    for (const y0 of VEJE){
      const y = F.KY_SNIT + y0;
      c.save(); c.strokeStyle = 'rgba(23,33,31,.35)'; c.lineWidth = 1.2; c.setLineDash([3, 4]);
      c.beginPath(); c.moveTo(0, y); c.lineTo(F.KW, y); c.stroke(); c.restore();
      c.save(); c.lineCap = 'round';
      for (const [bredde, farve] of [[8, INK], [5.5, '#6F6A63']]){
        c.strokeStyle = farve; c.lineWidth = bredde;
        for (const side of [-1, 1]){
          c.beginPath();
          for (let X = side * 0.05; Math.abs(X) <= KORT_KM / 2 + 2; X += side * 0.5) c.lineTo(kx(X), y + dy(X));
          c.stroke();
        }
      }
      c.strokeStyle = '#FFE08A'; c.lineWidth = 1.2; c.setLineDash([5, 5]);
      for (const side of [-1, 1]){
        c.beginPath();
        for (let X = side * 0.05; Math.abs(X) <= KORT_KM / 2 + 2; X += side * 0.5) c.lineTo(kx(X), y + dy(X));
        c.stroke();
      }
      c.restore();
    }
    for (const s of ctx.skaelv){
      const a = Math.min(1, (F.SKAELV_LEVETID - s.alder) / 1.5), x = kx(s.X), y = F.KY_SNIT + s.Y * KPX;
      F.skaelvTegn(c, x, y, s.d, a, s.stort ? 1.8 : 0.85);
      F.skaelvRing(c, x, y, s.alder);
    }
    // forkastningen
    c.save(); c.strokeStyle = '#C21F4B'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(F.KW / 2, 0); c.lineTo(F.KW / 2, F.KH); c.stroke(); c.restore();
    // pile: venstre plade op, højre ned (højrehåndet forkastning, som San Andreas)
    const pil = (x, y, op) => {
      c.save(); c.translate(x, y); c.rotate(op ? -Math.PI / 2 : Math.PI / 2);
      c.fillStyle = '#FFF9EE'; c.strokeStyle = INK; c.lineWidth = 2; c.lineJoin = 'round';
      c.beginPath(); c.moveTo(-18, -4); c.lineTo(8, -4); c.lineTo(8, -9); c.lineTo(18, 0); c.lineTo(8, 9); c.lineTo(8, 4); c.lineTo(-18, 4); c.closePath();
      c.fill(); c.stroke(); c.restore();
    };
    pil(F.KW / 2 - 60, 470, true); pil(F.KW / 2 + 60, 470, false);
    F.kortOverskrift(c, 'SET OVENFRA · 100 km');
    F.tegnMaalestok(c, 20 * KPX, '20 km');
    F.tegnMaerkater(c, [
      { tekst: 'FORSKYDNING ×1 000', x: F.KW / 2, y: 60 },
      { tekst: 'VEJ', x: F.KW - 40, y: F.KY_SNIT + VEJE[0] - 22 }
    ], F.KW, 4);
  },

  aflaes(ctx){
    const tl = M.transform(ctx.t, ctx.v);
    const tal1 = v => v.toLocaleString('da-DK', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    const siden = tl.sidst ? Math.round(ctx.t - tl.sidst.t) : null;
    return [
      { navn: 'Pladerne har flyttet sig', tal: tl.flyttet, n: 1, enhed: 'm', lille: 'jævnt, langt fra forkastningen',
        andel: tl.flyttet / 60, farve: '#0E86C8' },
      { navn: 'Forkastningen er gledet', tal: tl.glidning, n: 1, enhed: 'm', lille: tl.skaelv === 1 ? 'i ét jordskælv' : `i ${tl.skaelv} jordskælv`,
        andel: tl.glidning / 60, farve: '#566B68' },
      { navn: 'Opsparet forskydning', tal: tl.opsparet, n: 1, enhed: 'm', lille: `springer ved ca. ${tal1(tl.naeste)} m`,
        andel: tl.opsparet / 8, farve: '#FF6A3D', maerke: { andel: tl.naeste / 8, tekst: 'brud' } },
      { navn: 'Sidste jordskælv', tal: tl.sidst ? M.magnitude(tl.sidst.ryk) : null, n: 1, enhed: 'Mw',
        lille: tl.sidst ? `for ${siden} år siden · rykket var ${tal1(tl.sidst.ryk)} m` : 'intet endnu',
        andel: tl.sidst ? (M.magnitude(tl.sidst.ryk) - 5) / 4 : 0, farve: '#C21F4B' }
    ];
  },

  fakta: () => [
    ['Bevarende · pladerne glider forbi hinanden'],
    ['Fx San Andreas og Den Nordanatolske Forkastning'],
    ['Ingen vulkaner · kun lave jordskælv']
  ]
};
