/* ─────────────────────────────────────────────────────────
   Registret over de 24 faglige spørgsmål.
   Et nyt spørgsmål er én ny fil i ./emner/ plus én linje her.
   ───────────────────────────────────────────────────────── */
import blodpropIHjertet      from './emner/01-blodprop-i-hjertet.js';
import astma                 from './emner/02-astma.js';
import diabetes              from './emner/03-diabetes.js';
import krampeanfald          from './emner/04-krampeanfald.js';
import knoglebrud            from './emner/05-knoglebrud.js';
import forstuvning           from './emner/06-forstuvning.js';
import forbraending          from './emner/07-forbraending.js';
import underafkoeling        from './emner/08-underafkoeling.js';
import hovedskader           from './emner/09-hovedskader.js';
import nakkeOgRygsoejle      from './emner/10-nakke-og-rygsoejle.js';
import kredsloebssvigt       from './emner/11-kredsloebssvigt.js';
import hovedpunkterOgAbc     from './emner/12-hovedpunkter-og-abc.js';
import overlevelseskaeden    from './emner/13-overlevelseskaeden.js';
import psykiskFoerstehjaelp  from './emner/14-psykisk-foerstehjaelp.js';
import hjertestarter         from './emner/15-hjertestarter.js';
import trafikulykker         from './emner/16-trafikulykker.js';
import hjertetOgKredsloebet  from './emner/17-hjertet-og-kredsloebet.js';
import luftvejene            from './emner/18-luftvejene.js';
import centralnervesystemet  from './emner/19-centralnervesystemet.js';
import stroke                from './emner/20-stroke.js';
import genoplivningBoern     from './emner/21-genoplivning-boern-voksne.js';
import agonalVejrtraekning   from './emner/22-agonal-vejrtraekning.js';
import massiveBloedninger    from './emner/23-massive-bloedninger.js';
import drukning              from './emner/24-drukning.js';

export default [
  blodpropIHjertet, astma, diabetes, krampeanfald,
  knoglebrud, forstuvning, forbraending, underafkoeling,
  hovedskader, nakkeOgRygsoejle, kredsloebssvigt, hovedpunkterOgAbc,
  overlevelseskaeden, psykiskFoerstehjaelp, hjertestarter, trafikulykker,
  hjertetOgKredsloebet, luftvejene, centralnervesystemet, stroke,
  genoplivningBoern, agonalVejrtraekning, massiveBloedninger, drukning
];
