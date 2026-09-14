/* ═══════════════════════════════════════════════════════════
   redskaber.js — registret over det, der står på hylden.

   Ét redskab er ét objekt med den samme kontrakt: hvor det står,
   hvordan det tegnes, hvad det kan slippes på, om det giver
   mening lige nu, og hvad der sker. Et nyt redskab er én ny post
   i listen herunder — og intet andet.

       {id, navn, mærkat, x, bredde, højde,
        tegn(g),                tegnes med bunden i (0, 0)
        maal:['kolbe','roer'],  hvad det kan slippes på
        kan(m, ctx),            true, eller en sætning om hvorfor ikke
        brug(m, ctx)}           udfører og returnerer en besked

   ctx er {slags, verden}: hvilken slags modtager der blev sluppet
   på, og bordet, hvis redskabet skal sætte gang i noget der.
   ═══════════════════════════════════════════════════════════ */
import {blaek, boks, maerkat, tekst} from './model.js';
import {HYLDE_Y} from './bord.js';
import {RUM, VAND_PORTION, SUKKER_PORTION, GAER_PORTION, ROER_VAND} from './gaering.js';
import {rumfang} from './kolbe.js';

/** Kolbens indhold vejer noget — en tilsætning ændrer temperaturen.
    Det er derfor kolben med 60-graders vand falder til omkring 54 °C,
    når de 20 g gær kommer i. */
function blandTemp(k, masse, temp){
  const nu = rumfang(k);
  k.temp = nu <= 0 ? temp : (nu * k.temp + masse * temp) / (nu + masse);
}

export const REDSKABER = [

  /* ── Sukker ──────────────────────────────────────────── */
  {
    id:'sukker', navn:'Sukker', mærkat:'Sukker',
    x:90, bredde:62, højde:62,
    maal:['kolbe'],
    kan:k => k.sukker > 0 ? 'Der er allerede vejet sukker af i den kolbe' : true,
    brug(k){
      blandTemp(k, SUKKER_PORTION, RUM);
      k.sukker += SUKKER_PORTION;
      k.roert = false;
      return `${SUKKER_PORTION} g sukker i ${k.navn}`;
    },
    tegn(g){
      /* Bægerglas med afvejet sukker */
      g.beginPath();
      g.moveTo(-26, -52); g.lineTo(-23, -8);
      g.arcTo(-23, 0, -15, 0, 8); g.lineTo(15, 0);
      g.arcTo(23, 0, 23, -8, 8); g.lineTo(26, -52);
      blaek(g, 'rgba(214,236,240,.35)', 2.4);
      g.save();
      g.beginPath();
      g.moveTo(-24, -34); g.lineTo(-23, -8);
      g.arcTo(-23, 0, -15, 0, 8); g.lineTo(15, 0);
      g.arcTo(23, 0, 23, -8, 8); g.lineTo(24, -34);
      g.closePath(); g.clip();
      g.fillStyle = '#FFFFFF'; g.fillRect(-26, -40, 52, 42);
      g.fillStyle = 'rgba(23,33,31,.16)';
      for(let i = 0; i < 26; i++) g.fillRect(-22 + (i * 37) % 44, -32 + (i * 17) % 30, 1.8, 1.8);
      g.restore();
      g.beginPath();
      g.moveTo(-24, -34); g.quadraticCurveTo(0, -45, 24, -34);
      g.lineTo(24, -31); g.lineTo(-24, -31); g.closePath();
      blaek(g, '#FFFFFF', 1.6, 'rgba(23,33,31,.35)');
      maerkat(g, `${SUKKER_PORTION} g`, 0, -14, {størrelse:10, farve:'#3E4E4C'});
    },
  },

  /* ── Tørgær ──────────────────────────────────────────── */
  {
    id:'gaer', navn:'Tørgær', mærkat:'Gær',
    x:200, bredde:58, højde:66,
    maal:['kolbe'],
    kan:k => k.gaer > 0 ? 'Der er allerede gær i den kolbe' : true,
    brug(k){
      blandTemp(k, GAER_PORTION, RUM);
      k.gaer += GAER_PORTION;
      k.roert = false;
      return `${GAER_PORTION} g gær i ${k.navn}`;
    },
    tegn(g){
      boks(g, -23, -52, 46, 52, 3);
      blaek(g, '#E0C79A', 2.4);
      g.beginPath();
      g.moveTo(-23, -52); g.lineTo(-15, -60); g.lineTo(15, -60); g.lineTo(23, -52);
      g.closePath();
      blaek(g, '#CBAF7C', 2.4);
      boks(g, -16, -43, 32, 20, 3);
      blaek(g, '#FFF9EE', 2);
      tekst(g, 'GÆR', 0, -33, {størrelse:11});
      maerkat(g, `${GAER_PORTION} g`, 0, -13, {størrelse:10, farve:'#4A3D28'});
    },
  },

  /* ── Vand ────────────────────────────────────────────── *
   * Vandet står i et måleglas — det er dér, man afmåler de 100 mL,
   * vejledningen beder om.                                        */
  {
    id:'vand', navn:'Måleglas med vand', mærkat:'Måleglas · 100 mL',
    x:306, bredde:52, højde:84,
    maal:['kolbe', 'roer'],
    kan(m, ctx){
      if(ctx.slags === 'roer') return m.vand ? 'Der er allerede vand i det gærrør' : true;
      return m.vand > 0 ? 'Der er allerede hældt vand i den kolbe' : true;
    },
    brug(m, ctx){
      if(ctx.slags === 'roer'){ m.vand = true; return `${ROER_VAND} mL vand i gærrøret`; }
      blandTemp(m, VAND_PORTION, RUM);
      m.vand += VAND_PORTION;
      m.roert = false;
      return `${VAND_PORTION} mL vand ved ${RUM} °C i ${m.navn}`;
    },
    tegn(g){
      /* Foden */
      g.beginPath();
      g.moveTo(-22, 0); g.lineTo(-9, -13); g.lineTo(9, -13); g.lineTo(22, 0);
      g.closePath();
      blaek(g, '#DCE6E4', 2.4);
      /* Cylinderen med hældetud */
      g.beginPath();
      g.moveTo(-12, -78); g.lineTo(-12, -12); g.lineTo(12, -12); g.lineTo(12, -78);
      g.lineTo(19, -73);
      blaek(g, 'rgba(214,236,240,.35)', 2.4);
      /* Vandet op til 100 mL-stregen */
      g.save();
      g.beginPath(); g.rect(-10, -66, 20, 53); g.clip();
      g.fillStyle = '#BFE1F2'; g.fillRect(-12, -68, 24, 58);
      g.restore();
      g.beginPath(); g.moveTo(-10, -66); g.lineTo(10, -66);
      blaek(g, null, 1.8, 'rgba(23,33,31,.45)');
      /* Inddelingen. Rumfanget står på hylden under glasset — skrevet
         hen over selve glasset ville det være bredere end det.       */
      g.save();
      g.strokeStyle = 'rgba(23,33,31,.45)'; g.lineWidth = 1.3;
      for(let i = 0; i < 4; i++){
        const y = -22 - i * 11;
        g.beginPath(); g.moveTo(2, y); g.lineTo(i % 2 ? 7 : 10, y); g.stroke();
      }
      g.restore();
    },
  },

  /* ── Bromthymolblåt ──────────────────────────────────── */
  {
    id:'btb', navn:'Bromthymolblåt', mærkat:'BTB',
    x:396, bredde:44, højde:72,
    maal:['roer'],
    kan(r){
      if(!r.vand) return 'Hæld først vand i gærrøret — BTB skal opløses i vandet';
      return r.btb ? 'Der er allerede BTB i det gærrør' : true;
    },
    brug(r){ r.btb = true; return 'Et par dråber BTB i gærrøret — vandet er blåt'; },
    tegn(g){
      boks(g, -16, -46, 32, 46, 5);
      blaek(g, 'rgba(226,240,246,.55)', 2.4);
      g.save();
      boks(g, -14, -30, 28, 30, 4); g.clip();
      g.fillStyle = '#1F63C8'; g.fillRect(-16, -32, 32, 34);
      g.restore();
      boks(g, -9, -58, 18, 14, 4);
      blaek(g, '#2E3A38', 2.2);
      boks(g, -4, -67, 8, 11, 3);
      blaek(g, '#FFF9EE', 2);
      boks(g, -14, -27, 28, 14, 3);
      blaek(g, '#FFF9EE', 1.8);
      tekst(g, 'BTB', 0, -20, {størrelse:9.5});
    },
  },

  /* ── Spatel ──────────────────────────────────────────── */
  {
    id:'spatel', navn:'Spatel', mærkat:'Spatel',
    x:470, bredde:54, højde:76,
    maal:['kolbe'],
    kan(k){
      if(k.sukker === 0 && k.gaer === 0) return 'Der er ikke noget at røre rundt i endnu';
      return true;
    },
    brug(k, ctx){
      k.roert = true;
      ctx.verden.roerer = {kolbe:k, til:ctx.verden.rt + 2.6};
      return `Rørt rundt i ${k.navn}`;
    },
    tegn(g){
      g.save();
      g.rotate(-0.18);
      boks(g, -4, -72, 8, 58, 4);
      blaek(g, '#C9D2D0', 2.2);
      g.beginPath();
      g.moveTo(-9, -18); g.quadraticCurveTo(-11, 0, 0, 2);
      g.quadraticCurveTo(11, 0, 9, -18);
      g.closePath();
      blaek(g, '#DFE6E4', 2.2);
      g.restore();
    },
  },

  /* ── Termometer ──────────────────────────────────────── */
  {
    id:'termometer', navn:'Termometer', mærkat:'Termometer',
    x:556, bredde:46, højde:82,
    maal:['kolbe'],
    kan:() => true,
    brug(k, ctx){
      k.maaltTemp = k.temp;
      ctx.verden.maaler = {kolbe:k, til:ctx.verden.rt + 4};
      return `${k.navn} måler ${Math.round(k.temp)} °C`;
    },
    tegn(g){
      boks(g, -5, -78, 10, 64, 5);
      blaek(g, '#FFFFFF', 2.2);
      boks(g, -2.5, -46, 5, 36, 2.5);
      blaek(g, '#E8336D', 0);
      g.beginPath(); g.arc(0, -8, 8, 0, Math.PI * 2);
      blaek(g, '#E8336D', 2.2);
      g.save();
      g.strokeStyle = 'rgba(23,33,31,.45)'; g.lineWidth = 1.2;
      for(let i = 0; i < 6; i++){
        const y = -70 + i * 9;
        g.beginPath(); g.moveTo(2, y); g.lineTo(5, y); g.stroke();
      }
      g.restore();
    },
  },
];

export function redskabKasse(r){
  return {x0:r.x - r.bredde / 2, x1:r.x + r.bredde / 2,
          y0:HYLDE_Y - r.højde, y1:HYLDE_Y + 4};
}

/** Redskabet på sin plads på hylden — eller i hånden, hvis der
    gives andre koordinater. */
export function tegnRedskab(g, r, {x = null, y = null, skygget = false} = {}){
  const hjemme = x === null;
  g.save();
  g.translate(hjemme ? r.x : x, hjemme ? HYLDE_Y : y);
  if(skygget) g.globalAlpha = 0.25;
  r.tegn(g);
  g.restore();
  if(hjemme) maerkat(g, r.mærkat, r.x, HYLDE_Y + 9, {størrelse:10, farve:'#4A5956'});
}
