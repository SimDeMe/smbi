// Bevar Byg-motorens fagord og lag; tegn dyrecellen og plantecellen med de fælles 3D-modeller.
// Delene har deres farver fra starten, også før ordet sidder (ikke grå som i 2D).
const NAVN={dyr:'dyrecellen',plante:'plantecellen'};
export async function tilføj3D() {
 const svg=document.getElementById('figur');
 if(!kanWebGL())return;
 const NS='http://www.w3.org/2000/svg';
 const aktiv=()=>window.bygFiguren?.aktiv();
 const aktivId=()=>{const id=aktiv()?.fig.id;return id in NAVN?id:null;};
 // id → {status:'henter'|'klar'|'fejl', model, rotation}
 const celler={};
 let modul=null;
 // Mens en 3D-celle hentes, skjules 2D-tegningen, så cellen starter som 3D.
 // Fejler WebGL eller modellen, kommer 2D-tegningen frem igen.
 const henter=document.createElement('p');henter.className='celle-3d-henter';henter.setAttribute('role','status');
 svg.parentElement.append(henter);
 const værktøjer=document.createElement('div');værktøjer.className='celle-vinkler';værktøjer.hidden=true;
 værktøjer.innerHTML='<span>3D-cellesnit</span><button type="button" data-drej="-.15" aria-label="Drej cellen mod venstre">↶</button><button type="button" data-drej=".15" aria-label="Drej cellen mod højre">↷</button><button type="button" data-drej="0">Nulstil vinkel</button>';
 svg.parentElement.prepend(værktøjer);
 let signatur='',senesteBillede='',lys=null;

 async function hent(id){
  const c=celler[id]={status:'henter',model:null,rotation:0};
  try{modul??=await import('./model.js');c.model=await modul.skabCelle(id);c.status='klar';}
  catch(e){c.status='fejl';console.warn(`3D er ikke tilgængelig; ${NAVN[id]} vises som SVG.`,e);}
  const m=window.bygFiguren.motorer()[id];
  if(c.status==='klar'&&m){
   // Funktionsopgaven: klik rammer delen i 3D-modellen (motoren spørger figuren) …
   m.fig.vaelgVed=(x,y)=>svg.classList.contains('celle-i-3d')&&aktiv()===m?c.model.vælg(x,y):undefined;
   // … og den del, musen peger på, lyser op.
   m.fig.lysOp=ord=>{if(ord===lys)return;lys=ord;opdater();};
   retAnkre(m,c.model);
  }
  signatur='';
  if(aktiv()===m)m.tegnFigur();
  opdater();
 }
 function retAnkre(m,model){const a=model.ankre();for(const p of m.fig.pladser){if(a[p.ord])p.maal=a[p.ord];if(model.pladser[p.ord])[p.x,p.y]=model.pladser[p.ord];}}

 function opdater(){
  const m=aktiv();if(!m)return;
  const id=aktivId(),c=id&&celler[id];
  if(id&&!c){hent(id);return;}
  const venter=c?.status==='henter';
  svg.classList.toggle('celle-venter',!!venter);henter.hidden=!venter;
  if(venter)henter.textContent=`Henter ${NAVN[id]} i 3D …`;
  const i3D=c?.status==='klar';
  værktøjer.hidden=!i3D;svg.classList.toggle('celle-i-3d',!!i3D);
  if(i3D)værktøjer.setAttribute('aria-label',`Drej ${NAVN[id]} i 3D`);
  if(!i3D){signatur='';return;}
  const model=c.model;
  const s=[id,m.lag,m.svaer,[...m.loest].sort().join(','),m.hintPlads,c.rotation,lys].join('|');
  if(s===signatur&&svg.querySelector('.celle-3d-billede'))return;
  if(s!==signatur){signatur=s;const synlige=model.alleSynlige?new Set(model.fagord):new Set(m.fig.lag.flatMap((l,i)=>m.synlig(i)?l.ord:[]));model.tegn({rotation:c.rotation,synlige,farver:new Set(model.fagord),fremhæv:m.hintPlads===null?null:m.fig.pladser[m.hintPlads]?.ord,lys});senesteBillede=model.lærred.toDataURL();}
  let image=svg.querySelector('.celle-3d-billede');if(!image){image=document.createElementNS(NS,'image');image.setAttribute('class','celle-3d-billede');image.setAttribute('width','1000');image.setAttribute('height','640');image.setAttribute('pointer-events','none');svg.prepend(image);}image.setAttribute('href',senesteBillede);svg.dataset.celle3d='klar';
  // gløden: en lysende kant om den del, musen peger på, lagt oven på billedet
  let glød=svg.querySelector('.celle-3d-glød');
  if(lys){if(!glød){glød=document.createElementNS(NS,'image');glød.setAttribute('class','celle-3d-glød');glød.setAttribute('width','1000');glød.setAttribute('height','640');glød.setAttribute('pointer-events','none');glød.setAttribute('filter','url(#celle-glød)');}
   if(!svg.querySelector('#celle-glød'))svg.insertAdjacentHTML('afterbegin',GLØD);
   if(glød.dataset.ord!==lys+'|'+s){glød.dataset.ord=lys+'|'+s;glød.setAttribute('href',model.maske(lys));}
   image.after(glød);}
  else if(glød)glød.remove();
 }
 værktøjer.addEventListener('click',e=>{const b=e.target.closest('[data-drej]');const id=aktivId(),c=id&&celler[id];if(!b||c?.status!=='klar')return;
  c.rotation=b.dataset.drej==='0'?0:Math.max(-.5,Math.min(.5,c.rotation+Number(b.dataset.drej)));c.model.tegn({rotation:c.rotation});const m=aktiv();retAnkre(m,c.model);m.tegnFigur();opdater();});
 new MutationObserver(opdater).observe(svg,{childList:true});
 opdater();
}
// Lysende kant: delen udvides lidt, delen selv skæres fra, og ringen sløres gul.
const GLØD='<defs><filter id="celle-glød" x="-5%" y="-5%" width="110%" height="110%">'
 +'<feMorphology in="SourceAlpha" operator="dilate" radius="3" result="ud"/>'
 +'<feComposite in="ud" in2="SourceAlpha" operator="out" result="ring"/>'
 +'<feGaussianBlur in="ring" stdDeviation="2.2" result="sløret"/>'
 +'<feFlood flood-color="#FFC400"/><feComposite in2="sløret" operator="in" result="gul"/>'
 +'<feMerge><feMergeNode in="gul"/><feMergeNode in="gul"/><feMergeNode in="gul"/></feMerge></filter></defs>';
function kanWebGL(){try{const c=document.createElement('canvas');return !!(c.getContext('webgl2')||c.getContext('webgl'));}catch{return false;}}
