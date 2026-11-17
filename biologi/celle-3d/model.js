// Fælles 3D-celler til «Byg cellen» og membrantransport: dyrecellen og plantecellen.
// Begge er bygget i Blender og ligger som meshopt-komprimeret glTF (dyrecelle.glb,
// plantecelle.glb). Dyrecellen bruges også af «Byg cellen 3D».
// Three.js 0.169.0 (MIT) og dens GLTF-loader/meshopt-dekoder leveres lokalt.
import * as T from './vendor/three.module.min.js';
import {GLTFLoader} from './vendor/addons/loaders/GLTFLoader.js';
import {MeshoptDecoder} from './vendor/addons/libs/meshopt_decoder.module.js';
import {RoomEnvironment} from './vendor/addons/RoomEnvironment.js';

const V=(x,y,z)=>new T.Vector3(x,y,z);

// Hver celle: modelfil, fagord, hvordan Blender-delene sorteres i fagord, omtrentlige
// mål (flyttes ved indlæsning til nærmeste punkt på organellen), fagordenes felter
// i figurkoordinater (1000×640, valgt så pegepindene ikke krydser) og kameraet.
export const CELLER={
 dyr:{
  url:'./dyrecelle.glb',
  fagord:['cellemembran','cytoplasma','cellekerne','kernemembran','ruER','glatER','golgi','ribosom','mitokondrie','vesikel'],
  // Dyrecellens dele har `struktur` og `del` som egenskaber fra Blender.
  fagordFor(navne,ex){
   const {struktur,del}=ex;
   if(del==='Kernemembran'||del==='Kernepore')return'kernemembran';
   if(del==='Ribosom på ru ER')return'ruER';
   if(del==='Vesikel')return'vesikel';
   return {Cellemembran:'cellemembran',Cytoplasma:'cytoplasma',Cellekerne:'cellekerne','Ru ER':'ruER','Glat ER':'glatER',Golgiapparat:'golgi',Mitokondrie:'mitokondrie',Ribosom:'ribosom'}[struktur]||null;
  },
  sigte:{cellemembran:[-4.4,-1,3.5],cytoplasma:[-.84,-.15,2.86],cellekerne:[.5,.2,-.9],kernemembran:[-.6,.9,0],ruER:[2.2,.7,-2.4],glatER:[-1.6,.6,.2],golgi:[3.6,1,1.2],mitokondrie:[-3.6,.05,1.4],ribosom:[3.7,-.12,-1.6],vesikel:[4.9,0,2.2]},
  fast:['cytoplasma'],   // cytoplasmaets snitflade er flad med få hjørnepunkter; målet ligger allerede på den
  pladser:{glatER:[100,52],kernemembran:[100,160],mitokondrie:[100,268],cellemembran:[100,400],
   cellekerne:[900,52],ruER:[900,152],ribosom:[900,290],vesikel:[900,400],cytoplasma:[400,612],golgi:[630,612]},
  zoom:[6.2,-.4,1.6],    // punktet på cellemembranen, som membrantransport zoomer ind på
  kamera:{hh:6.3,pos:[7.2,13.5,15.5],mål:[0,-1.25,0]},
  // Procedurale farver fra Blender, som ikke følger med i glTF.
  farve:{'C3D Cellemembran':[.26,.56,.88],'C3D Mitokondrie matrix v2':[.42,.74,.71]},
 },
 plante:{
  url:'./plantecelle.glb',
  fagord:['cellevaeg','kloroplast','vakuole','cellemembran','cytoplasma','cellekerne','kernemembran','ruER','glatER','golgi','ribosom','mitokondrie','vesikel'],
  // Plantecellens dele sorteres efter navnet på objektet i Blender (eller en forælder).
  fagordFor(navne){
   const har=s=>navne.some(n=>n.startsWith(s));
   if(har('Cell_Wall'))return'cellevaeg';
   if(har('Chloroplast'))return'kloroplast';
   if(har('Tonoplast')||har('Vacuole'))return'vakuole';
   if(har('Cell_Membrane'))return'cellemembran';
   if(har('Cytoplasm'))return'cytoplasma';
   if(har('Nuclear_Envelope')||har('Nuclear_Pores'))return'kernemembran';
   if(har('Nucleoplasm')||har('Chromatin')||har('Nucleolus'))return'cellekerne';
   if(har('Ribosomes_on_Rough_ER')||har('Rough_ER'))return'ruER';
   if(har('Free_Ribosomes'))return'ribosom';
   if(har('Smooth_ER'))return'glatER';
   if(har('Golgi_Vesicles'))return'vesikel';
   if(har('Golgi'))return'golgi';
   if(har('Mitochondrion'))return'mitokondrie';
   return null;
  },
  sigte:{cellevaeg:[-7,-4.5,7.2],kloroplast:[8.7,0,-.4],vakuole:[3,1.7,-1],cellemembran:[9.7,-.1,5.2],cytoplasma:[-8.7,-.15,-1.6],
   cellekerne:[-5.3,1.2,-.9],kernemembran:[-5.4,0,.8],ruER:[-3,.8,-3.4],glatER:[-8,0,.6],golgi:[-4,1,3.4],ribosom:[-7.8,-.1,-4.4],mitokondrie:[-7.3,0,4],vesikel:[-2.7,0,4.5]},
  fast:['cytoplasma'],
  pladser:{},            // sættes efter projektionen nedenfor
  zoom:[9.7,-.4,0],
  kamera:{hh:9.4,pos:[.6,18,18.5],mål:[0,-2.6,.2]},
  farve:{'PC Cell Wall':[.80,.91,.74],'PC Cell Wall Cut':[.72,.86,.63],'C3D Mitokondrie matrix v2':[.42,.74,.71]},
  uigennemsigtig:['PC Cell Wall'],
 },
};
CELLER.plante.pladser={ribosom:[100,52],cytoplasma:[100,160],glatER:[100,268],mitokondrie:[100,376],cellevaeg:[100,484],
 cellekerne:[300,26],ruER:[520,26],
 kernemembran:[300,612],golgi:[500,612],vesikel:[700,612],
 vakuole:[900,160],kloroplast:[900,268],cellemembran:[900,376]};

// Bagudkompatible navne for dyrecellen (bruges af membrantransport).
export const FAGORD=CELLER.dyr.fagord;
export const fagordspladser=CELLER.dyr.pladser;
export let zoomAnker=CELLER.dyr.zoom;

function kameraTil(b=1000,h=640,k=CELLER.dyr.kamera){const aspect=b/h,hh=k.hh;const c=new T.OrthographicCamera(-hh*aspect,hh*aspect,hh,-hh,.1,120);c.position.set(...k.pos);c.lookAt(...k.mål);c.updateMatrixWorld();return c;}
export function projektér(anker,b=1000,h=640,vinkel=0,k=CELLER.dyr.kamera){const p=V(...anker);p.applyAxisAngle(V(0,1,0),vinkel);p.project(kameraTil(b,h,k));return[(p.x+1)*b/2,(1-p.y)*h/2];}

function nærmestePunkt(meshes,mål){
 const m=V(...mål),p=V(),bedst=V();let d=Infinity;
 for(const o of meshes){o.updateWorldMatrix(true,false);const pos=o.geometry.attributes.position,trin=Math.max(1,Math.floor(pos.count/4000));
  for(let i=0;i<pos.count;i+=trin){p.fromBufferAttribute(pos,i).applyMatrix4(o.matrixWorld);const a=p.distanceToSquared(m);if(a<d){d=a;bedst.copy(p);}}}
 return d<Infinity?bedst.toArray().map(v=>+v.toFixed(3)):mål;
}

export function skabDyrecelle(valg){return skabCelle('dyr',valg);}

export async function skabCelle(id,{bredde=1000,højde=640}={}) {
 const C=CELLER[id],FAG=C.fagord;
 const renderer=new T.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true,powerPreference:'low-power'});
 renderer.setSize(bredde,højde);renderer.setPixelRatio(1);
 renderer.setClearColor(0x000000,0);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.NoToneMapping;
 const scene=new T.Scene(),kamera=kameraTil(bredde,højde,C.kamera),rod=new T.Group();scene.add(rod);
 const pmrem=new T.PMREMGenerator(renderer);scene.environment=pmrem.fromScene(new RoomEnvironment(),.04).texture;scene.environmentIntensity=.35;
 scene.add(new T.HemisphereLight(0xffffff,0xc9d4de,.95));
 const sol=new T.DirectionalLight(0xffffff,1.7);sol.position.set(-9,20,11);scene.add(sol);

 const loader=new GLTFLoader();loader.setMeshoptDecoder(MeshoptDecoder);
 const gltf=await loader.loadAsync(new URL(C.url,import.meta.url).href);
 rod.add(gltf.scene);
 const grupper=Object.fromEntries(FAG.map(k=>[k,[]]));
 gltf.scene.traverse(o=>{if(!o.isMesh)return;
  const ex=o.userData.struktur?o.userData:(o.parent?.userData||{});
  const navne=[];for(let p=o;p;p=p.parent)if(p.name)navne.push(p.name);
  const ord=C.fagordFor(navne,ex);if(!ord)return;
  const m=o.material.clone();if(C.farve[m.name])m.color.setRGB(...C.farve[m.name]);
  if(C.uigennemsigtig?.includes(m.name)){m.transparent=false;m.opacity=1;}
  m.metalness=0;if(m.transparent){m.depthWrite=false;m.side=T.DoubleSide;}
  m.userData.farve=m.color.clone();o.material=m;o.userData.ord=ord;grupper[ord].push(o);
 });
 rod.updateMatrixWorld(true);
 const ankre=structuredClone(C.sigte);
 for(const k of FAG)if(!C.fast.includes(k))ankre[k]=nærmestePunkt(grupper[k],C.sigte[k]);
 const zoom=nærmestePunkt(grupper.cellemembran,C.zoom);
 if(id==='dyr')zoomAnker=zoom;

 let vinkel=0,viste=new Set(FAG),farvede=new Set(FAG),markering=null;
 // fremhæv: hintets orange del. lys: den del, musen peger på (lyser gult op).
 function tegn({rotation=vinkel,synlige=viste,farver=farvede,fremhæv=markering,lys=null}={}){
  vinkel=rotation;viste=synlige;farvede=farver;markering=fremhæv;rod.rotation.y=vinkel;
  for(const [k,meshes] of Object.entries(grupper))for(const o of meshes){
   o.visible=viste.has(k);const m=o.material,org=m.userData.farve;
   if(farvede.has(k))m.color.copy(org);
   else{const l=org.r*.21+org.g*.72+org.b*.07;m.color.setRGB(l*.65+.27,l*.65+.27,l*.65+.27);}
   // den del, musen peger på, gløder gult; resten beholder sine farver
   m.emissive.set(k===lys?0xffd060:k===fremhæv?0xc2410c:0x000000);m.emissiveIntensity=k===lys?.22:.6;
  }
  renderer.render(scene,kamera);return renderer.domElement;
 }
 function projektion(ord){return projektér(ankre[ord]||zoom,bredde,højde,vinkel,C.kamera);}
 function fagordsankre(v=vinkel){return Object.fromEntries(Object.entries(ankre).map(([k,a])=>[k,projektér(a,1000,640,v,C.kamera)]));}
 // Fagordet for den synlige del under et punkt i figurens koordinater (bredde×højde), eller null.
 // Opslaget bruger et billede, hvor hver del er tegnet i sin egen farve (nummeret på
 // fagordet). Det tegnes kun igen, når vinklen eller de synlige dele ændrer sig, så
 // opslaget er hurtigt nok til at følge musen.
 const SMÅ=new Set(['ribosom','vesikel']);  // små dele tæller, når musen er lige ved siden af
 const BAGGRUND=new Set(['cytoplasma','cellevaeg','vakuole']); // store flader: en lille del lige ved siden af vinder
 let pickMål=null,pickBuf=null,pickNøgle='';
 const pickMat=new Map();
 function pickFarve(o){
  const nr=FAG.indexOf(o.userData.ord)+1,nøgle=nr+'|'+o.material.side;
  if(!pickMat.has(nøgle))pickMat.set(nøgle,new T.MeshBasicMaterial({color:new T.Color().setRGB(nr/255,0,0,T.LinearSRGBColorSpace),side:o.material.side}));
  return pickMat.get(nøgle);
 }
 function pickTegn(){
  const nøgle=vinkel+'|'+[...viste].sort().join(',');
  if(nøgle===pickNøgle&&pickBuf)return;
  pickNøgle=nøgle;
  if(!pickMål){pickMål=new T.WebGLRenderTarget(bredde,højde);pickBuf=new Uint8Array(bredde*højde*4);}
  const gemt=[],miljø=scene.environment;scene.environment=null;
  for(const meshes of Object.values(grupper))for(const o of meshes){gemt.push([o,o.material]);o.material=pickFarve(o);}
  renderer.setRenderTarget(pickMål);renderer.clear();renderer.render(scene,kamera);
  renderer.readRenderTargetPixels(pickMål,0,0,bredde,højde,pickBuf);renderer.setRenderTarget(null);
  for(const [o,m] of gemt)o.material=m;scene.environment=miljø;
 }
 function ordVed(x,y){
  x=Math.round(x);y=Math.round(y);if(x<0||y<0||x>=bredde||y>=højde)return null;
  return FAG[pickBuf[((højde-1-y)*bredde+x)*4]-1]||null;
 }
 // Et billede af, hvor delen kan ses (ugennemsigtig hvor den er): grundlag for gløden om den.
 let maskeLærred=null;
 function maske(ord){
  pickTegn();
  if(!maskeLærred){maskeLærred=document.createElement('canvas');maskeLærred.width=bredde;maskeLærred.height=højde;}
  const ctx=maskeLærred.getContext('2d'),bill=ctx.createImageData(bredde,højde),nr=FAG.indexOf(ord)+1;
  for(let y=0;y<højde;y++){const fra=(højde-1-y)*bredde,til=y*bredde;
   for(let x=0;x<bredde;x++)if(pickBuf[(fra+x)*4]===nr)bill.data[(til+x)*4+3]=255;}
  ctx.putImageData(bill,0,0);return maskeLærred.toDataURL();
 }
 function vælg(x,y){
  pickTegn();
  const midt=ordVed(x,y);
  if(SMÅ.has(midt)||(midt&&!BAGGRUND.has(midt)))return midt;
  for(let r=1;r<=4;r++)for(let dx=-r;dx<=r;dx++)for(let dy=-r;dy<=r;dy++){const o=ordVed(x+dx,y+dy);if(SMÅ.has(o))return o;}
  return midt;
 }
 tegn();
 return {id,fagord:FAG,pladser:C.pladser,lærred:renderer.domElement,tegn,projektion,vælg,maske,ankre:()=>fagordsankre(vinkel),dispose(){renderer.dispose();scene.traverse(o=>{if(o.isMesh)o.geometry.dispose();});}};
}
