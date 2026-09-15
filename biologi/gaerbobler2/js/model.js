/* =====================================================================
   model.js - biologien og tallene bag gaerforsoeget

   Modellen for gaeringen, maetningen og BTB er Simon Messells fra
   biologi/gaerbobler/gaering.js. Tallene og formlerne er de samme; de er
   blot skrevet om til det faelles NK-navnerum. To ting er tilfoejet:

   * Maengden af gaer: hastigheden er proportional med gaeren, saa 20 g
     giver det samme som i den oprindelige model.
   * Luften i kolben: naar en lukket kolbe varmes op, udvider luften sig
     og presses ud gennem gaerroeret som bobler, der ikke kommer fra
     gaeren. Det er en rigtig fejlkilde i forsoeget.

   Gaeringen:
     C₆H₁₂O₆ → 2 C₂H₅OH + 2 CO₂
   Hastigheden foelger Q₁₀-reglen og haemmes af varme over ca. 40 °C.
   Gaercellerne doer uopretteligt over ca. 50 °C.
   ===================================================================== */
(function () {
    "use strict";

    var NK = window.NK;

    var RUM = 20;
    var PORTION = { sukker: 25, gaer: 20, vand: 100, roerVand: 8, btb: 3 };

    /* Hvad der fysisk kan vaere i glassene, mL */
    var GRAENSE = { kolbe: 250, roer: 11 };

    /* ----- Gaeringshastigheden (Simons model) ------------------------ */
    var V20 = 18;          /* bobler/min ved 20 °C med frisk, omroert gaer */
    var Q10 = 2;

    function tempFaktor(T) {
        var fart = Math.pow(Q10, (T - 20) / 10);
        var aktiv = 1 / (1 + Math.exp((T - 44) / 2.2));
        return fart * aktiv;
    }

    function doedsrate(T) {
        return 0.0005 * Math.exp((T - 42) / 3.2);
    }

    var BOBLER_PR_G = 260;

    /* CO₂ opløses foerst i vaesken; foerst naar den er maettet, kommer
       der bobler. Varmt vand kan holde mindre CO₂ end koldt. */
    function maetning(mL, T) {
        return (mL / 100) * Math.max(8, 60 - 0.7 * T);
    }

    /* ----- BTB og pH i gaerroeret (Simons model) --------------------- */
    var Ka1 = 4.3e-7, Kw = 1e-14, ALK = 1.0e-3;
    var C_START = 2.8e-5, C_MAET = 34e-3, PR_BOBLE = 7.7e-6;

    function pHaf(C) {
        var h = (-ALK + Math.sqrt(ALK * ALK + 4 * (Ka1 * C + Kw))) / 2;
        return -Math.log10(h);
    }

    function gulAndel(pH) {
        return 1 / (1 + Math.pow(10, pH - 7.1));
    }

    var BLAA = { r: 31, g: 99, b: 200 }, GROEN = { r: 63, g: 166, b: 74 }, GUL = { r: 228, g: 197, b: 32 };

    function btbFarve(pH) {
        var f = gulAndel(pH);
        return f < 0.5 ? NK.blandFarve(BLAA, GROEN, f * 2) : NK.blandFarve(GROEN, GUL, (f - 0.5) * 2);
    }

    function btbNavn(pH) {
        return pH >= 7.6 ? "blå" : (pH >= 6.0 ? "grøn" : "gul");
    }

    /* ----- Kolbe og gaerroer ----------------------------------------- */
    function nyKolbe() {
        return {
            sukker: 0, gaer: 0, vand: 0, temp: RUM, roert: false, btb: 0,
            levende: 1, vaagen: 0, dannet: 0, oploest: 0, hastighed: 0, slip: 0, luft: 0
        };
    }

    function nytRoer() {
        return { vand: 0, btb: 0, C: C_START, rest: 0 };
    }

    function harBlanding(k) { return k.vand > 0 && k.gaer > 0 && k.sukker > 0; }

    function rumfang(k) { return k.vand + k.sukker * 0.63 + k.gaer * 0.9; }

    /* En tilsaetning ved stuetemperatur trækker temperaturen mod RUM */
    function blandTemp(k, mL, temp) {
        var nu = rumfang(k);
        k.temp = nu <= 0 ? temp : (nu * k.temp + mL * temp) / (nu + mL);
    }

    function hastighed(k) {
        if (!harBlanding(k)) return 0;
        var rest = Math.max(0, k.sukker * BOBLER_PR_G - k.dannet);
        var sukker = Math.min(1, rest / (0.15 * k.sukker * BOBLER_PR_G));
        var alkohol = Math.exp(-k.dannet / 8000);
        return V20 * tempFaktor(k.temp) * k.levende * k.vaagen * sukker * alkohol * (k.gaer / PORTION.gaer);
    }

    /* Et skridt frem. dt i sekunder. o = { maal: temperaturen, kolben
       soeger mod, plade: staar paa en taendt plade, lukket: gaerroer paa }.
       Returnerer mL gas (= bobler), der forlader kolben. */
    function opdaterKolbe(k, dt, o) {
        var foer = k.temp;
        var tau = o.plade ? 75 : 900;
        k.temp += (o.maal - k.temp) * (1 - Math.exp(-dt / tau));

        k.levende *= Math.exp(-doedsrate(k.temp) * dt);

        if (harBlanding(k)) {
            var t = 150 * Math.pow(2, -(k.temp - 20) / 12);
            if (!k.roert) t *= 1.8;
            k.vaagen += (1 - k.vaagen) * (1 - Math.exp(-dt / t));
        }

        k.hastighed = hastighed(k);
        var dannet = k.hastighed * dt / 60;
        k.dannet += dannet;

        var maet = maetning(k.vand, k.temp);
        var ud = 0;
        if (k.oploest > maet) { ud += k.oploest - maet; k.oploest = maet; }
        var plads = Math.max(0, maet - k.oploest);
        var ind = Math.min(plads, dannet);
        k.oploest += ind;
        ud += dannet - ind;

        /* Luften over vaesken udvider sig, naar den varmes op */
        k.luft = 0;
        if (o.lukket && k.temp > foer) {
            k.luft = Math.max(0, GRAENSE.kolbe - rumfang(k)) * (k.temp - foer) / (foer + 273.15);
            ud += k.luft;
        }

        k.slip = dt > 0 ? ud * 60 / dt : 0;
        return ud;
    }

    /* Gassen gaar gennem gaerroeret. Uden vand er der ingen bobler at se.
       Returnerer antallet af hele bobler, der kom gennem vandet. */
    function opdaterRoer(r, ud, dt) {
        if (r.vand <= 0) return 0;
        var hele = 0;
        r.C += ud * PR_BOBLE;
        r.C += -(r.C - C_START) * (1 - Math.exp(-dt / 1600));
        r.C = NK.klamp(r.C, C_START, C_MAET);
        r.rest += ud;
        while (r.rest >= 1) { r.rest -= 1; hele++; }
        return hele;
    }

    function roerPH(r) { return pHaf(r.C); }

    /* ----- Farver ------------------------------------------------------ */
    var FARVE = {
        vand:     { r: 190, g: 222, b: 244, a: 0.32 },
        gaer:     { r: 214, g: 176, b: 112, a: 0.9 },
        sukker:   { r: 236, g: 236, b: 226, a: 0.42 },
        skum:     { r: 250, g: 244, b: 226, a: 0.92 }
    };

    function kolbeFarve(k) {
        if (k.vand <= 0) return null;
        var f = FARVE.vand;
        if (k.sukker > 0) f = NK.blandFarve(f, FARVE.sukker, k.roert ? 0.4 : 0.15);
        if (k.gaer > 0) f = NK.blandFarve(f, FARVE.gaer, NK.klamp(k.gaer / 20, 0, 1) * (k.roert ? 0.85 : 0.35));
        if (k.btb > 0) {
            /* BTB i kolben: gaeringen goer hele kolben sur */
            var pH = NK.klamp(7.8 - k.dannet / 60, 5.6, 7.8);
            f = NK.blandFarve(f, btbFarve(pH), NK.klamp(0.45 + k.btb * 0.1, 0, 0.8));
            f.a = 0.85;
        }
        return f;
    }

    function roerFarve(r) {
        if (r.vand <= 0) return null;
        if (r.btb <= 0) return { r: 200, g: 226, b: 244, a: 0.45 };
        var f = btbFarve(roerPH(r));
        f.a = NK.klamp(0.55 + r.btb * 0.12, 0, 0.95);
        return f;
    }

    /* ----- Tal ----------------------------------------------------------- */
    function komma(x, d) {
        d = d === undefined ? 0 : d;
        var f = Math.pow(10, d);
        return (Math.round(x * f) / f).toFixed(d).replace(".", ",").replace(/^-(0(,0*)?)$/, "$1");
    }

    NK.Model = {
        RUM: RUM,
        PORTION: PORTION,
        GRAENSE: GRAENSE,
        KOLBE_AREAL: 20.4,
        ROER_AREAL: 1,
        tempFaktor: tempFaktor,
        doedsrate: doedsrate,
        maetning: maetning,
        pHaf: pHaf,
        btbFarve: btbFarve,
        btbNavn: btbNavn,
        nyKolbe: nyKolbe,
        nytRoer: nytRoer,
        harBlanding: harBlanding,
        rumfang: rumfang,
        blandTemp: blandTemp,
        hastighed: hastighed,
        opdaterKolbe: opdaterKolbe,
        opdaterRoer: opdaterRoer,
        roerPH: roerPH,
        kolbeFarve: kolbeFarve,
        roerFarve: roerFarve,
        FARVE: FARVE,
        komma: komma
    };
}());
