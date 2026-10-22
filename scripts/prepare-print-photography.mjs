import { mkdir, readdir, copyFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const sharp = createRequire(require.resolve('next/package.json'))('sharp');

const root = path.resolve('apps/print/public/images/products-v3');
const originals = path.resolve('output/print-photography/originals');
await mkdir(originals, { recursive: true });
const files = (await readdir(root)).filter(file => file.endsWith('.png')).sort();
const report = [];
for (const file of files) {
  const input = path.join(root, file);
  const source = await sharp(input).metadata();
  if (!source.width || !source.height || source.width < 1536) throw new Error(`Insufficient source resolution: ${file}`);
  await copyFile(input, path.join(originals, file));
  const outputs = [];
  for (const width of [480, 960, 1536]) {
    const destination = path.join(root, `${file.slice(0, -4)}-${width}.webp`);
    await sharp(input).resize({ width, withoutEnlargement: true }).webp({ quality: 88, effort: 5 }).toFile(destination);
    outputs.push({ width, file: path.basename(destination), bytes: (await stat(destination)).size });
  }
  report.push({ source: file, width: source.width, height: source.height, outputs });
}
await writeFile('output/print-photography/responsive-assets.json', JSON.stringify(report, null, 2) + '\n');
console.log(`Prepared responsive WebP variants for ${report.length} originals; original pixels preserved.`);
