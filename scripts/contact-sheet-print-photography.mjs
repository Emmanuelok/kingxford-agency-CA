import { createRequire } from 'node:module';
import { mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';
const require = createRequire(import.meta.url);
const sharp = createRequire(require.resolve('next/package.json'))('sharp');
const root = path.resolve('apps/print/public/images/products-v3');
const destination = path.resolve('../validation/print-photography');
await mkdir(destination, { recursive: true });
const files = new Set(await readdir(root));
const ids = process.argv[2] ? process.argv[2].split(',') : [...files].filter(file => file.endsWith('-hero.png')).map(file => file.slice(0, -9)).sort();
const views = ['hero', 'angle', 'detail'];
let pages = 0;
for (let offset = 0; offset < ids.length; offset += 4) {
  const group = ids.slice(offset, offset + 4);
  const layers = [];
  for (const [row, id] of group.entries()) {
    for (const [column, view] of views.entries()) {
      const file = `${id}-${view}.png`;
      if (!files.has(file)) continue;
      layers.push({ input: await sharp(path.join(root, file)).resize(360, 240, { fit: 'contain', background: '#ecebe6' }).toBuffer(), left: column * 360, top: row * 265 });
      layers.push({ input: Buffer.from(`<svg width="360" height="25"><rect width="360" height="25" fill="#fff"/><text x="10" y="17" font-size="13" font-family="Arial" fill="#193b2b">${id} / ${view}</text></svg>`), left: column * 360, top: row * 265 + 240 });
    }
  }
  await sharp({ create: { width: 1080, height: group.length * 265, channels: 3, background: '#f0eee8' } }).composite(layers).png().toFile(path.join(destination, `${process.argv[2] ? 'selection' : 'gallery'}-sheet-${String(++pages).padStart(2, '0')}.png`));
}
console.log(`Prepared ${pages} gallery review sheets for ${ids.length} products.`);
