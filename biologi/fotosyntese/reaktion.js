/* ═══════════════════════════════════════════════════════════
   reaktion.js — selve fotosyntesen, set udefra.

   Når kloroplasten har seks CO₂ og seks H₂O, og reaktionen går i
   gang, sker der fire ting efter hinanden:

     1. lys   — lysenergi flyver ind og fanges i grana
     2. saml  — de tolv molekyler forlader pladserne og stiller
                sig i en ring
     3. drej  — ringen drejer og trækker sig sammen
     4. udbrud — et lysglimt, og tilbage står ét glukosemolekyle
                og seks ilt, der skubbes lidt ud fra midten

   Modulet regner ikke på biologi og kender ikke scenen — det får
   at vide, hvor molekylerne og grana står. Ilten og glukosen
   sender side.js videre, når ringen er færdig.
   ═══════════════════════════════════════════════════════════ */
import {tegnMolekyle} from '../faelles/molekyler.js';

const NS = 'http://www.w3.org/2000/svg';

const RING_UD = 70;    /* ringens radius, når molekylerne har fundet plads */
const RING_IND = 12;   /* … og når den er trukket helt sammen              */

const TID = {lys:0.8, saml:0.55, drej:0.95, udbrud:0.6};
/* Ved reduceret bevægelse skal skiftet stadig kunne ses — men det
   skal være overstået med det samme og uden at snurre rundt. */
const TID_ROLIG = {lys:0.12, saml:0.14, drej:0.12, udbrud:0.2};

const roligt = () => !!window.matchMedia?.('(prefers-reduced-motion:reduce)')?.matches;
const blend = (a, b, u) => a + (b - a) * u;
const bloed = u => u < 0.5 ? 2*u*u : 1 - Math.pow(-2*u+2, 2)/2;
const flyt = (n, x, y, skala) =>
  n.setAttribute('transform','translate('+x.toFixed(1)+','+y.toFixed(1)+') scale('+skala.toFixed(3)+')');
const ny = (navn, attrs) => {
  const n = document.createElementNS(NS, navn);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  return n;
};

/* `start` er de tolv molekyler i den rækkefølge, de skal stå i
   ringen: [{type, fra:{x,y}}, …]. `lysFra` er der, lyset kommer
   fra, og `grana` er de punkter, det fanges i. `naarFaerdig` får
   de seks iltmolekylers pladser med, så side.js kan sende dem ud. */
export function nyRing(lag, midte, start, naarFaerdig, {lysFra, grana} = {}){
  const tid = roligt() ? TID_ROLIG : TID;
  const drejninger = roligt() ? 0 : 1.6;
  const t1 = tid.lys, t2 = t1 + tid.saml, t3 = t2 + tid.drej, slut = t3 + tid.udbrud;
  const paaRing = (v, r) => ({x:midte.x + r*Math.cos(v), y:midte.y + r*Math.sin(v)});

  /* lysenergien: små fotoner fra lyset ned i grana */
  const fotoner = [];
  if (lysFra && grana?.length){
    for (let i=0;i<12;i++){
      const maal = grana[i % grana.length];
      const f = ny('g',{opacity:0});
      f.append(ny('circle',{r:13, fill:'url(#foton)'}), ny('circle',{r:4, fill:'#FFF6B0', stroke:'#C99400', 'stroke-width':1.4}));
      lag.appendChild(f);
      fotoner.push({node:f, fra:{x:lysFra.x + (i%3)*26, y:lysFra.y + Math.floor(i/3)*8}, til:maal, forsink:i*0.04});
    }
  }

  const dele = start.map((s, i) => {
    const node = tegnMolekyle(s.type, {navn:false});
    node.classList.add('flyver');
    flyt(node, s.fra.x, s.fra.y, 0.72);
    lag.appendChild(node);
    return {node, fra:s.fra, vinkel:-Math.PI/2 + i*Math.PI/6};
  });

  const udbrud = ny('circle',{cx:midte.x, cy:midte.y, r:RING_IND, fill:'url(#udbrud)', opacity:0});
  lag.appendChild(udbrud);

  const glukose = tegnMolekyle('glukose', {navn:false});
  glukose.classList.add('flyver');
  glukose.setAttribute('opacity', 0);
  flyt(glukose, midte.x, midte.y, 0.3);
  lag.appendChild(glukose);

  /* ilten dukker op i ringen og skubbes lidt ud */
  const ilt = [];
  for (let i=0;i<6;i++){
    const node = tegnMolekyle('o2', {navn:false});
    node.classList.add('flyver');
    node.setAttribute('opacity', 0);
    lag.appendChild(node);
    ilt.push({node, vinkel:-Math.PI/2 + Math.PI/6 + i*Math.PI/3});
  }

  let ur = 0, ryddet = false;
  function ryd(){
    if (ryddet) return;
    ryddet = true;
    for (const f of fotoner) f.node.remove();
    for (const d of dele) d.node.remove();
    for (const o of ilt) o.node.remove();
    udbrud.remove();
    glukose.remove();
  }

  function opdater(dt){
    if (ryddet) return;
    ur += dt;

    for (const f of fotoner){
      const u = Math.max(0, Math.min(1, (ur - f.forsink) / (tid.lys * 0.5)));
      const e = u*u;
      f.node.setAttribute('transform','translate('+blend(f.fra.x, f.til.x, e).toFixed(1)+','+blend(f.fra.y, f.til.y, e).toFixed(1)+')');
      f.node.setAttribute('opacity', (u <= 0 || u >= 1) ? 0 : (u < 0.2 ? u/0.2 : 1).toFixed(2));
    }

    if (ur < t1){
      /* molekylerne venter på pladserne, mens lyset kommer ind */
    } else if (ur < t2){
      const u = bloed((ur - t1) / tid.saml);
      for (const d of dele){
        const maal = paaRing(d.vinkel, RING_UD);
        flyt(d.node, blend(d.fra.x, maal.x, u), blend(d.fra.y, maal.y, u), 0.72);
      }
    } else if (ur < t3){
      const u = (ur - t2) / tid.drej;
      const drej = 2*Math.PI * drejninger * u*u;
      const r = blend(RING_UD, RING_IND, u*u);
      const s = blend(0.72, 0.3, u);
      const svind = 1 - Math.max(0, (u - 0.8)/0.2);
      for (const d of dele){
        const p = paaRing(d.vinkel + drej, r);
        flyt(d.node, p.x, p.y, s);
        d.node.setAttribute('opacity', svind.toFixed(2));
      }
      udbrud.setAttribute('opacity', (0.5*u*u).toFixed(2));
    } else {
      const u = Math.min(1, (ur - t3) / tid.udbrud);
      for (const d of dele) d.node.setAttribute('opacity', 0);
      udbrud.setAttribute('opacity', (1 - u).toFixed(2));
      udbrud.setAttribute('r', (RING_IND + 90*bloed(u)).toFixed(1));
      glukose.setAttribute('opacity', 1);
      const s = u < 0.5 ? blend(0.3, 1.4, u/0.5) : blend(1.4, 1.05, (u-0.5)/0.5);
      flyt(glukose, midte.x, midte.y, s);
      for (const o of ilt){
        const r = blend(10, 54, bloed(u));
        o.node.setAttribute('opacity', Math.min(1, u*3).toFixed(2));
        flyt(o.node, midte.x + r*Math.cos(o.vinkel), midte.y + r*Math.sin(o.vinkel), blend(0.4, 1, Math.min(1,u*2)));
      }
    }

    if (ur >= slut){
      const pladser = ilt.map(o => ({x:midte.x + 54*Math.cos(o.vinkel), y:midte.y + 54*Math.sin(o.vinkel)}));
      ryd();
      naarFaerdig?.(pladser);
    }
  }

  return {opdater, ryd};
}
