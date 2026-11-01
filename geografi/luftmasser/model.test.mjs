import assert from 'node:assert/strict';
import { tilstand, ligevaegt, skybase, bevaeg, omgivelser, latentVarme, uden_kondensation } from './model.mjs';
const near = (a,b,tol=1e-8) => assert.ok(Math.abs(a-b)<tol,`${a} ≠ ${b}`);
const PROFILNAVNE = ['stabil','ustabil','betinget','inversion'], LUFTNAVNE = ['toer','fugtig'];

near(skybase('toer'),1500);near(skybase('fugtig'),400);
for (const profil of PROFILNAVNE) for (const luft of LUFTNAVNE) {
 const base = skybase(luft), a=tilstand(profil,luft,0), b=tilstand(profil,luft,base), c=tilstand(profil,luft,3000);
 near(a.temperatur,22);near(a.forskel,2);near(a.volumen,1);near(a.tryk,1013.25);
 near(b.temperatur,22-.01*base);near(b.dugpunkt,b.temperatur);
 near(c.temperatur,22-.01*base-.005*(3000-base));
 assert.ok(!tilstand(profil,luft,base-1).maettet && b.maettet);
 assert.ok(c.tryk<a.tryk && c.volumen>a.volumen);
 near(c.tryk*c.volumen/(c.temperatur+273.15),1013.25/295.15);
}
// Analytisk hydrostatisk reference for konstant temperaturgradient.
const g=.004, T0=293.15;
near(tilstand('stabil','toer',3000).tryk,1013.25*((T0-g*3000)/T0)**(9.81/(287.05*g)),.001);
near(omgivelser('inversion',1000),24);
// Relativ luftfugtighed: e(10 °C)/e(22 °C) og e(18,8 °C)/e(22 °C) fra damptryktabel.
near(tilstand('stabil','toer',0).fugtighed,100*12.28/26.45,.2);
near(tilstand('stabil','fugtig',0).fugtighed,82,.5);
for (const luft of LUFTNAVNE) {
 near(tilstand('stabil',luft,skybase(luft)).fugtighed,100);near(tilstand('stabil',luft,3000).fugtighed,100);
 assert.ok(tilstand('stabil',luft,200).fugtighed>tilstand('stabil',luft,0).fugtighed);
}

// Bogens tre situationer plus inversion: ligevægtshøjder regnet i hånden.
// Tør afkøling 1,0 °C/100 m, startforskel 2 °C: z = 2 / (1,0 − gradient) · 100.
near(ligevaegt('stabil','toer'),333.33,1);near(ligevaegt('stabil','fugtig'),333.33,1);
near(ligevaegt('betinget','toer'),666.67,1);
near(ligevaegt('inversion','toer'),142.86,1);near(ligevaegt('inversion','fugtig'),142.86,1);
// Absolut ustabil: 20 − 1,1·(z/100). Ingen ligevægt for nogen af pakkerne.
near(omgivelser('ustabil',500),14.5);near(omgivelser('ustabil',3000),-13);
assert.equal(ligevaegt('ustabil','toer'),null);assert.equal(ligevaegt('ustabil','fugtig'),null);
// Håndberegnet ved 1.000 m: tør 12 °C, fugtig 15 °C, omgivelser 9 °C.
near(tilstand('ustabil','toer',1000).forskel,3);
near(tilstand('ustabil','fugtig',1000).forskel,6);
near(tilstand('ustabil','toer',3000).forskel,12.5);
near(tilstand('ustabil','fugtig',3000).forskel,18);
// Opdriften er positiv på begge sider af den tidligere laggrænse og begge skybaser.
for (const z of [0,399,400,401,499,500,501,1499,1500,1501,3000]) {
 for (const luft of LUFTNAVNE) assert.ok(tilstand('ustabil',luft,z).forskel>0);
}
assert.equal(ligevaegt('betinget','fugtig'),null);
// Latent varme: (1,0 − 0,5) °C/100 m over skybasen, intet under den.
near(latentVarme('fugtig',400),0);near(latentVarme('toer',1000),0);
near(latentVarme('fugtig',3000),13);near(latentVarme('toer',3000),7.5);
near(uden_kondensation(3000),-8);
console.log('Temperatur, dugpunkt, skybase, tryk, volumen og ligevægtshøjder: OK');

function slip(profil, luft, z=0) {
 let s={z,v:0,slut:false},maks=z;
 for(let t=0;t<6000&&!s.slut;t++){s=bevaeg(profil,luft,s.z,s.v,1);maks=Math.max(maks,s.z);}
 assert.ok(s.slut,`${profil}/${luft} faldt ikke til ro`);
 return {...s,maks};
}
// Samme varme pakke giver fire forskellige udfald, uden ydre løft.
for (const luft of LUFTNAVNE) {
 near(slip('inversion',luft).z,143,5);
 near(slip('stabil',luft).z,333,5);
}
assert.equal(slip('ustabil','toer').z,3000);assert.equal(slip('ustabil','fugtig').z,3000);
near(slip('betinget','toer').z,667,5);
assert.equal(slip('betinget','fugtig').z,3000);
// Stabil og inversion danner ingen sky, heller ikke med fugtig pakke og overshoot.
assert.ok(slip('stabil','fugtig').maks<skybase('fugtig'));
assert.ok(slip('inversion','fugtig').maks<skybase('fugtig'));
// Begge ustabile pakker når deres skybase og forlader figurens top.
for (const luft of LUFTNAVNE) assert.ok(slip('ustabil',luft).maks>skybase(luft));
// Betinget: den tørre pakke får opdrift igen, hvis den tvinges forbi 2.750 m.
near(tilstand('betinget','toer',2750).forskel,0);
assert.equal(slip('betinget','toer',2800).z,3000);
near(slip('betinget','toer',2600).z,667,5);
// I absolut ustabil luft er der ingen ekstra tærskel efter et tvunget løft.
for (const luft of LUFTNAVNE) for (const z of [500,1700,1900]) assert.equal(slip('ustabil',luft,z).z,3000);
// Tvunget op i stabil luft: pakken vender tilbage til samme ligevægt.
near(slip('stabil','toer',2800).z,333,5);
near(slip('inversion','toer',2800).z,143,5);
console.log('Fri bevægelse: inversion 143 m, stabil 333 m, betinget tør 667 m / fugtig op, absolut ustabil tør og fugtig op: OK');
