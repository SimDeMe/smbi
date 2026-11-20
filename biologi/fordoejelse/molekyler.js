// Næringsstofferne som små molekyletegninger, der spaltes undervejs i rundturen.
// Stivelse → maltose → glukose, protein → peptider → aminosyrer, fedt → fedtsyrer + glycerol,
// kostfibre (spaltes ikke af kroppens enzymer). Produkterne optages og forsvinder op mod blod/lymfe.
import {værdi, forhold} from './indhold.js';

const NS = 'http://www.w3.org/2000/svg';
const el = (navn, attr = {}, forælder) => {
  const e = document.createElementNS(NS, navn);
  for (const [k, v] of Object.entries(attr)) e.setAttribute(k, v);
  forælder?.appendChild(e);
  return e;
};
const B = 300, H = 34, MIDT = 21;

function sekskant(r) {
  return Array.from({length: 6}, (_, i) => {
    const a = Math.PI / 6 + (i * Math.PI) / 3;
    return `${(r * Math.cos(a)).toFixed(2)},${(r * Math.sin(a)).toFixed(2)}`;
  }).join(' ');
}

// brud: liste af [bindingens nummer, kurve, rang, antal, reserve?] – bindingen brydes, når kurven er over
// tærsklen; en reservekurve kan bryde den i stedet (fx trypsin, når pepsin ikke har virket)
function kæde({n, form, farver, brud, optag, optagKun}) {
  const svg = el('svg', {viewBox: `0 0 ${B} ${H}`, 'aria-hidden': 'true'});
  const bånd = [], enheder = [];
  for (let i = 0; i < n - 1; i++) bånd.push(el('line', {class: 'm-bånd'}, svg));
  for (let i = 0; i < n; i++) {
    const g = el('g', {}, svg);
    if (form === 'sukker') el('polygon', {points: sekskant(7), fill: farver[i % farver.length], class: 'm-enhed'}, g);
    else el('circle', {r: 6.2, fill: farver[i % farver.length], class: 'm-enhed'}, g);
    enheder.push(g);
  }
  return {
    svg,
    opdater(u) {
      const brudt = Array(n - 1).fill(false);
      for (const [b, kurve, rang, antal, reserve] of brud) {
        const t = (rang + 0.5) / antal;
        if (værdi(kurve, u).v >= t || (reserve && værdi(reserve, u).v >= t)) brudt[b] = true;
      }
      const op = optag ? værdi(optag, u).v : 0;
      const trin = 16.5, mellem = 7;
      const bredde = (n - 1) * trin + brudt.filter(Boolean).length * mellem;
      let x = (B - 40 - bredde) / 2 + 8;
      const xs = [];
      for (let i = 0; i < n; i++) {
        xs.push(x);
        x += trin + (brudt[i] ? mellem : 0);
      }
      let fri = 0;
      for (let i = 0; i < n; i++) {
        const løs = (i === 0 || brudt[i - 1]) && (i === n - 1 || brudt[i]);
        const kanOptages = optagKun ? optagKun(i, brudt) : løs;
        let dy = 0, alfa = 1;
        if (kanOptages && optag) {
          const tærskel = (fri++ + 0.5) / n;
          const t = Math.min(1, Math.max(0, (op - tærskel * 0.8) / 0.25));
          dy = -t * 14; alfa = 1 - t;
        }
        enheder[i].setAttribute('transform', `translate(${xs[i].toFixed(1)},${(MIDT + dy).toFixed(1)})`);
        enheder[i].style.opacity = alfa;
      }
      for (let i = 0; i < n - 1; i++) {
        const l = bånd[i];
        l.setAttribute('x1', xs[i]); l.setAttribute('x2', xs[i + 1]);
        l.setAttribute('y1', MIDT); l.setAttribute('y2', MIDT);
        l.style.opacity = brudt[i] ? 0 : Math.min(enheder[i].style.opacity, enheder[i + 1].style.opacity);
      }
      return brudt;
    },
  };
}

function fedt() {
  // tre triglycerider: glycerol (lodret stav) med tre fedtsyrehaler; omgivet af en fedtdråbe
  const svg = el('svg', {viewBox: `0 0 ${B} ${H}`, 'aria-hidden': 'true'});
  const dråber = [0, 1, 2].map(() => el('ellipse', {class: 'm-dråbe'}, svg));
  const stor = el('ellipse', {class: 'm-dråbe'}, svg);
  const mol = [0, 1, 2].map(() => {
    const g = el('g', {}, svg);
    const gly = el('rect', {x: -2.5, y: -9, width: 5, height: 18, rx: 2, class: 'm-glycerol'}, g);
    const haler = [-6, 0, 6].map((y) => el('polyline', {
      points: Array.from({length: 7}, (_, i) => `${i * 4},${y + (i % 2 ? 1.6 : -1.6)}`).join(' '),
      class: 'm-hale'}, g));
    return {g, gly, haler};
  });
  return {
    svg,
    opdater(u) {
      const em = værdi('fedt_galde', u).v, li = værdi('fedt_lipase', u).v, op = værdi('fedt_optag', u).v;
      const afstand = 34 + em * 40;
      const x0 = (B - 40) / 2 - afstand;
      mol.forEach(({g, gly, haler}, k) => {
        const x = x0 + k * afstand;
        // kun et helt spaltet fedtmolekyle kan optages
        const fri = li >= (k * 3 + 2.5) / 9;
        const t = fri ? Math.min(1, Math.max(0, (op - k * 0.2) / 0.4)) : 0;
        g.setAttribute('transform', `translate(${x - 12},${MIDT - t * 14})`);
        g.style.opacity = 1 - t;
        haler.forEach((h, j) => {
          const løs = li >= (k * 3 + j + 0.5) / 9;
          h.setAttribute('transform', `translate(${løs ? 9 + j * 2 : 3},${løs ? (j - 1) * 2.5 : 0})`);
        });
        gly.style.opacity = 1;
      });
      // dråben: én stor, der deles i tre små, når galden emulgerer
      stor.setAttribute('cx', (B - 40) / 2); stor.setAttribute('cy', MIDT);
      stor.setAttribute('rx', 62); stor.setAttribute('ry', 14);
      stor.style.opacity = Math.max(0, 1 - em * 2) * (1 - li);
      dråber.forEach((d, k) => {
        d.setAttribute('cx', x0 + k * afstand); d.setAttribute('cy', MIDT);
        d.setAttribute('rx', 20); d.setAttribute('ry', 13);
        d.style.opacity = Math.min(1, em * 2) * (1 - li);
      });
    },
  };
}

const SUKKER = ['#F2C14E'];
const AMINO = ['#7A4FD6', '#0FA593', '#FF6A3D', '#0E86C8', '#5FB030', '#E8336D'];
const FIBRE = ['#8DA35A'];

export function skabMolekyler(rod) {
  const rækker = [
    {
      navn: 'Stivelse', mål: 'blodet',
      tegning: kæde({n: 12, form: 'sukker', farver: SUKKER, optag: 'stivelse_optag',
        brud: [[5, 'stivelse_amylase', 0, 5], [1, 'stivelse_amylase', 1, 5], [9, 'stivelse_amylase', 2, 5],
          [3, 'stivelse_amylase', 3, 5], [7, 'stivelse_amylase', 4, 5],
          ...[0, 2, 4, 6, 8, 10].map((b, r) => [b, 'stivelse_maltase', r, 6])]}),
      status(u, brudt) {
        if (værdi('stivelse_optag', u).v > 0.95) return 'glukose optaget i blodet';
        const a = værdi('stivelse_amylase', u).v, m = værdi('stivelse_maltase', u).v;
        if (m > 0.95) return 'glukose';
        if (m > 0.05) return 'maltose og glukose';
        if (a > 0.95) return 'maltose';
        if (a > 0.05) return 'stivelse og maltose';
        return 'stivelse';
      },
      enzymer: [['stivelse_amylase', 'amylase'], ['stivelse_maltase', 'maltase']],
    },
    {
      navn: 'Protein', mål: 'blodet',
      tegning: kæde({n: 12, form: 'amino', farver: AMINO, optag: 'protein_optag',
        brud: [[2, 'protein_pepsin', 0, 3, 'protein_trypsin'], [8, 'protein_pepsin', 1, 3, 'protein_trypsin'],
          [5, 'protein_pepsin', 2, 3, 'protein_trypsin'],
          [0, 'protein_trypsin', 0, 3], [6, 'protein_trypsin', 1, 3], [10, 'protein_trypsin', 2, 3],
          ...[1, 3, 4, 7, 9].map((b, r) => [b, 'protein_peptidase', r, 5])]}),
      status(u) {
        if (værdi('protein_optag', u).v > 0.95) return 'aminosyrer optaget i blodet';
        if (værdi('protein_peptidase', u).v > 0.95) return 'aminosyrer';
        if (værdi('protein_peptidase', u).v > 0.05) return 'peptider og aminosyrer';
        if (værdi('protein_pepsin', u).v > 0.05 || værdi('protein_trypsin', u).v > 0.05) return 'peptider';
        return 'protein';
      },
      enzymer: [['protein_pepsin', 'pepsin'], ['protein_trypsin', 'trypsin'], ['protein_peptidase', 'peptidaser']],
    },
    {
      navn: 'Fedt', mål: 'lymfen',
      tegning: fedt(),
      status(u) {
        const li = værdi('fedt_lipase', u).v;
        if (!forhold.galde && værdi('fedt_optag', u).v > 0.95) return 'kun en del er optaget — resten ender i afføringen';
        if (!forhold.galde && li > 0.05) return 'lipase spalter langsomt på overfladen af de store dråber';
        if (værdi('fedt_optag', u).v > 0.95) return 'optaget i lymfen';
        if (li > 0.95) return 'fedtsyrer og glycerol';
        if (li > 0.05) return 'fedt, fedtsyrer og glycerol';
        if (værdi('fedt_galde', u).v > 0.05) return 'små fedtdråber (emulgeret af galde)';
        return 'store fedtdråber';
      },
      enzymer: [['fedt_galde', 'galde'], ['fedt_lipase', 'lipase']],
    },
    {
      navn: 'Kostfibre', mål: 'afføringen',
      tegning: kæde({n: 10, form: 'sukker', farver: FIBRE, optag: 'fibre_optag',
        brud: [[2, 'fibre_bakterier', 0, 2], [5, 'fibre_bakterier', 1, 2]],
        optagKun: (i, brudt) => brudt[2] && brudt[5] && i >= 3 && i <= 5}),
      status(u) {
        if (værdi('fibre_bakterier', u).v > 0.05) return 'en del gæres af tarmbakterier — resten bliver til afføring';
        return 'kostfibre — kroppens egne enzymer kan ikke spalte dem';
      },
      enzymer: [['fibre_bakterier', 'tarmbakterier']],
    },
  ];

  rod.textContent = '';
  for (const r of rækker) {
    const div = document.createElement('div');
    div.className = 'mol';
    div.innerHTML = `<div class="mol-h"><span><b>${r.navn}</b> <span class="mol-status"></span></span><span class="mol-enzym"></span></div>`;
    div.appendChild(r.tegning.svg);
    rod.appendChild(div);
    r.div = div; r.st = div.querySelector('.mol-status'); r.enz = div.querySelector('.mol-enzym');
  }
  const vand = document.createElement('div');
  vand.className = 'mol mol-vand';
  vand.innerHTML = '<div class="mol-h"><span><b>Vand</b> <span class="mol-status" id="vand-tekst"></span></span></div><div class="vandbar"><i></i></div>';
  rod.appendChild(vand);

  return {
    opdater(u) {
      for (const r of rækker) {
        const brudt = r.tegning.opdater(u);
        r.st.textContent = '· ' + r.status(u, brudt);
        const aktive = r.enzymer.filter(([k]) => værdi(k, u).aktiv).map(([, n]) => n);
        r.enz.textContent = aktive.join(' + ');
        r.div.classList.toggle('virker', aktive.length > 0);
      }
      const v = værdi('vand', u).v;
      vand.querySelector('i').style.width = `${v * 100}%`;
      vand.querySelector('#vand-tekst').textContent = '· ' + (
        v > 0.8 ? 'tarmindholdet er tyndt og vandigt' : v > 0.5 ? 'vand optages i tyktarmen' : 'fast afføring');
    },
  };
}
