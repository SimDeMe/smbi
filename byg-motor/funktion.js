// Funktionsopgaven: når figuren er bygget, får eleven en beskrivelse af, hvad
// en del gør, og klikker på delen i figuren. Fagordene på de dele, der mangler,
// er skjult; en del får sit ord igen, når den er fundet.
//
// Siden slår opgaven til ved at give `funktionTekst(fig, ord)` med i hooks
// (se side.js). Kun pladser med en tekst og en prik kommer med, og figuren skal
// have mindst tre af dem.
//
// Den del, man peger på, lyser op, og et klik vælger netop den. Delen er den
// mindste af pladsernes `omr` og den tegnede del øverst under musen; ligger et
// felt inde i et andet (kernen i cytoplasmaet), er det store felt baggrund.
// En figur kan selv sige, hvad der er ramt, med `fig.vaelgVed(x, y)` i figurens
// koordinater, og lyse det op med `fig.lysOp(ord)` (3D-cellen gør begge dele).

const NS = 'http://www.w3.org/2000/svg';
const MIN = 3;

const el = (tag, cls, tekst) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (tekst != null) e.textContent = tekst;
  return e;
};
const blandet = (a) => {
  const b = a.slice();
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
};

/** Spørgsmålene til en figur: [{ i, ord, tekst }] (tom, hvis figuren ikke har opgaven). */
export function spoergsmaal(fig, hooks) {
  if (!hooks.funktionTekst) return [];
  const sp = [];
  fig.pladser.forEach((p, i) => {
    const tekst = p.maal && hooks.funktionTekst(fig, p.ord);
    if (tekst) sp.push({ i, ord: p.ord, tekst });
  });
  return sp.length >= MIN ? sp : [];
}

export class Funktion {
  constructor(motor) {
    this.m = motor;
    this.sp = blandet(spoergsmaal(motor.fig, motor.hooks));
    this.nr = 0;
    this.fundet = new Set();       // plads-indeks
    this.fejl = 0;
    this.hint = 0;
    this.hintTrin = 0;             // 0: intet, 1: ordet er nævnt, 2: delen er vist
    this.slut = false;
    this.nyFundet = null;
  }

  get nu() { return this.sp[this.nr]; }
  iQuiz(i) { return this.sp.some((s) => s.i === i); }
  stjerne() { return this.fejl === 0 && this.hint === 0; }

  // ── Tegning ──────────────────────────────────────────────
  tegn(svg) {
    const m = this.m;
    // felterne: usynlige, indtil man peger på dem
    const omr = document.createElementNS(NS, 'g');
    omr.setAttribute('class', 'omraader funk');
    m.fig.pladser.forEach((p, i) => {
      if (!p.omr) return;
      const g = document.createElementNS(NS, 'g');
      const vist = !this.slut && this.hintTrin === 2 && this.nu && this.nu.i === i;
      g.setAttribute('class', 'omr' + (vist ? ' hint' : ''));
      g.dataset.i = i;
      g.dataset.ord = p.ord;
      g.innerHTML = p.omr;
      omr.appendChild(g);
    });
    svg.appendChild(omr);

    // fundne dele og dele uden for opgaven har deres ord; resten en prik,
    // der kun ses og bruges med tastaturet (musen peger på selve delen)
    const lag = document.createElementNS(NS, 'g');
    lag.setAttribute('class', 'pladser');
    this.prikker = [];
    m.fig.pladser.forEach((p, i) => {
      if (!this.iQuiz(i) || this.fundet.has(i) || this.slut) {
        const g = document.createElementNS(NS, 'g');
        g.setAttribute('class', 'plads laast' + (this.nyFundet === i ? ' pop' : ''));
        g.innerHTML = m.pladsMarkup(p, p.ord, true);
        g.setAttribute('aria-label', `${m.ORD[p.ord].ord}, fundet.`);
        lag.appendChild(g);
        return;
      }
      const g = document.createElementNS(NS, 'g');
      const vist = this.hintTrin === 2 && this.nu && this.nu.i === i;
      g.setAttribute('class', 'funk-prik' + (vist ? ' hint' : ''));
      g.setAttribute('tabindex', '0');
      g.setAttribute('role', 'button');
      g.setAttribute('aria-label', `Del ${this.prikker.length + 1}`);
      g.dataset.i = i;
      g.innerHTML = `<circle cx="${p.maal[0]}" cy="${p.maal[1]}" r="9"/>`;
      lag.appendChild(g);
      this.prikker.push(g);
    });
    svg.appendChild(lag);
    this.nyFundet = null;
    this.bind(svg);
  }

  tegnPanel() {
    const { bakke, opgTitel, opgTekst, hint, indsend, kort } = this.m.ui;
    kort.hidden = !this.slut;
    bakke.hidden = this.slut;
    hint.hidden = this.slut;
    indsend.hidden = true;
    this.m.ui.besked.hidden = this.slut;
    bakke.classList.remove('vejvalg');
    bakke.innerHTML = '';
    if (this.slut) {
      opgTitel.textContent = 'Hvad gør delene?';
      opgTekst.textContent = 'Du har fundet alle delene ud fra, hvad de gør.';
      this.tegnKort();
      return;
    }
    opgTitel.textContent = `Hvad gør delen? ${this.nr + 1} af ${this.sp.length}`;
    opgTekst.textContent = 'Læs beskrivelsen, og klik på den del af figuren, den passer til.';
    const t = el('p', 'funk-tekst', this.nu.tekst);
    t.setAttribute('aria-live', 'polite');
    bakke.appendChild(t);
    hint.textContent = this.hintTrin === 0 ? 'Giv et hint' : 'Vis delen';
    hint.disabled = this.hintTrin === 2;
  }

  tegnKort() {
    const m = this.m, k = m.ui.kort;
    k.innerHTML = '';
    k.appendChild(el('h3', null, 'Alle delene er fundet'));
    if (this.stjerne()) k.appendChild(el('p', 'ros', '★ Rigtigt i første forsøg uden hint.'));
    const dl = el('dl');
    for (const s of this.sp.slice().sort((a, b) => a.i - b.i)) {
      dl.appendChild(el('dt', null, m.ORD[s.ord].ord));
      dl.appendChild(el('dd', null, s.tekst));
    }
    k.appendChild(dl);
    m.tegnVidere(k);
  }

  // ── Klik ─────────────────────────────────────────────────
  /**
   * Fagordet for den del, der er under et punkt på skærmen (eller null).
   * Det er den del, der lyser op, når man peger, og den, et klik vælger.
   */
  ramt(cx, cy) {
    const m = this.m, svg = m.ui.svg;
    if (m.fig.vaelgVed) {
      const pt = svg.createSVGPoint();
      pt.x = cx; pt.y = cy;
      const p = pt.matrixTransform(svg.getScreenCTM().inverse());
      const ord = m.fig.vaelgVed(p.x, p.y);
      if (ord !== undefined) return ord;
    }
    const skala = svg.getScreenCTM().a;
    // størrelsen af det, man rammer: en streg måles som længde × bredde, ikke som sin ramme
    const str = (e) => {
      const cs = getComputedStyle(e);
      if (cs.fill === 'none' && e.getTotalLength) {
        try { return e.getTotalLength() * Math.max(1, parseFloat(cs.strokeWidth) || 1) * skala * skala; } catch (x) { /* fx <g> */ }
      }
      const r = e.getBoundingClientRect();
      return r.width * r.height;
    };
    const kand = [];
    let tegnet = null;   // den del, der er tegnet øverst under punktet
    for (const e of document.elementsFromPoint(cx, cy)) {
      if (!e.closest || !svg.contains(e)) continue;
      const d = e.closest('.dele .del');
      if (d) {
        if (tegnet === null) tegnet = d.dataset.ord ? { ord: d.dataset.ord, str: str(e) } : false;
        continue;
      }
      const g = e.closest('.omraader.funk .omr');
      if (!g) continue;
      const cs = getComputedStyle(e);
      const streg = cs.fill === 'none';
      const r = e.getBoundingClientRect();
      const b = streg ? (parseFloat(cs.strokeWidth) || 0) / 2 : 0;
      kand.push({ ord: g.dataset.ord, streg, str: str(e), x0: r.left - b, y0: r.top - b, x1: r.right + b, y1: r.bottom + b });
    }
    const areal = (k) => (k.x1 - k.x0) * (k.y1 - k.y0);
    // et felt, der rummer et meget mindre ramt felt, er baggrund for det
    const inde = (k, h) => k.x0 >= h.x0 - 1 && k.y0 >= h.y0 - 1 && k.x1 <= h.x1 + 1 && k.y1 <= h.y1 + 1 && areal(k) * 2 < areal(h);
    const rest = kand.filter((h) => h.streg || !kand.some((k) => k.ord !== h.ord && inde(k, h)));
    // den mindste af det, der er ramt; ved lige størrelse vinder det, man kan se øverst
    let bedst = tegnet || null;
    for (const k of rest) if (!bedst || k.str < bedst.str) bedst = k;
    return bedst ? bedst.ord : null;
  }

  vaelg(ord) {
    if (this.slut) return;
    const m = this.m, s = this.nu;
    if (!ord) { m.besked('Klik på en del af figuren. Den del, du peger på, lyser op.', 'info'); return; }
    if (ord === s.ord) {
      this.fundet.add(s.i);
      this.nyFundet = s.i;
      m.hintPlads = null;
      this.hintTrin = 0;
      this.nr++;
      if (this.nr >= this.sp.length) {
        this.slut = true;
        m.tegn();
        m.ui.sr.textContent = 'Alle delene er fundet.';
        m.hooks.funktionFaerdig?.(m.fig, this.stjerne());
        return;
      }
      m.besked(`Rigtigt: ${m.ORD[s.ord].ord}.`, 'ok');
      m.tegn();
      m.ui.sr.textContent = `Rigtigt: ${m.ORD[s.ord].ord}. Næste beskrivelse: ${this.nu.tekst}`;
      return;
    }
    this.fejl++;
    const navn = m.ORD[ord] ? m.ORD[ord].ord : ord;
    m.besked(`Du klikkede på «${navn}». Beskrivelsen passer til noget andet. Prøv igen.`, 'fejl');
    m.ui.sr.textContent = m.ui.besked.textContent;
  }

  giv() {
    if (this.slut || this.hintTrin >= 2) return;
    const m = this.m;
    this.hintTrin++;
    this.hint++;
    if (this.hintTrin === 1) {
      m.besked(`Hint: beskrivelsen passer til «${m.ORD[this.nu.ord].ord}». Find den på figuren.`, 'hint');
    } else {
      m.hintPlads = this.nu.i;          // 3D-cellen lyser delen op
      m.besked(`Den orange del er «${m.ORD[this.nu.ord].ord}». Klik på den.`, 'hint');
    }
    m.ui.sr.textContent = m.ui.besked.textContent;
    m.tegn();
  }

  /** Snydekoden: alle dele fundet. */
  springOver() {
    for (const s of this.sp) this.fundet.add(s.i);
    this.nr = this.sp.length;
    this.slut = true;
    this.m.hintPlads = null;
  }

  bind(svg) {
    // lytterne sidder på selve <svg>, som overlever, når figuren tegnes om;
    // motoren rydder dem, før den tegner (også en anden figur)
    if (svg._funk) svg._funk.ryd();
    if (this.slut) return;
    let over = null, ventende = null, raf = 0;
    // den del, man peger på, lyser op: feltet, selve tegningen og i 3D modellen
    const marker = (ord) => {
      if (ord === over) return;
      over = ord;
      for (const g of svg.querySelectorAll('.omraader.funk .omr')) g.classList.toggle('over', g.dataset.ord === ord);
      for (const g of svg.querySelectorAll('.dele .del[data-ord]')) g.classList.toggle('lys', g.dataset.ord === ord);
      svg.classList.toggle('lyser', !!ord);
      this.m.fig.lysOp?.(ord);
    };
    const klik = (e) => {
      if (e.button) return;
      const ord = this.ramt(e.clientX, e.clientY);
      marker(ord);
      this.vaelg(ord);
    };
    const flyt = (e) => {
      if (e.pointerType === 'touch') return;
      ventende = [e.clientX, e.clientY];
      if (!raf) raf = requestAnimationFrame(() => { raf = 0; if (ventende) marker(this.ramt(...ventende)); });
    };
    const ud = () => { ventende = null; marker(null); };
    svg.addEventListener('click', klik);
    svg.addEventListener('pointermove', flyt);
    svg.addEventListener('pointerleave', ud);
    svg.classList.add('funk-aktiv');
    svg._funk = {
      ryd: () => {
        svg.removeEventListener('click', klik);
        svg.removeEventListener('pointermove', flyt);
        svg.removeEventListener('pointerleave', ud);
        svg.classList.remove('funk-aktiv', 'lyser');
        if (raf) cancelAnimationFrame(raf);
        if (over) this.m.fig.lysOp?.(null);
        svg._funk = null;
      },
    };
    for (const g of this.prikker) {
      const ord = this.m.fig.pladser[+g.dataset.i].ord;
      // tastaturet: Tab mellem delene; prikken vises kun med fokus
      g.addEventListener('focus', () => marker(ord));
      g.addEventListener('blur', () => marker(null));
      g.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          const n = this.prikker.indexOf(g);
          this.vaelg(ord);
          // fokus videre til samme nummer (eller den sidste prik)
          const p = this.prikker[Math.min(n, this.prikker.length - 1)];
          if (p) p.focus({ preventScroll: true });
        }
      });
    }
  }
}
