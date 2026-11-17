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
//
// Status: én prik pr. del i panelet. Grøn: rigtigt i første forsøg. Gul: efter
// ét forkert klik. Rød: efter to forkerte klik, eller svaret blev givet (tredje
// forkerte klik eller «Vis svaret»). Rigtigt og forkert høres også (lyd.js).

import { spil, lydTil, saetLyd } from './lyd.js';

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
    this.forsoeg = this.sp.map(() => 0);        // forkerte klik pr. spørgsmål
    this.status = this.sp.map(() => null);      // 'groen' | 'gul' | 'roed' | 'givet'
    this.slut = false;
    this.nyFundet = null;
  }

  get nu() { return this.sp[this.nr]; }
  iQuiz(i) { return this.sp.some((s) => s.i === i); }
  stjerne() { return this.status.every((x) => x === 'groen'); }

  // ── Tegning ──────────────────────────────────────────────
  tegn(svg) {
    const m = this.m;
    // felterne: usynlige, indtil man peger på dem
    const omr = document.createElementNS(NS, 'g');
    omr.setAttribute('class', 'omraader funk');
    m.fig.pladser.forEach((p, i) => {
      if (!p.omr) return;
      const g = document.createElementNS(NS, 'g');
      g.setAttribute('class', 'omr');
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
      g.setAttribute('class', 'funk-prik');
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
    opgTitel.textContent = 'Hvad gør delen?';
    opgTekst.textContent = 'Læs beskrivelsen, og klik på delen. Den del, du peger på, lyser op.';
    bakke.appendChild(this.statuslinje(true));
    const t = el('p', 'funk-tekst', this.nu.tekst);
    t.setAttribute('aria-live', 'polite');
    bakke.appendChild(t);
    hint.textContent = 'Vis svaret';
    hint.disabled = false;
  }

  /** Prikkerne: én pr. del, farvet efter hvor mange forsøg den tog. */
  statuslinje(medLyd) {
    const linje = el('div', 'funk-status');
    const prikker = el('ol', 'funk-prikker');
    prikker.setAttribute('aria-label', `Del ${Math.min(this.nr + 1, this.sp.length)} af ${this.sp.length}`);
    const ord = { groen: 'rigtigt i første forsøg', gul: 'rigtigt efter ét forkert klik', roed: 'rigtigt efter to forkerte klik', givet: 'svaret blev vist' };
    const tegn = { groen: '✓', gul: '✓', roed: '✓', givet: '×' };
    this.sp.forEach((s, n) => {
      const st = this.status[n];
      const nu = !this.slut && n === this.nr;
      const forsoeg = this.forsoeg[n];
      // den aktuelle del viser allerede sin farve, når der er klikket forkert
      const farve = st || (nu ? [null, 'gul', 'roed'][Math.min(forsoeg, 2)] : null);
      const li = el('li', 'fp' + (farve ? ' ' + (farve === 'givet' ? 'roed' : farve) : '') + (nu ? ' nu' : ''), st ? tegn[st] : '');
      li.title = st ? `${this.m.ORD[s.ord].ord}: ${ord[st]}` : nu ? (forsoeg ? `${forsoeg} forkert${forsoeg > 1 ? 'e' : ''} klik` : 'Nu') : 'Ikke fundet endnu';
      li.setAttribute('aria-label', li.title);
      prikker.appendChild(li);
    });
    linje.appendChild(prikker);
    if (medLyd) {
      const b = el('button', 'btn-mini lyd', lydTil() ? '🔊 Lyd' : '🔇 Lyd');
      b.type = 'button';
      b.setAttribute('aria-pressed', String(lydTil()));
      b.title = 'Slå lyden til eller fra';
      b.addEventListener('click', () => {
        saetLyd(!lydTil());
        b.textContent = lydTil() ? '🔊 Lyd' : '🔇 Lyd';
        b.setAttribute('aria-pressed', String(lydTil()));
      });
      linje.appendChild(b);
    }
    return linje;
  }

  tegnKort() {
    const m = this.m, k = m.ui.kort;
    k.innerHTML = '';
    k.appendChild(el('h3', null, 'Alle delene er fundet'));
    k.appendChild(this.statuslinje(false));
    if (this.stjerne()) k.appendChild(el('p', 'ros', '★ Alle rigtige i første forsøg.'));
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
      spil('rigtigt');
      this.naeste(['groen', 'gul', 'roed'][Math.min(this.forsoeg[this.nr], 2)]);
      return;
    }
    this.forsoeg[this.nr]++;
    const navn = m.ORD[ord] ? m.ORD[ord].ord : ord;
    if (this.forsoeg[this.nr] >= 3) {
      spil('svar');
      this.naeste('givet', `Det var «${navn}». Svaret er «${m.ORD[s.ord].ord}».`);
      return;
    }
    spil('forkert');
    m.besked(`Det var «${navn}». Prøv igen.`, 'fejl');
    m.ui.sr.textContent = m.ui.besked.textContent;
    m.tegnPanel();
  }

  /** Delen er klaret (fundet eller vist): marker den, og gå videre. */
  naeste(status, tekst = '') {
    const m = this.m, s = this.nu;
    this.status[this.nr] = status;
    this.fundet.add(s.i);
    this.nyFundet = s.i;
    this.nr++;
    if (this.nr >= this.sp.length) this.slut = true;
    m.besked(tekst, tekst ? 'info' : '');
    m.tegn();
    if (this.slut) {
      m.ui.sr.textContent = 'Alle delene er fundet.';
      m.hooks.funktionFaerdig?.(m.fig, this.stjerne());
    } else {
      m.ui.sr.textContent = (status === 'givet' ? tekst : `Rigtigt: ${m.ORD[s.ord].ord}.`) + ' Næste: ' + this.nu.tekst;
    }
  }

  /** «Vis svaret»: delen sættes på, og prikken bliver rød. */
  giv() {
    if (this.slut) return;
    spil('svar');
    this.naeste('givet', `Svaret er «${this.m.ORD[this.nu.ord].ord}».`);
  }

  /** Snydekoden: alle dele fundet. */
  springOver() {
    this.sp.forEach((s, n) => { this.fundet.add(s.i); this.status[n] = this.status[n] || 'groen'; });
    this.nr = this.sp.length;
    this.slut = true;
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
