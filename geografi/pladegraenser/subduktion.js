/* subduktion.js — konvergent grænse, hvor en oceanisk plade dykker ned.
   Fælles for ocean–kontinent (ocean-kontinent.js) og ocean–ocean
   (ocean-ocean.js); de to filer sætter bare den øverste plade.

   Den oceaniske plade er kold og tung og synker ned i kappen. Ved
   graven bøjer den ned, og derefter dykker den med en fast hældning.
   Ca. 100 km nede presses vandet ud af den, kappen over den smelter
   delvis, og magmaet stiger op til en kæde af vulkaner (model.js).
   Derfor ligger vulkanerne længere fra graven, jo fladere pladen dykker.

   Jordskælvene sker, hvor pladen gnider mod og brækker i sig selv: de
   ligger lavt ved graven og dybere og dybere langs pladen ind under den
   øverste plade (Wadati–Benioff-zonen).

   Pladen regnes i rigtige km — flad havbund, en bue ned i graven og en
   fast hældning derefter — og først bagefter trækkes figuren 3 gange i
   højden. Pladen er derfor lige tyk hele vejen, målt vinkelret på den. */

import * as M from './model.js';
import * as F from './figur.js';

const { xK, yD, INK, FARVE } = F;
const HAVBUND = 5.5, GRAV = 10;             // km
const T_PLADE = 70, T_SKORPE = 7;           // km
const R_BOEJ = 220;                         // km — bøjningsradius
const smooth = u => { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); };

// ── Pladens geometri for en given hældning ─────────────
// Linjer i km: oversiden, skorpens underkant og undersiden, efter længden
// s langs pladen (s = 0 ved graven). Gemmes, så de ikke regnes hver gang.
const huske = new Map();
function plade(haeld){
  const noegle = Math.round(haeld * 10);
  if (huske.has(noegle)) return huske.get(noegle);
  const DYK = haeld * Math.PI / 180;
  const thG = Math.acos(1 - (GRAV - HAVBUND) / R_BOEJ);       // vinklen ved graven
  const X0 = -R_BOEJ * Math.sin(thG);                         // bøjningen begynder
  const sG = R_BOEJ * thG;                                    // buelængden til graven
  const punkt = s => {                                        // s fra bøjningens start
    if (s <= 0) return { X: X0 + s, D: HAVBUND, nx: 0, nd: 1 };
    const sBue = R_BOEJ * DYK, th = Math.min(s, sBue) / R_BOEJ;
    let X = X0 + R_BOEJ * Math.sin(th), D = HAVBUND + R_BOEJ * (1 - Math.cos(th));
    if (s > sBue){ X += (s - sBue) * Math.cos(DYK); D += (s - sBue) * Math.sin(DYK); }
    return { X, D, nx: -Math.sin(th), nd: Math.cos(th) };
  };
  const top = [], skorpe = [], bund = [], s = [];
  for (let u = F.X_MIN - 40 - X0; ; u += 2){
    const p = punkt(u);
    s.push(u - sG);
    top.push([p.X, p.D]);
    skorpe.push([p.X + T_SKORPE * p.nx, p.D + T_SKORPE * p.nd]);
    bund.push([p.X + T_PLADE * p.nx, p.D + T_PLADE * p.nd]);
    if (p.D > 700) break;
  }
  // Hvor langt fra graven er pladens overside d km nede?
  const xVed = d => { const i = top.findIndex(p => p[1] >= d); return i < 0 ? Infinity : top[i][0]; };
  const sVed = d => { const i = top.findIndex(p => p[1] >= d); return i < 0 ? Infinity : s[i]; };
  // Oversidens dybde ved X (kun hvor pladen er under X)
  const topVed = X => {
    if (X <= top[0][0]) return top[0][1];
    for (let i = 1; i < top.length; i++){
      if (top[i][0] >= X){
        const [x0, d0] = top[i - 1], [x1, d1] = top[i];
        return d0 + (d1 - d0) * (X - x0) / (x1 - x0);
      }
    }
    return Infinity;
  }
  const g = { top, skorpe, bund, s, xVed, sVed, topVed, X_VULK: xVed(M.SMELTEDYBDE) };
  huske.set(noegle, g);
  return g;
}

export function lavSubduktion(o){
  // o.oevre: 'kontinent' eller 'ocean' — den plade, der ligger øverst
  const kont = o.oevre === 'kontinent';
  // To oceaniske plader er ens: samme havdybde og samme tykkelse
  const OEVRE_TOP = kont ? -0.5 : HAVBUND;   // km — overfladen langt fra graven
  const OEVRE_SKORPE = kont ? 35 : T_SKORPE;
  const OEVRE_LITO = kont ? 75 : T_PLADE;    // km under overfladen
  const BUE_HOEJDE = kont ? 4 : 7;           // km — bjergkæden/øbuen over overfladen omkring
  const BUE_BREDDE = kont ? 90 : 45;
  /* Øbuen bygges op af magmaet, der stiger op fra pladen: først
     undersøiske vulkaner, så øer. Jo mere plade der er gledet ned, jo
     mere magma er der kommet op. Den er færdig, når 600 km havbund er
     forsvundet i graven. Kontinentets bjergkæde står der fra start. */
  const BUE_FAERDIG = 600;                   // km
  const vaekst = ctx => kont ? 1 : Math.min(1, M.km(ctx.v, ctx.t) / BUE_FAERDIG);

  // Den øverste plades overflade, skorpens og lithosfærens underside, X ≥ 0
  function oevre(g, ctx){
    const XV = g.X_VULK, v = vaekst(ctx);
    const bue = X => v * BUE_HOEJDE * Math.exp(-(((X - XV) / BUE_BREDDE) ** 2));
    const overflade = X => {
      const land = GRAV + (OEVRE_TOP - GRAV) * smooth(X / (kont ? 110 : 70));
      return land - bue(X);
    };
    const skorpeBund = X => Math.min(g.topVed(X),
      overflade(X) + (OEVRE_SKORPE + (kont ? 12 : 13) * bue(X) / BUE_HOEJDE) * smooth(X / 60 + 0.15));
    const litoBund = X => Math.min(g.topVed(X), kont ? OEVRE_LITO : OEVRE_TOP + OEVRE_LITO);
    return { overflade, skorpeBund, litoBund, bue };
  }

  // Den dykkende plade flytter sig: stoffet ved s var s − v·t for t år siden
  const alderVed = (s, ctx) => {
    const u = s - M.km(ctx.v, ctx.t);
    return 25 + (((u % 6000) + 6000) % 6000) / 30;
  };

  // Partikler: vand fra pladen og magmaklumper på vej op
  const draaber = [], klumper = [];
  let tDraabe = 0, tKlump = 0;

  return {
    id: o.id, navn: o.navn, gruppe: 'Konvergent', kort: o.kort, eksempler: o.eksempler,
    beskrivelse: o.beskrivelse, kortTekst: o.kortTekst,
    tid: { maks: 50, skridt: 0.5, start: 0, tempo: 1, enhed: 'mio. år' },
    fart: { min: 1, maks: 12, skridt: 0.5, start: o.fart, navn: 'Pladernes fart mod hinanden' },
    ekstra: [{ id: 'haeld', navn: 'Pladens hældning', min: 15, maks: 70, skridt: 1, start: o.haeld, enhed: '°' }],
    maal: { start: 120 },
    skaelvRate: 3,

    ryd(){ draaber.length = 0; klumper.length = 0; },

    opdater(dt, ctx){
      const g = plade(ctx.e.haeld);
      tDraabe -= dt;
      while (tDraabe <= 0){
        tDraabe += 0.12;
        const d = 80 + Math.random() * 40, X = g.xVed(d) + (Math.random() - 0.5) * 10;
        draaber.push({ X, d: g.topVed(X) - 2, alder: 0 });
      }
      for (const p of draaber){ p.alder += dt; p.d -= 9 * dt; p.X -= 2 * dt; }
      for (let i = draaber.length - 1; i >= 0; i--) if (draaber[i].alder > 2.2) draaber.splice(i, 1);
      tKlump -= dt;
      if (tKlump <= 0){ tKlump = 1.2; klumper.push({ d: M.SMELTEDYBDE - 8, dx: (Math.random() - 0.5) * 16, r: 4 + Math.random() * 3 }); }
      for (const k of klumper) k.d -= 11 * dt;
      for (let i = klumper.length - 1; i >= 0; i--) if (klumper[i].d < OEVRE_SKORPE * 0.6) klumper.splice(i, 1);
    },

    skaelv(ctx){
      const g = plade(ctx.e.haeld);
      const Y = (Math.random() - 0.5) * 1100;
      const r = Math.random();
      if (r < 0.18){                       // i den øverste plades skorpe
        const X = 20 + Math.random() * (g.X_VULK + 60);
        return { X, d: 2 + Math.random() * 28, Y };
      }
      // langs pladen: mange lave, færre dybe — ned til ca. 670 km
      const d = r < 0.62 ? 5 + Math.random() * 65 : r < 0.92 ? 70 + Math.random() * 230 : 300 + Math.random() * 370;
      const X = g.xVed(d);
      const i = g.top.findIndex(p => p[1] >= d);
      const ind = Math.random() * 18;       // lidt inde i pladen
      const [xs, ds] = g.skorpe[i];
      return { X: X + (xs - X) / T_SKORPE * ind, d: d + (ds - d) / T_SKORPE * ind, Y };
    },

    tegnSnit(c, ctx){
      const g = plade(ctx.e.haeld), ov = oevre(g, ctx);
      F.himmelOgKappe(c);

      // den øverste plade — kun over den dykkende plade
      F.flade(c, ov.skorpeBund, ov.litoBund, FARVE.kappe, 0, F.X_MAKS + 5);
      F.flade(c, ov.overflade, ov.skorpeBund, kont ? FARVE.kontinent : FARVE.oceanskorpe, 0, F.X_MAKS + 5);
      c.save(); c.globalAlpha = kont ? 0 : 0.35;
      F.flade(c, ov.overflade, X => Math.min(ov.skorpeBund(X), ov.overflade(X) + 7), '#FFFFFF', 0, F.X_MAKS + 5);
      c.restore();

      // den dykkende plade: lithosfærisk kappe og skorpe med magnetiske striber
      const { top, skorpe, bund, s } = g;
      const sk = ([X, D]) => [xK(X), yD(D)];
      c.beginPath();
      top.forEach((p, i) => { const [x, y] = sk(p); i ? c.lineTo(x, y) : c.moveTo(x, y); });
      for (let i = bund.length - 1; i >= 0; i--){ const [x, y] = sk(bund[i]); c.lineTo(x, y); }
      c.closePath(); c.fillStyle = FARVE.kappe; c.fill();
      let i0 = 0;
      for (let i = 1; i <= top.length; i++){
        const polA = M.polaritet(alderVed(s[i0], ctx));
        if (i < top.length && M.polaritet(alderVed(s[i], ctx)) === polA && top[i][1] < F.D_MAKS + 80) continue;
        const j = Math.min(i, top.length - 1);
        c.beginPath();
        for (let k = i0; k <= j; k++){ const [x, y] = sk(top[k]); k === i0 ? c.moveTo(x, y) : c.lineTo(x, y); }
        for (let k = j; k >= i0; k--){ const [x, y] = sk(skorpe[k]); c.lineTo(x, y); }
        c.closePath(); c.fillStyle = polA ? FARVE.normal : FARVE.omvendt; c.fill();
        i0 = i;
        if (top[j][1] > F.D_MAKS + 80) break;
      }

      // havet
      F.flade(c, () => 0, X => X < 0 ? g.topVed(X) : Math.max(0, ov.overflade(X)), FARVE.hav);

      c.strokeStyle = INK; c.lineWidth = 1.8;
      for (const linje of [top, bund]){
        c.beginPath(); linje.forEach((p, i) => { const [x, y] = sk(p); i ? c.lineTo(x, y) : c.moveTo(x, y); }); c.stroke();
      }
      F.kurve(c, ov.overflade, 0, F.X_MAKS + 5, 2);
      F.kurve(c, X => ov.litoBund(X) < g.topVed(X) - 0.5 ? ov.litoBund(X) : NaN, 0, F.X_MAKS + 5, 1.5);

      // pile i pladen: den bevæger sig ned mod kappen
      const midt = top.map((p, i) => [(p[0] + bund[i][0]) / 2, (p[1] + bund[i][1]) / 2]);
      const faset = M.km(ctx.v, ctx.t) % 80;
      for (let u = faset; u < 2000; u += 80){
        const i = Math.round(u / 2); if (i < 1 || i >= midt.length) break;
        const [x, y] = sk(midt[i]), [x0, y0] = sk(midt[i - 1]);
        if (y > F.H) break;
        F.pladepil(c, x, y, Math.atan2(y - y0, x - x0));
      }

      // vand ud af pladen og magma op til vulkanerne
      c.save();
      c.beginPath(); c.moveTo(xK(0), 0);
      for (let X = 0; X <= F.X_MAKS + 5; X += 3) c.lineTo(xK(X), yD(Math.min(g.topVed(X), 400)));
      c.lineTo(F.W, 0); c.closePath(); c.clip();
      const XV = g.X_VULK;
      const mz = c.createRadialGradient(xK(XV), yD(M.SMELTEDYBDE - 12), 4, xK(XV), yD(M.SMELTEDYBDE - 12), 46);
      mz.addColorStop(0, 'rgba(214,52,24,.85)'); mz.addColorStop(1, 'rgba(214,52,24,0)');
      c.fillStyle = mz; c.beginPath(); c.ellipse(xK(XV), yD(M.SMELTEDYBDE - 12), 48, 28, 0, 0, 2 * Math.PI); c.fill();
      c.restore();
      c.fillStyle = '#0E5FA8';
      for (const d of draaber){
        c.globalAlpha = Math.min(1, 2.2 - d.alder);
        c.beginPath(); c.arc(xK(d.X), yD(d.d), 2.1, 0, 2 * Math.PI); c.fill();
      }
      c.globalAlpha = 1;
      c.fillStyle = FARVE.magma; c.strokeStyle = INK; c.lineWidth = 1.2;
      c.fillRect(xK(XV) - 1.5, yD(ov.overflade(XV)), 3, yD(OEVRE_SKORPE * 0.7) - yD(ov.overflade(XV)));
      for (const k of klumper){
        c.beginPath(); c.ellipse(xK(XV) + k.dx * (k.d - 20) / 90, yD(k.d), k.r * 0.8, k.r, 0, 0, 2 * Math.PI);
        c.fill(); c.stroke();
      }
      if (vaekst(ctx) > 0.04) F.vulkanTegn(c, xK(XV), yD(ov.overflade(XV)) - 3, 0.5 + 0.6 * vaekst(ctx));

      F.tegnDybdeakse(c);
      F.retningspil(c, xK(-200), 58, 1);

      const m = [
        { tekst: 'DYBHAVSGRAV', x: xK(-40), y: 82, mod: yD(GRAV) - 2, modX: xK(0) },
        { tekst: kont ? 'VULKANSK BJERGKÆDE' : ov.overflade(XV) < 0 ? 'VULKANSK ØBUE' : 'UNDERSØISKE VULKANER', x: xK(XV) + 10, y: 30, mod: yD(ov.overflade(XV)) - 10, modX: xK(XV) },
        { tekst: 'OCEANISK PLADE', x: xK(-270), y: yD(40) + 5 },
        { tekst: kont ? 'KONTINENTAL SKORPE' : 'OCEANISK SKORPE', x: xK(Math.min(F.X_MAKS - 60, XV + 110)), y: yD(kont ? 20 : 12) + 5 },
        { tekst: 'ASTHENOSFÆREN', x: xK(-230), y: yD(135) },
        { tekst: 'VAND PRESSES UD', x: xK(XV) - 150, y: yD(118), mod: yD(M.SMELTEDYBDE), modX: xK(g.xVed(M.SMELTEDYBDE)) - 6, kant: '#0E86C8' }
      ];
      F.tegnMaerkater(c, m);
      F.tegnFodnote(c, 'SKEMATISK · LODRET OVERHØJDE 3×', 48, 'left');
      F.tegnFodnote(c, 'STRIBER: NORMAL ▮ OMVENDT ▯', F.W - 8, 'right');

      F.tegnSkaelvSnit(c, ctx.skaelv);
      const dT = ctx.X < 0 ? g.topVed(ctx.X) : Math.max(0, ov.overflade(ctx.X));
      F.tegnMaalepunkt(c, ctx.X, dT, Math.min(F.D_MAKS, g.topVed(ctx.X)));
    },

    tegnKort(c, ctx){
      const g = plade(ctx.e.haeld), ov = oevre(g, ctx);
      const ky = Y => F.KY_SNIT + Y * F.KPX;
      const xG = F.kxK(0);
      // den dykkende plade med striber, der glider mod graven
      c.fillStyle = FARVE.hav; c.fillRect(0, 0, F.KW, F.KH);
      for (let X = F.X_MIN - 5; X < 0; X += 2){
        const i = Math.round((X - g.top[0][0]) / 2);
        if (i < 0) continue;
        c.fillStyle = M.polaritet(alderVed(g.s[Math.min(i, g.s.length - 1)], ctx)) ? '#56636F' : '#BFD6E2';
        c.fillRect(F.kxK(X), 0, F.KPX * 2 + 0.4, F.KH);
      }
      // den øverste plade
      if (kont){
        c.fillStyle = '#D9B892';
        c.beginPath(); c.moveTo(F.KW, 0);
        for (let y = 0; y <= F.KH; y += 10) c.lineTo(F.kxK(70 + 14 * Math.sin(y / 37) + 8 * Math.sin(y / 11)), y);
        c.lineTo(F.KW, F.KH); c.closePath(); c.fill();
        c.strokeStyle = INK; c.lineWidth = 1.3; c.stroke();
        c.fillStyle = 'rgba(94,70,50,.18)';
        c.fillRect(F.kxK(g.X_VULK - BUE_BREDDE * 0.9), 0, BUE_BREDDE * 1.8 * F.KPX, F.KH);
      } else {
        c.fillStyle = '#9DD2EE'; c.fillRect(xG, 0, F.KW - xG, F.KH);
      }
      // vulkanerne
      for (let y = 18; y < F.KH; y += 38){
        const x = F.kxK(g.X_VULK) + 6 * Math.sin(y * 0.7);
        if (!kont){
          // øerne dukker op, når vulkanerne når over havet; før da er de undersøiske
          const top = -ov.overflade(g.X_VULK);
          if (vaekst(ctx) < 0.04) continue;
          if (top > 0){
            const r = 4 + 7 * Math.min(1, top / 1.5);
            c.fillStyle = '#D9B892'; c.strokeStyle = INK; c.lineWidth = 1.2;
            c.beginPath(); c.ellipse(x, y, r * 1.4, r, 0, 0, 2 * Math.PI); c.fill(); c.stroke();
          } else {
            c.save(); c.strokeStyle = INK; c.lineWidth = 1.2; c.setLineDash([2, 2]);
            c.beginPath(); c.arc(x, y, 3 + 6 * vaekst(ctx), 0, 2 * Math.PI); c.stroke(); c.restore();
            continue;
          }
        }
        F.vulkanTegn(c, x, y, 0.85);
      }
      F.tegnSkaelvKort(c, ctx.skaelv, ky);
      F.takker(c, xG, 1);
      F.tegnSnitlinje(c);
      c.fillStyle = '#7A4FD6'; c.strokeStyle = INK; c.lineWidth = 1.5;
      c.beginPath(); c.arc(F.kxK(ctx.X), F.KY_SNIT, 5, 0, 2 * Math.PI); c.fill(); c.stroke();
      F.retningspil(c, F.kxK(-200), 470, 1, 40);
      F.kortOverskrift(c, 'SET OVENFRA');
      F.tegnMaalestok(c, 200 * F.KPX, '200 km');
      F.tegnMaerkater(c, [
        { tekst: 'GRAVEN', x: xG - 34, y: 62, mod: 70, modX: xG },
        { tekst: kont ? 'VULKANER' : 'ØBUE', x: F.kxK(g.X_VULK) + 20, y: 420, mod: 400, modX: F.kxK(g.X_VULK) }
      ], F.KW, 4);
    },

    aflaes(ctx){
      const g = plade(ctx.e.haeld);
      const under = ctx.X < 0 ? null : g.topVed(ctx.X);
      const slugt = M.km(ctx.v, ctx.t);
      const tidNed = (g.sVed(M.SMELTEDYBDE)) / (ctx.v * M.KM_PR_MIO);
      const tal0 = v => Math.round(v).toLocaleString('da-DK');
      const topHoejde = -oevre(g, ctx).overflade(g.X_VULK);
      return [
        { navn: 'Pladen under målepunktet', tal: under, n: 0, enhed: 'km nede',
          lille: ctx.X < 0 ? 'målepunktet er før graven' : tal0(ctx.X) + ' km fra graven',
          andel: (under ?? 0) / 250, farve: FARVE.oceanskorpe, maerke: { andel: M.SMELTEDYBDE / 250, tekst: 'smelter' } },
        { navn: 'Vulkanerne ligger', tal: g.X_VULK, n: 0, enhed: 'km fra graven',
          lille: 'der, hvor pladen er ' + M.SMELTEDYBDE + ' km nede', andel: g.X_VULK / 400, farve: FARVE.magma },
        kont ? { navn: 'Tid ned til ' + M.SMELTEDYBDE + ' km', tal: tidNed, n: 1, enhed: 'mio. år',
          lille: 'fra graven, ad pladen', andel: tidNed / 20, farve: '#7A4FD6' }
        : { navn: 'Øbuens top', tal: Math.abs(topHoejde) * 1000, n: -2, enhed: topHoejde >= 0 ? 'm over havet' : 'm under havet',
          lille: topHoejde >= 0 ? 'vulkanøerne er dukket op' : vaekst(ctx) > 0.04 ? 'undersøiske vulkaner vokser' : 'magmaet er ikke nået op endnu',
          andel: vaekst(ctx), farve: '#7A4FD6' },
        { navn: 'Havbund forsvundet i graven', tal: slugt, n: 0, enhed: 'km',
          lille: 'siden tid 0', andel: slugt / 6000, farve: '#0FA593' }
      ];
    },

    fakta: () => o.fakta
  };
}
