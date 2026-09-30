/* ═══════════════════════════════════════════════════════════
   model.js — lærredet, render-løkken og blækket.

   Rammen om figuren og intet andet: den ved ikke, at der findes
   malt eller gær. Den giver et koordinatsystem i figurens egne
   enheder, en løkke der kalder siden hvert billede, og de få
   hjælpere, alle stationerne tegner med — så gryden, gærspanden
   og glasset ser ud til at være tegnet med den samme pen.
   ═══════════════════════════════════════════════════════════ */

export const BLØDT = typeof matchMedia === 'undefined'
  || !matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Figurens egne enheder. Venstre del er selve kedlen og luppen,
   højre del er grafen. */
export const MÅL   = {bredde:1040, højde:500};
export const SCENE = {x:0,   b:600};
export const GRAF  = {x:620, y:34, b:396, h:420};
export const LUP   = {x:462, y:250, r:122};

export const INK   = '#17211F';
export const SLATE = '#566B68';
export const PAPIR = '#FFF9EE';

/* Stoffernes farver — de samme i figur, lup, graf og signatur. */
export const FARVE = {
  stivelse:'#7A4FD6', stivelseLys:'#E2D6F8',
  dextrin:'#0E86C8',  dextrinLys:'#C7E6F6',
  sukker:'#D98A00',   sukkerLys:'#FFE3A0',
  alfa:'#0FA593',     beta:'#E8336D',
  humle:'#5FB030',    humleLys:'#D6EFC4',
  iso:'#C88A00',      olie:'#0FA593',
  gaer:'#F3E4C2',     ethanol:'#566B68',
  varme:'#FF6A3D',
};

export function byggLaerred(lærred){
  const g = lærred.getContext('2d');
  const {bredde, højde} = MÅL;
  let cssB = 0, dpr = 1;
  let tegner = () => {}, skridt = () => {};
  let sidst = 0;

  /* Lærredets bredde følger kassen; højden følger af formatforholdet. */
  function tilpas(){
    const b = Math.max(240, Math.round(lærred.clientWidth));
    const d = Math.min(devicePixelRatio || 1, 2);
    if(b === cssB && d === dpr) return;
    cssB = b; dpr = d;
    lærred.width  = Math.round(b * dpr);
    lærred.height = Math.round(b * højde / bredde * dpr);
    tegn();
  }
  new ResizeObserver(tilpas).observe(lærred);

  function tegn(){
    if(!cssB) return;
    const s = cssB / bredde * dpr;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, lærred.width, lærred.height);
    g.setTransform(s, 0, 0, s, 0, 0);
    tegner(g);
  }

  function billede(nu){
    requestAnimationFrame(billede);
    const dt = Math.min(0.1, (nu - sidst) / 1000 || 0);
    sidst = nu;
    skridt(dt);
    tegn();
  }

  return {
    naarTegn: cb => { tegner = cb; },
    naarSkridt: cb => { skridt = cb; },
    tilpas, tegn,
    start(){
      sidst = performance.now();
      tilpas();
      requestAnimationFrame(billede);
    },
  };
}

/* ── Blæk og papir ─────────────────────────────────────── */

/** Fyld + blækkant om en vej, man selv har lagt. */
export function blaek(g, fyld, streg = 2.4, kant = INK){
  if(fyld){ g.fillStyle = fyld; g.fill(); }
  if(streg > 0){ g.lineWidth = streg; g.strokeStyle = kant; g.stroke(); }
}

/** Firkant med runde hjørner. */
export function boks(g, x, y, b, h, r){
  g.beginPath();
  if(g.roundRect) g.roundRect(x, y, b, h, r);
  else {
    g.moveTo(x + r, y);
    g.arcTo(x + b, y,     x + b, y + h, r);
    g.arcTo(x + b, y + h, x,     y + h, r);
    g.arcTo(x,     y + h, x,     y,     r);
    g.arcTo(x,     y,     x + b, y,     r);
    g.closePath();
  }
}

/* Versaler i mærkaterne — men enheder og græske bogstaver staves, som de
   staves: «3 kW» må ikke blive «3 KW», og α må ikke blive til Α. */
const ENHED = /^(kW|MJ\/kg|kJ\/K|mL|g\/L|mg\/L|°C|°P|kg|g|min|pH|mio\.\/mL|%)$/;
export function versal(t){
  return t.split(' ').map(o => ENHED.test(o) ? o : o.replace(/[a-zæøåé]/g, c => c.toUpperCase())).join(' ');
}

/** Mono-mærkat, som resten af sitet skriver dem: versaler, spærret. */
export function maerkat(g, t, x, y, {størrelse = 11, farve = INK, justering = 'center',
                                      spær = 1.4, stort = true, vægt = 600} = {}){
  g.save();
  g.font = `${vægt} ${størrelse}px 'IBM Plex Mono',ui-monospace,monospace`;
  g.fillStyle = farve;
  g.textBaseline = 'middle';
  const bogstaver = [...(stort ? versal(t) : t)];
  const bredde = bogstaver.reduce((s, b) => s + g.measureText(b).width + spær, -spær);
  let løbe = justering === 'center' ? x - bredde / 2 : justering === 'right' ? x - bredde : x;
  for(const b of bogstaver){
    g.fillText(b, løbe, y);
    løbe += g.measureText(b).width + spær;
  }
  g.restore();
  return bredde;
}

/** Tal og navne i display-skriften. */
export function tekst(g, t, x, y, {størrelse = 15, farve = INK, vægt = 800, justering = 'center'} = {}){
  g.save();
  g.font = `${vægt} ${størrelse}px Archivo,system-ui,sans-serif`;
  g.fillStyle = farve;
  g.textAlign = justering;
  g.textBaseline = 'middle';
  g.fillText(t, x, y);
  g.restore();
}

/** Lille mærkat på papirgrund med blækkant — til ting i figuren. */
export function skilt(g, t, x, y, {størrelse = 10.5, fyld = PAPIR, stort = true} = {}){
  g.save();
  g.font = `600 ${størrelse}px 'IBM Plex Mono',ui-monospace,monospace`;
  const bogstaver = [...(stort ? versal(t) : t)];
  const b = bogstaver.reduce((s, c) => s + g.measureText(c).width + 1.2, -1.2) + 16;
  boks(g, x - b / 2, y - 10, b, 20, 10);
  blaek(g, fyld, 1.6);
  g.restore();
  maerkat(g, t, x, y + 0.5, {størrelse, spær:1.2, stort});
}

/** Komma som decimaltegn. */
export const komma = (n, d = 0) => Number(n).toFixed(d).replace('.', ',').replace('-', '−');

/* ── Luppen ────────────────────────────────────────────── *
 * En cirkel, der forstørrer et udsnit af kedlen op til molekyleniveau.
 * `fra` er det sted i kedlen, luppen kigger på; tegn() kaldes med
 * lærredet klippet til cirklen og origo i midten.                 */
export function lup(g, fra, baggrund, tegnIndhold){
  const {x, y, r} = LUP;
  /* De to tangenter fra udsnittet til luppen. */
  const dx = x - fra.x, dy = y - fra.y, d = Math.hypot(dx, dy);
  const v = Math.atan2(dy, dx), a = Math.asin(Math.min(1, (r - fra.r) / d));
  g.save();
  g.setLineDash([5, 5]);
  g.lineWidth = 1.6; g.strokeStyle = INK;
  for(const s of [1, -1]){
    const n = v + s * (Math.PI / 2 + a);
    g.beginPath();
    g.moveTo(fra.x + Math.cos(n) * fra.r, fra.y + Math.sin(n) * fra.r);
    g.lineTo(x + Math.cos(n) * r, y + Math.sin(n) * r);
    g.stroke();
  }
  g.setLineDash([]);
  g.beginPath(); g.arc(fra.x, fra.y, fra.r, 0, Math.PI * 2);
  blaek(g, 'rgba(255,255,255,.25)', 2);

  g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2);
  g.fillStyle = baggrund; g.fill();
  g.clip();
  g.translate(x, y);
  tegnIndhold(g, r);
  g.restore();

  g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2);
  blaek(g, null, 3);
  g.beginPath(); g.arc(x, y, r + 6, -2.5, -1.9);
  g.lineWidth = 3; g.strokeStyle = 'rgba(255,255,255,.9)'; g.stroke();
}

/* ── Termometer ────────────────────────────────────────── */
export function termometer(g, x, y, h, T, {min = 0, max = 100, maal = null} = {}){
  const b = 14;
  boks(g, x - b / 2, y, b, h, 7);
  blaek(g, '#fff', 2);
  const andel = Math.max(0, Math.min(1, (T - min) / (max - min)));
  const top = y + h - 10 - (h - 20) * andel;
  g.fillStyle = FARVE.varme;
  g.fillRect(x - 2.5, top, 5, y + h - top);
  g.beginPath(); g.arc(x, y + h + 6, 10, 0, Math.PI * 2);
  blaek(g, FARVE.varme, 2);
  if(maal !== null){
    const my = y + h - 10 - (h - 20) * Math.max(0, Math.min(1, (maal - min) / (max - min)));
    g.beginPath();
    g.moveTo(x + b / 2 + 2, my); g.lineTo(x + b / 2 + 10, my - 5); g.lineTo(x + b / 2 + 10, my + 5);
    g.closePath();
    blaek(g, INK, 0);
  }
}

/* ── Partikler i luppen ────────────────────────────────── *
 * Molekylerne i luppen er en lille bestand, der holdes på det antal,
 * modellen siger. De driver rundt (brownske bevægelser) og bliver i
 * cirklen.                                                         */
export function drift(p, dt, r, fart = 18){
  if(!BLØDT) return;
  p.vx = (p.vx ?? 0) * 0.96 + (Math.random() - 0.5) * fart * 0.5;
  p.vy = (p.vy ?? 0) * 0.96 + (Math.random() - 0.5) * fart * 0.5;
  p.x += p.vx * dt; p.y += p.vy * dt;
  p.v = (p.v ?? Math.random() * 6) + (p.vr ?? 0.3) * dt;
  const d = Math.hypot(p.x, p.y), grænse = r - (p.radius ?? 14);
  if(d > grænse){
    p.x *= grænse / d; p.y *= grænse / d;
    p.vx *= -0.5; p.vy *= -0.5;
  }
}

/** Hold antallet af én slags partikel på målet: fjern eller lav nye.
 *  `ny()` laver én; `vaelg(liste)` vælger hvilken der fjernes (indeks). */
export function juster(liste, type, maal, ny, vaelg){
  const mine = liste.filter(p => p.type === type);
  if(mine.length < maal){
    for(let i = mine.length; i < maal; i++) liste.push(ny());
  } else if(mine.length > maal){
    for(let i = maal; i < mine.length; i++){
      const kandidater = liste.filter(p => p.type === type);
      const p = vaelg ? vaelg(kandidater) : kandidater[0];
      liste.splice(liste.indexOf(p), 1);
    }
  }
}

/** Den partikel i listen, der ligger nærmest punktet. */
export function naermest(liste, pkt){
  let bedst = liste[0], d = Infinity;
  for(const p of liste){
    const dd = (p.x - pkt.x) ** 2 + (p.y - pkt.y) ** 2;
    if(dd < d){ d = dd; bedst = p; }
  }
  return bedst;
}

export function tilfaeldigPlads(r, kant = 20){
  const v = Math.random() * Math.PI * 2, d = Math.sqrt(Math.random()) * (r - kant);
  return {x:Math.cos(v) * d, y:Math.sin(v) * d};
}

/** Øllets farve ud fra EBC — fra lys halm over rav til næsten sort. */
export function ebcFarve(ebc, lys = 0){
  const trin = [
    [4, [248, 222, 120]], [8, [236, 186, 60]], [14, [214, 140, 30]],
    [24, [180, 94, 22]], [40, [120, 52, 16]], [80, [50, 20, 8]],
  ];
  let c = trin[0][1];
  for(let i = 1; i < trin.length; i++){
    const [e0, c0] = trin[i - 1], [e1, c1] = trin[i];
    if(ebc <= e1){
      const u = Math.max(0, (ebc - e0) / (e1 - e0));
      c = c0.map((v, k) => v + (c1[k] - v) * u);
      break;
    }
    c = c1;
  }
  const m = c.map(v => Math.round(v + (255 - v) * lys));
  return `rgb(${m[0]},${m[1]},${m[2]})`;
}
