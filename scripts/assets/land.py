import json, numpy as np, geopandas as gpd
from pathlib import Path
from shapely.geometry import Point
from shapely.prepared import prep
from shapely.ops import unary_union
shp = next(Path(gpd.__file__).parents[1].glob("pyogrio/tests/fixtures/naturalearth_lowres/naturalearth_lowres.shp"))
w = gpd.read_file(shp)
w = w[w["continent"] != "Antarctica"] if "continent" in w else w
land = prep(unary_union(list(w.geometry)))
step = 2.0
pts = [[round(lon,1), round(lat,1)] for lat in np.arange(-56, 80, step) for lon in np.arange(-180, 180, step) if land.contains(Point(lon, lat))]
json.dump({"step": step, "points": pts}, open(Path.home()/"tmp_site_export/out/land.json","w"))
print(len(pts))
