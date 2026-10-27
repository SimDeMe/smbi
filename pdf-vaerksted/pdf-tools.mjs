// PDF manipulation uses the same visible coordinates as the browser preview.
export function visibleBox(page) {
  const a=page.getCropBox(),b=page.getMediaBox();
  const x=Math.max(a.x,b.x),y=Math.max(a.y,b.y);
  return {x,y,width:Math.min(a.x+a.width,b.x+b.width)-x,height:Math.min(a.y+a.height,b.y+b.height)-y};
}
export function selectionBox(page, selection) {
  if(!Array.isArray(selection)||selection.length!==4||!selection.every(v=>Number.isFinite(v)&&v>=0&&v<=1)||selection[2]-selection[0]<.001||selection[3]-selection[1]<.001)throw Error('Vælg et gyldigt udsnit på siden.');
  const b=visibleBox(page),r=((page.getRotation().angle%360)+360)%360;
  function point(u,v){switch(r){case 0:return [b.x+u*b.width,b.y+(1-v)*b.height];case 90:return [b.x+v*b.width,b.y+u*b.height];case 180:return [b.x+(1-u)*b.width,b.y+v*b.height];case 270:return [b.x+(1-v)*b.width,b.y+(1-u)*b.height];default:throw Error('Sidens rotation understøttes ikke.');}}
  const a=point(selection[0],selection[1]),c=point(selection[2],selection[3]);
  return {x:Math.min(a[0],c[0]),y:Math.min(a[1],c[1]),width:Math.abs(a[0]-c[0]),height:Math.abs(a[1]-c[1])};
}
export async function cropPDF(PDFLib,bytes,selection){
  const doc=await PDFLib.PDFDocument.load(bytes);
  for(const page of doc.getPages()){const b=selectionBox(page,selection);page.setCropBox(b.x,b.y,b.width,b.height);}
  return doc.save();
}
export function splitPlan(count,{position=.5,order='ltr',modes={}}={}){
  if(!Number.isFinite(position)||position<.01||position>.99||!['ltr','rtl'].includes(order))throw Error('Ugyldig delelinje eller rækkefølge.');
  const left=[0,0,position,1],right=[position,0,1,1],plan=[];
  for(let n=0;n<count;n++){
    const boxes={both:order==='ltr'?[left,right]:[right,left],left:[left],right:[right],whole:[[0,0,1,1]],skip:[]}[modes[n]||'both'];
    if(!boxes)throw Error('Ukendt sidevalg.');
    for(const box of boxes)plan.push([n,box]);
  }
  if(!plan.length)throw Error('Behold mindst én side.');
  return plan;
}
export async function splitPDF(PDFLib,bytes,options){
  const source=await PDFLib.PDFDocument.load(bytes),output=await PDFLib.PDFDocument.create();
  for(const [number,selection] of splitPlan(source.getPageCount(),options)){
    const [page]=await output.copyPages(source,[number]);output.addPage(page);
    const b=selectionBox(page,selection);page.setCropBox(b.x,b.y,b.width,b.height);
  }
  if(source.getTitle())output.setTitle(source.getTitle());
  return output.save();
}
export function textPlacement(transform,bbox){
  const [a,b,c,d,e,f]=transform,det=a*d-b*c;
  if(!Number.isFinite(det)||!det)throw Error('Ugyldige sidekoordinater.');
  const px=bbox.x0,py=bbox.y1-(bbox.y1-bbox.y0)*.1;
  return {x:(d*(px-e)-c*(py-f))/det,y:(-b*(px-e)+a*(py-f))/det,
    angle:Math.atan2(-b/det,d/det)*180/Math.PI,
    height:(bbox.y1-bbox.y0)/Math.hypot(a,b),width:(bbox.x1-bbox.x0)/Math.hypot(a,b)};
}
