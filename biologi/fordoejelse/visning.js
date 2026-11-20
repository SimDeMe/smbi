// 3D-visningen: indlæser Blender-modellen, drejer kameraet, finder delen under markøren
// og flytter madklumpen langs forløbet. Three.js genbruges fra biologi/celle-3d/vendor.
import * as T from '../celle-3d/vendor/three.module.min.js';
import {GLTFLoader} from '../celle-3d/vendor/addons/loaders/GLTFLoader.js';
import {MeshoptDecoder} from '../celle-3d/vendor/addons/libs/meshopt_decoder.module.js';
import {RoomEnvironment} from '../celle-3d/vendor/addons/RoomEnvironment.js';

const PAPIR = 0xFFF9EE;
const FREMHÆV = new T.Color('#E8336D');

export async function skabVisning(canvas, {vedHover, vedKlik} = {}) {
  const renderer = new T.WebGLRenderer({canvas, antialias: true, alpha: false});
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.NeutralToneMapping;
  renderer.toneMappingExposure = 1.0;

  const scene = new T.Scene();
  scene.background = new T.Color(PAPIR);
  const pmrem = new T.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.55;
  const sol = new T.DirectionalLight(0xffffff, 1.6);
  sol.position.set(-60, 120, 120);
  scene.add(sol, new T.HemisphereLight(0xfff6ea, 0x8a6f60, 0.55));

  const kamera = new T.PerspectiveCamera(28, 1, 1, 2000);

  // ---- model
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const gltf = await loader.loadAsync(new URL('fordoejelse.glb', import.meta.url).href);
  const model = gltf.scene;
  scene.add(model);
  const dele = new Map();          // del → [mesh]
  const pickbare = [];
  let krop = null;
  model.traverse((o) => {
    if (!o.isMesh) return;
    const del = o.userData.del;
    o.material = o.material.clone();
    o.userData.grund = {farve: o.material.color.clone(), opacitet: o.material.opacity};
    if (del === 'krop') {
      krop = o;
      Object.assign(o.material, {transparent: true, opacity: 0.13, depthWrite: false, side: T.FrontSide});
      o.material.color.set('#e9cdb6');
      o.renderOrder = 10;
      return;
    }
    if (!dele.has(del)) dele.set(del, []);
    dele.get(del).push(o);
    pickbare.push(o);
  });

  // ---- forløbet: punkterne langs kanalen
  const forløb = await (await fetch(new URL('forloeb.json', import.meta.url))).json();
  const stier = {};
  for (const d of forløb.dele) {
    const P = d.punkter.map((p) => new T.Vector3(...p));
    const L = [0];
    for (let i = 1; i < P.length; i++) L.push(L[i - 1] + P[i].distanceTo(P[i - 1]));
    stier[d.del] = {P, L};
  }
  const punktPå = (del, f) => {
    const {P, L} = stier[del];
    const s = Math.min(Math.max(f, 0), 1) * L[L.length - 1];
    let i = 1;
    while (i < L.length - 1 && L[i] < s) i++;
    const t = (s - L[i - 1]) / ((L[i] - L[i - 1]) || 1);
    return P[i - 1].clone().lerp(P[i], t);
  };

  // ---- madklumpen: en kugle og en svag «røntgen»-kopi, der altid kan ses gennem organerne
  const klump = new T.Mesh(new T.SphereGeometry(1, 32, 20),
    new T.MeshStandardMaterial({color: '#e8d3a3', roughness: 0.75}));
  const glimt = new T.Mesh(new T.SphereGeometry(1, 24, 16),
    new T.MeshBasicMaterial({color: '#E8336D', transparent: true, opacity: 0.35, depthTest: false, depthWrite: false}));
  glimt.renderOrder = 20;
  klump.visible = glimt.visible = false;
  scene.add(klump, glimt);

  // ---- kamera: kredsløb om et mål
  const box = new T.Box3().setFromObject(model);
  const midte = box.getCenter(new T.Vector3());
  const START = {mål: new T.Vector3(0, 14, 0), afstand: 245, az: 0.32, pol: 1.5};
  const kam = {mål: START.mål.clone(), afstand: START.afstand, az: START.az, pol: START.pol};
  const ønske = {mål: kam.mål.clone(), afstand: kam.afstand};
  let følg = null;   // Vector3, som kameraets mål glider hen mod

  function placérKamera() {
    const s = Math.sin(kam.pol);
    kamera.position.set(kam.mål.x + kam.afstand * s * Math.sin(kam.az), kam.mål.y + kam.afstand * Math.cos(kam.pol),
      kam.mål.z + kam.afstand * s * Math.cos(kam.az));
    kamera.lookAt(kam.mål);
  }

  // ---- tilstand for fremhævning
  let hover = null, valgt = null, aktive = new Set(), glas = new Set(), dæmp = false;

  function opdaterMaterialer() {
    for (const [del, ms] of dele) {
      const erValgt = valgt === del, erHover = hover === del, erAktiv = aktive.has(del);
      for (const m of ms) {
        const mat = m.material;
        mat.emissive.copy(FREMHÆV);
        mat.emissiveIntensity = erValgt ? 0.32 : erHover ? 0.18 : erAktiv ? 0.12 : 0;
        let op = 1;
        if (glas.has(del)) op = 0.38;
        else if (dæmp && valgt && !erValgt) op = 0.22;
        mat.transparent = op < 1;
        mat.opacity = op;
        mat.depthWrite = op === 1;
        m.renderOrder = op < 1 ? 5 : 0;
      }
    }
    tegn();
  }

  // ---- størrelse
  function tilpas() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    kamera.aspect = w / h;
    // smalle vinduer: træk kameraet tilbage, så hele modellen kan ses
    kamera.fov = w / h < 0.75 ? 34 : 28;
    kamera.updateProjectionMatrix();
    tegn();
  }
  new ResizeObserver(tilpas).observe(canvas);

  // ---- tegning: kun når noget ændrer sig
  let planlagt = false, animerer = false;
  function tegn() {
    if (planlagt) return;
    planlagt = true;
    requestAnimationFrame(trin);
  }
  function trin() {
    planlagt = false;
    // glid mod ønsket mål og afstand
    const mål = følg || ønske.mål;
    const før = kam.mål.clone(), førAfst = kam.afstand;
    kam.mål.lerp(mål, 0.12);
    kam.afstand += (ønske.afstand - kam.afstand) * 0.12;
    placérKamera();
    renderer.render(scene, kamera);
    if (animerer || kam.mål.distanceTo(før) > 0.01 || Math.abs(kam.afstand - førAfst) > 0.01) tegn();
  }

  // ---- markør: drej, zoom og vælg
  const ray = new T.Raycaster();
  const mus = new T.Vector2();
  function delUnder(x, y) {
    const r = canvas.getBoundingClientRect();
    mus.set(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(mus, kamera);
    const synlige = pickbare.filter((m) => m.visible && !(m.material.opacity < 0.3));
    const hit = ray.intersectObjects(synlige, false)[0];
    return hit ? hit.object.userData.del : null;
  }

  const pegere = new Map();
  let træk = null, knibAfstand = 0, flyttet = 0;
  canvas.addEventListener('pointerdown', (e) => {
    canvas.setPointerCapture(e.pointerId);
    pegere.set(e.pointerId, {x: e.clientX, y: e.clientY});
    træk = {x: e.clientX, y: e.clientY};
    flyttet = 0;
    if (pegere.size === 2) {
      const [a, b] = [...pegere.values()];
      knibAfstand = Math.hypot(a.x - b.x, a.y - b.y);
    }
  });
  canvas.addEventListener('pointermove', (e) => {
    if (pegere.has(e.pointerId)) pegere.set(e.pointerId, {x: e.clientX, y: e.clientY});
    if (pegere.size === 2) {
      const [a, b] = [...pegere.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (knibAfstand) zoom(knibAfstand / d);
      knibAfstand = d;
      flyttet += 10;
      return;
    }
    if (træk && pegere.size === 1) {
      const dx = e.clientX - træk.x, dy = e.clientY - træk.y;
      flyttet += Math.abs(dx) + Math.abs(dy);
      træk = {x: e.clientX, y: e.clientY};
      drej(-dx * 0.008, -dy * 0.008);
      return;
    }
    if (e.pointerType === 'mouse') {
      const d = delUnder(e.clientX, e.clientY);
      if (d !== hover) {
        hover = d;
        canvas.style.cursor = d ? 'pointer' : 'grab';
        opdaterMaterialer();
      }
      vedHover?.(d, e.clientX, e.clientY);
    }
  });
  const slip = (e) => {
    pegere.delete(e.pointerId);
    if (pegere.size < 2) knibAfstand = 0;
    if (træk && pegere.size === 0) {
      if (flyttet < 6) vedKlik?.(delUnder(e.clientX, e.clientY));
      træk = null;
    }
  };
  canvas.addEventListener('pointerup', slip);
  canvas.addEventListener('pointercancel', (e) => { pegere.delete(e.pointerId); træk = null; });
  canvas.addEventListener('pointerleave', () => {
    if (hover) { hover = null; opdaterMaterialer(); }
    vedHover?.(null);
  });
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    zoom(Math.exp(e.deltaY * 0.0012));
  }, {passive: false});
  canvas.addEventListener('keydown', (e) => {
    const k = {ArrowLeft: [0.12, 0], ArrowRight: [-0.12, 0], ArrowUp: [0, 0.1], ArrowDown: [0, -0.1]}[e.key];
    if (k) { e.preventDefault(); drej(...k); }
    if (e.key === '+' || e.key === '=') zoom(0.85);
    if (e.key === '-') zoom(1.18);
  });

  function drej(daz, dpol) {
    kam.az += daz;
    kam.pol = Math.min(Math.max(kam.pol + dpol, 0.25), Math.PI - 0.25);
    tegn();
  }
  function zoom(f) {
    ønske.afstand = Math.min(Math.max(ønske.afstand * f, 25), 330);
    kam.afstand = ønske.afstand;
    tegn();
  }

  tilpas();
  placérKamera();
  tegn();

  return {
    dele: [...dele.keys()],
    midtpunkt(del) {
      const b = new T.Box3();
      for (const m of dele.get(del) || []) b.expandByObject(m);
      return b.getCenter(new T.Vector3());
    },
    vælg(del, {fokus = false} = {}) {
      valgt = del;
      if (fokus && del) {
        const b = new T.Box3();
        for (const m of dele.get(del)) b.expandByObject(m);
        ønske.mål.copy(b.getCenter(new T.Vector3()));
        const str = b.getSize(new T.Vector3()).length();
        ønske.afstand = Math.min(Math.max(str * 3.2, 45), 200);
      }
      opdaterMaterialer();
    },
    dæmpAndre(v) { dæmp = v; opdaterMaterialer(); },
    aktiv(liste) { aktive = new Set(liste); opdaterMaterialer(); },
    glas(liste) { glas = new Set(liste); opdaterMaterialer(); },
    visKrop(v) { if (krop) krop.visible = v; tegn(); },
    nulstil() {
      følg = null;
      ønske.mål.copy(START.mål); ønske.afstand = START.afstand;
      kam.az = START.az; kam.pol = START.pol;
      tegn();
    },
    // rundturen: placér klumpen i et trin (0–1 inden for trinnet)
    klump(del, f, {farve, radius, følgMed, puls = 0}) {
      if (!del) {
        klump.visible = glimt.visible = false;
        if (følg) ønske.mål.copy(kam.mål);
        følg = null; tegn(); return;
      }
      const p = punktPå(del, f);
      klump.position.copy(p); glimt.position.copy(p);
      const r = radius * (1 + puls);
      klump.scale.setScalar(r); glimt.scale.setScalar(r * 1.25);
      klump.material.color.set(farve);
      klump.visible = glimt.visible = true;
      if (følgMed) {
        følg = p;
        ønske.afstand = Math.min(ønske.afstand, 95);
      } else if (følg) {
        ønske.mål.copy(kam.mål);
        følg = null;
      }
      tegn();
    },
    animer(v) { animerer = v; if (v) tegn(); },
    tegn,
  };
}
