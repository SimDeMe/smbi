/* ═══════════════════════════════════════════════════════════
   feltlinjer.js — feltlinjerne og stangmagneten.

   Begge bygges én gang i et system, hvor +Y er den magnetiske
   akse, og drejes så på plads, når polen flytter sig. Vendes
   feltet, spejles hele gruppen i aksen: linjerne ligger det samme
   sted, men pilene — og magnetens poler — bytter retning.
   ═══════════════════════════════════════════════════════════ */
import * as THREE from 'three';
import {feltlinje} from './felt.js';

/* L er, hvor langt ude over ækvator en linje når, målt i jord-
   radier. Otte magnetiske meridianer med tre linjer i hver. */
const SKALLER = [1.4, 2.0, 3.0];
const MERIDIANER = 8;

export function byggFeltlinjer(jord){
  const gruppe = new THREE.Group();
  const linjer = new THREE.Group(), magnet = new THREE.Group();
  gruppe.add(linjer, magnet);
  jord.add(gruppe);

  /* ── Linjerne ──────────────────────────────────────────── */
  const linjeMat = new THREE.MeshBasicMaterial({color:0x8FD8F4, transparent:true, opacity:0.8});
  const pilMat   = new THREE.MeshBasicMaterial({color:0xFFB300});
  const pilGeo   = new THREE.ConeGeometry(0.03, 0.085, 10);
  const Y = new THREE.Vector3(0, 1, 0);

  for(let m=0;m<MERIDIANER;m++){
    const phi = m/MERIDIANER*Math.PI*2;
    for(const L of SKALLER){
      const pkt = feltlinje(L, phi).map(p => new THREE.Vector3(...p));
      const kurve = new THREE.CatmullRomCurve3(pkt);
      linjer.add(new THREE.Mesh(new THREE.TubeGeometry(kurve, 90, 0.0065, 6, false), linjeMat));

      /* Pile over ækvator og — på de store sløjfer — på vej op og ned. */
      const steder = L > 2.5 ? [0.22, 0.5, 0.78] : [0.5];
      for(const u of steder){
        const pil = new THREE.Mesh(pilGeo, pilMat);
        pil.position.copy(kurve.getPointAt(u));
        pil.quaternion.setFromUnitVectors(Y, kurve.getTangentAt(u));
        linjer.add(pil);
      }
    }
  }

  /* ── Stangmagneten ─────────────────────────────────────── *
   * Den magnetiske nordpol er magnetens SYDende: det er dér,
   * feltlinjerne går ind. Den øverste halvdel er derfor S.     */
  const HALV = 0.5, R = 0.085;
  const sEnde = new THREE.Mesh(
    new THREE.CylinderGeometry(R, R, HALV, 24),
    new THREE.MeshStandardMaterial({color:0x0E86C8, roughness:0.5})
  );
  sEnde.position.y = HALV/2;
  const nEnde = new THREE.Mesh(
    new THREE.CylinderGeometry(R, R, HALV, 24),
    new THREE.MeshStandardMaterial({color:0xE8336D, roughness:0.5})
  );
  nEnde.position.y = -HALV/2;
  const ankerS = new THREE.Object3D(); ankerS.position.y =  HALV + 0.12;
  const ankerN = new THREE.Object3D(); ankerN.position.y = -HALV - 0.12;
  magnet.add(sEnde, nEnde, ankerS, ankerN);
  magnet.visible = false;

  const _p = new THREE.Vector3();
  return {
    /** pol: den magnetiske pol på den nordlige halvkugle, [x,y,z]. */
    saetPol(pol, vendt){
      _p.set(pol[0], pol[1], pol[2]).normalize();
      gruppe.quaternion.setFromUnitVectors(Y, _p);
      gruppe.scale.set(1, vendt ? -1 : 1, 1);
    },
    visLinjer(til){ linjer.visible = til; },
    visMagnet(til){ magnet.visible = til; },
    ankre:{magnetS:ankerS, magnetN:ankerN},
  };
}
