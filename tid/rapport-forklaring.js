// Konkrete forklaringer af rapportens eksisterende regning. Alle tal kommer
// fra samme aggregering, akkord og belastning som resten af rapporten.
import { esc, fmtMins } from './format.js';
import { datoInput, addDays } from './periode.js';
import { getSettings, FULD_AARSNORM, andetFor } from './indstillinger.js';
import { ferieFor, elevferieFor } from './ferie.js';
import { PERIODER, periodeFor, graenser } from './aktivitetsperiode.js';
import { faktorerFor, harNormgrundlag } from './normer.js';
import { OPTJENING, optjeningFor, optjenesNaesteAar } from './akkord.js';
import { REST } from './belastning.js';

const tal = v => Number(v).toLocaleString('da-DK', { maximumFractionDigits: 2 });
export const fortegn = m => Math.round(m) === 0 ? '± 0m' : `${m > 0 ? '+' : '−'}${fmtMins(Math.abs(m))}`;
const tidsrum = (fra, til) => `${datoInput(fra)} – ${datoInput(addDays(til, -1))}`;
const liste = rows => `<dl class="rapport-regnestykke">${rows.map(([navn, vaerdi]) => `<div><dt>${esc(navn)}</dt><dd>${esc(vaerdi)}</dd></div>`).join('')}</dl>`;
const fold = (id, titel, vaerdi, kort, indhold) => `<details class="rapport-hovedtal" data-hovedtal="${id}"><summary><span class="rapport-hovedtal-navn">${titel}</span>${vaerdi}<span class="rapport-hovedtal-kort">${kort}</span><span class="rapport-hovedtal-aabn">Vis beregning</span></summary><div class="rapport-forklaring">${indhold}</div></details>`;

export function registreretForklaring({ rows, uboundMins, pauseMins, archivedMins, totalMins, year }, fra, til, skoleaar) {
  return fold('registreret', 'Registreret tid', `<span class="rapport-total">${fmtMins(totalMins)}</span>`, 'Hvor meget har jeg arbejdet? · Gemte varigheder, inkl. pauser',
    `<p class="rapport-total-sub">${skoleaar ? 'Skoleår ' + esc(year) : 'Valgt periode'} · ${tidsrum(fra, til)}</p>` +
    liste([['Aktive aktiviteter', fmtMins(rows.reduce((s, r) => s + r.totalMins, 0))], ['Afsluttede aktiviteter', fmtMins(archivedMins)], ['Ubundet tid', fmtMins(uboundMins)], ['Korte pauser (fælles tid)', fmtMins(pauseMins)], ['Registreret i alt', fmtMins(totalMins)]]) +
    '<p>Summen af de gemte varigheder med start i perioden. Aktive timere tæller først med, når de er stoppet. Overlap tælles dobbelt; gemte fremtidige registreringer tæller med. En post over midnat hører til startdatoen. Planlagte Lectio-aftaler tæller aldrig med.</p><p>Opgaver og hold følger deres skoleår. Afsluttede aktiviteter er med i skoleårsrapporten; i dag, uge og måned vises de aktive aktiviteter.</p>');
}

export function belastningForklaring(totalMins, forv, bel, acts, { aar, start, slut }, chip) {
  const nu = new Date(), ved = nu < start ? start : nu > slut ? slut : nu;
  const dele = [...bel.dele(nu)].map(([id, minutter]) => [id === REST ? 'Norm uden opgavebudget' : acts.find(a => a.id === id)?.name || id, fmtMins(minutter)]);
  return fold('belastning', 'Afvigelse fra forventet belastning', `<span class="rapport-hovedtal-tal">${fortegn(totalMins - forv)}</span>`,
    'Har jeg arbejdet mere eller mindre end forventet på dette tidspunkt?<small>Plus = mere end forventet · minus = mindre</small>',
    `<p>Normperiode ${tidsrum(start, slut)}. Belastning beregnet ved ${ved.toLocaleString('da-DK')}. Registreret tid fra hele den valgte normperiode.</p>` +
    liste([['Registreret tid', fmtMins(totalMins)], ['Forventet belastning', fmtMins(forv)], ['Registreret − forventet', fortegn(totalMins - forv)]]) +
    '<p>Plus betyder mere registreret end forventet (merarbejde i modellen). Minus betyder mindre registreret end forventet (overskud i modellen). Nul betyder samme tid. Det afgør ikke i sig selv, om opgaverne er leveret.</p>' +
    `<div class="bel-mod">Mod belastningen ${chip}</div>` +
    '<p>Belastningen følger opgavernes perioder og budgetter. Hold og løbende opgaver fordeles over arbejdsdage uden lærerferie, elevferie og helligdage. Engangsopgaver bidrager med det optjente, højst budgettet.</p>' +
    `<p>Faktor på de løbende budgetter: ${tal(bel.faktor)}. Resten af normen fordeles efter budget, mindst faktor 1. Uden løbende budgetter fordeles resten over årets belastningsdage.</p>` +
    liste([...dele, ['Forventet i alt', fmtMins(forv)]]) + '<p>Minuttal vises afrundet; totalen beregnes før afrunding.</p>' +
    '<p>Akkordsaldoen nedenfor sammenligner derimod optjent med brugt tid. De to tal har hver sin betydning og hvert sit fortegn.</p>');
}

export function akkordForklaring(ak, { aar, start, slut }) {
  const enheder = Object.values(ak.enheder).filter(u => u.budget != null);
  return fold('akkord', 'Akkordsaldo', `<span class="akkord-saldo-tal ${ak.saldo >= 0 ? 'is-pos' : 'is-neg'}">${fortegn(ak.saldo)}</span>`,
    'Har opgaverne taget mere eller mindre tid, end jeg har optjent?<small>Plus = optjent mere end brugt · minus = brugt mere</small>',
    `<p>Skoleår ${esc(aar)} · ${tidsrum(start, slut)}.</p>` +
    liste([['Optjent på opgaver og hold', fmtMins(ak.optjent)], ['Brugt (inkl. fælles tid og pauser)', fmtMins(ak.brugt)], ['Optjent − brugt', fortegn(ak.saldo)]]) +
    `<p class="akkord-saldo-sub">Saldo · optjent − brugt · ${ak.saldo >= 0 ? 'optjent mere end brugt' : 'brugt mere end optjent'}</p>` +
    '<p>Plus: opgaverne har taget mindre tid end optjent. Minus: opgaverne har taget mere tid end optjent. Nul: optjent og brugt er ens. Afvigelsen fra belastningen ovenfor sammenligner i stedet med det forventede arbejde på dette tidspunkt.</p>' +
    '<p>Hold optjener fra registreret undervisning og rettede sæt efter deres normgrundlag. Hold uden normgrundlag og løbende opgaver optjener over deres periode. Ved afslutning optjenes brugt tid op til budgettet og resten ved afslutning; manuel optjening følger procenten. Afsluttede aktiviteter har optjent hele budgettet. Opgaver til næste normperiode og overførte opgaver følger deres optjeningsår.</p>' +
    `<div class="rapport-tabel-rul" tabindex="0" role="region" aria-label="Optjening pr. aktivitet"><table class="rapport-beregning"><thead><tr><th>Aktivitet</th><th>Budget</th><th>Optjent</th><th>Brugt på akkorden</th><th>Fælles</th></tr></thead><tbody>${enheder.map(u => `<tr><th scope="row">${esc(u.act.name)}${u.overfoert ? ' (fra sidste år)' : ''}</th><td>${fmtMins(u.budget)}</td><td>${fmtMins(u.optjent)}</td><td>${fmtMins(u.brugt)}</td><td>${fmtMins(u.faelles)}</td></tr>`).join('')}</tbody></table></div>` +
    '<p>Underopgaver med eget budget står særskilt og er trukket fra forælderens budget. Underopgaver uden eget budget indgår i forælderens brugte tid. Minuttal vises afrundet; totalen beregnes før afrunding.</p>' +
    enheder.filter(u => u.hold).map(u => {
      const h = u.hold;
      return `<details><summary>${esc(u.act.name)} · holdets optjening</summary>` + liste([
        ['Undervisningsnorm', fmtMins(h.undervisning.norm)], ['Registreret undervisning, højst normen', fmtMins(h.undervisning.optjent)],
        ['Undervist andel', tal(h.undervisning.norm ? h.undervisning.optjent / h.undervisning.norm * 100 : 0) + ' %'],
        ['Forberedelsesnorm', fmtMins(h.forberedelse.norm)], ['Optjent forberedelse: undervist andel × norm', fmtMins(h.forberedelse.optjent)],
        ['Rettede elevtimer pr. elev / årets norm', tal(h.rettet) + ' / ' + tal(h.rettetNorm)],
        ['Rettenorm', fmtMins(h.retning.norm)], ['Optjent retning: rettet andel × norm, højst normen', fmtMins(h.retning.optjent)],
        ['Optjent på holdet i alt', fmtMins(u.optjent)]]) + '</details>';
    }).join('') +
    liste([['Ubundet tid', fmtMins(ak.faelles.ubundet)], ['Pauser', fmtMins(ak.faelles.pauser)], ['Aktiviteter uden budget', fmtMins(ak.faelles.udenBudget)], ['Fælles tid i alt', fmtMins(ak.faelles.total)]]) +
    `<p>Fælles tid ${ak.fordelt ? 'fordeles efter budget på aktiviteter, der deltager' : 'står særskilt og trækkes fra den samlede saldo'}. Fordeling ændrer placeringen, men hverken samlet brugt tid eller samlet akkordsaldo.</p>`);
}

export function rapportIndstillinger(acts, { aar, start, slut }, norm, andet) {
  const s = getSettings(), f = faktorerFor(aar);
  const ferie = (r, navn) => `<p>${navn}: ${r.length ? r.map(p => `${esc(p.fra)} – ${esc(p.til)}`).join('; ') : 'ingen'}.</p>`;
  return `<details class="rapport-indstillinger" data-hovedtal="indstillinger"><summary>Perioder og anvendte indstillinger</summary><div class="rapport-forklaring"><p>Skoleår ${esc(aar)} · normperiode ${tidsrum(start, slut)}. Datoerne nedenfor er de effektive værdier, også når skolens standarder bruges.</p>` +
    liste([['Årsnorm', tal(norm) + ' t'], ['Ansættelsesgrad udledt af årsnorm / 1690', tal(norm / FULD_AARSNORM * 100) + ' %'], ...andetFor(aar).map(p => [p.navn, tal(p.timer) + ' t']), ['Andet i porteføljen i alt', tal(andet) + ' t'], ['Norm, der skal registreres: årsnorm − andet', tal(norm - andet) + ' t'], ['Forberedelsesfaktor', tal(f.faktor)], ['Reduktion (ældre hold i timer)', tal(f.reduktion)], ['Fordeling af fælles tid', s.fordelFaellesTid === false ? 'Fra' : 'Til']]) +
    Object.entries(PERIODER).map(([id, navn]) => { const [fra, til] = graenser(id, aar, start, slut); return `<p>${navn}: ${til > fra ? tidsrum(fra, til) : 'uden for normperioden'}.</p>`; }).join('') +
    ferie(ferieFor(aar), 'Lærerferie (begge datoer med)') + ferie(elevferieFor(aar), 'Elevferie (begge datoer med)') +
    '<p>Weekender og danske helligdage udelades. Normen fordeles over lærerens arbejdsdage; belastning udelader også elevferie. Optjening for løbende aktiviteter følger deres arbejdsdage med lærerferie.</p>' +
    liste(acts.filter(a => a.schoolYear === aar).map(a => [a.name, `${PERIODER[periodeFor(a, acts)]} · ${a.type === 'hold' ? harNormgrundlag(a) ? 'Holdnormer' : 'Løbende' : OPTJENING[optjeningFor(a)]}${a.udenFaellesTid ? ' · uden fælles tid' : ''}${a.optjening === 'manuel' ? ' ' + tal(a.fremdrift || 0) + ' %' : ''}${a.isArchived ? ' · afsluttet' : ''}${optjenesNaesteAar(a, acts) ? ' · optjenes næste år' : ''}`])) +
    '<p>Budgetter, holdnormer, rettede sæt, optjeningsmåde, fremdrift og afslutning kommer fra aktiviteterne. De konkrete optjente beløb står i akkordsaldoens beregning og i aktivitetsrækkerne nedenfor.</p></div></details>';
}
