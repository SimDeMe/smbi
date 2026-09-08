#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Gedden (Esox lucius).

    python3 Assets/sprites/gedde/byg.py

Søens rovfisk. Kendetegnene: den lange, flade "andenæb"-snude med gabet helt
tilbage under øjet, den langstrakte krop, rygfinnen og gatfinnen skubbet helt
tilbage mod halen — sådan står den stille i vandplanterne og skyder frem — og
de lyse pletter i rækker på den olivengrønne side.
Skabelonen står i ../fisk.py.
"""

import math, os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from fisk import Fisk

def pletter():
    """De lyse pletter i rækker langs siden — med lidt uro, så de ikke bliver et gitter."""
    ud = []
    for r, y in enumerate((-54, -22, 12, 42)):
        for i, u in enumerate(range(352, 830, 84)):
            k = math.sin((r*7 + i*13) * 1.7)
            ud.append((int(u + 34*(r % 2) + 9*k), int(y + 7*k),
                       12, int(19 + 3*k), int(6 + 12*k)))
    return ud

GEDDE = Fisk(
    navn='gedde', dansk='Gedde', art='Esox lucius', titel='Gedde, svømmende',

    ryg=[(0,-22),(84,-34),(172,-48),(262,-64),(356,-80),(456,-90),
         (560,-92),(660,-88),(750,-78),(820,-62),(870,-46),(900,-36)],
    bug=[(0,16),(84,30),(172,44),(262,58),(356,70),(456,77),
         (560,78),(660,74),(750,64),(820,50),(870,38),(900,30)],

    halerod=(848, -3),
    halefinne=[(0,-40),(70,-86),(150,-104),(112,-38),(88,0),
               (112,38),(150,102),(70,84),(0,36)],

    finner=[
        dict(navn='ryg', u0=636, u1=790, hoejde=96, form=1.00, slank=0.28,
             straaler=10, nedad=False, farve='finne'),
        dict(navn='gat', u0=660, u1=800, hoejde=86, form=1.00, slank=0.28,
             straaler=9,  nedad=True,  farve='ror'),
        dict(navn='bug', u0=470, u1=546, hoejde=76, form=1.10, slank=0.50,
             straaler=6,  nedad=True,  farve='ror'),
    ],

    bryst_faeste=(322, 46),
    brystfinne=[(0,-22),(34,-10),(80,20),(110,64),(68,74),(26,50),(2,18)],

    pletter=pletter(),
    oeje=(192, -46, 21),
    mund=[(-6,2),(80,12),(170,22),(240,28),(260,16)],   # gabet helt tilbage under øjet
    gael=[(296,-74),(334,-28),(338,22),(318,58),(292,74)],
    forgael=[(244,-64),(272,-14),(262,42)],
    sidelinje=[(340,-30),(480,-24),(620,-16),(760,-10)],

    farver=dict(
        hud=[('0','#2E3D1C'), ('.22','#4E6A2A'), ('.48','#7C9243'),
             ('.74','#C3C078'), ('1','#F7EFD6')],
        hud_top=-96, hud_bund=82,
        ror=('#DC9440', '#B4632A'), finne='#7E8C46', bryst='#C9C078',
        oeje='#E8C24A', baand='#2C3E17', plet='#F4EAB0', skael='#FFFFFF'),

    amp=30.0, boelge=1500.0, tempo=1.1,
    ramme=(1120, 440), snude=(1070, 220),
)

if __name__ == '__main__':
    GEDDE.byg(os.path.dirname(os.path.abspath(__file__)))
