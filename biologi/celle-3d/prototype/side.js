const $=id=>document.getElementById(id);
const beskrivelser={
 hele:'Drej cellen og se, hvordan organellerne fortsætter ned i cellelegemet. Åbn derefter cellekernen eller mitokondrierne.',
 kerne:'Cellekernen ligger delvist nede i cytoplasmaet. Åbn snittet for at se rumligt kromatin og kernelegemet inde i kernen.',
 mito:'Mitokondrierne er bøjede, lukkede organeller. Åbn snittet for at se den indre membrans foldede cristae.',
 ruER:'Ru ER har bugtede, foldede membraner med ribosomer på den side, der vender mod cytoplasmaet.',
 glatER:'Glat ER bruger samme membranudtryk som ru ER. Her er overfladen uden ribosomer.',
 golgi:'Golgiapparatets afrundede membransække varierer i form og ligger delvist nede i cellelegemet.',
 lysosom:'Lysosomerne er små, membranomsluttede organeller inde i cellen.',
 vesikel:'Vesiklerne er små blærer med membran, som ligger i cytoplasmaet.'
};
let model;
try{
 const {skabPrototype}=await import('./model.js');model=skabPrototype($('celle'));$('indlaesning').hidden=true;
}catch(e){$('indlaesning').hidden=true;$('fallback').hidden=false;$('celle').hidden=true;document.body.dataset.grafik='fallback';for(const el of document.querySelectorAll('aside button,aside input,aside select,.vinkler button'))el.disabled=true;console.warn('3D kunne ikke startes.',e);}
if(model){
 const rolig=matchMedia('(prefers-reduced-motion: reduce)');
 let valgt='hele',kerne=0,mito=0;const animationer=new Map();
 function vælg(id){valgt=id;$('organel').value=id;$('forklaring').textContent=beskrivelser[id]||beskrivelser.hele;model.vælg(id);}
 function åbn(id){
  const mål=(id==='kerne'?kerne:mito)===1?0:1;if(id==='kerne')kerne=mål;else mito=mål;
  const b=$(id),navn=id==='kerne'?'cellekernen':'mitokondrierne';b.setAttribute('aria-pressed',String(mål===1));b.textContent=(mål?'Luk ':'Åbn ')+navn;
  const start=model.målData().åbning[id],startTid=performance.now();if(animationer.has(id))cancelAnimationFrame(animationer.get(id));
  $('status').textContent=mål?(id==='kerne'?'Snittet blotlægger kromatin og kernelegeme.':'Snittet blotlægger de foldede indre membraner.'):'Membranen er lukket igen.';
  function trin(nu){const t=rolig.matches?1:Math.min(1,(nu-startTid)/600),p=t*t*(3-2*t);model.åbn(id,start+(mål-start)*p);if(t<1)animationer.set(id,requestAnimationFrame(trin));else animationer.delete(id);}
  animationer.set(id,requestAnimationFrame(trin));
 }
 $('organel').addEventListener('change',e=>vælg(e.target.value));$('taet').addEventListener('click',()=>model.fokuser(valgt));
 $('kerne').addEventListener('click',()=>åbn('kerne'));$('mito').addEventListener('click',()=>åbn('mito'));
 $('gel').addEventListener('input',e=>model.gennemsigtighed(Number(e.target.value)));
 function nulstil(){for(const a of animationer.values())cancelAnimationFrame(a);animationer.clear();kerne=mito=0;model.nulstil();$('gel').value='45';for(const id of['kerne','mito']){$(id).setAttribute('aria-pressed','false');$(id).textContent=id==='kerne'?'Åbn cellekernen':'Åbn mitokondrierne';}vælg('hele');$('status').textContent='Udgangspunkt gendannet.';}
 $('nulstil').addEventListener('click',nulstil);document.querySelectorAll('[data-drej]').forEach(b=>b.addEventListener('click',()=>model.drej(Number(b.dataset.drej))));
 const c=$('celle');let træk=null;
 c.addEventListener('pointerdown',e=>{træk={x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY};c.setPointerCapture(e.pointerId);});
 c.addEventListener('pointermove',e=>{if(!træk)return;model.drej(-(e.clientX-træk.x)*.005,(e.clientY-træk.y)*.005);træk.x=e.clientX;træk.y=e.clientY;});
 c.addEventListener('pointerup',e=>{if(træk&&Math.hypot(e.clientX-træk.startX,e.clientY-træk.startY)<5){const id=model.ram(e.clientX,e.clientY);if(id&&beskrivelser[id])vælg(id);}træk=null;});
 c.addEventListener('pointercancel',()=>træk=null);
 c.addEventListener('wheel',e=>{e.preventDefault();model.zoom(Math.exp(e.deltaY*.001));},{passive:false});
 c.addEventListener('keydown',e=>{const d={ArrowLeft:[-.12,0],ArrowRight:[.12,0],ArrowUp:[0,.1],ArrowDown:[0,-.1]}[e.key];if(d){e.preventDefault();model.drej(...d);}if(e.key==='+'||e.key==='='){e.preventDefault();model.zoom(.9);}if(e.key==='-'){e.preventDefault();model.zoom(1.1);}if(e.key==='Home'){e.preventDefault();nulstil();}});
 new ResizeObserver(()=>model.størrelse()).observe(c);
 window.cellePrototype={tilstand:()=>model.målData()};vælg('hele');document.body.dataset.grafik='webgl';
 c.addEventListener('webglcontextlost',e=>{e.preventDefault();$('fallback').hidden=false;$('celle').hidden=true;document.body.dataset.grafik='fallback';});
}
function fokus(til){document.body.classList.toggle('fokus',til);$('fokus').setAttribute('aria-pressed',String(til));$('slut-fokus').hidden=!til;}
$('fokus').addEventListener('click',()=>fokus(!document.body.classList.contains('fokus')));document.addEventListener('keydown',e=>{if(e.key==='Escape')fokus(false);});

$('slut-fokus').addEventListener('click',()=>fokus(false));
