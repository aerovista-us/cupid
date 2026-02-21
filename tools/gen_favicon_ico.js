#!/usr/bin/env node
/**
 * Generate favicon.ico from a 32x32 RGBA pattern (heart-ish pink pixel).
 * Run from repo root: node tools/gen_favicon_ico.js
 * Output: favicon.ico
 */
const fs = require('fs');
const path = require('path');

const W = 32, H = 32;
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0);   // reserved
header.writeUInt16LE(1, 2);   // type 1 = ICO
header.writeUInt16LE(1, 4);   // count

const entry = Buffer.alloc(16);
entry[0] = W;
entry[1] = H;
entry[2] = 0;
entry[3] = 0;
entry.writeUInt16LE(1, 4);
entry.writeUInt16LE(32, 6);
const dibSize = 40 + W * H * 4;
const imageOffset = 6 + 16;
entry.writeUInt32LE(dibSize, 8);
entry.writeUInt32LE(imageOffset, 12);

// BITMAPINFOHEADER (40 bytes)
const dib = Buffer.alloc(40);
dib.writeUInt32LE(40, 0);      // size
dib.writeInt32LE(W, 4);
dib.writeInt32LE(H * 2, 8);    // height * 2 for image + mask
dib.writeUInt16LE(1, 12);      // planes
dib.writeUInt16LE(32, 14);     // bit count
dib.writeUInt32LE(0, 16);      // compression
dib.writeUInt32LE(W * H * 4, 20);
// rest 0

// Pixels: 32bpp BGRA, rows bottom-up. Simple pink fill (heart color).
const pixels = Buffer.alloc(W * H * 4);
const pink = { b: 0xbe, g: 0x46, r: 0xff, a: 255 };
for (let y = H - 1; y >= 0; y--) {
  for (let x = 0; x < W; x++) {
    const i = ((H - 1 - y) * W + x) * 4;
    pixels[i] = pink.b;
    pixels[i + 1] = pink.g;
    pixels[i + 2] = pink.r;
    pixels[i + 3] = pink.a;
  }
}

const out = path.join(__dirname, '..', 'favicon.ico');
fs.writeFileSync(out, Buffer.concat([header, entry, dib, pixels]));
console.log('Wrote', out);
