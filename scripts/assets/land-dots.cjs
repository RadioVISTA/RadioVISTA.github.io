// 1.5° land dot grid for the world map (public/rv/land.json), from Natural Earth 50m via world-atlas.
// Run:  npm i --no-save world-atlas@2.0.2 topojson-client@3.1.0 d3-geo@3.1.1 && node scripts/assets/land-dots.cjs 1.5 public/rv/land.json
const M = (p) => require(p)
const { feature } = M('topojson-client')
const { geoContains } = M('d3-geo')
const topo = M('world-atlas/land-50m.json')
const land = feature(topo, topo.objects.land)
const step = Number(process.argv[2] || 1.5)
const pts = []
for (let lat = 80 - step / 2; lat > -56; lat -= step)
  for (let lon = -180 + step / 2; lon < 180; lon += step)
    if (geoContains(land, [lon, lat])) pts.push([+lon.toFixed(2), +lat.toFixed(2)])
require('fs').writeFileSync(process.argv[3], JSON.stringify({ step, points: pts }))
console.log(step, pts.length)
