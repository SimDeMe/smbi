#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Åkande — hvid nøkkerose (Nymphaea alba).

    python3 Assets/sprites/aakande/byg.py

Den store flydebladsplante i næringsrige søer og moser. Bladet ligger fladt
på overfladen med sit dybe indskår, og blomsten sidder ved siden af på sin
egen stilk. Stænglerne går hele vejen ned til jordstænglen i bunden — det er
dem, der svajer; bladet og blomsten flyder og bliver liggende vandret.

Sprite'ens anker sidder ved roden, og punktet `overflade` er vandspejlet.
Skabelonen står i ../plante.py.
"""

import math, os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import plante
from plante import INK
from tegn import glat, kant, streger

BLAD_STILK   = [(0,0),(-14,150),(-26,320),(-30,500),(-22,660),(-10,760),(0,830)]
LILLE_STILK  = [(0,0),(-22,150),(-52,320),(-84,500),(-112,660),(-130,770),(-142,838)]
BLOMST_STILK = [(0,0),(26,150),(52,320),(72,500),(94,660),(118,770),(140,845)]


def flydeblad(rx, ry, hak=0.30, n=32):
    """Bladet set lidt oppefra: en ellipse med det dybe indskår ind mod midten."""
    p = []
    for i in range(n + 1):
        a = hak + (2*math.pi - 2*hak) * i / n
        p.append((rx*math.cos(a), ry*math.sin(a)))
    p.append((0, 0))                       # indskårets spids
    return p


def kronblade(r, antal, bredde):
    """Én krans af kronblade, der peger ud fra midten."""
    ud = []
    for i in range(antal):
        a = 2*math.pi*i/antal
        blad = [(r*0.10, -bredde*0.30), (r*0.45, -bredde), (r*0.82, -bredde*0.62),
                (r, 0), (r*0.82, bredde*0.62), (r*0.45, bredde), (r*0.10, bredde*0.30)]
        c, s = math.cos(a), math.sin(a)
        ud.append([(x*c - y*s, x*s + y*c) for x, y in blad])
    return ud


class Aakande(plante.Plante):

    def top(self, linje, faze):
        (x, y), _ = self.paa(1.0, faze, linje)
        return x, y

    def billede(self, faze, suf):
        ud = ['<g fill="none" stroke="%s" stroke-width="6" '
              'stroke-linejoin="round" stroke-linecap="round">' % INK]

        # stilkene ned til jordstænglen — det er dem, der svajer
        ud.append('<path d="%s" fill="#3A7040"/>'
                  % self.stilk(faze, 15, 10, linje=LILLE_STILK))
        ud.append('<path d="%s" fill="#3E7A46"/>'
                  % self.stilk(faze, 17, 12, linje=BLOMST_STILK))
        ud.append('<path d="%s" fill="#46884A"/>'
                  % self.stilk(faze, 20, 14, linje=BLAD_STILK))

        # bladene flyder vandret, uanset hvordan stilkene står
        for stilk, rx, ry, gr in ((LILLE_STILK, 112, 34, 'lille'),
                                  (BLAD_STILK, 190, 54, 'blad')):
            bx, by = self.top(stilk, faze)
            blad = [(bx + x, by + y) for x, y in flydeblad(rx, ry, 0.42)]
            for q in blad:
                self.kasse.med(*q)
            ud.append('<path d="%s" fill="url(#%s%s)"/>' % (kant(blad), gr, suf))
            ribber = [((bx, by), (bx + rx*0.94*math.cos(a), by + ry*0.94*math.sin(a)))
                      for a in [0.46 + (2*math.pi - 0.92)*i/9 for i in range(10)]]
            ud.append('<path d="%s" stroke-width="3" opacity=".30"/>' % streger(ribber))

        # blomsten
        fx, fy = self.top(BLOMST_STILK, faze)
        for r, antal, bredde, farve in ((70, 11, 19, '#FFFFFF'),
                                        (45, 8, 15, '#FFF8EC')):
            for blad in kronblade(r, antal, bredde):
                p = [(fx + x, fy + y) for x, y in blad]
                for q in p:
                    self.kasse.med(*q)
                ud.append('<path d="%s" fill="%s" stroke-width="5"/>'
                          % (glat(p, lukket=True), farve))
        ud.append('<circle cx="%.0f" cy="%.0f" r="18" fill="#F5C33C"/>' % (fx, fy))
        ud.append('</g>')

        defs = '<defs>' + ''.join(
            '<linearGradient id="%s%s" x1="0" y1="%d" x2="0" y2="%d" '
            'gradientUnits="userSpaceOnUse">'
            '<stop offset="0" stop-color="#3C7A34"/>'
            '<stop offset="1" stop-color="#6BA544"/></linearGradient>'
            % (gr, suf, ry, -ry) for gr, ry in (('blad', 54), ('lille', 34))) + '</defs>'
        return defs + '\n' + '\n'.join(ud)

    def punkter(self):
        return {'overflade': (0, 830), 'blomst': (140, 845), 'blad': (0, 830)}


AAKANDE = Aakande(
    navn='aakande', dansk='Åkande', art='Nymphaea alba', titel='Åkande, hvid nøkkerose',
    beskrivelse='Sprite til 2D-animation: hvid nøkkerose (Nymphaea alba) med '
                'flydeblad og blomst ved vandoverfladen.',
    linje=BLAD_STILK,
    amp=40.0, boelge=2200.0, tempo=0.3,
    ramme=(760, 1000), rod=(340, 962),
)

if __name__ == '__main__':
    AAKANDE.byg(os.path.dirname(os.path.abspath(__file__)))
