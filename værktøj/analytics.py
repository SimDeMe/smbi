#!/usr/bin/env python3
"""Indsæt eller kontrollér Cloudflare Analytics på sitets offentlige HTML-sider."""

import argparse
from html.parser import HTMLParser
import json
import os
from pathlib import Path
import re
import subprocess


ROD = Path(__file__).resolve().parent.parent
# Lokalt Lectio-program, designudkast og interne Quarto-arbejdsdokumenter.
UDELAD_MAPPER = ("lectio-skema/", "smbi-design/")
UDELAD_FILER = {
    "Øvelser/Bio-C-forsog-oversigt.html",
    "Øvelser/Forsogsvejledninger.html",
    "Øvelser/LÆS-MIG.html",
    "Øvelser/Mappestruktur.html",
}


class Beacons(HTMLParser):
    def __init__(self, tekst):
        super().__init__()
        self.scripts = []
        self.feed(tekst)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "script" and "cloudflareinsights.com/beacon.min.js" in attrs.get("src", ""):
            self.scripts.append(attrs)


def sider():
    if "QUARTO_PROJECT_OUTPUT_FILES" in os.environ:
        # Quarto-hooken behøver kun at behandle den netop byggede HTML.
        projekt = Path(os.environ["QUARTO_PROJECT_DIR"])
        filer = [str((projekt / sti).resolve().relative_to(ROD))
                 for sti in os.environ["QUARTO_PROJECT_OUTPUT_FILES"].splitlines() if sti]
    else:
        filer = subprocess.check_output(
            ["git", "ls-files", "--cached", "--others", "--exclude-standard", "-z"],
            cwd=ROD,
        ).decode().split("\0")
    for sti in sorted(set(filer)):
        if not sti.endswith(".html") or sti in UDELAD_FILER or sti.startswith(UDELAD_MAPPER):
            continue
        fil = ROD / sti
        if fil.is_file():
            tekst = fil.read_bytes().decode("utf-8")
            # HTML-fragmenter (bl.a. analytics.html og Quarto-includes) er ikke sider.
            if re.search(r"</body\s*>", tekst, re.I):
                yield fil, tekst


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="Kontrollér uden at ændre filer")
    args = parser.parse_args()
    snippet = (ROD / "analytics.html").read_text().strip()
    forventet = Beacons(snippet).scripts
    assert len(forventet) == 1, "analytics.html skal indeholde én Cloudflare-snippet"
    antal = 0
    fejl = []
    for fil, tekst in sider():
        antal += 1
        if "cloudflareinsights.com/beacon.min.js" in tekst:
            if tekst.count(snippet) == 1 and tekst.count("cloudflareinsights.com/beacon.min.js") == 1:
                continue
            scripts = Beacons(tekst).scripts
            try:
                gyldig = (
                    len(scripts) == 1
                    and scripts[0].get("src") == forventet[0]["src"]
                    and scripts[0].get("type") == "module"
                    and json.loads(scripts[0].get("data-cf-beacon", "null"))
                    == json.loads(forventet[0]["data-cf-beacon"])
                )
            except ValueError:
                gyldig = False
            if not gyldig:
                fejl.append(str(fil.relative_to(ROD)))
            continue
        if args.check:
            fejl.append(str(fil.relative_to(ROD)))
            continue
        linjeskift = "\r\n" if "\r\n" in tekst else "\n"
        slut = list(re.finditer(r"</body\s*>", tekst, re.I))[-1].start()
        tekst = tekst[:slut] + snippet + linjeskift + tekst[slut:]
        fil.write_bytes(tekst.encode("utf-8"))
    if fejl:
        print("Manglende, afvigende eller gentaget analytics:\n" + "\n".join(fejl))
        raise SystemExit(1)
    print(f"Analytics {'kontrolleret' if args.check else 'indsat'} på {antal} sider.")


if __name__ == "__main__":
    main()
