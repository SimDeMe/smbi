/* ═══════════════════════════════════════════════════════════
   kompas.js — kompasset på kloden.

   Et lille kompas, der ligger vandret på jordoverfladen, med
   nålen efter feltet og en fast markering mod geografisk nord.
   Dertil to buer langs jorden: en prikket mod den geografiske
   nordpol og en optrukket mod det sted, nålen peger hen.
   ═══════════════════════════════════════════════════════════ */
import * as THREE from 'three';
import {kropPos, lokaltSystem, storcirkel} from './felt.js';

const R_KOMPAS = 0.13, LOEFT = 1.012;

export function byggKompas(jord){
  const kompas = new THREE.Group();
  jord.add(kompas);

  const hvid = new THREE.MeshStandardMaterial({color:0xFFFFFF, roughness:0.6});
  const blæk = new THREE.MeshBasicMaterial({color:0x17211F});
  const skive = new THREE.Mesh(new THREE.CylinderGeometry(R_KOMPAS, R_KOMPAS, 0.012, 40), hvid);
  const kant  = new THREE.Mesh(new THREE.TorusGeometry(R_KOMPAS, 0.009, 8, 48), blæk);
  kant.rotation.x = Math.PI/2;
  kompas.add(skive, kant);

  /* Geografisk nord: en gul trekant på kanten (lokal −Z er nord). */
  const nordMærke = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.045, 3),
    new THREE.MeshBasicMaterial({color:0xFFB300}));
  nordMærke.rotation.x = -Math.PI/2;
  nordMærke.position.set(0, 0.012, -R_KOMPAS-0.03);
  kompas.add(nordMærke);

  /* Nålen: rød nordende, lys sydende. */
  const nål = new THREE.Group();
  const nordEnde = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.085, 4),
    new THREE.MeshBasicMaterial({color:0xE8336D}));
  nordEnde.rotation.x = -Math.PI/2; nordEnde.position.z = -0.0425;
  const sydEnde = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.085, 4),
    new THREE.MeshBasicMaterial({color:0xE4E0D4}));
  sydEnde.rotation.x = Math.PI/2; sydEnde.position.z = 0.0425;
  const nav = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.02, 12), blæk);
  nål.add(nordEnde, sydEnde, nav);
  nål.position.y = 0.022;
  nål.scale.set(1.3, 0.45, 1.3);       // fladere nål, der fylder skiven
  kompas.add(nål);

  const top = new THREE.Object3D(); top.position.y = 0.05;
  kompas.add(top);

  /* ── Buerne ────────────────────────────────────────────── */
  const N_BUE = 96;
  const bueMat = new THREE.MeshBasicMaterial({color:0xE8336D});
  let magBue = null;

  /* Buen mod geografisk nord er prikket, så den kan skelnes fra
     den magnetiske uden farve. */
  const prikGeo = new THREE.SphereGeometry(0.009, 8, 6);
  const prikker = new THREE.InstancedMesh(prikGeo, new THREE.MeshBasicMaterial({color:0xFFB300}), N_BUE+1);
  prikker.frustumCulled = false;
  jord.add(prikker);

  const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(1, 1, 1);

  /**
   * @param lat, lon  kompassets plads
   * @param D         misvisningen i grader (positiv mod øst)
   * @param mod       [x,y,z] — den pol, nålens nordende peger mod
   */
  function saet(lat, lon, D, mod){
    const p = kropPos(lat, lon);
    const {op, oest, nord} = lokaltSystem(p);
    const syd = nord.map(v => -v);
    _m.makeBasis(new THREE.Vector3(...oest), new THREE.Vector3(...op), new THREE.Vector3(...syd));
    kompas.quaternion.setFromRotationMatrix(_m);
    kompas.position.set(p[0]*LOEFT, p[1]*LOEFT, p[2]*LOEFT);
    nål.rotation.y = -D*Math.PI/180;

    /* Magnetisk bue: storcirklen mod polen. I en ren dipol er den
       præcis den vej, nålen peger. */
    if(magBue){ jord.remove(magBue); magBue.geometry.dispose(); }
    const bue = storcirkel(p, mod, N_BUE, 1.006).map(v => new THREE.Vector3(...v));
    magBue = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(bue), N_BUE, 0.0065, 6, false), bueMat);
    jord.add(magBue);

    /* Geografisk bue: prikker hver 1,5. grad eller deromkring. */
    const geo = storcirkel(p, [0,1,0], N_BUE, 1.006);
    const vinkel = Math.acos(Math.max(-1, Math.min(1, op[1])));
    const trin = Math.max(1, Math.round(N_BUE / Math.max(vinkel*38, 1)));
    let n = 0;
    for(let i=trin;i<=N_BUE;i+=trin){
      _m.compose(new THREE.Vector3(...geo[i]), _q, _s);
      prikker.setMatrixAt(n++, _m);
    }
    prikker.count = n;
    prikker.instanceMatrix.needsUpdate = true;
  }

  return {
    saet,
    anker: top,
    vis(til){ kompas.visible = til; prikker.visible = til; if(magBue) magBue.visible = til; },
  };
}
