/* model.js — tallene bag pladegrænserne.

   Alt her er fagindhold, der kan rettes uden at røre tegningen. Hver
   grænsetype henter sine tal herfra, så teksten i instrumenterne og
   figuren altid passer sammen.

   Hastigheder: 1 cm/år = 10 km pr. million år. Pladerne flytter sig
   altså ca. lige så hurtigt, som neglene vokser, men på 100 mio. år
   bliver det til 1 000 km pr. cm/år.

   Kilderne til tallene står ved hver funktion. Det er en
   undervisningsmodel: tallene har den rigtige størrelsesorden, men
   kun de sammenhænge, der står her, er med. */

export const KM_PR_MIO = 10;                // km pr. mio. år ved 1 cm/år
export const km = (v, t) => v * KM_PR_MIO * t;   // v i cm/år, t i mio. år

// ── Havbunden ved en midtoceanisk ryg ──────────────────
/* Havbunden køler af, efterhånden som den bevæger sig væk fra ryggen.
   Den trækker sig sammen, bliver tungere og synker: havdybden vokser
   med kvadratroden af alderen (Parsons & Sclater 1977).
     dybde ≈ 2,5 km + 0,35 km · √(alder i mio. år)
   Lithosfæren — den kolde, stive del — vokser nedad på samme måde,
   fordi kappen under den køler af og størkner til plade:
     tykkelse ≈ 11 km · √(alder)   (højst ca. 110 km) */
export const havdybde = alder => 2.5 + 0.35 * Math.sqrt(Math.max(0, alder));
export const lithosfaere = alder => Math.min(110, 11 * Math.sqrt(Math.max(0, alder)));
export const OCEANSKORPE = 7;               // km

/* Jordens magnetfelt skifter retning med ujævne mellemrum. Når ny
   havbund størkner ved ryggen, låser magnetiten i basalten sig fast i
   feltets retning, så havbunden bliver stribet — og striberne ligger
   spejlvendt på hver side af ryggen.
   De sidste 5,2 mio. år er den rigtige tidsskala (normal polaritet i
   de nævnte intervaller, Cande & Kent 1995). Længere tilbage er
   intervallerne tilfældige, men af samme længde som de rigtige. */
const NORMAL_KENDT = [
  [0, 0.78], [0.99, 1.07], [1.78, 1.95], [2.58, 3.04], [3.11, 3.22],
  [3.33, 3.58], [4.18, 4.29], [4.48, 4.62], [4.80, 4.89], [4.98, 5.23]
];
const SKIFT = (() => {
  // Alle tidspunkter, hvor feltet skifter, i mio. år før nu
  const s = NORMAL_KENDT.flat();
  let frø = 20260929, t = s[s.length - 1];
  const r = () => ((frø = (frø * 16807) % 2147483647) - 1) / 2147483646;
  while (t < 400){ t += 0.12 + r() * r() * 1.6; s.push(+t.toFixed(3)); }
  return s;
})();
// true = normal (som i dag), false = omvendt
export function polaritet(alder){
  if (alder < 0) return true;
  let i = 0;
  while (i < SKIFT.length && SKIFT[i] <= alder) i++;
  // Før første skift (0) er i = 1 → normal; derefter skifter det for hvert skift
  return i % 2 === 1;
}
// Grænserne mellem striberne inden for [a, b] mio. år — bruges af tegningen
export function striber(a, b){
  const ud = [];
  let fra = Math.max(0, a);
  for (const s of SKIFT){
    if (s <= fra) continue;
    if (s >= b) break;
    ud.push([fra, s, polaritet((fra + s) / 2)]);
    fra = s;
  }
  ud.push([fra, b, polaritet((fra + b) / 2)]);
  return ud;
}

// ── Subduktion ─────────────────────────────────────────
/* Pladen afgiver vand, når den er kommet ca. 100 km ned, og så
   begynder kappen over den at smelte (se vulkanudbrud.html). Derfor
   ligger vulkanerne der, hvor pladen er 100 km under overfladen: jo
   stejlere pladen dykker, jo tættere på graven. */
export const SMELTEDYBDE = 100;             // km

// ── Kontinentkollision ─────────────────────────────────
/* Isostasi: skorpen flyder på kappen som is på vand. Bliver skorpen
   tykkere, stikker den både højere op og længere ned (en bjergrod).
   Højden over det normale kontinent (Airy):
     h = (tykkelse − 35 km) · (ρ_kappe − ρ_skorpe) / ρ_kappe
       = (tykkelse − 35 km) · 600 / 3 300  ≈ 0,18 · fortykkelsen
   Resten — godt 80 % — ligger som rod under bjergene.
   Skorpen kan højst blive ca. 70 km tyk. Så er den så varm og blød
   forneden, at den flyder ud til siderne, og bjergkæden bliver bredere
   i stedet for højere: et højland som Tibet.
   Kun en del af sammentrykningen ender som tykkere skorpe under
   bjergene; resten presses ned i kappen eller skubbes ud til siderne.
   Her regnes med en tredjedel. */
export const RHO_SKORPE = 2700, RHO_KAPPE = 3300;
export const KONT_SKORPE = 35;              // km — et normalt kontinent
export const MAKS_SKORPE = 70;              // km
export const ANDEL_I_SKORPEN = 1 / 3;
export const opdrift = fortykkelse => fortykkelse * (RHO_KAPPE - RHO_SKORPE) / RHO_KAPPE;
const START_BREDDE = 100;                   // km — bjergkædens kerne, når den begynder
const SKRAANING = 80;                       // km — skråningen på hver side

/* Bjergkædens form efter sammentrykningen s (km): en kerne med tykkelsen
   T og bredden b, med en blød skråning på SKRAANING km ud til hver side.
   Arealet af den ekstra skorpe er (T − 35) · (b + SKRAANING). */
export function bjergkaede(s){
  const ekstra = ANDEL_I_SKORPEN * KONT_SKORPE * s;        // km²
  let T = KONT_SKORPE + ekstra / (START_BREDDE + SKRAANING), b = START_BREDDE;
  if (T > MAKS_SKORPE){ T = MAKS_SKORPE; b = ekstra / (MAKS_SKORPE - KONT_SKORPE) - SKRAANING; }
  return { T, b, hoejde: opdrift(T - KONT_SKORPE), rod: (T - KONT_SKORPE) - opdrift(T - KONT_SKORPE) };
}
// Skorpens tykkelse i afstanden x (km) fra kernens venstre kant
export function skorpeVed(x, kaede){
  const { T, b } = kaede, S = SKRAANING;
  let f = 0;
  if (x >= 0 && x <= b) f = 1;
  else if (x < 0 && x > -S) f = 0.5 + 0.5 * Math.cos(Math.PI * x / S);
  else if (x > b && x < b + S) f = 0.5 + 0.5 * Math.cos(Math.PI * (x - b) / S);
  return KONT_SKORPE + (T - KONT_SKORPE) * f;
}

// ── Transformforkastning: fastlåst, så et ryk ──────────
/* Pladerne glider jævnt forbi hinanden langt fra forkastningen, men
   selve forkastningen sidder fast. Klippen omkring den bøjes elastisk,
   og forskydningen spares op. Når den opsparede forskydning bliver
   større, end friktionen kan holde, springer forkastningen på én gang:
   et jordskælv (Reids elastiske tilbagespring, San Francisco 1906).
   Hvor meget der skal til, varierer fra gang til gang: 3–7 m her. */
const BRUD = (() => {
  let frø = 1906;
  const r = () => ((frø = (frø * 16807) % 2147483647) - 1) / 2147483646;
  const b = [];
  for (let i = 0; i < 400; i++) b.push(3 + 4 * r());
  return b;
})();
export const BRUD_MIDDEL = 5;               // m

/* Tilstanden efter t år ved hastigheden v (cm/år):
     flyttet   — hvor meget pladerne har flyttet sig i alt, m
     glidning  — hvor meget forkastningen er gledet i alt (i jordskælv), m
     opsparet  — forskellen: den elastiske bøjning, der venter, m
     naeste    — hvor meget der skal spares op til næste brud, m
     skaelv    — antal jordskælv indtil nu, og hvornår det sidste var */
export function transform(t, v){
  const flyttet = v / 100 * t;
  let glidning = 0, n = 0;
  while (n < BRUD.length && glidning + BRUD[n] <= flyttet){ glidning += BRUD[n]; n++; }
  const sidst = n > 0 ? { t: glidning / (v / 100), ryk: BRUD[n - 1] } : null;
  return { flyttet, glidning, opsparet: flyttet - glidning, naeste: BRUD[n], skaelv: n, sidst };
}

/* Jordskælvets størrelse ud fra rykket (momentmagnitude):
     M₀ = μ · A · D   (stivhed · bruddets areal · ryk)
     Mw = ⅔ · (log₁₀ M₀ − 9,1)
   Bruddet regnes 200 km langt og 15 km dybt, μ = 30 GPa. */
export const LAASEDYBDE = 15;               // km — under den kryber klippen
export function magnitude(ryk){
  const M0 = 3e10 * 200e3 * LAASEDYBDE * 1e3 * ryk;
  return 2 / 3 * (Math.log10(M0) - 9.1);
}

/* Vejen på tværs af forkastningen, set ovenfra. y (m) er, hvor meget
   et punkt x km fra forkastningen er flyttet langs den:
   - glidningen giver et skarpt knæk ved forkastningen,
   - den opsparede forskydning giver en blød S-bue, fordi forkastningen
     er låst ned til LAASEDYBDE, men glider frit under (Savage & Burford 1973). */
export function vejForskydning(x, tilst){
  return Math.sign(x) * tilst.glidning / 2 + tilst.opsparet / Math.PI * Math.atan(x / LAASEDYBDE);
}
