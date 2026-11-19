// LIX-tjek af et kapitel i Geografibogen.
// Brug: node geografibogen/lix.mjs geografibogen/tryk-og-vind.html
// LIX = ord/punktummer + 100 · lange ord/ord  (lange ord: over 6 bogstaver).
// Tæller kun brødtekst i <main>: SVG, scripts, kildeliste og navigation springes over.
import { readFileSync } from 'node:fs';

const fil = process.argv[2];
if (!fil) { console.error('Brug: node lix.mjs <kapitel.html>'); process.exit(1); }

let html = readFileSync(fil, 'utf8');
html = html.slice(html.indexOf('<main'), html.lastIndexOf('</main>'));
html = html
  .replace(/<svg[\s\S]*?<\/svg>/g, ' ')
  .replace(/<script[\s\S]*?<\/script>/g, ' ')
  .replace(/<nav[\s\S]*?<\/nav>/g, ' ')
  .replace(/<section class="kilder"[\s\S]*?<\/section>/g, ' ')
  .replace(/<button[^>]*data-forklaring="([^"]*)"[^>]*>/g, ' $1. ')
  // Overskrifter, knapper og listepunkter er egne «sætninger»
  .replace(/<\/(h[1-6]|li|button|td|th|summary|label|p)>/g, '. ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&[a-z]+;/g, ' ')
  .replace(/\b(ca|pr|fx|bl\.a|osv|mm|km|kg)\./gi, '$1');

const ord = html.match(/[A-Za-zÆØÅæøåéü]+(?:-[A-Za-zÆØÅæøå]+)*/g) || [];
const saetninger = (html.match(/[.!?:]+(?=\s|$)/g) || []).length || 1;
const lange = ord.filter((o) => o.replace(/-/g, '').length > 6);
const lix = ord.length / saetninger + (100 * lange.length) / ord.length;

console.log(`${fil}\n  ord: ${ord.length}  sætninger: ${saetninger}  lange ord: ${lange.length}`);
console.log(`  ord pr. sætning: ${(ord.length / saetninger).toFixed(1)}  andel lange ord: ${(100 * lange.length / ord.length).toFixed(0)} %`);
console.log(`  LIX: ${lix.toFixed(0)}  (under 25 meget let · 25–34 let · 35–44 middel · 45+ svær)`);
const hyppige = Object.entries(lange.reduce((m, o) => (m[o.toLowerCase()] = (m[o.toLowerCase()] || 0) + 1, m), {}))
  .sort((a, b) => b[1] - a[1]).slice(0, 12).map(([o, n]) => `${o} ${n}`).join(', ');
console.log(`  hyppigste lange ord: ${hyppige}`);
