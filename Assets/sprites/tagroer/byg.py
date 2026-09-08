#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Tagrør (Phragmites australis).

    python3 Assets/sprites/tagroer/byg.py

Rørskoven langs søbredden — Danmarks højeste græs. Kendetegnene: det hule,
stråfarvede strå, de lange smalle blade, der buer nedad fra hver knude, og
den brunviolette dusk i toppen. Planten står med fødderne i vandet, så
sprite'ens anker sidder ved roden. Skabelonen står i ../plante.py.
"""

import math, os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import plante
from plante import INK
from tegn import glat, kant, streger

KNUDER = [(0.13, 1), (0.26, -1), (0.38, 1), (0.50, -1),
          (0.62, 1), (0.73, -1), (0.83, 1), (0.91, -1)]


def rorblad(laengde, bredde, bue, n=13):
    """Et langt, smalt blad, der buer nedad og løber ud i en fin spids."""
    over, under = [], []
    for i in range(n + 1):
        t = i / n
        x, y = laengde*t, -bue*t*t
        b = bredde * (1 - t)**0.68 / 2 + 1.2
        over.append((x, y - b))
        under.append((x, y + b))
    return over + list(reversed(under))


def dusk(laengde, n=20):
    """Duskens grene: længst nederst, kortere mod spidsen — og alle hængende.
    Hver gren er buet og lidt anderledes end naboen, så toppen bliver fjerlet
    i stedet for at ligne en pilespids."""
    grene = []
    for i in range(1, n + 1):
        t = i / n
        k = abs(math.sin(i * 2.3))
        l = laengde * (0.32 - 0.19*t) * (0.78 + 0.42*k)
        x = laengde * t
        for side in (-1, 1):
            grene.append([(x, 0),
                          (x - l*0.26, side*l*0.52),
                          (x - l*0.80, side*l*0.94)])
    return grene


class Tagroer(plante.Plante):

    def billede(self, faze, suf):
        ud = ['<g fill="none" stroke="%s" stroke-width="6" '
              'stroke-linejoin="round" stroke-linecap="round">' % INK]

        top = dusk(220)

        ud.append('<path d="%s" fill="#B9AF5E"/>' % self.stilk(faze, 24, 12))

        for v, side in KNUDER:
            s = 0.72 + 0.42 * (1 - v)
            blad = rorblad(226, 44, 118)
            if side < 0:
                blad = [(x, -y) for x, y in blad]
            vinkel = side * 0.62 + (math.pi if side < 0 else 0)
            p = self.saet(blad, v, side * 0.62 if side > 0 else math.pi - 0.62,
                          faze, s)
            ud.append('<path d="%s" fill="url(#blad%s)" stroke-width="5"/>'
                      % (glat(p, lukket=True), suf))
            # knuden på strået
            (kx, ky), _ = self.paa(v, faze)
            ud.append('<path d="M %.0f,%.0f L %.0f,%.0f" stroke-width="5" '
                      'opacity=".5"/>' % (kx-11, ky, kx+11, ky))

        # duskens grene, tegnet som blæk under og farve over
        stier = ' '.join(glat(self.saet(g, 1.0, math.pi/2, faze)) for g in top)
        ud.append('<defs><path id="du%s" d="%s"/></defs>' % (suf, stier))
        ud.append('<use href="#du%s" stroke-width="9"/>' % suf)
        ud.append('<use href="#du%s" stroke="#7E6270" stroke-width="5"/>' % suf)
        aks = self.saet([(0, 0), (220, 0)], 1.0, math.pi/2, faze)
        ud.append('<path d="%s" stroke-width="10"/>' % glat(aks))
        ud.append('<path d="%s" stroke="#9A7C52" stroke-width="5"/>' % glat(aks))
        ud.append('</g>')

        defs = ('<defs><linearGradient id="blad%s" x1="0" y1="30" x2="0" y2="-30" '
                'gradientUnits="userSpaceOnUse">'
                '<stop offset="0" stop-color="#6E8C3C"/>'
                '<stop offset="1" stop-color="#93A857"/></linearGradient></defs>' % suf)
        return defs + '\n' + '\n'.join(ud)

    def punkter(self):
        return {'top': (0, 780), 'dusk': (0, 900)}


TAGROER = Tagroer(
    navn='tagroer', dansk='Tagrør', art='Phragmites australis', titel='Tagrør',
    beskrivelse='Sprite til 2D-animation: et tagrør (Phragmites australis) '
                'med dusk, der svajer i vinden.',
    linje=[(0,0),(4,130),(-2,260),(6,390),(0,520),(-4,650),(4,780)],
    amp=64.0, boelge=2000.0, tempo=0.55,
    ramme=(660, 1120), rod=(330, 1078),
)

if __name__ == '__main__':
    TAGROER.byg(os.path.dirname(os.path.abspath(__file__)))
