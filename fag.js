/* ─────────────────────────────────────────────────────────
   smbi.dk — fagforsider (geografi.html, biologi.html)
   Søgefelt over kortene, emneknapper over forsøgsvejledningerne
   + årstal i bunden.
   ───────────────────────────────────────────────────────── */
(function () {
  'use strict';

  var aar = document.getElementById('year');
  if (aar) aar.textContent = new Date().getFullYear();

  var felt = document.getElementById('soeg');
  var tal = document.getElementById('soeg-tal');
  var tom = document.getElementById('soeg-tom');
  var emneBoks = document.getElementById('emne-filter');
  var emneTom = document.getElementById('emne-tom');

  /* Hvert kort bærer sine søgeord i data-sog. Overskrift og brødtekst tages
     med automatisk, så nøgleordene kun skal dække det, der IKKE står på
     kortet — fx "orografisk" på stigningsregn. Forsøgsvejledningerne har
     desuden et data-emne (samme emne som i Øvelser/oversigt.html). */
  var kort = Array.prototype.map.call(
    document.querySelectorAll('[data-sog]'),
    function (el) {
      return {
        el: el,
        emne: el.getAttribute('data-emne') || '',
        tekst: (el.getAttribute('data-sog') + ' ' + el.textContent)
                 .toLowerCase().replace(/\s+/g, ' '),
        soeg: true
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
      var elementer = boks.querySelectorAll('[data-sog]');
      return {
        boks: boks,
        note: note,
        titel: note ? note.previousElementSibling : foer,
        kort: kort.filter(function (k) {
          return Array.prototype.indexOf.call(elementer, k.el) !== -1;
        })
      };
    }
  );

  var ord = [];        // søgeordene
  var valgtEmne = '';  // '' = alle emner

  function normaliser(s) {
    return s.toLowerCase().trim().replace(/\s+/g, ' ');
  }

  /* Emnet i adressen: "Krop og fysiologi" → "krop-og-fysiologi" */
  function slug(s) {
    return s.toLowerCase()
      .replace(/æ/g, 'ae').replace(/ø/g, 'oe').replace(/å/g, 'aa')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  /* ── Emneknapper ──────────────────────────────────────── */
  var emner = [];
  kort.forEach(function (k) {
    if (k.emne && emner.indexOf(k.emne) === -1) emner.push(k.emne);
  });
  emner.sort(function (a, b) { return a.localeCompare(b, 'da'); });

  var knapper = [];
  function lavKnap(emne, navn) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.setAttribute('aria-pressed', 'false');
    b.appendChild(document.createTextNode(navn));
    var antal = document.createElement('span');
    antal.className = 'antal';
    b.appendChild(antal);
    b.addEventListener('click', function () {
      // klik på det valgte emne igen = tilbage til alle
      vaelgEmne(emne === valgtEmne ? '' : emne, true);
    });
    emneBoks.appendChild(b);
    knapper.push({ el: b, emne: emne, antal: antal });
  }

  if (emneBoks && emner.length > 1) {
    lavKnap('', 'Alle');
    emner.forEach(function (e) { lavKnap(e, e); });
    emneBoks.hidden = false;
  }

  function vaelgEmne(emne, skrivAdresse) {
    valgtEmne = emne;
    vis();
    if (!skrivAdresse || !window.history.replaceState) return;
    var url = new URL(location.href);
    if (emne) url.searchParams.set('emne', slug(emne));
    else url.searchParams.delete('emne');
    history.replaceState(null, '', url);
  }

  /* ── Vis og skjul ─────────────────────────────────────── */
  function vis() {
    var synlige = 0, fundne = 0;

    kort.forEach(function (k) {
      k.soeg = ord.every(function (o) { return k.tekst.indexOf(o) !== -1; });
      // emnet gælder kun de kort, der har et
      var emneOk = !valgtEmne || !k.emne || k.emne === valgtEmne;
      k.el.hidden = !(k.soeg && emneOk);
      if (k.soeg) fundne++;
      if (!k.el.hidden) synlige++;
    });

    /* En gruppe skjules efter søgningen alene: står man i et emne uden
       træffere, skal staken — og dermed emneknapperne — blive stående,
       så man kan vælge et andet. */
    grupper.forEach(function (g) {
      var nogen = g.kort.some(function (k) { return k.soeg; });
      g.boks.hidden = !nogen;
      if (g.note) g.note.hidden = !nogen;
      if (g.titel && g.titel.classList.contains('grp')) g.titel.hidden = !nogen;
    });

    knapper.forEach(function (kn) {
      var n = kort.filter(function (k) {
        return k.emne && k.soeg && (!kn.emne || k.emne === kn.emne);
      }).length;
      kn.antal.textContent = n;
      kn.el.setAttribute('aria-pressed', String(kn.emne === valgtEmne));
      // et tomt emne kan ikke vælges — men det valgte kan altid slås fra
      kn.el.disabled = n === 0 && kn.emne !== '' && kn.emne !== valgtEmne;
    });

    if (emneTom) {
      var ingenIEmne = valgtEmne && !kort.some(function (k) {
        return k.emne === valgtEmne && !k.el.hidden;
      });
      emneTom.hidden = !ingenIEmne;
      emneTom.textContent = ingenIEmne
        ? 'Ingen vejledninger om «' + valgtEmne + '» matcher søgningen.'
        : '';
    }

    if (tom) tom.hidden = fundne !== 0;
    if (tal) {
      tal.textContent = ord.length === 0
        ? ''
        : synlige + (synlige === 1 ? ' træffer' : ' træffere');
    }
  }

  function soeg(raa) {
    var q = normaliser(raa);
    ord = q ? q.split(' ') : [];
    vis();
  }

  if (felt) {
    felt.addEventListener('input', function () { soeg(felt.value); });

    // Escape rydder feltet, så man kan komme tilbage til hele listen uden mus
    felt.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && felt.value !== '') {
        felt.value = '';
        soeg('');
        e.preventDefault();
      }
    });
  }

  /* Deling: ?soeg=grundvand åbner siden med søgningen slået til, og
     ?emne=krop-og-fysiologi med emnet valgt */
  var params = new URLSearchParams(location.search);
  var fraUrl = params.get('soeg');
  var emneFraUrl = params.get('emne');
  if (emneFraUrl && knapper.length) {
    emner.forEach(function (e) {
      if (slug(e) === slug(emneFraUrl)) valgtEmne = e;
    });
  }
  if (fraUrl && felt) {
    felt.value = fraUrl;
    soeg(fraUrl);
  } else {
    vis();
  }
})();
