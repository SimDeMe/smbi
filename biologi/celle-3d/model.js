// Fælles dyrecelle i 3D til «Byg cellen» og membrantransport.
// Modellen er bygget i Blender og ligger i dyrecelle.glb (samme fil som
// «Byg cellen 3D»). Hver mesh har userData.struktur og userData.del fra Blender.
// Three.js 0.169.0 (MIT) og dens GLTF-loader/meshopt-dekoder leveres lokalt.
import * as T from './vendor/three.module.min.js';
import {GLTFLoader} from './vendor/addons/loaders/GLTFLoader.js';
import {MeshoptDecoder} from './vendor/addons/libs/meshopt_decoder.module.js';
import {RoomEnvironment} from './vendor/addons/RoomEnvironment.js';

export const FAGORD=['cellemembran','cytoplasma','cellekerne','kernemembran','ruER','glatER','golgi','ribosom','mitokondrie','vesikel'];
const MODEL_URL=new URL('./dyrecelle.glb',import.meta.url).href;
const V=(x,y,z)=>new T.Vector3(x,y,z);

// Blender-dele → fagord i Byg cellen.
function fagordFor(struktur,del){
 if(del==='Kernemembran'||del==='Kernepore')return'kernemembran';
 if(del==='Ribosom på ru ER')return'ruER';
 if(del==='Vesikel')return'vesikel';
 return {Cellemembran:'cellemembran',Cytoplasma:'cytoplasma',Cellekerne:'cellekerne','Ru ER':'ruER','Glat ER':'glatER',Golgiapparat:'golgi',Mitokondrie:'mitokondrie',Ribosom:'ribosom'}[struktur]||null;
}
// Omtrentlige mål. Ved indlæsning flyttes hvert mål til det nærmeste punkt på
// organellens egen overflade, så prikken altid sidder på strukturen.
const sigte={cellemembran:[-4.4,-1,3.5],cytoplasma:[-.84,-.15,2.86],cellekerne:[.5,.2,-.9],kernemembran:[-.6,.9,0],ruER:[2.2,.7,-2.4],glatER:[-1.6,.6,.2],golgi:[3.6,1,1.2],mitokondrie:[-3.6,.05,1.4],ribosom:[3.7,-.12,-1.6],vesikel:[4.9,0,2.2]};
const verdensankre=structuredClone(sigte);
// Fagordenes pladser (midten af feltet, figurkoordinater 1000×640) til 3D-cellen,
// valgt så pegepindene ikke krydser hinanden ved lige vinkel. SVG-reserven beholder sine egne.
export const fagordspladser={glatER:[100,52],kernemembran:[100,160],mitokondrie:[100,268],cellemembran:[100,400],
 cellekerne:[900,52],ruER:[900,152],ribosom:[900,290],vesikel:[900,400],cytoplasma:[400,612],golgi:[630,612]};
// Punktet på cellemembranen, som membrantransport zoomer ind på.
export let zoomAnker=[6.2,-.4,1.6];

function kameraTil(b=1000,h=640){const aspect=b/h,hh=6.3;const k=new T.OrthographicCamera(-hh*aspect,hh*aspect,hh,-hh,.1,80);k.position.set(7.2,13.5,15.5);k.lookAt(0,-1.25,0);k.updateMatrixWorld();return k;}
export function projektér(anker,b=1000,h=640,vinkel=0){const p=V(...anker);p.applyAxisAngle(V(0,1,0),vinkel);p.project(kameraTil(b,h));return[(p.x+1)*b/2,(1-p.y)*h/2];}
export function fagordsankre(vinkel=0){return Object.fromEntries(Object.entries(verdensankre).map(([k,v])=>[k,projektér(v,1000,640,vinkel)]));}

function nærmestePunkt(meshes,mål){
 const m=V(...mål),p=V(),bedst=V();let d=Infinity;
 for(const o of meshes){o.updateWorldMatrix(true,false);const pos=o.geometry.attributes.position,trin=Math.max(1,Math.floor(pos.count/4000));
  for(let i=0;i<pos.count;i+=trin){p.fromBufferAttribute(pos,i).applyMatrix4(o.matrixWorld);const a=p.distanceToSquared(m);if(a<d){d=a;bedst.copy(p);}}}
 return d<Infinity?bedst.toArray().map(v=>+v.toFixed(3)):mål;
}

export async function skabDyrecelle({bredde=1000,højde=640}={}) {
 const renderer=new T.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true,powerPreference:'low-power'});
 renderer.setSize(bredde,højde);renderer.setPixelRatio(1);
 renderer.setClearColor(0x000000,0);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.NoToneMapping;
 const scene=new T.Scene(),kamera=kameraTil(bredde,højde),rod=new T.Group();scene.add(rod);
 const pmrem=new T.PMREMGenerator(renderer);scene.environment=pmrem.fromScene(new RoomEnvironment(),.04).texture;scene.environmentIntensity=.35;
 scene.add(new T.HemisphereLight(0xffffff,0xc9d4de,.95));
 const sol=new T.DirectionalLight(0xffffff,1.7);sol.position.set(-9,20,11);scene.add(sol);

 const loader=new GLTFLoader();loader.setMeshoptDecoder(MeshoptDecoder);
 const gltf=await loader.loadAsync(MODEL_URL);
 rod.add(gltf.scene);
 const grupper=Object.fromEntries(FAGORD.map(k=>[k,[]]));
 // Procedurale farver fra Blender, som ikke følger med i glTF (samme som Byg cellen 3D).
 const FARVE={'C3D Cellemembran':[.26,.56,.88],'C3D Mitokondrie matrix v2':[.42,.74,.71]};
 gltf.scene.traverse(o=>{if(!o.isMesh)return;
  const ex=o.userData.struktur?o.userData:(o.parent?.userData||{});
  const ord=fagordFor(ex.struktur,ex.del);if(!ord)return;
  const m=o.material.clone();if(FARVE[m.name])m.color.setRGB(...FARVE[m.name]);
  m.metalness=0;if(m.transparent){m.depthWrite=false;m.side=T.DoubleSide;}
  m.userData.farve=m.color.clone();o.material=m;o.userData.ord=ord;grupper[ord].push(o);
 });
 rod.updateMatrixWorld(true);
 // Cytoplasmaets snitflade er flad og har få hjørnepunkter; dens mål ligger allerede på fladen.
 for(const k of FAGORD)if(k!=='cytoplasma')verdensankre[k]=nærmestePunkt(grupper[k],sigte[k]);
 zoomAnker=nærmestePunkt(grupper.cellemembran,zoomAnker);

 let vinkel=0,viste=new Set(FAGORD),farvede=new Set(FAGORD),markering=null;
 const bleg=new T.Color(.94,.94,.92);
 // fremhæv: hintets orange del. lys: den del, musen peger på (lyser gult op).
 function tegn({rotation=vinkel,synlige=viste,farver=farvede,fremhæv=markering,lys=null}={}){
  vinkel=rotation;viste=synlige;farvede=farver;markering=fremhæv;rod.rotation.y=vinkel;
  for(const [k,meshes] of Object.entries(grupper))for(const o of meshes){
   o.visible=viste.has(k);const m=o.material,org=m.userData.farve;
   if(farvede.has(k))m.color.copy(org);
   else{const l=org.r*.21+org.g*.72+org.b*.07;m.color.setRGB(l*.65+.27,l*.65+.27,l*.65+.27);}
   // når en del lyser op, blegnes resten, så delen står klart frem
   if(lys&&k!==lys)m.color.lerp(bleg,.62);
   m.emissive.set(k===lys?0xffb000:k===fremhæv?0xc2410c:0x000000);m.emissiveIntensity=k===lys?.3:.6;
  }
  renderer.render(scene,kamera);return renderer.domElement;
 }
 function projektion(ord){return projektér(verdensankre[ord]||zoomAnker,bredde,højde,vinkel);}
 // Fagordet for den synlige del under et punkt i figurens koordinater (bredde×højde), eller null.
 // Opslaget bruger et billede, hvor hver del er tegnet i sin egen farve (nummeret på
 // fagordet). Det tegnes kun igen, når vinklen eller de synlige dele ændrer sig, så
 // opslaget er hurtigt nok til at følge musen.
 const SMÅ=new Set(['ribosom','vesikel']);  // små dele tæller, når musen er lige ved siden af
 let pickMål=null,pickBuf=null,pickNøgle='';
 const pickMat=new Map();
 function pickFarve(o){
  const nr=FAGORD.indexOf(o.userData.ord)+1,nøgle=nr+'|'+o.material.side;
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
  return FAGORD[pickBuf[((højde-1-y)*bredde+x)*4]-1]||null;
 }
 function vælg(x,y){
  pickTegn();
  const midt=ordVed(x,y);
  if(SMÅ.has(midt)||(midt&&midt!=='cytoplasma'))return midt;
  for(let r=1;r<=4;r++)for(let dx=-r;dx<=r;dx++)for(let dy=-r;dy<=r;dy++){const o=ordVed(x+dx,y+dy);if(SMÅ.has(o))return o;}
  return midt;
 }
 tegn();
 return {lærred:renderer.domElement,tegn,projektion,vælg,ankre:()=>fagordsankre(vinkel),dispose(){renderer.dispose();scene.traverse(o=>{if(o.isMesh)o.geometry.dispose();});}};
}
