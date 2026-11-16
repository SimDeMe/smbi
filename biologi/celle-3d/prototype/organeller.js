import {T,V,rør,organiskKrop,cisterna,mitoSkal,mitoPunkt,crista,tilfældig} from './geometri.js';

export function bygOrganeller({rod,materiale,mesh}){
 const grupper={},låg=[],ankre={};
 function gruppe(id,navn,pos){const g=new T.Group();g.name=id;g.userData={id,navn};if(pos)g.position.set(...pos);rod.add(g);grupper[id]=g;return g;}
 const lilleKugle=new T.SphereGeometry(1,12,9);
 function kugle(g,p,r,m){const o=mesh(r<.2?lilleKugle:organiskKrop(r,r*.97,r,.045),m,g,p);if(r<.2)o.scale.set(r,r,r);return o;}
 const er=materiale('#68649a',{roughness:.4}),erKant=materiale('#9d96c1'),ribo=materiale('#cf6683',{roughness:.6});
 const kerne=gruppe('kerne','Cellekerne',[-.4,.4,-.7]);ankre.kerne=kerne.position.clone();
 // To skaller giver et dobbelthylster. Den øvre del kan fjernes som et snit.
 const skalMat=materiale('#a391bd',{roughness:.42,side:T.DoubleSide});
 const nedre=mesh(organiskKrop(1.62,1.52,1.53,.026,Math.PI/2,Math.PI/2),skalMat,kerne);
 const inderside=mesh(organiskKrop(1.55,1.46,1.46,.026,Math.PI/2,Math.PI/2),materiale('#b3a9cb',{side:T.BackSide}),kerne);
 const kerneLåg=new T.Group();kerne.add(kerneLåg);
 mesh(organiskKrop(1.62,1.52,1.53,.026,0,Math.PI/2),skalMat.clone(),kerneLåg);
 mesh(organiskKrop(1.55,1.46,1.46,.026,0,Math.PI/2),materiale('#c3bbd6',{side:T.BackSide}),kerneLåg);
 låg.push({id:'kerne',gruppe:kerneLåg});
 const membranRand=Array.from({length:120},(_,i)=>{const a=i/120*Math.PI*2;return V(Math.cos(a)*1.62,0,Math.sin(a)*1.53);});
 const snitring=mesh(rør(membranRand,.035,true),materiale('#c7bfd8'),kerne);snitring.visible=false;
 // Kromatin ligger rumligt i kernen; trådene er hverken parallelle eller X-formede.
 const dnaMat=materiale('#786591',{roughness:.7}),nukleoplasma=materiale('#c8bbd6',{transparent:true,opacity:.12,depthWrite:false,roughness:.6});
 mesh(organiskKrop(1.49,1.4,1.4,.02),nukleoplasma,kerne).renderOrder=2;
 for(let j=0;j<14;j++){
  const pts=[];for(let k=0;k<=55;k++){
   const t=k/55;
   pts.push(V(.76*Math.sin(t*7.7+j*3.1)+.14*Math.cos(t*19+j*4.3),.86*Math.cos(t*6.2+j*1.7)+.12*Math.sin(t*15+j*2.4),.72*Math.sin(t*8.5+j*2.3)+.12*Math.cos(t*21+j*1.2)));
  }
  mesh(rør(pts,.018,false,130),dnaMat,kerne);
 }
 kugle(kerne,[.1,-.06,-.1],.4,materiale('#66557e',{roughness:.78}));
 // Kerneporerne sidder i membranen og følger det fjernede snitstykke.
 const poreMat=materiale('#7d7097',{roughness:.5});
 for(let j=0;j<38;j++){
  const y=1-2*(j+.5)/38,a=j*2.399,p=V(Math.sqrt(1-y*y)*Math.cos(a),y,Math.sqrt(1-y*y)*Math.sin(a));
  const torus=mesh(new T.TorusGeometry(.055,.015,7,14),y>0?poreMat.clone():poreMat,y>0?kerneLåg:kerne,[p.x*1.63,p.y*1.53,p.z*1.54]);torus.quaternion.setFromUnitVectors(V(0,0,1),p);
 }
 // Foldede ER-cisterner, med uregelmæssige forløb og forbindelse mellem folderne.
 for(const [id,navn]of[['ruER','Ru ER'],['glatER','Glat ER']]){
  const g=gruppe(id,navn);ankre[id]=id==='ruER'?V(2,.4,-.8):V(-2.7,.3,.5);
  const kurver=[];
  if(id==='ruER')for(let j=0;j<3;j++){
   const pts=[];for(let k=0;k<=70;k++){const t=k/70,a=-2.95+t*3.65,r=1.92+j*.41+.12*Math.sin(a*6+j*.9)+.07*Math.sin(a*11);pts.push(V(-.4+Math.cos(a)*r,0,-.7+Math.sin(a)*r));}kurver.push(new T.CatmullRomCurve3(pts));
  }
  else{
   const pts=[[-3.8,0,-.8],[-4.05,0,-.2],[-3.7,0,.3],[-3.02,0,.46],[-2.8,0,.03],[-3.15,0,-.2],[-3.5,0,.14],[-3.47,0,.8],[-2.9,0,1.08],[-2.35,0,.68],[-2.5,0,.1]].map(p=>V(...p));kurver.push(new T.CatmullRomCurve3(pts));
  }
  kurver.forEach((kurve,j)=>{
   const form=cisterna(kurve,{højde:id==='ruER'?.85+j*.045:.8,fase:j*1.8+1,bund:-.85,tykkelse:.09});mesh(form.geo,er,g);
   const rand=Array.from({length:141},(_,k)=>form.punkt(k,form.M,0));mesh(rør(rand,.027,false,240),erKant,g);
   if(id==='ruER')for(let k=4;k<140;k+=7)for(const v of[.4,.8]){
    const p=form.punkt(k,Math.round(v*form.M),1),tangent=kurve.getTangentAt(k/140),n=V(-tangent.z,0,tangent.x).normalize();p.addScaledVector(n,.075);kugle(g,p.toArray(),.07,ribo);
   }
  });
  if(id==='ruER')for(const a of[-2.5,-1.5,-.2]){
   const pts=[1.8,2.1,2.5,2.8].map((r,i)=>V(-.4+Math.cos(a)*r,-.3+.09*Math.sin(i),-.7+Math.sin(a)*r));mesh(rør(pts,.09),er,g);
  }
 }
 // Golgi-sække har varierende omrids, hældning og afstand, ikke identiske rør.
 const golgi=gruppe('golgi','Golgiapparat',[2.8,.05,1.8]);golgi.rotation.y=-.28;ankre.golgi=golgi.position.clone();
 for(let i=0;i<5;i++){
  const f=new T.Shape();const sk=1-i*.05;
  f.moveTo(-1.35*sk,.08);f.bezierCurveTo(-.9*sk,-.45,.2*sk,-.58,1.03*sk,-.25);f.bezierCurveTo(1.53*sk,-.08,1.37*sk,.26,1.05*sk,.34);f.bezierCurveTo(.15*sk,.58,-.5*sk,.52,-1.16*sk,.41);f.bezierCurveTo(-1.54*sk,.31,-1.56*sk,.12,-1.35*sk,.08);
  const geo=new T.ExtrudeGeometry(f,{depth:.09,bevelEnabled:true,bevelThickness:.055,bevelSize:.095,bevelSegments:4,curveSegments:36});geo.rotateX(-Math.PI/2);const gp=geo.attributes.position;for(let j=0;j<gp.count;j++){const x=gp.getX(j),y=gp.getY(j),z=gp.getZ(j);gp.setXYZ(j,x+.03*Math.sin(z*5+i),y+.08*Math.sin(x*2.2+i*.7)+.025*Math.cos(z*6+i),z+.045*Math.sin(x*4+i));}geo.computeVertexNormals();
  const o=mesh(geo,materiale(new T.Color('#bd8064').lerp(new T.Color('#dca48a'),i/7)),golgi,[Math.sin(i*1.9)*.08,-.55+i*.27,i*.11]);o.rotation.z=.035*Math.sin(i*1.4);o.rotation.y=.04*Math.sin(i*2);
 }
 // Mitokondrier er hele, bøjede legemer, der går ned gennem cellens snitflade.
 const mito=gruppe('mito','Mitokondrier');ankre.mito=V(-2,.21,2.15);
 const mitokondrier=[{p:[-2.05,.18,2.15],v:-.55,l:1.35},{p:[2.9,.14,-1.6],v:1.0,l:1.16},{p:[.6,.12,2.85],v:.15,l:1.05}];
 for(const [n,{p,v,l}]of mitokondrier.entries()){
  const g=new T.Group();g.position.set(...p);g.rotation.y=v;mito.add(g);
  const skal=materiale('#719b9d',{roughness:.5,side:T.DoubleSide});mesh(mitoSkal(l,false),skal,g);
  const lågGruppe=new T.Group();g.add(lågGruppe);mesh(mitoSkal(l,true),skal.clone(),lågGruppe);låg.push({id:'mito',gruppe:lågGruppe});
  const indreMat=materiale('#b6b391',{roughness:.65,side:T.DoubleSide});const indre=mesh(mitoSkal(l,false),indreMat,g);indre.scale.set(.94,.87,.86);
  const cristaMat=materiale('#c2ae80',{roughness:.54,side:T.DoubleSide});
  for(let j=0;j<9;j++)mesh(crista(.1+j*.1,l,j*1.7+n),cristaMat,g);
  for(const a of[Math.PI/2,Math.PI*1.5]){
   const pts=Array.from({length:89},(_,i)=>mitoPunkt(i/88,a,l));const kant=mesh(rør(pts,.025,false,150),materiale('#b4c9ba'),g);kant.visible=false;kant.userData.snitrand='mito';
  }
 }
 const lyso=gruppe('lysosom','Lysosomer');ankre.lysosom=V(-4,.12,1.15);
 for(const p of[[-4,.12,1.15],[1.7,-.2,2.5]])kugle(lyso,p,.3,materiale('#a198b3',{roughness:.65}));
 const ves=gruppe('vesikel','Vesikler');ankre.vesikel=V(4,.1,1.5);
 for(const p of[[4,.16,1.3],[3.8,-.12,2.35],[3.55,.15,.77]])kugle(ves,p,.16,materiale('#ca9c71'));
 const frie=gruppe('ribosom','Frie ribosomer');ankre.ribosom=V(-.8,.35,2.5);
 for(let i=0;i<65;i++){
  const a=tilfældig(i)*Math.PI*2,r=3+tilfældig(i+100)*1.9;
  const p=[Math.cos(a)*r,-.6+tilfældig(i+50)*1.05,Math.sin(a)*r*.72];kugle(frie,p,.045,ribo);
 }
 function åbn(id,værdi){
  for(const d of låg)if(d.id===id){d.gruppe.visible=værdi<.999;d.gruppe.position.y=.38*værdi;d.gruppe.position.z=-.22*værdi;d.gruppe.traverse(o=>{if(!o.isMesh)return;o.material.transparent=værdi>0;o.material.opacity=1-værdi;o.material.depthWrite=værdi<.1;});}
  if(id==='kerne')snitring.visible=værdi>.15;
  if(id==='mito')mito.traverse(o=>{if(o.userData.snitrand==='mito')o.visible=værdi>.15;});
 }
 return {grupper,ankre,åbn};
}
