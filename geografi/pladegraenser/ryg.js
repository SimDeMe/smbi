/* ryg.js — divergent grænse: en midtoceanisk ryg.

   Fra t = 0 er der ét kontinent med en riftdal i midten. Pladerne
   glider fra hinanden, kappen strømmer op under riften, trykket
   falder, og en lille del af kappen smelter (trykaflastning). Magmaet
   størkner til ny havbund i ryggens akse, og havet bliver bredere —
   sådan som Atlanterhavet åbnede sig.

   Havbunden er stribet: magnetitten i basalten låser sig fast i
   jordens magnetfelt, når den størkner, og feltet skifter retning med
   ujævne mellemrum (model.js). Striberne ligger spejlvendt på hver side.

   Striberne følger med pladerne: havbund, der størknede for 10 mio. år
   siden, ligger nu 10 mio. års pladebevægelse fra aksen, og for hvert
   skridt tiden tager, glider den længere ud. Simulationens sidste
   tidspunkt (tid.maks) er i dag, så ved slutningen ligger striberne
   nærmest aksen efter den rigtige tidsskala.

   Hastigheden er spredningshastigheden: hvor hurtigt de to plader
   fjerner sig fra hinanden. Hver plade flytter sig halvt så hurtigt. */

import * as M from './model.js';
import * as F from './figur.js';
import * as A from './atlanterhavet.js';

const { xK, yD, INK, FARVE } = F;
const H_FOD = F.H - 9;
const TID_MAKS = 180;                       // mio. år — simulationens "i dag"

/* Striberne i den havbund, der er dannet siden t = 0, som [alder nu fra,
   alder nu til, normal?]. Magnetfeltets historie er model.js' tidsskala,
   regnet tilbage fra TID_MAKS: på tidspunktet τ havde feltet den
   polaritet, der gjaldt TID_MAKS − τ mio. år før i dag. */
function striberNu(t){
  const D = TID_MAKS - t;
  return M.striber(D, D + t).map(([a, b, pol]) => [a - D, b - D, pol]);
}
const KONT = 35, KONT_TOP = -0.4, MARGIN = 60, LITO_KONT = 120;
const smooth = u => { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); };


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
  kortTekst: 'Globus over Atlanterhavet. Ved tid 0 ligger Amerika, Europa og Afrika samlet. Efterhånden som tiden går, drejer Nord- og Sydamerika væk fra Europa og Afrika, og havbunden imellem dem farves efter alder: yngst ved ryggen i midten, ældst ude ved kysterne. Snitlinjen A–B i Sydatlanten viser, hvor tværsnittet går.',

  tid: { maks: TID_MAKS, skridt: 0.5, start: 0, tempo: 4, enhed: 'mio. år' },
  fart: { min: 1, maks: 16, skridt: 0.5, start: 2.5, navn: 'Spredningshastighed' },
  maal: { start: 120 },
  skaelvRate: 1.6,

  ryd(){ stroem.length = 0; klar = false; },

  opdater(dt, ctx){
    const g = lav(ctx);
    if (!klar){ klar = true; for (let i = 0; i < 300; i++) flyt(0.1, g, 1); }
    flyt(dt, g, 0.6 + ctx.v / 10);
  },

  skaelv(){
    // Lave skælv i ryggens akse — på kortet et tilfældigt sted langs ryggen
    return { X: (Math.random() - 0.5) * 8, d: 1 + Math.random() * 8, u: Math.random() };
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
      for (const [a, b, pol] of striberNu(ctx.t)){
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

    F.tegnSkaelvSnit(c, ctx.skaelv);
    F.tegnMaalepunkt(c, ctx.X, Math.max(0, g.overflade(ctx.X)), g.litoBund(ctx.X));
  },

  tegnKort(c, ctx){
    const g = lav(ctx);
    c.fillStyle = '#FFF9EE'; c.fillRect(0, 0, F.KW, F.KH);
    const f = Math.min(1.4, 2 * g.E / A.BREDDE_I_DAG);
    A.tegn(c, { f, t: ctx.t, maalX: ctx.X, skaelv: ctx.skaelv });
    A.tegnSkala(c, ctx.t, 440);
    F.kortOverskrift(c, 'ATLANTERHAVET SET OVENFRA');
    F.tegnFodnote(c, 'A–B: TVÆRSNITTET · ▬ RYGGEN', 12, 'left', F.KH - 14);
  },

  aflaes(ctx){
    const g = lav(ctx), a = Math.abs(ctx.X), hav = g.hav(a);
    const alder = g.alder(a), E = g.E;
    const bredde = 2 * E;
    const pol = M.polaritet(alder + TID_MAKS - ctx.t);
    return [
      { navn: 'Havbundens alder', tal: hav ? alder : null, n: 1, enhed: 'mio. år',
        lille: hav ? (pol ? 'normal magnetisering' : 'omvendt magnetisering') : 'kontinent — ikke havbund',
        andel: hav ? alder / 100 : 0, farve: pol ? FARVE.normal : '#9AA3AC' },
      { navn: 'Havdybde', tal: Math.max(0, g.overflade(ctx.X)), n: 1, enhed: 'km',
        lille: hav ? 'havbunden synker, når den køler af' : 'kontinentet',
        andel: Math.max(0, g.overflade(ctx.X)) / 7, farve: '#0E86C8' },
      { navn: 'Lithosfærens tykkelse', tal: g.litoBund(ctx.X) - Math.max(0, g.overflade(ctx.X)), n: 0, enhed: 'km',
        lille: hav ? 'vokser, efterhånden som kappen køler' : 'kontinentets lithosfære',
        andel: (g.litoBund(ctx.X) - Math.max(0, g.overflade(ctx.X))) / 130, farve: FARVE.kappe },
      { navn: 'Havets bredde', tal: bredde, n: 0, enhed: 'km',
        lille: 'Atlanterhavet i dag: ca. 4.500 km',
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
