/* ═══════════════════════════════════════════════════════════
   molekyler.js — fagdataene.

   De fire molekyler, siden handler om, og den kuglemodel hver
   af dem tegnes som. Ét sted at rette, hvis en farve, en formel
   eller en formulering skal skærpes.

   Farverne følger kuglemodellernes: kulstof mørkt, ilt rødt,
   brint lyst. Men farven står aldrig alene — hvert molekyle har
   sin egen form (CO₂ er lige, H₂O er bøjet, O₂ er to kugler,
   glukose er en ring) og sin formel skrevet under sig.

   Kuglerne får deres skygge fra gradienterne #kugle-C, #kugle-O
   og #kugle-H, som scene.js lægger i figurens <defs>.
   ═══════════════════════════════════════════════════════════ */

export const ATOMFARVER = {
  C:'#3A4744',   /* kulstof — mørk grafit  */
  O:'#FF6A3D',   /* ilt — koralrød         */
  H:'#FFF9EE',   /* brint — papirhvid      */
};

export const MOLEKYLER = {
  co2:{
    id:'co2', navn:'Kuldioxid', formel:'CO₂',
    hvor:'i luften',
    atomer:[{x:-14,y:0,r:6.8,g:'O'},{x:0,y:0,r:7.8,g:'C'},{x:14,y:0,r:6.8,g:'O'}],
    bindinger:[[0,1],[1,2]],
  },
  h2o:{
    id:'h2o', navn:'Vand', formel:'H₂O',
    hvor:'i jorden',
    atomer:[{x:0,y:-3.5,r:7.8,g:'O'},{x:-11,y:6.5,r:5.2,g:'H'},{x:11,y:6.5,r:5.2,g:'H'}],
    bindinger:[[0,1],[0,2]],
  },
  o2:{
    id:'o2', navn:'Ilt', formel:'O₂',
    hvor:'i luften',
    atomer:[{x:-7,y:0,r:7.2,g:'O'},{x:7,y:0,r:7.2,g:'O'}],
    bindinger:[[0,1]],
  },
  /* Glukose tegnes ikke som kuglemodel — 24 atomer bliver til grød i
     den størrelse. Den får ringen, som eleverne møder den i: seks
     hjørner, hvoraf det ene er et iltatom. */
  glukose:{
    id:'glukose', navn:'Glukose', formel:'C₆H₁₂O₆',
    hvor:'i cellen',
    ring:{r:11},
  },
};

/* ── Tegning ───────────────────────────────────────────────
   Bygger ét molekyle som en <g>, der kan flyttes rundt med et
   transform. `navn` sætter formlen under kuglerne.            */
const NS = 'http://www.w3.org/2000/svg';
const ny = (navn, attrs) => {
  const n = document.createElementNS(NS, navn);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  return n;
};

export function tegnMolekyle(id, {navn=true, skala=1} = {}){
  const data = MOLEKYLER[id];
  const g = ny('g', {'class':'mol'});
  g.dataset.molekyle = id;

  const indre = ny('g', {'class':'mol-krop'});
  if (skala !== 1) indre.setAttribute('transform','scale('+skala+')');
  g.appendChild(indre);

  if (data.ring){
    const r = data.ring.r;
    const hjoerner = [];
    for (let i=0;i<6;i++){
      const v = Math.PI/180 * (60*i - 90);
      hjoerner.push([r*Math.cos(v), r*Math.sin(v)]);
    }
    indre.appendChild(ny('polygon',{
      points:hjoerner.map(p => p[0].toFixed(1)+','+p[1].toFixed(1)).join(' '),
      fill:'url(#glukose-fyld)', 'class':'atom ring',
    }));
    /* ringens iltatom sidder i hjørnet øverst til højre */
    const [ox, oy] = hjoerner[1];
    indre.appendChild(ny('circle',{cx:ox.toFixed(1), cy:oy.toFixed(1), r:3.6, fill:'url(#kugle-O)', 'class':'atom'}));
  } else {
    for (const [a,b] of data.bindinger){
      indre.appendChild(ny('line',{
        x1:data.atomer[a].x, y1:data.atomer[a].y,
        x2:data.atomer[b].x, y2:data.atomer[b].y, 'class':'binding',
      }));
    }
    for (const a of data.atomer){
      indre.appendChild(ny('circle',{cx:a.x, cy:a.y, r:a.r, fill:'url(#kugle-'+a.g+')', 'class':'atom'}));
    }
  }

  if (navn){
    const t = ny('text',{'class':'mol-navn', x:0, y:((data.ring ? 25 : 23) * skala).toFixed(1)});
    t.textContent = data.formel;
    g.appendChild(t);
  }
  return g;
}

/* Gradienterne, kuglerne og glukoseringen tegnes med. Lægges i
   figurens <defs> én gang. */
export function molekyleDefs(defs){
  const kugle = (id, lys, farve, skygge) => {
    const g = ny('radialGradient',{id, cx:'36%', cy:'32%', r:'70%'});
    g.append(
      ny('stop',{offset:'0%', 'stop-color':lys}),
      ny('stop',{offset:'55%', 'stop-color':farve}),
      ny('stop',{offset:'100%', 'stop-color':skygge}),
    );
    defs.appendChild(g);
  };
  kugle('kugle-C', '#7E8B88', ATOMFARVER.C, '#1E2725');
  kugle('kugle-O', '#FFC1A6', ATOMFARVER.O, '#C9431C');
  kugle('kugle-H', '#FFFFFF', ATOMFARVER.H, '#D9CDB5');

  const gl = ny('radialGradient',{id:'glukose-fyld', cx:'40%', cy:'35%', r:'75%'});
  gl.append(
    ny('stop',{offset:'0%', 'stop-color':'#E4FBC9'}),
    ny('stop',{offset:'60%', 'stop-color':'#9BE07A'}),
    ny('stop',{offset:'100%', 'stop-color':'#4FA22A'}),
  );
  defs.appendChild(gl);
}
