import sharp from "sharp";
const [dir, out, w, ...names] = process.argv.slice(2);
const W = Number(w);
const imgs = [];
for (const n of names) imgs.push(await sharp(`${dir}/${n}`).resize({ width: W }).toBuffer());
const metas = await Promise.all(imgs.map(i => sharp(i).metadata()));
const H = Math.max(...metas.map(m => m.height));
await sharp({ create: { width: names.length * (W + 16), height: H, channels: 3, background: "#777" } })
  .composite(imgs.map((input, i) => ({ input, left: i * (W + 16), top: 0 }))).png().toFile(out);
