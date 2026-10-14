#!/usr/bin/env python3
"""Stempl kun den byggede atlas-header med antal commits på mains hovedlinje.

python3 atlas/versionsnummer.py _site/atlas/index.html
Kildetræet og Git-historikken ændres ikke. Ingen API-kald i elevens browser.
"""
import argparse
from pathlib import Path
import re
import subprocess


def stempl(fil, repo):
    def git(*argumenter):
        return subprocess.run(['git', '-C', str(repo), *argumenter], check=True,
                              capture_output=True, text=True).stdout.strip()

    if git('rev-parse', '--is-shallow-repository') != 'false':
        raise ValueError('Versionsnummer kræver fuld Git-historik (fetch-depth: 0)')
    nummer = int(git('rev-list', '--first-parent', '--count', 'HEAD'))
    revision = git('rev-parse', 'HEAD')
    if nummer < 1 or not re.fullmatch(r'[0-9a-f]{40}', revision):
        raise ValueError('Ugyldig Git-version')
    start, slut = '<!-- atlas-version:start -->', '<!-- atlas-version:end -->'
    tekst = fil.read_text(encoding='utf-8')
    if tekst.count(start) != 1 or tekst.count(slut) != 1:
        raise ValueError('Forventede ét versionsmærke i den byggede atlas-header')
    maerke = (f'<a id="atlas-version" class="atlas-version" '
              f'href="https://github.com/SimDeMe/smbi/commit/{revision}" '
              f'aria-label="Atlasversion {nummer}" title="Commit {revision[:7]}">v{nummer}</a>')
    udgave, antal = re.subn(re.escape(start) + r'.*?' + re.escape(slut),
                          lambda _: start + maerke + slut, tekst, flags=re.DOTALL)
    if antal != 1:
        raise ValueError('Versionsmærkerne står i forkert rækkefølge')
    fil.write_text(udgave, encoding='utf-8')
    return nummer, revision


if __name__ == '__main__':
    argumenter = argparse.ArgumentParser(description=__doc__)
    argumenter.add_argument('html', type=Path)
    argumenter.add_argument('--repo', type=Path, default=Path(__file__).resolve().parents[1])
    valg = argumenter.parse_args()
    nummer, revision = stempl(valg.html, valg.repo)
    print(f'Atlas v{nummer} ({revision[:7]}) → {valg.html}')
