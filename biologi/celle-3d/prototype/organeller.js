import {T,V,rør,organiskKrop,cisterna,mitoSkal,mitoPunkt,crista,golgiSæk,tilfældig} from './geometri.js';

// Farverne følger lærebogsanimationernes konvention: violet kerne, karminrødt ER,
// røde mitokondrier, orange golgi og blå lysosomer. De er illustrative.
export const FARVER={kerne:'#9b5fd0',kerneLys:'#c49be8',nukleolus:'#b0378f',kromatin:'#8c84f2',ruER:'#a82a42',erKant:'#ef8a98',ribosom:'#e3a33a',glatER:'#d4687c',mito:'#d0353b',crista:'#7e1726',golgi:'#e2733a',golgiKant:'#f39a5c',lysosom:'#4c7fc0',vesikel:'#f2b56c',friRibosom:'#8a2a2a'};

export function bygOrganeller({rod,materiale,mesh}){
 const grupper={},låg=[],ankre={},optaget=[];
 function gruppe(id,navn,pos){const g=new T.Group();g.name=id;g.userData={id,navn};if(pos)g.position.set(...pos);rod.add(g);grupper[id]=g;return g;}
 const lilleKugle=new T.SphereGeometry(1,12,9);
 // Mange små kugler tegnes som én instans-mesh for at holde antallet af tegnekald nede.
 function prikker(g,punkter,r,m){
  const o=new T.InstancedMesh(lilleKugle,m,punkter.length),mat=new T.Matrix4(),s=V(r,r,r),q=new T.Quaternion();
  punkter.forEach((p,i)=>o.setMatrixAt(i,mat.compose(p,q,s)));o.castShadow=o.receiveShadow=true;g.add(o);return o;
 }
 // Deterministisk placering inde i cellen uden overlap mellem de større organeller.
 let frø=11;
 // Kerne og ru ER fylder en flad tromle; derfor skaleres den lodrette afstand.
 const afstand=(o,p)=>Math.hypot(p.x-o.c.x,(p.y-o.c.y)*(o.k||1),p.z-o.c.z);
 function find(r,maks=4.0,minY=-4,maxY=4){
  for(let forsøg=0;forsøg<4000;forsøg++){
   const u=tilfældig(frø++)*2-1,a=tilfældig(frø++)*Math.PI*2,d=Math.cbrt(tilfældig(frø++))*(maks-r);
   const p=V(Math.sqrt(1-u*u)*Math.cos(a)*d,u*d*.86,Math.sqrt(1-u*u)*Math.sin(a)*d);
   if(p.y<minY||p.y>maxY)continue;
   if(optaget.every(o=>afstand(o,p)>o.r+r+.12)){optaget.push({c:p,r});return p;}
  }
  throw new Error('Ingen plads til organel');
 }
 // Golgi og glat ER har faste, komponerede pladser; resten fordeles tilfældigt men reproducerbart.
 function plads(xyz,r){const c=V(...xyz);optaget.push({c,r});return c;}

 // ---------- Cellekernen med dobbelt kernehylster og porer ----------
 const kerne=gruppe('kerne','Cellekerne',[0,.15,0]);ankre.kerne=V(0,.15,0);
 const R=1.3;
 const skalMat=materiale(FARVER.kerne,{roughness:.38,clearcoat:.35,side:T.DoubleSide});
 mesh(organiskKrop(R,R*.96,R,.03,Math.PI/2,Math.PI/2,2),skalMat,kerne);
 mesh(organiskKrop(R*.95,R*.91,R*.95,.03,Math.PI/2,Math.PI/2,2),materiale(FARVER.kerneLys,{side:T.BackSide,roughness:.7}),kerne);
 const kerneLåg=new T.Group();kerne.add(kerneLåg);
 mesh(organiskKrop(R,R*.96,R,.03,0,Math.PI/2,2),skalMat.clone(),kerneLåg);
 mesh(organiskKrop(R*.95,R*.91,R*.95,.03,0,Math.PI/2,2),materiale(FARVER.kerneLys,{side:T.BackSide,roughness:.7}),kerneLåg);
 låg.push({id:'kerne',gruppe:kerneLåg});
 const snitring=mesh(rør(Array.from({length:120},(_,i)=>{const a=i/120*Math.PI*2;return V(Math.cos(a)*R*.975,0,Math.sin(a)*R*.975);}),.035,true),materiale('#e3cdf5'),kerne);snitring.visible=false;
 // Kromatin: løse, snoede tråde i hele kernens rum, ikke kromosomer.
 const dnaMat=materiale(FARVER.kromatin,{roughness:.55});
 for(let j=0;j<16;j++){
  const pts=[];let p=V((tilfældig(j+300)-.5)*1.3,(tilfældig(j+310)-.5)*1.0,(tilfældig(j+320)-.5)*1.3);
  for(let k=0;k<26;k++){
   p=p.clone().add(V(tilfældig(j*40+k)-.5,(tilfældig(j*40+k+500)-.5)*.8,tilfældig(j*40+k+900)-.5).multiplyScalar(.32));
   if(p.length()>.95)p.setLength(.88);pts.push(p);
  }
  mesh(rør(pts,.022,false,150),dnaMat,kerne);
 }
 mesh(organiskKrop(.38,.35,.37,.12,0,Math.PI,5),materiale(FARVER.nukleolus,{roughness:.7}),kerne,[.22,.04,-.18]);
 // Kerneporer: mørke ringe i hylsteret. Porerne i den øvre halvdel følger låget.
 const poreMat=materiale('#5e2e8c',{roughness:.5});
 for(let j=0;j<70;j++){
  const y=1-2*(j+.5)/70,a=j*2.399,n=V(Math.sqrt(1-y*y)*Math.cos(a),y,Math.sqrt(1-y*y)*Math.sin(a));
  const torus=mesh(new T.TorusGeometry(.06,.02,7,16),y>0?poreMat.clone():poreMat,y>0?kerneLåg:kerne,[n.x*R*1.005,n.y*R*.965,n.z*R*1.005]);torus.quaternion.setFromUnitVectors(V(0,0,1),n);
 }
 optaget.push({c:V(0,.15,0),r:2.75,k:1.45});
 // Hold sigtelinjen fra startkameraet ned til kernen fri, som i lærebogsfiguren.
 optaget.push({c:V(.8,1.75,2.2),r:.95});

 // ---------- Ru ER: koncentriske, foldede cisterner rundt om kernen ----------
 const ruER=gruppe('ruER','Ru ER',[0,.15,0]);ankre.ruER=V(1.8,.3,.5);
 const erMat=materiale(FARVER.ruER,{roughness:.42,clearcoat:.25}),erKant=materiale(FARVER.erKant,{roughness:.4});
 const riboER=[];
 for(let j=0;j<4;j++){
  const r0=1.58+j*.3,åbning=.55+j*.12,startA=.8+j*1.7,pts=[];
  for(let k=0;k<=110;k++){
   const a=startA+(k/110)*(Math.PI*2-åbning),r=r0+.08*Math.sin(a*7+j*1.3)+.05*Math.sin(a*13+j);
   pts.push(V(Math.cos(a)*r,0,Math.sin(a)*r));
  }
  const kurve=new T.CatmullRomCurve3(pts);
  const form=cisterna(kurve,{højde:.62-j*.09,bund:-1.0+j*.08,fase:j*1.8+1,tykkelse:.12,afrunding:.04,ujævnhed:.35});
  mesh(form.geo,erMat,ruER);
  mesh(rør(Array.from({length:181},(_,k)=>form.punkt(k,form.M,.5)),.05,false,300),erKant,ruER);
  // Ribosomer sidder på cisternernes ydersider.
  for(let k=2;k<180;k+=3)for(let v=1;v<form.M;v+=3)for(const s of[0,1]){
   if(tilfældig(k*7+v*3+s+j*1000)<.45)continue;
   const p=form.punkt(k,v,s),t=kurve.getTangentAt(k/180),n=V(-t.z,0,t.x).normalize();p.addScaledVector(n,(s-.5)*.14);riboER.push(p);
  }
 }
 // Forbindelser mellem lamellerne viser, at ER er ét sammenhængende membransystem.
 for(const a of[.3,1.9,3.4,4.9]){
  const pts=[1.6,1.9,2.2,2.5].map((r,i)=>V(Math.cos(a+i*.05)*r,-.25+.12*Math.sin(i*2),Math.sin(a+i*.05)*r));mesh(rør(pts,.08),erMat,ruER);
 }
 prikker(ruER,riboER,.045,materiale(FARVER.ribosom,{roughness:.6}));

 // ---------- Golgiapparatet: stakke af skålformede sække ----------
 const golgi=gruppe('golgi','Golgiapparat');
 const golgiMat=materiale(FARVER.golgi,{roughness:.36,clearcoat:.3,side:T.DoubleSide}),golgiVes=materiale(FARVER.golgiKant,{roughness:.4});
 const golgiPladser=[];
 for(let s=0;s<4;s++){
  const p=plads([[2.05,2.2,.82],[-2.25,-2.15,-.75],[-.95,-1.9,2.6],[1.1,1.5,-2.8]][s],.85);golgiPladser.push(p);
  const stak=new T.Group();stak.position.copy(p);stak.quaternion.setFromUnitVectors(V(0,1,0),p.clone().normalize());stak.rotateY(s*1.3);golgi.add(stak);
  const ves=[];
  for(let i=0;i<5;i++){
   const rx=.85-i*.07,rz=.56-i*.045;
   mesh(golgiSæk(rx,rz,.065,.3,s*3+i),golgiMat,stak,[0,i*.19-.38,0]);
   for(const side of[-1,1])if(tilfældig(s*20+i)>.3)ves.push(V(side*(rx+.12),i*.19-.38+.3+.05,(tilfældig(s*9+i)-.5)*.6));
  }
  for(let k=0;k<5;k++)ves.push(V((tilfældig(s*50+k)-.5)*1.2,.75+tilfældig(s*60+k)*.25,(tilfældig(s*70+k)-.5)*.8));
  prikker(stak,ves,.075,golgiVes);
 }
 ankre.golgi=golgiPladser[0].clone();

 // ---------- Mitokondrier: røde kapsler med cristae ----------
 const mito=gruppe('mito','Mitokondrier');
 const mitoMat=materiale(FARVER.mito,{roughness:.3,clearcoat:.5,transparent:true,opacity:.6,side:T.DoubleSide});
 const cristaMat=materiale(FARVER.crista,{roughness:.55,side:T.DoubleSide});
 const matrixMat=materiale('#f08a7c',{roughness:.7,side:T.BackSide});
 const mitoPladser=[];
 for(let n=0;n<12;n++){
  const l=.8+tilfældig(n+40)*.18,p=find(l*.7+.06);mitoPladser.push(p);
  const g=new T.Group();g.position.copy(p);
  g.quaternion.setFromEuler(new T.Euler(tilfældig(n+70)*Math.PI*2,tilfældig(n+80)*Math.PI*2,tilfældig(n+90)*Math.PI*2));mito.add(g);
  const nedre=mesh(mitoSkal(l,false),mitoMat,g);nedre.renderOrder=3;
  const lågGruppe=new T.Group();g.add(lågGruppe);const øvre=mesh(mitoSkal(l,true),mitoMat.clone(),lågGruppe);øvre.renderOrder=3;låg.push({id:'mito',gruppe:lågGruppe,grund:.6});
  const indre=mesh(mitoSkal(l,false),matrixMat,g);indre.scale.set(.96,.9,.9);
  for(let j=0;j<8;j++)mesh(crista(.12+j*.108,l,j*1.7+n),cristaMat,g);
  for(const a of[Math.PI/2,Math.PI*1.5]){
   const kant=mesh(rør(Array.from({length:65},(_,i)=>mitoPunkt(i/64,a,l)),.022,false,120),materiale('#ffb9a8'),g);kant.visible=false;kant.userData.snitrand='mito';
  }
 }
 ankre.mito=mitoPladser[0].clone();

 // ---------- Glat ER: forgrenet rørnetværk koblet til ru ER ----------
 const glatER=gruppe('glatER','Glat ER');
 const glatMat=materiale(FARVER.glatER,{roughness:.34,clearcoat:.3});
 const centrum=plads([-2.7,2,-1],1);ankre.glatER=centrum.clone();
 const knuder=Array.from({length:11},(_,i)=>{const k=centrum.clone().add(V(tilfældig(i+600)-.5,(tilfældig(i+610)-.5)*.8,tilfældig(i+620)-.5).multiplyScalar(1.6));return k.length()>3.85?k.setLength(3.85):k;});
 const set=new Set();
 knuder.forEach((a,i)=>{
  knuder.map((b,j)=>({j,d:a.distanceTo(b)})).filter(x=>x.j!==i).sort((x,y)=>x.d-y.d).slice(0,2).forEach(({j})=>{
   const nøgle=[i,j].sort().join('-');if(set.has(nøgle))return;set.add(nøgle);
   const b=knuder[j],m=a.clone().lerp(b,.5).add(V(tilfældig(i*13+j)-.5,tilfældig(i*17+j)-.5,tilfældig(i*19+j)-.5).multiplyScalar(.35));
   mesh(rør([a,m,b],.075,false,40),glatMat,glatER);
  });
 });
 prikker(glatER,knuder,.1,glatMat);
 // Rør ind mod den yderste ru ER-cisterne.
 const nærmest=knuder.reduce((x,y)=>x.length()<y.length()?x:y),mod=nærmest.clone().setLength(2.55).setY(.1);
 mesh(rør([nærmest,nærmest.clone().lerp(mod,.5).add(V(0,.25,0)),mod],.075,false,40),glatMat,glatER);

 // ---------- Lysosomer og vesikler ----------
 const lyso=gruppe('lysosom','Lysosomer');const lysoMat=materiale(FARVER.lysosom,{roughness:.35,clearcoat:.4});
 for(let i=0;i<11;i++){const r=.2+tilfældig(i+200)*.14,p=find(r,4.1);mesh(organiskKrop(r,r*.92,r*1.05,.12,0,Math.PI,i),lysoMat,lyso,p.toArray());if(!i)ankre.lysosom=p.clone();}
 const ves=gruppe('vesikel','Vesikler');const vesPkt=[];
 for(let i=0;i<26;i++){const p=find(.12,4.15);vesPkt.push(p);if(!i)ankre.vesikel=p.clone();}
 prikker(ves,vesPkt,.12,materiale(FARVER.vesikel,{roughness:.4}));
 // Frie ribosomer i cytoplasmaet; de fylder ikke i optaget-listen.
 const frie=gruppe('ribosom','Frie ribosomer');const frieP=[];
 for(let i=0;frieP.length<240&&i<5000;i++){
  const u=tilfældig(i+3000)*2-1,a=tilfældig(i+4000)*Math.PI*2,d=Math.cbrt(tilfældig(i+5000))*4.1;
  const p=V(Math.sqrt(1-u*u)*Math.cos(a)*d,u*d*.86,Math.sqrt(1-u*u)*Math.sin(a)*d);
  if(optaget.every(o=>afstand(o,p)>o.r+.05))frieP.push(p);
 }
 prikker(frie,frieP,.04,materiale(FARVER.friRibosom,{roughness:.6}));
 ankre.ribosom=frieP[0].clone();

 // Værdi 1 = åbnet: den øverste halvdel er løftet væk og usynlig.
 function åbn(id,værdi){
  for(const d of låg)if(d.id===id){
   d.gruppe.visible=værdi<.999;d.gruppe.position.y=(id==='kerne'?.95:.5)*værdi;
   d.gruppe.traverse(o=>{if(!o.isMesh)return;o.material.transparent=værdi>0||d.grund<1;o.material.opacity=(d.grund||1)*(1-værdi);o.material.depthWrite=værdi<.1&&!d.grund;});
  }
  if(id==='kerne')snitring.visible=værdi>.15;
  if(id==='mito')mito.traverse(o=>{if(o.userData.snitrand==='mito')o.visible=værdi>.15;});
 }
 return {grupper,ankre,åbn,optaget};
}
