// ─── Ark (bundark med baggrund) ───────────────────────────
// Arket og dets baggrund vises først, og .open sættes i næste billede, så
// CSS-overgangen kører. Ved lukning ventes til overgangen er færdig.

const OVERGANG_MS = 280;

export function openSheet(id, bdId) {
  const ark = document.getElementById(id), bd = document.getElementById(bdId);
  ark.classList.remove('hidden');
  bd.classList.remove('hidden');
  requestAnimationFrame(() => {
    ark.classList.add('open');
    bd.classList.add('open');
  });
}

export function closeSheet(id, bdId) {
  const ark = document.getElementById(id), bd = document.getElementById(bdId);
  ark.classList.remove('open');
  bd.classList.remove('open');
  setTimeout(() => {
    ark.classList.add('hidden');
    bd.classList.add('hidden');
  }, OVERGANG_MS);
}
