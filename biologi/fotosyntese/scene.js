/* ═══════════════════════════════════════════════════════════
   scene.js — figurens opbygning.

   Bygger hele SVG'en: himlen med sol, måne og skyer, jorden med
   rødderne, planten der vokser, og den forstørrede bladcelle med
   kloroplast, glukose og mitokondrie. Modulet regner ikke på
   biologi — det tegner kun det, model.js og side.js beder om, og
   kender de veje, molekylerne skal tage:

     vand:  jorden → roden → stænglen → bladet → cellen
     CO₂:   luften → bladets spalteåbninger → cellen
     O₂:    cellen → spalteåbningerne → luften
   ═══════════════════════════════════════════════════════════ */
import {tegnMolekyle, molekyleDefs} from '../faelles/molekyler.js';

const NS = 'http://www.w3.org/2000/svg';

/* Scenens faste mål. Alt andet regnes ud fra dem. */
export const MAAL = {
  bredde:1000, hoejde:460,
  horisont:340,
  plante:{x:250, fod:340},
  celle:{x:510, y:18, b:472, h:424},
  kloroplast:{x:772, y:152, rx:166, ry:98},
  mitokondrie:{x:878, y:348, rx:72, ry:44},
  lager:{x:560, y:338, spring:30, maks:7},
  slots:{spring:44, yCo2:110, yH2o:158, r:16},
  portLuft:{x:512, y:118},
  portVand:{x:512, y:396},
};

/* Molekylerne i luften og i jorden ligger på faste pladser, så
   billedet står roligt, og eleven kan tælle dem: seks af hver. */
export const PLADSER = {
  co2:[[58,112],[118,212],[56,286],[398,108],[438,214],[376,290]],
  h2o:[[52,382],[118,428],[176,394],[332,424],[398,384],[452,432]],
};

const el = (navn, attrs = {}) => {
  const n = document.createElementNS(NS, navn);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  return n;
};
const tekst = (s, attrs) => { const t = el('text', attrs); t.textContent = s; return t; };
const flyt = (n, x, y, skala) =>
  n.setAttribute('transform','translate('+x.toFixed(1)+','+y.toFixed(1)+')' + (skala ? ' scale('+skala+')' : ''));
const klem = (v, a, b) => Math.max(a, Math.min(b, v));
const roligt = () => !!window.matchMedia?.('(prefers-reduced-motion:reduce)')?.matches;

function gradient(defs, type, id, attrs, stops){
  const g = el(type, {id, ...attrs});
  for (const [offset, farve, op] of stops)
    g.appendChild(el('stop',{offset, 'stop-color':farve, 'stop-opacity':op ?? 1}));
  defs.appendChild(g);
  return g;
}

export function byggScene(svg){
  svg.setAttribute('viewBox','0 0 '+MAAL.bredde+' '+MAAL.hoejde);
  const H = MAAL.horisont;

  /* ── Gradienter ─────────────────────────────────────── */
  const defs = el('defs');
  svg.appendChild(defs);
  molekyleDefs(defs);
  gradient(defs,'linearGradient','himmel-dag',{x1:0,y1:0,x2:0,y2:1},
    [['0%','#7CC4EA'],['70%','#BFE4F5'],['100%','#E4F4FA']]);
  gradient(defs,'linearGradient','himmel-nat',{x1:0,y1:0,x2:0,y2:1},
    [['0%','#0B1630'],['100%','#26395F']]);
  gradient(defs,'linearGradient','skumring',{x1:0,y1:0,x2:0,y2:1},
    [['0%','#FF9E4D',0],['62%','#FF9E4D',.5],['100%','#FFC98A',.95]]);
  gradient(defs,'radialGradient','sol-glorie',{cx:'50%',cy:'50%',r:'50%'},
    [['0%','#FFF2A8',.95],['45%','#FFE36B',.45],['100%','#FFE36B',0]]);
  gradient(defs,'radialGradient','sol-skive',{cx:'38%',cy:'34%',r:'70%'},
    [['0%','#FFF6C2'],['60%','#FFD43B'],['100%','#FFB300']]);
  const straale = gradient(defs,'linearGradient','lysstraale',{gradientUnits:'userSpaceOnUse',x1:0,y1:0,x2:0,y2:300},
    [['0%','#FFF3A0',.85],['100%','#FFF3A0',0]]);
  gradient(defs,'linearGradient','jord',{x1:0,y1:0,x2:0,y2:1},
    [['0%','#C9A46E'],['100%','#93703F']]);
  gradient(defs,'linearGradient','stengel',{gradientUnits:'userSpaceOnUse',x1:0,y1:H,x2:0,y2:90},
    [['0%','#3B7420'],['100%','#78C447']]);
  gradient(defs,'linearGradient','blad-h',{x1:0,y1:0,x2:1,y2:0},
    [['0%','#3F8D22'],['100%','#93D85E']]);
  gradient(defs,'linearGradient','blad-v',{x1:1,y1:0,x2:0,y2:0},
    [['0%','#3F8D22'],['100%','#93D85E']]);
  gradient(defs,'radialGradient','cytoplasma',{cx:'45%',cy:'40%',r:'75%'},
    [['0%','#FFFDF6'],['100%','#F4F0DC']]);
  gradient(defs,'radialGradient','stroma',{cx:'45%',cy:'38%',r:'70%'},
    [['0%','#EEF9E2'],['100%','#C3E6A6']]);
  gradient(defs,'radialGradient','granum-glod',{cx:'50%',cy:'50%',r:'50%'},
    [['0%','#FFF59A',.95],['100%','#FFF59A',0]]);
  gradient(defs,'radialGradient','matrix',{cx:'42%',cy:'36%',r:'72%'},
    [['0%','#FFEDE4'],['100%','#FFC2A8']]);
  gradient(defs,'radialGradient','udbrud',{cx:'50%',cy:'50%',r:'50%'},
    [['0%','#FFFFFF',1],['35%','#FFF4A0',.9],['100%','#B8F08A',0]]);
  gradient(defs,'radialGradient','energi-glod',{cx:'50%',cy:'50%',r:'50%'},
    [['0%','#FFF6B0',1],['50%','#FFC93C',.7],['100%','#FF8A3D',0]]);
  gradient(defs,'radialGradient','foton',{cx:'50%',cy:'50%',r:'50%'},
    [['0%','#FFFFFF'],['45%','#FFE95C'],['100%','#FFE95C',0]]);

  const c = MAAL.celle;
  const klip = el('clipPath',{id:'celle-klip'});
  klip.appendChild(el('rect',{x:c.x,y:c.y,width:c.b,height:c.h,rx:30}));
  defs.appendChild(klip);

  const lag = {};
  for (const navn of ['himmel','sol','land','plante','nat','lup','celle','zoner','effekter','molekyler']){
    lag[navn] = el('g',{'class':'lag-'+navn});
    svg.appendChild(lag[navn]);
  }

  /* ── Himmel ─────────────────────────────────────────── */
  lag.himmel.appendChild(el('rect',{x:0,y:0,width:MAAL.bredde,height:H,fill:'url(#himmel-nat)'}));
  const dagFlade = el('rect',{x:0,y:0,width:MAAL.bredde,height:H,fill:'url(#himmel-dag)'});
  const skumFlade = el('rect',{x:0,y:0,width:MAAL.bredde,height:H,fill:'url(#skumring)',opacity:0});
  const graaFlade = el('rect',{x:0,y:0,width:MAAL.bredde,height:H,fill:'#8D99A3',opacity:0});
  lag.himmel.append(dagFlade, skumFlade, graaFlade);

  const stjerner = el('g',{});
  const froe = [[92,48],[204,34],[318,66],[440,40],[150,124],[286,140],[396,98],[60,176],[470,170],[236,92],[30,70]];
  for (const [x,y] of froe){
    stjerner.appendChild(el('path',{
      d:'M'+x+' '+(y-4)+' L'+(x+1.2)+' '+(y-1.2)+' L'+(x+4)+' '+y+' L'+(x+1.2)+' '+(y+1.2)+
        ' L'+x+' '+(y+4)+' L'+(x-1.2)+' '+(y+1.2)+' L'+(x-4)+' '+y+' L'+(x-1.2)+' '+(y-1.2)+' Z',
      fill:'#FFF6E0',
    }));
  }
  lag.himmel.appendChild(stjerner);

  /* fjerne bakker giver dybde bag planten */
  lag.himmel.appendChild(el('path',{
    d:'M0 '+(H-34)+' C90 '+(H-70)+' 170 '+(H-52)+' 250 '+(H-40)+' S410 '+(H-78)+' 520 '+(H-36)+' L520 '+H+' L0 '+H+' Z',
    fill:'#A9D58C', opacity:.75,
  }));
  lag.himmel.appendChild(el('path',{
    d:'M0 '+(H-12)+' C120 '+(H-38)+' 220 '+(H-20)+' 330 '+(H-26)+' S460 '+(H-16)+' 520 '+(H-22)+' L520 '+H+' L0 '+H+' Z',
    fill:'#86C266', opacity:.85,
  }));

  /* ── Sol, måne og skyer ─────────────────────────────── */
  const lysKegle = el('polygon',{fill:'url(#lysstraale)',opacity:0,'class':'lyskegle'});
  const solGlorie = el('circle',{r:74,fill:'url(#sol-glorie)'});
  const solStraaler = el('g',{});
  for (let i=0;i<12;i++){
    const v = i*Math.PI/6;
    solStraaler.appendChild(el('line',{
      x1:(Math.cos(v)*31).toFixed(1), y1:(Math.sin(v)*31).toFixed(1),
      x2:(Math.cos(v)*42).toFixed(1), y2:(Math.sin(v)*42).toFixed(1),
      stroke:'#17211F','stroke-width':2.6,'stroke-linecap':'round',
    }));
  }
  const sol = el('g',{});
  sol.append(solGlorie, solStraaler, el('circle',{r:25,fill:'url(#sol-skive)',stroke:'#17211F','stroke-width':2.6}));
  const maane = el('g',{});
  maane.append(
    el('circle',{r:30,fill:'#FFF6E0',opacity:.18}),
    el('circle',{r:20,fill:'#FFF6E0',stroke:'#17211F','stroke-width':2.5}),
    el('circle',{cx:-7,cy:-4,r:4,fill:'#E2DBC6'}),
    el('circle',{cx:6,cy:6,r:5.5,fill:'#E2DBC6'}),
  );
  const skyer = el('g',{opacity:0});
  const skyForm = 'M-46 12 a14 14 0 0 1 4 -26 a20 20 0 0 1 36 -10 a16 16 0 0 1 30 4 a13 13 0 0 1 20 20 a8 8 0 0 1 -6 12 Z';
  const skyListe = [];
  for (const [x,y,s] of [[128,96,1.15],[300,64,1.35],[420,150,1],[214,178,.85]]){
    const sky = el('path',{d:skyForm,fill:'#F7F9FA',stroke:'#17211F','stroke-width':2.2,'stroke-linejoin':'round',
                           transform:'translate('+x+','+y+') scale('+s+')'});
    skyListe.push(sky);
    skyer.appendChild(sky);
  }
  lag.sol.append(lysKegle, sol, maane, skyer);

  /* ── Jorden ─────────────────────────────────────────── */
  lag.land.appendChild(el('rect',{x:0,y:H,width:MAAL.bredde,height:MAAL.hoejde-H,fill:'url(#jord)'}));
  lag.land.appendChild(el('rect',{x:0,y:H,width:MAAL.bredde,height:10,fill:'#6A4E2B',opacity:.18}));
  for (let i=0;i<34;i++){
    const x = 14 + (i*41) % 486;
    const y = H + 22 + ((i*53) % 92);
    lag.land.appendChild(el('ellipse',{cx:x,cy:y,rx:2.6+(i%3),ry:1.8+(i%2),fill:'#7E5F37',opacity:.45}));
  }
  /* græs langs horisonten */
  let graes = '';
  for (let x=6; x<500; x+=9){
    const h = 6 + ((x*7) % 9);
    graes += 'M'+x+' '+H+' q2 '+(-h*0.6)+' '+(x%2 ? 3 : -2)+' '+(-h)+' ';
  }
  lag.land.appendChild(el('path',{d:graes,fill:'none',stroke:'#4C8C2A','stroke-width':2,'stroke-linecap':'round'}));
  lag.land.appendChild(el('line',{x1:0,y1:H,x2:MAAL.bredde,y2:H,stroke:'#17211F','stroke-width':2.5}));

  /* ── Planten ────────────────────────────────────────── */
  const plante = el('g',{});
  lag.plante.appendChild(plante);
  let geo = {anker:{x:280,y:200}, rod:{x:262,y:384}, bund:{x:250,y:H-4}, midt:{x:250,y:250}, top:{x:250,y:150}};

  function tegnPlante(biomasse, sulten){
    plante.textContent = '';
    const {x, fod} = MAAL.plante;
    const b = Math.max(0, biomasse);
    const g = 1 - Math.exp(-b/10);

    /* rødderne vokser med planten */
    const rl = 32 + 44*g;
    const rod = el('g',{fill:'none',stroke:'#7A5A31','stroke-linecap':'round'});
    rod.appendChild(el('path',{d:'M'+x+' '+fod+' C'+(x-3)+' '+(fod+rl*.4)+' '+(x+4)+' '+(fod+rl*.7)+' '+x+' '+(fod+rl),'stroke-width':3.4}));
    for (const [dx,dy,f] of [[-30,30,.25],[34,34,.3],[-22,52,.55],[26,58,.6],[-12,70,.8]]){
      const y0 = fod + rl*f*0.9;
      rod.appendChild(el('path',{
        d:'M'+x+' '+y0.toFixed(1)+' q'+(dx*0.4*g+dx*0.3).toFixed(1)+' '+(dy*0.2).toFixed(1)+' '+(dx*(0.5+0.5*g)).toFixed(1)+' '+(dy*(0.45+0.4*g)).toFixed(1),
        'stroke-width':2,
      }));
    }
    plante.appendChild(rod);
    geo.rod = {x:x+18, y:fod+rl*0.62};
    geo.bund = {x, y:fod-4};

    if (sulten){
      plante.appendChild(el('path',{
        d:'M'+x+' '+fod+' q5 -30 -12 -44',fill:'none',stroke:'#8A7A5A','stroke-width':6,'stroke-linecap':'round',
      }));
      for (const [dx,s] of [[-12,-1],[-6,1]]){
        plante.appendChild(el('path',{
          d:'M'+(x+dx)+' '+(fod-38)+' q'+(s*22)+' 4 '+(s*26)+' 22 q'+(-s*20)+' -2 '+(-s*26)+' -22 z',
          fill:'#B9AC8E',stroke:'#17211F','stroke-width':2,
        }));
      }
      geo.midt = {x:x-4, y:fod-24};
      geo.anker = {x:x+14, y:fod-26};
      geo.top = {x:x-12, y:fod-44};
      return geo;
    }

    const hoejde = 62 + 186*g;
    const top = fod - hoejde;
    const stammeBredde = 4.5 + 3.5*g;
    plante.appendChild(el('path',{
      d:'M'+x+' '+fod+' C'+(x-8)+' '+(fod-hoejde*0.45)+' '+(x+8)+' '+(fod-hoejde*0.7)+' '+x+' '+top,
      fill:'none',stroke:'#17211F','stroke-width':stammeBredde+3,'stroke-linecap':'round',
    }));
    plante.appendChild(el('path',{
      d:'M'+x+' '+fod+' C'+(x-8)+' '+(fod-hoejde*0.45)+' '+(x+8)+' '+(fod-hoejde*0.7)+' '+x+' '+top,
      fill:'none',stroke:'url(#stengel)','stroke-width':stammeBredde,'stroke-linecap':'round',
    }));
    geo.midt = {x, y:fod - hoejde*0.42};
    geo.top = {x, y:top};

    /* Bladene kommer til ét ad gangen og folder sig ud, efterhånden
       som biomassen vokser — så væksten ses glidende. */
    const antal = Math.min(10, 2 + b/3);
    let anker = null;
    for (let i=0; i<Math.ceil(antal); i++){
      const gro = klem(antal - i, 0, 1);
      if (gro < 0.08) continue;
      const f = 0.24 + 0.068*i;
      const y0 = fod - hoejde*Math.min(f, 0.9);
      const side = i % 2 ? 1 : -1;
      const L = (38 + 20*g) * (0.35 + 0.65*gro);
      const B = L*0.44;
      const sx = x + side*L, sy = y0 - L*0.34;
      const blad = el('g',{});
      blad.appendChild(el('path',{
        d:'M'+x+' '+y0.toFixed(1)+
          ' Q'+(x+side*L*0.45).toFixed(1)+' '+(y0-B*1.15).toFixed(1)+' '+sx.toFixed(1)+' '+sy.toFixed(1)+
          ' Q'+(x+side*L*0.6).toFixed(1)+' '+(y0+B*0.55).toFixed(1)+' '+x+' '+y0.toFixed(1)+' Z',
        fill:side > 0 ? 'url(#blad-h)' : 'url(#blad-v)',stroke:'#17211F','stroke-width':2.1,'stroke-linejoin':'round',
      }));
      blad.appendChild(el('path',{
        d:'M'+x+' '+y0.toFixed(1)+' Q'+(x+side*L*0.55).toFixed(1)+' '+(y0-B*0.3).toFixed(1)+' '+(sx-side*3).toFixed(1)+' '+(sy+1).toFixed(1),
        fill:'none',stroke:'#2E6A16','stroke-width':1.5,'stroke-linecap':'round',
      }));
      for (const t of [0.38, 0.62]){
        const bx = x + side*L*t, by = y0 - L*0.34*t - B*0.12;
        blad.appendChild(el('path',{
          d:'M'+bx.toFixed(1)+' '+by.toFixed(1)+' l'+(side*L*0.12).toFixed(1)+' '+(-B*0.38).toFixed(1)+
            ' M'+bx.toFixed(1)+' '+by.toFixed(1)+' l'+(side*L*0.13).toFixed(1)+' '+(B*0.26).toFixed(1),
          fill:'none',stroke:'#2E6A16','stroke-width':1,'stroke-linecap':'round',opacity:.7,
        }));
      }
      plante.appendChild(blad);
      if (side > 0 && gro > 0.6) anker = {x:x + side*L*0.58, y:y0 - L*0.28};
    }
    plante.appendChild(el('circle',{cx:x,cy:top,r:5+2*g,fill:'#A8E68A',stroke:'#17211F','stroke-width':2.1}));
    geo.anker = anker || {x:x+18, y:fod - hoejde*0.5};
    lup.setAttribute('transform','translate('+geo.anker.x.toFixed(1)+','+geo.anker.y.toFixed(1)+')');
    lupLinjer[0].setAttribute('x1', (geo.anker.x+16).toFixed(1));
    lupLinjer[0].setAttribute('y1', (geo.anker.y-12).toFixed(1));
    lupLinjer[1].setAttribute('x1', (geo.anker.x+16).toFixed(1));
    lupLinjer[1].setAttribute('y1', (geo.anker.y+12).toFixed(1));
    return geo;
  }

  /* ── Mørket lægger sig over landskabet ──────────────── */
  const natSloer = el('rect',{x:0,y:0,width:MAAL.bredde,height:MAAL.hoejde,fill:'#0B1530',opacity:0});
  lag.nat.appendChild(natSloer);

  /* ── Lup: det blad, cellen er hentet fra ────────────── */
  const lupLinjer = [
    el('line',{x1:0,y1:0,x2:c.x,y2:c.y+10,stroke:'#17211F','stroke-width':1.8,'stroke-dasharray':'5 6',opacity:.55}),
    el('line',{x1:0,y1:0,x2:c.x,y2:c.y+c.h-10,stroke:'#17211F','stroke-width':1.8,'stroke-dasharray':'5 6',opacity:.55}),
  ];
  const lup = el('g',{});
  lup.appendChild(el('circle',{r:19,fill:'#FFFFFF','fill-opacity':.18,stroke:'#17211F','stroke-width':2.2}));
  lag.lup.append(...lupLinjer, lup);

  /* ── Bladcellen ─────────────────────────────────────── */
  const celle = el('g',{});
  lag.celle.appendChild(celle);
  /* cellevæggen er tyk og grøngul, cellemembranen tynd indenfor */
  celle.appendChild(el('rect',{x:c.x,y:c.y,width:c.b,height:c.h,rx:30,fill:'#D8E7B4',stroke:'#17211F','stroke-width':2.6}));
  celle.appendChild(el('rect',{x:c.x+9,y:c.y+9,width:c.b-18,height:c.h-18,rx:23,fill:'url(#cytoplasma)',stroke:'#5D7A3A','stroke-width':1.6}));
  const indhold = el('g',{'clip-path':'url(#celle-klip)'});
  celle.appendChild(indhold);

  /* lyset falder ind gennem bladet */
  const lysStriber = el('g',{opacity:0});
  for (const dx of [0, 64, 128]){
    lysStriber.appendChild(el('polygon',{
      points:(c.x+40+dx)+','+c.y+' '+(c.x+78+dx)+','+c.y+' '+(c.x+262+dx)+','+(c.y+240)+' '+(c.x+226+dx)+','+(c.y+240),
      fill:'#FFF3A0',opacity:.55,
    }));
  }
  indhold.appendChild(lysStriber);

  /* et par grønkorn mere langs væggen — cellen har mange */
  for (const [x,y,r] of [[955,240,-70],[770,420,8]]){
    const g = el('g',{transform:'translate('+x+','+y+') rotate('+r+')',opacity:.6});
    g.appendChild(el('ellipse',{rx:34,ry:16,fill:'url(#stroma)',stroke:'#17211F','stroke-width':1.6}));
    for (const dx of [-14,0,14]) g.appendChild(el('rect',{x:dx-5,y:-5,width:10,height:10,rx:2,fill:'#3F8D22',opacity:.65}));
    indhold.appendChild(g);
  }

  celle.appendChild(tekst('Bladcelle',{'class':'svg-etiket',x:c.x+26,y:c.y+34}));
  celle.appendChild(tekst('CO₂ ind · O₂ ud →',{'class':'svg-lille',x:c.x+26,y:MAAL.portLuft.y-44}));
  celle.appendChild(tekst('H₂O ind · glukose ud →',{'class':'svg-lille',x:c.x+26,y:MAAL.portVand.y+30}));
  for (const p of [MAAL.portLuft, MAAL.portVand]){
    celle.appendChild(el('ellipse',{cx:c.x+4,cy:p.y,rx:6,ry:12,fill:'#FFFDF6',stroke:'#17211F','stroke-width':1.8}));
  }

  /* kloroplasten: dobbelt membran, stroma og grana */
  const kl = MAAL.kloroplast;
  const kloroplast = el('g',{'class':'kloroplast'});
  const klYdre = el('ellipse',{cx:kl.x,cy:kl.y,rx:kl.rx,ry:kl.ry,fill:'#B4DC92',stroke:'#17211F','stroke-width':2.6});
  kloroplast.append(klYdre,
    el('ellipse',{cx:kl.x,cy:kl.y,rx:kl.rx-7,ry:kl.ry-7,fill:'url(#stroma)',stroke:'#3F7A22','stroke-width':1.4}));
  const granaGlod = el('ellipse',{cx:kl.x,cy:kl.y+56,rx:150,ry:38,fill:'url(#granum-glod)',opacity:0});
  kloroplast.appendChild(granaGlod);
  const grana = el('g',{});
  const granaX = [kl.x-92, kl.x, kl.x+92];
  grana.appendChild(el('path',{
    d:'M'+(granaX[0]+18)+' '+(kl.y+52)+' C'+(granaX[0]+46)+' '+(kl.y+44)+' '+(granaX[1]-46)+' '+(kl.y+66)+' '+(granaX[1]-18)+' '+(kl.y+58)+
      ' M'+(granaX[1]+18)+' '+(kl.y+52)+' C'+(granaX[1]+46)+' '+(kl.y+44)+' '+(granaX[2]-46)+' '+(kl.y+66)+' '+(granaX[2]-18)+' '+(kl.y+58),
    fill:'none',stroke:'#2F6B17','stroke-width':2.4,'stroke-linecap':'round',
  }));
  for (const gx of granaX){
    for (let j=0;j<5;j++){
      grana.appendChild(el('rect',{
        x:gx-18,y:kl.y+38+j*7,width:36,height:5.6,rx:2.8,
        fill:j%2 ? '#3A8A1E' : '#2F7A17',stroke:'#17211F','stroke-width':.9,
      }));
    }
  }
  kloroplast.appendChild(grana);
  celle.appendChild(kloroplast);
  celle.appendChild(tekst('Kloroplast',{'class':'svg-etiket',x:kl.x,y:kl.y-kl.ry-10,'text-anchor':'middle'}));
  celle.appendChild(tekst('grana',{'class':'svg-lille',x:kl.x+kl.rx-34,y:kl.y+kl.ry-14,'text-anchor':'end'}));

  /* pladserne til de 6 + 6 råvarer */
  const slots = {co2:[], h2o:[]};
  const slotTal = {};
  for (const type of ['co2','h2o']){
    const y = type === 'co2' ? MAAL.slots.yCo2 : MAAL.slots.yH2o;
    for (let i=0;i<6;i++){
      const ring = el('circle',{
        cx:slotX(i),cy:y,r:MAAL.slots.r,fill:'#FFFDF6',stroke:'#2F5B1C',
        'stroke-width':1.7,'stroke-dasharray':'4 4',opacity:.85,
      });
      celle.appendChild(ring);
      slots[type].push(ring);
    }
    slotTal[type] = tekst('',{'class':'svg-tal',x:kl.x-kl.rx-10,y:y+5,'text-anchor':'end'});
    celle.appendChild(slotTal[type]);
  }
  const slotIndhold = el('g',{});
  celle.appendChild(slotIndhold);

  /* glukosen i cellen */
  celle.appendChild(tekst('Glukose i cellen',{'class':'svg-etiket',x:MAAL.lager.x-16,y:MAAL.lager.y-30}));
  const lagerHylde = el('g',{});
  celle.appendChild(lagerHylde);

  /* mitokondriet: dobbelt membran og foldede cristae */
  const mi = MAAL.mitokondrie;
  const mito = el('g',{'class':'mitokondrie'});
  const miGlod = el('ellipse',{cx:mi.x,cy:mi.y,rx:mi.rx+26,ry:mi.ry+24,fill:'url(#energi-glod)',opacity:0});
  const miYdre = el('ellipse',{cx:mi.x,cy:mi.y,rx:mi.rx,ry:mi.ry,fill:'#FFB79A',stroke:'#17211F','stroke-width':2.6});
  mito.append(miGlod, miYdre,
    el('ellipse',{cx:mi.x,cy:mi.y,rx:mi.rx-7,ry:mi.ry-7,fill:'url(#matrix)',stroke:'#B4502A','stroke-width':1.3}));
  let crista = 'M'+(mi.x-mi.rx+12)+' '+mi.y;
  for (let i=0;i<6;i++){
    const x0 = mi.x - mi.rx + 12 + i*21.5;
    const op = i%2 ? 1 : -1;
    crista += ' C'+(x0+4)+' '+(mi.y+op*30)+' '+(x0+17)+' '+(mi.y+op*30)+' '+(x0+21.5)+' '+mi.y;
  }
  mito.appendChild(el('path',{d:crista,fill:'none',stroke:'#C4552B','stroke-width':2.6,'stroke-linecap':'round','stroke-linejoin':'round'}));
  celle.appendChild(mito);
  celle.appendChild(tekst('Mitokondrie',{'class':'svg-etiket',x:mi.x,y:mi.y-mi.ry-12,'text-anchor':'middle'}));

  /* ── Ur ─────────────────────────────────────────────── */
  const urBoks = el('g',{transform:'translate(14,12)'});
  urBoks.appendChild(el('rect',{width:150,height:30,rx:15,fill:'#FFF9EE','fill-opacity':.93,stroke:'#17211F','stroke-width':1.8}));
  const urTekst = tekst('',{'class':'svg-ur',x:75,y:20,'text-anchor':'middle'});
  urBoks.appendChild(urTekst);
  lag.molekyler.before(urBoks);

  /* ── Slipzoner ──────────────────────────────────────── */
  const zoner = {
    plante:el('rect',{x:150,y:80,width:200,height:260,rx:18,'class':'zone'}),
    celle: el('rect',{x:c.x,y:c.y,width:c.b,height:c.h,rx:30,'class':'zone'}),
  };
  lag.zoner.append(zoner.plante, zoner.celle);

  /* ── Effekter, der lever et øjeblik ─────────────────── */
  const effekter = [];
  function nyEffekt(varighed, tegn, ryd){ effekter.push({t:0, varighed, tegn, ryd}); }

  function opdater(dt){
    for (let i=effekter.length-1;i>=0;i--){
      const e = effekter[i];
      e.t += dt;
      const u = Math.min(1, e.t/e.varighed);
      e.tegn(u);
      if (u >= 1){ e.ryd?.(); effekter.splice(i,1); }
    }
  }

  /* Et glimt i kloroplasten eller mitokondriet, når processen kører. */
  function blink(hvad){
    const n = hvad === 'foto' ? klYdre : miYdre;
    const kort = roligt() ? 0.25 : 0.7;
    nyEffekt(kort, u => n.setAttribute('stroke-width', (2.6 + 3.6*Math.sin(Math.PI*u)).toFixed(2)),
                   () => n.setAttribute('stroke-width', 2.6));
    if (hvad === 'mito'){
      nyEffekt(roligt() ? 0.3 : 1.1, u => miGlod.setAttribute('opacity', (0.9*Math.sin(Math.PI*u)).toFixed(2)),
                                      () => miGlod.setAttribute('opacity', 0));
    }
  }

  /* Energien fra respirationen: et lille udbrud, der stiger op. */
  function energi(){
    const g = el('g',{'class':'energi'});
    const stjerne = el('polygon',{
      points:'0,-13 3.5,-4 13,-4 5.5,2 8.5,12 0,6 -8.5,12 -5.5,2 -13,-4 -3.5,-4',
      fill:'#FFD43B',stroke:'#17211F','stroke-width':1.8,'stroke-linejoin':'round',
    });
    g.append(stjerne, tekst('energi',{'class':'svg-energi',x:16,y:5}));
    lag.effekter.appendChild(g);
    const {x, y} = MAAL.mitokondrie;
    nyEffekt(roligt() ? 0.6 : 1.4, u => {
      const op = u < 0.15 ? u/0.15 : 1 - Math.max(0, (u-0.6)/0.4);
      g.setAttribute('opacity', op.toFixed(2));
      g.setAttribute('transform','translate('+(x+30)+','+(y-20-34*u).toFixed(1)+') scale('+(0.7+0.3*Math.min(1,u*4)).toFixed(2)+')');
    }, () => g.remove());
  }

  /* ── Opdateringer udefra ────────────────────────────── */
  let sidsteUr = '';
  function saetUr(s){ if (s !== sidsteUr){ urTekst.textContent = s; sidsteUr = s; } }

  function saetHimmel(hoejde, skydaekke, klokken, lys){
    const dag = Math.min(1, hoejde*2.6);
    dagFlade.setAttribute('opacity', dag.toFixed(3));
    const naer = Math.max(1 - Math.abs(klokken-6)/1.8, 1 - Math.abs(klokken-18)/1.8);
    skumFlade.setAttribute('opacity', klem(naer, 0, 1).toFixed(3));
    const sky = 1 - skydaekke/100;
    graaFlade.setAttribute('opacity', (sky * 0.5 * dag).toFixed(3));
    skyer.setAttribute('opacity', klem(sky*1.8, 0, 1).toFixed(3));
    skyListe.forEach((s,i) => s.setAttribute('fill', sky > 0.6 ? (i%2 ? '#C9D0D4' : '#D7DDE0') : '#F7F9FA'));
    stjerner.setAttribute('opacity', ((1-dag) * (1 - sky*0.8)).toFixed(3));
    natSloer.setAttribute('opacity', ((1-dag)*0.42).toFixed(3));

    const lyst = klokken > 6 && klokken < 18;
    sol.setAttribute('opacity', lyst ? 1 : 0);
    maane.setAttribute('opacity', lyst ? 0 : 1);
    solGlorie.setAttribute('opacity', (skydaekke/100).toFixed(2));
    if (lyst){
      const f = (klokken-6)/12;
      const sx = 46 + 412*f, sy = H - 278*Math.sin(Math.PI*f);
      flyt(sol, sx, sy);
      /* en blød lyskegle fra solen ned over planten */
      const t = geo.top;
      lysKegle.setAttribute('points',
        sx+','+sy+' '+(t.x-80)+','+(t.y+30)+' '+(MAAL.plante.x-30)+','+H+' '+(MAAL.plante.x+40)+','+H+' '+(t.x+80)+','+(t.y+30));
      straale.setAttribute('x1', sx); straale.setAttribute('y1', sy);
      straale.setAttribute('x2', MAAL.plante.x); straale.setAttribute('y2', H);
      lysKegle.setAttribute('opacity', (0.55*lys).toFixed(3));
    } else {
      lysKegle.setAttribute('opacity', 0);
      const tt = klokken >= 18 ? klokken-18 : klokken+6;
      const f = tt/12;
      flyt(maane, 46 + 412*f, H - 210*Math.sin(Math.PI*f));
    }
    lysStriber.setAttribute('opacity', (0.9*lys).toFixed(3));
    granaGlod.setAttribute('opacity', (0.8*lys).toFixed(3));
  }

  function saetSlots(co2, h2o){
    slotIndhold.textContent = '';
    for (const [type, antal] of [['co2',co2],['h2o',h2o]]){
      slots[type].forEach((ring,i) => {
        const fyldt = i < antal;
        ring.setAttribute('stroke-dasharray', fyldt ? 'none' : '4 4');
        ring.setAttribute('fill', fyldt ? '#FFFFFF' : '#FFFDF6');
        if (!fyldt) return;
        const m = tegnMolekyle(type, {navn:false});
        const p = slotPos(type, i);
        flyt(m, p.x, p.y, 0.72);
        slotIndhold.appendChild(m);
      });
      slotTal[type].textContent = antal + '/6';
    }
  }

  function saetLager(antal){
    lagerHylde.textContent = '';
    const vist = Math.min(antal, MAAL.lager.maks);
    for (let i=0;i<vist;i++){
      const g = tegnMolekyle('glukose',{navn:false});
      flyt(g, MAAL.lager.x + i*MAAL.lager.spring, MAAL.lager.y, 1);
      lagerHylde.appendChild(g);
    }
    if (antal > MAAL.lager.maks){
      lagerHylde.appendChild(tekst('+'+(antal-MAAL.lager.maks),{
        'class':'svg-tal',x:MAAL.lager.x + MAAL.lager.maks*MAAL.lager.spring - 4,
        y:MAAL.lager.y+5,
      }));
    }
  }

  return {svg, lag, zoner, tegnPlante, saetHimmel, saetSlots, saetLager, saetUr, blink, energi, opdater,
          geometri:() => geo};
}

export function slotX(i){
  return MAAL.kloroplast.x + (i - 2.5) * MAAL.slots.spring;
}
export function slotPos(type, i){
  return {x:slotX(i), y:type === 'co2' ? MAAL.slots.yCo2 : MAAL.slots.yH2o};
}
export function lagerPos(i){
  return {x:MAAL.lager.x + Math.min(i, MAAL.lager.maks-1)*MAAL.lager.spring, y:MAAL.lager.y};
}
/* Et tilfældigt sted i luften eller i jorden — dér kommer og går
   molekylerne, når modellen selv leverer dem. */
export function luftPos(){
  return {x:50 + Math.random()*420, y:60 + Math.random()*220};
}
export function jordPos(){
  return {x:40 + Math.random()*440, y:MAAL.horisont + 30 + Math.random()*80};
}
export const kloroplastPos = () => ({x:MAAL.kloroplast.x, y:MAAL.kloroplast.y + 8});
export const mitokondriePos = () => ({x:MAAL.mitokondrie.x, y:MAAL.mitokondrie.y});
export const granaPos = () => [-92, 0, 92].map(dx => ({x:MAAL.kloroplast.x + dx, y:MAAL.kloroplast.y + 52}));

/* ── Vejene gennem planten ─────────────────────────────── *
 * Hver vej er en række punkter, side.js lægger en blød kurve
 * igennem. `geo` er plantens aktuelle form fra tegnPlante.     */
const P = MAAL;
const ind = p => ({x:p.x + 26, y:p.y});
export const VEJ = {
  co2:  (geo, fra, til) => [fra, geo.anker, P.portLuft, ind(P.portLuft), til],
  h2o:  (geo, fra, til) => [fra, geo.rod, geo.bund, geo.midt, geo.anker, P.portVand, ind(P.portVand), til],
  ud:   (geo, fra, til) => [fra, ind(P.portLuft), P.portLuft, geo.anker, til],
  iltInd:(geo, fra, til) => [fra, geo.anker, P.portLuft, ind(P.portLuft), til],
  vaekst:(geo, fra) => [fra, ind(P.portVand), P.portVand, geo.anker, geo.midt],
  fraPlante:(geo, til) => [geo.midt, geo.anker, P.portVand, ind(P.portVand), til],
};
