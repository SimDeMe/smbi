import assert from 'node:assert/strict';
import {VP,VS,FAKTOR,ankomst,radius,signal,stationer} from '../jordskaelvsboelger-a/fysik.mjs';
const naer=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} ≈ ${b}`);
naer(FAKTOR,8.4);
// Uafhængigt 5-12-13-referenceeksempel: 5 km på kortet og 12 km dybde.
const m=ankomst({x:3,y:4},{x:0,y:0},12);
naer(m.overflade,5);naer(m.vej,13);naer(m.p,13/6);naer(m.s,13/3.5);
naer(radius(m.s-m.p,12),5);naer(radius(30,0),252);
assert.equal(radius(1,40),null,'en bølgevej kortere end dybden er umulig');
for(const h of [0,5,20,40])for(const kilde of [{x:365,y:240},{x:220,y:170},{x:560,y:360}])for(const s of stationer){
 const m=ankomst(kilde,s,h);assert.ok(m.p<m.s);naer(radius(m.delta,h),Math.hypot(kilde.x-s.x,kilde.y-s.y));
 naer(Math.sqrt((VP*m.p)**2-h*h),m.overflade);naer(Math.sqrt((VS*m.s)**2-h*h),m.overflade);
}
assert.ok(Math.abs(signal(1,10,20))<.03,'kun støj før første ankomst');
assert.ok(Math.abs(signal(10,10,20))>.2,'P starter ved den kendte ankomst');
console.log('Fysik: referenceberegning, P/S-tider, dybde, cirkelradius og fronter bestået.');
