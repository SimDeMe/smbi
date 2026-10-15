#!/usr/bin/env python3
"""Danner vulkaner.json fra Smithsonians Global Volcanism Program (GVP),
Volcanoes of the World: alle vulkaner med udbrud eller aktivitet i holocæn
(de seneste ca. 11 700 år).

Brug:  python3 -I atlas/data/vulkaner.py [holocene.json]

Uden fil hentes laget Smithsonian_VOTW_Holocene_Volcanoes som GeoJSON fra
GVP's WFS-tjeneste og gemmes i raa-gvp/ ved siden af scriptet (ikke i git).

Bearbejdning: koordinater afrundes til 0,01°; GVP's vulkantyper samles i ni
danske typer; den tektoniske placering samles i subduktion, rift og
intraplade. Sidste udbrud er GVP's år (negativt = f.Kr.), eller null, hvis
GVP ikke kender et dateret udbrud.
  [navn, lon, lat, type, placering, sidste_udbrud, land, højde_m]
"""
import hashlib, json, sys, urllib.request
from pathlib import Path

ADRESSE = ('https://webservices.volcano.si.edu/geoserver/GVP-VOTW/ows?service=WFS&version=2.0.0'
           '&request=GetFeature&typeName=GVP-VOTW:Smithsonian_VOTW_Holocene_Volcanoes'
           '&outputFormat=application/json')

TYPER = {
    'stratovulkan': ['Stratovolcano', 'Stratovolcano(es)', 'Stratovolcano?'],
    'skjoldvulkan': ['Shield', 'Shield(s)', 'Shield(pyroclastic)'],
    'vulkanfelt': ['Volcanic field'],
    'kaldera': ['Caldera', 'Caldera(s)'],
    'sprækker': ['Fissure vent', 'Fissure vent(s)', 'Crater rows'],
    'kegle eller krater': ['Pyroclastic cone', 'Pyroclastic cone(s)', 'Cone', 'Lava cone',
                           'Lava cone(es)', 'Tuff cone', 'Tuff cone(s)', 'Tuff ring(s)',
                           'Maar', 'Maar(s)', 'Explosion crater(s)'],
    'lavadom': ['Lava dome', 'Lava dome(s)'],
    'sammensat': ['Complex', 'Compound'],
}
TYPE = {gvp: dansk for dansk, liste in TYPER.items() for gvp in liste}
PLACERING = {'Subduction zone': 'subduktion', 'Rift zone': 'rift', 'Intraplate': 'intraplade'}


def main():
    if len(sys.argv) > 1:
        fil = Path(sys.argv[1])
    else:
        mappe = Path(__file__).with_name('raa-gvp')
        mappe.mkdir(exist_ok=True)
        fil = mappe / 'holocene-volcanoes.json'
        if not fil.exists():
            with urllib.request.urlopen(ADRESSE, timeout=300) as svar:
                fil.write_bytes(svar.read())
    print(fil.name, hashlib.sha256(fil.read_bytes()).hexdigest())
    vulkaner = []
    for f in json.loads(fil.read_text())['features']:
        p = f['properties']
        lon, lat = f['geometry']['coordinates']
        placering = (p['Tectonic_Setting'] or '').split(' / ')[0]
        vulkaner.append([
            p['Volcano_Name'], round(lon, 2), round(lat, 2),
            TYPE.get(p['Primary_Volcano_Type'], 'ukendt'),
            PLACERING.get(placering, 'ukendt'),
            p['Last_Eruption_Year'], p['Country'], p['Elevation'],
        ])
    vulkaner.sort(key=lambda v: (v[5] is not None, v[5] or 0))
    ud = {
        'kilde': 'Smithsonian Institution, Global Volcanism Program: Volcanoes of the World, holocæne vulkaner',
        'felter': ['navn', 'lon', 'lat', 'type', 'placering', 'sidste udbrud (år)', 'land', 'højde (m)'],
        'vulkaner': vulkaner,
    }
    sti = Path(__file__).with_name('vulkaner.json')
    sti.write_text(json.dumps(ud, separators=(',', ':'), ensure_ascii=False))
    print(len(vulkaner), 'vulkaner;', sti.stat().st_size // 1000, 'kB')


if __name__ == '__main__':
    main()
