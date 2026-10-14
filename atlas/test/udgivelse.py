"""Kontroller Pages-artefakt: versionsstempel og uændrede eksisterende webfiler."""
import filecmp
import os
from pathlib import Path
import re
import subprocess
import sys

repo = Path(__file__).resolve().parents[2]
ud = Path(sys.argv[1]).resolve()


def git(*argumenter):
    return subprocess.run(['git', '-C', str(repo), *argumenter], check=True,
                          capture_output=True, text=True).stdout.strip()


html = (ud / 'atlas/index.html').read_text(encoding='utf-8')
nummer = int(git('rev-list', '--first-parent', '--count', 'HEAD'))
revision = git('rev-parse', 'HEAD')
assert f'>v{nummer}</a>' in html and f'/commit/{revision}' in html, 'Forkert udgivet atlasversion'
moenster = r'<!-- atlas-version:start -->.*?<!-- atlas-version:end -->'
assert re.sub(moenster, '', html, flags=re.DOTALL) == re.sub(
    moenster, '', (repo / 'atlas/index.html').read_text(encoding='utf-8'), flags=re.DOTALL), 'Atlas-HTML blev ændret ud over versionsstemplet'

webtyper = {'.html', '.js', '.css', '.json', '.svg', '.png', '.jpg', '.jpeg', '.gif',
            '.webp', '.ico', '.woff', '.woff2', '.pdf', '.docx', '.wasm'}
antal = 0
for navn in git('ls-files', '-z').split('\0'):
    sti = Path(navn)
    if not navn or navn == 'atlas/index.html' or sti.suffix.lower() not in webtyper:
        continue
    # Pages udelader skjulte filer og Jekyll/Quarto-kildemapper med underscore.
    if any(delsti.startswith(('.', '_')) for delsti in sti.parts):
        continue
    kilde = repo / sti
    if kilde.is_symlink():
        continue
    assert (ud / sti).is_file(), f'Manglende offentlig fil: {sti}'
    assert filecmp.cmp(kilde, ud / sti, shallow=False), f'Ændret webfil: {sti}'
    antal += 1

# Den officielle Pages-bygning udelader CNAME fra artefaktet. Domænet
# ligger i repositoryets Pages-indstilling, som configure-pages læser.
assert (repo / 'CNAME').read_text().strip() == 'smbi.dk', 'Forkert domæne i kilden'
if os.environ.get('PAGES_HOST'):
    assert os.environ['PAGES_HOST'] == 'smbi.dk', 'Forkert domæne i Pages-indstillingen'
print(f'Atlas v{nummer} ({revision[:7]}) og {antal} uændrede webfiler: OK')
