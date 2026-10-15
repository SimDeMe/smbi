// Flade trekanter med dybdebuffer. Tegnes i CSS-pixels, mens labels og linjer
// stadig tegnes skarpt i skærmens pixeltæthed. Undgår titusinder af Canvas-paths pr. billede.
export function lavRaster(W, H) {
  const billede = new ImageData(W, H), pixels = new Uint32Array(billede.data.buffer), dybder = new Float32Array(W * H);
  const element = document.createElement('canvas');element.width=W;element.height=H;
  const ctx=element.getContext('2d');
  function halv(a,b,c,d,farve) {
    const y0=Math.max(0,Math.ceil(a[1]-.5)),y1=Math.min(H,Math.ceil(b[1]-.5));
    if(y1<=y0)return;
    const dy1=b[1]-a[1],dy2=d[1]-c[1];if(dy1<=0||dy2<=0)return;
    const sx1=(b[0]-a[0])/dy1,sz1=(b[2]-a[2])/dy1,sx2=(d[0]-c[0])/dy2,sz2=(d[2]-c[2])/dy2;
    let x1=a[0]+(y0+.5-a[1])*sx1,z1=a[2]+(y0+.5-a[1])*sz1;
    let x2=c[0]+(y0+.5-c[1])*sx2,z2=c[2]+(y0+.5-c[1])*sz2;
    for(let y=y0;y<y1;y++,x1+=sx1,x2+=sx2,z1+=sz1,z2+=sz2) {
      const venstre=x1<x2, xl=venstre?x1:x2,xh=venstre?x2:x1,zl=venstre?z1:z2,zh=venstre?z2:z1;
      const start=Math.max(0,Math.ceil(xl-.5)),slut=Math.min(W,Math.ceil(xh-.5));
      if(start>=slut)continue;
      const dz=(zh-zl)/(xh-xl);let z=zl+(start+.5-xl)*dz;
      for(let k=y*W+start,end=y*W+slut;k<end;k++,z+=dz)if(z>dybder[k]){dybder[k]=z;pixels[k]=farve;}
    }
  }
  return {
    synlig([x,y,z]){const i=Math.floor(y)*W+Math.floor(x);return x>=0&&y>=0&&x<W&&y<H&&z>=dybder[i]-.8;},
    nulstil(){pixels.fill(0);dybder.fill(-Infinity);},
    trekant(a,b,c,farve){
      if(a[1]>b[1])[a,b]=[b,a];if(b[1]>c[1])[b,c]=[c,b];if(a[1]>b[1])[a,b]=[b,a];
      if(c[1]<0||a[1]>H||Math.max(a[0],b[0],c[0])<0||Math.min(a[0],b[0],c[0])>W)return;
      halv(a,b,a,c,farve);halv(b,c,a,c,farve);
    },
    vis(maal){ctx.putImageData(billede,0,0);maal.drawImage(element,0,0,W,H);}
  };
}
const littleEndian = new Uint8Array(new Uint32Array([1]).buffer)[0] === 1;
export const pakFarve = rgb => {const a=rgb.match(/\d+/g).map(Number);return littleEndian ? (255<<24)|(a[2]<<16)|(a[1]<<8)|a[0] : (a[0]<<24)|(a[1]<<16)|(a[2]<<8)|255;};
