import assert from 'node:assert/strict';
import {LAG,PULJER,PROCESSER,FORBINDELSER,hentData,gemData} from './model.js';
import {KULSTOFFIGUR} from './puljer.js';
import {HOEJDE} from './landskab.js';
assert.deepEqual(LAG.map(l=>l.ord.length),[10,5,6]);
assert.equal(new Set(LAG.flatMap(l=>l.ord)).size,21);
assert(LAG[2].ord.includes('forvitring'));assert(LAG[2].ord.includes('fossil'));
assert.deepEqual([...hentData({version:3,puljer:['hav','kul','ukendt'],loest:['skov:organisk']}).loest],['hav','kul']);
const ugyldig=hentData({version:4,lag:2,loest:['hav','fossil','ukendt']});assert.equal(ugyldig.lag,0);assert.deepEqual([...ugyldig.loest],['hav']);
const delvis=hentData({version:4,lag:1,loest:[...LAG[0].ord,'foto']});assert.equal(delvis.lag,1);assert.equal(delvis.loest.size,11);
const igen=hentData(gemData(delvis));assert.deepEqual([...igen.loest],[...delvis.loest]);assert.equal(igen.lag,1);
assert.equal(hentData({version:4,loest:'forkert'}).loest.size,0);
for(const p of KULSTOFFIGUR.pladser){assert(p.x>=170&&p.x<=1568-170);assert(p.y>=24&&p.y<=HOEJDE-24);}
for(const p of PROCESSER){assert(FORBINDELSER[p.id].length);assert(p.tekst.length>60);assert(LAG[p.lag].ord.includes(p.id));}
assert.equal(KULSTOFFIGUR.pladser.length,PULJER.length+PROCESSER.length);
console.log('Kulstofmodel: tre lag, 10/5/6 ord, procesdata, migration og gyldig lagvis lagring OK.');
