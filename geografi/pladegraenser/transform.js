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
import * as L_ from './landskab.js';

const { xK, yD, INK, FARVE } = F;
const SKORPE = 30;                          // km — skorpens tykkelse
const OVERDRIV = 1000;
const KORT_KM = 100;                        // kortets bredde i km
const KPX = F.KW / KORT_KM;                 // px pr. km på kortet
const kx = X => F.KW / 2 + X * KPX;

let sidstAntal = null, rystStart = -1e9;

export default {
  id: 'transform',
  navn: 'Transformforkastning',
  gruppe: 'Bevarende',
  kort: 'Pladerne glider forbi hinanden — i ryk',
  eksempler: 'San Andreas-forkastningen og Den Nordanatolske Forkastning',
  beskrivelse: 'Blokdiagram i 3/4-perspektiv af en transformforkastning, 100 km langt og 40 km dybt. Den venstre blok bevæger sig væk fra os, den højre mod os. Forreste halvdel af den højre blok er skåret væk, så man ser forkastningsplanet: det er låst fast de øverste 15 km, hvor spændingen bygges op og jordskælvene sker, og kryber længere nede. På overfladen står huse og træer, og biler kører på vejene. Alt bøjes mellem jordskælvene og forskydes ved forkastningen; efter et skælv er vejene brudt, og husene nær forkastningen har revner. Der er ingen vulkaner.',
  kortTekst: 'Kort set ovenfra, 100 km bredt: forkastningen går lodret gennem kortet. Tre veje med biler krydser den, og der står huse og træer. Mellem jordskælvene bøjes landskabet i en blød S-bue; ved et jordskælv springer det, så vejene er skarpt forskudt ved forkastningen, og husene tæt ved får revner. Forskydningen er overdrevet 1 000 gange.',

  tid: { maks: 1000, skridt: 5, start: 0, tempo: 25, enhed: 'år' },
  fart: { min: 1, maks: 6, skridt: 0.5, start: 3.5, navn: 'Pladernes fart forbi hinanden' },
  skaelvRate: 1.2,

  ryd(){ sidstAntal = null; },
  // Bilerne kører, og efter første jordskælv er vejene brudt ved forkastningen
  opdater(dt, ctx){ L_.koer(dt, M.transform(ctx.t, ctx.v).glidning > 0); },

  // Et stort jordskælv, når forkastningen springer. Returnerer en besked til skærmlæsere.
  haendelse(ctx){
    const tl = M.transform(ctx.t, ctx.v);
    const ny = sidstAntal !== null && tl.skaelv > sidstAntal;
    sidstAntal = tl.skaelv;
    if (!ny) return null;
    rystStart = performance.now();
    return { stort: true, tekst: `Jordskælv! Forkastningen sprang ${tl.sidst.ryk.toLocaleString('da-DK', { maximumFractionDigits: 1 })} m, magnitude ${M.magnitude(tl.sidst.ryk).toLocaleString('da-DK', { maximumFractionDigits: 1 })}.` };
  },

  skaelv(){
    return { X: (Math.random() - 0.5) * 3, d: 1 + Math.random() * (M.LAASEDYBDE - 1), Y: (Math.random() - 0.5) * KORT_KM * 1.4 };
  },

  /* Blokdiagram i 3/4-perspektiv: to blokke af skorpen med forkastningen
     imellem. Forreste halvdel af den højre blok er skåret væk, så man kan
     se ind på forkastningsplanet, hvor jordskælvene sker. Landskabet på
     toppen (landskab.js) er det samme som på kortet: det bøjes mellem
     skælvene og forskydes ved forkastningen (overdrevet 1 000 gange). */
  tegnSnit(c, ctx){
    const tl = M.transform(ctx.t, ctx.v);
    // x på tværs af forkastningen (km), y langs den mod nord (0 forrest), z dybde (km)
    const L = L_.BREDDE, LY = 100, D = 40, KLIP = 50, GAB = 10;
    const P = (x, y, z) => [40 + (x + L) * 3 + (x > 0 ? GAB : 0) + y * 1.7, 335 - y * 2.05 + z * 4.5];
    const vej = (pkt, farve, streg = true, bredde = 2) => {
      c.beginPath(); pkt.forEach(([x, y, z], i) => { const [u, v] = P(x, y, z); i ? c.lineTo(u, v) : c.moveTo(u, v); });
      c.closePath(); if (farve){ c.fillStyle = farve; c.fill(); }
      if (streg){ c.strokeStyle = INK; c.lineWidth = bredde; c.lineJoin = 'round'; c.stroke(); }
    };
    const poly = vej;
    const linje = (pkt, bredde = 1.2, streg = [], farve = INK) => {
      c.save(); c.strokeStyle = farve; c.lineWidth = bredde; c.setLineDash(streg);
      c.beginPath(); pkt.forEach(([x, y, z], i) => { const [u, v] = P(x, y, z); i ? c.lineTo(u, v) : c.moveTo(u, v); });
      c.stroke(); c.restore();
    };
    // lodret forløb på en flade: lysere foroven, mørkere forneden
    const grad = (z0, z1, lys, moerk, x = -L, y = 0) => {
      const g = c.createLinearGradient(0, P(x, y, z0)[1], 0, P(x, y, z1)[1]);
      g.addColorStop(0, lys); g.addColorStop(1, moerk); return g;
    };
    const ny = X => -M.vejForskydning(X, tl) / 1000 * OVERDRIV;   // km mod nord
    const ryst = Math.max(0, 1 - (performance.now() - rystStart) / 1400);
    const rystX = X => ryst * 3 * Math.sin(performance.now() / 28 + X) * Math.max(0, 1 - Math.abs(X) / 20);

    // himmel, fjerne bakker og skygge under blokken
    const hg = c.createLinearGradient(0, 0, 0, F.H);
    hg.addColorStop(0, '#B8DDF3'); hg.addColorStop(0.5, '#EAF6FC'); hg.addColorStop(1, '#FFF9EE');
    c.fillStyle = hg; c.fillRect(0, 0, F.W, F.H);
    c.fillStyle = 'rgba(94,140,120,.18)';
    c.beginPath(); c.moveTo(0, 150);
    for (let u = 0; u <= F.W; u += 20) c.lineTo(u, 140 - 22 * Math.sin(u / 70) - 12 * Math.sin(u / 23));
    c.lineTo(F.W, 200); c.lineTo(0, 200); c.closePath(); c.fill();
    c.save(); c.filter = 'blur(10px)'; c.fillStyle = 'rgba(23,33,31,.28)';
    poly([[-L, 0, D + 1.5], [L, KLIP, D + 1.5], [L, LY, D + 1.5], [-L + 6, LY, D + 1.5], [-L - 4, 8, D + 1.5]].map(([x, y, z]) => [x + 3, y - 4, z]), 'rgba(23,33,31,.28)', false);
    c.restore();

    const top = (x0, x1, y0) => {
      const [, v0] = P(0, LY, 0), [, v1] = P(0, y0, 0);
      const g = c.createLinearGradient(0, v0, 0, v1);
      g.addColorStop(0, '#B7D98C'); g.addColorStop(1, '#8FC064');
      poly([[x0, y0, 0], [x1, y0, 0], [x1, LY, 0], [x0, LY, 0]], g);
    };
    const blok = (x0, x1, y0, skorpe) => {
      const x0e = x0 === 0 ? 1e-6 : x0, x1e = x1 === 0 ? -1e-6 : x1;
      // forsiden: skorpe med lag, og kappe
      poly([[x0e, y0, 0], [x1e, y0, 0], [x1e, y0, SKORPE], [x0e, y0, SKORPE]], grad(0, SKORPE, skorpe, L_.shade(skorpe, -0.2), x0e, y0));
      c.save(); c.globalAlpha = 0.28;
      for (let z = 3; z < SKORPE; z += 4.2) linje([[x0e, y0, z], [x1e, y0, z + 0.6 * Math.sin(z)]], 1, [], '#5E4431');
      c.restore();
      poly([[x0e, y0, SKORPE], [x1e, y0, SKORPE], [x1e, y0, D], [x0e, y0, D]], grad(SKORPE, D, '#8FA08F', '#6E806F', x0e, y0));
      // højre side, i skygge
      poly([[x1e, y0, 0], [x1e, LY, 0], [x1e, LY, SKORPE], [x1e, y0, SKORPE]], L_.shade(skorpe, -0.25));
      poly([[x1e, y0, SKORPE], [x1e, LY, SKORPE], [x1e, LY, D], [x1e, y0, D]], '#62725F');
      // jordlag øverst
      poly([[x0e, y0, 0], [x1e, y0, 0], [x1e, y0, 1.2], [x0e, y0, 1.2]], '#6F8E4A', false);
      top(x0e, x1e, y0);
    };

    // landskabet oven på én blok: veje, træer, huse og biler, bagfra og frem
    const landskab = (vest, yMin) => {
      const inde = (x, y) => (vest ? x < -0.4 : x > 0.4) && Math.abs(x) < L - 1 && y > yMin + 1 && y < LY - 1;
      // vejene
      for (const v0 of L_.VEJE){
        const pkt = [];
        for (let X = vest ? -L : 0.05; X <= (vest ? -0.05 : L); X += 0.6){
          const y = v0 + ny(X);
          if (y > yMin + 0.5 && y < LY - 0.5) pkt.push(P(X, y, 0));
        }
        if (pkt.length < 2) continue;
        c.save(); c.lineCap = 'butt'; c.lineJoin = 'round';
        for (const [b, f, d] of [[8, INK, []], [6, '#55514C', []], [1.2, '#FFE08A', [5, 5]]]){
          c.strokeStyle = f; c.lineWidth = b; c.setLineDash(d);
          c.beginPath(); pkt.forEach(([u, v], i) => i ? c.lineTo(u, v) : c.moveTo(u, v)); c.stroke();
        }
        c.restore();
      }
      const ting = [];
      for (const t of L_.TRAEER){ const y = t.y + ny(t.x); if (inde(t.x, y)) ting.push({ y, tegn: () => L_.trae3D(c, P, t, t.x, y, rystX(t.x)) }); }
      for (const h of L_.HUSE){ const y = h.y + ny(h.x); if (inde(h.x, y)) ting.push({ y, tegn: () => L_.hus3D(c, P, h, h.x, y, L_.skadet(h, tl.skaelv), rystX(h.x)) }); }
      for (const b of L_.BILER){ const y = L_.bane(b) + ny(b.x); if (inde(b.x, y)) ting.push({ y, tegn: () => L_.bil3D(c, P, b, b.x, y) }); }
      ting.sort((a, b) => b.y - a.y).forEach(t => t.tegn());
    };

    // venstre blok, hele vejen
    blok(-L, 0, 0, FARVE.kontinent);
    // forkastningsplanet på venstre blok: låst foroven, kryber forneden
    const spaend = Math.min(1, tl.opsparet / tl.naeste);
    poly([[0, 0, 0], [0, KLIP, 0], [0, KLIP, M.LAASEDYBDE], [0, 0, M.LAASEDYBDE]], grad(0, M.LAASEDYBDE, `rgba(232,51,109,${0.25 + 0.6 * spaend})`, `rgba(160,30,70,${0.35 + 0.55 * spaend})`, 0, 0));
    poly([[0, 0, M.LAASEDYBDE], [0, KLIP, M.LAASEDYBDE], [0, KLIP, D], [0, 0, D]], grad(M.LAASEDYBDE, D, '#B5BFB4', '#8E9A8D', 0, 0));
    // riller på planet: det glider vandret
    c.save(); c.globalAlpha = 0.3;
    for (let z = 18; z < D; z += 4) linje([[0, 3, z], [0, KLIP - 3, z]], 1, [8, 5], '#FFFFFF');
    c.restore();
    linje([[0, 0, M.LAASEDYBDE], [0, KLIP, M.LAASEDYBDE]], 1.4, [5, 4]);
    for (const s of ctx.skaelv){
      const y = 4 + (s.Y / 140 + 0.5) * (KLIP - 8);
      if (y < 0 || y > KLIP) continue;
      const [u, v] = P(0, y, s.d);
      F.skaelvTegn(c, u, v, s.d, Math.min(1, (F.SKAELV_LEVETID - s.alder) / 1.5), s.stort ? 1.8 : 1);
      F.skaelvRing(c, u, v, s.alder);
    }
    landskab(true, 0);
    // højre blok, med forreste halvdel skåret væk
    blok(0, L, KLIP, '#CDAE8C');
    landskab(false, KLIP);
    linje([[-L, 0, SKORPE], [0, 0, SKORPE]], 1, [4, 4]);
    linje([[0, KLIP, SKORPE], [L, KLIP, SKORPE]], 1, [4, 4]);

    // forkastningen på overfladen
    c.save(); c.strokeStyle = '#C21F4B'; c.lineWidth = 3;
    const [a1, b1] = P(-1e-6, 0, 0), [a2, b2] = P(-1e-6, LY, 0);
    c.beginPath(); c.moveTo(a1, b1); c.lineTo(a2, b2); c.stroke(); c.restore();

    // pile på toppen: venstre blok mod nord (væk fra os), højre mod syd (mod os)
    const pil3 = (x, y, ret) => {
      const l = 12 * ret, b = 2.6, h = 5.5;
      poly([[x - b, y - l, 0], [x + b, y - l, 0], [x + b, y + l * 0.35, 0], [x + h, y + l * 0.35, 0], [x, y + l, 0], [x - h, y + l * 0.35, 0], [x - b, y + l * 0.35, 0]], '#FFF9EE');
    };
    pil3(-46, 40, 1); pil3(46, 72, -1);

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
      { tekst: 'FORKASTNINGEN', x: P(0, LY, 0)[0] - 10, y: 40, mod: P(0, LY, 0)[1] - 2, modX: P(0, LY, 0)[0] },
      { tekst: 'LÅST', enhed: 'spænding bygges op', x: 540, y: P(0, 20, 7)[1] + 40, mod: P(0, 25, 7)[1], modX: P(0, 25, 7)[0] + 2, kant: '#E8336D' },
      { tekst: 'KRYBER', x: 540, y: P(0, 20, 28)[1] + 30, mod: P(0, 25, 26)[1], modX: P(0, 25, 26)[0] + 2 },
      { tekst: 'SKORPE', x: P(-40, 0, 12)[0], y: P(-40, 0, 12)[1] + 5 },
      { tekst: 'KAPPE', x: P(-40, 0, 35)[0], y: P(-40, 0, 35)[1] + 5 },
      { tekst: 'STYKKE SKÅRET VÆK', x: P(40, 12, 0)[0], y: P(40, 12, 0)[1] + 6 }
    ];
    F.tegnMaerkater(c, m, F.W, 8);
    F.tegnFodnote(c, 'SKEMATISK · 100 km LANGT UDSNIT · FORSKYDNING ×1 000', 8, 'left');
  },

  tegnKort(c, ctx){
    const tl = M.transform(ctx.t, ctx.v);
    const YC = 60;                                              // km mod nord midt på kortet
    const kyK = y => F.KY_SNIT - (y - YC) * KPX;
    const ny = X => -M.vejForskydning(X, tl) / 1000 * OVERDRIV;
    const ryst = Math.max(0, 1 - (performance.now() - rystStart) / 1400);
    const rystX = X => ryst * 2.5 * Math.sin(performance.now() / 28 + X) * Math.max(0, 1 - Math.abs(X) / 20);

    // græs med totter
    const g = c.createLinearGradient(0, 0, F.KW, F.KH);
    g.addColorStop(0, '#B7D98C'); g.addColorStop(1, '#9CC86E');
    c.fillStyle = g; c.fillRect(0, 0, F.KW, F.KH);
    for (const t of L_.TOTTER){
      c.fillStyle = t.tone < 0.5 ? 'rgba(70,120,50,.25)' : 'rgba(255,255,255,.18)';
      c.fillRect(kx(t.x), kyK(t.y + ny(t.x)), 2, 2);
    }
    // vejene: hvor de lå ved tid 0 (stiplet), og hvor de ligger nu
    for (const v0 of L_.VEJE){
      const y = kyK(v0);
      c.save(); c.strokeStyle = 'rgba(23,33,31,.35)'; c.lineWidth = 1.2; c.setLineDash([3, 4]);
      c.beginPath(); c.moveTo(0, y); c.lineTo(F.KW, y); c.stroke(); c.restore();
      c.save(); c.lineCap = 'butt';
      for (const [bredde, farve, d] of [[9, INK, []], [7, '#55514C', []], [1.2, '#FFE08A', [5, 5]]]){
        c.strokeStyle = farve; c.lineWidth = bredde; c.setLineDash(d);
        for (const side of [-1, 1]){
          c.beginPath();
          for (let X = side * 0.05; Math.abs(X) <= KORT_KM / 2 + 2; X += side * 0.5) c.lineTo(kx(X), kyK(v0 + ny(X)));
          c.stroke();
        }
      }
      c.restore();
    }
    for (const t of L_.TRAEER) L_.trae2D(c, kx(t.x) + rystX(t.x), kyK(t.y + ny(t.x)), t);
    for (const h of L_.HUSE) L_.hus2D(c, kx(h.x), kyK(h.y + ny(h.x)), h, L_.skadet(h, tl.skaelv), rystX(h.x));
    for (const b of L_.BILER) L_.bil2D(c, kx(b.x), kyK(L_.bane(b) + ny(b.x)), b);

    for (const s of ctx.skaelv){
      const a = Math.min(1, (F.SKAELV_LEVETID - s.alder) / 1.5), x = kx(s.X), y = F.KY_SNIT + s.Y * KPX;
      F.skaelvTegn(c, x, y, s.d, a, s.stort ? 1.8 : 0.85);
      F.skaelvRing(c, x, y, s.alder);
    }
    // forkastningen
    c.save(); c.strokeStyle = '#C21F4B'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(F.KW / 2, 0); c.lineTo(F.KW / 2, F.KH); c.stroke(); c.restore();
    // pile: venstre plade mod nord, højre mod syd (højrehåndet forkastning, som San Andreas)
    const pil = (x, y, op) => {
      c.save(); c.translate(x, y); c.rotate(op ? -Math.PI / 2 : Math.PI / 2);
      c.fillStyle = '#FFF9EE'; c.strokeStyle = INK; c.lineWidth = 2; c.lineJoin = 'round';
      c.beginPath(); c.moveTo(-18, -4); c.lineTo(8, -4); c.lineTo(8, -9); c.lineTo(18, 0); c.lineTo(8, 9); c.lineTo(8, 4); c.lineTo(-18, 4); c.closePath();
      c.fill(); c.stroke(); c.restore();
    };
    pil(F.KW / 2 - 60, 490, true); pil(F.KW / 2 + 60, 490, false);
    F.kortOverskrift(c, 'SET OVENFRA · 100 km');
    F.tegnMaalestok(c, 20 * KPX, '20 km');
    F.tegnMaerkater(c, [{ tekst: 'FORSKYDNING ×1 000', x: F.KW / 2, y: 60 }], F.KW, 4);
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
