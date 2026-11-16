// Fælles rigtig 3D-model. Three.js 0.169.0 (MIT), leveret lokalt.
// Mål og antal er illustrative. Snittet åbner cellen og kernen for indblik.
import * as T from './vendor/three.module.min.js';

export const FAGORD=['cellemembran','cytoplasma','cellekerne','kernemembran','ruER','glatER','golgi','ribosom','mitokondrie','lysosom','vesikel'];
const V=(x,y,z)=>new T.Vector3(x,y,z);
const verdensankre={cellemembran:[-4.6,0,2.65],cytoplasma:[-.6,.04,3.5],cellekerne:[-.65,1.9,.02],kernemembran:[-1.45,1.0,-.04],ruER:[2.05,1.25,-.4],glatER:[-2.85,.6,.5],golgi:[2.6,.9,2.1],mitokondrie:[-2.9,.42,2.3],lysosom:[-3.8,.3,1.2],ribosom:[1,.22,3.15],vesikel:[4,.5,1.4]};
export const zoomAnker=[5.45,0,1.45];
function kameraTil(b=1000,h=640){const aspect=b/h,hh=6.15;const k=new T.OrthographicCamera(-hh*aspect,hh*aspect,hh,-hh,.1,80);k.position.set(7.8,11.5,15.5);k.lookAt(0,.3,0);k.updateMatrixWorld();return k;}
export function projektér(anker,b=1000,h=640,vinkel=0){const p=V(...anker);p.applyAxisAngle(V(0,1,0),vinkel);p.project(kameraTil(b,h));return[(p.x+1)*b/2,(1-p.y)*h/2];}
export function fagordsankre(vinkel=0){return Object.fromEntries(Object.entries(verdensankre).map(([k,v])=>[k,projektér(v,1000,640,vinkel)]));}

export function skabDyrecelle({bredde=1000,højde=640}={}) {
 const renderer=new T.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true,powerPreference:'low-power'});
 renderer.setSize(bredde,højde);renderer.setPixelRatio(1);
 renderer.setClearColor(0x000000,0);renderer.outputColorSpace=T.SRGBColorSpace;
 renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.localClippingEnabled=true;
 const scene=new T.Scene(),kamera=kameraTil(bredde,højde),rod=new T.Group();scene.add(rod);
 const grupper=Object.fromEntries(FAGORD.map(k=>{const g=new T.Group();g.name=k;rod.add(g);return[k,g];}));
 scene.add(new T.HemisphereLight(0xe5f8ff,0x6b8591,1.4));
 const lys=new T.DirectionalLight(0xfff4dc,3.2);lys.position.set(-6,12,8);lys.castShadow=true;lys.shadow.mapSize.set(2048,2048);Object.assign(lys.shadow.camera,{left:-8,right:8,top:8,bottom:-8,near:1,far:40});lys.shadow.bias=-.0006;lys.shadow.normalBias=.025;lys.shadow.radius=3;scene.add(lys);
 const kantlys=new T.DirectionalLight(0xc6f6ff,1.5);kantlys.position.set(5,5,-9);scene.add(kantlys);
 const blød=new T.DirectionalLight(0xffffff,.55);blød.position.set(-8,2,-4);scene.add(blød);
 const materialer=[];
 function mat(farve,ekstra={}){const m=new T.MeshPhysicalMaterial({color:farve,roughness:.36,metalness:0,clearcoat:.24,clearcoatRoughness:.35,...ekstra});m.userData.farve=m.color.clone();materialer.push(m);return m;}
 function mesh(geo,m,gruppe,pos){const o=new T.Mesh(geo,m);if(pos)o.position.set(...pos);o.castShadow=true;o.receiveShadow=true;gruppe.add(o);return o;}
 const kugle=new T.SphereGeometry(1,28,20);
 function sfære(g,pos,skala,m){const o=mesh(kugle,m,g,pos);o.scale.set(...(Array.isArray(skala)?skala:[skala,skala,skala]));return o;}
 function rør(g,punkter,r,m,lukket=false){const kurve=new T.CatmullRomCurve3(punkter.map(p=>Array.isArray(p)?V(...p):p),lukket,'centripetal');return mesh(new T.TubeGeometry(kurve,Math.max(24,punkter.length*6),r,7,lukket),m,g);}
 const cyan=mat('#0b91ae'),lysCyan=mat('#71d6e0'),cyto=mat('#b2e2e4',{roughness:.62}),erTop=mat('#20a9ba'),erSide=mat('#087184'),gul=mat('#e8b43a',{roughness:.32}),violet=mat('#a3a0d1'),orange=mat('#ef9b2e'),orangeSide=mat('#bd681e');
 // Åbent, skåret cellelegeme med tynd membranrand og en lys snitflade.
 const bund=mesh(new T.SphereGeometry(1,96,32,0,Math.PI*2,Math.PI/2,Math.PI/2),cyan,grupper.cellemembran);bund.scale.set(5.8,1.65,4.4);
 const indre=mesh(new T.SphereGeometry(1,80,28,0,Math.PI*2,Math.PI/2,Math.PI/2),cyto,grupper.cytoplasma,[0,.03,0]);indre.scale.set(5.65,1.5,4.25);
 const flade=mesh(new T.CircleGeometry(1,96),cyto,grupper.cytoplasma,[0,.045,0]);flade.rotation.x=-Math.PI/2;flade.scale.set(5.65,4.25,1);
 const rand=Array.from({length:96},(_,i)=>{const a=i*Math.PI*2/96;return[5.77*Math.cos(a),0,4.37*Math.sin(a)];});rør(grupper.cellemembran,rand,.075,lysCyan,true);
 const randIndre=rand.map(([x,y,z])=>[x*.977,y+.02,z*.977]);rør(grupper.cellemembran,randIndre,.025,cyan,true);
 // Tykke, foldede ER-membraner. Begge områder bruger nøjagtigt samme geometri.
 function erFlade(i,spejl=1){const punkter=[],norm=[],uv=[],indeks=[],N=60,M=7,tyk=.065;
  function punkt(j,k,lag){const t=j/N,a=-1.1+t*2.45,r=1.9+k/M*.95*(.3+.7*Math.sin(t*Math.PI)**.4)+.12*Math.sin(t*19+i*.5),y=.3+i*.29+.17*Math.sin(t*13+i*.7)-lag*tyk;return[spejl*(Math.cos(a)*r)-.25,y,Math.sin(a)*r-.85];}
  for(let l=0;l<2;l++)for(let j=0;j<=N;j++)for(let k=0;k<=M;k++){punkter.push(...punkt(j,k,l));uv.push(j/N,k/M);}
  const offset=(N+1)*(M+1),idx=(l,j,k)=>l*offset+j*(M+1)+k;
  for(let l=0;l<2;l++)for(let j=0;j<N;j++)for(let k=0;k<M;k++){const a=idx(l,j,k),b=idx(l,j+1,k),c=idx(l,j+1,k+1),d=idx(l,j,k+1);indeks.push(a,b,d,b,c,d);}
  for(let j=0;j<N;j++)for(const k of[0,M]){const a=idx(0,j,k),b=idx(0,j+1,k),c=idx(1,j+1,k),d=idx(1,j,k);indeks.push(a,b,d,b,c,d);}
  for(const j of[0,N])for(let k=0;k<M;k++){const a=idx(0,j,k),b=idx(0,j,k+1),c=idx(1,j,k+1),d=idx(1,j,k);indeks.push(a,b,d,b,c,d);}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(punkter,3));geo.setIndex(indeks);geo.computeVertexNormals();return {geo,punkt};
 }
 erTop.side=T.DoubleSide;
 for(const [ord,spejl]of[['ruER',1],['glatER',-1]])for(let i=0;i<6;i++){
  const {geo,punkt}=erFlade(i,spejl);mesh(geo,erTop,grupper[ord]);
  for(const kant of[0,7]){const kantpunkter=Array.from({length:61},(_,j)=>punkt(j,kant,0));rør(grupper[ord],kantpunkter,.025,lysCyan);}
  if(ord==='ruER')for(let j=5;j<59;j+=6)for(const k of[2,5]){const p=punkt(j,k,0);p[1]+=.1;sfære(grupper[ord],p,.082,gul);}
 }
 // Cellekerne med en åben snitflade, en rumlig membran og løst kromatin.
 const kc=[-.35,1.65,-.85],kr=1.52,zSnit=-.08;
 const skal=mat('#8e91c9',{clippingPlanes:[new T.Plane(V(0,0,-1),zSnit)],clipShadows:true});
 sfære(grupper.cellekerne,kc,[kr,kr*.97,kr],skal);
 const snitRadius=Math.sqrt(kr*kr-(zSnit-kc[2])**2),snitMat=mat('#c0bfdf',{roughness:.65});
 const snit=mesh(new T.CircleGeometry(snitRadius,80),snitMat,grupper.cellekerne,[kc[0],kc[1],zSnit+.003]);snit.scale.y=.97;
 const ring=Array.from({length:80},(_,i)=>{const a=i*Math.PI*2/80;return[kc[0]+Math.cos(a)*snitRadius,kc[1]+Math.sin(a)*snitRadius*.97,zSnit+.015];});rør(grupper.kernemembran,ring,.055,mat('#737eae'),true);rør(grupper.kernemembran,ring.map(([x,y,z])=>[kc[0]+(x-kc[0])*.955,kc[1]+(y-kc[1])*.955,z+.014]),.018,mat('#dde0f2'),true);
 const dna=mat('#9073b6',{roughness:.65});
 for(let j=0;j<8;j++){const pts=[];for(let i=0;i<24;i++){const t=i/23,x=kc[0]+(t-.5)*1.8,y=kc[1]-.85+j*.23+.085*Math.sin(t*19+j);if((x-kc[0])**2+((y-kc[1])/.97)**2<(snitRadius-.13)**2)pts.push([x,y,zSnit+.035]);}if(pts.length>3)rør(grupper.cellekerne,pts,.018,dna);}
 const pore=mat('#586a9e');for(let j=0;j<20;j++){const a=j*2.399,y=.3+(j%5)*.38;const x=kc[0]+Math.cos(a)*kr*.9,z=kc[2]+Math.sin(a)*kr*.9;if(z<zSnit-.12)sfære(grupper.kernemembran,[x,kc[1]+(y-1),z],[.055,.06,.035],pore);}
 // Golgi: krumme, flade sække med mørkere sider og runde kanter.
 for(let i=0;i<5;i++){
  const punkter=[],N=40;for(let j=0;j<=N;j++){const t=j/N;punkter.push(V(1.4+t*2.1,.27+i*.27,1.85+Math.sin(t*Math.PI)*.55+i*.065));}
  const kurve=new T.CatmullRomCurve3(punkter);const geo=new T.TubeGeometry(kurve,48,.29,10,false);const o=mesh(geo,orange,grupper.golgi);o.scale.y=.32; // egen lodret placering efter udfladning
  o.position.y=(.27+i*.27)*.68;
  const kantPunkter=punkter.map(p=>[p.x,p.y+.09,p.z+.2]);rør(grupper.golgi,kantPunkter,.025,mat('#ffd278'));
 }
 // Gennemskårne mitokondrier: mørk matrix og rumligt foldet indre membran.
 const mitoY=.42,mitoMat=mat('#3eacbd'),matrix=mat('#26697e',{roughness:.65}),crista=mat('#71d1d7');
 function mito(pos,rotation,l=1.3){const g=new T.Group();g.position.set(...pos);g.rotation.y=rotation;grupper.mitokondrie.add(g);
  const skalMat=mat('#3eacbd',{clippingPlanes:[new T.Plane(V(0,-1,0),pos[1]+.1)],clipShadows:true});sfære(g,[0,0,0],[l,.39,.56],skalMat);
  const c=mesh(new T.CircleGeometry(1,64),matrix,g,[0,.103,0]);c.rotation.x=-Math.PI/2;c.scale.set(l*.965,.54,1);
  const kantP=Array.from({length:64},(_,j)=>{const a=j/64*Math.PI*2;return[Math.cos(a)*l*.97,.11,Math.sin(a)*.545];});rør(g,kantP,.035,crista,true);
  for(let j=0;j<8;j++){const x=-l+.22+j*(l*2-.44)/7;const zmax=.44*Math.sqrt(1-(x/l)**2);const p=[];for(let k=0;k<=12;k++){const t=k/12;p.push([x+.075*Math.sin(t*Math.PI*2),.12+.11*Math.sin(t*Math.PI)**2,(t*2-1)*zmax]);}rør(g,p,.035,crista);}
 }
 mito([-3.1,mitoY,2.1],-.7,1.12);mito([-.15,mitoY,3.05],.1,1.3);mito([-4,.4,-.65],.85,.95);
 // Frie ribosomer, lysosomer og vesikler.
 [[1,.19,3.15],[-1.6,.18,2.7],[-2.1,.18,3.5],[3.8,.18,2.2],[-4.3,.18,1.7],[.2,.2,2.3],[1.4,.19,2.9],[3.8,.2,-1.5],[-1.7,.2,-3]].forEach(p=>sfære(grupper.ribosom,p,.085,gul));
 const lyso=mat('#ac8ec8');for(const p of[[-3.8,.3,1.2],[-2.2,.3,2.9]]){sfære(grupper.lysosom,p,.28,lyso);for(let i=0;i<5;i++)sfære(grupper.lysosom,[p[0]+.18*Math.cos(i*2.4),p[1]+.15,p[2]+.18*Math.sin(i*2.4)],.035,dna);}
 for(const p of[[4,.5,1.4],[3.8,.55,.5],[3.6,.45,2.45]])sfære(grupper.vesikel,p,.2,mat('#e8b45e',{roughness:.24}));
 // Svag kontaktskygge uden en synlig gulvplade.
 const skyggeCanvas=document.createElement('canvas');skyggeCanvas.width=128;skyggeCanvas.height=128;const c=skyggeCanvas.getContext('2d'),gr=c.createRadialGradient(64,64,15,64,64,63);gr.addColorStop(0,'rgba(22,54,58,.24)');gr.addColorStop(1,'rgba(22,54,58,0)');c.fillStyle=gr;c.fillRect(0,0,128,128);
 const skygge=mesh(new T.PlaneGeometry(14,11),new T.MeshBasicMaterial({map:new T.CanvasTexture(skyggeCanvas),transparent:true,depthWrite:false}),scene,[0,-1.74,0]);skygge.rotation.x=-Math.PI/2;skygge.castShadow=false;
 let vinkel=0,viste=new Set(FAGORD),farvede=new Set(FAGORD),markering=null;
 function tegn({rotation=vinkel,synlige=viste,farver=farvede,fremhæv=markering}={}){
  vinkel=rotation;viste=synlige;farvede=farver;markering=fremhæv;rod.rotation.y=vinkel;
  for(const[k,g]of Object.entries(grupper))g.visible=viste.has(k);
  for(const m of materialer){m.color.copy(m.userData.farve);m.emissive.set(0x000000);}
  // Delte materialer klones pr. organel første gang, så grå lag er uafhængige.
  for(const[k,g]of Object.entries(grupper))g.traverse(o=>{if(!o.isMesh)return;if(!o.userData.egetMateriale){o.material=o.material.clone();o.material.userData.farve=o.material.color.clone();o.userData.egetMateriale=true;}const m=o.material,org=m.userData.farve;if(k==='cellekerne'&&m.clippingPlanes)for(const plan of m.clippingPlanes){plan.normal.set(-Math.sin(vinkel),0,-Math.cos(vinkel));plan.constant=zSnit;}m.color.copy(org);if(!farvede.has(k)){const l=org.r*.21+org.g*.72+org.b*.07;m.color.setRGB(l*.65+.27,l*.65+.27,l*.65+.27);}m.emissive.set(k===fremhæv?0x624b08:0x000000);m.emissiveIntensity=.4;});
  renderer.render(scene,kamera);return renderer.domElement;
 }
 function projektion(ord){return projektér(verdensankre[ord]||zoomAnker,bredde,højde,vinkel);}
 tegn();return {lærred:renderer.domElement,tegn,projektion,ankre:()=>fagordsankre(vinkel),dispose(){renderer.dispose();scene.traverse(o=>{if(o.isMesh)o.geometry.dispose();});}};
}
