#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Bygger alle sprites om.

    python3 Assets/sprites/byg-alle.py

Kør den, når noget i tegn.py, fisk.py eller plante.py er ændret — ellers er
det nok at køre den enkelte figurs byg.py.
"""

import os, runpy

MAPPE = os.path.dirname(os.path.abspath(__file__))

for navn in sorted(os.listdir(MAPPE)):
    sti = os.path.join(MAPPE, navn, 'byg.py')
    if os.path.isfile(sti):
        runpy.run_path(sti, run_name='__main__')
