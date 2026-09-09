// Palette (kept in sync with styles.scss / reference.docx)
#let ink = rgb("#26332B")
#let muted = rgb("#6B7A66")
#let rule-color = rgb("#A9BBA1")

#set page(
  paper: $if(papersize)$"$papersize$"$else$"a4"$endif$,
$if(margin-geometry)$
  // Margins handled by marginalia.setup below
$elseif(margin)$
  margin: ($for(margin/pairs)$$margin.key$: $margin.value$,$endfor$),
$else$
  margin: (x: 1.25in, y: 1.25in),
$endif$
  numbering: $if(page-numbering)$"$page-numbering$"$else$none$endif$,
  columns: $if(columns)$$columns$$else$1$endif$,
  header: block(width: 100%, below: 0pt)[
    #set text(size: 8.5pt, fill: muted, tracking: 1pt, weight: "bold")
    #grid(
      columns: (1fr, 1fr),
      align(left)[$if(fag)$#upper("$fag$")$endif$],
      align(right)[$if(hold)$$hold$$endif$],
    )
    #v(-2pt)
    #line(length: 100%, stroke: 0.6pt + rule-color)
  ],
  footer: context [
    #set text(size: 8.5pt, fill: muted)
    #line(length: 100%, stroke: 0.6pt + rule-color)
    #v(2pt)
    #grid(
      columns: (1fr, 1fr),
      align(left)[#emph[$if(doc-type)$$doc-type$$else$Øvelsesvejledning$endif$]],
      align(right)[Side #counter(page).display() af #counter(page).final().at(0, default: 1)],
    )
  ],
)
$if(logo)$
#set page(background: align($logo.location$, box(inset: $logo.inset$, image("$logo.path$", width: $logo.width$$if(logo.alt)$, alt: "$logo.alt$"$endif$))))
$endif$
$if(margin-geometry)$
// Configure marginalia page geometry (functions defined in definitions.typ)
#show: marginalia.setup.with(
  inner: (
    far: $margin-geometry.inner.far$,
    width: $margin-geometry.inner.width$,
    sep: $margin-geometry.inner.separation$,
  ),
  outer: (
    far: $margin-geometry.outer.far$,
    width: $margin-geometry.outer.width$,
    sep: $margin-geometry.outer.separation$,
  ),
  top: $if(margin.top)$$margin.top$$else$1.25in$endif$,
  bottom: $if(margin.bottom)$$margin.bottom$$else$1.25in$endif$,
  book: false,
  clearance: $margin-geometry.clearance$,
)
$endif$

// Section headings: left accent bar, forest-green, bold (matches the Word/HTML template)
#show heading.where(level: 1): it => {
  block(above: 1.6em, below: 0.9em, breakable: false)[
    #box(width: 3pt, height: 1em, fill: rgb("#3F5F3A"), baseline: 15%)
    #h(7pt)
    #text(fill: rgb("#2C4527"), weight: "bold", size: 1.25em)[#it.body]
  ]
}
#show heading.where(level: 2): it => {
  text(fill: rgb("#3F5F3A"), weight: "bold", size: 1.05em)[#it.body]
}

// Data tables: dark green header row, subtle striping, generous padding,
// full grid lines so each cell is visibly its own box (important for
// fill-in-by-hand result tables) — matches the Word/HTML version.
#set table(
  inset: (x: 8pt, y: 7pt),
  stroke: (x, y) => (
    top: if y == 0 { 0.75pt + rgb("#3F5F3A") } else { 0.5pt + rgb("#C7D0C0") },
    bottom: 0.5pt + rgb("#8FA085"),
    left: 0.5pt + rgb("#C7D0C0"),
    right: 0.5pt + rgb("#C7D0C0"),
  ),
  fill: (x, y) => if y == 0 { rgb("#3F5F3A") } else if calc.odd(y) { rgb("#F5F7F2") } else { white },
)
#show table.cell.where(y: 0): set text(fill: white, weight: "bold")
#show table.cell: it => {
  if it.y == 0 { align(horizon, it) } else { it }
}

// Don't split a table across a page break — push the whole table to the
// next page instead if it doesn't fit where it is.
#show table: it => block(breakable: false, it)
