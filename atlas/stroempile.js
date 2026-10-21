// Fælles geografiske pile: D3 klipper linjer ved horisonten; pilespidser
// og etiketter tegnes kun på den synlige halvkugle.
export function pensel(ctx, projektion) {
  const d3 = window.d3, sti = d3.geoPath(projektion, ctx);
  const centrum = projektion.invert(projektion.translate());
  const synlig = p => d3.geoDistance(centrum, p) < Math.PI / 2 - .04;
  const bokse = [];
  const tekst = (p, navn, farve = '#17211f') => {
    if (!synlig(p)) return;
    const [x,y] = projektion(p);
    ctx.save(); ctx.font = '600 11px Archivo, sans-serif'; ctx.textAlign = 'center';
    const w = ctx.measureText(navn).width, b = [x-w/2-3,y-12,x+w/2+3,y+3];
    const [cx,cy] = projektion.translate(), r = projektion.scale();
    if ([[b[0],b[1]],[b[2],b[1]],[b[0],b[3]],[b[2],b[3]]].some(([px,py]) => Math.hypot(px-cx,py-cy)>r-4) ||
        bokse.some(a=>b[0]<a[2] && b[2]>a[0] && b[1]<a[3] && b[3]>a[1])) {ctx.restore();return;}
    bokse.push(b);
    ctx.lineWidth = 3; ctx.strokeStyle = '#fff9ee'; ctx.strokeText(navn,x,y);
    ctx.fillStyle = farve; ctx.fillText(navn,x,y); ctx.restore();
  };
  function linje(punkter, farve, stiplet = false, pil = true) {
    ctx.save(); ctx.strokeStyle = farve; ctx.fillStyle = farve; ctx.lineWidth = 2.4;
    ctx.setLineDash(stiplet ? [6,4] : []);
    ctx.beginPath(); sti({type:'LineString',coordinates:punkter}); ctx.stroke();
    const a = punkter.at(-2), b = punkter.at(-1);
    if (pil && synlig(a) && synlig(b)) {
      const q = projektion(d3.geoInterpolate(a,b)(.9)), r = projektion(b);
      const v = Math.atan2(r[1]-q[1],r[0]-q[0]);
      ctx.setLineDash([]); ctx.beginPath(); ctx.moveTo(...r);
      ctx.lineTo(r[0]-8*Math.cos(v-.45),r[1]-8*Math.sin(v-.45));
      ctx.lineTo(r[0]-8*Math.cos(v+.45),r[1]-8*Math.sin(v+.45));ctx.closePath();ctx.fill();
    }
    ctx.restore();
  }
  return {linje,tekst};
}
