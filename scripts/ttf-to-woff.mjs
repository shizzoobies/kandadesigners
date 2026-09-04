// TTF/OTF to WOFF (version 1) with no dependencies: a WOFF file is the
// SFNT header and table directory re-expressed, with each table deflated.
// This repo takes no new npm packages (see a11y-check.mjs for why), and
// node's zlib does the compression. Output is typically half the TTF.
//
//   node scripts/ttf-to-woff.mjs public/fonts/LeniaMono-Regular.ttf [more.ttf]
//
// Writes <name>.woff beside each input and prints the sizes. WOFF2 would be
// smaller still but needs Brotli plus table transforms; WOFF is universal.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const pad4 = (n) => (n + 3) & ~3;

function convert(file) {
  const ttf = fs.readFileSync(file);
  const flavor = ttf.readUInt32BE(0);
  const numTables = ttf.readUInt16BE(4);
  const tables = [];
  for (let i = 0; i < numTables; i++) {
    const o = 12 + i * 16;
    tables.push({
      tag: ttf.subarray(o, o + 4),
      checksum: ttf.readUInt32BE(o + 4),
      offset: ttf.readUInt32BE(o + 8),
      length: ttf.readUInt32BE(o + 12),
    });
  }
  // Tables must be written in ascending original offset order.
  tables.sort((a, b) => a.offset - b.offset);

  const dirSize = 44 + numTables * 20;
  let dataOffset = dirSize;
  const dir = Buffer.alloc(numTables * 20);
  const blobs = [];
  let totalSfntSize = 12 + numTables * 16;
  tables.forEach((t, i) => {
    const raw = ttf.subarray(t.offset, t.offset + t.length);
    let comp = zlib.deflateSync(raw, { level: 9 });
    if (comp.length >= raw.length) comp = raw; // spec: store uncompressed if no gain
    const e = i * 20;
    t.tag.copy(dir, e);
    dir.writeUInt32BE(dataOffset, e + 4);
    dir.writeUInt32BE(comp.length, e + 8);
    dir.writeUInt32BE(raw.length, e + 12);
    dir.writeUInt32BE(t.checksum, e + 16);
    const padded = Buffer.alloc(pad4(comp.length));
    comp.copy(padded);
    blobs.push(padded);
    dataOffset += padded.length;
    totalSfntSize += pad4(raw.length);
  });

  // The directory must be in tag order per the WOFF spec.
  const entries = [];
  for (let i = 0; i < numTables; i++) entries.push(dir.subarray(i * 20, i * 20 + 20));
  entries.sort((a, b) => Buffer.compare(a.subarray(0, 4), b.subarray(0, 4)));
  const sortedDir = Buffer.concat(entries);

  const header = Buffer.alloc(44);
  header.write('wOFF', 0, 'ascii');
  header.writeUInt32BE(flavor, 4);
  header.writeUInt32BE(dataOffset, 8); // total WOFF length
  header.writeUInt16BE(numTables, 12);
  header.writeUInt16BE(0, 14); // reserved
  header.writeUInt32BE(totalSfntSize, 16);
  header.writeUInt16BE(1, 20); // major version
  header.writeUInt16BE(0, 22); // minor version
  // metaOffset, metaLength, metaOrigLength, privOffset, privLength stay 0.

  const out = Buffer.concat([header, sortedDir, ...blobs]);
  const dest = file.replace(/\.(ttf|otf)$/i, '.woff');
  fs.writeFileSync(dest, out);
  console.log(`${path.basename(file)} ${Math.round(ttf.length / 1024)} KB -> ${path.basename(dest)} ${Math.round(out.length / 1024)} KB`);
}

process.argv.slice(2).forEach(convert);
