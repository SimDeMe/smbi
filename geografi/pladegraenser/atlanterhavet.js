/* atlanterhavet.js — kortet ved den midtoceaniske ryg: Atlanterhavet
   åbner sig på en globus.

   Kontinenterne er tegnet, som de ligger i dag, og drejes tilbage om
   de klassiske Euler-poler fra Bullard, Everett & Smith (1965):
     Sydamerika mod Afrika   pol 44,0° N 30,6° V, 57,0°
     Nordamerika mod Afrika  pol 67,6° N 13,6° V, 75,5°
   Afrika og Europa holdes fast; Amerika drejes. Ved f = 0 ligger
   kontinenterne samlet (Pangæa), ved f = 1 som i dag.

   f følger havets bredde i tværsnittet (spredningshastighed · tid), så
   kortet og tværsnittet altid viser det samme: f = 1, når havet er
   blevet 4 500 km bredt — ca. Atlanterhavet i dag.

   Havbunden farves efter alder. Havbund, der blev dannet, da åbningen
   var nået til g (0 ≤ g ≤ f), ligger på Afrikas side, hvor ryggen var
   dengang, og på Amerikas side er den siden drejet med Amerika:
     Afrikas side   R(−ω·g/2) · M
     Amerikas side  R(−ω·(f − g/2)) · M
   hvor M er Afrikas (og Europas) kyst, og ryggen er g = f.

   Forenklinger: Grønland følger Nordamerika, Mellemamerika og Caribien
   fades ind til sidst (de fandtes ikke, da Atlanterhavet åbnede), og
   kysterne er grove — det er et skema, ikke et kort til navigation. */

import { INK, KW } from './figur.js';

export const BREDDE_I_DAG = 4500;           // km

// ── Kuglegeometri ──────────────────────────────────────
const RAD = Math.PI / 180;
const vec = ([la, lo]) => [Math.cos(la * RAD) * Math.cos(lo * RAD), Math.cos(la * RAD) * Math.sin(lo * RAD), Math.sin(la * RAD)];
function drej(v, k, grader){
  const c = Math.cos(grader * RAD), s = Math.sin(grader * RAD);
  const d = k[0] * v[0] + k[1] * v[1] + k[2] * v[2];
  const x = [k[1] * v[2] - k[2] * v[1], k[2] * v[0] - k[0] * v[2], k[0] * v[1] - k[1] * v[0]];
  return [0, 1, 2].map(i => v[i] * c + x[i] * s + k[i] * d * (1 - c));
}

const POL = {
  syd:  { k: vec([44.0, -30.6]), w: 57.0 },
  nord: { k: vec([67.6, -13.6]), w: 75.5 }
};

// ── Kysterne i dag, [bredde, længde] ───────────────────
const SYDAMERIKA = [[9,-79.5],[11,-74],[12,-71.5],[10.5,-66],[10.7,-61.5],[8.5,-60],[6,-57],[5,-52],[1.5,-50],[-1,-48],[-2.5,-44],[-3,-40],[-5,-36.5],[-8,-35],[-13,-38.5],[-18,-39.5],[-22.5,-41.5],[-23.5,-46],[-26,-48.5],[-29,-49],[-33,-52.5],[-34.8,-56],[-36,-57],[-38.5,-57.5],[-41,-63],[-42.5,-64],[-45,-67],[-48,-66],[-51.5,-69],[-53.5,-68.5],[-55,-67],[-54.5,-71],[-52,-74.5],[-47,-75.5],[-42,-73.8],[-37,-73.5],[-30,-71.5],[-23,-70.5],[-18,-70.3],[-14,-76.3],[-9,-78.8],[-5,-81.2],[-1,-80.5],[1.5,-79],[4,-77.3],[7.5,-77.7]];
const AFRIKA = [[35.8,-5.9],[35,-2],[36.8,3],[37,10],[33.5,10.5],[32.5,15],[30.5,19],[32.5,21.5],[31.5,25],[31,32],[29.5,32.6],[22,36.8],[15.5,39.5],[12.5,43.3],[11.8,51],[10,51],[4,47.8],[-2,41],[-6,39],[-10.5,40.4],[-15,40.7],[-20,35],[-25,33],[-26,32.9],[-29.5,31.2],[-33.8,25.7],[-34.8,20],[-34.3,18.4],[-31.5,18.2],[-28.6,16.5],[-23,14.4],[-17.3,11.8],[-12.5,13.6],[-8.8,13.2],[-6,12.3],[-1,9],[1.5,9.4],[4,9.6],[4.4,7],[6.3,3],[5.8,1],[4.8,-2],[4.4,-7.5],[6.3,-10.8],[7.5,-13],[9.5,-13.7],[11.8,-15.9],[14.7,-17.5],[16,-16.5],[21,-17],[24,-15.5],[27.6,-13.2],[30,-9.8],[33.5,-7.6]];
const MADAGASKAR = [[-12,49.3],[-16,50],[-25,47],[-25.5,45],[-21,43.5],[-16,44.5]];
const EUROPA = [[36,-5.6],[37,-8.9],[38.7,-9.5],[41,-8.7],[43.2,-9.2],[43.5,-8],[43.4,-1.8],[46.2,-1.2],[47.3,-2.5],[48.5,-4.7],[48.7,-1.5],[49.7,-1.3],[49.4,0.2],[50.9,1.7],[51.4,3.5],[53.3,6],[53.9,8.7],[55.5,8.1],[57.6,10.5],[58,7],[59,5.5],[61,5],[62.5,6],[64,10],[66,12.5],[68,14.5],[69.5,18],[70.5,23],[71,26],[70,30],[69,33],[68,40],[66.5,41],[66,44],[68.5,46],[70,55],[68,60],[42,50],[41,41],[41.5,36],[41,29],[40.5,26.5],[36.7,36],[36.5,30],[37,27.3],[39.5,26.2],[40.8,23],[39,23],[37,22.5],[38.3,21],[40,19.4],[42,19],[44,15.2],[45.7,13.7],[44.4,12.3],[41.9,15.8],[40,18.5],[38,16],[38.2,15.6],[40,15.5],[41.3,13],[42.4,11.2],[44,9.5],[43.5,7],[43.2,5],[43.3,3.4],[41.5,3.1],[40,0],[38.5,0],[36.7,-2],[36.7,-4.4]];
const STORBRITANNIEN = [[50.1,-5.7],[50.7,-3],[50.8,0.3],[51.3,1.4],[52.9,1.7],[53.6,0],[55,-1.4],[56,-2.6],[57.6,-1.8],[58.6,-3],[58.5,-5],[57,-6],[55.5,-5],[54.5,-3.3],[53.3,-3],[53.4,-4.5],[52.1,-4.2],[51.6,-5.1],[51.3,-3.1]];
const IRLAND = [[51.5,-9.8],[52.2,-6.4],[54,-6],[55.3,-7.3],[54.6,-8.6],[53.5,-10.1]];
const NORDAMERIKA = [[18.2,-103.5],[20.5,-105.5],[23,-106.5],[23,-110],[28,-114.5],[32.5,-117.1],[34.5,-120.5],[38,-123],[40.4,-124.4],[46,-124],[48.4,-124.7],[51,-128],[54.5,-130.5],[58,-136],[59.8,-144],[60,-150],[57,-157],[55,-164],[58.5,-158],[60,-162],[64,-165],[66,-166],[68.5,-166],[70.5,-160],[71.3,-156],[70,-143],[69.5,-133],[69.8,-125],[68,-115],[68,-108],[68.5,-98],[67,-95],[69,-90],[66,-85],[64,-88],[60,-94.5],[57,-92.5],[55,-82.5],[51.5,-79.5],[55,-77],[58.5,-78],[62,-78],[60,-70],[58.5,-68],[60.3,-64.5],[55,-60],[52.3,-55.7],[49.5,-53.5],[47.5,-52.7],[47,-55],[47.5,-59.3],[46,-61],[45,-61],[44.5,-63.5],[43.5,-66],[44.9,-67],[43.7,-70],[42,-70.5],[41.5,-71],[40.5,-74],[38.9,-74.9],[37,-76],[35.2,-75.5],[33.8,-78],[32,-81],[30.5,-81.4],[27,-80],[25.3,-80.4],[25.9,-81.7],[27.8,-82.7],[29.9,-84.3],[30.4,-87.5],[29.2,-89.2],[29.7,-93.5],[28,-97],[25.5,-97.2],[22,-97.8],[18.5,-95.5]];
const MELLEMAMERIKA = [[18.5,-95.5],[18.7,-91.5],[21.3,-90],[21.5,-87],[18.5,-88],[16,-88.5],[15.8,-86],[15,-83.4],[11,-83.7],[9.3,-79.9],[9,-79.5],[7.5,-77.7],[8.5,-82],[9.6,-84.7],[11,-85.7],[13,-87.5],[16,-95],[18.2,-103.5]];
const CUBA = [[23,-84],[23.2,-80.5],[22,-77.5],[20,-74.2],[19.9,-77.7],[21.5,-79.5],[21.9,-83.9]];
const GROENLAND = [[60,-43],[61,-48],[64,-52],[68,-53.5],[70.5,-54],[72.8,-56],[76,-66],[78,-73],[80,-67],[82,-60],[83.5,-35],[82,-22],[80,-17],[77,-18.5],[74,-20],[71,-22],[70,-25.5],[68.3,-30],[66,-37],[65.5,-39.5],[62.5,-42]];

// Afrikas og Europas atlantiske kyst — ryggen og isokronerne bygges ud fra den
const KYST_SYD = [[-38,19.5],[-34.8,19],[-34.3,18.4],[-31.5,18.2],[-28.6,16.5],[-23,14.4],[-17.3,11.8],[-12.5,13.6],[-8.8,13.2],[-6,12.3],[-1,9],[1.5,9.4],[4,9.6],[4.4,7],[6.3,3],[5.8,1],[4.8,-2],[4.4,-7.5],[6.3,-10.8],[7.5,-13],[9.5,-13.7],[11.8,-15.9],[14.7,-17.5]];
const KYST_NORD = [[9.5,-13.7],[11.8,-15.9],[14.7,-17.5],[16,-16.5],[21,-17],[24,-15.5],[27.6,-13.2],[30,-9.8],[33.5,-7.6],[35.8,-6.2],[37,-8.9],[38.7,-9.5],[41,-8.7],[43.2,-9.2],[47,-9.5],[48.5,-5.5],[51.5,-10.2],[55,-8.8],[58.5,-6.5],[61,4.5],[62.5,5.5],[66,12],[70,18],[72,24]];

const V = pts => pts.map(vec);
const FAST = [V(AFRIKA), V(MADAGASKAR), V(EUROPA), V(STORBRITANNIEN), V(IRLAND)];
const VEST = [
  { navn: 'SYDAMERIKA', pol: 'syd', pkt: V(SYDAMERIKA), midt: vec([-12, -56]) },
  { navn: 'NORDAMERIKA', pol: 'nord', pkt: V(NORDAMERIKA), midt: vec([42, -98]) },
  { pol: 'nord', pkt: V(GROENLAND) },
  { pol: 'nord', pkt: V(MELLEMAMERIKA), sen: true },
  { pol: 'nord', pkt: V(CUBA), sen: true }
];
const M = { syd: V(KYST_SYD), nord: V(KYST_NORD) };

// ── Projektion: en globus set fra over Atlanterhavet ───
const CX = KW / 2, CY = 232, R = 166;
const C0 = vec([12, -30]);
const OEST = (() => { const e = [-Math.sin(-30 * RAD), Math.cos(-30 * RAD), 0]; return e; })();
const NORD = [C0[1] * OEST[2] - C0[2] * OEST[1], C0[2] * OEST[0] - C0[0] * OEST[2], C0[0] * OEST[1] - C0[1] * OEST[0]];
const prik = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
// Punkter på bagsiden lægges ud på randen, så figurerne klippes pænt
function proj(v){
  let x = prik(v, OEST), y = prik(v, NORD);
  if (prik(v, C0) < 0){ const h = Math.hypot(x, y) || 1; x /= h; y /= h; }
  return [CX + R * x, CY - R * y];
}

function sti(c, vs, luk = true){
  c.beginPath();
  vs.forEach((v, i) => { const [x, y] = proj(v); i ? c.lineTo(x, y) : c.moveTo(x, y); });
  if (luk) c.closePath();
}

// Havbundens alder: 20 mio. år pr. farve, ung (rød) til gammel (lilla)
export const ALDERSFARVER = ['#E8336D', '#FF6A3D', '#FFB300', '#C9D85B', '#5FB030', '#0FA593', '#0E86C8', '#3F5FC8', '#7A4FD6', '#5B3A9E'];
const aldersfarve = a => ALDERSFARVER[Math.min(ALDERSFARVER.length - 1, Math.floor(a / 20))];

// Ryggens position lige nu: u (0–1) langs ryggen fra syd til nord
export function rygPunkt(u, f){
  const alle = [...M.syd.map(v => ['syd', v]), ...M.nord.map(v => ['nord', v])];
  const i = Math.min(alle.length - 1, Math.floor(u * alle.length));
  const [p, v] = alle[i];
  return drej(v, POL[p].k, -POL[p].w * f / 2);
}

/* Tegner globussen. o = { f, t (mio. år), maalX (km), skaelv: [{u, alder, d}] }
   Snitlinjen ligger på tværs af ryggen i Sydatlanten. */
export function tegn(c, o){
  const { f, t } = o;
  c.save();
  // havet og gradnettet
  c.beginPath(); c.arc(CX, CY, R, 0, 2 * Math.PI);
  c.fillStyle = '#9DD2EE'; c.fill();
  c.save(); c.clip();
  c.strokeStyle = 'rgba(23,33,31,.14)'; c.lineWidth = 1;
  for (let lo = -180; lo < 180; lo += 30){
    const p = []; for (let la = -90; la <= 90; la += 5) p.push(vec([la, lo]));
    if (p.some(v => prik(v, C0) > 0)){ c.beginPath(); p.filter(v => prik(v, C0) > 0).forEach((v, i) => { const [x, y] = proj(v); i ? c.lineTo(x, y) : c.moveTo(x, y); }); c.stroke(); }
  }
  for (let la = -60; la <= 60; la += 30){
    const p = []; for (let lo = -180; lo <= 180; lo += 5) p.push(vec([la, lo]));
    c.beginPath(); let ny = true;
    for (const v of p){ if (prik(v, C0) <= 0){ ny = true; continue; } const [x, y] = proj(v); ny ? c.moveTo(x, y) : c.lineTo(x, y); ny = false; }
    c.stroke();
  }

  // havbunden: bånd efter alder mellem isokronerne
  if (f > 0.001 && t > 0){
    const g = a => f * (1 - a / t);                     // alder → hvor langt åbningen var nået
    for (const pol of ['syd', 'nord']){
      const { k, w } = POL[pol], m = M[pol];
      const afr = gg => m.map(v => drej(v, k, -w * gg / 2));
      const ame = gg => m.map(v => drej(v, k, -w * (f - gg / 2)));
      for (let a0 = 0; a0 < t; a0 += 20){
        const a1 = Math.min(t, a0 + 20);
        c.fillStyle = aldersfarve(a0);
        for (const side of [afr, ame]){
          const ung = side(g(a0)), gammel = side(g(a1));
          c.beginPath();
          [...ung, ...gammel.reverse()].forEach((v, i) => { const [x, y] = proj(v); i ? c.lineTo(x, y) : c.moveTo(x, y); });
          c.closePath(); c.fill();
        }
      }
    }
  }

  // kontinenterne
  c.lineWidth = 1.4; c.strokeStyle = INK; c.lineJoin = 'round';
  c.fillStyle = '#D9B892';
  for (const p of FAST){ sti(c, p); c.fill(); c.stroke(); }
  for (const k of VEST){
    const { k: pol, w } = POL[k.pol];
    const vs = k.pkt.map(v => drej(v, pol, w * (1 - f)));
    c.globalAlpha = k.sen ? Math.max(0, Math.min(1, (f - 0.7) / 0.25)) : 1;
    if (c.globalAlpha > 0){ sti(c, vs); c.fill(); c.stroke(); }
    c.globalAlpha = 1;
  }

  // ryggen
  c.strokeStyle = '#C21F4B'; c.lineWidth = 2.4;
  if (f > 0.001){
    for (const pol of ['syd', 'nord']){
      const { k, w } = POL[pol];
      sti(c, M[pol].map(v => drej(v, k, -w * f / 2)), false); c.stroke();
    }
  }

  // jordskælv langs ryggen
  for (const s of o.skaelv){
    const [x, y] = proj(rygPunkt(s.u, f));
    const a = Math.min(1, (6 - s.alder) / 1.5);
    c.globalAlpha = a; c.fillStyle = '#FFD23F'; c.strokeStyle = INK; c.lineWidth = 1;
    c.beginPath(); c.arc(x, y, 3, 0, 2 * Math.PI); c.fill(); c.stroke();
    c.globalAlpha = 1;
  }
  c.restore();

  // navne på kontinenterne
  c.font = "700 9px 'IBM Plex Mono', ui-monospace, monospace"; c.textAlign = 'center'; c.textBaseline = 'middle';
  const navn = (tekst, v) => {
    const [x, y] = proj(v);
    c.lineWidth = 3; c.strokeStyle = 'rgba(255,249,238,.9)'; c.strokeText(tekst, x, y);
    c.fillStyle = INK; c.fillText(tekst, x, y);
  };
  navn('AFRIKA', vec([5, 20])); navn('EUROPA', vec([50, 15]));
  for (const k of VEST) if (k.navn){ const p = POL[k.pol]; navn(k.navn, drej(k.midt, p.k, p.w * (1 - f))); }

  // snitlinjen: på tværs af ryggen i Sydatlanten (ca. 400 km til hver side)
  const midt = rygPunkt(0.3, f);
  const [la, lo] = [Math.asin(midt[2]) / RAD, Math.atan2(midt[1], midt[0]) / RAD];
  const dLo = km => km / (111.2 * Math.cos(la * RAD));
  const [xa, ya] = proj(vec([la, lo - dLo(400)])), [xb, yb] = proj(vec([la, lo + dLo(340)]));
  c.strokeStyle = INK; c.lineWidth = 2; c.setLineDash([4, 3]);
  c.beginPath(); c.moveTo(xa, ya); c.lineTo(xb, yb); c.stroke(); c.setLineDash([]);
  c.font = "800 10px 'Archivo', system-ui, sans-serif";
  for (const [x, y, t] of [[xa - 9, ya, 'A'], [xb + 9, yb, 'B']]){
    c.fillStyle = '#FFF9EE'; c.beginPath(); c.arc(x, y, 7, 0, 2 * Math.PI); c.fill(); c.stroke();
    c.fillStyle = INK; c.fillText(t, x, y + 0.5);
  }
  const [xm, ym] = proj(vec([la, lo + dLo(o.maalX)]));
  c.fillStyle = '#7A4FD6'; c.beginPath(); c.arc(xm, ym, 4, 0, 2 * Math.PI); c.fill(); c.stroke();

  // globussens rand
  c.strokeStyle = INK; c.lineWidth = 2;
  c.beginPath(); c.arc(CX, CY, R, 0, 2 * Math.PI); c.stroke();
  c.restore();
}

// Farveskalaen under globussen
export function tegnSkala(c, t, y = 452){
  const x0 = 24, b = KW - 48, n = ALDERSFARVER.length;
  c.save();
  c.font = "600 9px 'IBM Plex Mono', ui-monospace, monospace"; c.fillStyle = INK; c.textBaseline = 'alphabetic';
  c.fillText('HAVBUNDENS ALDER · mio. år', x0, y - 8);
  for (let i = 0; i < n; i++){
    c.fillStyle = ALDERSFARVER[i];
    c.globalAlpha = i * 20 < t ? 1 : 0.25;
    c.fillRect(x0 + i * b / n, y, b / n, 12);
  }
  c.globalAlpha = 1;
  c.strokeStyle = INK; c.lineWidth = 1.5; c.strokeRect(x0, y, b, 12);
  c.fillStyle = INK; c.textAlign = 'center';
  for (let a = 0; a <= 200; a += 40) c.fillText(String(a), x0 + a / 200 * b, y + 25);
  c.restore();
}
