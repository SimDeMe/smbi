import * as pdfjs from './vendor/pdf.mjs';
import {cropPDF,splitPDF,textPlacement} from './pdf-tools.mjs';
pdfjs.GlobalWorkerOptions.workerSrc=new URL('./vendor/pdf.worker.mjs',import.meta.url).href;
const PDFLib=window.PDFLib;
let viewer=null,bytes=null,original=null,history=[],job=null;
function download(data,filename){const url=URL.createObjectURL(new Blob([data],{type:'application/pdf'})),a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);}

const $=id=>document.getElementById(id),canvas=$('canvas'),ctx=canvas.getContext('2d');
let tool='crop',total=0,current=0,revision=0,canUndo=false,name='',image=null,busy=false,running=false,polling=false,selection=null,cropPreview=false,splitPreview=false,position=.5,modes={},dragging=null,request=0;
const names={dan:'Dansk',eng:'Engelsk',deu:'Tysk',swe:'Svensk',nor:'Norsk',fra:'Fransk',spa:'Spansk'};
function message(text,error=false){$('status').textContent=text;$('status').className=error?'error':'';}
function selectedLanguages(){return [...$('languages').querySelectorAll('input:checked')].map(el=>el.value);}
function mode(){return modes[current]||'both';}
function outputCount(){let n=total*2;for(const value of Object.values(modes))n-=value==='skip'?2:value==='both'?0:1;return n;}
function controls(){
 const locked=busy||running,empty=!total;
 for(const id of ['open','file'])$(id).disabled=locked;
 for(const id of ['page','mode','position','order','split-preview','ocr-mode','more'])$(id).disabled=locked||empty;
 for(const el of $('languages').querySelectorAll('input'))el.disabled=locked;
 $('page').disabled=busy||empty;$('prev').disabled=busy||current<=0;$('next').disabled=busy||current>=total-1;$('ocr-cancel').disabled=!running||Boolean(job?.cancelled);
 $('undo').disabled=locked||!canUndo;$('reset').disabled=locked||!canUndo;$('download').disabled=locked||empty;
 $('page').max=total;$('page').value=current+1;$('count').textContent='af '+total;
 $('clear').disabled=locked||!selection;$('crop-preview').disabled=locked||!selection;$('crop-apply').disabled=locked||!selection;
 $('split-apply').disabled=locked||empty||!outputCount();$('ocr-start').disabled=locked||empty||!selectedLanguages().length;
 $('crop-preview').textContent=cropPreview?'Vis hele siden':'Vis beskåret';$('split-preview').textContent=splitPreview?'Vis delelinje':'Vis enkeltsider';
 $('mode').value=mode();$('position').value=(position*100).toFixed(1);$('split-count').textContent=total?outputCount()+' sider efter deling':'';
}
function setTool(value){tool=value;dragging=null;for(const id of ['crop','split','ocr']){$('panel-'+id).hidden=id!==tool;$('tab-'+id).setAttribute('aria-selected',String(id===tool));}draw();controls();}
function draw(){
 if(!image)return;
 const w=image.naturalWidth,h=image.naturalHeight;
 let boxes=[[0,0,1,1]];
 if(tool==='crop'&&cropPreview&&selection)boxes=[selection];
 if(tool==='split'&&splitPreview){const left=[0,0,position,1],right=[position,0,1,1];boxes={both:$('order').value==='ltr'?[left,right]:[right,left],left:[left],right:[right],whole:[[0,0,1,1]],skip:[]}[mode()];}
 const gap=boxes.length>1?20:0,totalWidth=boxes.reduce((n,b)=>n+(b[2]-b[0])*w,0)||w,totalHeight=boxes.length?Math.max(...boxes.map(b=>(b[3]-b[1])*h)):h;
 const availableHeight=Math.max(170,innerHeight-$('workspace').getBoundingClientRect().top-65);
 const scale=Math.min((innerWidth-50-gap)/totalWidth,availableHeight/totalHeight,1.5),cw=Math.max(1,Math.round(totalWidth*scale+gap)),ch=Math.max(1,Math.round(totalHeight*scale)),dpr=devicePixelRatio||1;
 canvas.width=Math.round(cw*dpr);canvas.height=Math.round(ch*dpr);canvas.style.width=cw+'px';canvas.style.height=ch+'px';ctx.scale(dpr,dpr);
 let x=0;for(const [a,b,c,d] of boxes){const width=(c-a)*w*scale;ctx.drawImage(image,a*w,b*h,(c-a)*w,(d-b)*h,x,0,width,(d-b)*h*scale);x+=width+gap;}
 canvas.style.cursor=tool==='crop'&&!cropPreview?'crosshair':tool==='split'&&!splitPreview?'col-resize':'default';
 if(tool==='crop'&&selection&&!cropPreview){const [a,b,c,d]=selection.map((v,i)=>v*(i%2?ch:cw));ctx.fillStyle='rgba(14,23,34,.5)';ctx.fillRect(0,0,cw,b);ctx.fillRect(0,d,cw,ch-d);ctx.fillRect(0,b,a,d-b);ctx.fillRect(c,b,cw-c,d-b);ctx.strokeStyle='#18af79';ctx.lineWidth=2;ctx.strokeRect(a,b,c-a,d-b);}
 if(tool==='split'&&!splitPreview){const split=position*cw;ctx.fillStyle='rgba(14,23,34,.5)';if(mode()==='left')ctx.fillRect(split,0,cw-split,ch);if(mode()==='right')ctx.fillRect(0,0,split,ch);if(mode()==='skip')ctx.fillRect(0,0,cw,ch);if(!['whole','skip'].includes(mode())){ctx.strokeStyle='white';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(split,0);ctx.lineTo(split,ch);ctx.stroke();ctx.strokeStyle='#159d6b';ctx.lineWidth=2;ctx.stroke();ctx.fillStyle='#176448';ctx.fillRect(split-16,ch/2-18,32,36);ctx.fillStyle='white';ctx.font='18px system-ui';ctx.textAlign='center';ctx.fillText('↔',split,ch/2+6);}}
 if(!boxes.length){ctx.fillStyle='#526370';ctx.font='16px system-ui';ctx.fillText('Denne side springes over.',20,40);}
}
async function post(action,data){
 if(action==='crop')return commit(await cropPDF(PDFLib,bytes,data),name.replace(/\.pdf$/i,'')+'-beskaaret.pdf');
 if(action==='split')return commit(await splitPDF(PDFLib,bytes,data),name.replace(/\.pdf$/i,'')+'-enkeltsider.pdf');
 if(action==='undo'){if(!history.length)throw Error('Der er ingen trin at fortryde.');const old=history[history.length-1];await install(old.bytes,old.name);history.pop();revision++;return localInfo();}
 if(action==='reset')return commit(original.bytes,original.name);
 throw Error('Ukendt handling.');
}
async function install(data,filename){
 const next=await pdfjs.getDocument({data:data.slice(),isEvalSupported:false,standardFontDataUrl:'https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.624/standard_fonts/'}).promise;
 const old=viewer;viewer=next;bytes=data;name=filename;if(old)await old.destroy();
}
function localInfo(){return {pages:viewer.numPages,name,revision,undo:history.length>0};}
async function commit(data,filename){const previous={bytes,name};await install(data,filename);history.push(previous);if(history.length>8)history.shift();revision++;return localInfo();}
async function loadPage(number){
 const id=++request;busy=true;controls();
 try{const page=await viewer.getPage(number+1),unit=page.getViewport({scale:1}),viewport=page.getViewport({scale:Math.min(2,1800/Math.max(unit.width,unit.height))});
  const surface=document.createElement('canvas');surface.width=Math.ceil(viewport.width);surface.height=Math.ceil(viewport.height);await page.render({canvasContext:surface.getContext('2d'),viewport}).promise;
  const blob=await new Promise(resolve=>surface.toBlob(resolve)),url=URL.createObjectURL(blob),next=new Image();try{await new Promise((resolve,reject)=>{next.onload=resolve;next.onerror=()=>reject(Error('Kunne ikke vise siden.'));next.src=url;});}finally{URL.revokeObjectURL(url);surface.width=surface.height=1;}
  if(id!==request)return;image=next;current=number;$('empty').hidden=true;$('stage').hidden=false;draw();
 }catch(error){message(error.message,true);}finally{if(id===request){busy=false;controls();}}
}
async function setDocument(info,keepPage=false){const page=keepPage?Math.min(current,info.pages-1):0;total=info.pages;revision=info.revision;canUndo=info.undo;name=info.name;$('filename').textContent=name;selection=null;cropPreview=false;splitPreview=false;position=.5;modes={};$('order').value='ltr';await loadPage(Math.max(0,page));controls();}
async function upload(file){if(!file||busy||running)return;busy=true;controls();message('Åbner PDF på din computer…');try{const data=new Uint8Array(await file.arrayBuffer());await PDFLib.PDFDocument.load(data);await install(data,file.name);original={bytes:data,name:file.name};history=[];revision++;await setDocument(localInfo());$('log').hidden=true;message('PDF’en er klar. Ingen filer er uploadet.');}catch(error){message('Kunne ikke åbne PDF’en: '+error.message,true);}finally{busy=false;controls();$('file').value='';}}
async function apply(action,data){if(busy||running)return;busy=true;controls();message('Opdaterer PDF…');try{const info=await post(action,data);await setDocument(info,action==='crop');if(action==='crop')setTool('split');if(action==='split')setTool('ocr');message({crop:'Beskæringen er anvendt. Du kan nu dele siderne eller tilføje OCR.',split:'Delingen er anvendt. PDF’en viser nu enkeltsider, klar til OCR.',undo:'Sidste trin er fortrudt.',reset:'Originalen er gendannet i arbejdskopien.'}[action]);$('log').hidden=true;}catch(error){message(error.message,true);}finally{busy=false;controls();}}
function point(event){const r=canvas.getBoundingClientRect();return [Math.max(0,Math.min(1,(event.clientX-r.left)/r.width)),Math.max(0,Math.min(1,(event.clientY-r.top)/r.height))];}
function move(event){if(!dragging)return;const [x,y]=point(event);if(tool==='crop'){const [sx,sy]=dragging.start;selection=[Math.min(x,sx),Math.min(y,sy),Math.max(x,sx),Math.max(y,sy)];}else position=Math.max(.01,Math.min(.99,x));draw();controls();}
canvas.onpointerdown=event=>{if(!image||busy||running||event.button!==0||tool==='ocr'||tool==='crop'&&cropPreview||tool==='split'&&(splitPreview||['whole','skip'].includes(mode())))return;dragging={start:point(event),previous:selection};canvas.setPointerCapture(event.pointerId);if(tool==='split')move(event);};
canvas.onpointermove=move;canvas.onpointerup=event=>{if(!dragging)return;move(event);if(tool==='crop'&&(selection[2]-selection[0]<.005||selection[3]-selection[1]<.005))selection=dragging.previous;dragging=null;draw();controls();};canvas.onpointercancel=()=>{if(dragging&&tool==='crop')selection=dragging.previous;dragging=null;draw();controls();};
for(const id of ['crop','split','ocr'])$('tab-'+id).onclick=()=>setTool(id);
$('open').onclick=()=>$('file').click();$('file').onchange=event=>upload(event.target.files[0]);$('prev').onclick=()=>loadPage(current-1);$('next').onclick=()=>loadPage(current+1);$('page').onchange=()=>{const n=Number($('page').value);if(Number.isInteger(n)&&n>=1&&n<=total)loadPage(n-1);else controls();};
$('clear').onclick=()=>{selection=null;cropPreview=false;draw();controls();};$('crop-preview').onclick=()=>{cropPreview=!cropPreview;draw();controls();};$('crop-apply').onclick=()=>apply('crop',selection);
$('mode').onchange=()=>{if($('mode').value==='both')delete modes[current];else modes[current]=$('mode').value;draw();controls();};$('position').onchange=()=>{const n=Number($('position').value);if(Number.isFinite(n)&&n>=1&&n<=99)position=n/100;draw();controls();};$('order').onchange=draw;$('split-preview').onclick=()=>{splitPreview=!splitPreview;draw();controls();};$('split-apply').onclick=()=>apply('split',{position,order:$('order').value,modes});$('undo').onclick=()=>apply('undo',{});$('reset').onclick=()=>apply('reset',{});
function addLanguage(code,checked=true){if([...$('languages').querySelectorAll('input')].some(el=>el.value===code))return;const label=document.createElement('label'),input=document.createElement('input');input.type='checkbox';input.value=code;input.checked=checked;input.onchange=controls;label.append(input,document.createTextNode(' '+(names[code]||code)));$('languages').append(label);}
$('more').onchange=()=>{if($('more').value)addLanguage($('more').value);$('more').value='';controls();};
$('ocr-start').onclick=runOCR;
$('ocr-cancel').onclick=()=>{if(job){job.cancelled=true;job.abortRun(new Error('OCR afbrudt'));$('ocr-cancel').disabled=true;$('ocr-detail').textContent='Afbryder…';if(job.worker)job.worker.terminate();}};
$('download').onclick=()=>download(bytes,name);
window.onresize=draw;window.addEventListener('dragover',event=>event.preventDefault());window.addEventListener('drop',event=>{event.preventDefault();upload(event.dataTransfer.files[0]);});window.addEventListener('keydown',event=>{if(['INPUT','SELECT','BUTTON'].includes(event.target.tagName)||busy)return;if(event.key==='ArrowRight'&&current<total-1)loadPage(current+1);if(event.key==='ArrowLeft'&&current>0)loadPage(current-1);});
for(const code of ['dan','eng'])addLanguage(code,code==='dan');
for(const code of ['deu','swe','nor','fra','spa']){const option=document.createElement('option');option.value=code;option.textContent=names[code];$('more').append(option);}
controls();

async function runOCR(){
 if(busy||running||!bytes)return;
 const work={cancelled:false,worker:null,page:0,total:viewer.numPages};work.abort=new Promise((resolve,reject)=>{work.abortRun=reject;});work.abort.catch(()=>{});job=work;
 running=true;document.title='OCR kører · PDF-værksted';controls();message('OCR kører i baggrunden. Du kan arbejde videre i andre faner og programmer.');$('ocr-detail').textContent='Klargør OCR…';
 $('ocr-progress').hidden=false;$('ocr-progress').value=0;$('log').hidden=false;$('log').textContent='Henter OCR-motor og sprogdata…';
 const input=bytes.slice(),inputName=name,languages=selectedLanguages(),redo=$('ocr-mode').value==='redo';
 let reader=null,output=null,skipped=0,wordCount=0,replacements=0;
 const check=()=>{if(work.cancelled)throw Error('OCR afbrudt');};
 try{
  const initialization=Tesseract.createWorker(languages,1,{logger:event=>{
    if(job!==work||work.cancelled)return;
    const fraction=event.status==='recognizing text'?(event.progress||0):0;
    $('ocr-progress').value=100*(work.page+fraction)/work.total;
    $('ocr-detail').textContent=work.page?`Side ${work.page+1} af ${work.total}`:'Klargør OCR…';
  }});
  initialization.then(worker=>{if(work.cancelled)worker.terminate().catch(()=>{});},()=>{});
  work.worker=await Promise.race([initialization,work.abort]);
  check();
  reader=await pdfjs.getDocument({data:input.slice(),isEvalSupported:false,standardFontDataUrl:'https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.624/standard_fonts/'}).promise;
  output=redo?await PDFLib.PDFDocument.create():await PDFLib.PDFDocument.load(input);
  const font=await output.embedFont(PDFLib.StandardFonts.Helvetica),characters=new Set(font.getCharacterSet());
  for(let n=0;n<reader.numPages;n++){
   check();work.page=n;$('ocr-detail').textContent=`Side ${n+1} af ${reader.numPages}`;
   const page=await reader.getPage(n+1);
   if(!redo&&(await page.getTextContent()).items.some(item=>item.str?.trim())){skipped++;$('log').textContent+=`\nSide ${n+1}: eksisterende tekst beholdt.`;continue;}
   const unit=page.getViewport({scale:1});
   // 300 dpi, bounded to 12 megapixels to keep one-page-at-a-time memory use predictable.
   const scale=Math.min(300/72,Math.sqrt(12_000_000/(unit.width*unit.height)));
   const viewport=page.getViewport({scale}),surface=document.createElement('canvas');
   surface.width=Math.ceil(viewport.width);surface.height=Math.ceil(viewport.height);
   await page.render({canvasContext:surface.getContext('2d'),viewport}).promise;check();
   const blob=await new Promise(resolve=>surface.toBlob(resolve,'image/png'));
   const {data}=await Promise.race([work.worker.recognize(blob,{}, {blocks:true,text:true}),work.abort]);check();
   let target,transform=viewport.transform;
   if(redo){target=output.addPage([unit.width,unit.height]);const bitmap=await output.embedPng(await blob.arrayBuffer());target.drawImage(bitmap,{x:0,y:0,width:unit.width,height:unit.height});transform=[scale,0,0,-scale,0,unit.height*scale];}
   else target=output.getPage(n);
   const words=(data.blocks||[]).flatMap(block=>(block.paragraphs||[]).flatMap(paragraph=>(paragraph.lines||[]).flatMap(line=>line.words||[])));
   const lines=(data.blocks||[]).flatMap(block=>(block.paragraphs||[]).flatMap(paragraph=>paragraph.lines||[]));
   for(const word of lines){
    let text=(word.text||(word.words||[]).map(item=>item.text).join(' ')).normalize('NFC').replaceAll('ﬁ','fi').replaceAll('ﬂ','fl');
    text=[...text].map(char=>{if(char==='\n'||char==='\r')return ' ';if(characters.has(char.codePointAt(0)))return char;replacements++;return '?';}).join('');
    if(!text.trim()||!word.bbox)continue;
    const p=textPlacement(transform,word.bbox),width=font.widthOfTextAtSize(text,1);
    const size=Math.max(.1,Math.min(p.height*.9,p.width/Math.max(width,.01)));
    target.drawText(text,{x:p.x,y:p.y,size,font,rotate:PDFLib.degrees(p.angle),opacity:0});wordCount+=(word.words||[]).length;
   }
   surface.width=surface.height=1;page.cleanup();
   $('ocr-progress').value=100*(n+1)/reader.numPages;
   $('log').textContent+=`\nSide ${n+1}: ${words.length} ord genkendt.`;$('log').scrollTop=$('log').scrollHeight;
   await new Promise(resolve=>setTimeout(resolve,0));
  }
  check();$('ocr-detail').textContent='Gemmer søgbar PDF…';
  const result=await output.save();check();
  const info=await commit(result,inputName.replace(/\.pdf$/i,'')+'-soegbar.pdf');
  await setDocument(info,true);$('ocr-progress').value=100;
  $('ocr-detail').textContent=`Færdig · ${wordCount} ord · ${skipped} sider med tekst beholdt`;
  message('OCR er færdig. Klik Hent PDF for at gemme den søgbare version.'+(replacements?` ${replacements} tegn kunne ikke gengives og er markeret med ?.`:''));
  document.title='✓ OCR færdig · PDF-værksted';
 }catch(error){
  if(work.cancelled){message('OCR er afbrudt. Din PDF er bevaret uden ændringer.');$('ocr-detail').textContent='Afbrudt';}
  else{message('OCR kunne ikke gennemføres: '+error.message,true);$('ocr-detail').textContent='Fejl — prøv igen';}
  document.title='PDF-værksted';
 }finally{
  if(work.worker)await work.worker.terminate().catch(()=>{});
  if(reader)await reader.destroy();
  if(job===work){job=null;running=false;controls();}
 }
}
window.addEventListener('beforeunload',event=>{if(running){event.preventDefault();event.returnValue='';}});

// Tastaturalternativ til markering med musen samt en kompakt arbejdsvisning.
$('focus').onclick=()=>{const active=document.body.classList.toggle('focus-view');$('focus').setAttribute('aria-pressed',String(active));$('focus').textContent=active?'Vis overskrift':'Fokusvisning';draw();};
$('crop-mark').onclick=()=>{
 if(busy||running||!total)return;
 const box=['crop-left','crop-top','crop-right','crop-bottom'].map(id=>Number($(id).value)/100);
 if(!box.every(v=>Number.isFinite(v)&&v>=0&&v<=1)||box[2]-box[0]<.005||box[3]-box[1]<.005){message('Højre kant skal være efter venstre, og bund skal være efter top. Angiv positioner fra 0 til 100 %.',true);return;}
 selection=box;cropPreview=false;draw();controls();message('Udsnittet er markeret. Kontrollér det og klik Anvend beskæring.');
};
