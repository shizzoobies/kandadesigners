// Export reviewed course illustrations for the gallery and social previews.
// Usage: node scripts/build-training-covers.mjs <generated-image-directory>
import sharp from 'sharp';
import { mkdir, stat } from 'node:fs/promises';
import { resolve, join } from 'node:path';

const generated = process.argv[2];
if (!generated) throw new Error('Pass the directory containing the five reviewed generated images.');
const destination = resolve('public/images/training/covers');
await mkdir(destination, { recursive: true });
const inputs = {
  rfi: join(generated, 'exec-9ae8d6d2-10bf-4820-9b73-755ee681fabd.png'),
  safety: join(generated, 'exec-123d360f-9196-4ce8-b145-1021c8c531fe.png'),
  finance: join(generated, 'exec-9d66203c-b760-4972-8570-ab466aff617a.png'),
  nutrition: join(generated, 'exec-58e9670d-650c-4fd3-9c39-3588df808baa.png'),
  strength: resolve('public/training-samples/strength/assets/img/studio.webp'),
  sauna: join(generated, 'exec-f074a6d5-a47b-4612-a518-2574c550c12c.png'),
};
for (const [name, input] of Object.entries(inputs)) {
  const cover = join(destination, `${name}.webp`);
  const social = join(destination, `${name}-social.jpg`);
  await sharp(input).resize(1200, 750, { fit: 'cover', position: 'north' }).webp({ quality: 84, effort: 6 }).toFile(cover);
  await sharp(input).resize(1200, 630, { fit: 'cover', position: 'north' }).jpeg({ quality: 88, mozjpeg: true }).toFile(social);
  console.log(`${name}: cover ${(await stat(cover)).size} bytes; social ${(await stat(social)).size} bytes`);
}
