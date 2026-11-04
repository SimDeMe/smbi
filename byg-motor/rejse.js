// Et «rejse»-lag i «Byg figuren»: eleven trækker noget (fx et blodlegeme) gennem
// figuren ad den rigtige vej. Laget har ingen fagord; det kommer efter de lag, der
// har sat ordene på, og bruger figuren, som den står færdigbygget.
//
// Data i figurens lag:
//   { navn, ord: [], rejse: {
//       opgave: 'tekst i panelet',
//       start: 'knude', slut: 'knude' | ['knude', …],
//       ilt: 75,                      // valgfrit: iltmætning i %, vises ved cellen
//       knuder: { id: { x, y, tekst } },
//       veje: [
//         { fra, til, sti: 'M…', valg: 'kort tekst til knappen',
//           ilt: [75, 98], side: -1,  // valgfrit: mætningen skifter undervejs; side = hvor luften/vævet er (-1 over, 1 under)
//           klap: [x, y],             // valgfrit: en klap, der åbner sig
//           hint: 'tekst',
//           baglaens: { valg, fejl } },   // valgfrit: samme vej baglæns er en forkert vej fra `til`
//         { fra, sti, valg, fejl },   // en forkert vej: cellen kommer et stykke ind og glider tilbage
//         { fra, til, spring: true, undervejs, tekst, ilt },   // tages af sig selv, fx turen gennem lungen
//       ],
//       opsummering: 'tekst på det grønne kort' } }
//
// Eleven trækker cellen; den følger den vej, markøren er nærmest. En forkert vej
// stopper halvvejs med en forklaring. Knapperne i bakken gør det samme uden mus.

const NS = 'http://www.w3.org/2000/svg';
const TRIN = 3;           // afstand mellem prøvepunkterne på en vej (figurens enheder)
const LAAS = 15;          // prøvepunkter: tæt på knuden kan cellen stadig skifte vej
const NAER = 70;          // markøren skal være så tæt på en vej, før cellen følger
const roligt = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

const blandet = (a) => {
  const b = a.slice();
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
};

// farven følger iltmætningen: blå (iltfattig) til rød (iltrig), som resten af figurerne
const BLAA = [0x5C, 0x93, 0xDE], ROED = [0xE2, 0x41, 0x4A];
const BLAA_K = [0x1F, 0x4D, 0x8F], ROED_K = [0x93, 0x17, 0x1F];
const bland = (a, b, f) => '#' + a.map((v, i) => Math.round(v + (b[i] - v) * f).toString(16).padStart(2, '0')).join('');

let maaler = null;
/** Prøvepunkter langs en SVG-sti, beregnet i et skjult svg. */
function proever(d) {
  if (!maaler) {
    maaler = document.createElementNS(NS, 'svg');
    maaler.setAttribute('aria-hidden', 'true');
    maaler.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
    document.body.appendChild(maaler);
  }
  const p = document.createElementNS(NS, 'path');
  p.setAttribute('d', d);
  maaler.appendChild(p);
  const L = p.getTotalLength();
  const n = Math.max(2, Math.ceil(L / TRIN) + 1);
  const pkt = [];
  for (let i = 0; i < n; i++) {
    const q = p.getPointAtLength((L * i) / (n - 1));
    pkt.push([q.x, q.y]);
  }
  p.remove();
  return pkt;
}

export class Rejse {
  constructor(motor, lagNr) {
    this.m = motor;
    this.lagNr = lagNr;
    this.d = motor.fig.lag[lagNr].rejse;
    this.slut = [].concat(this.d.slut);
    // de angivne veje plus de baglæns veje, der er forkerte
    this.veje = [];
    this.d.veje.forEach((v) => {
      const vej = { ...v, rigtig: !v.fejl };
      this.veje.push(vej);
      if (v.baglaens) this.veje.push({ fra: v.til, valg: v.baglaens.valg, fejl: v.baglaens.fejl, klap: v.klap, rigtig: false, omvendt: vej });
    });
    this.veje.forEach((v, i) => { v.nr = i; });
    this.nulstil();
  }

  nulstil() {
    this.knude = this.d.start;
    this.vej = null;          // vejen, cellen er på (null = ved knuden)
    this.pos = 0;             // prøvepunkt på vejen
    this.ilt = this.d.ilt ?? null;
    this.spor = [];           // de veje, cellen har tilbagelagt
    this.faerdig = false;
    this.hintNu = false;
    this.travlt = false;      // en animation kører
    this.roert = false;
    this.raekke = {};
    this.lukket = null;       // en klap, der lige har lukket
    this.partikler = [];
    if (this.anim) cancelAnimationFrame(this.anim);
    this.anim = null;
  }

  /** Spring laget over (Lag-listen): regnes som klaret. */
  springOver() { this.faerdig = true; }

  pkt(v) {
    if (!v.pkt) v.pkt = v.omvendt ? this.pkt(v.omvendt).slice().reverse() : proever(v.sti);
    return v.pkt;
  }
  maks(v) {
    const n = this.pkt(v).length - 1;
    return v.rigtig ? n : Math.min(Math.round(n * 0.62), Math.round(75 / TRIN));
  }
  udgaaende(k = this.knude) { return this.veje.filter((v) => v.fra === k && !v.spring); }
  rigtige(k = this.knude) { return this.udgaaende(k).filter((v) => v.rigtig); }
  sted() {
    if (this.vej) return this.pkt(this.vej)[this.pos];
    const k = this.d.knuder[this.knude];
    return [k.x, k.y];
  }

  // ── Tegning ──────────────────────────────────────────────
  /** Tegner cellen, sporet og evt. hint oven på figuren. Kaldes efter motorens tegnFigur. */
  tegn(svg) {
    this.svg = svg;
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('class', 'rejse');
    const spor = this.spor.map((i) => this.veje[i]).filter((v) => !v.spring)
      .map((v) => 'M' + this.pkt(v).map((q) => q.map((t) => Math.round(t)).join(' ')).join(' L')).join(' ');
    let hint = '';
    if (this.hintNu && !this.faerdig) {
      for (const v of this.rigtige()) {
        const d = 'M' + this.pkt(v).map((q) => q.map((t) => Math.round(t)).join(' ')).join(' L');
        hint += `<path class="vej-hint-bund" d="${d}"/><path class="vej-hint" d="${d}"/>`;
      }
    }
    g.innerHTML = `<path class="spor" d="${spor || 'M0 0'}"/>${hint}<g class="partikler"></g>
      <g class="celle${this.roert || this.faerdig ? '' : ' kald'}" tabindex="0" role="img">
        <circle class="greb" r="34"/>
        <circle class="ring" r="24"/>
        <g class="skive"><ellipse class="yder" rx="19" ry="12"/><ellipse class="inder" rx="9.5" ry="4.6"/></g>
        <g class="maerke"><rect x="-34" y="-46" width="68" height="22" rx="11"/><text y="-30" text-anchor="middle"></text></g>
      </g><g class="lukket"></g>`;
    svg.appendChild(g);
    this.g = g;
    this.celle = g.querySelector('.celle');
    this.partikelLag = g.querySelector('.partikler');
    this.celle.addEventListener('pointerdown', (e) => this.greb(e));
    if (this.lukket) this.visLukket(this.lukket, true);
    this.opdater();
  }

  /** Flyt cellen og sæt dens farve og mætning. */
  opdater() {
    if (!this.celle) return;
    const [x, y] = this.sted();
    let v = 0;
    if (this.vej) {
      const p = this.pkt(this.vej);
      const a = p[Math.max(0, this.pos - 2)], b = p[Math.min(p.length - 1, this.pos + 2)];
      v = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
    }
    this.celle.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
    this.celle.querySelector('.skive').setAttribute('transform', `rotate(${v.toFixed(0)})`);
    const maerke = this.celle.querySelector('.maerke');
    if (this.ilt == null) { maerke.style.display = 'none'; return; }
    const f = Math.max(0, Math.min(1, (this.ilt - 75) / 23));
    this.celle.querySelector('.yder').setAttribute('fill', bland(BLAA, ROED, f));
    this.celle.querySelector('.yder').setAttribute('stroke', bland(BLAA_K, ROED_K, f));
    this.celle.querySelector('.inder').setAttribute('fill', bland(BLAA_K, ROED_K, f));
    maerke.querySelector('text').textContent = `O₂ ${Math.round(this.ilt)} %`;
    const k = this.d.knuder[this.knude];
    this.celle.setAttribute('aria-label', `Blodlegemet${k && k.navn ? ' i ' + k.navn : ''}. Iltmætning ${Math.round(this.ilt)} procent.`);
  }

  /** Knapperne i bakken: de veje, cellen kan tage herfra. */
  tegnValg(bakke) {
    bakke.innerHTML = '';
    if (this.faerdig) return;
    if (!this.raekke[this.knude]) this.raekke[this.knude] = blandet(this.udgaaende().map((v) => v.nr));
    for (const nr of this.raekke[this.knude]) {
      const v = this.veje[nr];
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'ord vej-valg';
      b.dataset.vej = nr;
      if (v.rigtig) b.dataset.rigtig = '';
      b.textContent = '→ ' + v.valg;
      b.disabled = this.travlt;
      b.addEventListener('click', () => this.koer(v));
      bakke.appendChild(b);
    }
  }
  valgKnapper() { this.tegnValg(this.m.ui.bakke); }

  hintTekst() { return this.hintNu ? 'Vis vejen' : 'Giv et hint'; }

  // ── Bevægelse ────────────────────────────────────────────
  /** Lad cellen glide fra pos til `til` på vejen v. */
  glid(v, til, ms, klar) {
    if (this.anim) cancelAnimationFrame(this.anim);
    if (this.vej !== v) { this.vej = v; this.pos = 0; }
    const fra = this.pos;
    if (roligt() || ms <= 0 || fra === til) { this.saet(til); this.anim = null; klar && klar(); return; }
    const t0 = performance.now();
    const trin = (t) => {
      const f = Math.min(1, (t - t0) / ms);
      const e = f < 0.5 ? 2 * f * f : 1 - Math.pow(-2 * f + 2, 2) / 2;
      this.saet(Math.round(fra + (til - fra) * e));
      if (f < 1) this.anim = requestAnimationFrame(trin);
      else { this.anim = null; klar && klar(); }
    };
    this.anim = requestAnimationFrame(trin);
  }

  /** Sæt cellen på prøvepunkt i på den aktuelle vej. */
  saet(i) {
    const v = this.vej;
    const foer = this.pos;
    this.pos = Math.max(0, Math.min(this.maks(v), i));
    if (v.rigtig && v.ilt) {
      const n = this.pkt(v).length - 1;
      const gl = this.ilt;
      this.ilt = v.ilt[0] + ((v.ilt[1] - v.ilt[0]) * this.pos) / n;
      // små O₂ og CO₂, der går ind og ud af cellen
      if (Math.floor(gl / 3.5) !== Math.floor(this.ilt / 3.5) && this.pos > foer) this.udveksl(v);
    }
    if (v.rigtig && v.klap) {
      const p = this.pkt(v);
      const k = p.reduce((b, q, j) => (Math.hypot(q[0] - v.klap[0], q[1] - v.klap[1]) < Math.hypot(p[b][0] - v.klap[0], p[b][1] - v.klap[1]) ? j : b), 0);
      if (foer < k && this.pos >= k) this.aabnKlap(v.klap);
    }
    if (!v.rigtig && this.pos >= this.maks(v) && !this.fejlVist) this.visFejl(v);
    this.opdater();
  }

  /** Kør hele vejen v (knapper, «Vis vejen»). */
  koer(v) {
    if (this.travlt || this.faerdig) return;
    this.roert = true;
    this.celle && this.celle.classList.remove('kald');
    if (this.vej && this.vej !== v && this.pos > 0) {
      this.travlt = true;
      this.glid(this.vej, 0, 300, () => { this.travlt = false; this.vej = null; this.koer(v); });
      return;
    }
    this.travlt = true;
    this.valgKnapper();
    this.visLukket(null);
    this.fejlVist = false;
    if (v.rigtig) {
      const n = this.pkt(v).length - 1;
      this.glid(v, n, Math.min(2200, Math.max(500, n * TRIN * 3.2)), () => { this.travlt = false; this.ankom(v); });
    } else {
      this.glid(v, this.maks(v), 450, () => {
        setTimeout(() => this.glid(v, 0, 380, () => { this.travlt = false; this.vej = null; this.pos = 0; this.opdater(); this.valgKnapper(); }), 650);
      });
    }
  }

  ankom(v) {
    this.spor.push(v.nr);
    this.knude = v.til;
    this.vej = null;
    this.pos = 0;
    this.hintNu = false;
    this.lukket = null;
    const k = this.d.knuder[v.til];
    this.m.besked(k.tekst || '', 'info');
    this.m.ui.sr.textContent = k.tekst || '';
    if (this.slut.includes(v.til)) {
      this.faerdig = true;
      this.m.afslutLag();
      return;
    }
    const spring = this.veje.find((s) => s.fra === v.til && s.spring);
    if (spring) { this.springTil(spring); return; }
    this.m.tegn();
  }

  /** En tur, der ikke er tegnet (fx gennem lungen): cellen forsvinder og kommer igen. */
  springTil(v) {
    this.travlt = true;
    this.m.tegn();
    if (v.undervejs) this.m.besked(v.undervejs, 'info');
    const [x, y] = this.sted();
    const slut = () => {
      if (v.ilt) this.ilt = v.ilt[1];
      this.spor.push(v.nr);
      this.knude = v.til;
      this.travlt = false;
      const k = this.d.knuder[v.til];
      const tekst = [v.tekst, k.tekst].filter(Boolean).join(' ');
      this.m.besked(tekst, 'info');
      this.m.ui.sr.textContent = tekst;
      this.m.tegn();
    };
    if (roligt()) { slut(); return; }
    this.celle.classList.add('vaek');
    const t0 = performance.now(), ms = 1500;
    const a = v.ilt ? v.ilt[0] : this.ilt;
    let n = 0;
    const trin = (t) => {
      const f = Math.min(1, (t - t0) / ms);
      if (v.ilt) {
        this.ilt = a + (v.ilt[1] - a) * f;
        this.opdater();
        if (f * 9 > n) { n++; this.partikel('O₂', [x + (Math.random() * 70 - 35), y - 40 - Math.random() * 20], [x, y], 'o2'); }
      }
      if (f < 1) this.anim = requestAnimationFrame(trin);
      else { this.anim = null; slut(); }
    };
    this.anim = requestAnimationFrame(trin);
  }

  // ── Træk med mus og finger ───────────────────────────────
  tilFigur(e) {
    const p = this.svg.createSVGPoint();
    p.x = e.clientX; p.y = e.clientY;
    const q = p.matrixTransform(this.svg.getScreenCTM().inverse());
    return [q.x, q.y];
  }

  /** Nærmeste prøvepunkt på v mellem lo og hi. */
  naermest(v, [x, y], lo, hi) {
    const p = this.pkt(v);
    let bi = lo, bd = Infinity;
    for (let i = Math.max(0, lo); i <= Math.min(this.maks(v), hi); i++) {
      const d = Math.hypot(p[i][0] - x, p[i][1] - y);
      if (d < bd) { bd = d; bi = i; }
    }
    return { i: bi, d: bd };
  }

  greb(e) {
    if (this.travlt || this.faerdig || (e.button !== undefined && e.button !== 0)) return;
    e.preventDefault();
    this.roert = true;
    this.celle.classList.remove('kald');
    this.celle.classList.add('holdt');
    this.fejlVist = false;
    const id = e.pointerId;
    try { this.celle.setPointerCapture(id); } catch (x) { /* ældre browsere */ }
    let mus = this.tilFigur(e);
    const flyt = (ev) => { if (ev.pointerId === id) { ev.preventDefault(); mus = this.tilFigur(ev); } };
    const trin = () => {
      this.foelg(mus);
      this.anim = requestAnimationFrame(trin);
    };
    const slip = (ev) => {
      if (ev.pointerId !== id) return;
      window.removeEventListener('pointermove', flyt);
      window.removeEventListener('pointerup', slip);
      window.removeEventListener('pointercancel', slip);
      cancelAnimationFrame(this.anim);
      this.anim = null;
      this.celle.classList.remove('holdt');
      this.slip();
    };
    window.addEventListener('pointermove', flyt, { passive: false });
    window.addEventListener('pointerup', slip);
    window.addEventListener('pointercancel', slip);
    this.anim = requestAnimationFrame(trin);
  }

  /** Ét billede under trækket: cellen rykker et stykke mod markøren ad den nærmeste vej. */
  foelg(mus) {
    if (!this.vej || this.pos < LAAS) {
      // tæt på knuden: vælg den vej, markøren er nærmest
      let bedst = null;
      for (const v of this.udgaaende()) {
        const r = this.naermest(v, mus, 0, (v === this.vej ? this.pos : 0) + 14);
        if (r.d < NAER && (!bedst || r.d < bedst.d)) bedst = { v, ...r };
      }
      if (!bedst) return;
      if (bedst.v !== this.vej) {
        if (this.vej && !this.vej.rigtig) this.lukket = null;
        this.vej = bedst.v; this.pos = 0; this.fejlVist = false;
        this.visLukket(null);
        if (bedst.v.rigtig && this.m.ui.besked.classList.contains('fejl')) this.m.besked('');
      }
    }
    const r = this.naermest(this.vej, mus, this.pos - 15, this.pos + 12);
    if (r.d < NAER * 1.4 && r.i !== this.pos) this.saet(r.i);
  }

  slip() {
    const v = this.vej;
    if (!v) return;
    const n = this.pkt(v).length - 1;
    if (!v.rigtig) {
      this.travlt = true;
      this.glid(v, 0, 380, () => { this.travlt = false; this.vej = null; this.pos = 0; this.opdater(); });
    } else if (this.pos >= n - 10) {
      this.travlt = true;
      this.glid(v, n, 200, () => { this.travlt = false; this.ankom(v); });
    } else if (this.pos < 4) {
      this.vej = null; this.pos = 0; this.opdater();
    }
    // ellers bliver cellen, hvor den er, og eleven kan trække videre
  }

  // ── Feedback ─────────────────────────────────────────────
  visFejl(v) {
    this.fejlVist = true;
    this.m.forsoeg[this.lagNr].fejl++;
    this.m.besked(v.fejl, 'fejl');
    this.m.ui.sr.textContent = v.fejl;
    this.celle.classList.remove('stop');
    void this.celle.getBBox();
    this.celle.classList.add('stop');
    if (v.klap) this.visLukket(v.klap);
  }

  /** En lukket klap: en tværstreg, hvor blodet ville igennem. */
  visLukket(klap, igen) {
    this.lukket = klap;
    const g = this.g && this.g.querySelector('.lukket');
    if (!g) return;
    g.innerHTML = klap ? `<g transform="translate(${klap[0]} ${klap[1]})"${igen ? '' : ' class="ny"'}><circle r="17"/><path d="M-10 -10 L10 10 M10 -10 L-10 10"/></g>` : '';
  }

  aabnKlap(klap) {
    if (roligt() || !this.g) return;
    const c = document.createElementNS(NS, 'circle');
    c.setAttribute('class', 'klap-aaben');
    c.setAttribute('cx', klap[0]); c.setAttribute('cy', klap[1]); c.setAttribute('r', 14);
    this.g.insertBefore(c, this.celle);
    setTimeout(() => c.remove(), 800);
  }

  /** O₂ ind i cellen og CO₂ ud (eller omvendt i kroppens væv). */
  udveksl(v) {
    if (roligt()) return;
    const [x, y] = this.sted();
    const s = v.side || -1;
    const ude = () => [x + (Math.random() * 80 - 40), y + s * (28 + Math.random() * 14)];
    const op = v.ilt[1] > v.ilt[0];
    if (op) { this.partikel('O₂', ude(), [x, y], 'o2'); this.partikel('CO₂', [x, y], ude(), 'co2'); }
    else { this.partikel('O₂', [x, y], ude(), 'o2'); this.partikel('CO₂', ude(), [x, y], 'co2'); }
  }

  partikel(tekst, [x1, y1], [x2, y2], cls) {
    if (!this.partikelLag) return;
    const t = document.createElementNS(NS, 'text');
    t.setAttribute('class', 'partikel ' + cls);
    t.setAttribute('text-anchor', 'middle');
    t.textContent = tekst;
    this.partikelLag.appendChild(t);
    const t0 = performance.now(), ms = 750;
    const trin = (nu) => {
      const f = Math.min(1, (nu - t0) / ms);
      t.setAttribute('x', (x1 + (x2 - x1) * f).toFixed(1));
      t.setAttribute('y', (y1 + (y2 - y1) * f + 5).toFixed(1));
      t.setAttribute('opacity', (f < 0.2 ? f * 5 : f > 0.75 ? (1 - f) * 4 : 1).toFixed(2));
      if (f < 1) requestAnimationFrame(trin); else t.remove();
    };
    requestAnimationFrame(trin);
  }

  // ── Hint ─────────────────────────────────────────────────
  hint() {
    if (this.travlt || this.faerdig) return;
    const r = this.rigtige();
    if (!r.length) return;
    if (this.hintNu) { this.koer(r[0]); return; }
    this.hintNu = true;
    this.m.forsoeg[this.lagNr].hint++;
    this.m.besked(r[0].hint || `Følg den markerede vej: ${r[0].valg}.`, 'hint');
    this.m.ui.sr.textContent = this.m.ui.besked.textContent;
    this.m.tegn();
  }
}
