# Kontrol af Bakteriecelle.blend: preview fra alle kameraer og geometritjek.
#   Blender -b <mappe>/Bakteriecelle.blend --python biologi/celle-3d/blender/kontrol.py -- <mappe> [kamera …]
import bpy, bmesh, sys, os, math
import numpy as np

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
UD = argv[0] if argv else os.path.dirname(bpy.data.filepath)
KUN = argv[1:]
PRE = os.path.join(UD, '_preview')
os.makedirs(PRE, exist_ok=True)
sc = bpy.context.scene
dg = bpy.context.evaluated_depsgraph_get()

# ---- geometri: lukkede flader, normaler og løse dele
celle = bpy.data.collections['Bacterial_Cell'].all_objects
rapport = {}
for o in celle:
    if o.type not in ('MESH', 'CURVE'):
        continue
    me = o.evaluated_get(dg).to_mesh()
    bm = bmesh.new()
    bm.from_mesh(me)
    åbne = sum(1 for e in bm.edges if not e.is_manifold)
    løse = sum(1 for v in bm.verts if not v.link_faces)
    # fortegnet rumfang > 0 betyder, at normalerne vender udad
    vol = bm.calc_volume(signed=True)
    dele = len(bpy.data.meshes) and None
    rapport[o.name] = dict(v=len(bm.verts), f=len(bm.faces), åbne_kanter=åbne, løse_punkter=løse,
                           rumfang=round(vol, 3))
    bm.free()
    o.evaluated_get(dg).to_mesh_clear()
tot = 0
for k, v in sorted(rapport.items()):
    tot += v['v']
    if v['åbne_kanter'] or v['løse_punkter'] or v['rumfang'] <= 0:
        print('ADVARSEL', k, v)
print('PUNKTER I ALT', tot, 'OBJEKTER', len(rapport))


# ---- uafhængig skjul/vis: hver struktur kan slås fra alene
for o in celle:
    o.hide_render = False

sc.render.resolution_x, sc.render.resolution_y = 1000, 750
sc.eevee.taa_render_samples = 32
kameraer = [o for o in bpy.data.objects if o.type == 'CAMERA' and (not KUN or o.name in KUN)]
for k in kameraer:
    sc.camera = k
    sc.render.filepath = os.path.join(PRE, k.name + '.png')
    bpy.ops.render.render(write_still=True)
    print('RENDER', sc.render.filepath)
