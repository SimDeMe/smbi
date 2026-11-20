# Fordøjelsessystemet i Blender: hele kanalen fra mund til endetarm og de tilhørende
# organer, bygget fra bunden som en anatomimodel.
#
# Kør (Blender 5.x):
#   /Applications/Blender.app/Contents/MacOS/Blender -b --factory-startup \
#     --python biologi/fordoejelse/blender/fordoejelse.py -- <mappe> [render]
# Scriptet gemmer <mappe>/Fordoejelse.blend, <mappe>/Fordoejelse.glb og
# <mappe>/forloeb.json (madens vej gennem kanalen). Med «render» laves også
# preview-billeder i <mappe>/_preview.
#
# Mål: 1 enhed = 1 cm. Blenders akser: +z op, −y fortil (bugen), −x patientens
# højre side (leveren). Nul er ved navlen. glTF-eksporten vender til +y op.
#
# Forenklinger: tyndtarmen er ca. 1,8 m i modellen mod 5–6 m i virkeligheden og
# ligger som et pakket nøgle; tarmkrøset, karrene og bughinden er udeladt.
import bpy, bmesh, math, sys, os, json
import numpy as np
from mathutils import Vector, Matrix, noise

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
UD = argv[0] if argv else os.path.expanduser('~/Pictures/Blender/fordoejelse')
RENDER = 'render' in argv[1:]
RESERVE = 'reserve' in argv[1:]     # reserve.jpg: billedet, siden viser, hvis WebGL fejler
os.makedirs(UD, exist_ok=True)
rng = np.random.default_rng(20261120)

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.unit_settings.system = 'METRIC'
sc.unit_settings.scale_length = 0.01


# ---------------------------------------------------------------- samlinger
def samling(navn, forælder=None):
    c = bpy.data.collections.new(navn)
    (forælder or sc.collection).children.link(c)
    return c


C_LYS = samling('Lys_Kamera')
C_MODEL = samling('Fordoejelse')
C_KANAL = samling('Kanal', C_MODEL)
C_ORGAN = samling('Organer', C_MODEL)
C_MUND = samling('Mund', C_MODEL)
C_KROP = samling('Krop', C_MODEL)


# ---------------------------------------------------------------- materialer
def srgb(h):
    h = h.lstrip('#')
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c)


def materiale(navn, hexfarve, ru=0.45, coat=0.25, alfa=1.0, sss=0.0):
    farve = srgb(hexfarve)
    m = bpy.data.materials.new(navn)
    b = m.node_tree.nodes.get('Principled BSDF')
    b.inputs['Base Color'].default_value = (*farve, 1)
    b.inputs['Roughness'].default_value = ru
    b.inputs['Coat Weight'].default_value = coat
    b.inputs['Coat Roughness'].default_value = 0.25
    b.inputs['Subsurface Weight'].default_value = sss
    b.inputs['Alpha'].default_value = alfa
    m.diffuse_color = (*farve, alfa)
    if alfa < 1:
        m.surface_render_method = 'BLENDED'
        m.use_backface_culling = False
    return m


M = dict(
    svaelg=materiale('FD Svælg', '#c7766c'),
    spiseroer=materiale('FD Spiserør', '#c46e63'),
    mave=materiale('FD Mavesæk', '#d8857a', sss=0.05),
    tolvfinger=materiale('FD Tolvfingertarm', '#dd9a7c'),
    tyndtarm=materiale('FD Tyndtarm', '#e3907f', sss=0.05),
    tyktarm=materiale('FD Tyktarm', '#cf9f7e'),
    vedhaeng=materiale('FD Blindtarmsvedhæng', '#c99579'),
    endetarm=materiale('FD Endetarm', '#b9776a'),
    lever=materiale('FD Lever', '#7c2b24', ru=0.35, coat=0.45),
    galdeblaere=materiale('FD Galdeblære', '#5d8f3c', ru=0.3, coat=0.5),
    galdegang=materiale('FD Galdegang', '#76a03c', ru=0.4),
    bugspyt=materiale('FD Bugspytkirtel', '#e8c27c', ru=0.55, coat=0.1),
    spyt=materiale('FD Spytkirtel', '#e3b48a', ru=0.55, coat=0.1),
    spytgang=materiale('FD Spytgang', '#e8cfa6', ru=0.5),
    tunge=materiale('FD Tunge', '#c3525a', ru=0.5, coat=0.15),
    taender=materiale('FD Tænder', '#f3ecd9', ru=0.2, coat=0.6),
    gane=materiale('FD Gane og gummer', '#d9848a', ru=0.45),
    krop=materiale('FD Krop', '#e8c9b0', ru=0.5, coat=0.0, alfa=0.14),
)


def placér(obj, coll, del_, navn=None):
    coll.objects.link(obj)
    obj['del'] = del_
    if navn:
        obj['navn'] = navn
    return obj


def mesh_obj(navn, V, F, mat):
    me = bpy.data.meshes.new(navn)
    me.from_pydata([tuple(v) for v in np.asarray(V, float)], [], [tuple(f) for f in F])
    me.validate()
    me.update()
    o = bpy.data.objects.new(navn, me)
    me.materials.append(mat)
    me.shade_smooth()
    return o


# ---------------------------------------------------------------- kurver og rør
def catmull(P):
    """Catmull–Rom gennem punkterne (alle kolonner interpoleres, også radius)."""
    P = np.asarray(P, float)
    Q = np.vstack([2 * P[0] - P[1], P, 2 * P[-1] - P[-2]])
    ud = []
    for i in range(1, len(Q) - 2):
        p0, p1, p2, p3 = Q[i - 1], Q[i], Q[i + 1], Q[i + 2]
        n = max(4, int(np.linalg.norm(p2[:3] - p1[:3]) / 0.05))
        t = np.linspace(0, 1, n, endpoint=False)[:, None]
        ud.append(0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t ** 2
                         + (-p0 + 3 * p1 - 3 * p2 + p3) * t ** 3))
    ud.append(P[-1][None])
    return np.vstack(ud)


def gensample(C, trin):
    """Lige store skridt langs kurven (afstand måles kun i xyz)."""
    d = np.r_[0, np.cumsum(np.linalg.norm(np.diff(C[:, :3], axis=0), axis=1))]
    n = max(2, int(round(d[-1] / trin)) + 1)
    s = np.linspace(0, d[-1], n)
    return np.stack([np.interp(s, d, C[:, k]) for k in range(C.shape[1])], 1), s


def rammer(P):
    """Rotationsminimerende rammer (dobbeltrefleksion)."""
    T = np.gradient(P, axis=0)
    T /= np.linalg.norm(T, axis=1)[:, None]
    a = np.array([0, 0, 1.0]) if abs(T[0][2]) < 0.9 else np.array([1.0, 0, 0])
    N = [np.cross(T[0], a)]
    N[0] /= np.linalg.norm(N[0])
    for i in range(len(P) - 1):
        v1 = P[i + 1] - P[i]
        c1 = v1 @ v1
        rL = N[i] - (2 / c1) * (v1 @ N[i]) * v1
        tL = T[i] - (2 / c1) * (v1 @ T[i]) * v1
        v2 = T[i + 1] - tL
        c2 = v2 @ v2
        n = rL - (2 / c2) * (v2 @ rL) * v2 if c2 > 1e-12 else rL
        N.append(n / np.linalg.norm(n))
    N = np.array(N)
    B = np.cross(T, N)
    return T, N, B


def rør(navn, punkter, mat, trin=0.25, seg=32, flad=None, form=None, start='rund', slut='rund',
        støj=None):
    """Rør langs en kurve. punkter: (x, y, z, r). form(s, θ) → faktor på radius.
    flad = (akse, faktor) trykker røret sammen i én verdensretning (fx mavesækken forfra-bagfra).
    start/slut: 'rund' (halvkugle), 'flad' (låg) eller 'åben'."""
    C, s = gensample(catmull(punkter), trin)
    P, R = C[:, :3], C[:, 3]
    T, N, B = rammer(P)
    th = np.linspace(0, 2 * np.pi, seg, endpoint=False)
    fak = np.ones((len(P), seg)) if form is None else form(s[:, None], th[None, :])
    ring = (np.cos(th)[None, :, None] * N[:, None, :] + np.sin(th)[None, :, None] * B[:, None, :])
    off = ring * (R[:, None] * fak)[:, :, None]
    if flad is not None:
        akse, f = flad
        off[..., akse] *= f
    V = list((P[:, None, :] + off).reshape(-1, 3))
    F = []
    n = len(P)
    for i in range(n - 1):
        for j in range(seg):
            k = (j + 1) % seg
            F.append((i * seg + j, i * seg + k, (i + 1) * seg + k, (i + 1) * seg + j))

    def låg(i, retning, type_):
        nonlocal V, F
        base = i * seg
        if type_ == 'åben':
            return
        if type_ == 'flad':
            V.append(P[i])
            c = len(V) - 1
            for j in range(seg):
                k = (j + 1) % seg
                F.append((base + k, base + j, c) if retning < 0 else (base + j, base + k, c))
            return
        # halvkugle: ringe der lukker sig langs tangenten
        nr = 8
        forrige = list(range(base, base + seg))
        for m in range(1, nr + 1):
            a = (math.pi / 2) * m / nr
            if m == nr:
                V.append(P[i] + retning * T[i] * R[i] * math.sin(a) * 0.9)
                c = len(V) - 1
                for j in range(seg):
                    k = (j + 1) % seg
                    F.append((forrige[k], forrige[j], c) if retning < 0 else (forrige[j], forrige[k], c))
            else:
                ny = []
                for j in range(seg):
                    V.append(P[i] + off[i, j] * math.cos(a) + retning * T[i] * R[i] * math.sin(a) * 0.9)
                    ny.append(len(V) - 1)
                for j in range(seg):
                    k = (j + 1) % seg
                    if retning < 0:
                        F.append((forrige[k], forrige[j], ny[j], ny[k]))
                    else:
                        F.append((forrige[j], forrige[k], ny[k], ny[j]))
                forrige = ny

    låg(0, -1, start)
    låg(n - 1, 1, slut)
    V = np.array(V)
    if støj:
        V = støj_på(V, *støj)
    o = mesh_obj(navn, V, F, mat)
    ret_normaler(o)
    return o, P, R


def ret_normaler(o):
    bm = bmesh.new()
    bm.from_mesh(o.data)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(o.data)
    bm.free()
    o.data.shade_smooth()


def støj_på(V, amp, frekvens, centrum=None):
    """Knudret overflade (fx kirtlernes lapper): flyt punkterne ud/ind efter Perlin-støj."""
    V = np.asarray(V, float).copy()
    c = V.mean(0) if centrum is None else np.asarray(centrum)
    for i, v in enumerate(V):
        d = v - c
        l = np.linalg.norm(d) or 1
        n = noise.noise(Vector(v * frekvens), noise_basis='PERLIN_ORIGINAL')
        n2 = noise.noise(Vector(v * frekvens * 2.3 + 7.1), noise_basis='PERLIN_ORIGINAL')
        V[i] = v + d / l * amp * (n + 0.45 * n2)
    return V


# ---------------------------------------------------------------- metaballs → mesh
KUGLE = 0.574   # en metaball med radius 1 (tærskel 0,6, stivhed 2) har overfladeradius 0,574


def klump(navn, elementer, mat, opløsning=0.35, støj=None, glat=0):
    """elementer: (centrum, overfladeradier, fortegn). Bliver til ét mesh."""
    mb = bpy.data.metaballs.new(navn + '_mb')
    mb.resolution = mb.render_resolution = opløsning
    mb.threshold = 0.6
    for c, r, *fort in elementer:
        e = mb.elements.new()
        e.type = 'ELLIPSOID'
        stor = max(r)
        e.co = c
        e.radius = stor / KUGLE
        e.size_x, e.size_y, e.size_z = (ri / stor for ri in r)
        e.stiffness = 2.0
        if fort and fort[0] < 0:
            e.use_negative = True
    ob = bpy.data.objects.new(navn + '_mb', mb)
    sc.collection.objects.link(ob)
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(ob.evaluated_get(dg))
    bpy.data.objects.remove(ob)
    bpy.data.metaballs.remove(mb)
    me.name = navn
    o = bpy.data.objects.new(navn, me)
    me.materials.append(mat)
    sc.collection.objects.link(o)
    if glat:
        md = o.modifiers.new('glat', 'SMOOTH')
        md.factor, md.iterations = 0.6, glat
    if støj:
        V = np.array([v.co[:] for v in me.vertices])
        V = støj_på(V, *støj)
        me.vertices.foreach_set('co', V.ravel())
    bm = bmesh.new()
    bm.from_mesh(me)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-4)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(me)
    bm.free()
    me.shade_smooth()
    sc.collection.objects.unlink(o)
    return o


def anvend_modifikatorer(o, coll):
    coll.objects.link(o)
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(o.evaluated_get(dg))
    o.modifiers.clear()
    gammel = o.data
    o.data = me
    me.name = o.name
    bpy.data.meshes.remove(gammel)
    me.shade_smooth()
    return o


# ================================================================= KANALEN
FORLØB = []          # (del, punkter i cm) – madens vej, samles til forloeb.json


def forløb(del_, P):
    FORLØB.append((del_, np.asarray(P, float)[:, :3]))


# ---- svælget: fra næsesvælget ned bag tungeroden til spiserøret
svaelg_pkt = [(0, 1.5, 58.6, 1.4), (0, 1.9, 57.0, 1.55), (0, 2.3, 54.5, 1.55),
              (0, 2.5, 51.5, 1.35), (0, 2.6, 48.5, 1.05), (0, 2.6, 46.8, 0.9)]
o, _, _ = rør('Svaelg', svaelg_pkt, M['svaelg'], seg=28, start='rund', slut='flad')
placér(o, C_KANAL, 'svaelg')

# ---- spiserøret: bag luftrøret ned langs rygsøjlen, gennem mellemgulvet til mavemunden
spiseroer_pkt = [(0, 2.6, 47.5, 0.95), (0.2, 3.4, 42, 0.95), (0.6, 4.8, 35, 1.0), (1.0, 5.6, 28, 1.0),
                 (1.6, 5.2, 23.5, 1.0), (2.9, 3.9, 20.3, 1.05), (4.4, 2.6, 18.2, 1.2), (5.6, 1.9, 16.8, 1.5)]
o, P_spis, _ = rør('Spiseroer', spiseroer_pkt, M['spiseroer'], seg=24, start='flad', slut='flad')
placér(o, C_KANAL, 'spiseroer')

# ---- mavesækken: J-formet, mavebund øverst, mavelegeme, portområde og mavemund (pylorus)
mave_pkt = [(8.6, 3.4, 21.6, 3.9), (9.0, 2.8, 19.0, 4.8), (8.9, 1.4, 15.0, 5.5), (8.3, -0.4, 11.0, 5.3),
            (6.8, -2.4, 7.6, 4.6), (4.0, -3.8, 6.0, 3.8), (1.0, -4.3, 6.8, 3.0), (-1.4, -3.9, 8.3, 2.1),
            (-2.6, -3.5, 9.0, 1.15), (-3.3, -3.2, 9.2, 1.2)]


def mave_form(s, th):
    # svag indsnævring ved pylorus-lukkemusklen og bløde langsgående folder i mavelegemet
    L = s.max()
    u = s / L
    knæk = 1 - 0.18 * np.exp(-((u - 0.955) / 0.012) ** 2)
    return knæk * (1 + 0.012 * np.sin(5 * th) * np.clip((u - 0.15) * 3, 0, 1) * np.clip((0.85 - u) * 4, 0, 1))


o, P_mave, R_mave = rør('Mavesaek', mave_pkt, M['mave'], seg=48, flad=(1, 0.78), form=mave_form,
                        start='rund', slut='flad')
placér(o, C_KANAL, 'mavesaek')

# ---- tolvfingertarmen: C-slyngen om bugspytkirtlens hoved
tolv_pkt = [(-3.0, -3.3, 9.2, 1.5), (-4.6, -2.6, 9.4, 1.75), (-6.4, -0.9, 8.6, 1.75), (-7.3, 0.4, 6.4, 1.7),
            (-7.5, 0.9, 3.4, 1.7), (-7.0, 1.3, 0.6, 1.65), (-5.4, 1.6, -1.4, 1.6), (-2.4, 1.8, -2.1, 1.55),
            (0.8, 1.6, -1.9, 1.5), (3.0, 1.0, -0.6, 1.45), (4.2, 0.0, 1.4, 1.4), (4.4, -0.9, 2.4, 1.35)]
o, P_tolv, R_tolv = rør('Tolvfingertarm', tolv_pkt, M['tolvfinger'], seg=28, start='flad', slut='flad')
placér(o, C_KANAL, 'tolvfingertarm')

# ---- tyktarmen: blindtarm, opstigende, tværgående, nedstigende og S-formet tyktarm
tyk_pkt = [(-11.0, -1.6, -15.0, 2.9), (-11.4, -1.0, -12.0, 3.3), (-12.0, -0.2, -8.0, 3.0), (-12.4, 0.6, -2.0, 2.8),
           (-12.4, 0.8, 4.0, 2.7), (-11.6, 0.2, 8.4, 2.6), (-9.2, -2.6, 8.6, 2.5),
           (-6.6, -6.0, 4.0, 2.5), (-2.0, -7.3, 0.6, 2.4), (3.0, -7.2, 0.8, 2.4), (7.4, -5.6, 4.6, 2.4),
           (10.4, -1.8, 11.2, 2.3), (12.2, 1.8, 13.6, 2.3), (13.0, 3.0, 10.0, 2.2), (13.1, 3.0, 2.0, 2.15),
           (12.9, 2.6, -6.0, 2.1), (12.0, 1.6, -12.4, 2.0), (9.6, -1.8, -15.4, 1.95), (6.4, -3.4, -14.4, 1.9),
           (3.4, -2.6, -12.6, 1.9), (0.8, -0.4, -14.0, 1.9), (0.2, 2.6, -17.2, 2.0), (0.0, 4.8, -19.4, 2.1)]
endetarm_pkt = [(0.0, 4.4, -18.8, 2.1), (0.0, 6.0, -21.6, 2.5), (0.0, 6.6, -24.6, 2.8), (0.0, 5.6, -27.4, 2.4),
                (0.0, 4.0, -29.4, 1.3), (0.0, 3.3, -31.0, 0.95), (0.0, 3.0, -32.2, 0.85)]


def tyk_form(s, th):
    # haustrer (poser) mellem tre langsgående muskelbånd (taenia coli)
    pose = np.abs(np.sin(np.pi * s / 3.6)) ** 0.7
    bånd = np.ones_like(th)
    for a in (0.3, 0.3 + 2 * np.pi / 3, 0.3 + 4 * np.pi / 3):
        d = np.angle(np.exp(1j * (th - a)))
        bånd = bånd - 0.85 * np.exp(-(d / 0.22) ** 2)
    blind = np.clip(s / 3.0, 0, 1)   # blindtarmens bund er glat
    return 0.86 + 0.16 * pose * np.clip(bånd, 0, 1) * blind + 0.0 * th


o, P_tyk, R_tyk = rør('Tyktarm', tyk_pkt, M['tyktarm'], seg=48, form=tyk_form, start='rund', slut='flad')
placér(o, C_KANAL, 'tyktarm')
o, P_ende, R_ende = rør('Endetarm', endetarm_pkt, M['endetarm'], seg=36, start='flad', slut='flad')
placér(o, C_KANAL, 'endetarm')

# ---- blindtarmsvedhænget (appendix)
vedh_pkt = [(-10.0, 0.2, -14.6, 0.45), (-9.2, 1.0, -16.4, 0.42), (-8.0, 0.8, -18.2, 0.4),
            (-6.6, 0.0, -18.8, 0.38), (-5.6, -0.6, -18.0, 0.36)]
o, _, _ = rør('Blindtarmsvedhaeng', vedh_pkt, M['vedhaeng'], trin=0.15, seg=16, start='flad', slut='rund')
placér(o, C_KANAL, 'vedhaeng')

# ---- tyndtarmen: et langt rør, der pakkes i bughulen mellem tyktarmens ramme
R_TYND = 1.2
TYND_START = np.array([4.4, -0.9, 2.4])
TYND_SLUT = np.array([-9.6, -0.8, -11.2])     # ender inde i blindtarmen (ileocøkalklappen)


def tyndtarm_sti():
    # 1) startbane: slange i lag fra øverst til venstre (jejunum) til nederst til højre (ileum)
    rækker = np.arange(-0.2, -14.0, -3.0)
    lag = [-4.2, -0.6]
    pkt = [TYND_START]
    for ir, z in enumerate(rækker):
        for il, y in enumerate(lag if ir % 2 == 0 else lag[::-1]):
            xs = np.linspace(7.5, -6.5, 5) if (ir * 2 + il) % 2 == 0 else np.linspace(-6.5, 7.5, 5)
            for x in xs:
                pkt.append(np.array([x, y, z]))
    pkt.append(TYND_SLUT)
    C, s = gensample(catmull(np.array(pkt)), 0.45)
    # krøl: langsomme bølger på tværs af slangen, så rækkerne bliver til slynger
    bølge = np.zeros_like(C)
    for k in range(3):
        for _ in range(2):
            λ, φ = rng.uniform(6, 12), rng.uniform(0, 2 * np.pi)
            bølge[:, k] += rng.uniform(1.0, 1.8) * np.sin(2 * np.pi * s / λ + φ)
    bølge *= np.clip(np.minimum(s, s[-1] - s) / 4, 0, 1)[:, None]
    P = C + bølge + rng.normal(0, 0.15, C.shape)
    n = len(P)
    L = 0.45
    D = 2 * R_TYND + 0.35
    # forhindringer: tyktarmen, tolvfingertarmen, mavesækken og endetarmen
    hind = [(P_tyk, R_tyk), (P_tolv[:-6], R_tolv[:-6]), (P_mave, R_mave * 1.0), (P_ende, R_ende)]
    Q = np.vstack([h[0][::2] for h in hind])
    RQ = np.concatenate([h[1][::2] for h in hind]) + R_TYND + 0.35
    centrum = np.array([0.4, -1.6, -6.6])
    radier = np.array([9.4, 5.0, 8.6])
    idx = np.arange(n)
    nabo = np.abs(idx[:, None] - idx[None, :]) > 5
    for it in range(1600):
        afslut = it > 1300
        d = P[:, None, :] - P[None, :, :]
        l = np.linalg.norm(d, axis=2) + 1e-9
        m = nabo & (l < D)
        skub = np.where(m, (D - l) / l, 0)[:, :, None] * d
        P += (0.5 if afslut else 0.35) * skub.sum(1)
        # forhindringer
        d = P[:, None, :] - Q[None, :, :]
        l = np.linalg.norm(d, axis=2) + 1e-9
        m = l < RQ[None, :]
        P += 0.5 * (np.where(m, (RQ[None, :] - l) / l, 0)[:, :, None] * d).sum(1)
        # bughulen (ellipsoide)
        u = (P - centrum) / radier
        r = np.linalg.norm(u, axis=1)
        ude = r > 1
        P[ude] = centrum + (u[ude] / r[ude, None]) * radier
        # led og stivhed
        for _ in range(6):
            seg = P[1:] - P[:-1]
            sl = np.linalg.norm(seg, axis=1)[:, None]
            k = 0.5 * (sl - L) / sl * seg
            P[:-1] += k
            P[1:] -= k
            P[0], P[-1] = TYND_START, TYND_SLUT
        if not afslut:
            P[1:-1] += 0.18 * ((P[:-2] + P[2:]) / 2 - P[1:-1])
        P[0], P[-1] = TYND_START, TYND_SLUT
    d = np.linalg.norm(P[:, None] - P[None], axis=2)
    d[~nabo] = 99
    print('TYNDTARM længde %.0f cm, mindste afstand %.2f (rør %.2f)' % (n * L, d.min(), 2 * R_TYND))
    return P


P_tynd = tyndtarm_sti()
u = np.linspace(0, 1, len(P_tynd))
tynd_pkt = np.c_[P_tynd, R_TYND * (1.06 - 0.12 * u)]
o, P_tynd2, _ = rør('Tyndtarm', tynd_pkt[::2], M['tyndtarm'], trin=0.3, seg=24, start='flad', slut='flad')
placér(o, C_KANAL, 'tyndtarm')


# ================================================================= ORGANERNE
# ---- leveren: stor højre lap, tynd venstre lap over mavesækken, hul underside
def forstør(elementer, k, c, flyt):
    c = np.array(c)
    return [(tuple(c + k * (np.array(e[0]) - c) + flyt), tuple(k * np.array(e[1])), *e[2:]) for e in elementer]


lever = klump('Lever', forstør([
    ((-8.5, 0.6, 17.0), (6.8, 7.0, 6.8)),       # højre lap
    ((-8.0, 4.4, 18.5), (5.0, 3.6, 5.2)),       # bagest (mod mellemgulv og rygsøjle)
    ((-7.6, -4.6, 12.6), (5.4, 2.6, 2.4)),      # forreste, nedre kant
    ((-3.4, 0.0, 19.6), (6.4, 6.4, 4.6)),       # midt under kuplen
    ((2.6, -4.6, 19.8), (6.0, 3.0, 2.6)),       # venstre lap foran mavesækken
    ((7.2, -4.4, 20.2), (3.4, 2.4, 1.5)),       # venstre laps spids
    ((-13.2, 1.2, 15.6), (2.8, 4.6, 4.8)),      # højre side
    ((1.0, -1.0, 12.0), (5.5, 6.0, 3.5), -1),   # underside mod mavesæk og tolvfingertarm
], 1.12, (-3.0, 0.0, 18.0), (0.0, -0.3, -0.6)), M['lever'], opløsning=0.4, støj=(0.18, 0.25), glat=4)
anvend_modifikatorer(lever, C_ORGAN)
lever['del'] = 'lever'

# ---- galdeblæren og galdegangene
o, _, _ = rør('Galdeblaere', [(-5.7, -7.2, 8.3, 1.35), (-5.6, -5.6, 10.2, 1.5), (-5.3, -3.6, 12.0, 1.15),
                              (-4.9, -2.3, 13.0, 0.6)], M['galdeblaere'], trin=0.15, seg=32,
              start='rund', slut='rund')
placér(o, C_ORGAN, 'galdeblaere')
galdegang = [
    rør('Galdegang_lever', [(-3.6, -0.8, 15.0, 0.32), (-4.2, -0.6, 13.6, 0.3), (-4.6, -0.4, 12.0, 0.3)],
        M['galdegang'], trin=0.12, seg=12, start='rund', slut='rund')[0],
    rør('Galdegang_blaere', [(-4.9, -2.3, 13.0, 0.25), (-4.9, -1.5, 12.6, 0.24), (-4.6, -0.6, 12.0, 0.24)],
        M['galdegang'], trin=0.1, seg=12, start='rund', slut='rund')[0],
    rør('Galdegang_faelles', [(-4.6, -0.5, 12.0, 0.32), (-5.0, 0.2, 9.8, 0.32), (-5.4, 1.1, 7.6, 0.31),
                              (-5.8, 1.4, 5.6, 0.3), (-6.1, 1.2, 4.2, 0.3)],
        M['galdegang'], trin=0.12, seg=12, start='rund', slut='rund')[0],
]
for o in galdegang:
    placér(o, C_ORGAN, 'galdegang')

# ---- bugspytkirtlen: hoved i tolvfingertarmens bue, krop bag mavesækken, hale mod milten
o, _, _ = rør('Bugspytkirtel', [(-2.4, 2.4, -0.2, 1.1), (-4.0, 2.0, 1.4, 1.9), (-4.4, 1.5, 4.0, 2.0),
                                (-2.0, 1.4, 6.2, 1.5), (2.4, 2.6, 7.6, 1.55), (6.6, 4.0, 9.4, 1.35),
                                (9.6, 5.0, 10.6, 1.0), (11.2, 5.4, 11.2, 0.7)],
              M['bugspyt'], trin=0.2, seg=36, flad=(1, 0.7), start='rund', slut='rund', støj=(0.22, 0.9))
placér(o, C_ORGAN, 'bugspytkirtel')


# ================================================================= MUNDEN
def tungespids():
    return klump('Tunge', [
        ((0, -3.8, 54.7), (1.85, 3.3, 0.95)),
        ((0, -6.4, 54.8), (1.2, 1.1, 0.6)),
        ((0, -0.9, 54.0), (1.8, 1.6, 1.45)),
    ], M['tunge'], opløsning=0.12, støj=(0.04, 3.0))


placér(tungespids(), C_MUND, 'tunge')


def tandbue(z, skala, op):
    """16 tænder langs en parabel; op = +1 for overmunden (kronen peger ned)."""
    bm = bmesh.new()
    a, y0 = 0.9, -7.8
    xs = np.linspace(0, 2.6, 400)
    ys = y0 + a * xs ** 2
    bue = np.r_[0, np.cumsum(np.hypot(np.diff(xs), np.diff(ys)))]
    # bredde langs buen, tykkelse, højde: fortænder, hjørnetand, kindtænder
    tænder = [(0.85, 0.32, 0.95), (0.66, 0.32, 0.88), (0.75, 0.5, 1.0), (0.7, 0.75, 0.8),
              (0.7, 0.75, 0.78), (1.0, 0.95, 0.72), (0.95, 0.9, 0.7), (0.85, 0.85, 0.66)]
    for side in (1, -1):
        pos = 0.0
        for b, t, h in tænder:
            c = (pos + b / 2) * skala
            x = np.interp(c, bue, xs)
            y = np.interp(c, bue, ys)
            tx, ty = 1.0, 2 * a * x
            ang = math.atan2(ty, tx)
            ret = bmesh.ops.create_uvsphere(bm, u_segments=14, v_segments=10, radius=0.5)
            vs = ret['verts']
            # lidt flad top på kindtænderne
            for v in vs:
                v.co.z = max(-0.42, min(0.42, v.co.z * 1.08))
            M_ = (Matrix.Translation((side * x * skala, y0 + (y - y0) * skala, z))
                  @ Matrix.Rotation(side * ang, 4, 'Z')
                  @ Matrix.Diagonal((b * 0.96 * skala, t * skala, h, 1)))
            bmesh.ops.transform(bm, matrix=M_, verts=vs)
            pos += b
    me = bpy.data.meshes.new('t')
    bm.to_mesh(me)
    bm.free()
    return me


def tænder():
    me_o = tandbue(55.55, 1.0, 1)
    me_u = tandbue(54.45, 0.93, -1)
    bm = bmesh.new()
    bm.from_mesh(me_o)
    bm.from_mesh(me_u)
    bmesh.ops.translate(bm, vec=(0, 0.0, 0), verts=bm.verts)
    me = bpy.data.meshes.new('Taender')
    bm.to_mesh(me)
    bm.free()
    for m in (me_o, me_u):
        bpy.data.meshes.remove(m)
    o = bpy.data.objects.new('Taender', me)
    me.materials.append(M['taender'])
    me.shade_smooth()
    return o


placér(tænder(), C_MUND, 'taender')


def gane():
    """Den hårde og bløde gane som en hvælvet plade over tungen, plus gummerne langs tandbuerne."""
    nu, nv = 24, 40
    V, F = [], []
    for iv in range(nv):
        v = iv / (nv - 1)
        y = -7.4 + v * 7.4
        xa = min(2.45, math.sqrt(max(0.0, (y + 7.8) / 0.9))) * 0.9
        for iu in range(nu):
            u = -1 + 2 * iu / (nu - 1)
            z = 56.2 + 0.75 * (1 - u * u) * min(1, (y + 7.6) / 2.5) - 0.9 * max(0, v - 0.8) ** 1.5 * 5
            V.append((u * xa, y, z))
    for iv in range(nv - 1):
        for iu in range(nu - 1):
            a = iv * nu + iu
            F.append((a, a + 1, a + nu + 1, a + nu))
    o = mesh_obj('Gane', V, F, M['gane'])
    md = o.modifiers.new('tyk', 'SOLIDIFY')
    md.thickness = 0.3
    return o


_g = gane()
anvend_modifikatorer(_g, C_MUND)
_g['del'] = 'gane'
for z, sk, navn in ((56.05, 1.0, 'Gummer_over'), (53.95, 0.93, 'Gummer_under')):
    xs = np.linspace(-2.75, 2.75, 23)
    ys = -7.8 + 0.9 * xs ** 2
    pkt = np.c_[xs * sk, -7.8 + (ys + 7.8) * sk, np.full_like(xs, z), np.full_like(xs, 0.3)]
    o, _, _ = rør(navn, pkt, M['gane'], trin=0.12, seg=14, start='rund', slut='rund')
    placér(o, C_MUND, 'gane')

# ---- spytkirtlerne (begge sider) og deres udførselsgange
for side in (1, -1):
    S = 'V' if side > 0 else 'H'   # patientens venstre/højre
    o = klump('Oerespytkirtel_' + S, [
        ((side * 5.8, 0.6, 57.6), (1.25, 2.0, 2.5)),
        ((side * 5.3, 1.6, 54.8), (1.0, 1.2, 1.3)),
        ((side * 5.4, -1.2, 57.4), (0.9, 1.0, 1.0)),
    ], M['spyt'], opløsning=0.15, støj=(0.16, 1.4))
    placér(o, C_MUND, 'spytkirtel', 'Ørespytkirtel')
    o = klump('Underkaebespytkirtel_' + S, [
        ((side * 3.9, -2.2, 51.8), (1.25, 1.8, 1.1)),
        ((side * 3.2, -3.4, 52.4), (0.8, 0.9, 0.7)),
    ], M['spyt'], opløsning=0.12, støj=(0.13, 1.6))
    placér(o, C_MUND, 'spytkirtel', 'Underkæbespytkirtel')
    o = klump('Undertungespytkirtel_' + S, [
        ((side * 1.75, -5.0, 53.2), (0.5, 1.5, 0.5)),
    ], M['spyt'], opløsning=0.08, støj=(0.07, 2.5))
    placér(o, C_MUND, 'spytkirtel', 'Undertungespytkirtel')
    for navn, pkt in (
        ('Spytgang_oere_' + S, [(side * 5.3, -1.4, 57.2, 0.16), (side * 4.7, -2.9, 56.8, 0.16),
                                (side * 3.5, -3.6, 56.2, 0.15), (side * 2.9, -3.5, 56.0, 0.15)]),
        ('Spytgang_underkaebe_' + S, [(side * 3.3, -3.8, 52.6, 0.12), (side * 2.4, -4.8, 53.1, 0.12),
                                      (side * 1.1, -6.1, 53.6, 0.11), (side * 0.5, -6.6, 53.8, 0.1)]),
    ):
        o, _, _ = rør(navn, pkt, M['spytgang'], trin=0.1, seg=10, start='rund', slut='rund')
        placér(o, C_MUND, 'spytkirtel', 'Spytgang')


# ================================================================= KROPPEN (gennemsigtig)
krop = klump('Krop', [
    ((0, -0.4, 63.5), (7.4, 9.0, 11.0)),       # hoved
    ((0, -4.2, 55.0), (5.3, 5.6, 4.6)),        # kæbe og mund
    ((0, 1.2, 45.5), (5.6, 5.2, 7.0)),         # hals
    ((0, 1.0, 33.0), (16.5, 9.5, 7.5)),        # skuldre og bryst
    ((0, 0.8, 22.0), (16.5, 11.0, 11.0)),      # brystkasse
    ((0, -0.6, 5.0), (15.8, 11.0, 12.0)),      # bug
    ((0, 0.2, 14.0), (17.4, 11.0, 7.0)),       # nederste ribben
    ((0, 0.6, -12.0), (17.2, 10.6, 10.0)),     # bækken
    ((8.0, 1.0, -26.0), (7.2, 8.0, 8.0)),      # lårstumper
    ((-8.0, 1.0, -26.0), (7.2, 8.0, 8.0)),
    ((17.5, 2.0, 35.0), (4.6, 5.0, 5.4)),      # skulderstumper
    ((-17.5, 2.0, 35.0), (4.6, 5.0, 5.4)),
], M['krop'], opløsning=0.9, glat=6)
anvend_modifikatorer(krop, C_KROP)
krop['del'] = 'krop'


# ================================================================= madens vej (forloeb.json)
mund_pkt = np.array([(0, -9.6, 55.0), (0, -7.0, 55.25), (0, -4.0, 55.75), (0, -1.0, 55.3), (0, 1.2, 54.0),
                     (0, 2.2, 51.5), (0, 2.5, 48.5)])
mave_vej = np.array([(5.6, 1.9, 16.8), (7.6, 0.6, 14.0), (8.0, -0.6, 10.6), (6.6, -2.4, 7.8),
                     (4.0, -3.8, 6.3), (1.0, -4.3, 6.9), (-1.4, -3.9, 8.3), (-3.0, -3.3, 9.2)])
tyk_vej = np.vstack([[TYND_SLUT], [(-11.4, -0.6, -10.6)], P_tyk[np.argmin(np.abs(P_tyk[:, 2] + 9.0)):]])


def glat_vej(P, trin=0.5):
    return gensample(catmull(np.asarray(P, float)), trin)[0]


dele = [
    ('mund', glat_vej(mund_pkt[:4])),
    ('svaelg', glat_vej(mund_pkt[3:])),
    ('spiseroer', glat_vej(np.array(spiseroer_pkt)[:, :3])),
    ('mavesaek', glat_vej(mave_vej)),
    ('tolvfingertarm', glat_vej(np.array(tolv_pkt)[:, :3])),
    ('tyndtarm', gensample(P_tynd, 0.5)[0]),
    ('tyktarm', glat_vej(tyk_vej[::4], 0.5)),
    ('endetarm', glat_vej(np.array(endetarm_pkt)[1:, :3])),
]


def til_gltf(P):
    P = np.asarray(P)
    return np.round(np.c_[P[:, 0], P[:, 2], -P[:, 1]], 2).tolist()


with open(os.path.join(UD, 'forloeb.json'), 'w') as f:
    json.dump({'enhed': 'cm', 'dele': [{'del': d, 'punkter': til_gltf(P)} for d, P in dele]}, f)


# ================================================================= lys, kamera og gem
def kamera(navn, pos, mål, linse=50):
    cam = bpy.data.cameras.new(navn)
    cam.lens = linse
    cam.clip_end = 2000
    o = bpy.data.objects.new(navn, cam)
    C_LYS.objects.link(o)
    o.location = pos
    d = Vector(mål) - Vector(pos)
    o.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
    return o


for navn, type_, pos, mål, energi in (('Sol', 'SUN', (-60, -120, 120), (0, 0, 10), 2.2),
                                      ('Fyld', 'AREA', (120, -80, 40), (0, 0, 10), 2.0e5),
                                      ('Kant', 'AREA', (0, 140, 80), (0, 0, 10), 1.5e5)):
    l = bpy.data.lights.new(navn, type_)
    l.energy = energi
    if type_ == 'AREA':
        l.size = 80
    o = bpy.data.objects.new(navn, l)
    o.location = pos
    o.rotation_euler = (Vector(mål) - Vector(pos)).to_track_quat('-Z', 'Y').to_euler()
    C_LYS.objects.link(o)

w = bpy.data.worlds.new('FD_Verden')
w.use_nodes = True
w.node_tree.nodes['Background'].inputs['Color'].default_value = (0.93, 0.91, 0.87, 1)
w.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.35
sc.world = w

kamera('Forfra', (0, -150, 0), (0, 0, 0), 50)
kamera('Skraat', (70, -130, 25), (0, 0, 0), 50)
kamera('Siden', (150, 0, 0), (0, 0, 0), 50)
kamera('Helhed', (0, -230, 15), (0, 0, 15), 50)
kamera('Hoved', (40, -70, 60), (0, -1, 54), 60)

sc.render.engine = 'BLENDER_EEVEE'
sc.render.resolution_x, sc.render.resolution_y = 900, 1100
sc.eevee.taa_render_samples = 32
sc.view_settings.view_transform = 'Standard'

bpy.ops.wm.save_as_mainfile(filepath=os.path.join(UD, 'Fordoejelse.blend'))

# ---- eksport (kun modellen, uden lys og kameraer)
bpy.ops.object.select_all(action='DESELECT')
for o in C_MODEL.all_objects:
    o.select_set(True)
bpy.ops.export_scene.gltf(filepath=os.path.join(UD, 'Fordoejelse.glb'), export_format='GLB',
                          use_selection=True, export_apply=True, export_extras=True, export_cameras=False,
                          export_lights=False, export_yup=True, export_materials='EXPORT')
tot = sum(len(o.data.vertices) for o in C_MODEL.all_objects if o.type == 'MESH')
print('EKSPORT', os.path.getsize(os.path.join(UD, 'Fordoejelse.glb')), 'bytes,', tot, 'punkter,',
      len(C_MODEL.all_objects), 'objekter')

if RENDER:
    pre = os.path.join(UD, '_preview')
    os.makedirs(pre, exist_ok=True)
    for k in [o for o in C_LYS.objects if o.type == 'CAMERA']:
        krop.hide_render = k.name != 'Helhed'
        sc.camera = k
        sc.render.filepath = os.path.join(pre, k.name + '.png')
        bpy.ops.render.render(write_still=True)
        print('RENDER', sc.render.filepath)

if RESERVE:
    # gennemsigtig baggrund, lagt på sidens papirfarve og gemt som JPEG
    krop.hide_render = False
    sc.camera = bpy.data.objects['Helhed']
    sc.render.film_transparent = True
    sc.render.resolution_x, sc.render.resolution_y = 700, 1000
    sc.render.image_settings.file_format = 'PNG'
    sc.render.image_settings.color_mode = 'RGBA'
    png = os.path.join(UD, '_reserve.png')
    sc.render.filepath = png
    bpy.ops.render.render(write_still=True)
    img = bpy.data.images.load(png)
    px = np.array(img.pixels[:]).reshape(-1, 4)
    papir = np.array(srgb('#FFF9EE'))
    px[:, :3] = px[:, :3] * px[:, 3:4] + papir * (1 - px[:, 3:4])
    px[:, 3] = 1
    img.pixels[:] = px.ravel()
    img.filepath_raw = os.path.join(UD, 'reserve.jpg')
    img.file_format = 'JPEG'
    img.save()
    print('RESERVE', img.filepath_raw)
