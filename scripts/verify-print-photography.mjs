import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const sharp = createRequire(require.resolve('next/package.json'))('sharp');
import { products } from '../apps/print/lib/presswerk/catalog.ts';

const root = path.resolve('apps/print/public/images/products-v4');
let checked = 0;
for (const id of ['home-editorial', ...products.flatMap(product => ['hero', 'angle', 'detail'].map(view => `${product.id}-${view}`))]) {
  const hashes = [];
  for (const width of [480, 960, 1536]) {
    const file = path.join(root, `${id}-${width}.webp`);
    const meta = await sharp(file).metadata();
    assert.equal(meta.width, width, file);
    assert.ok(meta.height >= width / 2, `Unexpected image aspect: ${file}`);
    assert.ok((await stat(file)).size > 2000, `Empty image: ${file}`);
    hashes.push(createHash('sha256').update(await readFile(file)).digest('hex'));
    checked++;
  }
  assert.equal(new Set(hashes).size, 3, `Responsive files must be separately encoded: ${id}`);
}
for (const product of products) {
  const hashes = await Promise.all(['hero', 'angle', 'detail'].map(async view => createHash('sha256').update(await readFile(path.join(root, `${product.id}-${view}-1536.webp`))).digest('hex')));
  assert.equal(new Set(hashes).size, 3, `${product.id} needs three distinct photographs`);
}
console.log(`PASS ${products.length} complete three-view product galleries, homepage hero, and ${checked} responsive images.`);
