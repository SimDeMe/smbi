/* ryg.js — divergent grænse: en midtoceanisk ryg.

   Fra t = 0 er der ét kontinent med en riftdal i midten. Pladerne
   glider fra hinanden, kappen strømmer op under riften, trykket
   falder, og en lille del af kappen smelter (trykaflastning). Magmaet
   størkner til ny havbund i ryggens akse, og havet bliver bredere —
   sådan som Atlanterhavet åbnede sig.

   Havbunden er stribet: magnetitten i basalten låser sig fast i
   jordens magnetfelt, når den størkner, og feltet skifter retning med
   ujævne mellemrum (model.js). Striberne ligger spejlvendt på hver side.

   Hastigheden er spredningshastigheden: hvor hurtigt de to plader
   fjerner sig fra hinanden. Hver plade flytter sig halvt så hurtigt. */

import * as M from './model.js';
import * as F from './figur.js';

const { xK, yD, INK, FARVE } = F;
const H_FOD = F.H - 9;
const KONT = 35, KONT_TOP = -0.4, MARGIN = 60, LITO_KONT = 120;
const smooth = u => { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); };

// Ryggen er delt i segmenter, forskudt langs transformforkastninger
// (km langs grænsen, og hvor meget aksen er skubbet til siden)
const SEGMENTER = [
  { y0: -700, y1: -380, off: -48 },
  { y0: -380, y1: -130, off: 30 },
  { y0: -130, y1: 240, off: 0 },          // snitlinjen går gennem dette
  { y0: 240, y1: 700, off: -36 }
];

// ── Geometrien i tværsnittet, i km ─────────────────────
function lav(ctx){
  const hk = ctx.v / 2 * M.KM_PR_MIO;              // km pr. mio. år for hver plade
  const E = hk * ctx.t;                            // hvor langt kysterne er flyttet
  const hav = a => a < E;
  const alder = a => a / Math.max(hk, 1e-9);
  const overflade = X => {
    const a = Math.abs(X);
    if (hav(a)) return M.havdybde(alder(a));
    return M.havdybde(ctx.t) + (KONT_TOP - M.havdybde(ctx.t)) * smooth((a - E) / MARGIN);
  };
  const skorpeBund = X => {
    const a = Math.abs(X);
    if (hav(a)) return overflade(X) + M.OCEANSKORPE;
    return overflade(X) + M.OCEANSKORPE + (KONT - M.OCEANSKORPE) * smooth((a - E) / MARGIN);
  };
  const litoBund = X => {
    const a = Math.abs(X);
    const kant = M.havdybde(ctx.t) + Math.max(6, M.lithosfaere(ctx.t));
    if (hav(a)) return overflade(X) + Math.max(6, M.lithosfaere(alder(a)));
    return kant + (LITO_KONT - kant) * smooth((a - E) / 160);
  };
  return { hk, E, hav, alder, overflade, skorpeBund, litoBund };
}

// ── Animationen: kappen strømmer op under ryggen ───────
const stroem = [];
let tStroem = 0, klar = false;

function flyt(dt, g, fart){
  tStroem -= dt;
  while (tStroem <= 0){
    tStroem += 0.12;
    stroem.push({ X: (Math.random() - 0.5) * 170, d: F.D_MAKS + 2 });
  }
  for (const p of stroem){
    const naer = Math.max(0, Math.min(1, (150 - p.d) / 110));
    p.d -= 26 * (1 - 0.8 * naer) * dt * fart;
    p.X += Math.sign(p.X || 1) * (5 + 55 * naer * naer) * dt * fart;
  }
  for (let i = stroem.length - 1; i >= 0; i--){
    const p = stroem[i];
    if (p.d < g.litoBund(p.X) + 1.5 || p.X < F.X_MIN || p.X > F.X_MAKS) stroem.splice(i, 1);
  }
}

export default {
  id: 'ryg',
  navn: 'Midtoceanisk ryg',
  gruppe: 'Divergent',
  kort: 'Pladerne glider fra hinanden, og der dannes ny havbund',
  eksempler: 'Midtatlanterhavsryggen og Island',
  beskrivelse: 'Tværsnit gennem en midtoceanisk ryg fra overfladen og 170 km ned. To plader glider fra hinanden. Under ryggen strømmer kappen op og smelter delvis, og magmaet størkner til ny havbund med magnetiske striber, der ligger spejlvendt på hver side. Havbunden bliver dybere og lithosfæren tykkere, jo ældre havbunden er. Ude til siderne ligger kontinenterne, der er flyttet fra hinanden. Træk målepunktet til siden for at aflæse havbundens alder.',
  kortTekst: 'Kort set ovenfra: den midtoceaniske ryg går lodret gennem kortet og er forskudt langs transformforkastninger. På hver side ligger havbunden i striber efter magnetisk polaritet, spejlvendt om ryggen. Kontinenterne ligger ude til siderne. Snitlinjen A–B viser, hvor tværsnittet går.',

  tid: { maks: 100, skridt: 0.5, start: 0, tempo: 2, enhed: 'mio. år' },
  fart: { min: 1, maks: 16, skridt: 0.5, start: 2.5, navn: 'Spredningshastighed' },
  maal: { start: 120 },
  skaelvRate: 1.6,

  ryd(){ stroem.length = 0; klar = false; },

  opdater(dt, ctx){
    const g = lav(ctx);
    if (!klar){ klar = true; for (let i = 0; i < 300; i++) flyt(0.1, g, 1); }
    flyt(dt, g, 0.6 + ctx.v / 10);
  },

  skaelv(ctx){
    // Lave skælv i ryggens akse og langs transformforkastningerne mellem segmenterne
    const r = Math.random();
    if (r < 0.7){
      const s = SEGMENTER[Math.floor(Math.random() * SEGMENTER.length)];
      return { X: (Math.random() - 0.5) * 8, d: 1 + Math.random() * 8,
               KX: s.off + (Math.random() - 0.5) * 8, Y: s.y0 + Math.random() * (s.y1 - s.y0) };
    }
    const i = 1 + Math.floor(Math.random() * (SEGMENTER.length - 1));
    const a = SEGMENTER[i - 1].off, b = SEGMENTER[i].off;
    const X = a + Math.random() * (b - a);
    return { X: X - SEGMENTER[2].off, d: 1 + Math.random() * 10, KX: X, Y: SEGMENTER[i].y0, sn: false };
  },

  tegnSnit(c, ctx){
    const g = lav(ctx);
    F.himmelOgKappe(c);

    // smeltezonen: en kile under aksen, fra ca. 60 km op til skorpen
    c.save();
    c.beginPath(); c.moveTo(xK(-95), yD(62)); c.lineTo(xK(0), yD(g.litoBund(0) + 1)); c.lineTo(xK(95), yD(62)); c.closePath();
    const mz = c.createRadialGradient(xK(0), yD(12), 4, xK(0), yD(30), 90);
    mz.addColorStop(0, 'rgba(214,52,24,.9)'); mz.addColorStop(1, 'rgba(214,52,24,.1)');
    c.fillStyle = mz; c.fill();
    c.restore();
    c.save(); c.setLineDash([4, 4]); c.strokeStyle = '#B42A12'; c.lineWidth = 1.4;
    c.beginPath(); c.moveTo(xK(-150), yD(62)); c.lineTo(xK(150), yD(62)); c.stroke();
    c.restore();

    // kappen, der strømmer op
    c.fillStyle = 'rgba(255,255,255,.7)';
    for (const p of stroem){ c.beginPath(); c.arc(xK(p.X), yD(p.d), 2, 0, 2 * Math.PI); c.fill(); }

    // lithosfærisk kappe og skorpe
    F.flade(c, g.skorpeBund, g.litoBund, FARVE.kappe);
    F.flade(c, g.overflade, g.skorpeBund, FARVE.kontinent);
    // havbunden i striber — kun den del, der er dannet ved ryggen
    for (const s of [-1, 1]){
      for (const [a, b, pol] of M.striber(0, ctx.t)){
        const X0 = Math.min(s * a * g.hk, s * b * g.hk), X1 = Math.max(s * a * g.hk, s * b * g.hk);
        if (X1 < F.X_MIN || X0 > F.X_MAKS) continue;
        F.flade(c, g.overflade, X => g.overflade(X) + M.OCEANSKORPE, pol ? FARVE.normal : FARVE.omvendt,
                Math.max(X0, F.X_MIN - 5), Math.min(X1, F.X_MAKS + 5));
      }
    }
    // havet
    F.flade(c, () => 0, X => Math.max(0, g.overflade(X)), FARVE.hav);

    // magma i aksen
    c.fillStyle = FARVE.magma;
    c.beginPath(); c.ellipse(xK(0), yD(g.overflade(0) + 4.5), 7, 5, 0, 0, 2 * Math.PI); c.fill();
    c.strokeStyle = INK; c.lineWidth = 1.2; c.stroke();

    // grænser
    F.kurve(c, g.litoBund, F.X_MIN - 5, F.X_MAKS + 5, 1.5);
    F.kurve(c, g.overflade, F.X_MIN - 5, F.X_MAKS + 5, 2);
    F.kurve(c, g.skorpeBund, F.X_MIN - 5, F.X_MAKS + 5, 1, [4, 4]);

    // pile i pladerne: de flytter sig væk fra ryggen
    const faset = (g.hk * ctx.t) % 70;
    for (const s of [-1, 1]){
      for (let a = 25 + faset; a < 420; a += 70){
        const X = s * a;
        const d = (g.skorpeBund(X) + g.litoBund(X)) / 2;
        if (g.litoBund(X) - g.skorpeBund(X) < 9) continue;
        F.pladepil(c, xK(X), yD(d), s > 0 ? 0 : Math.PI);
      }
    }

    F.tegnDybdeakse(c);
    F.retningspil(c, xK(-95), 58, -1);
    F.retningspil(c, xK(95), 58, 1);

    const m = [
      { tekst: 'RYGGENS AKSE', x: xK(0), y: 30, mod: yD(g.overflade(0)) - 2, modX: xK(0) },
      { tekst: 'LITHOSFÆRISK KAPPE', x: xK(-230), y: yD(Math.min(80, (g.skorpeBund(-230) + g.litoBund(-230)) / 2)) + 5 },
      { tekst: 'ASTHENOSFÆREN', x: xK(210), y: yD(135) },
      { tekst: 'DELVIS SMELTNING', x: xK(170), y: yD(50), mod: yD(40), modX: xK(35), kant: '#E8336D' }
    ];
    if (g.E > 40) m.push({ tekst: 'NY HAVBUND', x: xK(Math.min(g.E, 260) * 0.55), y: yD(26), mod: yD(g.overflade(Math.min(g.E, 260) * 0.5) + 4), modX: xK(Math.min(g.E, 260) * 0.5) });
    if (g.E < 330) m.push({ tekst: 'KONTINENT', x: xK(-g.E - 70), y: 88, mod: yD(0) - 1, modX: xK(-g.E - 60) });
    F.tegnMaerkater(c, m);
    F.tegnFodnote(c, 'SKEMATISK · LODRET OVERHØJDE 3×', 48, 'left', H_FOD);
    F.tegnFodnote(c, 'STRIBER: NORMAL ▮ OMVENDT ▯', F.W - 8, 'right', H_FOD);

    F.tegnSkaelvSnit(c, ctx.skaelv.filter(s => s.sn !== false));
    F.tegnMaalepunkt(c, ctx.X, Math.max(0, g.overflade(ctx.X)), g.litoBund(ctx.X));
  },

  tegnKort(c, ctx){
    const g = lav(ctx);
    const ky = Y => F.KY_SNIT + Y * F.KPX;
    c.fillStyle = FARVE.hav; c.fillRect(0, 0, F.KW, F.KH);
    for (const s of SEGMENTER){
      const y0 = ky(s.y0), y1 = ky(s.y1);
      c.save(); c.beginPath(); c.rect(0, y0, F.KW, y1 - y0); c.clip();
      // kontinenterne
      c.fillStyle = '#D9B892';
      c.fillRect(0, y0, F.kxK(s.off - g.E), y1 - y0);
      c.fillRect(F.kxK(s.off + g.E), y0, F.KW, y1 - y0);
      // striberne
      for (const side of [-1, 1]){
        for (const [a, b, pol] of M.striber(0, ctx.t)){
          const x0 = F.kxK(s.off + side * a * g.hk), x1 = F.kxK(s.off + side * b * g.hk);
          if (Math.max(x0, x1) < 0 || Math.min(x0, x1) > F.KW) continue;
          c.fillStyle = pol ? FARVE.normal : FARVE.omvendt;
          c.fillRect(Math.min(x0, x1), y0, Math.abs(x1 - x0) + 0.3, y1 - y0);
        }
      }
      // kysterne
      c.strokeStyle = INK; c.lineWidth = 1.5;
      for (const X of [s.off - g.E, s.off + g.E]){ c.beginPath(); c.moveTo(F.kxK(X), y0); c.lineTo(F.kxK(X), y1); c.stroke(); }
      // ryggens akse: dobbeltstreg
      c.strokeStyle = '#C21F4B'; c.lineWidth = 2;
      for (const d of [-2.5, 2.5]){ c.beginPath(); c.moveTo(F.kxK(s.off) + d, y0); c.lineTo(F.kxK(s.off) + d, y1); c.stroke(); }
      c.restore();
    }
    // brudzonerne: transformforkastningen mellem akserne er aktiv (fuldt optrukket),
    // resten er en død ar i havbunden (stiplet)
    for (let i = 1; i < SEGMENTER.length; i++){
      const y = ky(SEGMENTER[i].y0), a = SEGMENTER[i - 1].off, b = SEGMENTER[i].off;
      c.save(); c.strokeStyle = INK; c.lineWidth = 1.2; c.setLineDash([3, 3]);
      c.beginPath(); c.moveTo(F.kxK(Math.min(a, b) - g.E), y); c.lineTo(F.kxK(Math.max(a, b) + g.E), y); c.stroke();
      c.setLineDash([]); c.lineWidth = 2.5;
      c.beginPath(); c.moveTo(F.kxK(a), y); c.lineTo(F.kxK(b), y); c.stroke();
      c.restore();
    }

    F.tegnSkaelvKort(c, ctx.skaelv.map(s => ({ ...s, X: s.KX })), ky);
    F.tegnSnitlinje(c);
    // målepunktet
    c.fillStyle = '#7A4FD6'; c.strokeStyle = INK; c.lineWidth = 1.5;
    c.beginPath(); c.arc(F.kxK(ctx.X), F.KY_SNIT, 5, 0, 2 * Math.PI); c.fill(); c.stroke();

    F.retningspil(c, F.KXC - 70, 470, -1, 40);
    F.retningspil(c, F.KXC + 70, 470, 1, 40);
    F.kortOverskrift(c, 'SET OVENFRA');
    F.tegnMaalestok(c, 200 * F.KPX, '200 km');
    F.tegnMaerkater(c, [
      { tekst: 'RYGGEN', x: F.KXC + 50, y: 62, mod: 70, modX: F.kxK(0) + 2 },
      { tekst: 'TRANSFORMFORKASTNING', x: F.KXC + 60, y: ky(-130) - 20, mod: ky(-130), modX: F.kxK(12) }
    ], F.KW, 4);
  },

  aflaes(ctx){
    const g = lav(ctx), a = Math.abs(ctx.X), hav = g.hav(a);
    const alder = g.alder(a), E = g.E;
    const bredde = 2 * E;
    const pol = M.polaritet(alder);
    return [
      { navn: 'Havbundens alder', tal: hav ? alder : null, n: 1, enhed: 'mio. år',
        lille: hav ? (pol ? 'normal magnetisering — som i dag' : 'omvendt magnetisering') : 'kontinent — ikke havbund',
        andel: hav ? alder / 100 : 0, farve: pol ? FARVE.normal : '#9AA3AC' },
      { navn: 'Havdybde', tal: Math.max(0, g.overflade(ctx.X)), n: 1, enhed: 'km',
        lille: hav ? 'havbunden synker, når den køler af' : 'kontinentet',
        andel: Math.max(0, g.overflade(ctx.X)) / 7, farve: '#0E86C8' },
      { navn: 'Lithosfærens tykkelse', tal: g.litoBund(ctx.X) - Math.max(0, g.overflade(ctx.X)), n: 0, enhed: 'km',
        lille: hav ? 'vokser, efterhånden som kappen køler' : 'kontinentets lithosfære',
        andel: (g.litoBund(ctx.X) - Math.max(0, g.overflade(ctx.X))) / 130, farve: FARVE.kappe },
      { navn: 'Havets bredde', tal: bredde, n: 0, enhed: 'km',
        lille: 'Atlanterhavet i dag: ca. 5.000 km',
        andel: bredde / 6000, farve: '#0FA593' }
    ];
  },

  fakta(){
    return [
      ['Divergent · pladerne glider fra hinanden'],
      ['Fx Midtatlanterhavsryggen og Island'],
      ['Vulkaner: basaltisk magma', '../vulkanudbrud.html#type=skjold', 'Se skjoldvulkanen']
    ];
  },

  maalTekst: (ctx, tal) => `Målepunktet er ${tal(Math.abs(ctx.X), 0)} km fra ryggen.`
};
