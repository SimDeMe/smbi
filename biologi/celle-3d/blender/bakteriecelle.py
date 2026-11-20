# Bakteriecellen i Blender: en gramnegativ stavbakterie (E. coli-agtig), bygget fra bunden.
#
# Kør (Blender 5.x):
#   /Applications/Blender.app/Contents/MacOS/Blender -b --factory-startup \
#     --python biologi/celle-3d/blender/bakteriecelle.py -- <mappe>
# Scriptet gemmer <mappe>/Bakteriecelle.blend og <mappe>/Bakteriecelle.glb.
# Lys, verden og ribosomernes og DNA'ets materialer hentes fra plantecellens .blend,
# så bakterien hører til samme serie som dyrecellen og plantecellen.
#
# Mål: 1 enhed ≈ 160 nm. Cellen er ca. 16 enheder lang (2,5 µm) og 6,2 bred (1 µm).
# Cellehylsteret er gjort ca. 5 gange tykkere end i virkeligheden, så lagene kan ses.
# Hylsteret er skåret op i et vindue på toppen; lagene er skåret trinvis (kapslen lavest,
# cellemembranen højest), så hvert lag har sin egen synlige stribe.
import bpy, bmesh, math, sys, os
import numpy as np
from mathutils import Vector, Quaternion

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
UD = argv[0] if argv else os.path.expanduser('~/Pictures/Blender/bakteriecelle')
os.makedirs(UD, exist_ok=True)
PLANTE = os.path.expanduser('~/Pictures/Blender/plantecelle/Plantecelle.blend')
rng = np.random.default_rng(20261118)

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene

# ---------------------------------------------------------------- mål
H = 4.8                       # halv længde af den cylindriske del (langs x)
R = dict(cyto=2.48, im=(2.50, 2.64), peri=(2.66, 2.96), pg=(2.76, 2.86),
         om=(2.98, 3.12), kapsel=(3.16, 3.56))
# Snit: (højde, vinduets halve længde). Hvert lag udad er skåret lavere og længere.
SNIT = dict(im=(0.95, 3.6), pg=(0.6, 3.95), peri=(0.25, 4.3), om=(0.25, 4.3), kapsel=(-0.1, 4.65))
SE_Y, SE_P = 4.4, 4.0         # vinduets superellipse i planet: |x/X|^p + |y/Y|^p < 1


def akseafstand(p):
    """Afstand fra et punkt til cellens akse (stykket fra -H til H på x-aksen)."""
    p = np.asarray(p, float)
    x = np.clip(p[..., 0], -H, H)
    return np.sqrt((p[..., 0] - x) ** 2 + p[..., 1] ** 2 + p[..., 2] ** 2)


def i_vindue(p, lag, margen=0.0):
    z0, X = SNIT[lag]
    p = np.asarray(p, float)
    se = (np.abs(p[..., 0]) / (X + margen)) ** SE_P + (np.abs(p[..., 1]) / (SE_Y + margen)) ** SE_P
    return (p[..., 2] > z0 - margen) & (se < 1)


def normal_på_celle(x, theta):
    """Udadrettet normal på stavformen ved x og vinklen theta om aksen (0 = +y)."""
    d = Vector((0, math.cos(theta), math.sin(theta)))
    if abs(x) > H:
        d = Vector((x - math.copysign(H, x), math.cos(theta), math.sin(theta)))
    return d.normalized(), Vector((max(-H, min(H, x)), 0, 0))


# ---------------------------------------------------------------- samlinger
def samling(navn, forælder=None):
    c = bpy.data.collections.new(navn)
    (forælder or sc.collection).children.link(c)
    return c


C_LYS = samling('Lights_Cameras')
C_CELLE = samling('Bacterial_Cell')
C_HYLSTER = samling('Cell_Envelope', C_CELLE)
C_CYTO = samling('Cytoplasm', C_CELLE)
C_DNA = samling('Nucleoid_DNA', C_CELLE)
C_PLASMID = samling('Plasmids', C_CELLE)
C_RIBO = samling('Ribosomes', C_CELLE)
C_PILI = samling('Pili', C_CELLE)
C_FLAG = samling('Flagella', C_CELLE)
C_SKÆR = samling('Cutaway_Cutters')

# ---------------------------------------------------------------- fra plantecellen
with bpy.data.libraries.load(PLANTE, link=False) as (fra, til):
    til.worlds = ['PC_World']
    til.objects = ['Key_Sun', 'Fill_Area', 'Rim_Area']
    til.materials = ['C3D Ribosom', 'C3D Kromatin']
sc.world = bpy.data.worlds['PC_World']
for o in til.objects:
    C_LYS.objects.link(o)
M_RIBO = bpy.data.materials['C3D Ribosom']
M_DNA = bpy.data.materials['C3D Kromatin']


# ---------------------------------------------------------------- materialer
def materiale(navn, farve, ru=0.35, coat=0.0, alfa=1.0, sss=0.0, billede=None):
    m = bpy.data.materials.new(navn)
    nt = m.node_tree
    b = nt.nodes.get('Principled BSDF')
    b.inputs['Base Color'].default_value = (*farve, 1)
    b.inputs['Roughness'].default_value = ru
    b.inputs['Coat Weight'].default_value = coat
    b.inputs['Subsurface Weight'].default_value = sss
    b.inputs['Alpha'].default_value = alfa
    m.diffuse_color = (*farve, alfa)
    if alfa < 1:
        m.surface_render_method = 'BLENDED'
        m.use_backface_culling = False
    else:
        m.surface_render_method = 'DITHERED'
    if billede:
        t = nt.nodes.new('ShaderNodeTexImage')
        t.image = billede
        t.interpolation = 'Closest'
        t.location = (-400, 200)
        nt.links.new(t.outputs['Color'], b.inputs['Base Color'])
    return m


def dobbeltlag(navn, hoved, hale):
    """Striber til snitfladen af en fosfolipidmembran: hoveder – haler – haler – hoveder."""
    w = 32
    img = bpy.data.images.new(navn, w, 1, alpha=False)
    px = []
    for i in range(w):
        f = hoved if (i < 8 or i >= w - 8) else hale
        px += [*f, 1]
    img.pixels[:] = px
    img.update()
    # gem som PNG og pak ind, så striberne følger med i .blend og i glTF
    img.filepath_raw = os.path.join(UD, navn + '.png')
    img.file_format = 'PNG'
    img.save()
    img.source = 'FILE'
    img.reload()
    img.pack()
    return img


M = {}
M['im'] = materiale('BC Inner Membrane', (0.30, 0.52, 0.90), ru=0.3, coat=0.5)
M['im_snit'] = materiale('BC Inner Membrane Cut', (1, 1, 1), ru=0.45,
                         billede=dobbeltlag('BC_Bilayer_Inner', (0.16, 0.36, 0.78), (0.86, 0.90, 0.97)))
M['pg'] = materiale('BC Peptidoglycan', (0.95, 0.70, 0.22), ru=0.55, coat=0.1)
M['pg_snit'] = materiale('BC Peptidoglycan Cut', (0.99, 0.82, 0.45), ru=0.65)
M['peri'] = materiale('BC Periplasm', (0.86, 0.95, 0.76), ru=0.2, alfa=0.38)
M['peri_snit'] = materiale('BC Periplasm Cut', (0.87, 0.95, 0.78), ru=0.3, alfa=0.55)
M['om'] = materiale('BC Outer Membrane', (0.10, 0.46, 0.17), ru=0.35, coat=0.3)
M['om_snit'] = materiale('BC Outer Membrane Cut', (1, 1, 1), ru=0.45,
                         billede=dobbeltlag('BC_Bilayer_Outer', (0.08, 0.38, 0.14), (0.90, 0.97, 0.90)))
M['kapsel'] = materiale('BC Capsule', (0.86, 0.95, 0.84), ru=0.15, coat=0.6, alfa=0.18)
M['kapsel_snit'] = materiale('BC Capsule Cut', (0.88, 0.94, 0.84), ru=0.3, alfa=0.45)
M['cyto'] = materiale('BC Cytoplasm', (0.84, 0.95, 0.93), ru=0.05, coat=1.0, alfa=0.32)
M['cyto_snit'] = materiale('BC Cytoplasm Cut', (0.84, 0.95, 0.93), ru=0.05, coat=1.0, alfa=0.32)
M['plasmid'] = materiale('BC Plasmid', (0.50, 0.26, 0.86), ru=0.35, coat=0.2)
M['flagel'] = materiale('BC Flagellin', (0.28, 0.62, 0.20), ru=0.4, coat=0.2)
M['krog'] = materiale('BC Flagellar Hook', (0.12, 0.36, 0.14), ru=0.4)
M['motor'] = materiale('BC Flagellar Motor', (0.30, 0.30, 0.46), ru=0.4, coat=0.2)
M['pili'] = materiale('BC Pili', (0.52, 0.78, 0.42), ru=0.45)


def placér(obj, coll, struktur, del_):
    coll.objects.link(obj)
    obj['struktur'] = struktur
    obj['del'] = del_
    return obj


# ---------------------------------------------------------------- stavform og skaller
def profil(r, ncap=20, ncyl=40):
    pts = []
    for i in range(ncap + 1):
        a = (math.pi / 2) * i / ncap
        pts.append((-H - r * math.cos(a), r * math.sin(a)))
    for i in range(1, ncyl):
        pts.append((-H + 2 * H * i / ncyl, r))
    for i in range(ncap, -1, -1):
        a = (math.pi / 2) * i / ncap
        pts.append((H + r * math.cos(a), r * math.sin(a)))
    return pts


def stavflade(bm, r, nseg=144, vend=False):
    ringe = []
    for x, rho in profil(r):
        if rho < 1e-9:
            ringe.append([bm.verts.new((x, 0, 0))])
        else:
            ringe.append([bm.verts.new((x, rho * math.cos(2 * math.pi * j / nseg),
                                        rho * math.sin(2 * math.pi * j / nseg))) for j in range(nseg)])
    fl = []
    for a, b in zip(ringe[:-1], ringe[1:]):
        for j in range(nseg):
            k = (j + 1) % nseg
            if len(a) == 1:
                fl.append(bm.faces.new((a[0], b[k], b[j])))
            elif len(b) == 1:
                fl.append(bm.faces.new((a[j], a[k], b[0])))
            else:
                fl.append(bm.faces.new((a[j], a[k], b[k], b[j])))
    bmesh.ops.recalc_face_normals(bm, faces=fl)
    if vend:
        bmesh.ops.reverse_faces(bm, faces=fl)


def skal(navn, rin, rud, mat):
    bm = bmesh.new()
    stavflade(bm, rud)
    if rin:
        stavflade(bm, rin, vend=True)
    me = bpy.data.meshes.new(navn)
    bm.to_mesh(me)
    bm.free()
    me.materials.append(mat)
    return bpy.data.objects.new(navn, me)


def skærer(navn, lag, mat):
    z0, X = SNIT[lag]
    n = 160
    bm = bmesh.new()
    pts = []
    for i in range(n):
        t = 2 * math.pi * i / n
        c, s = math.cos(t), math.sin(t)
        pts.append((X * math.copysign(abs(c) ** (2 / SE_P), c), SE_Y * math.copysign(abs(s) ** (2 / SE_P), s)))
    bund = [bm.verts.new((x, y, z0)) for x, y in pts]
    top = [bm.verts.new((x, y, z0 + 12)) for x, y in pts]
    fl = [bm.faces.new(bund), bm.faces.new(top)]
    for i in range(n):
        j = (i + 1) % n
        fl.append(bm.faces.new((bund[i], bund[j], top[j], top[i])))
    bmesh.ops.recalc_face_normals(bm, faces=fl)
    me = bpy.data.meshes.new(navn)
    bm.to_mesh(me)
    bm.free()
    me.materials.append(mat)
    o = bpy.data.objects.new(navn, me)
    C_SKÆR.objects.link(o)
    o.hide_render = True
    o.display_type = 'WIRE'
    return o


def skær_op(o, lag, snitmat):
    k = skærer('Cutter_' + o.name, lag, snitmat)
    mod = o.modifiers.new('Cutaway', 'BOOLEAN')
    mod.operation, mod.solver, mod.object, mod.material_mode = 'DIFFERENCE', 'EXACT', k, 'TRANSFER'
    bpy.context.view_layer.objects.active = o
    bpy.ops.object.modifier_apply(modifier=mod.name)


def snit_uv(o, rin, rud, snitmat):
    """Snitfladens u-koordinat følger afstanden fra aksen, så dobbeltlagets striber ligger rigtigt."""
    me = o.data
    idx = [i for i, m in enumerate(me.materials) if m == snitmat]
    uv = me.uv_layers.new(name='UVMap')
    for p in me.polygons:
        for li in p.loop_indices:
            v = me.vertices[me.loops[li].vertex_index].co
            u = (akseafstand(v) - rin) / (rud - rin) if p.material_index in idx else 0.0
            uv.data[li].uv = (min(1, max(0, u)) * 0.98 + 0.01, 0.5)


def glat(o, vinkel=35):
    bpy.ops.object.select_all(action='DESELECT')
    o.select_set(True)
    bpy.context.view_layer.objects.active = o
    bpy.ops.object.shade_smooth_by_angle(angle=math.radians(vinkel))


hylster = []
for navn, lag, struktur, del_ in [('Capsule', 'kapsel', 'Kapsel', 'Kapsel'),
                                  ('Outer_Membrane', 'om', 'Cellevæg', 'Ydre membran'),
                                  ('Periplasm', 'peri', 'Cellevæg', 'Periplasmatisk rum'),
                                  ('Peptidoglycan', 'pg', 'Cellevæg', 'Peptidoglykan'),
                                  ('Inner_Membrane', 'im', 'Cellemembran', 'Cellemembran')]:
    rin, rud = R[lag]
    o = placér(skal(navn, rin, rud, M[lag]), C_HYLSTER, struktur, del_)
    skær_op(o, lag, M[lag + '_snit'])
    if lag in ('im', 'om'):
        snit_uv(o, rin, rud, M[lag + '_snit'])
    glat(o)
    hylster.append(o)

cyto = placér(skal('Cytoplasm', None, R['cyto'], M['cyto']), C_CYTO, 'Cytoplasma', 'Cytoplasma')
skær_op(cyto, 'im', M['cyto_snit'])
glat(cyto)


# ---------------------------------------------------------------- kurver
def kurve(navn, punkter, radius, mat, cyklisk=False, opløsning=1, radier=None, splines=None):
    cu = bpy.data.curves.new(navn, 'CURVE')
    cu.dimensions = '3D'
    cu.bevel_depth = radius
    cu.bevel_resolution = opløsning
    cu.use_fill_caps = True
    for pts, rad in (splines or [(punkter, radier)]):
        sp = cu.splines.new('POLY')
        sp.points.add(len(pts) - 1)
        for i, p in enumerate(pts):
            sp.points[i].co = (*p, 1)
            if rad is not None:
                sp.points[i].radius = rad[i]
        sp.use_cyclic_u = cyklisk
    cu.materials.append(mat)
    return bpy.data.objects.new(navn, cu)


def rammer(P, cyklisk=False):
    """Tangent og parallelt transporterede normaler langs en punktliste."""
    T = np.gradient(P, axis=0) if not cyklisk else (np.roll(P, -1, 0) - np.roll(P, 1, 0))
    T /= np.linalg.norm(T, axis=1, keepdims=True)
    N = np.zeros_like(P)
    a = np.cross(T[0], [0.3, 0.5, 0.8])
    N[0] = a / np.linalg.norm(a)
    for i in range(1, len(P)):
        n = N[i - 1] - np.dot(N[i - 1], T[i]) * T[i]
        N[i] = n / np.linalg.norm(n)
    B = np.cross(T, N)
    return T, N, B


def gensample(P, n, cyklisk=False):
    Q = np.vstack([P, P[:1]]) if cyklisk else P
    s = np.concatenate([[0], np.cumsum(np.linalg.norm(np.diff(Q, axis=0), axis=1))])
    t = np.linspace(0, s[-1], n + (0 if not cyklisk else 1))[: n]
    return np.stack([np.interp(t, s, Q[:, k]) for k in range(3)], 1), s[-1]


# ---------------------------------------------------------------- nukleoidet: ét ringformet DNA
# Cellens indre er ordnet i tydelige områder, så delene er lette at se og klikke på:
# nukleoidet samlet midt i cellen, ribosomerne mod polerne (hvor de også er tættest i
# E. coli) og plasmiderne enkeltvis i det frie cytoplasma langs siderne.
# Nukleoidet afgrænses af to overlappende lapper (uregelmæssigt, uden membran),
# og DNA'et slapper af med fjedre, bøjningsstivhed og frastødning, så strengen ikke krydser sig selv.
LAPPER = [((-0.66, 0.10, -0.35), (1.12, 1.12, 1.02)),
          ((0.66, -0.06, -0.30), (1.10, 1.15, 1.04))]
RIBO_X = 2.25                 # ribosomerne starter her (luft af cytoplasma imellem)
DNA_R = 0.05
Z_DNA_MAX = SNIT['im'][0] - 0.16


def indesluttet(P):
    P = P.copy()
    best = None
    for c, s in LAPPER:
        q = (P - c) / s
        r = np.linalg.norm(q, axis=1)
        if best is None:
            best, bc, bs, bq = r, np.tile(c, (len(P), 1)), np.tile(s, (len(P), 1)), q
        else:
            m = r < best
            best = np.where(m, r, best)
            bc[m], bs[m], bq[m] = c, s, q[m]
    ud = best > 1
    P[ud] = bc[ud] + bq[ud] / best[ud, None] * bs[ud]
    P[:, 2] = np.minimum(P[:, 2], Z_DNA_MAX)
    return P


N = 1450
t = np.linspace(0, 2 * np.pi, N, endpoint=False)
P = np.zeros((N, 3))
for k in range(1, 26):
    a, b = rng.normal(size=3) / k ** 0.75, rng.normal(size=3) / k ** 0.75
    P += np.outer(np.cos(k * t), a) + np.outer(np.sin(k * t), b)
P = P / P.std(0) * np.array([0.85, 0.6, 0.5]) + np.array([0, 0, -0.32])
P = indesluttet(P).astype(np.float32)
L0, DMIN = 0.066, 2 * DNA_R + 0.10
ii = np.arange(N)
nabo = np.abs(ii[:, None] - ii[None, :])
nabo = np.minimum(nabo, N - nabo) <= 5
for it in range(420):
    nx, pv = np.roll(P, -1, 0), np.roll(P, 1, 0)
    d = nx - P
    L = np.linalg.norm(d, axis=1, keepdims=True)
    f = d * (1 - L0 / L) * 0.5
    F = f - np.roll(f, 1, 0) + 0.12 * (nx + pv - 2 * P)
    D = P[:, None, :] - P[None, :, :]
    dist = np.sqrt((D ** 2).sum(-1)) + 1e-6
    m = (dist < DMIN) & ~nabo
    F += 0.25 * ((np.where(m, (DMIN - dist) / dist, 0))[..., None] * D).sum(1)
    nF = np.linalg.norm(F, axis=1, keepdims=True)
    F *= np.minimum(1, 0.03 / np.maximum(nF, 1e-9))   # højst 0,03 pr. skridt, så det ikke løber løbsk
    P = indesluttet(P + F).astype(np.float32)
P = P.astype(float)
# fordobl punkterne (Catmull-Rom) og sno strengen let, så den ligner overspiraliseret DNA
p0, p1, p2, p3 = np.roll(P, 1, 0), P, np.roll(P, -1, 0), np.roll(P, -2, 0)
mid = (-p0 + 9 * p1 + 9 * p2 - p3) / 16
P2 = np.empty((2 * N, 3))
P2[0::2], P2[1::2] = P, mid
T_, N_, B_ = rammer(P2, cyklisk=True)
s = np.concatenate([[0], np.cumsum(np.linalg.norm(np.diff(P2, axis=0), axis=1))])
fase = 2 * np.pi * s / 0.42
P2 = P2 + 0.032 * (np.cos(fase)[:, None] * N_ + np.sin(fase)[:, None] * B_)
DNA_PUNKTER = P2
dna = placér(kurve('Nucleoid_DNA', P2, DNA_R, M_DNA, cyklisk=True, opløsning=1), C_DNA,
             'Kromosom', 'Kromosom (ét ringformet DNA-molekyle)')
DNA_LÆNGDE = s[-1]

# ---------------------------------------------------------------- plasmider
# Tre plasmider i det frie cytoplasma langs siderne af nukleoidet, vendt mod beskueren.
PLASMIDER = [((-1.05, 1.80, -0.05), (0.15, -0.45, 0.88), 0.40),
             ((1.15, 1.72, -0.30), (-0.20, -0.55, 0.81), 0.37),
             ((0.05, -1.72, 0.30), (0.05, -0.25, 0.97), 0.37)]
PLASMID_PUNKTER = []
for i, (c, akse, a) in enumerate(PLASMIDER, 1):
    n = Vector(akse).normalized()
    u = n.orthogonal().normalized()
    v = n.cross(u)
    tt = np.linspace(0, 4 * np.pi, 360, endpoint=False)   # (2,q)-torusknude: to snoede strenge
    q = 11
    rr = a + 0.055 * np.cos(q * tt / 2)
    hh = 0.055 * np.sin(q * tt / 2)
    pts = [Vector(c) + u * (r_ * math.cos(t_)) + v * (r_ * math.sin(t_)) + n * h_ for t_, r_, h_ in zip(tt, rr, hh)]
    PLASMID_PUNKTER.append(np.array([p[:] for p in pts]))
    placér(kurve(f'Plasmid_{i}', [p[:] for p in pts], 0.036, M['plasmid'], cyklisk=True), C_PLASMID,
           'Plasmid', 'Plasmid')

# ---------------------------------------------------------------- flageller
# Hver flagel: basallegeme (motor) gennem hylsteret, en kort krog og et langt, skrueformet
# filament. Basallegemets ringe sidder med vilje inde i membranerne og peptidoglykanlaget.
# Filamentet er en stiv, venstreskruet helix om en ret akse (som en proptrækker), der
# bliver tyndere mod spidsen. Én polær flagel midt for enden af cellen, ud langs cellens
# akse; kortere end i virkeligheden (5–10 µm, flere gange cellens længde), så figuren kan
# vise selve cellen stort.
FLAGELLER = [  # (x, theta) eller pol, og filamentets retning
    (dict(pol=(-1, 0, 0)), (-1, 0, 0)),
]
FLAGEL_LÆNGDE = 10.0
FLAGEL_BØLGE = 4.2            # helixens stigning (længde pr. omgang)
FLAGEL_RADIUS = 0.62          # helixens radius
FLAGEL_TYK = (0.15, 0.015)    # filamentets tykkelse (radius) ved krogen og i spidsen
FLAG_PUNKTER, FLAG_FOD = [], []


def torus(bm, c, n, R_, r_, seg=24, sseg=8, skala_n=1.0):
    u = n.orthogonal().normalized()
    v = n.cross(u)
    ringe = []
    for i in range(seg):
        a = 2 * math.pi * i / seg
        ca = u * math.cos(a) + v * math.sin(a)
        ringe.append([bm.verts.new(c + ca * (R_ + r_ * math.cos(2 * math.pi * j / sseg))
                                   + n * (r_ * skala_n * math.sin(2 * math.pi * j / sseg))) for j in range(sseg)])
    for i in range(seg):
        a, b = ringe[i], ringe[(i + 1) % seg]
        for j in range(sseg):
            k = (j + 1) % sseg
            bm.faces.new((a[j], b[j], b[k], a[k]))


def stang(bm, p0, p1, r_, seg=12):
    d = (p1 - p0)
    n = d.normalized()
    u = n.orthogonal().normalized()
    v = n.cross(u)
    ringe = [[bm.verts.new(p + (u * math.cos(2 * math.pi * j / seg) + v * math.sin(2 * math.pi * j / seg)) * r_)
              for j in range(seg)] for p in (p0, p1)]
    for j in range(seg):
        k = (j + 1) % seg
        bm.faces.new((ringe[0][j], ringe[0][k], ringe[1][k], ringe[1][j]))
    bm.faces.new(list(reversed(ringe[0])))
    bm.faces.new(ringe[1])


for i, (fod, retning) in enumerate(FLAGELLER, 1):
    if 'pol' in fod:
        n = Vector(fod['pol']).normalized()
        akse = Vector((-H, 0, 0))
    else:
        n, akse = normal_på_celle(fod['x'], fod['th'])
    FLAG_FOD.append((akse, n))
    rp = lambda r_: akse + n * r_
    # basallegeme: stang + C-ring (i cytoplasmaet), MS-ring (i cellemembranen), P-ring
    # (i peptidoglykanlaget) og L-ring (i den ydre membran)
    bm = bmesh.new()
    stang(bm, rp(2.30), rp(3.13), 0.055)
    torus(bm, rp(2.36), n, 0.19, 0.05, skala_n=1.8)
    torus(bm, rp(2.57), n, 0.15, 0.04)
    torus(bm, rp(2.81), n, 0.12, 0.035)
    torus(bm, rp(3.05), n, 0.12, 0.035)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    me = bpy.data.meshes.new(f'Flagellum_{i}_Basal_Body')
    bm.to_mesh(me)
    bm.free()
    me.materials.append(M['motor'])
    ob = placér(bpy.data.objects.new(me.name, me), C_FLAG, 'Flagel', 'Basallegeme (motor)')
    glat(ob, 50)
    # krog: kort og bøjet, fra overfladen mod filamentets retning
    d = Vector(retning).normalized()
    b0 = rp(3.10)
    b3 = rp(3.12) + n * 0.55 + d * 0.45
    b1, b2 = b0 + n * 0.35, b3 - d * 0.25
    tt = np.linspace(0, 1, 24)
    krog = [((1 - t_) ** 3) * b0 + 3 * ((1 - t_) ** 2) * t_ * b1 + 3 * (1 - t_) * t_ ** 2 * b2 + t_ ** 3 * b3 for t_ in tt]
    placér(kurve(f'Flagellum_{i}_Hook', [k[:] for k in krog], FLAGEL_TYK[0], M['krog'], opløsning=2), C_FLAG,
           'Flagel', 'Krog')
    # filament: en stiv, venstreskruet helix om en ret akse, der fortsætter krogens retning
    P0 = np.array(b3[:])
    akse_f = np.array(d[:])
    u_f = np.array(d.orthogonal().normalized()[:])
    v_f = np.cross(akse_f, u_f)
    ss = np.linspace(0, FLAGEL_LÆNGDE, 420)
    ramp = np.clip(ss / 1.6, 0, 1)
    amp = FLAGEL_RADIUS * ramp * ramp * (3 - 2 * ramp)   # glidende start fra krogens spids
    fase = 2 * np.pi * ss / FLAGEL_BØLGE
    fil = (P0 + ss[:, None] * akse_f + amp[:, None] * (np.cos(fase)[:, None] * u_f - np.sin(fase)[:, None] * v_f))
    FLAG_PUNKTER.append(fil)
    # tilspidset: tykkelsen falder jævnt fra krogen ud mod en spids ende
    tyk = FLAGEL_TYK[1] + (FLAGEL_TYK[0] - FLAGEL_TYK[1]) * (1 - ss / FLAGEL_LÆNGDE)
    placér(kurve(f'Flagellum_{i}_Filament', fil, 1.0, M['flagel'], opløsning=2, radier=list(tyk)),
           C_FLAG, 'Flagel', 'Filament')

# ---------------------------------------------------------------- pili (fimbrier)
pili = []
alle_flag = np.vstack(FLAG_PUNKTER)
forsøg = 0
while len(pili) < 96 and forsøg < 20000:
    forsøg += 1
    x = rng.uniform(-H - 2.6, H + 2.6)
    th = rng.uniform(-math.pi, math.pi)
    n, akse = normal_på_celle(x, th)
    if abs(x) > H:   # på polerne: tag en tilfældig retning på halvkuglen
        v = rng.normal(size=3)
        v[0] = abs(v[0]) * math.copysign(1, x)
        n = Vector(v).normalized()
        akse = Vector((math.copysign(H, x), 0, 0))
    base = akse + n * 3.06
    if i_vindue(np.array(base[:]), 'om', margen=0.35)[()]:
        continue
    if any((base - (a + nn * 3.1)).length < 0.75 for a, nn in FLAG_FOD):
        continue
    if any((base - p[0]).length < 0.55 for p in pili):
        continue
    længde = rng.uniform(0.95, 1.45)
    vip = Vector(rng.normal(size=3)) * 0.22
    retn = (n + vip - n * n.dot(vip) * 0.0).normalized()
    bøj = Vector(rng.normal(size=3)) * 0.08
    pts = [base + retn * (længde * k / 6) + bøj * math.sin(math.pi * k / 6) for k in range(7)]
    arr = np.array([p[:] for p in pts])
    if np.min(np.linalg.norm(arr[:, None, :] - alle_flag[None], axis=2)) < 0.25:
        continue
    pili.append(pts)
pili_obj = kurve('Pili', None, 0.026, M['pili'], opløsning=1,
                 splines=[([p[:] for p in pts], [1, 1, 0.95, 0.9, 0.85, 0.8, 0.72]) for pts in pili])
placér(pili_obj, C_PILI, 'Pili', 'Fimbrie')

# ---------------------------------------------------------------- ribosomer (70S)
# Én skabelon: stor (50S) og lille (30S) underenhed. Kopierne samles i ét mesh.
bm = bmesh.new()
bmesh.ops.create_icosphere(bm, subdivisions=2, radius=1.0)
for v in bm.verts:
    v.co = Vector((v.co.x * 0.13, v.co.y * 0.118, v.co.z * 0.097))
n_stor = len(bm.verts)
lille = bmesh.new()
bmesh.ops.create_icosphere(lille, subdivisions=1, radius=1.0)
for v in lille.verts:
    v.co = Vector((v.co.x * 0.105, v.co.y * 0.077, v.co.z * 0.06 + 0.122))
me_l = bpy.data.meshes.new('tmp')
lille.to_mesh(me_l)
lille.free()
bm.from_mesh(me_l)
bpy.data.meshes.remove(me_l)
bm.verts.index_update()
bm.verts.ensure_lookup_table()
TV = np.array([v.co[:] for v in bm.verts])
TF = [[v.index for v in f.verts] for f in bm.faces]
bm.free()

ribo = []
dna_pts = DNA_PUNKTER
plas = np.vstack(PLASMID_PUNKTER)
motor = np.array([(a + n * 2.36)[:] for a, n in FLAG_FOD])
forsøg = 0
# kun i de to polområder (|x| > RIBO_X); midten er nukleoidet og det frie cytoplasma
while len(ribo) < 900 and forsøg < 200000:
    forsøg += 1
    p = rng.uniform([-H - 2.4, -2.4, -2.4], [H + 2.4, 2.4, 2.4])
    if abs(p[0]) < RIBO_X + rng.uniform(0, 0.25):
        continue
    if akseafstand(p) > R['cyto'] - 0.2:
        continue
    if i_vindue(p, 'im', margen=0.2):
        continue
    if np.min(np.sum((motor - p) ** 2, 1)) < 0.45 ** 2:
        continue
    if ribo and np.min(np.sum((np.array(ribo) - p) ** 2, 1)) < 0.3 ** 2:
        continue
    ribo.append(p)
verts, faces = [], []
for k, p in enumerate(ribo):
    q = rng.normal(size=4)
    q /= np.linalg.norm(q)
    rot = np.array(Quaternion(q).to_matrix())
    verts.append(TV @ rot.T + p)
    faces += [[i + k * len(TV) for i in f] for f in TF]
me = bpy.data.meshes.new('Ribosomes_70S')
me.from_pydata(np.vstack(verts).tolist(), [], faces)
me.materials.append(M_RIBO)
ribo_obj = placér(bpy.data.objects.new('Ribosomes_70S', me), C_RIBO, 'Ribosom', '70S-ribosom')
glat(ribo_obj, 80)

# ---------------------------------------------------------------- kurver bliver til lukkede meshes
# Rørenes endeflader svejses fast, så der ikke er åbne kanter eller løse punkter i eksporten.
for o in list(C_CELLE.all_objects):
    if o.type != 'CURVE':
        continue
    navn, props = o.name, {k: o[k] for k in o.keys()}
    me = bpy.data.meshes.new_from_object(o.evaluated_get(bpy.context.evaluated_depsgraph_get()))
    bm = bmesh.new()
    bm.from_mesh(me)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    bm.to_mesh(me)
    bm.free()
    coll = o.users_collection[0]
    cu = o.data
    bpy.data.objects.remove(o)
    bpy.data.curves.remove(cu)
    ny = bpy.data.objects.new(navn, me)
    me.name = navn
    coll.objects.link(ny)
    for k, v in props.items():
        ny[k] = v
    glat(ny, 60)

# ---------------------------------------------------------------- lys og kameraer
def kamera(navn, pos, mål, linse=40, ortho=None):
    cd = bpy.data.cameras.new(navn)
    cd.lens = linse
    cd.clip_end = 400
    if ortho:
        cd.type, cd.ortho_scale = 'ORTHO', ortho
    o = bpy.data.objects.new(navn, cd)
    o.location = pos
    o.rotation_euler = (Vector(mål) - Vector(pos)).to_track_quat('-Z', 'Y').to_euler()
    C_LYS.objects.link(o)
    return o


cam = kamera('Cam_Main', (-0.6, -17.5, 23.5), (-1.6, 0.2, -0.6), linse=36)
kamera('Cam_Front', (-1.5, -36, 0.5), (-1.5, 0, 0), linse=38)
kamera('Cam_Back', (-1.5, 36, 3.0), (-1.5, 0, 0), linse=38)
kamera('Cam_Top', (-1.5, 0.01, 38), (-1.5, 0, 0), linse=38)
kamera('Cam_Bottom', (-1.5, 0.01, -38), (-1.5, 0, 0), linse=38)
kamera('Cam_Left_Oblique', (-24, -14, 12), (-2.5, 0, -0.5), linse=36)
kamera('Cam_Right_Oblique', (22, -10, 15), (0.5, 0, 0), linse=36)
kamera('Cam_Envelope_Close', (1.2, -6.2, 4.4), (1.0, -2.6, 0.4), linse=50)
kamera('Cam_DNA_Close', (0.4, -5.5, 9.5), (0.4, -0.2, -0.3), linse=45)
sc.camera = cam

sc.render.engine = 'BLENDER_EEVEE'
sc.render.resolution_x, sc.render.resolution_y = 1600, 1200
sc.view_settings.view_transform = 'Standard'
sc.view_settings.look = 'None'
sc.eevee.taa_render_samples = 64

for o in C_SKÆR.objects:
    o.hide_set(True)
lc = bpy.context.view_layer.layer_collection.children['Cutaway_Cutters']
lc.exclude = True

bpy.ops.wm.save_as_mainfile(filepath=os.path.join(UD, 'Bakteriecelle.blend'))
print('GEMT', os.path.join(UD, 'Bakteriecelle.blend'))
print('RIBOSOMER', len(ribo), 'PILI', len(pili), 'DNA-længde', round(DNA_LÆNGDE, 1))
