// Motoren bag «Byg cellen»: én figur ad gangen.
//
// Figuren bygges lag for lag. Lagets dele står grå, senere lag er skjult, og
// en del får farve, når fagordet sidder rigtigt. Eleven trækker (eller klikker)
// fagord fra bakken hen på de gule pladser og trykker Indsend svar. Rigtige
// ord låses, forkerte ryger tilbage i bakken med en forklaring på den første fejl.
//
// Svær udgave: alle lag og alle ord på én gang.

import { ORD, kort } from './ordliste.js';

const NS = 'http://www.w3.org/2000/svg';
const BOKS_B = 186, BOKS_H = 42;          // alle pladser er lige brede
const SNAP = 30;                          // px: slip tæt på en plads rammer den

const $ = (s, r = document) => r.querySelector(s);
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

export class Byg {
  /**
   * @param {object} fig  figurdata (fig-*.js)
   * @param {object} ui   { svg, bakke, besked, hint, indsend, lagliste, opgTitel, opgTekst, kort, sr }
   * @param {object} hooks { svaer: () => bool, faerdig: (fig) => void, naeste: () => void, naesteTekst: () => string|null }
   */
  constructor(fig, ui, hooks) {
    this.fig = fig;
    this.ui = ui;
    this.hooks = hooks;
    this.ordLag = {};
    fig.lag.forEach((l, i) => l.ord.forEach((o) => { this.ordLag[o] = i; }));
    this.nulstil();
  }

  // ── Tilstand ─────────────────────────────────────────────
  nulstil() {
    this.svaer = !!this.hooks.svaer();
    this.lag = 0;                    // det lag, der bygges nu
    this.loest = new Set();          // fagord, der sidder rigtigt
    this.paa = new Map();            // plads-indeks → ord (ikke indsendt endnu)
    this.valgt = null;               // { ord, fra: 'bakke' | plads-indeks }
    this.hintPlads = null;
    this.forsoeg = this.fig.lag.map(() => ({ fejl: 0, hint: 0 }));
    this.stjerner = this.fig.lag.map(() => false);
    this.lagFaerdig = false;         // det grønne kort vises
    this.nyeFarver = new Set();
    this.blandBakke();
  }

  aktiveLag() {
    return this.svaer ? this.fig.lag.map((_, i) => i) : [this.lag];
  }

  blandBakke() {
    const ord = [];
    for (const i of this.aktiveLag()) {
      const l = this.fig.lag[i];
      ord.push(...l.ord, ...(l.ekstra || []));
    }
    this.bakkeRaekke = blandet(ord);
  }

  bakkeOrd() {
    const paa = new Set(this.paa.values());
    return this.bakkeRaekke.filter((o) => !this.loest.has(o) && !paa.has(o));
  }

  synlig(lagNr) { return this.svaer || lagNr <= this.lag; }

  pladsAktiv(i) {
    const p = this.fig.pladser[i];
    return this.synlig(this.ordLag[p.ord]) && !this.loest.has(p.ord);
  }

  ekstraFejl(ord) {
    for (const l of this.fig.lag) if (l.ekstraFejl && l.ekstraFejl[ord]) return l.ekstraFejl[ord];
    return null;
  }

  erEkstra(ord) { return this.fig.lag.some((l) => (l.ekstra || []).includes(ord)); }

  // ── Tegning ──────────────────────────────────────────────
  tegn() {
    this.tegnFigur();
    this.tegnPanel();
  }

  tegnFigur() {
    const { svg } = this.ui;
    const [W, H] = this.fig.vb;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.innerHTML = '';

    const dele = document.createElementNS(NS, 'g');
    dele.setAttribute('class', 'dele');
    for (const d of this.fig.dele) {
      const lagNr = this.ordLag[d.ord] ?? 0;
      if (!this.synlig(lagNr)) continue;
      const g = document.createElementNS(NS, 'g');
      const farvet = this.loest.has(d.ord);
      g.setAttribute('class', 'del ' + (farvet ? 'farvet' : 'graa') + (this.nyeFarver.has(d.ord) ? ' pop' : ''));
      g.dataset.ord = d.ord;
      g.innerHTML = d.svg;
      dele.appendChild(g);
    }
    svg.appendChild(dele);

    // gule felter om det, pladserne handler om
    const omr = document.createElementNS(NS, 'g');
    omr.setAttribute('class', 'omraader');
    this.fig.pladser.forEach((p, i) => {
      if (!this.pladsAktiv(i) || !p.omr) return;
      const g = document.createElementNS(NS, 'g');
      g.setAttribute('class', 'omr' + (this.hintPlads === i ? ' hint' : ''));
      g.dataset.i = i;
      g.innerHTML = p.omr;
      omr.appendChild(g);
    });
    svg.appendChild(omr);

    // pladserne: streg, prik og boks
    const lagP = document.createElementNS(NS, 'g');
    lagP.setAttribute('class', 'pladser');
    this.pladsEl = [];
    this.fig.pladser.forEach((p, i) => {
      if (!this.synlig(this.ordLag[p.ord])) { this.pladsEl[i] = null; return; }
      const laast = this.loest.has(p.ord);
      const ord = laast ? p.ord : this.paa.get(i);
      const g = document.createElementNS(NS, 'g');
      let cls = 'plads';
      if (laast) cls += ' laast';
      else if (ord) cls += ' fyldt';
      else cls += ' tom';
      if (this.hintPlads === i) cls += ' hint';
      if (this.valgt && this.valgt.fra === i) cls += ' valgt';
      g.setAttribute('class', cls);
      g.dataset.i = i;
      const bx = p.x - BOKS_B / 2, by = p.y - BOKS_H / 2;
      let inner = '';
      if (p.maal) {
        const [mx, my] = p.maal;
        let sx, sy;
        if (mx > bx + BOKS_B) { sx = bx + BOKS_B; sy = p.y; }
        else if (mx < bx) { sx = bx; sy = p.y; }
        else { sx = Math.max(bx + 12, Math.min(bx + BOKS_B - 12, mx)); sy = my > p.y ? by + BOKS_H : by; }
        inner += `<line class="streg" x1="${sx}" y1="${sy}" x2="${mx}" y2="${my}"/>
                  <circle class="prik" cx="${mx}" cy="${my}" r="6.5"/>`;
      }
      inner += `<rect class="boks" x="${bx}" y="${by}" width="${BOKS_B}" height="${BOKS_H}" rx="11"/>`;
      inner += `<text class="ordtekst" x="${p.x}" y="${p.y + 7}" text-anchor="middle">${ord ? ORD[ord].ord : ''}</text>`;
      if (laast) inner += `<title>${ORD[p.ord].ord}: ${ORD[p.ord].tekst}</title>`;
      g.innerHTML = inner;
      if (!laast) {
        g.setAttribute('tabindex', '0');
        g.setAttribute('role', 'button');
        g.setAttribute('aria-label', `Plads ${i + 1}` + (ord ? `: ${ORD[ord].ord}, ikke indsendt` : ': tom'));
      } else {
        g.setAttribute('tabindex', '0');
        g.setAttribute('aria-label', `Plads ${i + 1}: ${ORD[p.ord].ord}, rigtigt. ${ORD[p.ord].tekst}`);
      }
      lagP.appendChild(g);
      this.pladsEl[i] = g;
    });
    svg.appendChild(lagP);
    this.nyeFarver.clear();
    this.bindFigur();
  }

  tegnPanel() {
    const { bakke, lagliste, opgTitel, opgTekst, hint, indsend, kort: kortEl } = this.ui;
    const f = this.fig;

    // opgaven
    if (this.svaer) {
      opgTitel.textContent = `${f.navn}: alle fagord på én gang`;
    } else {
      opgTitel.textContent = `Lag ${this.lag + 1} af ${f.lag.length}: ${f.lag[this.lag].navn}`;
    }
    const ekstra = this.aktiveLag().reduce((n, i) => n + (f.lag[i].ekstra || []).length, 0);
    opgTekst.textContent = 'Træk fagordene hen på de gule pladser, eller klik på et ord og så på pladsen. Tryk Indsend svar.'
      + (ekstra === 1 ? ' Ét ord er i overskud.' : ekstra > 1 ? ` ${ekstra} ord er i overskud.` : '');

    // det grønne kort i stedet for bakken
    kortEl.hidden = !this.lagFaerdig;
    bakke.hidden = this.lagFaerdig;
    hint.hidden = indsend.hidden = this.lagFaerdig;
    this.ui.besked.hidden = this.lagFaerdig;
    if (this.lagFaerdig) this.tegnKort();

    // bakken
    bakke.innerHTML = '';
    const ordene = this.bakkeOrd();
    for (const o of ordene) {
      const b = el('button', 'ord', ORD[o].ord);
      b.type = 'button';
      b.dataset.ord = o;
      if (this.valgt && this.valgt.ord === o && this.valgt.fra === 'bakke') {
        b.classList.add('valgt');
        b.setAttribute('aria-pressed', 'true');
      } else b.setAttribute('aria-pressed', 'false');
      bakke.appendChild(b);
    }
    if (!ordene.length && !this.lagFaerdig) bakke.appendChild(el('span', 'tom-bakke', 'Alle ord er sat på. Tryk Indsend svar.'));
    this.bindBakke();

    hint.textContent = this.hintPlads != null && this.pladsAktiv(this.hintPlads) ? 'Vis svaret' : 'Giv et hint';

    // lagene
    lagliste.innerHTML = '';
    f.lag.forEach((l, i) => {
      const li = el('li');
      const b = el('button', 'lag-knap');
      b.type = 'button';
      const faerdig = l.ord.every((o) => this.loest.has(o));
      if (faerdig) b.classList.add('faerdig');
      if (!this.svaer && i === this.lag) { b.classList.add('nu'); b.setAttribute('aria-current', 'step'); }
      b.innerHTML = `<span class="nr">${i + 1}</span><span class="lnavn"></span><span class="stjerne" aria-hidden="true">${this.stjerner[i] ? '★' : ''}</span>`;
      b.querySelector('.lnavn').textContent = l.navn;
      b.title = faerdig ? 'Bygget' + (this.stjerner[i] ? ' i første forsøg uden hint' : '') : (i > this.lag ? 'Spring hertil: lagene før bliver bygget færdige' : 'Bygges nu');
      b.disabled = this.svaer;
      b.addEventListener('click', () => this.springTil(i));
      li.appendChild(b);
      lagliste.appendChild(li);
    });
  }

  tegnKort() {
    const k = this.ui.kort;
    k.innerHTML = '';
    const f = this.fig;
    const helt = this.faerdig();
    const lagene = this.svaer ? f.lag.map((_, i) => i) : [this.lag];
    k.appendChild(el('h3', null, helt ? `${f.navn} er bygget` : `Lag ${this.lag + 1} er bygget`));
    if (!this.svaer && this.stjerner[this.lag]) k.appendChild(el('p', 'ros', '★ Rigtigt i første forsøg uden hint.'));
    const dl = el('dl');
    for (const i of lagene) for (const o of f.lag[i].ord) {
      dl.appendChild(el('dt', null, ORD[o].ord));
      dl.appendChild(el('dd', null, kort(o)));
    }
    k.appendChild(dl);
    let tekst = null, handling = null;
    if (!helt) { tekst = 'Næste lag'; handling = () => this.naesteLag(); }
    else {
      tekst = this.hooks.naesteTekst();
      handling = () => this.hooks.naeste();
    }
    if (tekst) {
      const b = el('button', 'btn-stor', tekst + ' →');
      b.type = 'button';
      b.id = 'btn-naeste';
      b.addEventListener('click', handling);
      k.appendChild(b);
      requestAnimationFrame(() => b.focus({ preventScroll: true }));
    } else {
      k.appendChild(el('p', 'slut', this.svaer
        ? 'Alle figurerne er bygget i den svære udgave. Flot!'
        : 'Alle figurerne er bygget. Prøv Svær udgave øverst: alle ord på én gang.'));
    }
  }

  besked(tekst, slags = '') {
    const b = this.ui.besked;
    b.textContent = tekst;
    b.className = 'besked' + (slags ? ' ' + slags : '');
  }

  // ── Handlinger ───────────────────────────────────────────
  vaelg(ord, fra) {
    if (this.valgt && this.valgt.ord === ord && this.valgt.fra === fra) {
      this.valgt = null;
      this.besked('');
    } else {
      this.valgt = { ord, fra };
      this.besked(`«${ORD[ord].ord}» er valgt. Klik på en gul plads.`, 'info');
    }
    this.tegn();
    if (fra === 'bakke') {
      const b = this.ui.bakke.querySelector(`[data-ord="${ord}"]`);
      if (b) b.focus({ preventScroll: true });
    }
  }

  markerOmr(i, til) {
    const o = this.ui.svg.querySelector(`.omr[data-i="${i}"]`);
    if (o) o.classList.toggle('over', til);
  }

  /** Sæt ord på plads i (bytter, hvis der står et ord i forvejen). */
  placer(ord, i, fra) {
    if (!this.pladsAktiv(i)) return;
    const foer = this.paa.get(i);
    if (typeof fra === 'number') {
      this.paa.delete(fra);
      if (foer && foer !== ord) this.paa.set(fra, foer);
    } else {
      for (const [k, v] of this.paa) if (v === ord) this.paa.delete(k);
    }
    this.paa.set(i, ord);
    this.valgt = null;
    this.besked('');
    this.tegn();
    this.ui.sr.textContent = `${ORD[ord].ord} sat på plads ${i + 1}.`;
  }

  tilBakke(i) {
    if (!this.paa.has(i)) return;
    this.paa.delete(i);
    this.valgt = null;
    this.tegn();
  }

  indsend() {
    if (this.lagFaerdig) return;
    if (!this.paa.size) {
      this.besked('Sæt mindst ét ord på en plads først.', 'info');
      return;
    }
    let rigtige = 0, forkerte = 0, foersteFejl = null;
    for (const [i, ord] of [...this.paa].sort((a, b) => a[0] - b[0])) {
      const p = this.fig.pladser[i];
      if (ord === p.ord) {
        rigtige++;
        this.loest.add(ord);
        this.nyeFarver.add(ord);
        if (this.hintPlads === i) this.hintPlads = null;
      } else {
        forkerte++;
        this.forsoeg[this.ordLag[p.ord]].fejl++;
        if (!foersteFejl) {
          foersteFejl = (p.fejl && p.fejl[ord]) || this.ekstraFejl(ord)
            || `«${ORD[ord].ord}» passer ikke her. ${ORD[ord].ord[0].toUpperCase() + ORD[ord].ord.slice(1)} er: ${kort(ord).replace(/^\w/, (c) => c.toLowerCase())}`;
        }
      }
    }
    this.paa.clear();
    this.valgt = null;

    if (this.lagLoest()) {
      this.afslutLag();
      return;
    }
    if (forkerte) {
      this.besked((rigtige ? `${rigtige} rigtig${rigtige > 1 ? 'e' : ''}. ` : '') + foersteFejl, 'fejl');
    } else {
      this.besked(`${rigtige} rigtig${rigtige > 1 ? 'e' : ''}. Fortsæt med resten.`, 'ok');
    }
    this.ui.sr.textContent = this.ui.besked.textContent;
    this.tegn();
  }

  lagLoest() {
    return this.aktiveLag().every((i) => this.fig.lag[i].ord.every((o) => this.loest.has(o)));
  }

  faerdig() {
    return this.fig.lag.every((l) => l.ord.every((o) => this.loest.has(o)));
  }

  afslutLag() {
    for (const i of this.aktiveLag()) {
      const fs = this.forsoeg[i];
      this.stjerner[i] = fs.fejl === 0 && fs.hint === 0;
    }
    this.lagFaerdig = true;
    this.hintPlads = null;
    this.tegn();
    this.ui.sr.textContent = this.ui.kort.querySelector('h3').textContent;
    if (this.faerdig()) this.hooks.faerdig(this.fig, this.stjerner.every(Boolean), this.svaer);
  }

  naesteLag() {
    if (this.lag < this.fig.lag.length - 1) this.lag++;
    this.lagFaerdig = false;
    this.blandBakke();
    this.besked('');
    this.tegn();
  }

  hint() {
    if (this.lagFaerdig) return;
    let i = this.hintPlads;
    if (i != null && this.pladsAktiv(i)) {
      // anden gang: vis svaret
      const ord = this.fig.pladser[i].ord;
      for (const [k, v] of this.paa) if (v === ord || k === i) this.paa.delete(k);
      this.loest.add(ord);
      this.nyeFarver.add(ord);
      this.hintPlads = null;
      this.besked(`Svaret er «${ORD[ord].ord}». ${kort(ord)}`, 'info');
      if (this.lagLoest()) { this.afslutLag(); return; }
      this.tegn();
      return;
    }
    // første tomme (eller forkert udfyldte) plads i laget
    const kandidater = this.fig.pladser.map((_, k) => k).filter((k) => this.pladsAktiv(k));
    i = kandidater.find((k) => this.paa.get(k) !== this.fig.pladser[k].ord);
    if (i == null) i = kandidater[0];
    if (i == null) return;
    this.hintPlads = i;
    this.forsoeg[this.ordLag[this.fig.pladser[i].ord]].hint++;
    this.besked(`Hint til den orange plads: ${kort(this.fig.pladser[i].ord)}`, 'hint');
    this.ui.sr.textContent = this.ui.besked.textContent;
    this.tegn();
  }

  springTil(n) {
    if (this.svaer || n === this.lag) return;
    if (n < this.lag) { this.besked('Det lag er allerede bygget.', 'info'); return; }
    for (let i = 0; i < n; i++) this.fig.lag[i].ord.forEach((o) => this.loest.add(o));
    this.lag = n;
    this.lagFaerdig = false;
    this.paa.clear();
    this.valgt = null;
    this.hintPlads = null;
    this.blandBakke();
    this.besked(`Lagene før er bygget færdige. Nu: ${this.fig.lag[n].navn}.`, 'info');
    this.tegn();
  }

  // ── Mus, touch og tastatur ───────────────────────────────
  pladsVed(cx, cy) {
    let bedst = null, bedstAfst = Infinity;
    this.pladsEl.forEach((g, i) => {
      if (!g || !this.pladsAktiv(i)) return;
      const r = g.querySelector('.boks').getBoundingClientRect();
      const dx = Math.max(r.left - cx, 0, cx - r.right);
      const dy = Math.max(r.top - cy, 0, cy - r.bottom);
      const a = Math.hypot(dx, dy);
      if (a <= SNAP && a < bedstAfst) { bedst = i; bedstAfst = a; }
    });
    return bedst;
  }

  /** Fælles trækkelogik for ord i bakken og ord på en plads. */
  traek(e, ord, fra, kilde) {
    if (e.button !== undefined && e.button !== 0) return;
    const start = { x: e.clientX, y: e.clientY };
    let spoeg = null, over = null;
    const id = e.pointerId;
    try { kilde.setPointerCapture(id); } catch (x) { /* ældre browsere */ }

    const flyt = (ev) => {
      if (ev.pointerId !== id) return;
      if (!spoeg && Math.hypot(ev.clientX - start.x, ev.clientY - start.y) > 6) {
        spoeg = el('div', 'spoeg-ord', ORD[ord].ord);
        document.body.appendChild(spoeg);
        document.body.classList.add('traekker');
        kilde.classList.add('traekkes');
      }
      if (!spoeg) return;
      ev.preventDefault();
      spoeg.style.left = ev.clientX + 'px';
      spoeg.style.top = ev.clientY + 'px';
      const ny = this.pladsVed(ev.clientX, ev.clientY);
      if (ny !== over) {
        if (over != null && this.pladsEl[over]) { this.pladsEl[over].classList.remove('over'); this.markerOmr(over, false); }
        if (ny != null) { this.pladsEl[ny].classList.add('over'); this.markerOmr(ny, true); }
        over = ny;
      }
    };
    const slip = (ev) => {
      if (ev.pointerId !== id) return;
      kilde.removeEventListener('pointermove', flyt);
      kilde.removeEventListener('pointerup', slip);
      kilde.removeEventListener('pointercancel', slip);
      document.body.classList.remove('traekker');
      kilde.classList.remove('traekkes');
      if (!spoeg) { this.vaelg(ord, fra); return; }
      spoeg.remove();
      if (ev.type === 'pointercancel') { this.tegn(); return; }
      if (over != null) this.placer(ord, over, fra);
      else if (typeof fra === 'number') this.tilBakke(fra);
      else this.tegn();
    };
    kilde.addEventListener('pointermove', flyt);
    kilde.addEventListener('pointerup', slip);
    kilde.addEventListener('pointercancel', slip);
  }

  bindBakke() {
    for (const b of this.ui.bakke.querySelectorAll('.ord')) {
      const ord = b.dataset.ord;
      b.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'mouse' || e.pointerType === 'pen' || e.pointerType === 'touch') {
          e.preventDefault();
          this.traek(e, ord, 'bakke', b);
        }
      });
      // tastatur (og klik uden pointerdown, fx skærmlæser)
      b.addEventListener('click', (e) => { if (e.detail === 0) this.vaelg(ord, 'bakke'); });
    }
  }

  bindFigur() {
    this.pladsEl.forEach((g, i) => {
      if (!g || this.loest.has(this.fig.pladser[i].ord)) {
        if (g) {
          const vis = () => this.besked(`${ORD[this.fig.pladser[i].ord].ord}: ${ORD[this.fig.pladser[i].ord].tekst}`, 'info');
          g.addEventListener('pointerenter', vis);
          g.addEventListener('focus', vis);
        }
        return;
      }
      const klik = () => {
        const ord = this.paa.get(i);
        if (this.valgt) this.placer(this.valgt.ord, i, this.valgt.fra);
        else if (ord) this.vaelg(ord, i);
        else this.besked('Vælg først et fagord i bakken.', 'info');
      };
      g.addEventListener('pointerenter', () => { g.classList.add('over'); this.markerOmr(i, true); });
      g.addEventListener('pointerleave', () => { g.classList.remove('over'); this.markerOmr(i, false); });
      g.addEventListener('focus', () => this.markerOmr(i, true));
      g.addEventListener('blur', () => this.markerOmr(i, false));
      g.addEventListener('pointerdown', (e) => {
        const ord = this.paa.get(i);
        e.preventDefault();
        if (ord && !this.valgt) { this.traek(e, ord, i, g); return; }
        const op = (ev) => { g.removeEventListener('pointerup', op); if (ev.pointerId === e.pointerId) klik(); };
        g.addEventListener('pointerup', op);
      });
      g.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); klik(); this.fokusPlads(i); }
        else if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); this.tilBakke(i); this.fokusPlads(i); }
      });
    });
  }

  fokusPlads(i) {
    const g = this.pladsEl[i];
    if (g) g.focus({ preventScroll: true });
  }

  annuller() {
    if (!this.valgt) return false;
    this.valgt = null;
    this.besked('');
    this.tegn();
    return true;
  }
}
