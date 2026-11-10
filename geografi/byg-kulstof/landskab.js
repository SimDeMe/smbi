// AI-genereret lærebogsillustration. Interaktive tekster og områder er et
// separat SVG-lag, så selve figuren kan vises rent og i fuld opløsning.
// Original og brief er dokumenteret i LÆS-MIG.md og illustration-prompt.md.
export const BREDDE = 1568;
export const HOEJDE = 1330;
const billede = new URL('./landskab-atmosfaere.webp',import.meta.url).href;
export const LANDSKAB = `
<defs><marker id="pilspids" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="3" markerHeight="3" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="context-stroke"/></marker></defs>
<image id="landskabsbillede" href="${billede}" x="0" y="0" width="${BREDDE}" height="${HOEJDE}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Et sammenhængende kystlandskab med åben atmosfære over trækronerne, skov, en bjergflod, industri og vulkan. Et snit viser rødder, sedimentære lag, kul, en olie- og gasfælde samt kalksten under kyst og hav."/>
`;
