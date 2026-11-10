import assert from 'node:assert/strict';
import {STEDER,FORMER,krav,placer,fremskridt,hentData,gemData} from './model.js';
const t=hentData(null);
assert.deepEqual(fremskridt(t),{antal:0,total:12,faerdig:false});
assert.equal(placer(t,'skov','co2').status,'forkert');
assert.equal(fremskridt(t).antal,0);
// Genbrug er afgørende: samme form skal kunne sættes på mange elementer.
for(const s of STEDER)for(const f of krav(s,'C'))assert.equal(placer(t,s.id,f).status,'rigtig');
assert.deepEqual(fremskridt(t),{antal:12,total:12,faerdig:true});
assert.equal(placer(t,'skov','organisk').status,'allerede');
assert.equal(fremskridt(t).antal,12);
assert.equal(placer(t,'hav','hco3').status,'ukendt','C må ikke godkende B-former');
t.niveau='B';
assert.deepEqual(fremskridt(t),{antal:12,total:15,faerdig:false});
assert.equal(placer(t,'hav','hco3').status,'rigtig');
assert.equal(placer(t,'flod','hco3').status,'rigtig');
assert.equal(placer(t,'hav','co3').status,'rigtig');
assert.deepEqual(fremskridt(t),{antal:15,total:15,faerdig:true});
assert.equal(placer(t,'kalksten','co3').status,'forkert','Fast kalk må ikke sidestilles med en opløst ion');
t.niveau='C';assert.equal(fremskridt(t).total,12);assert(fremskridt(t).faerdig);
t.niveau='B';const gen=hentData(JSON.parse(JSON.stringify(gemData(t))));assert.equal(gen.loest.size,15);assert(fremskridt(gen).faerdig);
assert.equal(hentData({loest:['ukendt:co2','skov:co2','skov:organisk'],niveau:'A'}).loest.size,1);
assert.equal(hentData({loest:'forkert'}).loest.size,0);
for(const s of STEDER){for(const f of krav(s,'B'))assert(FORMER[f]);assert(s.punkt[0]>=0&&s.punkt[0]<=1600&&s.punkt[1]>=0&&s.punkt[1]<=960);}
console.log('Kulstofmodel: genbrugelige former, C/B-krav, overgang med bevaret fremskridt, vand/mineral og lagring OK.');
