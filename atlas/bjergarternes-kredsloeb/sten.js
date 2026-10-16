// Fælles hjælp: sten fra skolens stensamling (foto eller tegning), grupper og DOM.
import { efterId } from '/geografi/stensamling/samling.js';
import { tegnSten } from '/geografi/stensamling/tegning.js';
import { BJERGARTER, GRUPPER } from './model.js';

export { efterId };

export function el(navn, tekst, klasse) {
  const e = document.createElement(navn);
  if (tekst) e.textContent = tekst;
  if (klasse) e.className = klasse;
  return e;
}

// Lille billede af en sten: samlingens foto, ellers dens tegning, ellers et felt i
// gruppens farve (løst sediment og magma har ingen sten i samlingen).
export function stenbillede(stenId, gruppe) {
  const boks = el('div', '', 'stenbillede');
  const post = stenId && efterId[stenId];
  if (post?.billeder?.length) {
    const img = document.createElement('img');
    img.src = `/geografi/stensamling/billeder/${post.billeder[0].fil}`;
    img.alt = post.billeder[0].tekst || post.navn;
    img.loading = 'lazy';
    boks.append(img);
  } else if (post) {
    boks.innerHTML = tegnSten(post);
  } else {
    boks.style.background = gruppe ? GRUPPER[gruppe].farve : '#ddd';
    boks.setAttribute('aria-hidden', 'true');
  }
  return boks;
}

export const stenlink = stenId => `/geografi/stensamling.html#sten=${efterId[stenId].kode}`;

export function gruppemaerke(gruppe) {
  const g = el('span', GRUPPER[gruppe].navn, 'gruppe');
  const felt = el('i');
  felt.style.background = GRUPPER[gruppe].farve;
  g.prepend(felt);
  return g;
}

// Kort for en bjergart i kredsløbet.
export function bjergartskort(id) {
  const b = BJERGARTER[id];
  const kort = el('div', '', 'stenkort');
  const tekst = el('div');
  tekst.append(gruppemaerke(b.gruppe), el('h3', b.navn), el('p', b.kort));
  if (b.sten) {
    const a = el('a', 'Se den i stensamlingen →');
    a.href = stenlink(b.sten);
    tekst.append(a);
  }
  kort.append(stenbillede(b.sten, b.gruppe), tekst);
  return kort;
}

export const roligBevaegelse = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
