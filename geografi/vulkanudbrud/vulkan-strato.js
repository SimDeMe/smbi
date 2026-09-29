/* vulkan-strato.js — stratovulkanen: sejt, gasrigt andesitisk magma.

   En stratovulkan (lagvulkan) ligger typisk over en subduktionszone.
   Magmaet dannes i asthenosfæren over den nedsynkende plade (den såkaldte
   kappekile), ca. 100 km nede: vand, der presses ud af pladen, sænker
   smeltepunktet, så en lille del af kappen smelter til basaltisk magma.
   Magmaet samles i et kammer 5–10 km under vulkanen og får tid til at
   krystallisere delvist og blive mere kiselrigt og sejt (andesit).

   Fordi magmaet er sejt, kan gasboblerne ikke slippe ud på vejen op.
   De vokser, til skummet sprænges, og udbruddet bliver eksplosivt:
   en askesøjle, der kan nå 10–30 km op, og bomber, der kastes ud.
   Keglen er bygget af skiftende lag af lava og aske — deraf navnet.

   Eksempler: Mount St. Helens (1980), Pinatubo (1991), Fuji, Vesuv.

   Kontrakt for en vulkantype (samme for alle filer vulkan-*.js):
     id, navn, kort, eksempler
     magma        { navn, SiO2, T, rho, vand, vandMin, vandMaks, k,
                    krystaller, fragmentering }
     u0           stigehastighed i kammerets top under udbrud, m/s
     kammer       { top, bund, halvbredde }    km, km, px
     daeklag      { top, bund } | null         km
     trinTitel    knappen "Trin for trin"s forklaring
     beskrivelse  tværsnittets aria-label
     kilde        tekst til tilførslen nederst
     skorpe       [top, bund] — skorpens farver under bjerget (kan udelades)
     bjerg        { hoejde, radius, krater }   km, px, px
     overflade(x, geo)     bjergets overflade, y i px
     tegnBjerg(c, geo)     kegle og lag
     udbrud       { nulstil(), opdater(dt, geo, tilst), tegn(c, geo, tilst),
                    maerkater(geo, tilst) }
     stammagma    magmaet, som det dannes i kappen (samme felter som magma)
     oversigt     { navn, opdater(dt, fokus), tegn(c, fokus, lupe) } — hvor magmaet dannes
     trin         listen over trin i "trin for trin" (se trin-strato.js)
*/

import trin from './trin-strato.js';
import * as oversigt from './subduktion.js';

const BJERG = { hoejde: 1.6, radius: 215, krater: 15 };

// Stratovulkanens kegle er konkav: stejl øverst, flad ud mod foden
function hoejdeAndel(d){
  if (d < BJERG.krater) return 1 - 0.13 * (1 - (d / BJERG.krater) ** 2);   // krateret
  const u = (d - BJERG.krater) / (BJERG.radius - BJERG.krater);
  return u >= 1 ? 0 : Math.pow(1 - u, 1.9);
}

function overflade(x, geo){
  const yFod = geo.yZ(BJERG.hoejde);
  return yFod - (yFod - geo.Y_KRATER) * hoejdeAndel(Math.abs(x - geo.XC)) - geo.loeft(x);
}

function tegnBjerg(c, geo){
  const yFod = geo.yZ(BJERG.hoejde);
  const x0 = geo.XC - BJERG.radius - 4, x1 = geo.XC + BJERG.radius + 4;
  c.save();
  c.beginPath();
  c.moveTo(x0, yFod + 2);
  for (let x = x0; x <= x1; x += 2) c.lineTo(x, overflade(x, geo));
  c.lineTo(x1, yFod + 2);
  c.closePath();
  c.fillStyle = '#6F625A';
  c.fill();
  c.clip();
  // Lagene: skiftevis lava (mørk) og aske (lys), parallelle med skråningen
  for (let i = 1; i < 11; i++){
    c.beginPath();
    for (let x = x0; x <= x1; x += 3){
      const y = overflade(x, geo) + i * 5.4;
      if (x === x0) c.moveTo(x, y); else c.lineTo(x, y);
    }
    c.strokeStyle = i % 2 ? '#B3A392' : '#4F4540';
    c.lineWidth = i % 2 ? 2.6 : 1.4;
    c.stroke();
  }
  c.restore();
}

// ── Udbruddet: askesøjle og bomber ─────────────────────
const skyer = [], bomber = [], damp = [];
let tSky = 0, tBombe = 0, tDamp = 0;

function nulstil(){ skyer.length = bomber.length = damp.length = 0; }

function opdater(dt, geo, tilst){
  const xk = geo.XC, yk = overflade(geo.XC, geo) - 2;
  const styrke = tilst.fase === 'udbrud' ? tilst.intensitet : 0;

  // Askesøjlen: gasstrålen skyder asken op, derefter løfter varmen den
  tSky -= dt;
  while (styrke > 0 && tSky <= 0){
    tSky += 0.035 / (0.3 + styrke);
    skyer.push({ x: xk + (Math.random() - 0.5) * 8, y: yk,
                 vx: (Math.random() - 0.5) * 34, vy: -(85 + 70 * styrke + Math.random() * 30),
                 r: 5 + Math.random() * 4, alder: 0, tone: Math.random() });
  }
  for (const s of skyer){
    s.alder += dt;
    s.x += s.vx * dt; s.y += s.vy * dt;
    s.vy *= 1 - 0.45 * dt;                          // bremses lidt, men løftes stadig
    s.vx *= 1 - 0.3 * dt;
    s.r += (15 + 10 * s.tone) * dt;
    if (s.y < 40) s.vx += Math.sign(s.x - xk || 1) * 40 * dt;   // paraplyen breder sig
  }
  for (let i = skyer.length - 1; i >= 0; i--)
    if (skyer[i].y + skyer[i].r < -20 || skyer[i].alder > 9) skyer.splice(i, 1);

  // Bomber: klumper af lava, der kastes ud i buer og lander på keglen
  tBombe -= dt;
  if (styrke > 0 && tBombe <= 0){
    tBombe = 0.25 + Math.random() * 0.6 / styrke;
    const side = Math.random() < 0.5 ? -1 : 1;
    bomber.push({ x: xk, y: yk, vx: side * (25 + Math.random() * 70), vy: -(120 + Math.random() * 110),
                  landet: false, alder: 0 });
  }
  for (const b of bomber){
    b.alder += dt;
    if (b.landet) continue;
    b.vy += 240 * dt;
    b.x += b.vx * dt; b.y += b.vy * dt;
    const yo = overflade(b.x, geo);
    if (b.vy > 0 && b.y >= yo - 2){ b.y = yo - 2; b.landet = true; b.alder = 0; }
  }
  for (let i = bomber.length - 1; i >= 0; i--)
    if ((bomber[i].landet && bomber[i].alder > 3) || bomber[i].x < -10 || bomber[i].x > geo.W + 10) bomber.splice(i, 1);

  // Mellem udbruddene damper krateret stille
  tDamp -= dt;
  if (tilst.fase === 'hvile' && tDamp <= 0){
    tDamp = 0.35 + Math.random() * 0.3;
    damp.push({ x: xk + (Math.random() - 0.5) * 10, y: yk, r: 3, alder: 0 });
  }
  for (const d of damp){ d.alder += dt; d.y -= 16 * dt; d.x += 6 * dt; d.r += 4 * dt; }
  for (let i = damp.length - 1; i >= 0; i--) if (damp[i].alder > 3.5) damp.splice(i, 1);
}

function tegn(c, geo, tilst){
  const yk = overflade(geo.XC, geo);
  c.save();
  // damp
  for (const d of damp){
    c.globalAlpha = 0.45 * (1 - d.alder / 3.5);
    c.fillStyle = '#FFFFFF';
    c.beginPath(); c.arc(d.x, d.y, d.r, 0, 2 * Math.PI); c.fill();
  }
  c.globalAlpha = 1;

  // glød i krateret, mens der er magma i kanalen helt oppe
  if (tilst.front <= 0.05 && tilst.fase !== 'hvile'){
    const g = c.createRadialGradient(geo.XC, yk, 2, geo.XC, yk, 30);
    g.addColorStop(0, 'rgba(255,190,70,.9)'); g.addColorStop(1, 'rgba(255,120,40,0)');
    c.fillStyle = g;
    c.beginPath(); c.arc(geo.XC, yk, 30, 0, 2 * Math.PI); c.fill();
  }

  // askesøjlen — ældste skyer bagerst
  for (const s of skyer){
    const a = Math.min(1, 1.6 - s.alder / 6);
    if (a <= 0) continue;
    c.globalAlpha = a;
    const lys = 128 + Math.round(40 * s.tone + Math.min(30, s.alder * 8));
    c.fillStyle = `rgb(${lys},${lys - 6},${lys - 12})`;
    c.strokeStyle = 'rgba(23,33,31,.35)';
    c.lineWidth = 1;
    c.beginPath(); c.arc(s.x, s.y, s.r, 0, 2 * Math.PI); c.fill(); c.stroke();
  }
  c.globalAlpha = 1;

  // bomber
  for (const b of bomber){
    c.globalAlpha = b.landet ? Math.max(0, 1 - b.alder / 3) : 1;
    c.fillStyle = b.landet ? '#3B302C' : '#2A211E';
    c.strokeStyle = '#FF8A3D';
    c.lineWidth = 1.2;
    c.beginPath(); c.ellipse(b.x, b.y, 3.4, 2.6, Math.atan2(b.vy, b.vx), 0, 2 * Math.PI);
    c.fill();
    if (!b.landet) c.stroke();
  }
  c.restore();
}

function maerkater(geo, tilst){
  const m = [];
  if (tilst.fase === 'udbrud' && skyer.length > 40)
    m.push({ tekst: 'ASKESØJLE', x: geo.XC + 70, y: 30, mod: 42, modX: geo.XC + 18 });
  if (tilst.fase === 'udbrud' && bomber.some(b => !b.landet && b.y < overflade(b.x, geo) - 30))
    m.push({ tekst: 'BOMBER', x: geo.XC - 150, y: 86 });
  return m;
}

export default {
  id: 'strato',
  navn: 'Stratovulkan',
  kort: 'Andesitisk magma · subduktionszone',
  eksempler: 'Mount St. Helens, Pinatubo, Vesuv',
  trinTitel: 'Fra subduktionen til askesøjlen i otte trin',
  beskrivelse: 'Tværsnit gennem en stratovulkan fra krateret og 12 km ned. Magma kommer nedefra gennem en fødegang og samles i et magmakammer under et tæt dæklag. Under et udbrud stiger magmaet op gennem kanalen til krateret, og over krateret står en askesøjle. To stiplede linjer i kanalen viser, hvor gasboblerne begynder at dannes, og hvor skummet sprænges. Træk op og ned i figuren for at flytte lupen.',
  magma: {
    navn: 'Andesitisk',
    SiO2: 60,            // vægt-% — sejt, kiselrigt magma
    T: 950,              // °C
    rho: 2400,           // kg/m³ — smelte med krystaller
    vand: 4.0,           // vægt-% — typisk 3–6 % i andesit ved subduktionszoner
    vandMin: 1, vandMaks: 6,
    k: 0.11,             // opløselighed: C = k·√P, P i bar
    krystaller: 0.25,    // andel krystaller i kammeret
    fragmentering: 0.75, // sejt magma: skummet sprænges ved 75 % gas
    flyder: 'sejtflydende',
    farver: ['#FF9A3C', '#E9601F']
  },
  // Stammagmaet: det basaltiske magma, der smelter ud af kappen, før det
  // i kammeret bliver til andesit. Bruges i de første trin.
  stammagma: {
    navn: 'Basaltisk',
    SiO2: 50, T: 1200, rho: 2800,
    vand: 2.0, vandMin: 1, vandMaks: 6,
    k: 0.095,            // basalt kan holde på lidt mindre vand end andesit
    krystaller: 0.05,
    fragmentering: null, // tyndtflydende: boblerne kan slippe ud
    flyder: 'tyndtflydende',
    farver: ['#FF7A2E', '#D23A16']
  },
  u0: 0.5,               // m/s — magmaets fart i bunden af kanalen
  kammer: { top: 6.0, bund: 8.6, halvbredde: 118 },
  daeklag: { top: 5.1, bund: 5.7 },
  kilde: 'FRA ASTHENOSFÆREN OVER DEN NEDSYNKENDE PLADE, CA. 100 km NEDE',   // skrives, som det skal stå (enheden med små)
  bjerg: BJERG,
  overflade, tegnBjerg,
  udbrud: { nulstil, opdater, tegn, maerkater },
  oversigt,            // hvor magmaet dannes (tegnes i de første trin)
  trin                 // udbruddet trin for trin
};
