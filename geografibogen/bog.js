// Geografibogen — fælles kode for alle kapitler.
// Opgaver med valg: hver knap har data-forklaring; den rigtige har også data-rigtig.
// Eleven kan prøve igen — intet gemmes.

for (const opgave of document.querySelectorAll('.opgave[data-valg]')) {
  const svar = opgave.querySelector('.svar');
  opgave.querySelectorAll('.valg button').forEach((knap) => {
    knap.type = 'button';
    knap.addEventListener('click', () => {
      const rigtig = knap.hasAttribute('data-rigtig');
      knap.dataset.status = rigtig ? 'rigtig' : 'forkert';
      svar.className = 'svar ' + (rigtig ? 'rigtig' : 'forkert');
      svar.textContent = (rigtig ? 'Rigtigt! ' : 'Ikke helt. ') + (knap.dataset.forklaring || '');
    });
  });
}
