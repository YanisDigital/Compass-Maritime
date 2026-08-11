/**
 * Draws the application icon and writes it as PNG at the sizes the manifest asks for.
 *
 * The icon is a compass rose: four diamonds forming eight points, the northern point
 * picked out in the accent colour, inside a ring. Everything is computed here rather
 * than checked in as opaque binaries, so the icon can be adjusted by editing numbers.
 *
 *   node scripts/make-icons.mjs
 */
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const WEB = join(ROOT, 'apps', 'web', 'public');
const TAURI = join(ROOT, 'src-tauri', 'icons');

const BACKGROUND = [0x0b, 0x12, 0x20];
const ROSE = [0xe6, 0xed, 0xf7];
const NORTH = [0x4d, 0xa3, 0xff];
const RING = [0x3b, 0x4c, 0x6d];

/** A diamond of half-length `long` and half-width `wide`, pointing along `angle`. */
function diamond(x, y, angle, long, wide) {
  const u = x * Math.cos(angle) + y * Math.sin(angle);
  const v = -x * Math.sin(angle) + y * Math.cos(angle);
  return Math.abs(u) / long + Math.abs(v) / wide <= 1;
}

/**
 * Colour at a point in the square, in coordinates running −1…1 with y upward.
 * `art` scales the rose down so a maskable icon survives being cropped to a circle.
 */
function sample(x, y, art) {
  const r = Math.hypot(x, y) / art;
  const px = x / art;
  const py = y / art;

  if (r > 0.99) return BACKGROUND;
  if (r > 0.9) return RING;

  const northPoint = diamond(px, py - 0.0, Math.PI / 2, 0.78, 0.13) && py > 0;
  if (northPoint) return NORTH;

  const onRose =
    diamond(px, py, Math.PI / 2, 0.78, 0.13) ||
    diamond(px, py, 0, 0.78, 0.13) ||
    diamond(px, py, Math.PI / 4, 0.52, 0.085) ||
    diamond(px, py, -Math.PI / 4, 0.52, 0.085);

  return onRose ? ROSE : BACKGROUND;
}

function render(size, art) {
  const samples = 3;
  const pixels = Buffer.alloc(size * size * 4);

  for (let row = 0; row < size; row++) {
    for (let column = 0; column < size; column++) {
      let red = 0;
      let green = 0;
      let blue = 0;
      for (let sy = 0; sy < samples; sy++) {
        for (let sx = 0; sx < samples; sx++) {
          const x = ((column + (sx + 0.5) / samples) / size) * 2 - 1;
          const y = 1 - ((row + (sy + 0.5) / samples) / size) * 2;
          const colour = sample(x, y, art);
          red += colour[0];
          green += colour[1];
          blue += colour[2];
        }
      }
      const total = samples * samples;
      const offset = (row * size + column) * 4;
      pixels[offset] = Math.round(red / total);
      pixels[offset + 1] = Math.round(green / total);
      pixels[offset + 2] = Math.round(blue / total);
      pixels[offset + 3] = 255;
    }
  }
  return pixels;
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

function png(size, pixels) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8; // bit depth
  header[9] = 6; // RGBA
  header[10] = 0;
  header[11] = 0;
  header[12] = 0;

  // Each scanline is prefixed with its filter type, here always 0 (none).
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let row = 0; row < size; row++) {
    raw[row * (size * 4 + 1)] = 0;
    pixels.copy(raw, row * (size * 4 + 1) + 1, row * size * 4, (row + 1) * size * 4);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/**
 * A Windows .ico holding PNG-compressed images, which Vista and later accept directly.
 * Width and height of 0 in a directory entry mean 256.
 */
function ico(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);

  const directory = Buffer.alloc(16 * images.length);
  let offset = header.length + directory.length;

  images.forEach(({ size, data }, index) => {
    const entry = index * 16;
    directory[entry] = size >= 256 ? 0 : size;
    directory[entry + 1] = size >= 256 ? 0 : size;
    directory.writeUInt16LE(1, entry + 4);
    directory.writeUInt16LE(32, entry + 6);
    directory.writeUInt32LE(data.length, entry + 8);
    directory.writeUInt32LE(offset, entry + 12);
    offset += data.length;
  });

  return Buffer.concat([header, directory, ...images.map((image) => image.data)]);
}

const cache = new Map();
const image = (size, art) => {
  const key = `${size}:${art}`;
  if (!cache.has(key)) cache.set(key, png(size, render(size, art)));
  return cache.get(key);
};

for (const directory of [WEB, TAURI]) mkdirSync(directory, { recursive: true });

// Progressive web app, installed from a browser.
for (const [name, size, art] of [
  ['icon-192.png', 192, 0.92],
  ['icon-512.png', 512, 0.92],
  ['icon-512-maskable.png', 512, 0.72],
  ['apple-touch-icon.png', 180, 0.92],
]) {
  writeFileSync(join(WEB, name), image(size, art));
  console.log(`wrote apps/web/public/${name} (${size}×${size})`);
}

// Desktop shell. The names are the ones Tauri's bundler looks for.
for (const [name, size] of [
  ['32x32.png', 32],
  ['128x128.png', 128],
  ['128x128@2x.png', 256],
  ['icon.png', 512],
]) {
  writeFileSync(join(TAURI, name), image(size, 0.92));
  console.log(`wrote src-tauri/icons/${name} (${size}×${size})`);
}

writeFileSync(
  join(TAURI, 'icon.ico'),
  ico([16, 32, 48, 256].map((size) => ({ size, data: image(size, 0.92) }))),
);
console.log('wrote src-tauri/icons/icon.ico (16, 32, 48, 256)');
