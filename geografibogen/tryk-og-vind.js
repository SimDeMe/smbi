// Kapitel 1: interaktiv figur «Lav selv vind».
// Kvalitativ skitse: to områder, A og B, med hvert sit lufttryk.
// Luften strømmer fra højt mod lavt tryk; jo større forskel, jo hurtigere.
// Afstand, friktion og jordens rotation er udeladt — derfor ingen m/s.

const NS = 'http://www.w3.org/2000/svg';
const svg = document.getElementById('vind-svg');
const slA = document.getElementById('tryk-a');
const slB = document.getElementById('tryk-b');
const udA = document.getElementById('ud-a');
const udB = document.getElementById('ud-b');
const status = document.getElementById('vind-status');
const pauseKnap = document.getElementById('vind-pause');

if (svg && slA && slB) {
  const tekstA = svg.querySelector('#tal-a');
  const tekstB = svg.querySelector('#tal-b');
  const bogstavA = svg.querySelector('#bogstav-a');
  const bogstavB = svg.querySelector('#bogstav-b');
  const pil = svg.querySelector('#vind-pil');
  const lag = svg.querySelector('#partikler');

  const X0 = 190, X1 = 450, Y0 = 72, Y1 = 178;
  let s = 7;
  const tilfaeldig = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const partikler = Array.from({ length: 46 }, () => {
    const c = document.createElementNS(NS, 'circle');
    c.setAttribute('r', '4');
    lag.appendChild(c);
    return { c, x: X0 + tilfaeldig() * (X1 - X0), y: Y0 + tilfaeldig() * (Y1 - Y0), f: 0.7 + tilfaeldig() * 0.6 };
  });

  const stilleBevaegelse = window.matchMedia('(prefers-reduced-motion: reduce)');
  let forskel = 0;
  let pause = stilleBevaegelse.matches;
  let synlig = true;

  function styrke(d) {
    if (d === 0) return 'Ens tryk: luften står stille. Ingen vind.';
    if (d <= 5) return 'Lille forskel: lidt vind.';
    if (d <= 15) return 'Tydelig forskel: frisk vind.';
    return 'Stor forskel: kraftig vind.';
  }

  function opdater() {
    const a = Number(slA.value), b = Number(slB.value);
    forskel = a - b;
    udA.value = tekstA.textContent = a + ' hPa';
    udB.value = tekstB.textContent = b + ' hPa';
    const d = Math.abs(forskel);
    bogstavA.textContent = forskel > 0 ? 'H' : forskel < 0 ? 'L' : '';
    bogstavB.textContent = forskel < 0 ? 'H' : forskel > 0 ? 'L' : '';
    bogstavA.setAttribute('fill', forskel > 0 ? '#1a5f9e' : '#c0392b');
    bogstavB.setAttribute('fill', forskel < 0 ? '#1a5f9e' : '#c0392b');

    // Pilen: retning efter fortegn, tykkelse efter forskel
    if (d === 0) {
      pil.setAttribute('opacity', '0');
    } else {
      const t = 4 + Math.min(d, 30) * 0.9;
      const hoved = t + 14;
      const midt = 125;
      const [fra, til] = forskel > 0 ? [235, 405] : [405, 235];
      const r = Math.sign(til - fra);
      const spids = til, bag = til - r * hoved;
      pil.setAttribute('d',
        `M${fra} ${midt - t / 2} L${bag} ${midt - t / 2} L${bag} ${midt - hoved / 2 - 4} L${spids} ${midt} ` +
        `L${bag} ${midt + hoved / 2 + 4} L${bag} ${midt + t / 2} L${fra} ${midt + t / 2} Z`);
      pil.setAttribute('opacity', '0.9');
    }

    const retning = forskel > 0 ? 'Luften strømmer fra A mod B. ' : forskel < 0 ? 'Luften strømmer fra B mod A. ' : '';
    status.textContent = `Forskel: ${d} hPa. ${retning}${styrke(d)}`;
    if (pause) tegnStille();
  }

  function tegnStille() {
    for (const p of partikler) { p.c.setAttribute('cx', p.x.toFixed(1)); p.c.setAttribute('cy', p.y.toFixed(1)); }
  }

  let sidst = 0;
  function trin(tid) {
    const dt = Math.min(50, tid - (sidst || tid)) / 1000;
    sidst = tid;
    if (!pause && synlig) {
      const fart = forskel * 7; // pixel pr. sekund pr. hPa (kun illustrativt)
      for (const p of partikler) {
        p.x += fart * p.f * dt + (tilfaeldig() - 0.5) * 0.8;
        p.y += (tilfaeldig() - 0.5) * 0.8;
        if (p.x > X1) p.x = X0; else if (p.x < X0) p.x = X1;
        if (p.y > Y1) p.y = Y1; else if (p.y < Y0) p.y = Y0;
      }
      tegnStille();
    }
    requestAnimationFrame(trin);
  }

  function visPause() {
    pauseKnap.setAttribute('aria-pressed', String(pause));
    pauseKnap.textContent = pause ? '▶ Start bevægelse' : '❚❚ Pause';
  }
  pauseKnap.addEventListener('click', () => { pause = !pause; visPause(); });

  new IntersectionObserver(([e]) => { synlig = e.isIntersecting; }).observe(svg);
  slA.addEventListener('input', opdater);
  slB.addEventListener('input', opdater);
  visPause();
  opdater();
  tegnStille();
  requestAnimationFrame(trin);
}
