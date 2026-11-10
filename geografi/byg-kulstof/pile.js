// Retvinklede forbindelser fra bokskant til bokskant. Ruten findes i de
// frie korridorer mellem de synlige bokse, så ingen pil krydser tekst.
export function forbindBokse(fra,til,bokse,portvalg=[]){
 const luft=22,halvB=170,halvH=24;
 const rammer=bokse.map(p=>({x:p.x-halvB-luft,y:p.y-halvH-luft,b:2*(halvB+luft),h:2*(halvH+luft)}));
 const porte=p=>[[p.x-halvB-luft,p.y,-1,0],[p.x+halvB+luft,p.y,1,0],[p.x,p.y-halvH-luft,0,-1],[p.x,p.y+halvH+luft,0,1]];
 const start=porte(fra).filter((_,i)=>portvalg[0]===undefined||i===portvalg[0]),slut=porte(til).filter((_,i)=>portvalg[1]===undefined||i===portvalg[1]);
 const xs=[...new Set([...rammer.flatMap(r=>[r.x,r.x+r.b]),...start.map(p=>p[0]),...slut.map(p=>p[0])])].filter(v=>v>=8&&v<=1560).sort((a,b)=>a-b);
 const ys=[...new Set([...rammer.flatMap(r=>[r.y,r.y+r.h]),...start.map(p=>p[1]),...slut.map(p=>p[1])])].filter(v=>v>=8&&v<=1322).sort((a,b)=>a-b);
 const fri=(x,y)=>!rammer.some(r=>x>r.x+.1&&x<r.x+r.b-.1&&y>r.y+.1&&y<r.y+r.h-.1);
 const friStreg=(a,b)=>!rammer.some(r=>a[0]===b[0]
  ?a[0]>r.x+.1&&a[0]<r.x+r.b-.1&&Math.max(a[1],b[1])>r.y+.1&&Math.min(a[1],b[1])<r.y+r.h-.1
  :a[1]>r.y+.1&&a[1]<r.y+r.h-.1&&Math.max(a[0],b[0])>r.x+.1&&Math.min(a[0],b[0])<r.x+r.b-.1);
 const key=(x,y,d)=>`${x},${y},${d}`,koe=[],bedst=new Map();
 for(const p of start){if(!xs.includes(p[0])||!ys.includes(p[1])||!fri(p[0],p[1]))continue;const x=xs.indexOf(p[0]),y=ys.indexOf(p[1]),d=p[2]?0:1,n={x,y,d,pris:0,port:p};koe.push(n);bedst.set(key(x,y,d),0);}
 let fund;
 while(koe.length){
  koe.sort((a,b)=>b.pris-a.pris);const n=koe.pop();
  if(n.pris!==bedst.get(key(n.x,n.y,n.d)))continue;
  const port=slut.find(p=>p[0]===xs[n.x]&&p[1]===ys[n.y]);
  if(port){fund={n,port};break;}
  for(const [dx,dy,d]of [[-1,0,0],[1,0,0],[0,-1,1],[0,1,1]]){
   const x=n.x+dx,y=n.y+dy;if(x<0||y<0||x>=xs.length||y>=ys.length)continue;
   const a=[xs[n.x],ys[n.y]],b=[xs[x],ys[y]];
   if(!fri(...b)||!friStreg(a,b))continue;
   const pris=n.pris+Math.abs(a[0]-b[0])+Math.abs(a[1]-b[1])+(d===n.d?0:55),k=key(x,y,d);
   if(pris>=(bedst.get(k)??Infinity))continue;
   bedst.set(k,pris);koe.push({x,y,d,pris,forrige:n,port:n.port});
  }
 }
 if(!fund)throw new Error(`Ingen fri pil mellem ${fra.ord} og ${til.ord}`);
 const punkter=[];for(let n=fund.n;n;n=n.forrige)punkter.unshift([xs[n.x],ys[n.y]]);
 const a=fund.n.port,b=fund.port;
 punkter.unshift([a[0]-a[2]*(luft-7),a[1]-a[3]*(luft-7)]);
 punkter.push([b[0]-b[2]*(luft-7),b[1]-b[3]*(luft-7)]);
 // Fjern overflødige punkter på samme rette strækning.
 for(let i=punkter.length-2;i>0;i--)if((punkter[i-1][0]===punkter[i][0]&&punkter[i][0]===punkter[i+1][0])||(punkter[i-1][1]===punkter[i][1]&&punkter[i][1]===punkter[i+1][1]))punkter.splice(i,1);
 return punkter.map((p,i)=>(i?'L':'M')+p.join(' ')).join(' ');
}
