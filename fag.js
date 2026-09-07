/* ─────────────────────────────────────────────────────────
   smbi.dk — fagforsider (geografi.html, biologi.html)
   Søgefelt over kortene + årstal i bunden.
   ───────────────────────────────────────────────────────── */
(function () {
  'use strict';

  var aar = document.getElementById('year');
  if (aar) aar.textContent = new Date().getFullYear();

  var felt = document.getElementById('soeg');
  if (!felt) return;

  var tal = document.getElementById('soeg-tal');
  var tom = document.getElementById('soeg-tom');

  /* Hvert kort bærer sine søgeord i data-sog. Overskrift og brødtekst tages
     med automatisk, så nøgleordene kun skal dække det, der IKKE står på
     kortet — fx "orografisk" på stigningsregn. */
  var kort = Array.prototype.map.call(
    document.querySelectorAll('[data-sog]'),
    function (el) {
      return {
        el: el,
        tekst: (el.getAttribute('data-sog') + ' ' + el.textContent)
                 .toLowerCase().replace(/\s+/g, ' ')
      };
    }
  );

  /* En gruppe (overskriftsrække + kortgitter) eller en stak skal forsvinde
     helt, når ingen af dens kort er tilbage — ellers står der tomme
     overskrifter og hænger. */
  var grupper = Array.prototype.map.call(
    document.querySelectorAll('.sims, .stack'),
    function (boks) {
      /* Overskriftsrækken til et .sims-gitter ligger lige før gitteret.
         Har gruppen en note imellem (fx "under opbygning"), hører den til
         gruppen og skal skjules sammen med den. */
      var foer = boks.classList.contains('sims') ? boks.previousElementSibling : null;
      var note = foer && foer.classList.contains('grp-note') ? foer : null;
      return {
        boks: boks,
        note: note,
        titel: note ? note.previousElementSibling : foer,
        kort: boks.querySelectorAll('[data-sog]')
      };
    }
  );

  function normaliser(s) {
    return s.toLowerCase().trim().replace(/\s+/g, ' ');
  }

  function soeg(raa) {
    var q = normaliser(raa);
    var ord = q ? q.split(' ') : [];
    var synlige = 0;

    kort.forEach(function (k) {
      var match = ord.every(function (o) { return k.tekst.indexOf(o) !== -1; });
      k.el.hidden = !match;
      if (match) synlige++;
    });

    grupper.forEach(function (g) {
      var nogen = Array.prototype.some.call(g.kort, function (el) { return !el.hidden; });
      g.boks.hidden = !nogen;
      if (g.note) g.note.hidden = !nogen;
      if (g.titel && g.titel.classList.contains('grp')) g.titel.hidden = !nogen;
    });

    if (tom) tom.hidden = synlige !== 0;
    if (tal) {
      tal.textContent = ord.length === 0
        ? ''
        : synlige + (synlige === 1 ? ' træffer' : ' træffere');
    }
  }

  felt.addEventListener('input', function () { soeg(felt.value); });

  // Escape rydder feltet, så man kan komme tilbage til hele listen uden mus
  felt.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && felt.value !== '') {
      felt.value = '';
      soeg('');
      e.preventDefault();
    }
  });

  /* Deling: ?soeg=grundvand åbner siden med søgningen slået til */
  var fraUrl = new URLSearchParams(location.search).get('soeg');
  if (fraUrl) {
    felt.value = fraUrl;
    soeg(fraUrl);
  }
})();
