// Lydfeedback på luftpakken: hvilke handlinger og hvilken tilstand loggen følger.
// Kun simulationens egne knapper og skydere. Aldrig det, eleven skriver i felterne.
import { startLydfeedback } from '/feedback/lydfeedback.js';

const $ = id => document.getElementById(id);
const valgt = attribut => document.querySelector(`[${attribut}][aria-pressed="true"]`)?.getAttribute(attribut) ?? null;

function tilstand() {
  const opgaver = $('vaelg-opgaver').getAttribute('aria-pressed') === 'true';
  const profil = opgaver ? 'opgaver' : valgt('data-profil');
  return {
    profil,
    luft: profil === 'afkoeling' ? valgt('data-aluft') : valgt('data-luft'),
    hoejde_m: Number(profil === 'afkoeling' ? $('a-hoejde').value : $('hoejde').value),
  };
}

// Knappens synlige tekst er det, deltageren så; id'et gør loggen entydig.
const navn = el => [el.id || el.getAttribute('data-profil') || el.getAttribute('data-luft') || el.getAttribute('data-aluft') || el.getAttribute('data-forsoeg'), el.textContent.replace(/\s+/g, ' ').trim().slice(0, 60)].filter(Boolean).join(': ');

function haendelser(log) {
  const omraader = [document.querySelector('.laboratorium')];
  for (const rod of omraader) {
    rod.addEventListener('click', e => {
      const knap = e.target.closest('button');
      if (knap) log(`klik ${navn(knap)}`);
    });
    rod.addEventListener('change', e => {
      if (e.target.matches('select')) log(`valg ${e.target.id} = ${e.target.value}`);
      else if (e.target.matches('input[type="range"]')) log(`skyder ${e.target.id} = ${e.target.value}`);
      // Kun at feltet blev brugt, ikke indholdet.
      else if (e.target.matches('textarea, input')) log(`svarfelt udfyldt ${e.target.id || e.target.name || ''}`.trim());
    });
    rod.addEventListener('toggle', e => {
      if (e.target.matches('details')) log(`${e.target.open ? 'åbner' : 'lukker'} ${e.target.querySelector('summary')?.textContent.trim().slice(0, 60) ?? 'detaljer'}`);
    }, true);
  }
  $('fokus').addEventListener('click', () => log('klik fokus'));
}

startLydfeedback({
  simulation: 'geografi/luftmasser',
  version: document.querySelector('script[src*="simulation.js"]')?.src.split('v=')[1] ?? '',
  vaert: document.querySelector('[data-lydfeedback-vaert]') ?? document.querySelector('.titel'),
  tilstand,
  haendelser,
});
