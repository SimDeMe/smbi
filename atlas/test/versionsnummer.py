"""Kontroller automatisk versionsstigning i en isoleret Git-historik."""
from pathlib import Path
import subprocess
import sys
import tempfile

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from versionsnummer import stempl


def git(repo, *argumenter):
    return subprocess.run(['git', '-C', str(repo), '-c', 'user.name=Atlasprøve',
                           '-c', 'user.email=atlas-test@example.invalid', *argumenter],
                          check=True, capture_output=True, text=True).stdout.strip()


with tempfile.TemporaryDirectory(prefix='atlas-version-') as mappe:
    rod = Path(mappe)
    repo = rod / 'repo'
    repo.mkdir()
    git(repo, 'init', '-b', 'main')
    kilde = repo / 'andet.txt'
    kilde.write_text('Første ændring uden for atlasset\n')
    git(repo, 'add', '.')
    git(repo, 'commit', '-m', 'Første commit')
    skabelon = (Path(__file__).resolve().parents[1] / 'index.html').read_text()
    html = rod / 'index.html'
    html.write_text(skabelon)
    nummer, revision = stempl(html, repo)
    assert nummer == 1 and '>v1</a>' in html.read_text()
    assert f'/commit/{git(repo, "rev-parse", "HEAD")}' in html.read_text()
    foerste = html.read_bytes()
    assert stempl(html, repo) == (nummer, revision)
    assert html.read_bytes() == foerste, 'Samme commit skal give samme version'

    kilde.write_text('Anden ændring, stadig uden for atlasset\n')
    git(repo, 'add', '.')
    git(repo, 'commit', '-m', 'Anden commit')
    nummer2, revision2 = stempl(html, repo)
    assert nummer2 == nummer + 1 and revision2 != revision
    assert '>v2</a>' in html.read_text()
    assert 'Atlasversion 2' in html.read_text()

    # En merge er én ny commit på mains hovedlinje.
    git(repo, 'switch', '-c', 'sidegren')
    (repo / 'side.txt').write_text('Sidegren\n')
    git(repo, 'add', '.')
    git(repo, 'commit', '-m', 'Ændring på sidegren')
    git(repo, 'switch', 'main')
    git(repo, 'merge', '--no-ff', 'sidegren', '-m', 'Flet sidegren')
    assert stempl(html, repo)[0] == 3
    assert int(git(repo, 'rev-list', '--count', 'HEAD')) == 4

    lav = rod / 'lav'
    subprocess.run(['git', 'clone', '--depth=1', repo.as_uri(), str(lav)], check=True, capture_output=True)
    foer = html.read_bytes()
    try:
        stempl(html, lav)
        raise AssertionError('En overfladisk historik blev accepteret')
    except ValueError as fejl:
        assert 'fuld Git-historik' in str(fejl)
    assert html.read_bytes() == foer
    html.write_text('<html>Versionsmærket mangler</html>')
    try:
        stempl(html, repo)
        raise AssertionError('Et manglende versionsmærke blev accepteret')
    except ValueError:
        pass
    assert html.read_text() == '<html>Versionsmærket mangler</html>'

print('Versionsstigning ved alle main-commits, merge, commitlink, gentagelse og fejltilstande: OK')
