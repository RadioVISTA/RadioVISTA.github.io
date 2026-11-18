"""Web layers for the F2 hidden-target case (paper Fig. Lusaka): Blender render, the reference and
target fields as transparent viridis layers, and region boxes with their coverages."""
import json, sys
from pathlib import Path
import h5py, numpy as np, matplotlib
from PIL import Image

HOME = Path.home()
sys.path.insert(0, str(HOME / "doing/RadioVISTA/paper/fig"))
sys.argv = sys.argv[:1]
import make_figures as mf  # noqa: E402
import make_scene_figs as sf  # noqa: E402

QID = "F2/lusaka/l2/00001"
OUT = HOME / "tmp_site_export/out"
SIZE = 1200
vir = matplotlib.colormaps["viridis"]
t = sf.load(QID)
regions, sources = t["meta"]["regions"], t["q"]["sources"]
city = QID.split("/")[1]
mask = mf.building_mask(city)[::-1]


def layer(source, name):
    with h5py.File(sf.RAW / source / "radio.h5") as h:
        f = np.nan_to_num(h["serving_rss_w"][()])
    on = (f > 0) & ~mask
    db = 10 * np.log10(np.where(on, f, 1)) + 30
    tt = np.clip((db + 110) / 90, 0, 1)
    rgba = np.zeros((*f.shape, 4), np.uint8)
    rgba[..., :3] = (vir(tt)[..., :3] * 255).astype(np.uint8)
    rgba[..., 3] = np.where(on, 150 + 105 * tt, 0).astype(np.uint8)
    Image.fromarray(rgba[::-1], "RGBA").resize((SIZE, SIZE), Image.LANCZOS).save(OUT / f"{name}.webp", quality=84, method=6)
    return f"{name}.webp"


render = Image.open(Path("/mnt/data/yiyang/radiovista/dataset/radiovista/previews/blender") / city / "top.png").convert("RGB")
render.resize((SIZE, SIZE), Image.LANCZOS).save(OUT / "case_render.webp", quality=80, method=6)
case = {"qid": QID, "city": city, "sources": sources, "render": "case_render.webp",
        "ref": layer(sources[0], "case_ref"), "tgt": layer(sources[1], "case_tgt"), "regions": {}}
for label, r in regions.items():
    (x0, y0), (x1, y1) = r["xy_bounds_m"]
    # fractions of the 2 km frame, origin top-left, matching the north-up images
    case["regions"][label] = {"x": (x0 + 1000) / 2000, "y": (1000 - y1) / 2000, "w": (x1 - x0) / 2000, "h": (y1 - y0) / 2000,
                              "ref": round(100 * r["sources"][0]["coverage"], 1), "tgt": round(100 * r["sources"][1]["coverage"], 1)}
case["ref_best"] = max(case["regions"], key=lambda k: case["regions"][k]["ref"])
case["tgt_best"] = max(case["regions"], key=lambda k: case["regions"][k]["tgt"])
json.dump(case, open(OUT / "case.json", "w"), indent=1)
print(json.dumps(case)[:900])
