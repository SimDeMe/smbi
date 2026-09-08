/**
 * Indlæser en sprite fra Assets/sprites/ og tegner den på et 2D-lærred.
 *
 *   import {indlaesAborre} from '/Assets/sprites/aborre/aborre.js';
 *
 *   const aborre = await indlaesAborre();
 *   aborre.tegn(ctx, {x:300, y:180, laengde:220, tid:ur/1000});
 *
 * Billederne er SVG. Første gang en størrelse bruges, rasteriseres alle
 * billeder én gang til et skjult lærred — derefter er hvert billede en
 * ren drawImage, også når der svømmer tyve fisk på skærmen. Rasteren
 * laves i nærmeste toerpotens over den ønskede størrelse og skaleres ned,
 * så figuren aldrig bliver udtværet.
 *
 * Sprite-mappens kontrakt står i Assets/sprites/README.md.
 */

const MAKS_RASTER = 4096;

export async function indlaesSprite(adresse) {
  const kort = new URL(adresse, location.href);
  const svar = await fetch(kort);
  if (!svar.ok) throw new Error(`Kunne ikke hente ${kort}: ${svar.status}`);
  const data = await svar.json();
  const kilder = await Promise.all(
    data.filer.map(fil => hentBillede(new URL(fil, kort))));
  return new Sprite(data, kilder);
}

function hentBillede(kort) {
  return new Promise((klar, fejl) => {
    const billede = new Image();
    billede.decoding = 'async';
    billede.onload = () => klar(billede);
    billede.onerror = () => fejl(new Error(`Kunne ikke hente ${kort}`));
    billede.src = kort.href;
  });
}

export class Sprite {
  #kilder;
  #rastere = new Map();

  constructor(data, kilder) {
    this.data = data;
    this.#kilder = kilder;
  }

  get billeder() { return this.data.billeder; }

  /** Hvilket billede af svømmetaget hører til tidspunktet (sekunder)? */
  billedeAf(tid, tempo = this.data.tempo) {
    const n = this.data.billeder;
    return ((Math.floor(tid * tempo * n) % n) + n) % n;
  }

  /** Figurens højde i px, når den tegnes med denne længde. */
  hoejdeAf(laengde) {
    return this.#celle({laengde}).hoejde * this.data.kasse.hoejde;
  }

  /** Figurens længde i px, når den tegnes med denne højde. */
  laengdeAf(hoejde) {
    return this.#celle({hoejde}).bredde * this.data.kasse.bredde;
  }

  /** Figurens anker i cellen: sprite'ens eget, ellers midten af den. */
  get anker() {
    const k = this.data.kasse;
    return this.data.anker || {x: k.x + k.bredde/2, y: k.y + k.hoejde/2};
  }

  /**
   * Tegner sprite'en med dens anker i (x, y) — for de fleste figurer midten,
   * for en plante roden.
   *   laengde  figurens længde i px, fx snude til halespids
   *   hoejde   figurens højde i px — brug den i stedet for laengde
   *   tid      sekunder — vælger billedet i svømmetaget
   *   tempo    svømmetag pr. sekund (standard: sprite'ens eget)
   *   billede  vælg billedet selv i stedet for tid
   *   retning  1 = mod højre, -1 = mod venstre
   *   haeld    hældning i radianer, positiv drejer snuden nedad
   *   daekning 0–1
   */
  tegn(ctx, o) {
    const maal = this.#celle(o);
    if (!maal) return;
    const nr = o.billede != null
      ? ((o.billede % this.data.billeder) + this.data.billeder) % this.data.billeder
      : this.billedeAf(o.tid || 0, o.tempo);

    const {bredde, hoejde} = maal;
    const a = this.anker;
    const retning = o.retning < 0 ? -1 : 1;
    const haeld = (o.haeld || 0) * retning;

    ctx.save();
    ctx.translate(o.x, o.y);
    if (haeld) ctx.rotate(haeld);
    if (retning < 0) ctx.scale(-1, 1);
    if (o.daekning != null) ctx.globalAlpha *= o.daekning;
    ctx.drawImage(this.#raster(ctx, bredde)[nr],
      -a.x * bredde, -a.y * hoejde, bredde, hoejde);
    ctx.restore();
  }

  /**
   * Hvor et navngivet punkt på figuren ligger på lærredet — 'mund', 'oeje',
   * 'ryg', 'halerod'. Til bobler, mærkater og pile. Punktet er målt på den
   * hvilende figur, så det følger ikke halens udsving.
   */
  punkt(navn, o) {
    const p = (this.data.punkter || {})[navn];
    if (!p) throw new Error(`Sprite'en ${this.data.navn} har intet punkt "${navn}"`);
    const {bredde, hoejde} = this.#celle(o);
    const a = this.anker;
    const retning = o.retning < 0 ? -1 : 1;
    const haeld = (o.haeld || 0) * retning;
    const dx = (p.x - a.x) * bredde * retning;
    const dy = (p.y - a.y) * hoejde;
    const c = Math.cos(haeld), s = Math.sin(haeld);
    return {x: o.x + dx * c - dy * s, y: o.y + dx * s + dy * c};
  }

  /** Cellens mål i px, når figuren skal være så lang — eller så høj. */
  #celle(o) {
    const c = this.data.celle, k = this.data.kasse;
    let bredde;
    if (o.laengde > 0)     bredde = o.laengde / k.bredde;
    else if (o.hoejde > 0) bredde = (o.hoejde / k.hoejde) * (c.bredde / c.hoejde);
    else return null;
    return {bredde, hoejde: bredde * c.hoejde / c.bredde};
  }

  /** Billederne rasteriseret til den nærmeste toerpotens over cellebredden. */
  #raster(ctx, bredde) {
    let skala = 1;
    if (ctx.getTransform) {
      const m = ctx.getTransform();
      skala = Math.hypot(m.a, m.b) || 1;
    }
    const b = Math.min(MAKS_RASTER,
      2 ** Math.ceil(Math.log2(Math.max(64, bredde * skala))));
    let ark = this.#rastere.get(b);
    if (!ark) {
      const h = Math.round(b * this.data.celle.hoejde / this.data.celle.bredde);
      ark = this.#kilder.map(kilde => {
        const laerred = document.createElement('canvas');
        laerred.width = b;
        laerred.height = h;
        laerred.getContext('2d').drawImage(kilde, 0, 0, b, h);
        return laerred;
      });
      if (this.#rastere.size > 3) this.#rastere.delete(this.#rastere.keys().next().value);
      this.#rastere.set(b, ark);
    }
    return ark;
  }
}
