import assert from 'node:assert/strict';
import { DOEGN, AAR, periodisk, tilstand } from './model.mjs';

const doegn = periodisk(DOEGN), aar = periodisk(AAR);

// Periodisk løsning: slut = start.
for (const s of [doegn, aar]) {
  assert.ok(Math.abs(s.land[0] - s.land.at(-1)) < 1e-3);
  assert.ok(Math.abs(s.hav[0] - s.hav.at(-1)) < 1e-3);
}

// Uafhængig kontrol: ved konstant sol er ligevægten Tb + F·S for begge,
// uanset varmekapacitet.
const konstant = periodisk({ ...DOEGN, sol: () => 0.7 }, 60);
assert.ok(Math.abs(konstant.land[100] - (12 + 20 * 0.7)) < 1e-6);
assert.ok(Math.abs(konstant.hav[100] - (12 + 20 * 0.7)) < 1e-3);

// Samme tilførsel og afkøling: døgnmiddel er ens for land og hav,
// men land svinger langt mere.
const middel = a => a.slice(0, -1).reduce((x, y) => x + y) / (a.length - 1);
const udsving = a => Math.max(...a) - Math.min(...a);
assert.ok(Math.abs(middel(doegn.land) - middel(doegn.hav)) < 0.01);
assert.ok(udsving(doegn.land) > 10 * udsving(doegn.hav));
assert.ok(udsving(doegn.land) > 12 && udsving(doegn.land) < 18);

// Søbrise om eftermiddagen, landbrise om natten; landbrisen er svagere.
const kl = h => tilstand(doegn, (h - 6 + 24) % 24);
assert.ok(kl(14).vind > 0.9 && kl(14).land > kl(14).hav);
assert.ok(kl(4).vind < -0.4 && kl(4).land < kl(4).hav);
assert.ok(Math.abs(kl(4).vind) < kl(14).vind);
// Vinden vender midt på formiddagen og om aftenen.
assert.ok(kl(9).vind < 0 && kl(11).vind > 0);
assert.ok(kl(19).vind > 0 && kl(21).vind < 0);
// Land er varmest om eftermiddagen, ikke ved middag (faseforsinkelse).
let maksT = 0, maksTid = 0;
for (let t = 0; t < 24; t += 0.05) { const v = tilstand(doegn, t).land; if (v > maksT) { maksT = v; maksTid = t; } }
assert.ok(maksTid + 6 > 13.5 && maksTid + 6 < 16);

// Monsun: land varmere end hav om sommeren, koldere om vinteren.
assert.ok(tilstand(aar, 6.5).vind > 0.7);
assert.ok(tilstand(aar, 0.5).vind < -0.7);
assert.ok(tilstand(aar, 12).vind < 0);
console.log('Model: periodisk løsning, ligevægt, ens middel, søbrise/landbrise og monsunens fortegn OK.');

// Graf-opgavernes facitintervaller skal passe med modellen.
const { OPGAVER } = await import('./opgavedata.js');
const [varmest, landbrise, vinter] = OPGAVER.filter(o => o.type === 'tid');
let topTid = 0, top = -Infinity;
for (let t = 0; t < 24; t += 0.01) { const v = tilstand(doegn, t).land; if (v > top) { top = v; topTid = t; } }
assert.ok(varmest.rigtig.some(([a, b]) => topTid >= a && topTid <= b), 'landets maksimum ligger i facit');
for (const [o, serie, periode] of [[landbrise, doegn, 24], [vinter, aar, 12]])
  for (const [a, b] of o.rigtig)
    for (let t = a; t <= b; t += 0.05) assert.ok(tilstand(serie, Math.min(t, periode - 1e-6)).vind < 0, `${o.spm} ved ${t}`);
console.log('Opgaver: graf-facit passer med modellens maksimum og fortegn OK.');
