import {pensel} from './stroempile.js';
export const ORDEN = 60;
export const valg = {navne:true};
export const hent = async () => {};
// Generaliserede hovedretninger; ingen hastigheder, dybder eller præcise fronter.
export const STROEMME = [
 ['Golfstrømmen','varm',[[-80,26],[-77,33],[-65,40],[-48,44]]],
 ['Nordatlantisk strøm','varm',[[-48,44],[-30,50],[-15,56],[-7,62]]],
 ['Norske strøm','varm',[[-7,62],[3,66],[12,70]]],
 ['Labradorstrømmen','kold',[[-54,60],[-57,53],[-50,45]]],
 ['Østgrønlandske strøm','kold',[[-15,77],[-19,70],[-31,63],[-42,59]]],
 ['Kanariske strøm','kold',[[-14,35],[-20,26],[-26,17]]],
 ['Nordlige ækvatorialstrøm','varm',[[-25,14],[-45,14],[-60,16]]],
 ['Brasilianske strøm','varm',[[-35,-8],[-39,-18],[-45,-30]]],
 ['Benguelastrømmen','kold',[[12,-34],[8,-23],[5,-12]]],
 ['Sydlige ækvatorialstrøm','varm',[[0,-5],[-18,-5],[-34,-6]]],
 ['Kuroshio','varm',[[125,20],[130,29],[141,36],[155,39]]],
 ['Oyashio','kold',[[163,54],[151,46],[144,39]]],
 ['Californiske strøm','kold',[[-128,46],[-125,35],[-116,24]]],
 ['Nordlige ækvatorialstrøm','varm',[[-130,14],[-160,14],[170,14],[140,14]]],
 ['Humboldtstrømmen','kold',[[-78,-42],[-78,-28],[-82,-12],[-90,-3]]],
 ['Østaustralske strøm','varm',[[155,-17],[156,-26],[154,-36]]],
 ['Sydlige ækvatorialstrøm','varm',[[-100,-8],[-140,-8],[-175,-8],[160,-10]]],
 ['Agulhasstrømmen','varm',[[43,-15],[37,-25],[29,-35],[20,-39],[35,-41]]],
 ['Vestaustralske strøm','kold',[[108,-35],[108,-25],[105,-16]]],
 ['Sydlige ækvatorialstrøm','varm',[[100,-12],[75,-12],[50,-12]]],
 ['Antarktisk cirkumpolarstrøm','kold',[[-170,-55],[-120,-55],[-70,-57],[-30,-52],[30,-52],[90,-52],[150,-55],[179,-55]]]
];
export function tegn(ctx,{projektion}) {
  const {linje,tekst} = pensel(ctx,projektion);
  for (const [navn,type,punkter] of STROEMME) {
    const farve = type==='varm' ? '#b83c28' : '#236ea5';
    linje(punkter,farve,type==='kold');
    if (valg.navne) tekst(punkter[Math.floor(punkter.length/2)],navn,farve);
  }
}

export const AFLAESNING = '#havstroemaflaesning';
export const aflaes = () => 'Varme og kolde overfladestrømme (skematisk)';
