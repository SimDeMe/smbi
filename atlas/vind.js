import {pensel} from './stroempile.js';
export const ORDEN = 70;
export const valg = {maaned:0};
export const hent = async () => {};
// Redaktionelt skitserede forløb, ikke observerede positioner eller isobarer.
export const ITK = {
  0: [[-180,3],[-140,5],[-100,3],[-70,-5],[-45,-3],[-20,1],[0,-5],[25,-12],[50,-10],[75,-8],[100,-8],[125,-12],[150,-8],[180,3]],
  6: [[-180,7],[-140,10],[-100,12],[-70,9],[-45,7],[-20,10],[0,18],[25,18],[50,15],[75,23],[100,25],[125,15],[150,10],[180,7]]
};
export function tegn(ctx, {projektion}) {
  const {linje,tekst} = pensel(ctx,projektion), sommer = valg.maaned === 6;
  const shift = sommer ? 5 : -5;
  for (let lon=-170;lon<180;lon+=30) {
    // Det asiatiske monsunområde tegnes særskilt.
    if (lon < 40 || lon > 130) {
      linje([[lon,26+shift],[lon-12,10+shift]],'#256b83');
      linje([[lon,-26+shift],[lon-12,-10+shift]],'#256b83');
    }
    linje([[lon,38+shift],[lon+16,48+shift]],'#485b69');
    linje([[lon,-38+shift],[lon+16,-48+shift]],'#485b69');
    for (const lat of [30+shift,-30+shift]) tekst([lon,lat],'H','#a34b29');
    for (const lat of [60+shift,-60+shift]) tekst([lon,lat],'L','#256b83');
  }
  linje(ITK[valg.maaned],'#9b3293',true,false);
  tekst([-20,sommer?14:5],'ITK · lavtryk','#9b3293');
  for (const lon of [65,90,115]) linje(sommer ? [[lon-12,-5],[lon-7,5],[lon+2,20]] : [[lon+2,22],[lon-7,10],[lon-12,0]],'#a34b29');
  tekst([85,32],sommer?'L · sommer':'H · vinter','#a34b29');
  tekst([85,3],sommer?'SV-monsun':'NØ-monsun','#a34b29');
  tekst([-45,20+shift],'NØ-passat');tekst([-30,-20+shift],'SØ-passat');
  tekst([-35,48+shift],'Vestenvinde');
}

export const AFLAESNING = '#vindaflaesning';
export const aflaes = () => `Skematisk cirkulation i ${valg.maaned === 0 ? 'januar' : 'juli'}`;
