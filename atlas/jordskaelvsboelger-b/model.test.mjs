// Kør med: node atlas/jordskaelvsboelger-b/model.test.mjs
import assert from 'node:assert/strict';
import { VP, VS, K, afstandFraSP, ankomster, magnitude, amplitudeFor, seismogram, bedstePunkt, skaering } from './model.js';
import { vifte, ankomsterVed } from './jordmodel.js';

const naer = (a, b, tol, tekst) => assert.ok(Math.abs(a - b) <= tol, `${tekst}: ${a} skulle være ${b} ± ${tol}`);

// S−P-metoden
naer(K, 8.0, 1e-9, 'omregningsfaktor');
naer(VS, 3.4286, 1e-3, 'vS');
for (const d of [10, 99, 250, 480]) naer(afstandFraSP(ankomster(d).sp), d, 1e-9, `afstand ${d} km`);

// Richters tabel: −log A0 = 3,0 ved 100 km, 3,5 ved 200 km, 2,6 ved 50 km.
naer(magnitude(1, 100), 3.0, 0.01, 'Richter 100 km');
naer(magnitude(1, 200), 3.5, 0.05, 'Richter 200 km');
naer(magnitude(1, 50), 2.6, 0.06, 'Richter 50 km');
// Richters nomogram-eksempel: A = 23 mm, S−P = 24 s (ca. 210 km) giver M ≈ 5.
naer(magnitude(23, 210), 5.0, 0.2, 'Richters eksempel');
naer(magnitude(amplitudeFor(4.2, 136), 136), 4.2, 1e-9, 'magnitude ↔ amplitude');

// Det syntetiske seismogram: ingen NaN, stille før P, største udslag = Richters A.
const sg = seismogram({ d: 160, ML: 4.5, t0: 5, varighed: 80, stoej: 0.1, froe: 7 });
assert.ok(sg.data.every(Number.isFinite), 'seismogram uden NaN');
naer(sg.tP, 5 + 160 / VP, 1e-9, 'tP'); naer(sg.tS, 5 + 160 / VS, 1e-9, 'tS');
const iP = Math.floor(sg.tP / sg.dtProeve), iS = Math.floor(sg.tS / sg.dtProeve);
const maks = (a, b) => Math.max(...Array.from(sg.data.slice(a, b), Math.abs));
assert.ok(maks(iP + 25, iP + 150) > 3 * maks(0, iP - 5), 'P står tydeligt over støjen');
assert.ok(maks(iS, iS + 600) > maks(iP, iS - 5), 'S er større end P');
naer(maks(0, sg.data.length), amplitudeFor(4.5, 160), amplitudeFor(4.5, 160) * 0.25, 'største udslag');

// Cirklerne
const ep = { x: 210, y: 140 }, st = [[100, 90], [400, 120], [250, 300]];
const fund = bedstePunkt(st.map(([x, y]) => ({ x, y, r: Math.hypot(x - ep.x, y - ep.y) })));
naer(fund.x, ep.x, 0.01, 'epicenter x'); naer(fund.y, ep.y, 0.01, 'epicenter y');
assert.equal(skaering({ x: 0, y: 0, r: 5 }, { x: 8, y: 0, r: 5 }).length, 2, 'to cirkler: to punkter');

// Strålegang: gangtider sammenlignet med referencemodellerne (iasp91/ak135), og skyggezonerne.
const P = vifte({ type: 'P', taet: 0.05, flad: 0.25, trin: 12 }), S = vifte({ type: 'S', taet: 0.2, flad: 0.25, trin: 12 });
const forste = (straaler, g) => ankomsterVed(straaler, g)[0]?.tid;
for (const [g, p, s] of [[30, 371, 671], [60, 603, 1096], [90, 779, 1415]]) {
  naer(forste(P, g), p, p * 0.02, `P ved ${g}°`);
  naer(forste(S, g), s, s * 0.02, `S ved ${g}°`);
}
naer(forste(P, 179), 1212, 15, 'PKIKP ved 180°');
const lander = s => s.slut === 'overflade';
const pMaks = Math.max(...P.filter(s => lander(s) && s.navn === 'P').map(s => s.afstand));
const sMaks = Math.max(...S.filter(lander).map(s => s.afstand));
naer(pMaks, 99, 3, 'P-skyggezonens begyndelse');
naer(sMaks, 103, 3, 'S-skyggezonens begyndelse');
assert.ok(S.some(s => s.slut === 'stoppet'), 'S stopper ved kernen');
const udenKerne = vifte({ type: 'P', indreKerne: false, taet: 0.05, flad: 0.25, trin: 12 });
const pkpMin = Math.min(...udenKerne.filter(s => lander(s) && s.navn === 'PKP').map(s => s.afstand));
naer(pkpMin, 143, 3, 'P-skyggezonens slutning uden indre kerne');
assert.equal(udenKerne.filter(s => lander(s) && s.afstand > pMaks + 1 && s.afstand < pkpMin - 1).length, 0, 'tom skyggezone uden indre kerne');
assert.ok(P.some(s => lander(s) && s.navn === 'PKIKP' && s.afstand > 115 && s.afstand < 142), 'Lehmanns bølger i skyggezonen');

console.log('Alle modeltest bestået.');
