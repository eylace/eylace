import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BD_DISTRICT_LIST } from '../src/data/bdDistrictCoords';
import { extractDistrictFromText } from '../src/lib/districtMapping';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const geoPath = process.argv[2] || path.join(__dirname, '..', '.cache', 'bd.geojson');

if (!fs.existsSync(geoPath)) {
  console.error(`GeoJSON not found at ${geoPath}. Pass a path as the first argument.`);
  process.exit(1);
}

const geo = JSON.parse(fs.readFileSync(geoPath, 'utf8'));
const polygonNames = new Set<string>();
for (const feature of geo.features ?? []) {
  const name = feature?.properties?.NAME_3 || feature?.properties?.NAME_2 || feature?.properties?.name;
  if (name) polygonNames.add(name);
}

type Row = { district: string; polygon: string | null; status: 'matched' | 'missing' };
const rows: Row[] = BD_DISTRICT_LIST.map((district) => {
  const hit = [...polygonNames].find((name) => extractDistrictFromText(name).district === district.name) ?? null;
  return { district: district.name, polygon: hit, status: hit ? 'matched' : 'missing' };
});

const matched = rows.filter((row) => row.status === 'matched');
const missing = rows.filter((row) => row.status === 'missing');

console.log(`Total districts: ${BD_DISTRICT_LIST.length}`);
console.log(`Polygons in dataset: ${polygonNames.size}`);
console.log(`Matched: ${matched.length}`);
console.log(`Missing: ${missing.length}`);
if (missing.length > 0) {
  console.log('Unmapped districts:');
  for (const row of missing) console.log(` - ${row.district}`);
  process.exit(1);
}
