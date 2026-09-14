/* ═══════════════════════════════════════════════════════════
   model.js — lærredet og render-løkken.

   Rammen om bordet og intet andet: den ved ikke, at der findes
   kolber. Den giver et koordinatsystem i bordets egne enheder,
   en løkke der kalder de tegnere, siden har meldt ind, og de
   par hjælpere til blæk-stregen, alle figurens dele bruger.
   ═══════════════════════════════════════════════════════════ */

export const BLØDT = typeof matchMedia === 'undefined'
  || !matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Bordets egne enheder. Alt i de andre moduler regnes i dem. */
export const MÅL = {bredde:1040, højde:560};

export const INK = '#17211F';

export function byggLaerred({lærred, boks}){
  const g = lærred.getContext('2d');
  const {bredde, højde} = MÅL;

  let cssB = 0, cssH = 0, dpr = 1;
  const tegnere = [], skridt = [];
  let kører = false, pause = false, sidst = 0;

  /* ── Størrelse ───────────────────────────────────────── *
   * Bredden læses af lærredet selv, ikke af kassen omkring det: på
   * en telefon er bordet bredere end skærmen og har sin egen
   * vandrette rulning, og så er de to tal ikke de samme.          */
  function tilpasStoerrelse(){
    const stil  = getComputedStyle(boks);
    const kasse = boks.clientWidth
      - parseFloat(stil.paddingLeft) - parseFloat(stil.paddingRight);
    const b = Math.max(240, Math.round(lærred.clientWidth || kasse));
    const h = Math.round(b * højde / bredde);
    dpr = Math.min(devicePixelRatio || 1, 2);
    if(b === cssB && h === cssH) return;
    cssB = b; cssH = h;
    lærred.width  = Math.round(b * dpr);
    lærred.height = Math.round(h * dpr);
    tegn();
  }
  new ResizeObserver(tilpasStoerrelse).observe(boks);
  new ResizeObserver(tilpasStoerrelse).observe(lærred);

  const enhed = () => cssB / bredde;

  /** Et punkt på skærmen om til bordets enheder. */
  function tilLogisk(ev){
    const r = lærred.getBoundingClientRect();
    const s = enhed();
    return {x:(ev.clientX - r.left) / s, y:(ev.clientY - r.top) / s};
  }

  function tegn(){
    if(!cssB) return;
    const s = enhed() * dpr;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, lærred.width, lærred.height);
    g.setTransform(s, 0, 0, s, 0, 0);
    for(const t of tegnere) t(g);
  }

  function billede(nu){
    if(!kører) return;
    requestAnimationFrame(billede);
    const dt = Math.min(0.05, (nu - sidst) / 1000 || 0);
    sidst = nu;
    if(!pause) for(const s of skridt) s(dt);
    tegn();
  }

  return {
    naarSkridt: cb => skridt.push(cb),
    naarTegn:   cb => tegnere.push(cb),
    tilLogisk, tilpasStoerrelse,
    sætPause(v){ pause = v; },
    start(){
      if(kører) return;
      kører = true; sidst = performance.now();
      tilpasStoerrelse();
      requestAnimationFrame(billede);
    },
  };
}

/* ── Blæk og papir ─────────────────────────────────────── *
 * De samme fire streger bruges overalt i figuren, så alle dele
 * ser ud til at være tegnet med den samme pen.                  */

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

/** Mono-mærkat, som resten af sitet skriver dem: versaler, spærret. */
export function maerkat(g, tekst, x, y, {størrelse = 12, farve = INK, midt = true, spær = 1.5} = {}){
  g.save();
  g.font = `600 ${størrelse}px 'IBM Plex Mono',ui-monospace,monospace`;
  g.fillStyle = farve;
  g.textBaseline = 'middle';
  const bogstaver = [...tekst];
  const bredde = bogstaver.reduce((s, b) => s + g.measureText(b).width + spær, -spær);
  let løbe = midt ? x - bredde / 2 : x;
  for(const b of bogstaver){
    g.fillText(b, løbe, y);
    løbe += g.measureText(b).width + spær;
  }
  g.restore();
  return bredde;
}

/** Tal og navne i display-skriften. */
export function tekst(g, t, x, y, {størrelse = 15, farve = INK, vægt = 800, midt = true} = {}){
  g.save();
  g.font = `${vægt} ${størrelse}px Archivo,system-ui,sans-serif`;
  g.fillStyle = farve;
  g.textAlign = midt ? 'center' : 'left';
  g.textBaseline = 'middle';
  g.fillText(t, x, y);
  g.restore();
}
