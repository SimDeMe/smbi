// Celletyperne: de tre celler side om side — hvilke er eukaryote, hvilken er prokaryot?
import { klat, mitokondrie, kloroplast, ribosomer } from '../../byg-motor/tegn.js';

const kortet = (x, y, w, h, navn) => `
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="18" fill="#FFFFFF" stroke="#17211F" stroke-width="2.5"/>
  <text x="${x + w / 2}" y="${y + h - 22}" text-anchor="middle" class="fig-navn">${navn}</text>`;

// Lille bakterie (tegnet forstørret meget mere end de to andre)
const bakterie = `
  <path d="M110 240 H190 A40 40 0 0 1 190 320 H110 A40 40 0 0 1 110 240Z" fill="#C79A5E" stroke="#7A5524" stroke-width="2"/>
  <path d="M112 250 H188 A30 30 0 0 1 188 310 H112 A30 30 0 0 1 112 250Z" fill="#EAF1FF" stroke="#E8336D" stroke-width="2.4"/>
  <path d="M130 280 c10 -18 26 14 38 -4 s18 18 4 18 s-30 -2 -42 -14Z" fill="none" stroke="#7A4FD6" stroke-width="3"/>
  ${ribosomer([[122, 266], [205, 270], [196, 296], [140, 300]], 3)}
  <path d="M230 280 q14 -12 26 0 t26 0" fill="none" stroke="#8A6A2A" stroke-width="3" stroke-linecap="round"/>`;

const dyrecelle = `
  <path d="${klat(500, 270, 112, 96)}" fill="#FFE6D2" stroke="#E8336D" stroke-width="5"/>
  <ellipse cx="482" cy="262" rx="40" ry="32" fill="#D4C2F5" stroke="#5B33B5" stroke-width="3"/>
  ${mitokondrie(560, 220, 30, 44, 22)}${mitokondrie(548, 324, -20, 44, 22)}
  <circle cx="430" cy="320" r="9" fill="#C39BE6" stroke="#6E3DAF" stroke-width="2"/>`;

const plantecelle = `
  <rect x="726" y="166" width="208" height="212" rx="18" fill="#A9C46A" stroke="#5E7F22" stroke-width="2.4"/>
  <rect x="738" y="178" width="184" height="188" rx="12" fill="#F1F6D8" stroke="#E8336D" stroke-width="3"/>
  <ellipse cx="836" cy="276" rx="66" ry="62" fill="#D3EBF8" stroke="#4E9CCB" stroke-width="2.4"/>
  <ellipse cx="764" cy="206" rx="20" ry="17" fill="#D4C2F5" stroke="#5B33B5" stroke-width="2.4"/>
  ${kloroplast(830, 196, 0, 40, 18)}${kloroplast(904, 280, 90, 40, 18)}${kloroplast(810, 350, 0, 40, 18)}${kloroplast(754, 290, 90, 40, 18)}`;

export default {
  id: 'typer',
  navn: 'Celletyperne',
  intro: 'De tre celler fra fanerne side om side. Den store forskel er kernen: har cellen en kerne og organeller med membran, eller ej?',
  vb: [1000, 540],
  lag: [
    { navn: 'To slags celler', ord: ['eukaryot', 'prokaryot'], ekstra: ['virus'],
      ekstraFejl: { virus: 'En virus er ikke en celle. Den har ingen cellemembran, ingen ribosomer og intet stofskifte, og den kan kun formere sig inde i en celle.' } },
  ],
  dele: [
    { ord: 'eukaryot', svg: `<rect x="366" y="96" width="608" height="404" rx="26" fill="#FDEAF1" stroke="#E8336D" stroke-width="3" stroke-dasharray="12 8"/>` },
    { ord: 'prokaryot', svg: kortet(36, 120, 280, 360, 'Bakterie') + bakterie },
    { ord: 'eukaryot', svg: kortet(390, 120, 266, 360, 'Dyrecelle') + dyrecelle + kortet(704, 120, 248, 360, 'Plantecelle') + plantecelle },
  ],
  pladser: [
    { ord: 'prokaryot', x: 176, y: 120, maal: null, titel: true,
      omr: `<rect x="30" y="114" width="292" height="372" rx="22"/>`,
      fejl: { eukaryot: 'Eukaryote celler har en cellekerne. Kig efter en kerne i bakterien: DNA’et ligger frit.' } },
    { ord: 'eukaryot', x: 670, y: 96, maal: null, titel: true,
      omr: `<rect x="360" y="90" width="620" height="416" rx="30"/>`,
      fejl: { prokaryot: 'Prokaryote celler har ingen kerne. Både dyrecellen og plantecellen har en lilla cellekerne.' } },
  ],
};
