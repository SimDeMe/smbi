import assert from 'node:assert/strict';
import { europa, lavQuiz } from '../quizmodel.js';
assert.equal(europa.length,47);
assert.equal(new Set(europa.map(l=>l.id)).size,47);
for(const id of ['336','438','492','674','020','470','XKX','196','792','643']) assert(europa.some(l=>l.id===id));
const q=lavQuiz(()=>0), set=new Set();
assert.equal(q.naeste(),false);
assert.equal(q.svar(null),null);
while(!q.faerdig){
 const l=q.land; assert(!set.has(l.id));set.add(l.id);
 if(set.size===1){assert.equal(q.svar('forkert'),false);assert.equal(q.svar(l.id),true);}
 else if(set.size===2){assert.equal(q.vis(),true);assert.equal(q.vis(),false);}
 else assert.equal(q.svar(l.id),true);
 assert.equal(q.svar(l.id),null);assert.equal(q.svar('forkert'),null);
 assert.equal(q.naeste(),true);
}
assert.deepEqual(q.resultat,{antal:47,fundet:47,fejl:1,viste:1,foerste:45});
assert.equal(q.vis(),false);assert.equal(q.naeste(),false);assert.equal(q.svar('208'),null);
const a=lavQuiz(()=>0), b=lavQuiz(()=>.99999);assert.notEqual(a.land.id,b.land.id);
assert.deepEqual(b.resultat,{antal:47,fundet:0,fejl:0,viste:0,foerste:0});
console.log('Quizmodel: 47 unikke spørgsmål, blanding, fejl, hjælp, dobbelttryk og afslutning OK');
import { verdensdele } from '../quizmodel.js';
// Alle verdensdele: unikke lande, gyldige sigtepunkter og et fuldt forløb.
assert.deepEqual(verdensdele.map(d => [d.id, d.lande.length]),
  [['europa',47],['afrika',55],['nordamerika',23],['sydamerika',12],['asien',63]]);
assert.equal(verdensdele[0].lande, europa);
for (const del of verdensdele) {
  assert.equal(new Set(del.lande.map(l => l.id)).size, del.lande.length, del.id);
  assert.equal(new Set(del.lande.map(l => l.navn)).size, del.lande.length, del.id);
  for (const l of del.lande) assert(Math.abs(l.punkt[0]) <= 180 && Math.abs(l.punkt[1]) <= 90, l.navn);
  for (const k of ['navn','knap','quiznavn','kort','data','afgraensning']) assert(del[k], del.id + k);
  const q = lavQuiz(Math.random, del.lande), set = new Set();
  while (!q.faerdig) { set.add(q.land.id); assert.equal(q.svar(q.land.id), true); q.naeste(); }
  assert.equal(set.size, del.lande.length);
  assert.deepEqual(q.resultat, { antal: del.lande.length, fundet: del.lande.length, fejl: 0, viste: 0, foerste: del.lande.length });
}
// Rusland og Tyrkiet er med i både Europa og Asien; Cypern kun i Europa.
const asien = verdensdele.find(d => d.id === 'asien').lande;
for (const id of ['643','792','275','158','036','554','798']) assert(asien.some(l => l.id === id), id);
assert(!asien.some(l => l.id === '196'));
console.log('Quizmodel: alle verdensdele med unikke lande og fulde forløb OK');
