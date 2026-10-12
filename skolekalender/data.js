// data.js — Middelfart Gymnasiums kalender for skoleåret 2026–27
//
// Skrevet af efter «Kalender_2026_2027 100826.pdf» (Excel-arket) og
// «2026-27 - Ferieplan for elever og lærere.pdf». Ret her, når skolen
// retter sin kalender, og tæl versionen op i Skolekalender_2026-27.html.
//
// Hver begivenhed:
//   d  første dag ('ÅÅÅÅ-MM-DD')
//   til  sidste dag, hvis den varer mere end én dag
//   h  hold, adskilt af mellemrum: '1g 2g 3g 1hf 2hf', 'alle' (hele skolen)
//      eller '' (andre: personale, besøgende, enkelte elever)
//   t  type — se TYPER
//   x  teksten, som den står i skolens kalender (lidt udskrevet)
//   n  evt. bemærkning

export const AAR = { fra: '2026-08-01', til: '2027-06-30', navn: '2026–27' };

export const HOLD = ['1g', '2g', '3g', '1hf', '2hf'];

// Rækkefølgen er signaturforklaringens. Tegnet står foran hver
// begivenhed, så farven aldrig er eneste signal.
export const TYPER = {
  ferie:  { navn: 'Ferie',                     tegn: '☀', farve: '#C7E6F6', kant: '#0E86C8' },
  proeve: { navn: 'Prøver, opgaver, karakterer', tegn: '✎', farve: '#FBD3E1', kant: '#E8336D' },
  valg:   { navn: 'Studievalg og vejledning',  tegn: '➜', farve: '#FFE9B8', kant: '#C98A00' },
  tur:    { navn: 'Ture og rejser',            tegn: '✈', farve: '#E2D6F8', kant: '#7A4FD6' },
  arr:    { navn: 'Arrangementer',             tegn: '★', farve: '#D6EFC4', kant: '#5FB030' },
  pers:   { navn: 'Personale',                 tegn: '●', farve: '#FFD9C9', kant: '#FF6A3D' },
  andet:  { navn: 'Andet',                     tegn: '◆', farve: '#E6EDEB', kant: '#566B68' }
};

// Forkortelserne for personalets møder i kalenderens venstre margen.
// FC er ikke forklaret og står, som den står i skolens kalender.
export const KODER = {
  M:  'Morgensamling',
  PR: 'Pædagogisk råd',
  LF: 'Lærerforsamling',
  FC: null
};

export const BEGIVENHEDER = [
  // ── Ferier (elevernes ferieplan) ──────────────────────────
  { d: '2026-08-01', til: '2026-08-09', h: 'alle', t: 'ferie', x: 'Sommerferie' },
  { d: '2026-10-10', til: '2026-10-18', h: 'alle', t: 'ferie', x: 'Efterårsferie' },
  { d: '2026-12-19', til: '2027-01-03', h: 'alle', t: 'ferie', x: 'Juleferie' },
  { d: '2027-02-13', til: '2027-02-21', h: 'alle', t: 'ferie', x: 'Vinterferie' },
  { d: '2027-03-20', til: '2027-03-29', h: 'alle', t: 'ferie', x: 'Påskeferie' },
  { d: '2027-05-06', til: '2027-05-09', h: 'alle', t: 'ferie', x: 'Kr. himmelfartsferie' },
  { d: '2027-05-15', til: '2027-05-17', h: 'alle', t: 'ferie', x: 'Pinseferie' },
  { d: '2027-06-26', til: '2027-06-30', h: 'alle', t: 'ferie', x: 'Sommerferie', n: 'Til og med 9. august 2027' },

  // ── August 2026 ───────────────────────────────────────────
  { d: '2026-08-04', til: '2026-08-07', h: '', t: 'pers', x: 'Møder og fælles forberedelse' },
  { d: '2026-08-10', h: '1g 1hf', t: 'arr', x: '1. skoledag' },
  { d: '2026-08-11', h: '2g 3g 2hf', t: 'arr', x: '1. skoledag' },
  { d: '2026-08-11', h: '1g 1hf', t: 'arr', x: 'IT-intro' },
  { d: '2026-08-12', h: '1g 1hf', t: 'arr', x: 'Foto' },
  { d: '2026-08-13', h: '1hf', t: 'valg', x: 'Valg af fag' },
  { d: '2026-08-13', h: '2hf', t: 'tur', x: '«Pølsetur»' },
  { d: '2026-08-14', h: '', t: 'pers', x: 'Udflugt for personalet' },
  { d: '2026-08-14', h: '', t: 'pers', x: 'M', kode: 'M' },
  { d: '2026-08-17', til: '2026-08-19', h: '1g', t: 'arr', x: 'Klatre-Lars' },
  { d: '2026-08-19', h: '1hf', t: 'arr', x: 'Klatre-Lars' },
  { d: '2026-08-20', h: '', t: 'andet', x: 'Afslutningsseminar for Nat B', n: 'Fritagelse for skriftligt karakterer' },
  { d: '2026-08-21', h: '1g', t: 'valg', x: 'SR-præsentation' },
  { d: '2026-08-21', h: '', t: 'pers', x: 'FC', kode: 'FC' },
  { d: '2026-08-24', h: '1g', t: 'valg', x: 'Præsentation af kunstneriske fag' },
  { d: '2026-08-25', h: '1g', t: 'arr', x: 'Klatre-Lars' },
  { d: '2026-08-25', h: '1g 1hf', t: 'arr', x: 'Forældremøde' },
  { d: '2026-08-27', til: '2026-08-28', h: 'alle', t: 'arr', x: 'Klimafolkemøde' },

  // ── September 2026 ────────────────────────────────────────
  { d: '2026-09-02', h: '1g', t: 'proeve', x: 'SR-afprøvning' },
  { d: '2026-09-04', h: 'alle', t: 'arr', x: 'Aktivitetsdag' },
  { d: '2026-09-04', h: 'alle', t: 'arr', x: 'Fest', n: 'FUN — elevernes festudvalg' },
  { d: '2026-09-07', h: '1g', t: 'valg', x: 'Kontaktgruppesamtaler' },
  { d: '2026-09-07', h: '1hf', t: 'valg', x: 'Studievalg' },
  { d: '2026-09-09', h: '', t: 'pers', x: 'Fremmedsprogsnetværk' },
  { d: '2026-09-10', h: 'alle', t: 'arr', x: 'Klubbasar' },
  { d: '2026-09-14', h: '1g', t: 'proeve', x: 'Mat-screening' },
  { d: '2026-09-14', til: '2026-09-18', h: '2hf', t: 'tur', x: 'Studietur' },
  { d: '2026-09-14', til: '2026-09-16', h: '', t: 'andet', x: 'Brobygning 9. klasse' },
  { d: '2026-09-15', h: '', t: 'pers', x: 'M', kode: 'M' },
  { d: '2026-09-16', h: '1g', t: 'valg', x: 'Studievalg / SR-afprøvning' },
  { d: '2026-09-16', h: '', t: 'pers', x: 'PR', kode: 'PR' },
  { d: '2026-09-17', h: '1g', t: 'valg', x: 'Studievalg' },
  { d: '2026-09-21', til: '2026-09-25', h: '2g', t: 'tur', x: 'Studietur', n: 'Alle 2g-klasser undtagen 2c' },
  { d: '2026-09-28', h: '1g', t: 'valg', x: 'Evalueringssamtaler' },
  { d: '2026-09-29', h: '1g', t: 'valg', x: 'Sprog?', n: 'Med spørgsmålstegn i skolens kalender' },

  // ── Oktober 2026 ──────────────────────────────────────────
  { d: '2026-10-01', h: '1g', t: 'valg', x: 'SR-valg' },
  { d: '2026-10-02', h: 'alle', t: 'arr', x: 'OD-fællesarrangement' },
  { d: '2026-10-04', h: '1hf', t: 'proeve', x: '1. standpunkt: idræt, musik, mediefag' },
  { d: '2026-10-04', til: '2026-10-11', h: '', t: 'tur', x: 'Sprogrejse Frankrig' },
  { d: '2026-10-06', h: '2hf', t: 'valg', x: 'Studievalg' },
  { d: '2026-10-07', h: '', t: 'pers', x: 'M', kode: 'M' },
  { d: '2026-10-07', til: '2026-10-21', h: '', t: 'tur', x: 'Sprogrejse Spanien' },
  { d: '2026-10-21', til: '2026-10-23', h: '3g', t: 'valg', x: 'Studiepraktik' },
  { d: '2026-10-21', h: '', t: 'pers', x: 'Fremmedsprogsnetværk' },
  { d: '2026-10-23', h: '1g', t: 'proeve', x: 'AP-prøve' },
  { d: '2026-10-28', til: '2026-10-29', h: '1g', t: 'proeve', x: 'NV-prøver' },
  { d: '2026-10-30', h: '1g', t: 'andet', x: 'Grundforløbet slutter' },
  { d: '2026-10-30', h: '', t: 'pers', x: 'Kursusdag HF-projekt' },

  // ── November 2026 ─────────────────────────────────────────
  { d: '2026-11-02', h: '1g', t: 'andet', x: 'SR-start' },
  { d: '2026-11-02', til: '2026-11-20', h: '', t: 'andet', x: 'Brobygning 10. klasse', n: 'Uge 45–47, evt. også Vesterdal Efterskole' },
  { d: '2026-11-04', h: '3g', t: 'valg', x: 'Karrieretanken' },
  { d: '2026-11-04', til: '2026-11-05', h: '2hf', t: 'proeve', x: 'POP3' },
  { d: '2026-11-06', h: '', t: 'pers', x: 'FC', kode: 'FC' },
  { d: '2026-11-08', h: '2g 3g 1hf 2hf', t: 'proeve', x: '1. standpunkt' },
  { d: '2026-11-09', til: '2026-11-13', h: '1g', t: 'tur', x: 'Hyttetur', n: 'Klasserne skiftes i løbet af perioden' },
  { d: '2026-11-10', h: '2g', t: 'valg', x: 'Studievalg' },
  { d: '2026-11-11', til: '2026-11-12', h: '3g', t: 'valg', x: 'Studievalg' },
  { d: '2026-11-16', til: '2026-11-18', h: '1g', t: 'tur', x: 'Hyttetur', n: 'Klasserne skiftes i løbet af perioden' },
  { d: '2026-11-16', til: '2026-11-17', h: '3g', t: 'proeve', x: 'FF3' },
  { d: '2026-11-18', h: '2g 3g 1hf 2hf', t: 'arr', x: 'OD-dag' },
  { d: '2026-11-18', h: '', t: 'pers', x: 'Planlægningsmøder' },
  { d: '2026-11-18', h: '', t: 'pers', x: 'PR', kode: 'PR' },
  { d: '2026-11-19', h: '3g', t: 'proeve', x: 'FF3' },
  { d: '2026-11-20', h: '1hf', t: 'proeve', x: 'Historieopgave' },
  { d: '2026-11-23', til: '2026-11-24', h: '1hf', t: 'proeve', x: 'Historieopgave' },
  { d: '2026-11-24', h: '', t: 'andet', x: 'Georg Mohr, 1. runde' },
  { d: '2026-11-25', h: '3g', t: 'valg', x: 'SDU Takeover' },
  { d: '2026-11-25', h: '', t: 'pers', x: 'Personalet besøger SOSU', n: 'Kl. 12.30–15' },
  { d: '2026-11-27', h: '', t: 'pers', x: 'Kursusdag HF-projekt' },

  // ── December 2026 ─────────────────────────────────────────
  { d: '2026-12-01', h: '1g 2g 1hf 2hf', t: 'arr', x: 'Juleklip' },
  { d: '2026-12-01', h: '3g', t: 'proeve', x: 'FF3-aflevering' },
  { d: '2026-12-02', h: '1g 1hf', t: 'arr', x: 'Lommefilm' },
  { d: '2026-12-04', h: '3g', t: 'proeve', x: 'FF3-fremlæggelse' },
  { d: '2026-12-04', h: 'alle', t: 'arr', x: 'Fest', n: 'FUN — elevernes festudvalg' },
  { d: '2026-12-10', h: '2g', t: 'tur', x: 'Tyskhold til Flensburg', n: 'Alle 2g-tyskhold' },
  { d: '2026-12-11', h: '', t: 'pers', x: 'M', kode: 'M' },
  { d: '2026-12-14', h: '1hf', t: 'proeve', x: 'Eksamensforberedelse' },
  { d: '2026-12-15', til: '2026-12-17', h: '1hf 2hf', t: 'proeve', x: 'Eksamen' },
  { d: '2026-12-17', h: '1g', t: 'valg', x: 'Valgfagsorientering' },

  // ── Januar 2027 ───────────────────────────────────────────
  { d: '2027-01-05', h: '1hf', t: 'valg', x: 'Studievalg' },
  { d: '2027-01-05', til: '2027-01-06', h: '2hf', t: 'proeve', x: 'Eksamen' },
  { d: '2027-01-07', h: '3g', t: 'valg', x: 'SRP-basar' },
  { d: '2027-01-08', h: '2hf', t: 'valg', x: 'SSO-basar' },
  { d: '2027-01-10', h: '1hf', t: 'proeve', x: 'Kompetenceafdækning' },
  { d: '2027-01-11', h: '1hf', t: 'proeve', x: 'POP2' },
  { d: '2027-01-12', h: '3g', t: 'valg', x: 'Udkast til SRP-problemformulering / SRP-valg' },
  { d: '2027-01-12', h: '', t: 'pers', x: 'LF', kode: 'LF' },
  { d: '2027-01-12', h: '', t: 'andet', x: 'Georg Mohr, 2. runde' },
  { d: '2027-01-15', h: '1g 2g', t: 'valg', x: 'Valg af valgfag' },
  { d: '2027-01-15', h: '1hf', t: 'valg', x: 'Valgfag / fagpakke' },
  { d: '2027-01-15', h: '', t: 'pers', x: 'Kursusdag HF-projekt' },
  { d: '2027-01-21', h: '2hf', t: 'valg', x: 'SSO-valg' },
  { d: '2027-01-22', h: '', t: 'pers', x: 'FC', kode: 'FC' },
  { d: '2027-01-23', h: '', t: 'andet', x: 'Infomøde', n: 'Kl. 10–12' },
  { d: '2027-01-26', til: '2027-01-30', h: '3g', t: 'tur', x: 'København og Bruxelles', n: '3a til Bruxelles' },
  { d: '2027-01-31', h: '2g 3g', t: 'proeve', x: 'Karaktergivning / formativ evaluering', n: 'Fortsætterhold: formativ evaluering. Afslutterhold: karakterer' },
  { d: '2027-01-31', h: '1hf 2hf', t: 'proeve', x: '2. standpunkt' },

  // ── Februar 2027 ──────────────────────────────────────────
  { d: '2027-02-01', til: '2027-02-12', h: '2g', t: 'tur', x: 'Studieture for 2c', n: 'Island og Ghana' },
  { d: '2027-02-01', h: '3g', t: 'valg', x: 'Studievalg' },
  { d: '2027-02-03', h: '3g', t: 'valg', x: 'Studievalg' },
  { d: '2027-02-04', h: '2hf', t: 'valg', x: 'Studievalg' },
  { d: '2027-02-25', h: '1hf', t: 'proeve', x: 'Terminsprøver' },
  { d: '2027-02-26', h: '2g 3g 2hf', t: 'proeve', x: 'Terminsprøver' },
  { d: '2027-02-26', h: 'alle', t: 'arr', x: 'Fest', n: 'FUN — elevernes festudvalg' },
  { d: '2027-02-28', h: '1g', t: 'proeve', x: '1. standpunkt' },
  { d: '2027-02-28', h: '1hf', t: 'proeve', x: '2. standpunkt' },

  // ── Marts 2027 ────────────────────────────────────────────
  { d: '2027-03-01', til: '2027-03-12', h: '3g', t: 'proeve', x: 'SRP-skriveperiode' },
  { d: '2027-03-03', til: '2027-03-10', h: '2hf', t: 'proeve', x: 'SSO-skriveperiode' },
  { d: '2027-03-05', h: '1hf', t: 'proeve', x: 'NF-evalueringsopgave' },
  { d: '2027-03-08', h: '1hf', t: 'proeve', x: 'Aflevering af NF-opgave' },
  { d: '2027-03-15', h: '2hf', t: 'proeve', x: 'POP4' },
  { d: '2027-03-16', h: '1hf', t: 'proeve', x: 'NF intern prøve' },
  { d: '2027-03-18', h: '2g', t: 'proeve', x: 'SRO-præsentation' },
  { d: '2027-03-31', h: '2g', t: 'valg', x: 'SRO-valg' },
  { d: '2027-03-31', h: '1hf', t: 'tur', x: 'Københavnstur' },
  { d: '2027-03-31', h: '2hf', t: 'proeve', x: 'POP4' },

  // ── April 2027 ────────────────────────────────────────────
  { d: '2027-04-01', h: '2hf', t: 'proeve', x: 'POP4' },
  { d: '2027-04-02', h: '1hf', t: 'tur', x: 'Københavnstur' },
  { d: '2027-04-05', h: '2hf', t: 'arr', x: 'Fagpakkegalla' },
  { d: '2027-04-05', til: '2027-04-23', h: '', t: 'andet', x: 'Introkurser 8. klasse', n: 'Uge 14–16' },
  { d: '2027-04-09', h: '2g', t: 'proeve', x: 'SRO' },
  { d: '2027-04-12', h: '2g', t: 'proeve', x: 'SRO' },
  { d: '2027-04-14', h: '', t: 'pers', x: 'Fremmedsprogsnetværk' },
  { d: '2027-04-15', h: '2g 1hf', t: 'valg', x: 'Studieinfo' },
  { d: '2027-04-16', h: '1g', t: 'proeve', x: 'DHO-problemformulering' },
  { d: '2027-04-23', h: '2g', t: 'proeve', x: 'SRO-skrivedage' },
  { d: '2027-04-24', h: '3g 2hf', t: 'arr', x: 'Galla' },
  { d: '2027-04-30', h: '1g', t: 'proeve', x: 'DHO' },

  // ── Maj 2027 ──────────────────────────────────────────────
  { d: '2027-05-05', h: '1g', t: 'proeve', x: 'DHO' },
  { d: '2027-05-13', h: '3g', t: 'proeve', x: '1. offentliggørelse af eksamensplan' },
  { d: '2027-05-14', h: '1g', t: 'proeve', x: 'DHO-fremlæggelse' },
  { d: '2027-05-19', h: '1g', t: 'proeve', x: 'DHO-fremlæggelse' },
  { d: '2027-05-20', h: '3g', t: 'proeve', x: '2. offentliggørelse af eksamensplan' },
  { d: '2027-05-21', h: '2hf', t: 'proeve', x: 'Dansk A, skriftlig' },
  { d: '2027-05-24', h: '3g', t: 'proeve', x: 'Dansk A' },
  { d: '2027-05-25', h: '2hf', t: 'proeve', x: 'Engelsk B' },
  { d: '2027-05-26', h: '1hf', t: 'proeve', x: 'Matematik C' },
  { d: '2027-05-26', h: '2hf', t: 'proeve', x: 'Matematik B' },

  // ── Juni 2027 ─────────────────────────────────────────────
  { d: '2027-06-12', h: '', t: 'arr', x: 'Jubilararrangement' },
  { d: '2027-06-23', h: 'alle', t: 'proeve', x: 'Sidste eksamensdag' },
  { d: '2027-06-24', h: '', t: 'pers', x: 'Møder' },
  { d: '2027-06-25', h: '3g 2hf', t: 'arr', x: 'Dimission' }
];

// Det, der står under hver måned uden en bestemt dag.
export const MAANEDSNOTER = {
  '2026-08': ['Undervisningsevaluering: 2g-, 2hf- og 3g-hold fra sidste år'],
  '2026-10': ['Ung til ung', 'Uge 44: 3a på endagsekskursion til København'],
  '2026-11': ['Ung til ung', 'Evaluering af 2g-, 3g- og 2hf-afslutterhold'],
  '2027-02': ['Evaluering af 1g- og 1hf-afslutterhold'],
  '2027-03': ['Evaluering af 1g-, 1hf- og 2g-afslutterhold']
};
