#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Vandpest (Elodea canadensis).

    python3 Assets/sprites/vandpest/byg.py

Indslæbt fra Nordamerika i 1800-tallet og i dag almindelig i næringsrige
danske søer og vandløb. Kendetegnet: den tætte stængel med kranse af tre
små, aflange blade i hver knude. Skabelonen står i ../plante.py.
"""

import math, os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import plante
from plante import INK
from tegn import glat, kant, streger

KNUDER = 15

# bladet er kort, bredt og butspidset — ikke en granspids
BLAD = [(0,-10),(24,-14),(58,-13),(84,-7),(92,0),(84,7),(58,13),(24,14),(0,10)]


class Vandpest(plante.Plante):

    def krans(self, i, faze):
        """Én knude: to blade ud til siderne og ét, der peger mod beskueren."""
        v = 0.05 + 0.93 * i / (KNUDER - 1)
        vip = 0.16 * math.sin(i * 2.1)
        s = 0.62 + 0.42 * (1 - v)
        return v, vip, s

    def billede(self, faze, suf):
        ud = ['<g fill="none" stroke="%s" stroke-width="6" '
              'stroke-linejoin="round" stroke-linecap="round">' % INK]
        form = BLAD
        ribbe = [(8, 0), (80, 0)]

        # bladene, der peger mod beskueren, ligger bagest
        for i in range(KNUDER):
            v, vip, s = self.krans(i, faze)
            p = self.saet(form, v, math.pi/2 + vip, faze, s*0.74)
            ud.append('<path d="%s" fill="#2C6129"/>' % glat(p, lukket=True))

        ud.append('<path d="%s" fill="#57923F"/>' % self.stilk(faze, 20, 11))

        for i in range(KNUDER):
            v, vip, s = self.krans(i, faze)
            for vinkel in (0.56 + vip, math.pi - 0.56 + vip):
                p = self.saet(form, v, vinkel, faze, s)
                ud.append('<path d="%s" fill="#3F8438"/>' % glat(p, lukket=True))
                r = self.saet(ribbe, v, vinkel, faze, s, maal=False)
                ud.append('<path d="%s" stroke-width="3" opacity=".35"/>'
                          % glat(r))
        ud.append('</g>')
        return ud[0] and '\n'.join(ud)


VANDPEST = Vandpest(
    navn='vandpest', dansk='Vandpest', art='Elodea canadensis', titel='Vandpest',
    beskrivelse='Sprite til 2D-animation: et skud vandpest (Elodea canadensis), '
                'der svajer i vandet.',
    linje=[(0,0),(3,120),(-3,240),(3,360),(0,480),(-3,600),(3,720),(0,880)],
    amp=44.0, boelge=1500.0, tempo=0.45,
    ramme=(460, 1000), rod=(230, 962),
)

if __name__ == '__main__':
    VANDPEST.byg(os.path.dirname(os.path.abspath(__file__)))
