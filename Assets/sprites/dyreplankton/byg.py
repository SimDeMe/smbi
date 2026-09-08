#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Dyreplankton — dafnien Daphnia longispina.

    python3 Assets/sprites/dyreplankton/byg.py

"Vandloppen" i skolebiologien og søens vigtigste græsser: den filtrerer
planteplankton fra vandet og bliver selv ædt af skallens yngel. Kendetegnene:
den gennemsigtige skal, det ene store sorte facetøje, rugehulen med æg på
ryggen, tarmen tværs gennem kroppen og halepiggen bagest.

Bevægelsen er dafniens hop: de store, grenede følehorn slår hurtigt bagud —
det er derfor, dyret hedder vandloppe — og føres langsomt frem igen. Kroppen
løftes lidt under kraftslaget. Kraftslaget er derfor de to første billeder,
tilbageføringen de seks sidste.

Skabelonen for kurver og filer står i ../tegn.py.
"""

import math, os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import tegn
from tegn import INK, glat, kant, streger, roter

BILLEDER = 8
BR, HO   = 800, 580
MIDTE    = (352, 404)

# hoved og skal er ét omrids — dafnien har ingen hals
KROP = [(150,-104),(196,-96),(226,-66),(232,-30),(216,2),(206,52),(184,32),
        (148,24),(118,46),(60,86),(-24,100),(-104,76),(-146,30),(-150,-32),
        (-110,-86),(-34,-112),(52,-108)]
NAKKE = [(104,-96),(126,-40),(120,18)]        # den svage fure mellem hoved og skal
PIG = [(-128,16),(-286,74),(-118,54)]
TARM = [(176,-12),(130,2),(64,12),(-10,22),(-84,30),(-128,36)]
AEG = [(20,-70),(-26,-64),(-72,-48),(-110,-20)]
FOEDDER = [26, 62, 96, 128]


def kraft(faze):
    """0 når følehornene er løftet, 1 når kraftslaget er kørt til bunds."""
    return faze/0.25 if faze < 0.25 else 1 - (faze - 0.25)/0.75


def foelehorn(vinkel, skala=1.0):
    """Ét grenet følehorn i sine egne koordinater, ud ad +x fra fæstet."""
    stok = [(0,-17),(62,-13),(120,-9),(128,0),(120,9),(62,13),(0,17)]
    dele = [('flade', stok)]
    for gren in (0.26, -0.26):
        c, s = math.cos(gren), math.sin(gren)
        ren = [(120 + (x*c - y*s), (x*s + y*c)) for x, y in
               [(0,-10),(58,-8),(112,-5),(118,0),(112,5),(58,8),(0,10)]]
        dele.append(('flade', ren))
        for k in range(1, 5):
            t = k/4.6
            rod = (120 + (118*t*c - 0*s), (118*t*s))
            v = gren + (0.62 if gren > 0 else -0.62)
            dele.append(('haar', [rod, (rod[0] + 58*math.cos(v),
                                        rod[1] + 58*math.sin(v))]))
    ud = []
    for slags, p in dele:
        p = [(x*skala, y*skala) for x, y in p]
        ud.append((slags, roter(p, vinkel)))
    return ud


def billede(faze, suf, kasse):
    k = kraft(faze)
    loeft = -15 * k                                   # kroppen løftes i slaget
    vinkel = math.radians(180 + 48 - 76*k)
    faeste = (128, -72 + loeft)

    def P(p):
        return kasse.alle([(x, y + loeft) for x, y in p])

    ud = ['<g fill="none" stroke="%s" stroke-width="6" '
          'stroke-linejoin="round" stroke-linecap="round">' % INK]

    def horn(v, skala, daekning):
        dele = foelehorn(v, skala)
        g = ['<g opacity="%s">' % daekning]
        haar = []
        for slags, p in dele:
            q = kasse.alle([(faeste[0] + x, faeste[1] + y) for x, y in p])
            if slags == 'flade':
                g.append('<path d="%s" fill="#F0E6CC"/>' % glat(q, lukket=True))
            else:
                haar.append((q[0], q[1]))
        g.append('<path d="%s" stroke-width="4" opacity=".7"/>' % streger(haar))
        g.append('</g>')
        return '\n'.join(g)

    # det bageste følehorn ligger bag kroppen og halter en anelse
    ud.append(horn(vinkel + 0.16, 0.92, '.55'))
    ud.append('<path d="%s" fill="#E8DDBC" opacity=".9"/>' % glat(P(PIG), lukket=True))
    ud.append('<path d="%s" fill="url(#skal%s)"/>' % (glat(P(KROP), lukket=True), suf))

    # skallens netmønster og indmaden klippes til skallen
    net = []
    for x in range(-160, 150, 34):
        net.append(((x, -130), (x + 90, 110)))
        net.append(((x + 90, -130), (x, 110)))
    ud.append('<g clip-path="url(#klip%s)">' % suf)
    ud.append('<path d="%s" stroke-width="3" opacity=".14"/>'
              % streger([(kasse.med(a[0], a[1] + loeft), kasse.med(b[0], b[1] + loeft))
                         for a, b in net]))
    for x, y in AEG:
        q = kasse.med(x, y + loeft)
        ud.append('<circle cx="%.0f" cy="%.0f" r="27" fill="#E6D28C" '
                  'stroke-width="4"/>' % q)
    ben = []
    for x in FOEDDER:
        for j in range(4):
            ben.append(((x, 34 + loeft), (x - 26 + j*9, 96 + loeft)))
    ud.append('<path d="%s" stroke-width="4" opacity=".45"/>' % streger(ben))
    ud.append('</g>')

    ud.append('<path d="%s" stroke="#7A6636" stroke-width="13" opacity=".7"/>'
              % glat(P(TARM)))
    ud.append('<path d="%s" stroke-width="4" opacity=".45"/>' % glat(P(NAKKE)))

    ox, oy = kasse.med(190, -46 + loeft)
    ud.append('<circle cx="%.0f" cy="%.0f" r="28" fill="%s"/>' % (ox, oy, INK))
    ud.append('<circle cx="%.0f" cy="%.0f" r="7" fill="#FFF9EE" stroke="none" '
              'opacity=".85"/>' % (ox - 9, oy - 10))
    ud.append(horn(vinkel, 1.0, '1'))
    ud.append('</g>')

    defs = ('<defs><linearGradient id="skal%s" x1="0" y1="-110" x2="0" y2="100" '
            'gradientUnits="userSpaceOnUse">'
            '<stop offset="0" stop-color="#FAF4E2"/>'
            '<stop offset="1" stop-color="#E4D6AC"/></linearGradient>'
            '<clipPath id="klip%s"><path d="%s"/></clipPath></defs>'
            % (suf, suf, glat([(x, y + loeft) for x, y in KROP], lukket=True)))
    return defs + '\n' + '\n'.join(ud)


def main():
    mappe = os.path.dirname(os.path.abspath(__file__))
    kasse = tegn.Kasse(lambda x, y: (MIDTE[0] + x, MIDTE[1] + y))
    billeder = ['<g transform="translate(%d,%d)">\n%s\n</g>'
                % (MIDTE[0], MIDTE[1], billede(i/BILLEDER, '%d' % (i+1), kasse))
                for i in range(BILLEDER)]
    tegn.skriv(mappe, 'dyreplankton', billeder, BR, HO, kasse,
               {'dansk': 'Dyreplankton', 'art': 'Daphnia longispina', 'vender': 'hoejre', 'tempo': 2.6,
                'anker': (0, 0),
                'punkter': {'oeje': (190, -46), 'rugehule': (-40, -50),
                            'halepig': (-286, 74)}},
               'Dyreplankton — dafnien Daphnia longispina',
               'Sprite til 2D-animation: en dafnie (Daphnia longispina), der '
               'hopper gennem vandet med sine grenede følehorn.')


if __name__ == '__main__':
    main()
