/* ─────────────────────────────────────────────────────────
   smbi.dk — forside
   Fagfilter på simuleringerne (det levende diagram: forside-rig.js)
   ───────────────────────────────────────────────────────── */
(function(){
  /* ── Fagfilter på simuleringerne ── */
  const chips=[...document.querySelectorAll('.chip')];
  const blocks=[...document.querySelectorAll('[data-grp]')];
  chips.forEach(c=>c.addEventListener('click',()=>{
    chips.forEach(o=>o.setAttribute('aria-pressed',String(o===c)));
    const f=c.dataset.f;
    blocks.forEach(b=>b.classList.toggle('is-off', f!=='alle' && b.dataset.grp!==f));
  }));

  /* ── Årstal i bunden ── */
  const y=document.getElementById('year');
  if(y) y.textContent = new Date().getFullYear();
})();
