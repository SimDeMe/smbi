import {itk,colors} from './model.js';
export class Section {
 constructor(canvas,state){this.canvas=canvas;this.ctx=canvas.getContext('2d');if(!this.ctx)throw new Error('Canvas 2D mangler.');this.state=state;this.phase=0;new ResizeObserver(()=>this.resize()).observe(canvas);}
 resize(){const r=this.canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);this.w=r.width;this.h=r.height;this.canvas.width=Math.round(r.width*d);this.canvas.height=Math.round(r.height*d);this.ctx.setTransform(d,0,0,d,0,0);this.draw();}
 draw(dt=0){if(!this.w)return;this.phase+=dt*.65;const c=this.ctx,s=this.state,w=this.w,h=this.h;const left=40,right=w-26,ground=h-40,top=49,span=right-left;const x=lat=>left+(lat+90)/180*span;
 c.clearRect(0,0,w,h);const bg=c.createLinearGradient(0,top,0,ground);bg.addColorStop(0,'#d4e9e6');bg.addColorStop(1,'#f1efe3');c.fillStyle=bg;c.fillRect(left,top-7,span,ground-top+7);
 c.strokeStyle='#849f9430';c.setLineDash([2,4]);for(let km=1;km<=2;km++){const y=ground-(ground-top)*km/2;c.beginPath();c.moveTo(left,y);c.lineTo(right,y);c.stroke();c.fillStyle='#6d837b';c.font="8px 'IBM Plex Mono',monospace";c.textAlign='right';c.fillText(km===2?'18 km':'9 km',left-7,y+3);}c.setLineDash([]);
 const center=itk(32,s.month,s.continents),shift=(center-4)*.5;
 let bounds=s.rotation<.35?[-90,center,90]:[-90,-60+shift,-30+shift,center,30+shift,60+shift,90];
 const kinds=bounds.length===3?['Én celle','Én celle']:['Polar','Ferrel','Hadley','Hadley','Ferrel','Polar'];
 const heights=bounds.length===3?[.95,.95]:[.48,.66,1,1,.66,.48];
 // The ground strip reads cold → desert → tropical → desert → cold.
 const strip=c.createLinearGradient(left,0,right,0);strip.addColorStop(0,'#b9ced4');strip.addColorStop(.33,'#e9bd76');strip.addColorStop(.5,'#87a783');strip.addColorStop(.67,'#e9bd76');strip.addColorStop(1,'#b9ced4');c.fillStyle=strip;c.fillRect(left,ground+2,span,9);
 for(let i=0;i<bounds.length-1;i++){
  const a=x(bounds[i]),b=x(bounds[i+1]),cx=(a+b)/2,rx=(b-a)*.43,ry=(ground-top-20)*heights[i]/2,cy=ground-ry-7;
  const kind=kinds[i],color=(kind==='Hadley'||bounds.length===3)?'#278b78':kind==='Ferrel'?'#b77a45':'#7a91b5';
  // At ground level, Hadley flows toward the ITK; Ferrel reverses.
  const hemisphere=cx>x(center)?1:-1;const direction=hemisphere*(kind==='Ferrel'?-1:1);
  c.strokeStyle=color+'65';c.lineWidth=1.2;c.beginPath();c.ellipse(cx,cy,rx,ry,0,0,Math.PI*2);c.stroke();
  for(let j=0;j<7;j++){const t=this.phase*direction+j*Math.PI*2/7,px=cx+rx*Math.cos(t),py=cy+ry*Math.sin(t);c.fillStyle=color;c.beginPath();c.arc(px,py,2,0,7);c.fill();}
  for(const t of [Math.PI*.5,Math.PI*1.5]){const px=cx+rx*Math.cos(t),py=cy+ry*Math.sin(t),angle=Math.atan2(direction*ry*Math.cos(t),-direction*rx*Math.sin(t));c.fillStyle=color;c.beginPath();c.moveTo(px+4*Math.cos(angle),py+4*Math.sin(angle));c.lineTo(px+4*Math.cos(angle+2.5),py+4*Math.sin(angle+2.5));c.lineTo(px+4*Math.cos(angle-2.5),py+4*Math.sin(angle-2.5));c.fill();}
  c.textAlign='center';c.fillStyle='#4a655b';c.font="9px Archivo,Arial";if(s.labels)c.fillText(kind,cx,cy+3);
 }
 for(let i=0;i<bounds.length;i++){const xx=x(bounds[i]);const rising=bounds.length===3?i===1:[1,3,5].includes(i);c.fillStyle=rising?'#2d877c':'#926936';c.font="bold 10px Archivo,Arial";c.textAlign='center';c.fillText(rising?'L ↑':'H ↓',xx,ground+24);}
 c.fillStyle='#536f66';c.font="8px 'IBM Plex Mono',monospace";c.textAlign='center';for(const lat of [-90,-60,-30,0,30,60,90]){const text=lat===-90?'S':lat===90?'N':lat===0?'0°':Math.abs(lat)+'°';c.fillText(text,x(lat),h-4);}
 const xx=x(center);c.strokeStyle='#c6a149';c.lineWidth=1.5;c.setLineDash([2,3]);c.beginPath();c.moveTo(xx,ground-12);c.lineTo(xx,top-1);c.stroke();c.setLineDash([]);
 c.fillStyle='#fffdf3';c.strokeStyle='#91aaa0';c.lineWidth=.6;c.beginPath();c.moveTo(xx-12,top+14);c.bezierCurveTo(xx-25,top+14,xx-18,top+2,xx-11,top+5);c.bezierCurveTo(xx-16,top-12,xx+6,top-17,xx+8,top-3);c.bezierCurveTo(xx+18,top-7,xx+22,top+12,xx+12,top+14);c.closePath();c.fill();c.stroke();
 c.strokeStyle='#4f9eaa';for(let i=-1;i<=1;i++){c.beginPath();c.moveTo(xx+i*6,top+19);c.lineTo(xx+i*6-3,top+25);c.stroke();}
 if(s.labels){c.font="8px 'IBM Plex Mono',monospace";c.fillStyle='#627d70';c.fillText('ITK',xx,top-19);}
 }
}
