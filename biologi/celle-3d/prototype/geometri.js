// Organiske geometrier i prototypen. Ingen afhængighed til undervisningssidernes model.
import * as T from '../vendor/three.module.min.js';
export {T};
export const V=(x,y,z)=>new T.Vector3(x,y,z);
export const SNIT=.32;
export const tilfældig=n=>{const f=Math.sin(n*77.13+19.3)*43758.5453;return f-Math.floor(f);};
export function rør(punkter,r=.03,lukket=false,segmenter){
 const kurve=punkter instanceof T.Curve?punkter:new T.CatmullRomCurve3(punkter.map(p=>Array.isArray(p)?V(...p):p),lukket,'centripetal');
 return new T.TubeGeometry(kurve,segmenter||Math.max(40,punkter.length*5),r,8,lukket);
}
export function organiskKrop(rx,ry,rz,styrke=.035,thetaStart=0,thetaLængde=Math.PI){
 const geo=new T.SphereGeometry(1,80,48,0,Math.PI*2,thetaStart,thetaLængde),p=geo.attributes.position;
 for(let i=0;i<p.count;i++){
  const x=p.getX(i),y=p.getY(i),z=p.getZ(i);
  const bølge=1+styrke*(Math.sin(x*5.2+z*3.4)*.45+Math.sin(y*6.1-z*4.3)*.3+Math.sin(x*3.1+y*4.7)*.25);
  p.setXYZ(i,x*rx*bølge,y*ry*bølge,z*rz*bølge);
 }
 geo.computeVertexNormals();
 const normal=geo.attributes.normal;
 for(let i=0;i<p.count;i++)if(Math.abs(p.getY(i))<1e-6){const n=V(p.getX(i)/(rx*rx),0,p.getZ(i)/(rz*rz)).normalize();normal.setXYZ(i,n.x,n.y,n.z);}
 return geo;
}
// Cellen er et volumen afgrænset af en organisk membran, skåret ved SNIT.
// Samme parametrisering bruges til snitfladen og det nedre cellelegeme.
export function cellePunkt(a,theta){
 const ujævn=1+.035*Math.sin(a*3+.4)+.021*Math.sin(a*5-1.2);
 const x=5.85*Math.sin(theta)*Math.cos(a)*ujævn;
 const z=4.45*Math.sin(theta)*Math.sin(a)*ujævn;
 return V(x,-.6+2.9*Math.cos(theta),z);
}
export const celleTheta=Math.acos((SNIT+.6)/2.9);
export function celleSkal(){
 const pos=[],ix=[],N=144,M=54;
 for(let j=0;j<=M;j++)for(let i=0;i<=N;i++)pos.push(...cellePunkt(i/N*Math.PI*2,celleTheta+(Math.PI-celleTheta)*j/M).toArray());
 for(let j=0;j<M;j++)for(let i=0;i<N;i++){const a=j*(N+1)+i,b=a+N+1;ix.push(a,a+1,b,b,a+1,b+1);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setIndex(ix);g.computeVertexNormals();return g;
}
export function snitFlade(){
 const punkter=Array.from({length:144},(_,i)=>cellePunkt(i/144*Math.PI*2,celleTheta));
 const form=new T.Shape(punkter.map(p=>new T.Vector2(p.x,-p.z)));
 const g=new T.ShapeGeometry(form,64);g.rotateX(-Math.PI/2);g.translate(0,SNIT,0);return g;
}
// Lukket, rundet cisterna omkring en bugtet midterlinje. Begge ER bruger samme form.
export function cisterna(kurve,{højde=1.5,fase=0,bund=-.65,tykkelse=.07}={}){
 const N=140,M=12,pos=[],ix=[];
 function punkt(i,j,side){
  const t=i/N,v=j/M,p=kurve.getPointAt(t),tangent=kurve.getTangentAt(t),normal=V(-tangent.z,0,tangent.x).normalize();
  const top=højde+(.17*Math.sin(t*21+fase)+.09*Math.sin(t*39+fase*.6));
  const bundY=bund+.14*Math.sin(t*17+fase*.9);
  const blødEnde=.28+.72*Math.sin(Math.PI*t)**.35;
  const y=bundY+(top-bundY)*v;
  const bule=.14*Math.sin(t*29+v*4+fase)*Math.sin(Math.PI*v);
  return p.add(normal.multiplyScalar((side-.5)*tykkelse*blødEnde+bule)).setY(y);
 }
 for(let s=0;s<2;s++)for(let i=0;i<=N;i++)for(let j=0;j<=M;j++)pos.push(...punkt(i,j,s).toArray());
 const L=(N+1)*(M+1),id=(s,i,j)=>s*L+i*(M+1)+j;
 for(let s=0;s<2;s++)for(let i=0;i<N;i++)for(let j=0;j<M;j++){
  const a=id(s,i,j),b=id(s,i+1,j),c=id(s,i+1,j+1),d=id(s,i,j+1);if(s===0)ix.push(a,d,b,b,d,c);else ix.push(a,b,d,b,c,d);
 }
 for(let i=0;i<N;i++)for(const j of[0,M]){const a=id(0,i,j),b=id(0,i+1,j),c=id(1,i+1,j),d=id(1,i,j);ix.push(a,b,d,b,c,d);}
 for(const i of[0,N])for(let j=0;j<M;j++){const a=id(0,i,j),b=id(0,i,j+1),c=id(1,i,j+1),d=id(1,i,j);ix.push(a,b,d,b,c,d);}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setIndex(ix);geo.computeVertexNormals();
 return {geo,punkt,N,M};
}
// En bøjet mitokondrie med varierende tykkelse og afrundede ender.
export function mitoPunkt(t,a,l=1.4){
 const x=(t-.5)*l*2,r=Math.sin(Math.PI*t)**.6;
 const midte=.22*Math.sin(t*Math.PI*1.35)-.1;
 const bredde=.56*r*(1+.1*Math.sin(t*13));
 return V(x,.53*r*Math.cos(a)*(1+.045*Math.sin(t*19+a*3)),midte+bredde*Math.sin(a));
}
export function mitoSkal(l=1.4,øverst=false){
 const pos=[],ix=[],N=88,M=36,start=øverst?-Math.PI/2:Math.PI/2;
 for(let i=0;i<=N;i++)for(let j=0;j<=M;j++)pos.push(...mitoPunkt(i/N,start+j/M*Math.PI,l).toArray());
 for(let i=0;i<N;i++)for(let j=0;j<M;j++){const a=i*(M+1)+j,b=a+M+1;ix.push(a,a+1,b,b,a+1,b+1);}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setIndex(ix);geo.computeVertexNormals();
 const normal=geo.attributes.normal;
 for(let i=0;i<=N;i++)for(const j of[0,M]){const t=Math.max(.0001,Math.min(.9999,i/N)),a=start+j/M*Math.PI,du=mitoPunkt(t+.00005,a,l).sub(mitoPunkt(t-.00005,a,l)),da=mitoPunkt(t,a+.0001,l).sub(mitoPunkt(t,a-.0001,l)),n=da.cross(du).normalize();normal.setXYZ(i*(M+1)+j,n.x,n.y,n.z);}
 return geo;
}
export function crista(t,l,fase){
 const pos=[],ix=[],N=30,M=10;
 for(let i=0;i<=N;i++)for(let j=0;j<=M;j++){
  const u=i/N,v=j/M,r=Math.sin(Math.PI*t)**.6,midt=.22*Math.sin(t*Math.PI*1.35)-.1;
  const z=midt+(u*2-1)*.40*r;
  const x=(t-.5)*l*2+.035*Math.sin(u*8+fase)+.045*Math.sin(v*Math.PI);
  const y=-.34*r+v*.56*r*(.58+.42*Math.sin(u*Math.PI));pos.push(x,y,z);
 }
 for(let i=0;i<N;i++)for(let j=0;j<M;j++){const a=i*(M+1)+j,b=a+M+1;ix.push(a,a+1,b,b,a+1,b+1);}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setIndex(ix);geo.computeVertexNormals();return geo;
}
