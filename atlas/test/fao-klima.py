"""FAO-stationsdata: Somalia, datatabel, kildeforbehold og DWD-sammenligning."""
import os
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

adresse = os.environ.get('ATLAS_URL', 'http://127.0.0.1:8879')
ud = Path(os.environ.get('ATLAS_TEST_OUTPUT', '/tmp/smbi-fao-test'))
ud.mkdir(parents=True, exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH'))
    try:
        for w, h in [(1280, 577), (1366, 625), (1536, 730), (390, 750), (640, 625)]:
            side = browser.new_page(viewport={'width': w, 'height': h})
            fejl = []
            side.on('pageerror', lambda e: fejl.append(str(e)))
            side.goto(adresse + '/atlas/')
            side.get_by_role('button', name='Søg', exact=True).click()
            side.get_by_role('searchbox').fill('somalia')
            side.locator('.landeknapper button', has_text='Somalia').click()
            side.locator('[data-fane="klima"]').click()
            expect(side.locator('.stationskort')).to_have_count(4)
            expect(side.locator('.hydroterm .nedboer')).to_have_count(48)
            kort = side.locator('.stationskort').first
            expect(kort).to_contain_text('MOGADISCIO')
            expect(kort).to_contain_text('FAO SO25MGDS')
            expect(kort).not_to_contain_text('WMO undefined')
            expect(kort.locator('.periodeadvarsel')).to_contain_text('måleperiode ikke oplyst')
            expect(kort).to_contain_text('474 mm')
            expect(kort.get_by_role('link', name='Kilde: FAO CLIMWAT 2.0')).to_have_attribute('href', 'https://www.fao.org/land-water/land/land-governance-and-planning/land-resources-planning-toolbox/detail/climwat---climatic-database-to-be-used-with-cropwat/en')
            side.screenshot(path=str(ud / f'somalia-{w}.png'))
            kort.get_by_text('Tal i tabel', exact=True).click()
            expect(kort.locator('tbody tr')).to_have_count(12)
            expect(kort.locator('thead')).to_contain_text('Beregnet temperatur')
            expect(kort.locator('tbody tr').first).to_contain_text('26,6')
            assert side.locator('dialog').evaluate('e => e.scrollWidth <= e.clientWidth + 1')
            assert side.evaluate('document.documentElement.scrollWidth === innerWidth')
            kort.get_by_text('Tal i tabel', exact=True).click()
            side.get_by_role('button', name='Om data: klimadata for Somalia', exact=True).click()
            expect(side.locator('.oplysning-panel:visible')).to_contain_text('(middelminimum + middelmaksimum) / 2')
            expect(side.locator('.oplysning-panel:visible')).to_contain_text('ikke en dokumenteret 1991–2020-normal')
            side.keyboard.press('Escape')
            expect(side.locator('dialog')).to_be_visible()
            side.get_by_role('button', name='Sammenlign Somalia med et andet land').click()
            side.locator('#sammenlignvalg').get_by_role('button', name='Danmark', exact=True).click()
            expect(side.locator('.sammenligning-kolonne')).to_have_count(2)
            expect(side.locator('.sammenligning-kolonne').nth(1)).to_contain_text('WMO 06186')
            expect(side.locator('.sammenligning-kolonne').nth(1)).to_contain_text('1991–2020')
            assert side.locator('dialog').evaluate('e => e.scrollWidth <= e.clientWidth + 1')
            skalaer = side.locator('.hydroterm').evaluate_all('els => els.map(e => [...e.querySelectorAll(".nedboer-tal")].map(t => t.textContent).join(","))')
            assert len(set(skalaer)) == 1
            if w > 700:
                figurer = side.locator('.sammenligning-kolonne .stationskort:first-child .hydroterm')
                assert abs(figurer.nth(0).bounding_box()['y'] - figurer.nth(1).bounding_box()['y']) < 1
            side.screenshot(path=str(ud / f'sammenligning-{w}.png'))
            assert fejl == [], fejl
            side.close()
            print(f'FAO Somalia og Danmark: {w}×{h} OK', flush=True)
    finally:
        browser.close()
