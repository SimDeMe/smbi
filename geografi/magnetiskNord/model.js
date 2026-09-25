/* ═══════════════════════════════════════════════════════════
   model.js — rammen om 3D-figuren.

   Scene, kamera, lys, orbit-styring, klik, størrelse og render-
   løkke. Samme lille orbit-styring som Tidevand.html og
   biologi/membran/model.js; intet fagligt indhold her.
   ═══════════════════════════════════════════════════════════ */
import * as THREE from 'three';

/* Brugere, der har slået bevægelse fra i systemet, skal have en
   figur der står stille. Alle animationer spørger til denne. */
export const ROLIG = window.matchMedia('(prefers-reduced-motion:reduce)').matches;

/**
 * @param lærred  <canvas> der tegnes i
 * @param boks    elementet, hvis bredde bestemmer figurens størrelse
 * @param start   {az, el, dist} — kameraets udgangspunkt
 * @param hint    elementet der skal fade væk, første gang man rører figuren
 * @param vedKlik kaldes med pointer-hændelsen, når man klikker uden at trække
 */
export function byggScene({lærred, boks, hint, start, vedKlik}){
  const renderer = new THREE.WebGLRenderer({canvas:lærred, antialias:true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x0B1220, 1);

  const scene  = new THREE.Scene();
  const kamera = new THREE.PerspectiveCamera(38, 1.5, 0.1, 200);

  /* Lyset følger kameraet, så den side af kloden, man kigger på,
     altid er belyst — her er der ingen sol at tage hensyn til. */
  scene.add(new THREE.AmbientLight(0x6A83A8, 1.1));
  const lys = new THREE.DirectionalLight(0xFFF3DC, 2.1);
  scene.add(lys);

  /* Stjerner */
  {
    const n = 520, pos = new Float32Array(n*3);
    for(let i=0;i<n;i++){
      const u = Math.random()*2-1, a = Math.random()*Math.PI*2, r = Math.sqrt(1-u*u)*46;
      pos[i*3] = Math.cos(a)*r; pos[i*3+1] = Math.sin(a)*r; pos[i*3+2] = u*46;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    scene.add(new THREE.Points(g, new THREE.PointsMaterial({
      color:0xBFD3E8, size:0.22, sizeAttenuation:true, transparent:true, opacity:0.75})));
  }

  /* ── Kamera ────────────────────────────────────────────── */
  const cam = {...start};
  const udgangspunkt = {...start};

  function opdaterKamera(){
    cam.el   = Math.max(-1.4, Math.min(1.4, cam.el));
    cam.dist = Math.max(2.3, Math.min(10, cam.dist));
    kamera.position.set(
      cam.dist*Math.cos(cam.el)*Math.sin(cam.az),
      cam.dist*Math.sin(cam.el),
      cam.dist*Math.cos(cam.el)*Math.cos(cam.az)
    );
    kamera.lookAt(0, 0, 0);
    /* lidt til venstre for og over kameraet */
    lys.position.copy(kamera.position).applyAxisAngle(new THREE.Vector3(0,1,0), 0.5);
    lys.position.y += 2.5;
  }
  opdaterKamera();

  /* ── Blød flyvning hen til et nyt standpunkt ───────────── */
  let flyvning = null;
  function flyvTil({az, el, dist}, varighed = 1.0){
    const slut = {az: az ?? cam.az, el: el ?? cam.el, dist: dist ?? cam.dist};
    let drej = slut.az - cam.az;                   // den korteste vej rundt
    while(drej >  Math.PI) drej -= Math.PI*2;
    while(drej < -Math.PI) drej += Math.PI*2;
    slut.az = cam.az + drej;
    if(ROLIG || varighed <= 0){ Object.assign(cam, slut); opdaterKamera(); flyvning = null; return; }
    flyvning = {tid:0, varighed, slut, fra:{az:cam.az, el:cam.el, dist:cam.dist}};
  }
  function fremFlyvning(dt){
    if(!flyvning) return;
    flyvning.tid += dt;
    const u = Math.min(flyvning.tid/flyvning.varighed, 1), k = u*u*(3-2*u);
    const {fra, slut} = flyvning;
    cam.az   = fra.az   + (slut.az   - fra.az)*k;
    cam.el   = fra.el   + (slut.el   - fra.el)*k;
    cam.dist = fra.dist + (slut.dist - fra.dist)*k;
    opdaterKamera();
    if(u >= 1) flyvning = null;
  }
  const nulstilKamera = () => flyvTil(udgangspunkt);

  const skjulHint = () => hint && hint.classList.add('gone');

  (function styring(){
    let traekker = false, sidst = null, knib = null, ned = null;

    lærred.addEventListener('pointerdown', e=>{
      if(e.pointerType === 'touch' && e.isPrimary === false) return;
      flyvning = null;
      traekker = true; sidst = {x:e.clientX, y:e.clientY}; ned = {x:e.clientX, y:e.clientY};
      lærred.setPointerCapture(e.pointerId);
      lærred.classList.add('dragging');
    });
    lærred.addEventListener('pointermove', e=>{
      if(!traekker || !sidst) return;
      cam.az -= (e.clientX-sidst.x)*0.006;
      cam.el += (e.clientY-sidst.y)*0.006;
      sidst = {x:e.clientX, y:e.clientY};
      if(ned && Math.hypot(e.clientX-ned.x, e.clientY-ned.y) > 5) skjulHint();
      opdaterKamera();
    });
    const slip = e=>{
      /* Et klik er et tryk, der ikke flyttede sig: så skal kompasset
         flyttes, ikke kloden drejes. */
      if(e.type === 'pointerup' && ned && Math.hypot(e.clientX-ned.x, e.clientY-ned.y) <= 5 && vedKlik) vedKlik(e);
      traekker = false; sidst = null; ned = null;
      lærred.classList.remove('dragging');
      try{ lærred.releasePointerCapture(e.pointerId); }catch(_){}
    };
    lærred.addEventListener('pointerup', slip);
    lærred.addEventListener('pointercancel', slip);

    lærred.addEventListener('wheel', e=>{
      e.preventDefault(); skjulHint();
      cam.dist *= (1 + Math.sign(e.deltaY)*0.09);
      opdaterKamera();
    }, {passive:false});

    lærred.addEventListener('touchstart', e=>{
      if(e.touches.length === 2) knib = Math.hypot(e.touches[0].clientX-e.touches[1].clientX,
                                                   e.touches[0].clientY-e.touches[1].clientY);
    }, {passive:true});
    lærred.addEventListener('touchmove', e=>{
      if(e.touches.length === 2 && knib){
        const d = Math.hypot(e.touches[0].clientX-e.touches[1].clientX, e.touches[0].clientY-e.touches[1].clientY);
        cam.dist *= knib/d; knib = d; opdaterKamera(); e.preventDefault();
      }
    }, {passive:false});
    lærred.addEventListener('touchend', ()=>{ knib = null; });

    /* Betjening skal kunne klares med tastatur alene. */
    lærred.addEventListener('keydown', e=>{
      const k = e.key; let brugt = true;
      if(k === 'ArrowLeft')       cam.az += 0.09;
      else if(k === 'ArrowRight') cam.az -= 0.09;
      else if(k === 'ArrowUp')    cam.el += 0.07;
      else if(k === 'ArrowDown')  cam.el -= 0.07;
      else if(k === '+' || k === '=') cam.dist *= 0.9;
      else if(k === '-')          cam.dist *= 1.1;
      else if(k === '0')          nulstilKamera();
      else brugt = false;
      if(brugt){ e.preventDefault(); skjulHint(); opdaterKamera(); }
    });
  })();

  /* ── Størrelse ─────────────────────────────────────────── */
  function tilpasStoerrelse(){
    const b = boks.clientWidth - 20;          // .view har 10 px luft i hver side
    if(b <= 0) return;
    /* På smalle skærme får figuren lov at blive relativt højere —
       ellers bliver kloden for lille. */
    const forhold = b < 560 ? 0.92 : 0.66;
    /* Højdebudget: --fig er den plads, der er tilbage på skærmen, når
       instrumenter og skydere har fået deres. */
    const budget = parseFloat(getComputedStyle(boks).getPropertyValue('--fig')) || 620;
    const h = Math.round(Math.min(Math.max(b*forhold, 240), 620, budget));
    renderer.setSize(b, h, true);
    kamera.aspect = b/h;
    kamera.updateProjectionMatrix();
  }
  new ResizeObserver(tilpasStoerrelse).observe(boks);
  tilpasStoerrelse();

  /* ── Udpegning ─────────────────────────────────────────── */
  const stråle = new THREE.Raycaster(), skærm = new THREE.Vector2();
  function peg(hændelse, objekter){
    const r = lærred.getBoundingClientRect();
    skærm.x =  ((hændelse.clientX-r.left)/r.width)*2 - 1;
    skærm.y = -((hændelse.clientY-r.top)/r.height)*2 + 1;
    stråle.setFromCamera(skærm, kamera);
    return stråle.intersectObjects(objekter, false);
  }

  /* ── Render-løkke ──────────────────────────────────────── */
  const opdateringer = [];
  let sidstTid = 0;
  function loekke(nu){
    const dt = Math.min((nu-sidstTid)/1000, 0.1);
    sidstTid = nu;
    fremFlyvning(dt);
    for(const f of opdateringer) f(ROLIG ? 0 : dt);
    renderer.render(scene, kamera);
    requestAnimationFrame(loekke);
  }

  return {
    scene, kamera, renderer, cam, lærred,
    opdaterKamera, nulstilKamera, flyvTil, peg, tilpasStoerrelse,
    naarOpdater: f => opdateringer.push(f),
    start(){ requestAnimationFrame(nu=>{ sidstTid = nu; loekke(nu); }); },
  };
}
