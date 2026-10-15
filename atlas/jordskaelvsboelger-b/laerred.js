// Fælles hjælp til de tre lærreder: skarp tegning på retina, farver og danske tal.

export const FARVE = {
  p: '#0e86c8', s: '#d62a63', r: '#e3721d', ink: '#17211f', papir: '#fff9ee', slate: '#49615b',
  station: ['#0f8f7f', '#7a4fd6', '#a8740a', '#3e5a8a']
};

export const roligBevaegelse = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

// Gør lærredet lige så stort som sin CSS-boks (gange skærmens pixeltæthed) og
// returnér en kontekst, hvor der tegnes i CSS-pixels.
export function tilpas(canvas) {
  const boks = canvas.getBoundingClientRect();
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = Math.max(1, Math.round(boks.width * dpr)), h = Math.max(1, Math.round(boks.height * dpr));
  if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w: boks.width, h: boks.height };
}

export const tal = (x, d = 1) => x.toLocaleString('da-DK', { minimumFractionDigits: d, maximumFractionDigits: d });

export function minSek(sek) {
  const m = Math.floor(sek / 60), s = Math.round(sek - m * 60);
  return s === 60 ? `${m + 1} min 0 s` : `${m} min ${s} s`;
}

// Løkke med requestAnimationFrame, der kan stoppes og startes.
export function loekke(trin) {
  let id = 0, sidst = 0;
  const koer = nu => {
    const dt = sidst ? Math.min(0.1, (nu - sidst) / 1000) : 0;
    sidst = nu;
    if (trin(dt) === false) { id = 0; sidst = 0; return; }
    id = requestAnimationFrame(koer);
  };
  return {
    start() { if (!id) { sidst = 0; id = requestAnimationFrame(koer); } },
    stop() { cancelAnimationFrame(id); id = 0; sidst = 0; },
    get koerer() { return id !== 0; }
  };
}

export function el(navn, tekst, klasse) {
  const e = document.createElement(navn);
  if (tekst) e.textContent = tekst;
  if (klasse) e.className = klasse;
  return e;
}
