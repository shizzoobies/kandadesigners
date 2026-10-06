// Write the responsive copies of the 2880 px project screenshots that
// src/data/work.js lists (`responsiveWork`, `workWidths`), beside each
// original in public/images/: work-pmbuild.webp -> work-pmbuild-720.webp,
// -1080.webp, -1440.webp. Rerun after replacing any of those screenshots,
// and bump its ?v= in work.js (and HomeWork.astro) so caches refresh.
// Usage: node scripts/build-work-sizes.mjs
import sharp from 'sharp';
import { stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { responsiveWork, workWidths } from '../src/data/work.js';

const dir = resolve('public/images');
for (const name of responsiveWork) {
  const input = resolve(dir, `${name}.webp`);
  const { width } = await sharp(input).metadata();
  if (width !== 2880) throw new Error(`${name}.webp is ${width} px wide; the srcset declares it as 2880w.`);
  const sizes = [];
  for (const w of workWidths) {
    const out = resolve(dir, `${name}-${w}.webp`);
    await sharp(input).resize({ width: w }).webp({ quality: 82, effort: 6 }).toFile(out);
    sizes.push(`${w}: ${(await stat(out)).size}`);
  }
  console.log(`${name}: 2880: ${(await stat(input)).size}; ${sizes.join('; ')} bytes`);
}
