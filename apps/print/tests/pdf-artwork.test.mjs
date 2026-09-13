import assert from 'node:assert/strict';
import test from 'node:test';
import { deflateSync } from 'node:zlib';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { PDFDocument, PDFName, PDFNumber } from 'pdf-lib';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { PDF_MAX_BYTES, PDF_MAX_RENDER_PIXELS, createRasterPdf, exportArtworkPdf, openPdfImport, pdfExportDimensions, planPdfPlacement, validatePdfFile, validatePdfSelection } from '../lib/next/pdf-artwork.ts';
import { initialDesign } from '../lib/presswerk/catalog.ts';
import { patchPdfRenderer } from '../lib/build/pdfjs-renderer-patch.ts';

// Generate actual, uniformly coloured PNGs rather than mocking the PDF embedder.
function png(width, height, rgb) {
  const chunk = (name, data) => {
    const content = Buffer.concat([Buffer.from(name), data]);
    let crc = 0xffffffff;
    for (const byte of content) { crc ^= byte; for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0); }
    const result = Buffer.alloc(data.length + 12);
    result.writeUInt32BE(data.length); content.copy(result, 4); result.writeUInt32BE((crc ^ 0xffffffff) >>> 0, result.length - 4);
    return result;
  };
  const header = Buffer.alloc(13); header.writeUInt32BE(width); header.writeUInt32BE(height, 4); header[8] = 8; header[9] = 2;
  const scanlines = Buffer.alloc((width * 3 + 1) * height);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) { const i = y * (width * 3 + 1) + 1 + x * 3; scanlines.set(rgb, i); }
  return new Uint8Array(Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), chunk('IHDR', header), chunk('IDAT', deflateSync(scanlines)), chunk('IEND', Buffer.alloc(0))]));
}

test('PDF uploads reject empty and oversized files; extension works when browsers omit MIME', () => {
  assert.doesNotThrow(() => validatePdfFile({ size: PDF_MAX_BYTES, name: 'Artwork.PDF', type: '' }));
  assert.doesNotThrow(() => validatePdfFile({ size: 500, name: 'artwork', type: 'application/pdf' }));
  assert.throws(() => validatePdfFile({ size: PDF_MAX_BYTES + 1, name: 'artwork.pdf', type: 'application/pdf' }), /25 MB/);
  assert.throws(() => validatePdfFile({ size: 0, name: 'empty.pdf', type: 'application/pdf' }), /empty/);
  assert.throws(() => validatePdfFile({ size: 10, name: 'image.png', type: 'image/png' }), /Choose a PDF/);
});

test('page selection checks document bounds and unique print faces without silently losing selections', () => {
  assert.doesNotThrow(() => validatePdfSelection([{ face: 'front', pageNumber: 2 }, { face: 'back', pageNumber: 1 }], 2));
  assert.doesNotThrow(() => validatePdfSelection([{ face: 'front', pageNumber: 1 }, { face: 'back', pageNumber: 1 }], 1));
  assert.throws(() => validatePdfSelection([], 2), /at least one/);
  assert.throws(() => validatePdfSelection([{ face: 'front', pageNumber: 1 }], 101), /1 to 100/);
  assert.throws(() => validatePdfSelection([{ face: 'front', pageNumber: 1.5 }], 2), /not in this PDF/);
  assert.throws(() => validatePdfSelection([{ face: 'front', pageNumber: 3 }], 2), /not in this PDF/);
  assert.throws(() => validatePdfSelection([{ face: 'front', pageNumber: 1 }, { face: 'front', pageNumber: 2 }], 2), /at most one/);
  assert.throws(() => validatePdfSelection([{ face: 'inside', pageNumber: 1 }], 2), /at most one/);
});

test('a misleading PDF filename and cancelled request are rejected before loading a renderer', async () => {
  const file = new File(['This is not a PDF.'], 'looks-valid.pdf', { type: 'application/pdf' });
  await assert.rejects(openPdfImport(file), /valid PDF header/);
  const abort = new AbortController(); abort.abort();
  await assert.rejects(openPdfImport(file, abort.signal), { name: 'AbortError' });
});

test('PDF fitting preserves proportions and centres mismatched pages without stretching', () => {
  const exact = planPdfPlacement({ widthMm: 89, heightMm: 51 }, { width: 89, height: 51 });
  assert.deepEqual(exact.placement, { x: 0, y: 0, width: 100, height: 100 });
  assert.equal(exact.reduced, false); assert.equal(exact.hasMargins, false);
  assert.ok(exact.actualDpi > 299 && exact.actualDpi <= 300);
  const portrait = planPdfPlacement({ widthMm: 51, heightMm: 89 }, { width: 89, height: 51 });
  assert.ok(Math.abs(portrait.placement.height - 100) < 1e-8); assert.ok(portrait.placement.y < 1e-8);
  assert.ok(portrait.placement.width < 34); assert.ok(portrait.placement.x > 33);
  assert.equal(portrait.hasMargins, true);
  const widthMm = portrait.placement.width / 100 * 89, heightMm = portrait.placement.height / 100 * 51;
  assert.ok(Math.abs(widthMm / heightMm - 51 / 89) < .000001);
});

test('oversized import plans explicitly reduce resolution within canvas caps and never produce invalid geometry', () => {
  const large = planPdfPlacement({ widthMm: 1000, heightMm: 2500 }, { width: 1000, height: 2500 });
  assert.equal(large.reduced, true); assert.ok(large.actualDpi < 100);
  assert.ok(large.pixelWidth * large.pixelHeight <= PDF_MAX_RENDER_PIXELS);
  assert.ok(Math.max(large.pixelWidth, large.pixelHeight) <= 8192);
  assert.throws(() => planPdfPlacement({ widthMm: Infinity, heightMm: 1 }, { width: 89, height: 51 }), /dimensions/);
  assert.throws(() => planPdfPlacement({ widthMm: 89, heightMm: 51 }, { width: 0, height: 51 }), /dimensions/);
  assert.throws(() => pdfExportDimensions({ width: 1000, height: 2500 }), /will not be silently reduced/);
});

test('a two-face PDF has exact trim dimensions and front/back artwork in the correct order', async () => {
  const product = { width: 89, height: 51 }, dimensions = pdfExportDimensions(product);
  const output = await createRasterPdf([
    { face: 'front', png: png(dimensions.width, dimensions.height, [210, 30, 40]), widthMm: 89, heightMm: 51 },
    { face: 'back', png: png(dimensions.width, dimensions.height, [20, 160, 60]), widthMm: 89, heightMm: 51 },
  ], 'Two-sided review');
  assert.equal(output.type, 'application/pdf');
  const bytes = new Uint8Array(await output.arrayBuffer());
  const parsed = await PDFDocument.load(bytes);
  assert.equal(parsed.getPageCount(), 2); assert.equal(parsed.getTitle(), 'Two-sided review');
  assert.match(parsed.getSubject(), /Raster artwork.*300 DPI.*RGB/);
  for (const page of parsed.getPages()) {
    assert.ok(Math.abs(page.getWidth() - 89 / 25.4 * 72) < 1e-8);
    assert.ok(Math.abs(page.getHeight() - 51 / 25.4 * 72) < 1e-8);
    assert.deepEqual(page.getTrimBox(), { x: 0, y: 0, width: page.getWidth(), height: page.getHeight() });
  }
  // Independently decode and render the resulting PDF with Mozilla's renderer.
  const loading = getDocument({ data: bytes.slice(), disableFontFace: true });
  const pdf = await loading.promise;
  try {
    for (const [index, expected] of [[1, [210,30,40]], [2, [20,160,60]]]) {
      const page = await pdf.getPage(index), viewport = page.getViewport({ scale: .5 });
      const target = pdf.canvasFactory.create(Math.ceil(viewport.width), Math.ceil(viewport.height));
      await page.render({ canvas: target.canvas, viewport }).promise;
      const actual = [...target.context.getImageData(20, 20, 1, 1).data].slice(0, 3);
      assert.deepEqual(actual, expected, `Page ${index} retains its face artwork`);
      pdf.canvasFactory.destroy(target);
    }
  } finally { await loading.destroy(); }
});

test('PDF creation rejects low-resolution rasters and duplicated or invalid faces', async () => {
  const wrong = { face: 'front', png: png(2, 2, [0,0,0]), widthMm: 89, heightMm: 51 };
  await assert.rejects(createRasterPdf([wrong], 'Wrong raster'), /300 DPI page dimensions/);
  await assert.rejects(createRasterPdf([wrong, wrong], 'Duplicates'), /distinct print faces/);
  await assert.rejects(createRasterPdf([{ ...wrong, face: 'inside' }], 'Unknown'), /invalid print face/);
});

test('PDF export rejects missing images and incomplete reverse artwork before any canvas work', async () => {
  const design = initialDesign('cards');
  await assert.rejects(exportArtworkPdf({ ...design, sides: 2, back: { background: '#ffffff', layers: [] } }), /no visible artwork/);
  await assert.rejects(exportArtworkPdf({ ...design, layers: [{ ...design.layers[0], type: 'image' }] }), /image is missing/i);
  await assert.rejects(exportArtworkPdf(initialDesign('wall')), /16-megapixel/);
});

test('the configured PDF renderer rejects oversized embedded images instead of producing an incomplete proof', async () => {
  const packagePath = createRequire(import.meta.url).resolve('pdfjs-dist/package.json');
  const packageInfo = JSON.parse(await readFile(packagePath, 'utf8'));
  const rendererPath = path.join(path.dirname(packagePath), 'legacy/build/pdf.mjs');
  const upstream = await readFile(rendererPath, 'utf8');
  assert.throws(() => patchPdfRenderer(upstream, '7.0.0'), /before upgrading/);
  assert.throws(() => patchPdfRenderer('upstream changed', packageInfo.version), /no longer matches/);
  // The generated renderer resolves its optional native canvas package relative
  // to import.meta.url. Keep it under the installed dependency, not OS /tmp.
  const directory = await mkdtemp(path.join(path.dirname(packagePath), 'avalon-pdf-engine-'));
  const patchedPath = path.join(directory, 'pdf.mjs');
  await writeFile(patchedPath, patchPdfRenderer(upstream, packageInfo.version));
  const patched = await import(pathToFileURL(patchedPath).href);
  patched.GlobalWorkerOptions.workerSrc = pathToFileURL(path.join(path.dirname(packagePath), 'legacy/build/pdf.worker.mjs')).href;
  const source = await PDFDocument.create();
  const image = await source.embedPng(png(2, 2, [200,100,50]));
  await image.embed();
  // An untrusted PDF can declare a huge raster while containing very few bytes.
  // The size check must happen before trying to decode or allocate that raster.
  const imageObject = source.context.lookup(image.ref);
  imageObject.dict.set(PDFName.of('Width'), PDFNumber.of(8000));
  imageObject.dict.set(PDFName.of('Height'), PDFNumber.of(8000));
  const page = source.addPage([252,145]);
  page.drawImage(image, { x: 0, y: 0, width: 252, height: 145 });
  const loading = patched.getDocument({ data: await source.save(), stopAtErrors: true, maxImageSize: 60_000_000 });
  try {
    const pdf = await loading.promise, parsedPage = await pdf.getPage(1);
    await assert.rejects(parsedPage.getOperatorList({ intent: 'print' }), /maximum allowed size/);
    const canvas = pdf.canvasFactory.create(252, 145);
    try { await assert.rejects(parsedPage.render({ canvas: canvas.canvas, viewport: parsedPage.getViewport({ scale: 1 }), intent: 'print' }).promise, /maximum allowed size/); }
    finally { pdf.canvasFactory.destroy(canvas); }
  } finally { await loading.destroy(); await rm(directory, { recursive: true, force: true }); }
});
