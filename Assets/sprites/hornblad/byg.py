#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Hornblad (Ceratophyllum demersum).

    python3 Assets/sprites/hornblad/byg.py

Almindelig i næringsrige søer og moser. Kendetegnet: kransene af stive,
gaffeldelte blade, der får skuddet til at ligne en flaskerenser — og at
planten slet ingen rødder har. Den flyder frit i vandet og overvintrer på
bunden. Skabelonen står i ../plante.py.
"""

import math, os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import plante
from plante import INK
from tegn import glat, streger

KNUDER = 12
VINKLER = (0.16, 0.48, 0.82)          # bladenes retninger ud fra stænglen


def gaffel(p, v, l, dyb, ud):
    """Ét gaffeldelt blad: hver gren deler sig igen i to."""
    q = (p[0] + l*math.cos(v), p[1] + l*math.sin(v))
    ud.append((p, q))
    if dyb:
        gaffel(q, v + 0.38, l*0.72, dyb-1, ud)
        gaffel(q, v - 0.30, l*0.72, dyb-1, ud)
    return ud


class Hornblad(plante.Plante):

    def billede(self, faze, suf):
        ud = ['<g fill="none" stroke="%s" stroke-width="6" '
              'stroke-linejoin="round" stroke-linecap="round">' % INK]

        ud.append('<path d="%s" fill="#4A7A38"/>' % self.stilk(faze, 15, 8))

        par = []
        for i in range(KNUDER):
            v = 0.06 + 0.92 * i / (KNUDER - 1)
            vip = 0.13 * math.sin(i * 1.9)
            s = 0.58 + 0.46 * (1 - v)
            for a in VINKLER:
                for vinkel in (a + vip, math.pi - a + vip):
                    stykker = gaffel((0, 0), 0.0, 56, 2, [])
                    flad = [q for seg in stykker for q in seg]
                    lagt = self.saet(flad, v, vinkel, faze, s)
                    par += list(zip(lagt[0::2], lagt[1::2]))
        # bladene tegnes to gange: blækstregen under og det grønne over
        ud.append('<defs><path id="bl%s" d="%s"/></defs>' % (suf, streger(par)))
        ud.append('<use href="#bl%s" stroke-width="15"/>' % suf)
        ud.append('<use href="#bl%s" stroke="#2F5E2A" stroke-width="9"/>' % suf)
        ud.append('</g>')
        return '\n'.join(ud)

    def punkter(self):
        return {'top': self.linje[-1]}


HORNBLAD = Hornblad(
    navn='hornblad', dansk='Hornblad', art='Ceratophyllum demersum', titel='Hornblad',
    beskrivelse='Sprite til 2D-animation: et skud hornblad (Ceratophyllum '
                'demersum) med kranse af gaffeldelte blade.',
    linje=[(0,0),(6,120),(-2,240),(6,360),(0,480),(-6,600),(2,720),(0,870)],
    amp=52.0, boelge=1400.0, tempo=0.4,
    ramme=(560, 1000), rod=(280, 962),
)

if __name__ == '__main__':
    HORNBLAD.byg(os.path.dirname(os.path.abspath(__file__)))
