#!/usr/bin/env python3
"""
Quarto post-render hook: forhindrer at tabeller i den genererede .docx bliver
delt af et sideskift, og sætter det korrekte fag/hold/dokumenttype ind i
sidehoved og -fod.

For hver tabel med mere end én række tilføjes:
  - <w:cantSplit/> på hver række, så en enkelt række aldrig deles midt over
    et sideskift.
  - <w:keepNext/> på alle rækker undtagen den sidste, så Word "limer" hver
    række til den næste. Så flytter Word hele tabellen samlet til næste side,
    i stedet for at dele den, hvis den ikke er der plads til den, hvor den
    står.

Fordi reference.docx's sidehoved/-fod indeholder almindelig, statisk tekst
(Word kan ikke selv slå Quarto-metadata som {{< meta fag >}} op, sådan som
HTML- og PDF-versionen kan), retter dette script bagefter sidehoved og -fod
i den genererede .docx, så de viser det fag/hold/doc-type, den enkelte
.qmd-fil rent faktisk er sat op med (med fald tilbage til projektets
_quarto.yml, hvis filen ikke selv angiver det).

Kører automatisk efter `quarto render` via `project.post-render` i
_quarto.yml — ingen manuel handling nødvendig. Rører kun ved .docx-filer;
PDF (Typst) og HTML har deres egen dynamiske sidehoved/-fod andetsteds i
skabelonen (page.typ / banner.html).
"""
import os
import re
import shutil
import sys
import tempfile
import zipfile
import xml.etree.ElementTree as ET

NS = {
    "w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
    "m": "http://schemas.openxmlformats.org/officeDocument/2006/math",
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
    "o": "urn:schemas-microsoft-com:office:office",
    "v": "urn:schemas-microsoft-com:vml",
    "w10": "urn:schemas-microsoft-com:office:word",
    "a": "http://schemas.openxmlformats.org/drawingml/2006/main",
    "pic": "http://schemas.openxmlformats.org/drawingml/2006/picture",
    "wp": "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing",
}
W = NS["w"]

for prefix, uri in NS.items():
    ET.register_namespace(prefix, uri)


def qn(tag):
    return f"{{{W}}}{tag}"


# ---------------------------------------------------------------------------
# Tabel-sideskift (uændret adfærd)
# ---------------------------------------------------------------------------

def fix_document_xml(xml_bytes):
    root = ET.fromstring(xml_bytes)
    changed = False

    for tbl in root.iter(qn("tbl")):
        rows = tbl.findall(qn("tr"))
        if len(rows) < 2:
            continue  # nothing to keep together in a one-row table

        for i, tr in enumerate(rows):
            trPr = tr.find(qn("trPr"))
            if trPr is None:
                trPr = ET.Element(qn("trPr"))
                tr.insert(0, trPr)
            if trPr.find(qn("cantSplit")) is None:
                trPr.insert(0, ET.Element(qn("cantSplit")))
                changed = True

            if i < len(rows) - 1:  # glue every row except the last to the next one
                for tc in tr.findall(qn("tc")):
                    for p in tc.findall(qn("p")):
                        pPr = p.find(qn("pPr"))
                        if pPr is None:
                            pPr = ET.Element(qn("pPr"))
                            p.insert(0, pPr)
                        if pPr.find(qn("keepNext")) is None:
                            pStyle = pPr.find(qn("pStyle"))
                            insert_at = 1 if pStyle is not None else 0
                            pPr.insert(insert_at, ET.Element(qn("keepNext")))
                            changed = True

    if not changed:
        return None
    body = ET.tostring(root, encoding="unicode")
    return ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' + body).encode("utf-8")


# ---------------------------------------------------------------------------
# Sidehoved/-fod: fag / hold / doc-type
# ---------------------------------------------------------------------------

def parse_flat_yaml_top_level(text):
    """Meget simpel parser: læser kun ikke-indenterede 'nøgle: værdi'-linjer
    fra en YAML-blok (dvs. topniveau-nøgler, uanset om værdien er citeret)."""
    out = {}
    for line in text.splitlines():
        if not line or line[0] in " \t-":
            continue  # indenteret / listeelement -> ikke et topniveau-felt
        m = re.match(r'^([A-Za-z][\w-]*):\s*(.*)$', line)
        if not m:
            continue
        key, val = m.group(1), m.group(2).strip()
        val = re.sub(r'\s*#.*$', '', val).strip()  # fjern evt. YAML-kommentar
        if len(val) >= 2 and val[0] == val[-1] and val[0] in "\"'":
            val = val[1:-1]
        out[key] = val
    return out


def read_qmd_frontmatter(qmd_path):
    try:
        with open(qmd_path, encoding="utf-8") as f:
            content = f.read()
    except OSError:
        return {}
    m = re.match(r'^---\s*\n(.*?)\n---\s*\n', content, re.S)
    if not m:
        return {}
    return parse_flat_yaml_top_level(m.group(1))


def read_project_defaults(project_dir):
    path = os.path.join(project_dir, "_quarto.yml")
    try:
        with open(path, encoding="utf-8") as f:
            content = f.read()
    except OSError:
        return {}
    return parse_flat_yaml_top_level(content)


def resolve_metadata(docx_rel_path, project_dir):
    qmd_rel = re.sub(r'\.docx$', '.qmd', docx_rel_path, flags=re.I)
    qmd_path = os.path.join(project_dir, qmd_rel)
    doc_meta = read_qmd_frontmatter(qmd_path)
    proj_meta = read_project_defaults(project_dir)
    merged = dict(proj_meta)
    merged.update(doc_meta)
    return {
        "fag": merged.get("fag", ""),
        "hold": merged.get("hold", ""),
        "doc-type": merged.get("doc-type", "Øvelsesvejledning"),
    }


def _meaningful_text_runs(root):
    """Alle <w:t> i dokumentrækkefølge, undtagen rene tabulator-/blanke runs."""
    return [t for t in root.iter(qn("t")) if (t.text or "").strip() != ""]


def patch_header_xml(xml_bytes, fag, hold):
    root = ET.fromstring(xml_bytes)
    runs = _meaningful_text_runs(root)
    if len(runs) < 2:
        return None
    runs[0].text = fag.upper()
    runs[1].text = hold
    body = ET.tostring(root, encoding="unicode")
    return ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' + body).encode("utf-8")


def patch_footer_xml(xml_bytes, doc_type):
    root = ET.fromstring(xml_bytes)
    runs = _meaningful_text_runs(root)
    if len(runs) < 1:
        return None
    runs[0].text = doc_type
    body = ET.tostring(root, encoding="unicode")
    return ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' + body).encode("utf-8")


def process_docx(path, meta):
    with zipfile.ZipFile(path, "r") as z:
        names = z.namelist()
        doc_xml = z.read("word/document.xml") if "word/document.xml" in names else None
        headers = {n: z.read(n) for n in names if re.match(r"word/header\d+\.xml$", n)}
        footers = {n: z.read(n) for n in names if re.match(r"word/footer\d+\.xml$", n)}

    replacements = {}

    if doc_xml is not None:
        fixed = fix_document_xml(doc_xml)
        if fixed is not None:
            replacements["word/document.xml"] = fixed

    for name, xml_bytes in headers.items():
        try:
            fixed = patch_header_xml(xml_bytes, meta["fag"], meta["hold"])
        except ET.ParseError:
            fixed = None
        if fixed is not None:
            replacements[name] = fixed

    for name, xml_bytes in footers.items():
        try:
            fixed = patch_footer_xml(xml_bytes, meta["doc-type"])
        except ET.ParseError:
            fixed = None
        if fixed is not None:
            replacements[name] = fixed

    if not replacements:
        return False

    tmp_fd, tmp_path = tempfile.mkstemp(suffix=".docx", dir=os.path.dirname(os.path.abspath(path)))
    os.close(tmp_fd)
    try:
        with zipfile.ZipFile(path, "r") as zin, zipfile.ZipFile(tmp_path, "w", zipfile.ZIP_DEFLATED) as zout:
            for item in zin.infolist():
                data = zin.read(item.filename)
                if item.filename in replacements:
                    data = replacements[item.filename]
                zout.writestr(item, data)
        shutil.move(tmp_path, path)
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
    return True


def main():
    out_files_raw = os.environ.get("QUARTO_PROJECT_OUTPUT_FILES", "")
    project_dir = os.environ.get("QUARTO_PROJECT_DIR", ".")
    targets = [f for f in out_files_raw.splitlines() if f.strip().lower().endswith(".docx")]

    if not targets:
        return

    for rel in targets:
        path = rel if os.path.isabs(rel) else os.path.join(project_dir, rel)
        if not os.path.exists(path):
            continue
        meta = resolve_metadata(rel, project_dir)
        try:
            if process_docx(path, meta):
                print(f"[fix-docx-tables] Rettede tabeller/sidehoved i: {rel} "
                      f"(fag={meta['fag']!r}, hold={meta['hold']!r}, doc-type={meta['doc-type']!r})")
        except Exception as e:  # never fail the render because of this
            print(f"[fix-docx-tables] Kunne ikke rette {rel}: {e}", file=sys.stderr)


if __name__ == "__main__":
    main()
