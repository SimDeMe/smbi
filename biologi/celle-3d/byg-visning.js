// Bevar Byg-motorens fagord og lag; tegn cellen med den fælles 3D-model.
export async function tilføj3D() {
 const svg=document.getElementById('figur');
 let model;
 let pladser={};
 // Mens 3D-modellen hentes, skjules den gamle 2D-tegning, så dyrecellen starter som 3D.
 // Fejler WebGL eller modellen, kommer 2D-tegningen frem igen.
 const henter=document.createElement('p');henter.className='celle-3d-henter';henter.setAttribute('role','status');henter.textContent='Henter 3D-cellen …';
 const vent=()=>{const dyr=window.bygFiguren?.aktiv()?.fig.id==='dyr';svg.classList.toggle('celle-venter',dyr);henter.hidden=!dyr;};
 const venteObs=new MutationObserver(vent);
 if(kanWebGL()){svg.parentElement.append(henter);venteObs.observe(svg,{childList:true});vent();}
 const stopVent=()=>{venteObs.disconnect();svg.classList.remove('celle-venter');henter.remove();};
 try{const mod=await import('./model.js');pladser=mod.fagordspladser||{};model=await mod.skabDyrecelle();}
 catch(e){stopVent();console.warn('3D er ikke tilgængelig; cellefiguren vises som SVG.',e);return;}
 stopVent();
 const NS='http://www.w3.org/2000/svg';
 const værktøjer=document.createElement('div');værktøjer.className='celle-vinkler';værktøjer.setAttribute('aria-label','Drej dyrecellen i 3D');
 værktøjer.innerHTML='<span>3D-cellesnit</span><button type="button" data-drej="-.15" aria-label="Drej cellen mod venstre">↶</button><button type="button" data-drej=".15" aria-label="Drej cellen mod højre">↷</button><button type="button" data-drej="0">Nulstil vinkel</button>';
 svg.parentElement.prepend(værktøjer);
 let rotation=0,signatur='',senesteBillede='';
 function aktiv(){return window.bygFiguren?.aktiv();}
 function retAnkre(m){const a=model.ankre();for(const p of m.fig.pladser){if(a[p.ord])p.maal=a[p.ord];if(pladser[p.ord])[p.x,p.y]=pladser[p.ord];}}
 function opdater(){const m=aktiv();if(!m)return;const dyr=m.fig.id==='dyr';værktøjer.hidden=!dyr;svg.classList.toggle('celle-i-3d',dyr);if(!dyr){signatur='';return;}
  const s=[m.lag,m.svaer,[...m.loest].sort().join(','),m.hintPlads,rotation].join('|');
  if(s===signatur&&svg.querySelector('.celle-3d-billede'))return;
  if(s!==signatur){signatur=s;const synlige=new Set(m.fig.lag.flatMap((l,i)=>m.synlig(i)?l.ord:[]));model.tegn({rotation,synlige,farver:m.loest,fremhæv:m.hintPlads===null?null:m.fig.pladser[m.hintPlads]?.ord});senesteBillede=model.lærred.toDataURL();}
  let image=svg.querySelector('.celle-3d-billede');if(!image){image=document.createElementNS(NS,'image');image.setAttribute('class','celle-3d-billede');image.setAttribute('width','1000');image.setAttribute('height','640');image.setAttribute('pointer-events','none');svg.prepend(image);}image.setAttribute('href',senesteBillede);svg.dataset.celle3d='klar';
 }
 værktøjer.addEventListener('click',e=>{const b=e.target.closest('[data-drej]');if(!b)return;rotation=b.dataset.drej==='0'?0:Math.max(-.5,Math.min(.5,rotation+Number(b.dataset.drej)));model.tegn({rotation});const m=aktiv();retAnkre(m);m.tegnFigur();opdater();});
 new MutationObserver(opdater).observe(svg,{childList:true});
 // Funktionsopgaven: klik rammer delen i 3D-modellen (motoren spørger figuren).
 const vaelgVed=(x,y)=>{const m=aktiv();return m&&m.fig.id==='dyr'&&svg.classList.contains('celle-i-3d')?model.vælg(x,y):undefined;};
 for(const m of Object.values(window.bygFiguren.motorer()))if(m.fig.id==='dyr')m.fig.vaelgVed=vaelgVed;
 const dyremotor=window.bygFiguren.motorer().dyr;retAnkre(dyremotor);if(aktiv()===dyremotor)dyremotor.tegnFigur();opdater();
}
function kanWebGL(){try{const c=document.createElement('canvas');return !!(c.getContext('webgl2')||c.getContext('webgl'));}catch{return false;}}
