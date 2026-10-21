"""Build local overview maps from downloaded, public source rasters.
Usage: python3 atlas/data/naturraster.py relief.zip vegetation.png vegetation.xml
Requires Pillow. Source URLs and sampling are documented in naturraster.LICENSE.
"""
from pathlib import Path
import sys, zipfile, json, shutil
import xml.etree.ElementTree as ET
from PIL import Image


def build(relief_zip, vegetation_png, colour_xml):
    out = Path(__file__).parent
    Image.MAX_IMAGE_PIXELS = None  # Known Natural Earth global TIFF (16200 × 8100).
    with zipfile.ZipFile(relief_zip) as archive:
        with Image.open(archive.open('HYP_LR_SR_OB_DR.tif')) as source:
            source.resize((5400, 2700), Image.Resampling.LANCZOS).convert('RGB').save(
                out / 'relief.jpg', quality=90, optimize=True)
    with Image.open(vegetation_png) as source:
        assert source.size == (3600, 1800), 'Expected 0.1 degree global map'
    shutil.copyfile(vegetation_png, out / 'vegetation.png')
    names = ['Stedsegrøn nåleskov', 'Stedsegrøn løvskov', 'Løvfældende nåleskov',
             'Løvfældende løvskov', 'Blandet skov', 'Tæt buskvegetation', 'Åben buskvegetation',
             'Træsavanne', 'Savanne', 'Græsland', 'Vådområder', 'Landbrug', 'Byområder',
             'Landbrug og naturlig vegetation', 'Sne og is',
             'Bar jord og sparsom vegetation (bl.a. ørken)', 'Vand', 'Uklassificeret']
    entries = ET.parse(colour_xml).findall('.//LegendEntry')
    assert len(entries) == len(names)
    classes = [{'navn': name, 'rgb': list(map(int, entry.attrib['rgb'].split(',')))}
               for name, entry in zip(names, entries)]
    (out / 'vegetation-klasser.json').write_text(json.dumps(classes, ensure_ascii=False, separators=(',', ':')) + '\n')


if __name__ == '__main__':
    build(*sys.argv[1:])
