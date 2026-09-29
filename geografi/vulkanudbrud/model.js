/* model.js — hvad sker der med magmaet på vej op?

   Hele siden hviler på én kæde af årsager, den samme som i grundbogens
   figur over magmadannelse og vulkanudbrud:

     1. Trykket falder, jo tættere magmaet kommer på overfladen.
     2. Smelten kan kun holde på en vis mængde vand, og den mængde
        falder med trykket. Når magmaet er kommet så højt op, at det
        ikke kan holde på alt sit vand, går resten ud af opløsning som
        gasbobler — ligesom når man åbner en sodavand.
     3. Boblerne udvider sig, jo lavere trykket bliver. Magmaet bliver
        lettere og stiger hurtigere.
     4. I et sejt magma kan boblerne ikke slippe ud. Når de fylder ca.
        tre fjerdedele af rumfanget, sprænges skummet i stykker
        (fragmentering), og det, der vælter ud af krateret, er gas med
        aske og lapilli — et eksplosivt udbrud.

   Tallene:
     • Trykket er vægten af klippen ovenover (lithostatisk tryk):
       P = P₀ + ρ·g·z med ρ = 2 700 kg/m³ → ca. 26,5 MPa pr. km.
     • Vands opløselighed i smelten følger kvadratrodsloven
       C = k·√P (C i vægt-%, P i bar). For andesitisk smelte er k ≈ 0,11,
       så smelten kan holde på ca. 3,5 vægt-% vand ved 1 000 bar.
     • Gassen regnes som idealgas: ρ_gas = P·M / (R·T).
     • Grænsen for fragmentering sættes til 75 % gas i rumfang
       (Sparks 1978).

   Det er en undervisningsmodel: trykket i kanalen sættes lig med
   klippens tryk, og kanalen har samme bredde hele vejen op. Ingen
   andre forenklinger er nødvendige for at få tallene i den rigtige
   størrelsesorden. */

export const G = 9.81;
export const RHO_KLIPPE = 2700;       // kg/m³ — skorpen omkring kanalen
export const P0 = 0.101;              // MPa — lufttrykket ved krateret
const R = 8.314, M_VAND = 0.018;      // J/(mol·K), kg/mol

// Tryk i dybden z (km), MPa. Overtryk lægges til i kammeret.
export const tryk = (z, overtryk = 0) => P0 + RHO_KLIPPE * G * z * 1e-3 + overtryk;

// Så meget vand kan smelten holde på ved trykket P (MPa), vægt-%
export const oploeselighed = (P, k) => k * Math.sqrt(P * 10);

// Trykket, hvor smelten netop er mættet med vand, MPa
export const maetningstryk = (vand, k) => Math.pow(vand / k, 2) / 10;

// Dybden, hvor et tryk nås uden overtryk, km (aldrig over krateret)
export const dybdeFraTryk = P => Math.max(0, (P - P0) / (RHO_KLIPPE * G * 1e-3));

/* Tilstanden i ét punkt af magmaet.
   magma: { vand (vægt-% i alt), k, T (°C), rho (kg/m³, smelte + krystaller),
            fragmentering (gasandel, hvor skummet sprænges, eller null,
            hvis boblerne kan slippe ud, som i et tyndtflydende magma) } */
export function punkt(z, magma, overtryk = 0){
  const P = tryk(z, overtryk);
  const maks = oploeselighed(P, magma.k);
  const oploest = Math.min(magma.vand, maks);
  const gas = magma.vand - oploest;                   // vægt-% frigjort som gas
  const x = gas / 100;                                // massebrøk gas
  const rhoGas = P * 1e6 * M_VAND / (R * (magma.T + 273.15));
  // Rumfangsandel gas: gassens rumfang delt med det hele
  const vg = x / rhoGas, vs = (1 - x) / magma.rho;
  const gasandel = x > 0 ? vg / (vg + vs) : 0;
  const rho = 1 / (vg + vs);                          // massefylde af det hele, kg/m³
  const fragmenteret = magma.fragmentering != null && gasandel >= magma.fragmentering;
  return { z, P, maks, oploest, gas, gasandel, rhoGas, rho, fragmenteret };
}

/* De to dybder, der deler kanalen i tre: hvor boblerne begynder, og
   hvor skummet sprænges. Begge i km under krateret. */
export function graenser(magma){
  const zBobler = dybdeFraTryk(maetningstryk(magma.vand, magma.k));
  let zFrag = null;
  if (magma.fragmentering != null){
    // Gasandelen vokser monotont opad — find grænsen ved halvering
    let lo = 0, hi = zBobler;
    if (punkt(lo, magma).gasandel >= magma.fragmentering){
      for (let i = 0; i < 40; i++){
        const mid = (lo + hi) / 2;
        if (punkt(mid, magma).gasandel >= magma.fragmentering) lo = mid; else hi = mid;
      }
      zFrag = lo;
    }
  }
  return { zBobler, zFrag };
}

/* Stigehastighed i kanalen. Der strømmer lige mange kg igennem hvert
   snit af kanalen hvert sekund, så når magmaet bliver lettere, må det
   stige hurtigere: u = u₀ · ρ₀ / ρ. */
export const fart = (p, magma, u0) => u0 * magma.rho / p.rho;
