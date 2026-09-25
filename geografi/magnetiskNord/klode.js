/* ═══════════════════════════════════════════════════════════
   klode.js — kloden selv.

   Kuglen med kystlinjer (samme tekstur som Tidevand.html),
   misvisningskortet, omdrejningsaksen, den magnetiske akse og
   nålene ved de to magnetiske poler. Alt sidder på `jord`, så det
   drejer med, når kloden drejer.
   ═══════════════════════════════════════════════════════════ */
import * as THREE from 'three';
import {tegnLand} from './kyst.js';
import {kropPos, misvisning} from './felt.js';

const TEX_W = 2048, TEX_H = 1024;     // teksturen
const KORT_W = 800, KORT_H = 400;     // misvisningskortet regnes i lavere opløsning
export const KORT_MAKS = 40;          // farveskalaen går fra 40° V til 40° Ø

function nyCanvas(w, h){ const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

/* Farven for en misvisning: blå mod vest, koral mod øst og lyst
   papir omkring 0°. Ud over ±40° går begge sider over i samme
   mørke lilla — så ser et vendt felt, hvor nålen peger mod syd,
   ens forkert ud overalt, i stedet for halvt blåt og halvt rødt. */
const VEST = [[240,236,222],[120,190,228],[14,134,200]];
const OEST = [[240,236,222],[255,184,150],[255,106,61]];
const FORKERT = [58,44,96];
export function kortFarve(D){
  const skala = D < 0 ? VEST : OEST;
  const t = Math.min(Math.abs(D)/KORT_MAKS, 1)*2;          // 0…2
  const ekstra = Math.min(Math.max(Math.abs(D)-KORT_MAKS, 0)/50, 1);
  const i = Math.min(Math.floor(t), 1), f = t-i;
  const a = skala[i], b = skala[i+1];
  let c = [a[0]+(b[0]-a[0])*f, a[1]+(b[1]-a[1])*f, a[2]+(b[2]-a[2])*f];
  if(ekstra > 0) c = c.map((v, k) => v+(FORKERT[k]-v)*ekstra);
  return c;
}

/* Bredde- og længdegrader, så man kan se kloden dreje. */
function tegnGrader(g){
  g.strokeStyle = 'rgba(255,255,255,0.18)'; g.lineWidth = 2;
  for(let la=-60; la<=60; la+=30){ const y = (90-la)/180*TEX_H;
    g.beginPath(); g.moveTo(0, y); g.lineTo(TEX_W, y); g.stroke(); }
  for(let lo=-180; lo<180; lo+=30){ const x = (lo+180)/360*TEX_W;
    g.beginPath(); g.moveTo(x, 0); g.lineTo(x, TEX_H); g.stroke(); }
  g.strokeStyle = 'rgba(255,255,255,0.36)'; g.lineWidth = 3;
  g.beginPath(); g.moveTo(0, TEX_H/2); g.lineTo(TEX_W, TEX_H/2); g.stroke();
}

/* Farverne slået op i forvejen for hver kvarte grad, så kortet
   ikke skal regne en farve ud for hvert af sine punkter. */
const LUT = (()=>{
  const t = new Uint8ClampedArray(1441*3);
  for(let i=0;i<=1440;i++){ const c = kortFarve(-180+i/4); t[i*3] = c[0]; t[i*3+1] = c[1]; t[i*3+2] = c[2]; }
  return t;
})();

/* To færdige landlag, så kun misvisningen skal regnes om, når
   polen flytter sig: et helt dækkende og et gennemsigtigt. */
function landLag(fyld){
  const c = nyCanvas(TEX_W, TEX_H), g = c.getContext('2d');
  g.fillStyle = fyld; g.strokeStyle = '#17211F'; g.lineWidth = 3; g.lineJoin = 'round';
  tegnLand(g, TEX_W, TEX_H, true);
  return c;
}

/* Punkterne på kortet ligger fast — kun polen flytter sig. */
const KORT_P = (()=>{
  const P = new Float32Array(KORT_W*KORT_H*3);
  for(let j=0;j<KORT_H;j++){
    const lat = 90-(j+0.5)*180/KORT_H;
    for(let i=0;i<KORT_W;i++){
      const p = kropPos(lat, -180+(i+0.5)*360/KORT_W), k = (j*KORT_W+i)*3;
      P[k] = p[0]; P[k+1] = p[1]; P[k+2] = p[2];
    }
  }
  return P;
})();

export function byggKlode(scene){
  const tekstur = nyCanvas(TEX_W, TEX_H), tg = tekstur.getContext('2d');
  const helt = landLag('#F4EEDF'), gennemsigtigtLand = landLag('rgba(244,238,223,0.22)');
  const kort = nyCanvas(KORT_W, KORT_H), kg = kort.getContext('2d');
  const kortBillede = kg.createImageData(KORT_W, KORT_H);
  const Dgitter = new Float32Array(KORT_W*KORT_H);

  const map = new THREE.CanvasTexture(tekstur);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 4;

  const jord = new THREE.Mesh(
    new THREE.SphereGeometry(1, 96, 64),
    new THREE.MeshStandardMaterial({map, roughness:1, metalness:0})
  );
  scene.add(jord);

  /* ── Teksturen ─────────────────────────────────────────── */
  function tegnSimpel(){
    tg.fillStyle = 'rgb(23,86,132)'; tg.fillRect(0, 0, TEX_W, TEX_H);
    tegnGrader(tg);
    tg.drawImage(helt, 0, 0);
    map.needsUpdate = true;
  }

  /* Misvisningskortet: farve efter misvisningen, en tynd kurve for
     hver 10°, og den agoniske linje — dér hvor kompasset peger
     lige mod geografisk nord — optrukket. */
  function tegnKort(pol, vendt){
    const d = kortBillede.data, q = [0, 0, 0];
    for(let k=0;k<KORT_W*KORT_H;k++){
      q[0] = KORT_P[k*3]; q[1] = KORT_P[k*3+1]; q[2] = KORT_P[k*3+2];
      Dgitter[k] = misvisning(q, pol, vendt);
    }
    for(let j=0;j<KORT_H;j++){
      for(let i=0;i<KORT_W;i++){
        const k = j*KORT_W+i, D = Dgitter[k], f = Math.round((D+180)*4)*3;
        let r = LUT[f], g = LUT[f+1], b = LUT[f+2];
        /* Højre og nedre nabo: skifter vi 10°-bånd, er vi på en kurve.
           Et spring på over 90° er ikke en kurve, men stedet hvor
           nålen slår om fra ±180° — det springes over. */
        let kurve = 0;
        for(const n of [i < KORT_W-1 ? k+1 : k-i, j < KORT_H-1 ? k+KORT_W : -1]){
          if(n < 0) continue;
          const E = Dgitter[n];
          if(Math.abs(E-D) > 90) continue;
          if((D < 0) !== (E < 0)) kurve = 2;
          else if(kurve < 1 && Math.floor(D/10) !== Math.floor(E/10)) kurve = 1;
        }
        if(kurve){ const a = kurve === 2 ? 1 : 0.5;
          r += (23-r)*a; g += (33-g)*a; b += (31-b)*a; }
        d[k*4] = r; d[k*4+1] = g; d[k*4+2] = b; d[k*4+3] = 255;
      }
    }
    kg.putImageData(kortBillede, 0, 0);
    tg.imageSmoothingEnabled = true; tg.imageSmoothingQuality = 'high';
    tg.drawImage(kort, 0, 0, TEX_W, TEX_H);
    tegnGrader(tg);
    tg.drawImage(gennemsigtigtLand, 0, 0);
    map.needsUpdate = true;
  }

  /* ── Akserne ───────────────────────────────────────────── */
  const AKSE_L = 1.5;
  const omdrejning = new THREE.Mesh(
    new THREE.CylinderGeometry(0.011, 0.011, AKSE_L*2, 10),
    new THREE.MeshBasicMaterial({color:0xFFF6E0})
  );
  jord.add(omdrejning);

  /* Den magnetiske akse er stiplet — farve er ikke eneste signal. */
  const magAkse = new THREE.Group();
  {
    const mat = new THREE.MeshBasicMaterial({color:0xE8336D});
    const n = 15, stk = AKSE_L*2/(n*2-1);
    for(let i=0;i<n;i++){
      const s = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, stk, 8), mat);
      s.position.y = -AKSE_L + stk/2 + i*2*stk;
      magAkse.add(s);
    }
  }
  jord.add(magAkse);

  /* ── Nåle ved de magnetiske poler ──────────────────────── */
  function nål(farve){
    const g = new THREE.Group();
    const kugle = new THREE.Mesh(new THREE.SphereGeometry(0.04, 18, 12), new THREE.MeshBasicMaterial({color:farve}));
    kugle.position.y = 0.15;
    const stang = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.15, 8), new THREE.MeshBasicMaterial({color:farve}));
    stang.position.y = 0.075;
    const top = new THREE.Object3D(); top.position.y = 0.2;
    g.add(kugle, stang, top);
    g.top = top;
    jord.add(g);
    return g;
  }
  const nålNord = nål(0xE8336D), nålSyd = nål(0xFFF6E0);

  /* Ankre til mærkaterne. */
  const geoNord = new THREE.Object3D(); geoNord.position.y =  AKSE_L+0.06;
  const geoSyd  = new THREE.Object3D(); geoSyd.position.y  = -AKSE_L-0.06;
  jord.add(geoNord, geoSyd);

  const Y = new THREE.Vector3(0, 1, 0);
  const _p = new THREE.Vector3();

  /**
   * Flytter polen. `pol` er den magnetiske pol på den nordlige
   * halvkugle som [x,y,z] i klodens system. Nålen ved den pol, som
   * kompassets nordende peger mod, er den magnetiske nordpol.
   */
  function saetPol(pol, vendt){
    _p.set(pol[0], pol[1], pol[2]).normalize();
    magAkse.quaternion.setFromUnitVectors(Y, _p);
    const mod = vendt ? _p.clone().negate() : _p.clone();
    nålNord.position.copy(mod);
    nålNord.quaternion.setFromUnitVectors(Y, mod);
    nålSyd.position.copy(mod).negate();
    nålSyd.quaternion.setFromUnitVectors(Y, nålSyd.position);
  }

  /** Tegner teksturen om — kun nødvendigt, når kortet slås til eller
      fra, eller når polen flytter sig, mens kortet er slået til. */
  function tegnTekstur(pol, vendt, medKort){
    if(medKort) tegnKort(pol, vendt); else tegnSimpel();
  }

  function gennemsigtig(til){
    const m = jord.material;
    m.transparent = til; m.opacity = til ? 0.38 : 1; m.depthWrite = !til;
    m.needsUpdate = true;
  }

  return {
    jord, saetPol, tegnTekstur, gennemsigtig,
    visAkser(til){ omdrejning.visible = til; magAkse.visible = til; },
    ankre:{geoNord, geoSyd, magNord:nålNord.top, magSyd:nålSyd.top},
  };
}
