#!/usr/bin/env bash
# render-alle.sh — renderer alle øvelsesvejledninger til PDF, Word og HTML.
#
#   ./render-alle.sh              alle 26 vejledninger
#   ./render-alle.sh osmose       kun dem, hvis sti indeholder «osmose»
#   ./render-alle.sh Geografi     kun geografi-øvelserne
#
# Kun .qmd-filerne under Biologi/ og Geografi/ røres. Et bart «quarto render»
# her i mappen ville også tage LÆS-MIG.md, Mappestruktur.md og de andre
# arbejdsdokumenter med og give dem .pdf- og .docx-udgaver, de ikke skal have.
#
# En vejledning, der fejler, stopper ikke de andre — fejlene samles til sidst.

cd "$(dirname "$0")" || exit 1

filter="${1:-}"
formater=(typst docx html)          # typst giver PDF'en
log="$(mktemp)"
trap 'rm -f "$log"' EXIT

antal=0
fejlede=()

# «1 vejledning», ikke «1 vejledninger»
flertal(){ [ "$1" -eq 1 ] && echo "vejledning" || echo "vejledninger"; }

for qmd in Biologi/*/*.qmd Geografi/*/*.qmd; do
  [ -e "$qmd" ] || continue
  [ -n "$filter" ] && [[ "$qmd" != *"$filter"* ]] && continue

  mappe="$(dirname "$qmd")"
  fil="$(basename "$qmd")"
  antal=$((antal + 1))
  printf '\n── %s\n' "$mappe"

  for format in "${formater[@]}"; do
    printf '   %-6s ' "$format"
    if (cd "$mappe" && quarto render "$fil" --to "$format") >"$log" 2>&1; then
      echo "ok"
    else
      echo "FEJL"
      fejlede+=("$mappe → $format")
      sed 's/^/        /' "$log" | tail -12      # nok til at se hvad der gik galt
    fi
  done
done

echo
if [ "$antal" -eq 0 ]; then
  echo "Ingen vejledninger passede på «$filter»."
  exit 1
fi

if [ "${#fejlede[@]}" -eq 0 ]; then
  echo "$antal $(flertal "$antal") renderet i tre formater."
else
  echo "$antal $(flertal "$antal") forsøgt — ${#fejlede[@]} render fejlede:"
  printf '   %s\n' "${fejlede[@]}"
  exit 1
fi
