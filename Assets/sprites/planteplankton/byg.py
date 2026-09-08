#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Planteplankton — kiselalgen Asterionella formosa.

    python3 Assets/sprites/planteplankton/byg.py

En af de almindeligste kiselalger i danske søer, og den, der giver
forårsopblomstringen. Otte nåleformede celler sidder sammen i en stjerne med
et lille drej, så kolonien ligner et vindmøllehjul. Cellerne har den brune
farve, kiselalger får af deres farvestof fucoxanthin — planteplankton er
altså ikke nødvendigvis grønt.

Kolonien tumler langsomt rundt. Fordi stjernen har otte arme, er et helt
svømmetag her en ottendedel omdrejning: billede 8 ser ud præcis som billede 1,
og løkken går rent op.

Skabelonen for kurver og filer står i ../tegn.py.
"""

import math, os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import tegn
from tegn import INK, glat, kant, streger, roter

ARME     = 8
BILLEDER = 8
BR, HO   = 820, 820
MIDTE    = (410, 410)
DREJ     = math.radians(9)        # cellernes lille knæk — deraf vindmøllen

# én celle, målt fra navet og ud ad +x
CELLE = [(4,-19),(46,-15),(150,-11),(262,-7),(330,-4),(344,0),
         (330,4),(262,7),(150,11),(46,15),(4,19)]


def billede(faze, suf, kasse):
    v0 = 2*math.pi*faze / ARME                     # en ottendedel omdrejning
    ud = ['<g fill="none" stroke="%s" stroke-width="6" '
          'stroke-linejoin="round" stroke-linecap="round">' % INK]

    for i in range(ARME):
        v = v0 + 2*math.pi*i/ARME
        celle = roter(CELLE, DREJ)                 # cellen knækker om navet
        p = kasse.alle(roter(celle, v))
        ud.append('<path d="%s" fill="url(#skal%s)"/>' % (glat(p, lukket=True), suf))

        # kloroplasterne
        for a, b in ((58, 150), (178, 268)):
            klor = [(a,-7),(a+18,-10),(b-18,-7),(b,-3),(b-18,6),(a+18,8),(a,6)]
            q = roter(roter(klor, DREJ), v)
            ud.append('<path d="%s" fill="#B5813A" opacity=".8" stroke="none"/>'
                      % glat(q, lukket=True))

        # tværstriberne i kiselskallen
        striber = []
        for k in range(1, 15):
            x = 30 + 300*k/15
            b = 17 * (1 - x/430)
            striber.append(((x, -b), (x, b)))
        flad = [q for seg in striber for q in seg]
        lagt = roter(roter(flad, DREJ), v)
        ud.append('<path d="%s" stroke-width="3" opacity=".38"/>'
                  % streger(list(zip(lagt[0::2], lagt[1::2]))))

    ud.append('<circle cx="0" cy="0" r="26" fill="#D9CFA6"/>')
    ud.append('</g>')

    defs = ('<defs><linearGradient id="skal%s" x1="0" y1="-20" x2="0" y2="20" '
            'gradientUnits="userSpaceOnUse">'
            '<stop offset="0" stop-color="#F2ECD4"/>'
            '<stop offset="1" stop-color="#D8C99B"/></linearGradient></defs>' % suf)
    return defs + '\n' + '\n'.join(ud)


def main():
    mappe = os.path.dirname(os.path.abspath(__file__))
    kasse = tegn.Kasse(lambda x, y: (MIDTE[0] + x, MIDTE[1] + y))
    billeder = ['<g transform="translate(%d,%d)">\n%s\n</g>'
                % (MIDTE[0], MIDTE[1], billede(i/BILLEDER, '%d' % (i+1), kasse))
                for i in range(BILLEDER)]
    tegn.skriv(mappe, 'planteplankton', billeder, BR, HO, kasse,
               {'dansk': 'Planteplankton', 'art': 'Asterionella formosa', 'vender': 'hoejre', 'tempo': 0.25,
                'anker': (0, 0), 'punkter': {'nav': (0, 0)}},
               'Planteplankton — kiselalgen Asterionella formosa',
               'Sprite til 2D-animation: en koloni af kiselalgen Asterionella '
               'formosa, der tumler langsomt rundt i vandet.')


if __name__ == '__main__':
    main()
