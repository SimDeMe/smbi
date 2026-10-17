"""Afprøv Havniveau ved kysten: punkter, klasser, aflæsning med graf og dialog."""
from lagmenu_hjaelp import aabn_lag, luk_lag
import json
from pathlib import Path
from playwright.sync_api import expect
from piletaster import billede
from klimalag import punkt_paa_skaerm

DATA = Path(__file__).parents[1] / 'data'


def afproev_havniveau(side, ud):
    luk_lag(side)
    data = json.loads((DATA / 'havniveau.json').read_text())
    knap, signatur = side.locator('#havniveaulag'), side.locator('#havniveausignatur')
    aflaesning = side.locator('#havniveauaflaesning')
    side.get_by_role('button', name='Nulstil', exact=True).click()
    foer = billede(side)
    aabn_lag(side, knap).click()
    luk_lag(side)
    expect(knap).to_have_attribute('aria-pressed', 'true')
    expect(signatur).to_be_visible()
    assert billede(side) != foer, 'Stationerne tegnes ikke'
    raekker = side.locator('#havniveauklasser li')
    expect(raekker).to_have_count(7)
    antal = [int(t) for t in raekker.locator('small').all_inner_texts()]
    assert sum(antal) == len(data['stationer']), antal
    expect(side.locator('#havniveaunote')).to_contain_text(f"{len(data['stationer'])} stationer")
    assert 'PSMSL' in side.locator('#globus').get_attribute('aria-label')
    expect(aflaesning).to_have_text('Midt på globussen: ingen målestation lige her')
    expect(side.locator('#havniveaugraf polyline')).to_have_count(0)
    if side.viewport_size['width'] >= 900:
        # Brest (Bretagne) ligger frit, uden andre stationer tæt på.
        brest = next(s for s in data['stationer'] if s['navn'] == 'Brest')
        side.mouse.move(*punkt_paa_skaerm(side, brest['punkt']))
        expect(aflaesning).to_contain_text('Ved markøren: Brest: +')
        expect(side.locator('#havniveaugraf polyline')).to_have_count(1)
        side.mouse.move(*punkt_paa_skaerm(side, [-30, 40]))
        expect(side.locator('#havniveaugraf polyline')).to_have_count(0)
    maal = side.evaluate('''() => {
      const r = document.querySelector('#havniveausignatur').getBoundingClientRect();
      const kontroller = [...document.querySelectorAll('.betjeningslinje button, .vaerktoejer button')].map(k => k.getBoundingClientRect());
      const overlap = kontroller.some(k => !(k.right <= r.left || k.left >= r.right || k.bottom <= r.top || k.top >= r.bottom));
      return {overlap, vandret: document.documentElement.scrollWidth - innerWidth};
    }''')
    assert not maal['overlap'] and maal['vandret'] == 0, maal
    side.screenshot(path=str(ud / f"havniveau-{side.viewport_size['width']}x{side.viewport_size['height']}.png"))
    side.locator('#havniveauopgave').click()
    expect(side.locator('#dialogtitel')).to_have_text('Undersøg havniveauet')
    side.keyboard.press('Escape')
    aabn_lag(side, knap).click()
    luk_lag(side)
    expect(knap).to_have_attribute('aria-pressed', 'false')
    expect(signatur).to_be_hidden()
