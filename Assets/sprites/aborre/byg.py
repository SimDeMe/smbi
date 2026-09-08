#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Aborren (Perca fluviatilis).

    python3 Assets/sprites/aborre/byg.py

Kendetegnene er med med vilje: den høje ryg, de to rygfinner med den sorte
plet bagerst i den pigstrålede, de syv mørke tværbånd og de orangerøde bug-,
gat- og halefinner. Skabelonen står i ../fisk.py.
"""

import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from fisk import Fisk

ABORRE = Fisk(
    navn='aborre', dansk='Aborre', art='Perca fluviatilis', titel='Aborre, svømmende',

    # kropsranden: (u, y) fra snuden mod haleroden
    ryg=[(0,-16),(42,-70),(104,-116),(176,-146),(258,-160),(340,-162),
         (430,-152),(520,-134),(624,-104),(706,-72),(772,-46),(816,-30)],
    bug=[(0,12),(48,60),(118,100),(198,124),(292,132),(392,127),
         (486,113),(580,92),(670,68),(730,50),(790,32),(816,24)],

    halerod=(752, -6),
    halefinne=[(0,-52),(104,-100),(206,-118),(160,-44),(126,0),
               (160,44),(206,116),(104,98),(0,42)],

    # de to rygfinner, gatfinnen og bugfinnen
    finner=[
        dict(navn='ryg1', u0=246, u1=512, hoejde=112, form=0.78, slank=0.30,
             straaler=13, nedad=False, farve='finne'),
        dict(navn='ryg2', u0=552, u1=706, hoejde=88, form=1.00, slank=0.26,
             straaler=11, nedad=False, farve='finne'),
        dict(navn='gat',  u0=584, u1=700, hoejde=82, form=1.05, slank=0.30,
             straaler=9,  nedad=True,  farve='ror'),
        dict(navn='bug',  u0=248, u1=322, hoejde=86, form=1.10, slank=0.42,
             straaler=6,  nedad=True,  farve='ror'),
    ],
    finneplet=('ryg1', 478, 26, 30, 22),      # den sorte plet i pigfinnen

    bryst_faeste=(206, 4),
    brystfinne=[(0,-30),(44,-16),(106,26),(148,84),(92,96),(36,68),(2,24)],

    baand=[198,278,358,438,518,598,678],
    oeje=(88, -58, 27),
    mund=[(-4,0),(38,16),(84,32)],
    gael=[(134,-118),(180,-64),(188,10),(168,76),(140,104)],
    forgael=[(92,-106),(126,-34),(116,48)],
    sidelinje=[(200,-68),(330,-62),(470,-48),(610,-32),(740,-18)],

    farver=dict(
        hud=[('0','#3D5A21'), ('.26','#6D8C33'), ('.52','#A9BC63'),
             ('.74','#E4DFB4'), ('1','#FFF9EE')],
        hud_top=-166, hud_bund=132,
        ror=('#F2A03F', '#E24C22'), finne='#A3B166', bryst='#F2D08A',
        oeje='#F0C94A', baand='#2C3E17', plet='#1D2A12', skael='#FFFFFF'),

    tempo=1.8,
)

if __name__ == '__main__':
    ABORRE.byg(os.path.dirname(os.path.abspath(__file__)))
