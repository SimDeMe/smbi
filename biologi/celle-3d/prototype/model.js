import {T,V,celleSkal,celleRadius,støj} from './geometri.js';
import {bygOrganeller} from './organeller.js';

// Hel celle set udefra gennem en gennemsigtig, let iriserende membran,
// som i lærebogsanimationer. Organellerne ligger frit i cytoplasmaet.
const START={az:.35,el:.5,afstand:21};

export function skabPrototype(lærred){
 const renderer=new T.WebGLRenderer({canvas:lærred,antialias:true,alpha:true,preserveDrawingBuffer:true,powerPreference:'low-power'});
 renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.7));renderer.outputColorSpace=T.SRGBColorSpace;
 renderer.setClearColor(0,0);renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
 const scene=new T.Scene(),rod=new T.Group();scene.add(rod);
 // Svag tåge i baggrundens farve giver dybde: organeller bagest i cellen bliver blegere.
 scene.fog=new T.FogExp2('#4f9ea4',.009);
 const kamera=new T.PerspectiveCamera(30,1,.1,200);let {az,el,afstand}=START;const mål=V(0,0,0);
 const materialer=new Set(),geometrier=new Set();
 // Blød, flisebar støjtekstur: rynker i membranen og en mat overflade på organellerne.
 const N=256,strukturCanvas=document.createElement('canvas');strukturCanvas.width=strukturCanvas.height=N;
 const sc=strukturCanvas.getContext('2d'),data=sc.createImageData(N,N);
 for(let y=0;y<N;y++)for(let x=0;x<N;x++){
  const a=x/N*Math.PI*2,b=y/N*Math.PI*2;let v=0,f=1,amp=1;
  for(let o=0;o<3;o++){v+=amp*støj(Math.cos(a)*f*1.6+9,Math.sin(a)*f*1.6+Math.cos(b)*f*1.6,Math.sin(b)*f*1.6);f*=2.1;amp*=.5;}
  const g=128+v*70;data.data.set([g,g,g,255],(y*N+x)*4);
 }
 sc.putImageData(data,0,0);
 const struktur=new T.CanvasTexture(strukturCanvas);struktur.wrapS=struktur.wrapT=T.RepeatWrapping;struktur.repeat.set(3,3);
 function materiale(farve,ekstra={}){const m=new T.MeshPhysicalMaterial({color:farve,roughness:.45,metalness:0,clearcoat:.15,clearcoatRoughness:.4,bumpMap:struktur,bumpScale:.6,...ekstra});materialer.add(m);return m;}
 function mesh(geo,mat,g,pos){const o=new T.Mesh(geo,mat);if(pos)o.position.set(...pos);o.castShadow=true;o.receiveShadow=true;geometrier.add(geo);materialer.add(mat);g.add(o);return o;}

 scene.add(new T.HemisphereLight('#f2fbff','#3e6870',1.15));
 const hovedlys=new T.DirectionalLight('#fff3e8',2.6);hovedlys.position.set(-7,10,9);hovedlys.castShadow=true;hovedlys.shadow.mapSize.set(2048,2048);
 Object.assign(hovedlys.shadow.camera,{left:-6,right:6,top:6,bottom:-6,near:2,far:30});hovedlys.shadow.normalBias=.03;hovedlys.shadow.radius=5;scene.add(hovedlys);
 const modlys=new T.DirectionalLight('#bdf0ff',1.9);modlys.position.set(8,3,-9);scene.add(modlys);
 const fyld=new T.DirectionalLight('#ffe9f1',.6);fyld.position.set(4,-6,6);scene.add(fyld);
 // Brede studioreflekser i baggrundens turkis giver bløde highlights og membranens skær.
 const miljøScene=new T.Scene();miljøScene.background=new T.Color('#3d8890');
 for(const[p,skala,farve]of[[[-4,7,4],[6,4],'#fff4e6'],[[6,3,-4],[4,6],'#bff3ff'],[[-6,-2,-5],[4,3],'#ffd9e6'],[[3,-6,4],[5,3],'#9fe0da']]){
  const o=new T.Mesh(new T.PlaneGeometry(...skala),new T.MeshBasicMaterial({color:farve,side:T.DoubleSide}));o.position.set(...p);o.lookAt(0,0,0);miljøScene.add(o);
 }
 const pmrem=new T.PMREMGenerator(renderer),miljø=pmrem.fromScene(miljøScene,.04);scene.environment=miljø.texture;scene.environmentIntensity=.45;pmrem.dispose();

 // Cellemembranen: forside, bagside og en lys randkontur (fresnel), som får cellen til at stå frem.
 const skalGeo=celleSkal();geometrier.add(skalGeo);
 const membranMat=materiale('#c0607f',{transparent:true,opacity:.42,roughness:.4,clearcoat:.45,clearcoatRoughness:.25,iridescence:.7,iridescenceIOR:1.35,iridescenceThicknessRange:[180,620],bumpScale:5,depthWrite:false,side:T.FrontSide});
 const membran=mesh(skalGeo,membranMat,rod);membran.renderOrder=10;membran.castShadow=membran.receiveShadow=false;
 const bagMat=materiale('#a8587e',{transparent:true,opacity:.2,roughness:.6,side:T.BackSide,depthWrite:false});
 const bagside=mesh(skalGeo,bagMat,rod);bagside.renderOrder=1;bagside.castShadow=bagside.receiveShadow=false;
 const randMat=new T.ShaderMaterial({
  uniforms:{farve:{value:new T.Color('#ffd6e4')},styrke:{value:.6}},
  vertexShader:'varying vec3 vN;varying vec3 vV;void main(){vec4 w=modelMatrix*vec4(position,1.);vN=normalize(mat3(modelMatrix)*normal);vV=normalize(cameraPosition-w.xyz);gl_Position=projectionMatrix*viewMatrix*w;}',
  fragmentShader:'uniform vec3 farve;uniform float styrke;varying vec3 vN;varying vec3 vV;void main(){float f=pow(1.-abs(dot(normalize(vN),normalize(vV))),2.6);gl_FragColor=vec4(farve*f*styrke,f*styrke);\n#include <colorspace_fragment>\n}',
  transparent:true,depthWrite:false,blending:T.AdditiveBlending
 });materialer.add(randMat);
 const rand=new T.Mesh(skalGeo,randMat);rand.renderOrder=11;rod.add(rand);
 // Cytoplasmaet: svag blålig dis inde i cellen.
 const cytoGeo=celleSkal(.985);geometrier.add(cytoGeo);
 const cytoMat=new T.MeshBasicMaterial({color:'#6fb8c8',transparent:true,opacity:.12,side:T.BackSide,depthWrite:false});materialer.add(cytoMat);
 const cyto=new T.Mesh(cytoGeo,cytoMat);cyto.renderOrder=0;rod.add(cyto);

 const organeller=bygOrganeller({rod,materiale,mesh});
 const ray=new T.Raycaster(),pointer=new T.Vector2();
 const tilstand={kerne:0,mito:0,gennemsigtighed:45};
 function tegn(){
  const visningsAfstand=afstand*Math.max(1,1.3/kamera.aspect);
  kamera.position.copy(mål).add(V(visningsAfstand*Math.cos(el)*Math.sin(az),visningsAfstand*Math.sin(el),visningsAfstand*Math.cos(el)*Math.cos(az)));
  kamera.lookAt(mål);kamera.updateMatrixWorld();renderer.render(scene,kamera);
 }
 function størrelse(){const r=lærred.getBoundingClientRect();if(!r.width||!r.height)return;renderer.setSize(r.width,r.height,false);kamera.aspect=r.width/r.height;kamera.updateProjectionMatrix();tegn();}
 function åbn(id,værdi){tilstand[id]=værdi;organeller.åbn(id,værdi);tegn();}
 function vælg(id){
  for(const[k,g]of Object.entries(organeller.grupper))g.traverse(o=>{
   if(!(o.isMesh&&o.material.emissive))return;
   if(!o.userData.unikMat){o.material=o.material.clone();materialer.add(o.material);o.userData.unikMat=true;}
   o.material.emissive.set(k===id?'#3a3040':'#000000');o.material.emissiveIntensity=.5;
  });
  tegn();
 }
 function vis(id,synlig){if(organeller.grupper[id])organeller.grupper[id].visible=synlig;tegn();}
 function fokuser(id){
  if(id==='hele'||!organeller.ankre[id]){mål.set(0,0,0);afstand=START.afstand;}
  else{mål.copy(organeller.ankre[id]);afstand=id==='kerne'||id==='ruER'?13:9.5;}
  tegn();
 }
 // Skyderen styrer membranens dækkeevne; randkonturen bevares, så cellens form altid kan ses.
 function gennemsigtighed(v){tilstand.gennemsigtighed=v;const f=v/100;membranMat.opacity=.75-.68*f;bagMat.opacity=.32*(1-f)+.04;cytoMat.opacity=.24*(1-f)+.03;tegn();}
 function drej(dx,dy=0){az+=dx;el=Math.min(1.45,Math.max(-1.45,el+dy));tegn();}
 function zoom(faktor){afstand=Math.min(42,Math.max(6,afstand*faktor));tegn();}
 function nulstil(){for(const g of Object.values(organeller.grupper))g.visible=true;({az,el,afstand}=START);mål.set(0,0,0);vælg('hele');åbn('kerne',0);åbn('mito',0);gennemsigtighed(45);}
 function ram(x,y){
  const r=lærred.getBoundingClientRect();pointer.set((x-r.left)/r.width*2-1,-((y-r.top)/r.height*2-1));ray.setFromCamera(pointer,kamera);
  for(const hit of ray.intersectObjects(Object.values(organeller.grupper).filter(g=>g.visible),true)){let o=hit.object;while(o&&!o.userData.id)o=o.parent;if(o)return o.userData.id;}
  return null;
 }
 function målData(){
  const kasse=g=>{const b=new T.Box3().setFromObject(g),c=b.getCenter(V(0,0,0)),s=b.getSize(V(0,0,0));return{midte:c.toArray(),størrelse:s.toArray(),yderst:c.length()+s.length()/2};};
  const p=skalGeo.attributes.position;let min=Infinity,max=0;for(let i=0;i<p.count;i++){const l=Math.hypot(p.getX(i),p.getY(i),p.getZ(i));min=Math.min(min,l);max=Math.max(max,l);}
  // Største forhold mellem et organelpunkt og membranens radius i samme retning (<1 = indenfor).
  const v=V(0,0,0),m=new T.Matrix4(),indenfor={};
  rod.updateMatrixWorld(true);
  for(const[id,g]of Object.entries(organeller.grupper)){let størst=0;g.traverse(o=>{
   if(!o.isMesh)return;const pos=o.geometry.attributes.position;
   const mål=w=>{const l=w.length();if(l>1e-6)størst=Math.max(størst,l/celleRadius(w.x/l,w.y/l,w.z/l));};
   if(o.isInstancedMesh)for(let i=0;i<o.count;i++){o.getMatrixAt(i,m);const c=V(0,0,0).applyMatrix4(m).applyMatrix4(o.matrixWorld);c.setLength(c.length()+m.getMaxScaleOnAxis()*o.matrixWorld.getMaxScaleOnAxis());mål(c);}
   else for(let i=0;i<pos.count;i+=3){v.fromBufferAttribute(pos,i).applyMatrix4(o.matrixWorld);mål(v);}
  });indenfor[id]=størst;}
  return{celle:{min,max},indenfor,kerne:kasse(organeller.grupper.kerne),ruER:kasse(organeller.grupper.ruER),mitokondrier:organeller.grupper.mito.children.map(kasse),golgi:organeller.grupper.golgi.children.map(kasse),åbning:{...tilstand},tegninger:renderer.info.render.calls,trekanter:renderer.info.render.triangles};
 }
 åbn('kerne',0);åbn('mito',0);gennemsigtighed(45);størrelse();
 return{tegn,størrelse,åbn,vælg,vis,fokuser,gennemsigtighed,drej,zoom,nulstil,ram,målData,dispose(){renderer.dispose();for(const g of geometrier)g.dispose();for(const m of materialer)m.dispose();struktur.dispose();miljø.dispose();}};
}
