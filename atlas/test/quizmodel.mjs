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
