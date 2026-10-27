import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {cropPDF,splitPDF,selectionBox,splitPlan,textPlacement} from './pdf-tools.mjs';
const require=createRequire(import.meta.url),PDFLib=require('./vendor/pdf-lib.min.js');
let checks=0;
for(const rotation of [0,90,180,270]){
 const doc=await PDFLib.PDFDocument.create(),page=doc.addPage([600,400]);
 page.setCropBox(50,40,500,320);page.setRotation(PDFLib.degrees(rotation));
 const all=selectionBox(page,[0,0,1,1]);assert.deepEqual(all,{x:50,y:40,width:500,height:320});checks++;
 const b=selectionBox(page,[0,0,.5,1]);assert.equal(b.width*b.height,500*320/2);checks++;
 const bytes=await doc.save(),cropped=await PDFLib.PDFDocument.load(await cropPDF(PDFLib,bytes,[.1,.1,.9,.9]));
 assert.equal(Math.round(cropped.getPage(0).getCropBox().width),400);checks++;
 const split=await PDFLib.PDFDocument.load(await splitPDF(PDFLib,bytes,{}));
 assert.equal(split.getPageCount(),2);assert.notDeepEqual(split.getPage(0).getCropBox(),split.getPage(1).getCropBox());checks++;
}
assert.deepEqual(splitPlan(2,{modes:{0:'right'}}).map(([n])=>n),[0,1,1]);checks++;
assert.throws(()=>splitPlan(1,{modes:{0:'skip'}}));checks++;
assert.throws(()=>splitPlan(1,{position:0}));checks++;
const p=textPlacement([2,0,0,-2,0,800],{x0:40,y0:100,x1:200,y1:140});
assert.equal(p.x,20);assert.equal(p.y,332);assert.equal(p.angle,0);checks++;
console.log(`${checks} PDF-kontroller bestået`);
