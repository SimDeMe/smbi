// Kør: node --test geografi/enso/model.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {nyModel, beregn, fase, effektivVind, havTilstand} from './model.mjs';

test('En uforstyrret neutraltilstand forbliver neutral', () => {
  const m=nyModel();beregn(m,120);
  assert.equal(m.temperatur,0);assert.equal(m.varme,0);assert.equal(fase(m),'Neutral');
});
test('Svagere og stærkere vind giver modsatrettede faser og havprocesser', () => {
  const varm=nyModel(.45), kold=nyModel(1.55), normal=havTilstand(nyModel());
  beregn(varm,12);beregn(kold,12);
  assert.equal(fase(varm),'El Niño');assert.equal(fase(kold),'La Niña');
  assert.ok(Math.abs(varm.temperatur+kold.temperatur)<1e-10);
  assert.ok(havTilstand(varm).østDybde>normal.østDybde);
  assert.ok(havTilstand(kold).østDybde<normal.østDybde);
  assert.ok(havTilstand(varm).opvelling<normal.opvelling);
  assert.ok(havTilstand(kold).opvelling>normal.opvelling);
});
test('Bjerknes-feedback forstærker den indledende temperaturrespons', () => {
  const med=nyModel(.7,true), uden=nyModel(.7,false);
  beregn(med,12);beregn(uden,12);
  assert.ok(med.temperatur>uden.temperatur);
  assert.ok(effektivVind(med)<med.grundvind);
  assert.equal(effektivVind(uden),uden.grundvind);
});
test('Et vindpust ophører, men havets respons fortsætter bagefter', () => {
  const m=nyModel();m.pustTil=2;beregn(m,2);
  assert.ok(m.temperatur>.5);assert.equal(m.tid,m.pustTil);
  const vedSlut=m.temperatur;beregn(m,1);assert.ok(m.temperatur>0);assert.ok(m.temperatur<vedSlut);
  beregn(m,117);assert.ok(Math.abs(m.temperatur)<.05);
});
test('Små og store kald til tidsberegningen giver samme kurve', () => {
  const stor=nyModel(.45), lille=nyModel(.45);stor.pustTil=lille.pustTil=2;
  beregn(stor,24);for(let i=0;i<240;i++)beregn(lille,.1);
  assert.ok(Math.abs(stor.temperatur-lille.temperatur)<.002);
});
test('Yderpunkter holder modellen og havets dybder endelige og fysiske', () => {
  for(const vind of [0,.45,1,1.55,1.8])for(const feedback of [true,false]) {
    const m=nyModel(vind,feedback);
    for(let år=0;år<20;år++){beregn(m,12);const h=havTilstand(m);assert.ok(Number.isFinite(m.temperatur));assert.ok(Math.abs(m.temperatur)<5);assert.ok(h.østDybde>=0&&h.østDybde<300);assert.ok(h.vestDybde>0&&h.vestDybde<300);}
  }
});
