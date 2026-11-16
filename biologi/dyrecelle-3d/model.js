// Scenen: renderer, lys, kamera og selve cellelegemet. Cellen er et solidt,
// let uregelmæssigt legeme, hvor en kile foran er skåret væk, så man ser ind
// i cytoplasmaet. Organellerne bygges i organeller.js.
// Three.js 0.169.0 (MIT) hentes lokalt fra ../celle-3d/vendor/.
import {T,V,TAU,GRAD,glat,gitter,kurveRør} from './geometri.js';
import {bygOrganeller,KERNECENTER} from './organeller.js';

// Cellens halvakser og kilen: spids bag kernen, åbningsvinkel og gulvhøjde.
const A=5.6,B=3.4,C=4.6,ZA=-3.2,PSI=70*GRAD,YF=-.9;
const FARVER={membran:'#e4cf96',membranInde:'#f3e6c6',cytoplasma:'#e8d7ae',membranKant:'#9c7f33'};

function celleRadius(d){
 const rE=1/Math.sqrt((d.x/A)**2+(d.y/B)**2+(d.z/C)**2);
 const n=1+.03*Math.sin(2.3*d.x+1.9*d.z+.5)+.025*Math.sin(3.1*d.y-2.2*d.z+1.7)+.02*Math.sin(4.2*d.x-1.5*d.y+2.6);
 return rE*n;
}
const skalPunkt=(u,v,ud)=>{const θ=u*TAU,φ=v*Math.PI,s=Math.sin(φ);ud.set(s*Math.cos(θ),Math.cos(φ),s*Math.sin(θ));return ud.multiplyScalar(celleRadius(ud));};
export function indeICelle(p,margen=0){const r=p.length();if(r<1e-9)return true;return r<celleRadius(p.clone().divideScalar(r))-margen;}
export function iKile(p){return p.y>YF&&p.z>ZA&&Math.abs(Math.atan2(p.x,p.z-ZA))<PSI;}
// Skæringspunkt mellem skallen og en stråle fra et indre punkt.
function ramSkal(start,retning){let lo=0,hi=14;for(let i=0;i<36;i++){const m=(lo+hi)/2;if(indeICelle(start.clone().addScaledVector(retning,m)))lo=m;else hi=m;}return start.clone().addScaledVector(retning,(lo+hi)/2);}

export function skabCelle(lærred){
 const renderer=new T.WebGLRenderer({canvas:lærred,antialias:true,alpha:true,preserveDrawingBuffer:true,powerPreference:'high-performance'});
 renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.outputColorSpace=T.SRGBColorSpace;
 renderer.setClearColor(0,0);renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.02;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.localClippingEnabled=true;
 const scene=new T.Scene(),rod=new T.Group();scene.add(rod);
 const kamera=new T.PerspectiveCamera(30,1,.1,100);
 const start={az:0,el:30*GRAD,afstand:17.5,mål:V(.2,-.2,.2)};
 let az=start.az,el=start.el,afstand=start.afstand;const mål=start.mål.clone();
 const materialer=new Set(),geometrier=new Set();
 function materiale(farve,ekstra={}){const m=new T.MeshPhysicalMaterial({color:farve,roughness:.5,metalness:0,clearcoat:.12,clearcoatRoughness:.5,...ekstra});materialer.add(m);return m;}
 function mesh(geo,mat,forælder,pos){const o=new T.Mesh(geo,mat);if(pos)o.position.set(...pos);o.castShadow=true;o.receiveShadow=true;geometrier.add(geo);materialer.add(mat);forælder.add(o);return o;}

 // Lys: blødt himmellys, et hovedlys med skygge, modlys og lidt fyld.
 scene.add(new T.HemisphereLight('#ffffff','#b9b09d',.95));
 const hovedlys=new T.DirectionalLight('#fff3e0',2.3);hovedlys.position.set(-6,11,8);hovedlys.castShadow=true;
 hovedlys.shadow.mapSize.set(2048,2048);Object.assign(hovedlys.shadow.camera,{left:-8,right:8,top:8,bottom:-8,near:1,far:40});
 hovedlys.shadow.normalBias=.03;hovedlys.shadow.bias=-.0002;hovedlys.shadow.radius=4;scene.add(hovedlys);
 const modlys=new T.DirectionalLight('#dde8ff',.8);modlys.position.set(7,3,-6);scene.add(modlys);
 const fyld=new T.DirectionalLight('#fff9ee',.5);fyld.position.set(-4,2,-8);scene.add(fyld);
 const miljøScene=new T.Scene();miljøScene.background=new T.Color('#9aa3a6');
 for(const [p,skala,farve] of [[[-4,7,4],[5,4],'#fff6e6'],[[6,3,-4],[4,6],'#dce9ff'],[[-6,1,-5],[3,3],'#dbe6e6']]){
  const o=new T.Mesh(new T.PlaneGeometry(...skala),new T.MeshBasicMaterial({color:farve,side:T.DoubleSide}));o.position.set(...p);o.lookAt(0,0,0);miljøScene.add(o);
 }
 const pmrem=new T.PMREMGenerator(renderer),miljø=pmrem.fromScene(miljøScene,.04);scene.environment=miljø.texture;scene.environmentIntensity=.4;pmrem.dispose();

 // ---------- Cellelegemet ----------
 const celleG=new T.Group();celleG.name='cellemembran';celleG.userData.id='cellemembran';rod.add(celleG);
 const cytoG=new T.Group();cytoG.name='cytoplasma';cytoG.userData.id='cytoplasma';rod.add(cytoG);
 // Kilen fjernes med tre klipplaner, der kun klipper i deres fællesmængde.
 const nA=V(-Math.cos(PSI),0,-Math.sin(PSI)),nB=V(Math.cos(PSI),0,-Math.sin(PSI));
 const planer=[new T.Plane(nA,-nA.dot(V(0,0,ZA))),new T.Plane(nB,-nB.dot(V(0,0,ZA))),new T.Plane(V(0,-1,0),YF)];
 const skalGeo=gitter(skalPunkt,200,100);geometrier.add(skalGeo);
 const skalBag=materiale(FARVER.membranInde,{side:T.BackSide,transparent:true,opacity:.6,depthWrite:false,roughness:.7,clippingPlanes:planer,clipIntersection:true});
 const skalFor=materiale(FARVER.membran,{transparent:true,opacity:.82,depthWrite:false,roughness:.42,clippingPlanes:planer,clipIntersection:true});
 const skalB=mesh(skalGeo,skalBag,celleG);skalB.renderOrder=21;skalB.castShadow=false;
 const skalF=mesh(skalGeo,skalFor,celleG);skalF.renderOrder=22;skalF.castShadow=false;
 // Snitfladerne: to lodrette vægge fra kilens spids og et gulv.
 const toppunkt=ramSkal(V(0,0,ZA),V(0,1,0)),apexGulv=V(0,YF,ZA);
 function væg(ψ){
  const d=V(Math.sin(ψ),0,Math.cos(ψ)),centrum=V(0,(YF+toppunkt.y)/2,ZA).addScaledVector(d,1);
  const gulvpunkt=ramSkal(apexGulv.clone(),d);
  const γ=p=>Math.atan2(p.y-centrum.y,p.clone().sub(centrum).dot(d));
  const γT=γ(toppunkt),γF=γ(gulvpunkt);
  const kurve=t=>{const a=γT+t*(γF-γT);return ramSkal(centrum.clone(),d.clone().multiplyScalar(Math.cos(a)).setY(Math.sin(a)).normalize());};
  const rand=(t,ud)=>{if(t<.72)return ud.copy(kurve(t/.72));if(t<.86)return ud.copy(gulvpunkt).lerp(apexGulv,(t-.72)/.14);return ud.copy(apexGulv).lerp(toppunkt,(t-.86)/.14);};
  return {kurve,gulvpunkt,flade:(u,v,ud)=>{rand(u,ud);return ud.lerp(centrum,1-v);}};
 }
 const vA=væg(-PSI),vB=væg(PSI);
 const cytoMat=materiale(FARVER.cytoplasma,{transparent:true,opacity:.6,depthWrite:false,side:T.DoubleSide,roughness:.8});
 for(const v of [vA,vB]){const m=mesh(gitter(v.flade,140,2),cytoMat,cytoG);m.renderOrder=20;m.castShadow=false;}
 const gulvHit=ψ=>ramSkal(apexGulv.clone(),V(Math.sin(ψ),0,Math.cos(ψ)));
 const gulv=mesh(gitter((u,v,ud)=>ud.copy(gulvHit(-PSI+u*2*PSI)).lerp(apexGulv,1-v),100,2),cytoMat,cytoG);gulv.renderOrder=20;gulv.castShadow=false;
 // Membranens snitkant som en tynd streg langs hele åbningen.
 const randKurve=(t,ud)=>{
  if(t<.3)return ud.copy(vA.kurve(t/.3));
  if(t<.7)return ud.copy(gulvHit(-PSI+(t-.3)/.4*2*PSI));
  return ud.copy(vB.kurve(1-(t-.7)/.3));
 };
 const rand=mesh(kurveRør(randKurve,420,.04,true),materiale(FARVER.membranKant,{roughness:.55}),celleG);rand.castShadow=false;
 // Blød kontaktskygge under cellen.
 const skyggeLærred=document.createElement('canvas');skyggeLærred.width=skyggeLærred.height=256;
 const sk=skyggeLærred.getContext('2d'),grad=sk.createRadialGradient(128,128,20,128,128,128);grad.addColorStop(0,'rgba(60,52,40,.28)');grad.addColorStop(1,'rgba(60,52,40,0)');sk.fillStyle=grad;sk.fillRect(0,0,256,256);
 const skyggeTekstur=new T.CanvasTexture(skyggeLærred);
 const skygge=new T.Mesh(new T.PlaneGeometry(14.5,12),new T.MeshBasicMaterial({map:skyggeTekstur,transparent:true,depthWrite:false}));skygge.rotation.x=-Math.PI/2;skygge.position.y=-B-.35;scene.add(skygge);

 const organeller=bygOrganeller({rod,materiale,mesh,indeICelle,iKile});
 const grupper={...organeller.grupper,cellemembran:celleG,cytoplasma:cytoG};
 const ankre={...organeller.ankre,cellemembran:gulvHit(-PSI).add(V(0,.04,0)),cytoplasma:V(2.6,YF,2.0)};
 const tilstand={kerne:0,mito:0};

 const ray=new T.Raycaster(),pointer=new T.Vector2();
 function tegn(){
  const d=afstand*Math.max(1,1.4/kamera.aspect);
  kamera.position.copy(mål).add(V(d*Math.cos(el)*Math.sin(az),d*Math.sin(el),d*Math.cos(el)*Math.cos(az)));
  kamera.lookAt(mål);kamera.updateMatrixWorld();renderer.render(scene,kamera);
  if(efterTegn)efterTegn();
 }
 let efterTegn=null;
 function størrelse(){const r=lærred.getBoundingClientRect();if(!r.width||!r.height)return;renderer.setSize(r.width,r.height,false);kamera.aspect=r.width/r.height;kamera.updateProjectionMatrix();tegn();}
 function åbn(id,v){tilstand[id]=v;organeller.åbn(id,v);tegn();}
 function vis(id,synlig){if(grupper[id])grupper[id].visible=synlig;tegn();}
 let valgt=null;
 function vælg(id){
  valgt=id;
  for(const [k,g] of Object.entries(grupper))g.traverse(o=>{if(o.isMesh&&o.material.emissive){o.material.emissive.set(k===id?'#2a2130':'#000000');o.material.emissiveIntensity=.14;}});
  tegn();
 }
 function fokuser(id){
  if(!id||id==='hele'){mål.copy(start.mål);afstand=start.afstand;}
  else{mål.copy(ankre[id]);afstand={kerne:8,mito:6,golgi:6.5,ruER:8,glatER:6.5,centriol:4.5,lysosom:5,vesikel:5,ribosom:6,cytoskelet:8,cellemembran:9,cytoplasma:9}[id]||7;}
  tegn();
 }
 function drej(dx,dy=0){az+=dx;el=Math.min(1.35,Math.max(-.25,el+dy));tegn();}
 function zoom(f){afstand=Math.min(30,Math.max(3.5,afstand*f));tegn();}
 function nulstil(){for(const g of Object.values(grupper))g.visible=true;az=start.az;el=start.el;afstand=start.afstand;mål.copy(start.mål);vælg(null);åbn('kerne',0);åbn('mito',0);}
 function ram(x,y){
  const r=lærred.getBoundingClientRect();pointer.set((x-r.left)/r.width*2-1,-((y-r.top)/r.height*2-1));ray.setFromCamera(pointer,kamera);
  const kandidater=Object.values(organeller.grupper).filter(g=>g.visible);
  for(const hit of ray.intersectObjects(kandidater,true)){let o=hit.object;while(o&&!o.userData.id)o=o.parent;if(o)return o.userData.id;}
  return null;
 }
 const tmp=V();
 function projicer(p){tmp.copy(p).project(kamera);const r=lærred.getBoundingClientRect();return {x:(tmp.x+1)/2*r.width,y:(1-tmp.y)/2*r.height,foran:tmp.z<1};}
 function målData(){
  const bbox=g=>{const b=new T.Box3().setFromObject(g);return{min:b.min.toArray(),max:b.max.toArray()};};
  return {åbning:{...tilstand},grupper:Object.fromEntries(Object.entries(grupper).map(([k,g])=>[k,{synlig:g.visible,...bbox(g)}])),tegninger:renderer.info.render.calls,trekanter:renderer.info.render.triangles,kamera:{az,el,afstand}};
 }
 størrelse();
 return {tegn,størrelse,åbn,vis,vælg,fokuser,drej,zoom,nulstil,ram,projicer,ankre,målData,
  set efterTegn(f){efterTegn=f;},
  dispose(){renderer.dispose();for(const g of geometrier)g.dispose();for(const m of materialer)m.dispose();skyggeTekstur.dispose();miljø.dispose();}};
}
