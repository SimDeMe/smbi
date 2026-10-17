import assert from 'node:assert/strict';
import {itk,wind,advance} from './model.js';
const state={month:7.5,rotation:1,continents:false};
// Directional checks use the ideal equinox ITK at 0°, independent of the renderer.
const equinox={...state,month:7.5-12/(2*Math.PI)*Math.acos(-2/3)};
for(const [lat,u,v] of [[15,-1,-1],[-15,-1,1],[45,1,1],[-45,1,-1],[75,-1,-1],[-75,-1,1]]){
 const flow=wind(0,lat,equinox);assert.equal(Math.sign(flow.u),u,`east/west at ${lat}`);assert.equal(Math.sign(flow.v),v,`north/south at ${lat}`);
}
assert.equal(wind(0,0,state).u,0,'zero Coriolis at equator');
assert.ok(Math.abs(itk(0,7.5,false)-10)<1e-9);
assert.ok(Math.abs(itk(0,1.5,false)+2)<1e-9);
assert.ok(itk(80,7,true)>20&&itk(80,7,true)<26,'summer ITK over India');
assert.ok(itk(80,1,true)<-5&&itk(80,1,true)>-11,'winter ITK in Indian Ocean');
assert.ok(itk(135,1,true)<-10,'southern summer Australia');
assert.ok(itk(22,1,true)<-10,'southern summer Africa');
assert.ok(Math.abs(itk(-130,7,true)-itk(-130,1,true))<13,'ocean excursion smaller');
const monsoon=wind(73,19,{...state,month:7,continents:true});assert.ok(monsoon.u>0&&monsoon.v>0,'SW monsoon towards NE');
const winter=wind(73,19,{...state,month:1,continents:true});assert.ok(winter.u<0&&winter.v<0,'NE winter monsoon towards SW');
for(const lat of [-75,-45,-15,15,45,75]){const w=wind(0,lat,{...equinox,rotation:0});assert.equal(w.u,0);assert.equal(Math.sign(w.v),-Math.sign(lat),'nonrotating air flows equatorward');}
const wrapped=advance([179,45],equinox,10);assert.ok(wrapped[0]>=-180&&wrapped[0]<=180);
console.log('Model: wind directions, Coriolis, six belts, ITK seasons, monsoon and nonrotating Earth passed.');
