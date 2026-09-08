#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Skallen (Rutilus rutilus).

    python3 Assets/sprites/skalle/byg.py

Søens almindeligste fredfisk og aborrens og geddens vigtigste bytte.
Kendetegnene: den slanke sølvblanke krop med tydelige skæl, det lille hoved
med den lille endestillede mund, det **røde øje** — og de orangerøde bug- og
gatfinner. Én rygfinne, som begynder lige over bugfinnerne.
Skabelonen står i ../fisk.py.
"""

import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from fisk import Fisk

SKALLE = Fisk(
    navn='skalle', dansk='Skalle', art='Rutilus rutilus', titel='Skalle, svømmende',

    ryg=[(0,-12),(40,-58),(96,-96),(170,-120),(260,-134),(360,-136),
         (455,-128),(548,-112),(645,-88),(715,-64),(780,-42),(824,-28)],
    bug=[(0,12),(44,54),(110,90),(196,112),(296,120),(396,116),
         (490,102),(582,82),(672,60),(732,44),(794,30),(824,22)],

    halerod=(760, -4),
    halefinne=[(0,-48),(96,-104),(200,-126),(150,-46),(112,0),
               (150,44),(200,124),(96,102),(0,42)],

    finner=[
        dict(navn='ryg', u0=400, u1=560, hoejde=104, form=0.95, slank=0.32,
             straaler=11, nedad=False, farve='finne'),
        dict(navn='gat', u0=618, u1=740, hoejde=88, form=1.00, slank=0.32,
             straaler=10, nedad=True,  farve='ror'),
        dict(navn='bug', u0=398, u1=468, hoejde=88, form=1.10, slank=0.50,
             straaler=7,  nedad=True,  farve='ror'),
    ],

    bryst_faeste=(176, 6),
    brystfinne=[(0,-26),(40,-14),(96,24),(134,76),(84,88),(32,62),(2,22)],

    oeje=(72, -52, 26),
    mund=[(-2,-6),(30,4),(60,16)],
    gael=[(112,-100),(150,-52),(156,12),(140,66),(116,90)],
    forgael=[(78,-92),(108,-30),(100,40)],
    sidelinje=[(176,-54),(320,-50),(460,-40),(600,-26),(740,-14)],
    skael=(46, 30),

    farver=dict(
        hud=[('0','#34505C'), ('.24','#6E8892'), ('.50','#B3C4C6'),
             ('.74','#E9EFEC'), ('1','#FFFDF6')],
        hud_top=-140, hud_bund=124,
        ror=('#F08A4A', '#D2401F'), finne='#9FAEB2', bryst='#B9C6CB',
        oeje='#E4462B', baand='#2C3E17', plet='#1D2A12', skael='#FFFFFF'),

    amp=34.0, boelge=1200.0, tempo=2.2,
    ramme=(1120, 560), snude=(1070, 290),
)

if __name__ == '__main__':
    SKALLE.byg(os.path.dirname(os.path.abspath(__file__)))
