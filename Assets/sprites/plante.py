#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Planteskabelonen — stænglen, der svajer, og det, der sidder på den.

En plante tegnes i plantekoordinater: x er ud til siden, y er højden over
roden, og y vokser opad. Rammen vender selv y om, så figuren står rigtigt.

Svajet er den samme slags bølge som fiskenes svømmetag, bare lodret: hvert
punkt skubbes til siden efter sin højde, og udsvinget vokser opefter, så roden
står fast og toppen bevæger sig mest. Alt, der har en højde, følger svajet af
sig selv — også blade og blomster, fordi deres punkter har deres egen højde.

Arterne står i vandpest/, hornblad/, aakande/ og tagroer/byg.py.
"""

import math, os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import tegn
from tegn import INK, glat, kant, streger, roter


class Plante:
    """Fælles rod, svaj og skrivning. Arten tegner selv sit billede."""

    def __init__(self, navn, dansk, art, titel, beskrivelse, linje, amp, boelge,
                 tempo, ramme, rod, billeder=8):
        self.navn, self.dansk, self.art, self.titel = navn, dansk, art, titel
        self.beskrivelse = beskrivelse
        self.linje = linje                       # stænglens midterlinje
        self.hoejde = max(y for _, y in linje)
        self.amp, self.boelge, self.tempo = amp, boelge, tempo
        self.br, self.ho = ramme
        self.rod = rod
        self.billeder = billeder
        self.kasse = tegn.Kasse(lambda x, y: (rod[0] + x, rod[1] - y))

    # ── svajet ────────────────────────────────────────────────────────────
    def udsving(self, y, faze):
        a = self.amp * (max(y, 0.0) / self.hoejde) ** 1.6
        return a * math.sin(2*math.pi*faze - 2*math.pi*y/self.boelge)

    def P(self, x, y, faze, maal=True):
        xx = x + self.udsving(y, faze)
        if maal:
            self.kasse.med(xx, y)
        return (xx, y)

    def alle(self, punkter, faze, maal=True):
        return [self.P(x, y, faze, maal) for x, y in punkter]

    # ── stænglen ──────────────────────────────────────────────────────────
    def midte(self, faze, linje=None):
        return self.alle(linje or self.linje, faze, False)

    def paa(self, v, faze, linje=None):
        """Punkt og retning på stænglen, v = 0 ved roden, 1 i toppen."""
        p = self.midte(faze, linje)
        t = v * (len(p) - 1)
        i = min(int(t), len(p) - 2)
        s = t - i
        a, b = p[i], p[i+1]
        return ((a[0] + (b[0]-a[0])*s, a[1] + (b[1]-a[1])*s),
                math.atan2(b[1]-a[1], b[0]-a[0]))

    def stilk(self, faze, ved_rod, ved_top, linje=None):
        """Stænglen som en aftagende form omkring midterlinjen."""
        p = self.alle(linje or self.linje, faze)
        n = len(p) - 1
        venstre, hoejre = [], []
        for i, (x, y) in enumerate(p):
            b = tegn.mellem(ved_rod, ved_top, i/n) / 2
            fx, fy = (p[min(i+1, n)][0] - p[max(i-1, 0)][0],
                      p[min(i+1, n)][1] - p[max(i-1, 0)][1])
            l = math.hypot(fx, fy) or 1
            nx, ny = -fy/l, fx/l
            venstre.append((x + nx*b, y + ny*b))
            hoejre.append((x - nx*b, y - ny*b))
        return glat(venstre + list(reversed(hoejre)), lukket=True)

    def saet(self, form, v, vinkel, faze, skala=1.0, maal=True, linje=None):
        """Lægger en form (i bladkoordinater, ud ad +x) på stænglen ved v."""
        (px, py), retning = self.paa(v, faze, linje)
        v_ret = retning - math.pi/2 + vinkel        # vinkel måles fra stænglen
        p = [(px + x, py + y) for x, y in
             roter([(x*skala, y*skala) for x, y in form], v_ret)]
        if maal:
            for q in p:
                self.kasse.med(*q)
        return p

    # ── hele figuren ──────────────────────────────────────────────────────
    def billede(self, faze, suf):
        raise NotImplementedError

    def punkter(self):
        return {'top': self.linje[-1]}

    def byg(self, mappe):
        billeder = []
        for i in range(self.billeder):
            indre = self.billede(i / self.billeder, '%d' % (i+1))
            billeder.append('<g transform="translate(%d,%d) scale(1,-1)">\n%s\n</g>'
                            % (self.rod[0], self.rod[1], indre))
        data = {'dansk': self.dansk, 'art': self.art,
                'vender': 'hoejre', 'tempo': self.tempo,
                'anker': (0, 0), 'punkter': self.punkter()}
        return tegn.skriv(mappe, self.navn, billeder, self.br, self.ho,
                          self.kasse, data, self.titel, self.beskrivelse)


def blad(laengde, bredde, spids=0.86):
    """Et lancetformet blad, der peger ud ad +x fra sit fæste."""
    b = bredde / 2
    return [(0, -b*0.35), (laengde*0.22, -b), (laengde*0.58, -b*0.92),
            (laengde, 0), (laengde*0.58, b*0.92), (laengde*0.22, b),
            (0, b*0.35)]
