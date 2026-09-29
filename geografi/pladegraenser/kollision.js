/* kollision.js — konvergent grænse: to kontinenter støder sammen.

   Havet imellem dem er slugt, og nu mødes to kontinentale plader. De
   er for lette til at synke ned i kappen, så skorpen presses sammen,
   foldes og stables. Den tykke skorpe flyder højere op — og stikker
   endnu længere ned: bjergkæden får en rod (isostasi, model.js).

   Fra t = 0 er kontinenterne netop stødt sammen, og den venstre plade
   (som Indien) presser videre mod den højre (som Eurasien). */

import * as M from './model.js';
import * as F from './figur.js';

const { xK, yD, INK, FARVE } = F;
const KERNE = -60;                          // km — bjergkædens kerne begynder her
const BASIS = 0.4;                          // km — et normalt kontinents højde
const LITO = 120;                           // km
const VENSTRE = '#B98F70', HOEJRE = '#CDAE8C';
const TERRAEN = 4;                          // ekstra overhøjde på bjergene over havet
// Lagene af sedimenter øverst i skorpen, der foldes, når skorpen presses sammen
const LAG = ['#D8C09A', '#B7936B', '#E6D2AE', '#9E7B58', '#CDB08A'];
const LAG_KM = 2.4;                         // hvert lags tykkelse før sammentrykningen

function lav(ctx){
  const s = M.km(ctx.v, ctx.t);
  const kaede = M.bjergkaede(s);
  const T = X => M.skorpeVed(X - KERNE, kaede);
  const hoejde = X => BASIS + M.opdrift(T(X) - M.KONT_SKORPE);
  const overflade = X => -hoejde(X);
  const moho = X => T(X) - hoejde(X);
  /* Til tegningen: bjergene over havet får ekstra overhøjde (TERRAEN),
     ellers ville en 6 km høj bjergkæde kun være et par pixel. Toppene
     er takkede, og takkerne bliver større, jo højere kæden er. */
  const vis = X => {
    const h = hoejde(X) - BASIS;
    const takker = h * (0.22 * Math.sin(X / 7.3) + 0.14 * Math.sin(X / 2.9 + 1.3) + 0.08 * Math.sin(X / 1.3));
    return -(BASIS + TERRAEN * Math.max(0, h + takker));
  };
  return { s, kaede, T, hoejde, overflade, moho, vis };
}

export default {
  id: 'kollision',
  navn: 'Kontinent mod kontinent',
  gruppe: 'Konvergent',
  kort: 'To kontinenter støder sammen, og skorpen presses op til en bjergkæde',
  eksempler: 'Himalaya og Alperne',
  beskrivelse: 'Tværsnit gennem en kontinentkollision fra overfladen og 170 km ned. Den venstre plade presses mod den højre. Ingen af dem kan synke ned i kappen, så skorpen presses sammen, lagene i den foldes, og den bliver tykkere: en foldebjergkæde rejser sig (tegnet med ekstra overhøjde), og under den stikker en rod af skorpe langt ned i kappen. Et stykke gammel havbund, der er revet af, synker under bjergene. Træk målepunktet til siden for at aflæse skorpens tykkelse og højden.',
  kortTekst: 'Kort set ovenfra: to kontinenter mødes langs en sutur med takker, der peger ind over den højre plade. Bjergkæden ligger langs suturen og bliver bredere, efterhånden som skorpen presses sammen. Jordskælvene ligger spredt under bjergene og er lave eller mellemdybe.',

  tid: { maks: 50, skridt: 0.5, start: 0, tempo: 1, enhed: 'mio. år' },
  fart: { min: 1, maks: 10, skridt: 0.5, start: 5, navn: 'Pladernes fart mod hinanden' },
  maal: { start: 20 },
  skaelvRate: 2.4,

  ryd(){},
  opdater(){},

  skaelv(ctx){
    const g = lav(ctx);
    const b = g.kaede.b;
    const X = KERNE - 80 + Math.random() * (b + 200);
    const r = Math.random();
    const d = r < 0.8 ? 3 + Math.random() * 40 : 60 + Math.random() * 50;
    return { X, d, Y: (Math.random() - 0.5) * 1100 };
  },

  tegnSnit(c, ctx){
    const g = lav(ctx);
    F.himmelOgKappe(c);

    // den gamle havbund, der er revet af og synker
    const synk = Math.min(15, ctx.t * 0.5);
    c.save();
    c.translate(xK(70), yD(LITO + 12 + synk));
    c.beginPath(); c.moveTo(-10, -30); c.lineTo(22, -30); c.lineTo(8, 70); c.lineTo(-24, 70); c.closePath();
    c.fillStyle = FARVE.kappe; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.5; c.setLineDash([4, 3]); c.stroke();
    c.restore();

    // lithosfærisk kappe og skorpe i begge plader
    F.flade(c, g.moho, () => LITO, FARVE.kappe);
    F.flade(c, g.vis, g.moho, VENSTRE, F.X_MIN - 5, 0);
    F.flade(c, g.vis, g.moho, HOEJRE, 0, F.X_MAKS + 5);
    // suturen: den venstre plades skorpe er skubbet ind under den højre
    c.save();
    c.beginPath();
    const d0 = g.vis(0);
    c.moveTo(xK(0), yD(d0));
    const sutur = d => (d - d0) * 2.2;
    for (let d = d0; d <= g.moho(40); d += 1) c.lineTo(xK(sutur(d)), yD(d));
    c.lineTo(xK(0), yD(g.moho(40)));
    c.closePath(); c.fillStyle = VENSTRE; c.fill();
    c.strokeStyle = INK; c.lineWidth = 2; c.setLineDash([6, 3]);
    c.beginPath(); c.moveTo(xK(0), yD(d0));
    for (let d = d0; d <= g.moho(sutur(d)); d += 1) c.lineTo(xK(sutur(d)), yD(d));
    c.stroke();
    c.restore();

    // foldede lag: flade før kollisionen, mere og mere foldede, jo mere
    // skorpen er fortykket. Lagene bliver også tykkere samme sted.
    const fold = X => (g.T(X) - M.KONT_SKORPE) / (M.MAKS_SKORPE - M.KONT_SKORPE);
    const grans = (X, k) => {
      const f = fold(X);
      const tyk = LAG_KM * g.T(X) / M.KONT_SKORPE;
      return -(BASIS + TERRAEN * (g.hoejde(X) - BASIS)) + k * tyk + 7 * f * Math.sin(X / 14 + k * 0.25) * (1 - 0.08 * k);
    };
    c.save();
    c.beginPath();
    for (let X = F.X_MIN - 5; X <= F.X_MAKS + 5; X += 1.5) c.lineTo(xK(X), yD(g.vis(X)));
    for (let X = F.X_MAKS + 5; X >= F.X_MIN - 5; X -= 1.5) c.lineTo(xK(X), yD(g.moho(X)));
    c.closePath(); c.clip();
    for (let k = 0; k < LAG.length; k++){
      F.flade(c, X => k === 0 ? g.vis(X) - 20 : grans(X, k), X => grans(X, k + 1), LAG[k]);
    }
    c.strokeStyle = 'rgba(23,33,31,.35)'; c.lineWidth = 1;
    for (let k = 1; k <= LAG.length; k++) F.kurve(c, X => grans(X, k), F.X_MIN - 5, F.X_MAKS + 5, 0.8);
    c.restore();

    F.kurve(c, () => LITO, F.X_MIN - 5, F.X_MAKS + 5, 1.5);
    F.kurve(c, g.moho, F.X_MIN - 5, F.X_MAKS + 5, 1, [4, 4]);
    F.kurve(c, g.vis, F.X_MIN - 5, F.X_MAKS + 5, 2);
    // normal Moho som stiplet hjælpelinje, så roden kan ses
    c.save(); c.strokeStyle = 'rgba(23,33,31,.5)'; c.lineWidth = 1; c.setLineDash([2, 4]);
    const mNorm = M.KONT_SKORPE - BASIS;
    c.beginPath(); c.moveTo(xK(KERNE - 140), yD(mNorm)); c.lineTo(xK(KERNE + g.kaede.b + 140), yD(mNorm)); c.stroke();
    c.restore();

    // pile i den venstre plade: den presses mod højre
    const faset = g.s % 70;
    for (let X = F.X_MIN + 20 + faset; X < KERNE - 30; X += 70) F.pladepil(c, xK(X), yD((g.moho(X) + LITO) / 2), 0);

    F.tegnDybdeakse(c);
    F.retningspil(c, xK(-280), 58, 1);

    const top = Math.min(...[KERNE, KERNE + g.kaede.b / 2].map(g.vis));
    const m = [
      { tekst: g.kaede.hoejde > 1 ? 'FOLDEBJERGKÆDE' : 'FOLDER BEGYNDER', x: xK(KERNE + g.kaede.b / 2), y: 36, mod: yD(top) - 2, modX: xK(KERNE + g.kaede.b / 2) },
      { tekst: 'SUTUR', x: xK(0) + 70, y: 86, mod: yD(g.vis(0)) - 1, modX: xK(0) },
      { tekst: 'KONTINENTAL SKORPE', x: xK(-280), y: yD(17) + 5 },
      { tekst: 'LITHOSFÆRISK KAPPE', x: xK(-280), y: yD(80) + 5 },
      { tekst: 'ASTHENOSFÆREN', x: xK(-230), y: yD(140) },
      { tekst: 'AFREVET HAVBUND', x: xK(200), y: yD(LITO + 30), mod: yD(LITO + 12 + synk), modX: xK(80) }
    ];
    if (g.kaede.rod > 3)
      m.push({ tekst: 'BJERGROD', x: xK(KERNE + g.kaede.b / 2) + 90, y: yD(g.moho(KERNE + g.kaede.b / 2)) + 22,
               mod: yD(g.moho(KERNE + g.kaede.b / 2)) - 3, modX: xK(KERNE + g.kaede.b / 2) });
    F.tegnMaerkater(c, m);
    F.tegnFodnote(c, 'SKEMATISK · OVERHØJDE 3× · BJERGENE 12×', 48, 'left');
    F.tegnFodnote(c, '┄ NORMAL SKORPEBUND', F.W - 8, 'right');

    F.tegnSkaelvSnit(c, ctx.skaelv);
    F.tegnMaalepunkt(c, ctx.X, g.vis(ctx.X), g.moho(ctx.X));
  },

  tegnKort(c, ctx){
    const g = lav(ctx);
    const ky = Y => F.KY_SNIT + Y * F.KPX;
    c.fillStyle = '#D9B892'; c.fillRect(0, 0, F.KXC, F.KH);
    c.fillStyle = '#E3C7A3'; c.fillRect(F.KXC, 0, F.KW - F.KXC, F.KH);
    // bjergkæden: mørkere, jo højere
    for (let X = F.X_MIN; X < F.X_MAKS; X += 3){
      const h = g.hoejde(X) - BASIS;
      if (h < 0.05) continue;
      c.fillStyle = `rgba(92,62,40,${Math.min(0.75, h / 7)})`;
      c.fillRect(F.kxK(X), 0, 3 * F.KPX + 0.4, F.KH);
    }
    // bjergsymboler
    c.strokeStyle = INK; c.lineWidth = 1.3;
    if (g.kaede.hoejde > 0.8){
      for (let X = KERNE - 20; X < KERNE + g.kaede.b + 20; X += 45){
        for (let y = 30; y < F.KH; y += 44){
          const x = F.kxK(X) + ((y / 44) % 2) * 9;
          c.beginPath(); c.moveTo(x - 6, y + 5); c.lineTo(x, y - 5); c.lineTo(x + 6, y + 5); c.stroke();
        }
      }
    }
    F.tegnSkaelvKort(c, ctx.skaelv, ky);
    F.takker(c, F.KXC, 1);
    F.tegnSnitlinje(c);
    c.fillStyle = '#7A4FD6'; c.strokeStyle = INK; c.lineWidth = 1.5;
    c.beginPath(); c.arc(F.kxK(ctx.X), F.KY_SNIT, 5, 0, 2 * Math.PI); c.fill(); c.stroke();
    F.retningspil(c, F.kxK(-250), 470, 1, 40);
    F.kortOverskrift(c, 'SET OVENFRA');
    F.tegnMaalestok(c, 200 * F.KPX, '200 km');
    F.tegnMaerkater(c, [{ tekst: 'SUTUR', x: F.KXC + 36, y: 62, mod: 70, modX: F.KXC }], F.KW, 4);
  },

  aflaes(ctx){
    const g = lav(ctx);
    const T = g.T(ctx.X), h = g.hoejde(ctx.X), rod = g.moho(ctx.X) - (M.KONT_SKORPE - BASIS);
    return [
      { navn: 'Skorpens tykkelse', tal: T, n: 0, enhed: 'km', lille: T > 36 ? 'fortykket af sammentrykningen' : 'som et normalt kontinent',
        andel: T / 80, farve: FARVE.kontinent, maerke: { andel: M.KONT_SKORPE / 80, tekst: 'normal' } },
      { navn: 'Højde over havet', tal: h * 1000, n: -2, enhed: 'm', lille: 'Mount Everest: 8.849 m',
        andel: h / 9, farve: '#566B68' },
      { navn: 'Bjergrod under normal skorpe', tal: Math.max(0, rod), n: 0, enhed: 'km',
        lille: h > BASIS + 0.2 ? `${(Math.max(0, rod) / Math.max(0.01, h - BASIS)).toLocaleString('da-DK', { maximumFractionDigits: 1 })} × så meget som bjerget over` : 'ingen rod',
        andel: Math.max(0, rod) / 40, farve: '#7A4FD6' },
      { navn: 'Sammentrykning i alt', tal: g.s, n: 0, enhed: 'km', lille: 'Indien har presset sig ca. 2.500 km ind i Asien',
        andel: g.s / 5000, farve: '#0FA593' }
    ];
  },

  fakta: () => [
    ['Konvergent · pladerne bevæger sig mod hinanden'],
    ['Fx Himalaya og Alperne'],
    ['Ingen vulkaner: skorpen synker ikke ned']
  ]
};
