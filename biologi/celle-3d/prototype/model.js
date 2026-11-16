import {T,V,rør,SNIT,cellePunkt,celleTheta,celleSkal,snitFlade,tilfældig} from './geometri.js';
import {bygOrganeller} from './organeller.js';

export function skabPrototype(lærred){
 const renderer=new T.WebGLRenderer({canvas:lærred,antialias:true,alpha:true,preserveDrawingBuffer:true,powerPreference:'low-power'});
 renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.7));renderer.outputColorSpace=T.SRGBColorSpace;
 renderer.setClearColor(0,0);renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.0;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
 const scene=new T.Scene(),rod=new T.Group();scene.add(rod);
 const kamera=new T.PerspectiveCamera(33,1,.1,100);let az=.32,el=.62,afstand=17.8,mål=V(0,-.5,0);
 const materialer=new Set(),geometrier=new Set();
 // En meget svag overfladestruktur bryder det blanke plastudtryk.
 const strukturCanvas=document.createElement('canvas');strukturCanvas.width=strukturCanvas.height=128;const sc=strukturCanvas.getContext('2d'),data=sc.createImageData(128,128);
 for(let i=0;i<128*128;i++){const v=118+tilfældig(i)*26;data.data.set([v,v,v,255],i*4);}sc.putImageData(data,0,0);
 const struktur=new T.CanvasTexture(strukturCanvas);struktur.wrapS=struktur.wrapT=T.RepeatWrapping;struktur.repeat.set(4,4);
 function materiale(farve,ekstra={}){const m=new T.MeshPhysicalMaterial({color:farve,roughness:.48,metalness:0,clearcoat:.1,clearcoatRoughness:.55,bumpMap:struktur,bumpScale:.017,...ekstra});m.userData.farve=m.color.clone();materialer.add(m);return m;}
 function mesh(geo,mat,g,pos){const o=new T.Mesh(geo,mat);if(pos)o.position.set(...pos);o.castShadow=true;o.receiveShadow=true;geometrier.add(geo);materialer.add(mat);g.add(o);return o;}
 scene.add(new T.HemisphereLight('#eef4ff','#9a9b88',1.25));
 const hovedlys=new T.DirectionalLight('#fff1df',3.1);hovedlys.position.set(-5,11,7);hovedlys.castShadow=true;hovedlys.shadow.mapSize.set(2048,2048);Object.assign(hovedlys.shadow.camera,{left:-8,right:8,top:8,bottom:-8,near:1,far:35});hovedlys.shadow.normalBias=.025;hovedlys.shadow.bias=-.0003;hovedlys.shadow.radius=4;scene.add(hovedlys);
 const modlys=new T.DirectionalLight('#d4e6ff',1.4);modlys.position.set(6,4,-7);scene.add(modlys);
 const fyld=new T.DirectionalLight('#fff9ee',.7);fyld.position.set(-8,1,-3);scene.add(fyld);
 // Brede studioreflekser giver bløde highlights på krumme membraner.
 const miljøScene=new T.Scene();miljøScene.background=new T.Color('#8b969b');
 for(const[p,skala,farve]of[[[-4,7,4],[5,4,1],'#fff4df'],[[6,3,-4],[4,6,1],'#d8e8ff'],[[-6,1,-5],[3,3,1],'#d6e3e3']]){
  const o=new T.Mesh(new T.PlaneGeometry(...skala.slice(0,2)),new T.MeshBasicMaterial({color:farve,side:T.DoubleSide}));o.position.set(...p);o.lookAt(0,0,0);miljøScene.add(o);
 }
 const pmrem=new T.PMREMGenerator(renderer),miljø=pmrem.fromScene(miljøScene,.04);scene.environment=miljø.texture;scene.environmentIntensity=.45;pmrem.dispose();
 // Cellelegemet fortsætter flere enheder under snittet. Der er ingen bundplade under organellerne.
 const membranMat=materiale('#c9999c',{transparent:true,opacity:.72,roughness:.38,depthWrite:false,side:T.FrontSide});
 const celle=mesh(celleSkal(),membranMat,rod);celle.renderOrder=5;celle.castShadow=false;
 const celleInderside=mesh(celleSkal(),materiale('#c9d3be',{transparent:true,opacity:.18,side:T.BackSide,depthWrite:false,roughness:.75}),rod);celleInderside.scale.set(.99,.99,.99);celleInderside.renderOrder=4;celleInderside.castShadow=false;
 const gelMat=materiale('#c8d7c4',{transparent:true,opacity:.30,depthWrite:false,roughness:.54,clearcoat:.06});
 const gel=mesh(snitFlade(),gelMat,rod);gel.renderOrder=6;gel.castShadow=false;
 const randPunkter=Array.from({length:144},(_,i)=>cellePunkt(i/144*Math.PI*2,celleTheta));
 const rand=mesh(rør(randPunkter,.035,true,320),materiale('#dbb5b3',{roughness:.5}),rod);rand.castShadow=false;
 const organeller=bygOrganeller({rod,materiale,mesh});
 // Kontaktskygge følger hele cellelegemet, ikke hver organel som en løs genstand på et bord.
 const skyggeCanvas=document.createElement('canvas');skyggeCanvas.width=skyggeCanvas.height=128;const cx=skyggeCanvas.getContext('2d'),grad=cx.createRadialGradient(64,64,10,64,64,64);grad.addColorStop(0,'rgba(42,46,49,.25)');grad.addColorStop(1,'rgba(42,46,49,0)');cx.fillStyle=grad;cx.fillRect(0,0,128,128);
 const skyggeTekstur=new T.CanvasTexture(skyggeCanvas),skygge=mesh(new T.PlaneGeometry(14,11),new T.MeshBasicMaterial({map:skyggeTekstur,transparent:true,depthWrite:false}),scene,[0,-3.55,0]);skygge.rotation.x=-Math.PI/2;skygge.castShadow=false;
 const ray=new T.Raycaster(),pointer=new T.Vector2();let valgt='hele';
 const tilstand={kerne:0,mito:0,gennemsigtighed:45};
 function tegn(){
  const visningsAfstand=afstand*Math.max(1,1.35/kamera.aspect);
  kamera.position.copy(mål).add(V(visningsAfstand*Math.cos(el)*Math.sin(az),visningsAfstand*Math.sin(el),visningsAfstand*Math.cos(el)*Math.cos(az)));kamera.lookAt(mål);kamera.updateMatrixWorld();renderer.render(scene,kamera);
 }
 function størrelse(){const r=lærred.getBoundingClientRect();renderer.setSize(r.width,r.height,false);kamera.aspect=r.width/r.height;kamera.updateProjectionMatrix();tegn();}
 function åbn(id,værdi){tilstand[id]=værdi;organeller.åbn(id,værdi);tegn();}
 function vælg(id){valgt=id;for(const[k,g]of Object.entries(organeller.grupper))g.traverse(o=>{if(o.isMesh&&o.material.emissive){if(!o.userData.unikMat){o.material=o.material.clone();materialer.add(o.material);o.userData.unikMat=true;}o.material.emissive.set(k===id?'#25202a':'#000000');o.material.emissiveIntensity=.12;}});tegn();}
 function fokuser(id){if(id==='hele'){mål.set(0,-.5,0);afstand=17.8;}else{mål.copy(organeller.ankre[id]||V(0,0,0));afstand=id==='kerne'?8.5:id==='mito'?8.8:10;}tegn();}
 function gennemsigtighed(v){tilstand.gennemsigtighed=v;const f=v/100;gelMat.opacity=.52*(1-f)+.03;membranMat.opacity=.9-.5*f;celleInderside.material.opacity=.23*(1-f)+.03;tegn();}
 function drej(dx,dy=0){az+=dx;el=Math.min(1.35,Math.max(.12,el+dy));tegn();}
 function zoom(faktor){afstand=Math.min(28,Math.max(6,afstand*faktor));tegn();}
 function nulstil(){az=.32;el=.62;afstand=17.8;mål.set(0,-.5,0);vælg('hele');åbn('kerne',0);åbn('mito',0);gennemsigtighed(45);}
 function ram(x,y){const r=lærred.getBoundingClientRect();pointer.set((x-r.left)/r.width*2-1,-((y-r.top)/r.height*2-1));ray.setFromCamera(pointer,kamera);for(const hit of ray.intersectObjects(Object.values(organeller.grupper),true)){let o=hit.object;while(o&&!o.userData.id)o=o.parent;if(o)return o.userData.id;}return null;}
 function målData(){
  const bounds=g=>{const b=new T.Box3().setFromObject(g);return{bund:b.min.y,top:b.max.y,midte:(b.min.y+b.max.y)/2};};
  const cb=bounds(celle);
  return {snithøjde:SNIT,cellelegeme:{...cb,dybde:SNIT-cb.bund},kerne:bounds(organeller.grupper.kerne),mitokondrier:organeller.grupper.mito.children.map(bounds),åbning:{...tilstand},tegninger:renderer.info.render.calls,trekanter:renderer.info.render.triangles};
 }
 gennemsigtighed(45);størrelse();
 return{tegn,størrelse,åbn,vælg,fokuser,gennemsigtighed,drej,zoom,nulstil,ram,målData,dispose(){renderer.dispose();for(const g of geometrier)g.dispose();for(const m of materialer)m.dispose();struktur.dispose();skyggeTekstur.dispose();miljø.dispose();}};
}
