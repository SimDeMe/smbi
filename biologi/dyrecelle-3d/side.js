// Betjening af siden: valg, åbning af organeller, synlighed, etiketter,
// drejning, zoom, tastatur og fokusvisning. 3D-modellen ligger i model.js.
import {ORGANELLER,HELE} from './tekster.js';
const $=id=>document.getElementById(id);
const rolig=matchMedia('(prefers-reduced-motion: reduce)');
let model=null;
try{
 const {skabCelle}=await import('./model.js');model=skabCelle($('celle'));$('indlaesning').hidden=true;
}catch(e){
 $('indlaesning').hidden=true;$('fallback').hidden=false;$('celle').hidden=true;document.body.dataset.grafik='fallback';
 for(const el of document.querySelectorAll('aside button,aside input,aside select,.figur-bund button'))el.disabled=true;
 console.warn('3D kunne ikke startes.',e);
}
if(model){
 const tekster=Object.fromEntries(ORGANELLER.map(o=>[o.id,o]));
 const åbne={kerne:0,mito:0},animationer=new Map();let valgt=null;
 // Etiketter med pegestreger, som følger 3D-ankrene.
 const navne=$('navne'),svg=navne.querySelector('svg'),etiketter=[];
 for(const o of ORGANELLER){
  const el=document.createElement('button');el.type='button';el.className='etiket';el.textContent=o.navn;el.dataset.id=o.id;navne.appendChild(el);
  const linje=document.createElementNS('http://www.w3.org/2000/svg','line');svg.appendChild(linje);
  const prik=document.createElementNS('http://www.w3.org/2000/svg','circle');prik.setAttribute('r','3');svg.appendChild(prik);
  const anker=model.ankre[o.id],r=o.retning,n=Math.hypot(...r);
  etiketter.push({o,el,linje,prik,anker,pos:{x:anker.x+r[0]/n*o.afstand,y:anker.y+r[1]/n*o.afstand,z:anker.z+r[2]/n*o.afstand}});
  el.addEventListener('click',()=>vælg(o.id));
 }
 function tegnNavne(){
  const til=$('vis-navne').checked;navne.classList.toggle('skjult',!til);if(!til)return;
  const synlig=model.målData().grupper;
  for(const e of etiketter){
   const vis=synlig[e.o.id]?.synlig!==false;e.el.hidden=!vis;e.linje.style.display=e.prik.style.display=vis?'':'none';if(!vis)continue;
   const a=model.projicer(e.anker),p=model.projicer(e.pos),W=navne.clientWidth,H=navne.clientHeight;
   p.x=Math.min(W-e.el.offsetWidth+4,Math.max(8,p.x));p.y=Math.min(H-40,Math.max(36,p.y));
   e.el.style.transform=`translate(${p.x.toFixed(1)}px,${p.y.toFixed(1)}px)`;
   e.linje.setAttribute('x1',a.x);e.linje.setAttribute('y1',a.y);e.linje.setAttribute('x2',p.x);e.linje.setAttribute('y2',p.y);
   e.prik.setAttribute('cx',a.x);e.prik.setAttribute('cy',a.y);
   e.el.classList.toggle('valgt',e.o.id===valgt);
  }
 }
 model.efterTegn=tegnNavne;
 function vælg(id){
  valgt=id&&tekster[id]?id:null;$('organel').value=valgt||'hele';
  $('forklaring').textContent=valgt?tekster[valgt].tekst:HELE;$('overskrift').textContent=valgt?tekster[valgt].navn:'Dyrecellen';
  $('taet').disabled=!valgt;model.vælg(valgt);
 }
 function åbn(id,mål=åbne[id]<.5?1:0){
  åbne[id]=mål;const b=$('aabn-'+id),navn=id==='kerne'?'cellekernen':'mitokondrierne';
  b.setAttribute('aria-pressed',String(mål===1));b.textContent=(mål?'Luk ':'Åbn ')+navn;
  $('status').textContent=mål?(id==='kerne'?'Kernehylsterets låg er løftet af: to membraner med porer, kromatin og kernelegeme.':'Mitokondriernes låg er løftet af: den indre membran folder sig ind som cristae.'):'Membranen er lukket igen.';
  const start=model.målData().åbning[id],t0=performance.now();if(animationer.has(id))cancelAnimationFrame(animationer.get(id));
  const trin=nu=>{const t=rolig.matches?1:Math.min(1,(nu-t0)/700),p=t*t*(3-2*t);model.åbn(id,start+(mål-start)*p);if(t<1)animationer.set(id,requestAnimationFrame(trin));else animationer.delete(id);};
  animationer.set(id,requestAnimationFrame(trin));
 }
 document.querySelectorAll('[data-vis]').forEach(el=>el.addEventListener('change',()=>model.vis(el.dataset.vis,el.checked)));
 $('vis-navne').addEventListener('change',()=>model.tegn());
 $('organel').addEventListener('change',e=>vælg(e.target.value==='hele'?null:e.target.value));
 $('taet').addEventListener('click',()=>model.fokuser(valgt));
 $('hele').addEventListener('click',()=>model.fokuser(null));
 $('aabn-kerne').addEventListener('click',()=>åbn('kerne'));$('aabn-mito').addEventListener('click',()=>åbn('mito'));
 function nulstil(){
  for(const a of animationer.values())cancelAnimationFrame(a);animationer.clear();
  model.nulstil();document.querySelectorAll('[data-vis]').forEach(el=>el.checked=true);
  for(const id of ['kerne','mito']){åbne[id]=0;const b=$('aabn-'+id);b.setAttribute('aria-pressed','false');b.textContent=id==='kerne'?'Åbn cellekernen':'Åbn mitokondrierne';}
  vælg(null);$('status').textContent='Udgangspunkt gendannet.';
 }
 $('nulstil').addEventListener('click',nulstil);
 document.querySelectorAll('[data-drej]').forEach(b=>b.addEventListener('click',()=>model.drej(Number(b.dataset.drej))));
 // Mus, touch og tastatur på selve figuren.
 const c=$('celle'),pegere=new Map();let sidsteAfstand=0,træk=null;
 c.addEventListener('pointerdown',e=>{pegere.set(e.pointerId,{x:e.clientX,y:e.clientY});c.setPointerCapture(e.pointerId);if(pegere.size===1)træk={x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY};else træk=null;});
 c.addEventListener('pointermove',e=>{
  if(!pegere.has(e.pointerId))return;pegere.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(pegere.size===2){const [a,b]=[...pegere.values()],d=Math.hypot(a.x-b.x,a.y-b.y);if(sidsteAfstand)model.zoom(sidsteAfstand/d);sidsteAfstand=d;return;}
  if(!træk)return;model.drej(-(e.clientX-træk.x)*.005,(e.clientY-træk.y)*.005);træk.x=e.clientX;træk.y=e.clientY;
 });
 const slip=e=>{pegere.delete(e.pointerId);sidsteAfstand=0;if(træk&&e.type==='pointerup'&&Math.hypot(e.clientX-træk.startX,e.clientY-træk.startY)<5){const id=model.ram(e.clientX,e.clientY);vælg(id);}træk=null;};
 c.addEventListener('pointerup',slip);c.addEventListener('pointercancel',slip);
 c.addEventListener('dblclick',e=>{const id=model.ram(e.clientX,e.clientY);if(id){vælg(id);model.fokuser(id);}});
 c.addEventListener('wheel',e=>{e.preventDefault();model.zoom(Math.exp(e.deltaY*.001));},{passive:false});
 c.addEventListener('keydown',e=>{
  const d={ArrowLeft:[-.12,0],ArrowRight:[.12,0],ArrowUp:[0,.1],ArrowDown:[0,-.1]}[e.key];
  if(d){e.preventDefault();model.drej(...d);}
  if(e.key==='+'||e.key==='='){e.preventDefault();model.zoom(.9);}
  if(e.key==='-'){e.preventDefault();model.zoom(1.1);}
  if(e.key==='Home'){e.preventDefault();nulstil();}
 });
 new ResizeObserver(()=>model.størrelse()).observe(c);
 c.addEventListener('webglcontextlost',e=>{e.preventDefault();$('fallback').hidden=false;c.hidden=true;document.body.dataset.grafik='fallback';});
 window.dyrecelle={tilstand:()=>model.målData(),åbn:(id,v)=>model.åbn(id,v),vælg,model};
 vælg(null);document.body.dataset.grafik='webgl';
}
function fokus(til){document.body.classList.toggle('fokus',til);$('fokus').setAttribute('aria-pressed',String(til));$('slut-fokus').hidden=!til;if(model)requestAnimationFrame(()=>model.størrelse());}
$('fokus').addEventListener('click',()=>fokus(!document.body.classList.contains('fokus')));
$('slut-fokus').addEventListener('click',()=>fokus(false));
document.addEventListener('keydown',e=>{if(e.key==='Escape')fokus(false);});
