# Eksportér Bacterial_Cell fra Bakteriecelle.blend til GLB og genimportér som kontrol.
#   Blender -b <mappe>/Bakteriecelle.blend --python biologi/celle-3d/blender/eksport.py -- <mappe>
# Komprimeres bagefter med gltf-transform (se celle-3d/LÆS-MIG.md).
import bpy, sys, os

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
UD = argv[0] if argv else os.path.dirname(bpy.data.filepath)
fil = os.path.join(UD, 'Bakteriecelle.glb')

bpy.ops.object.select_all(action='DESELECT')
celle = list(bpy.data.collections["Bacterial_Cell"].all_objects)
cellenavne = {o.name for o in celle}
for o in celle:
    o.select_set(True)
bpy.ops.export_scene.gltf(filepath=fil, export_format='GLB', use_selection=True, export_apply=True,
                          export_extras=True, export_cameras=False, export_lights=False, export_yup=True,
                          export_materials='EXPORT', export_image_format='AUTO')
print('EKSPORT', fil, os.path.getsize(fil))

# genimport: alle strukturer skal stadig være selvstændige, navngivne objekter med egenskaber
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=fil)
navne = sorted(o.name for o in bpy.data.objects)
mangler = sorted(cellenavne - set(navne))
print('GENIMPORT', len(navne), 'objekter; mangler:', mangler)
for o in bpy.data.objects:
    if 'struktur' not in o.keys():
        print('UDEN STRUKTUR', o.name)
