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
const SKORPE = 30, LITO = 90, TOP = -0.5;
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
  beskrivelse: 'Tværsnit på tværs af en transformforkastning fra overfladen og 170 km ned. Den venstre plade bevæger sig ud mod os, den højre væk fra os. Forkastningen går lodret ned gennem skorpen og er låst fast de øverste 15 km. Der er ingen vulkaner, og alle jordskælv er lave.',
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

  tegnSnit(c, ctx){
    F.himmelOgKappe(c);
    F.flade(c, () => SKORPE, () => LITO, FARVE.kappe);
    F.flade(c, () => TOP, () => SKORPE, FARVE.kontinent, F.X_MIN - 5, 0);
    F.flade(c, () => TOP, () => SKORPE, '#CDAE8C', 0, F.X_MAKS + 5);
    F.kurve(c, () => LITO, F.X_MIN - 5, F.X_MAKS + 5, 1.5);
    F.kurve(c, () => SKORPE, F.X_MIN - 5, F.X_MAKS + 5, 1, [4, 4]);
    F.kurve(c, () => TOP, F.X_MIN - 5, F.X_MAKS + 5, 2);

    // forkastningen: låst foroven, kryber forneden
    c.save(); c.strokeStyle = INK; c.lineWidth = 3;
    c.beginPath(); c.moveTo(xK(0), yD(TOP)); c.lineTo(xK(0), yD(M.LAASEDYBDE)); c.stroke();
    c.lineWidth = 1.8; c.setLineDash([5, 4]);
    c.beginPath(); c.moveTo(xK(0), yD(M.LAASEDYBDE)); c.lineTo(xK(0), yD(LITO)); c.stroke();
    c.restore();

    // ud af skærmen (⊙) og ind i skærmen (⊗)
    const symbol = (x, y, ud) => {
      c.save(); c.fillStyle = '#FFF9EE'; c.strokeStyle = INK; c.lineWidth = 2;
      c.beginPath(); c.arc(x, y, 13, 0, 2 * Math.PI); c.fill(); c.stroke();
      c.fillStyle = INK; c.lineWidth = 2.4;
      if (ud){ c.beginPath(); c.arc(x, y, 3.8, 0, 2 * Math.PI); c.fill(); }
      else { c.beginPath(); c.moveTo(x - 6, y - 6); c.lineTo(x + 6, y + 6); c.moveTo(x + 6, y - 6); c.lineTo(x - 6, y + 6); c.stroke(); }
      c.restore();
    };
    for (const X of [-240, -100]) symbol(xK(X), yD(60), true);
    for (const X of [100, 240]) symbol(xK(X), yD(60), false);

    F.tegnDybdeakse(c);
    const m = [
      { tekst: 'FORKASTNINGEN', x: xK(0), y: 36, mod: yD(TOP) - 2, modX: xK(0) },
      { tekst: 'LÅST', enhed: '0–15 km', x: xK(0) + 80, y: yD(8) + 5, mod: yD(8), modX: xK(0) + 2 },
      { tekst: 'KRYBER', x: xK(0) + 80, y: yD(45) + 5, mod: yD(45), modX: xK(0) + 2 },
      { tekst: 'KONTINENTAL SKORPE', x: xK(-230), y: yD(15) + 5 },
      { tekst: 'ASTHENOSFÆREN', x: xK(-230), y: yD(135) },
      { tekst: '⊙ MOD OS', x: xK(-170), y: yD(82) },
      { tekst: '⊗ VÆK FRA OS', x: xK(170), y: yD(82) }
    ];
    F.tegnMaerkater(c, m);
    F.tegnFodnote(c, 'SKEMATISK · LODRET OVERHØJDE 3×', 48, 'left');
    F.tegnSkaelvSnit(c, ctx.skaelv);
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
