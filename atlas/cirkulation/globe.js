import {advance,wind,itk,colors,clamp} from './model.js';
const radians=Math.PI/180;
export class Globe {
  constructor(canvas,state,onBalloon){
    this.canvas=canvas;this.ctx=canvas.getContext('2d');if(!this.ctx)throw new Error('Canvas 2D er ikke tilgængelig.');
    this.state=state;this.onBalloon=onBalloon;this.rotation=[-32,-12,0];this.balloons=[];
    this.particles=Array.from({length:650},()=>this.seed());
    this.projection=d3.geoOrthographic().clipAngle(90).precision(.3);
    this.path=d3.geoPath(this.projection,this.ctx);this.drag=null;
    canvas.addEventListener('pointerdown',e=>{this.drag={x:e.clientX,y:e.clientY,rotation:[...this.rotation],moved:false};canvas.setPointerCapture(e.pointerId);});
    canvas.addEventListener('pointermove',e=>{if(!this.drag)return;const dx=e.clientX-this.drag.x,dy=e.clientY-this.drag.y;if(Math.hypot(dx,dy)>5)this.drag.moved=true;if(this.drag.moved){this.rotation=[this.drag.rotation[0]+dx*.3,clamp(this.drag.rotation[1]-dy*.3,-80,80),0];this.draw();}});
    canvas.addEventListener('pointerup',e=>{if(this.drag&&!this.drag.moved&&state.placing){const rect=canvas.getBoundingClientRect(),p=this.projection.invert([e.clientX-rect.left,e.clientY-rect.top]);if(p&&Math.hypot(e.clientX-rect.left-this.cx,e.clientY-rect.top-this.cy)<=this.radius)this.release(p);}this.drag=null;});
    canvas.addEventListener('pointercancel',()=>{this.drag=null;});
    canvas.addEventListener('keydown',e=>{const moves={ArrowLeft:[-8,0],ArrowRight:[8,0],ArrowUp:[0,-8],ArrowDown:[0,8]};if(moves[e.key]){e.preventDefault();this.rotation[0]+=moves[e.key][0];this.rotation[1]=clamp(this.rotation[1]+moves[e.key][1],-80,80);this.draw();}else if(e.key==='Enter'){e.preventDefault();this.release([-this.rotation[0],-this.rotation[1]]);}else if(e.key==='Home'){e.preventDefault();this.reset();}});
    new ResizeObserver(()=>this.resize()).observe(canvas);
  }
  seed(){return {p:[Math.random()*360-180,Math.random()*166-83],age:Math.random()*16,trail:[]};}
  async load(){const response=await fetch('../data/countries-110m.json');if(!response.ok)throw new Error('Kortdata kunne ikke hentes.');const topology=await response.json();this.land=topojson.feature(topology,topology.objects.countries);this.draw();}
  resize(){const rect=this.canvas.getBoundingClientRect();this.width=rect.width;this.height=rect.height;const dpr=Math.min(devicePixelRatio||1,2);this.canvas.width=Math.round(rect.width*dpr);this.canvas.height=Math.round(rect.height*dpr);this.ctx.setTransform(dpr,0,0,dpr,0,0);this.cx=this.width*.5;this.cy=this.height*.49;this.radius=Math.min(this.width*.38,(this.height-76)*.48);this.draw();}
  reset(){this.rotation=[-32,-12,0];this.draw();}
  release(p){this.balloons.push({p,trail:[p],age:0});if(this.balloons.length>5)this.balloons.shift();this.onBalloon();this.draw();}
  visible(p){return d3.geoDistance(p,[-this.rotation[0],-this.rotation[1]])<Math.PI/2-.02;}
  line(points,color,width=1,dash=[]){const c=this.ctx;c.beginPath();this.path({type:'LineString',coordinates:points});c.strokeStyle=color;c.lineWidth=width;c.setLineDash(dash);c.stroke();c.setLineDash([]);}
  arrow(p,q,color,size=3){if(!this.visible(p)||!this.visible(q))return;const a=this.projection(p),b=this.projection(q),angle=Math.atan2(b[1]-a[1],b[0]-a[0]);const c=this.ctx;c.strokeStyle=color;c.lineWidth=1.1;c.beginPath();c.moveTo(...a);c.lineTo(...b);c.stroke();c.fillStyle=color;c.beginPath();c.moveTo(...b);c.lineTo(b[0]-size*Math.cos(angle-.55),b[1]-size*Math.sin(angle-.55));c.lineTo(b[0]-size*Math.cos(angle+.55),b[1]-size*Math.sin(angle+.55));c.fill();}
  label(p,text,color){if(!this.visible(p))return;const [x,y]=this.projection(p),c=this.ctx;c.font="9px 'IBM Plex Mono',monospace";const w=c.measureText(text).width;c.fillStyle='#102c2ae8';c.fillRect(x-w/2-6,y-9,w+12,18);c.strokeStyle=color+'70';c.lineWidth=.6;c.strokeRect(x-w/2-6,y-9,w+12,18);c.fillStyle=color;c.textAlign='center';c.fillText(text,x,y+3);}
  draw(dt=0){
    if(!this.width)return;const c=this.ctx,s=this.state,r=this.radius;
    this.projection.translate([this.cx,this.cy]).scale(r).rotate(this.rotation);
    c.clearRect(0,0,this.width,this.height);
    // Quiet cartographic dots give the dark field a sense of space.
    c.fillStyle='#7dada01a';for(let x=17;x<this.width;x+=28)for(let y=19;y<this.height;y+=28){c.beginPath();c.arc(x,y,.65,0,7);c.fill();}
    const halo=c.createRadialGradient(this.cx,this.cy,r*.8,this.cx,this.cy,r*1.17);halo.addColorStop(0,'#74d9b900');halo.addColorStop(.65,'#74d9b91a');halo.addColorStop(1,'#74d9b900');c.fillStyle=halo;c.fillRect(this.cx-r*1.2,this.cy-r*1.2,r*2.4,r*2.4);
    c.save();c.beginPath();c.arc(this.cx,this.cy,r,0,Math.PI*2);c.clip();
    const ocean=c.createLinearGradient(this.cx-r,this.cy-r,this.cx+r,this.cy+r);ocean.addColorStop(0,'#32656a');ocean.addColorStop(.55,'#22494f');ocean.addColorStop(1,'#13343c');c.fillStyle=ocean;c.fillRect(0,0,this.width,this.height);
    if(this.land){c.beginPath();this.path(this.land);c.fillStyle=s.continents?'#8c9e7c':'#426965';c.fill();c.strokeStyle='#bcc5a05c';c.lineWidth=.55;c.stroke();}
    c.beginPath();this.path(d3.geoGraticule10());c.strokeStyle='#d5e4cc16';c.lineWidth=.6;c.stroke();
    for(const lat of [-60,-30,0,30,60])this.line(Array.from({length:181},(_,i)=>[i*2-180,lat]),lat===0?'#d7e8cc65':'#d7e8cc28',lat===0?.9:.6,lat===0?[2,4]:[]);
    const belt=Array.from({length:241},(_,i)=>{const lon=i*1.5-180;return[lon,itk(lon,s.month,s.continents)];});
    this.line(belt,'#f6d97718',19);this.line(belt,'#f6d97724',9);this.line(belt,'#f6d977',1.5,[4,3]);
    // High white cloud tops follow the convergence belt.
    for(let i=0;i<belt.length;i+=2){const p=belt[i];if(!this.visible(p))continue;const [x,y]=this.projection(p);c.fillStyle='#f7f6da65';c.beginPath();c.ellipse(x,y-3-Math.sin(i*2)*2,2.2+Math.sin(i)*.6,1.5,0,0,7);c.fill();}
    const shade=c.createRadialGradient(this.cx-r*.42,this.cy-r*.4,r*.1,this.cx+r*.28,this.cy+r*.1,r*1.25);shade.addColorStop(0,'#0b202400');shade.addColorStop(.6,'#081b2220');shade.addColorStop(1,'#06181dbb');c.fillStyle=shade;c.fillRect(0,0,this.width,this.height);
    for(let lat=-75;lat<=75;lat+=15)for(let lon=-180;lon<180;lon+=22){const p=[lon,lat],w=wind(lon,lat,s);this.arrow(p,advance(p,s,2.1),colors[w.kind]+'b0',3);}
    for(const particle of this.particles){if(dt){particle.age+=dt;if(particle.age>18)Object.assign(particle,this.seed(),{age:0});particle.p=advance(particle.p,s,dt*2.2);particle.trail.push([...particle.p]);if(particle.trail.length>12)particle.trail.shift();}
      if(!this.visible(particle.p))continue;const w=wind(...particle.p,s);if(particle.trail.length>1){c.globalAlpha=.65;this.line(particle.trail,colors[w.kind],1);c.globalAlpha=1;}else{const p=this.projection(particle.p);c.fillStyle=colors[w.kind]+'aa';c.fillRect(p[0],p[1],1,1);}}
    for(const b of this.balloons){if(dt){b.p=advance(b.p,s,dt*2.2);b.age+=dt;b.trail.push([...b.p]);if(b.trail.length>500)b.trail.shift();}this.line(b.trail,'#ffcb86',2,[2,2]);if(this.visible(b.p)){const[x,y]=this.projection(b.p);c.strokeStyle='#fff1c8';c.lineWidth=1;c.beginPath();c.moveTo(x,y-2);c.quadraticCurveTo(x+5,y+8,x+1,y+13);c.stroke();c.fillStyle='#ff9274';c.beginPath();c.ellipse(x,y-6,5,6,0,0,7);c.fill();c.fillStyle='#fff2bc';c.beginPath();c.arc(x-1.5,y-8,1.4,0,7);c.fill();}}
    if(s.labels){
      const lon=-this.rotation[0];
      this.label([lon-9,itk(lon-9,s.month,s.continents)],'ITK · L',colors.itk);
      if(s.rotation>.5){
        const monsoon=lon>45&&lon<105&&wind(lon,19,s).v>0;
        this.label([lon-(monsoon?5:30),monsoon?16:28],monsoon?'SYDVESTMONSUN':'NORDØSTPASSAT',colors.trade);
        this.label([lon,-19],'SYDØSTPASSAT',colors.trade);
        this.label([lon-25,49],'VESTENVIND',colors.west);
        this.label([lon,73],'POLAR ØSTENVIND',colors.polar);
        this.label([lon+48,32],'H · TØRT','#e9c58d');
        this.label([lon+43,58],'POLARFRONT · L','#d6dfe9');
      }else{
        this.label([lon-20,35],'VIND MOD LAVTRYK',colors.trade);
        this.label([lon,-30],'VIND MOD LAVTRYK',colors.trade);
      }
    }
    c.restore();c.strokeStyle='#b5dac060';c.lineWidth=1;c.beginPath();c.arc(this.cx,this.cy,r,0,7);c.stroke();
    c.font="9px 'IBM Plex Mono',monospace";c.fillStyle='#bdd0c2';c.textAlign='center';c.fillText('N',this.cx,this.cy-r-10);c.fillText('S',this.cx,this.cy+r+16);
    // A light source indicates seasonal solar latitude without pretending to be a scale orbit.
    const solar=23.44*Math.cos(2*Math.PI*(s.month-6.7)/12);const sx=Math.max(20,this.cx-r-38),sy=this.cy-Math.sin(solar*radians)*r;
    c.strokeStyle='#f4ce7250';c.setLineDash([3,5]);c.beginPath();c.moveTo(sx+12,sy);c.lineTo(this.cx-r*.8,sy);c.stroke();c.setLineDash([]);c.fillStyle='#f4ce72';c.beginPath();c.arc(sx,sy,7,0,7);c.fill();for(let a=0;a<8;a++){c.beginPath();c.moveTo(sx+11*Math.cos(a*Math.PI/4),sy+11*Math.sin(a*Math.PI/4));c.lineTo(sx+15*Math.cos(a*Math.PI/4),sy+15*Math.sin(a*Math.PI/4));c.strokeStyle='#f4ce72';c.stroke();}
  }
}
