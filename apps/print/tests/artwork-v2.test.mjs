import test from 'node:test';
import assert from 'node:assert/strict';
import { alignLayer, artworkFingerprint, artworkSvg, designForFace, escapeXml, imagePercentSize, imagePpi, layerBounds, pngDensity, preflightArtwork, printFaces, rasterDimensions, rotatedBounds, safeImageSource } from '../lib/next/artwork.ts';
import { initialDesign, products, supportsReverse } from '../lib/presswerk/catalog.ts';

const card = products.find(p => p.id === 'cards');
const shape = { id: 'shape', type: 'shape', text: 'Rectangle', x: 20, y: 30, size: 10, color: '#123456', rotation: 0, opacity: 1, width: 25, height: 20 };
const near = (a, b) => assert.ok(Math.abs(a - b) < .00001, `${a} != ${b}`);

test('rotation checks all corners around the layer anchor', () => {
  const bounds = rotatedBounds({ x: 20, y: 30, width: 40, height: 10 }, 90);
  near(bounds.x, 10); near(bounds.y, 30); near(bounds.width, 10); near(bounds.height, 40);
  const diagonal = rotatedBounds({ x: 0, y: 0, width: 10, height: 10 }, -45);
  near(diagonal.x, 0); near(diagonal.y, -Math.sqrt(50)); near(diagonal.width, Math.sqrt(200));
});
test('image fit retains physical aspect on both portrait and landscape products', () => {
  for (const p of [card, { width: 100, height: 300 }]) {
    const size = imagePercentSize(1800, 600, p);
    near((size.width * p.width) / (size.height * p.height), 3);
    assert.ok(size.width <= 72 && size.height <= 72);
  }
});
test('resolution uses weaker of horizontal and vertical PPI', () => {
  const image = { ...shape, type: 'image', width: 100, height: 100, naturalWidth: 1200, naturalHeight: 100 };
  const ppi = imagePpi(image, { width: 25.4, height: 25.4 });
  assert.deepEqual(ppi, { horizontal: 1200, vertical: 100, minimum: 100 });
});
test('canvas alignment accounts for rotated physical bounds', () => {
  const layer = { ...shape, rotation: 40 };
  const centered = layerBounds(alignLayer(layer, card, 'center'), card);
  near(centered.x + centered.width / 2, card.width / 2);
  const left = layerBounds(alignLayer(layer, card, 'left'), card);
  near(left.x, 0);
  const bottom = layerBounds(alignLayer(layer, card, 'bottom'), card);
  near(bottom.y + bottom.height, card.height);
});
test('preflight detects rotated clipping, missing images and missing reverse artwork', () => {
  const design = { ...initialDesign(), layers: [{ ...shape, x: 0, y: 0, rotation: -45 }] };
  assert.ok(preflightArtwork(design).some(issue => issue.id === 'shape-bounds'));
  const missing = { ...design, sides: 2, layers: [{ ...shape, type: 'image', src: 'https://host.test/private.png' }] };
  const issues = preflightArtwork(missing);
  assert.ok(issues.some(issue => issue.id === 'front-shape-missing' && issue.severity === 'error' && issue.face === 'front'));
  assert.ok(issues.some(issue => issue.id === 'back-empty' && issue.face === 'back'));
  assert.ok(preflightArtwork({ ...design, layers: [{ ...shape, opacity: 0 }] }).some(issue => issue.id === 'empty'));
});
test('both print faces have independent previews, exports and actionable preflight issues', () => {
  const front = { ...initialDesign(), layers: [{ ...shape, type: 'text', text: 'FRONT ONLY', size: 3 }], sides: 2 };
  const design = { ...front, back: { background: '#abcdef', layers: [{ ...shape, type: 'text', text: 'REVERSE ONLY', size: 3 }] } };
  const before = structuredClone(design);
  const faces = printFaces(design);
  assert.deepEqual(faces.map(face => face.face), ['front', 'back']);
  assert.ok(faces.every(face => face.design.sides === 1 && !('back' in face.design)));
  assert.ok(artworkSvg(faces[0].design).includes('FRONT ONLY'));
  assert.ok(!artworkSvg(faces[0].design).includes('REVERSE ONLY'));
  assert.ok(artworkSvg(faces[1].design).includes('REVERSE ONLY'));
  assert.ok(!artworkSvg(faces[1].design).includes('FRONT ONLY'));
  assert.equal(faces[1].design.background, '#abcdef');
  faces[1].design.layers[0].text = 'Mutated view';
  assert.deepEqual(design, before, 'A flattened view must not mutate either stored face.');
  assert.equal(preflightArtwork(design).filter(issue => issue.severity === 'error').length, 0);
  const invalidBack = { ...design, back: { ...design.back, layers: [{ ...shape, type: 'image', src: 'https://not-embedded.test/image.png' }] } };
  const missing = preflightArtwork(invalidBack).find(issue => issue.id === 'back-shape-missing');
  assert.equal(missing.face, 'back');
  assert.equal(missing.layerId, 'shape');
  assert.match(missing.title, /^Back:/);
});
test('single-side output excludes preserved reverse drafts and unsupported two-side products fail preflight', () => {
  const design = { ...initialDesign(), back: { background: '#ffffff', layers: [] } };
  assert.deepEqual(printFaces(design).map(face => face.face), ['front']);
  assert.ok(!preflightArtwork(design).some(issue => issue.face === 'back'));
  assert.deepEqual(designForFace(design, 'back').layers, []);
  assert.ok(preflightArtwork({ ...design, sides: 2 }).some(issue => issue.id === 'back-empty'));
  for (const p of products) {
    assert.equal(supportsReverse(p), ['cards', 'postcard', 'flyer', 'letterhead', 'invitation', 'menu'].includes(p.id));
  }
  const invalid = { ...design, productId: 'mug', sides: 2, back: { background: '#ffffff', layers: [{ ...shape }] } };
  assert.ok(preflightArtwork(invalid).some(issue => issue.id === 'unsupported-reverse'));
});
test('raster export uses physical size and rejects excessive browser allocations', () => {
  assert.deepEqual(rasterDimensions({ width: 25.4, height: 50.8 }), { width: 300, height: 600 });
  assert.throws(() => rasterDimensions({ width: 3000, height: 2400 }), /100 megapixels/);
  assert.throws(() => rasterDimensions({ width: 3000, height: 1 }), /32,767/);
});
test('SVG escapes user content and rejects active or external image sources', () => {
  const design = { ...initialDesign(), name: '<script>alert("x")</script>', layers: [{ ...shape, type: 'text', text: '<script>& "quoted"', font: 'Arial" onload="alert(1)' }, { ...shape, id: 'bad-image', type: 'image', src: 'javascript:alert(1)' }] };
  const svg = artworkSvg(design);
  assert.ok(!svg.includes('<script>')); assert.ok(!svg.includes('onload=')); assert.ok(!svg.includes('javascript:'));
  assert.ok(svg.includes('&lt;script&gt;')); assert.ok(svg.includes('font-family="Arial"'));
  assert.equal(escapeXml('<&>'), '&lt;&amp;&gt;');
  assert.equal(safeImageSource('data:image/svg+xml;base64,PHN2Zz4='), undefined);
  assert.equal(safeImageSource('https://example.com/image.png'), undefined);
  assert.equal(safeImageSource('data:image/png;base64,YWJj'), 'data:image/png;base64,YWJj');
});
test('artwork review identity changes for content and finish but not save metadata', () => {
  const design = initialDesign();
  assert.equal(artworkFingerprint(design), artworkFingerprint({ ...design, updatedAt: 'tomorrow', version: 99, quantity: 500 }));
  assert.notEqual(artworkFingerprint(design), artworkFingerprint({ ...design, finish: 'Gloss laminate' }));
  assert.notEqual(artworkFingerprint(design), artworkFingerprint({ ...design, layers: design.layers.map(l => ({ ...l, x: l.x + 1 })) }));
  const double = { ...design, sides: 2, back: { background: '#ffffff', layers: [{ ...shape }] } };
  assert.notEqual(artworkFingerprint(double), artworkFingerprint({ ...double, back: { ...double.back, background: '#123456' } }));
  assert.notEqual(artworkFingerprint(double), artworkFingerprint({ ...double, back: { ...double.back, layers: [] } }));
  assert.equal(artworkFingerprint(double), artworkFingerprint({ ...double, back: { ...double.back, layers: double.back.layers.map(layer => ({ ...layer, assetPath: 'temporary/cloud/reference' })) } }));
});
test('PNG physical-density chunk records 300 DPI without duplicate metadata', () => {
  const source = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a9iQAAAAASUVORK5CYII=', 'base64');
  const result = pngDensity(source), second = pngDensity(result);
  assert.deepEqual(result, second);
  const location = Buffer.from(result).indexOf('pHYs');
  assert.ok(location > 0); const density = new DataView(result.buffer);
  assert.equal(density.getUint32(location + 4), 11811); assert.equal(density.getUint32(location + 8), 11811); assert.equal(result[location + 12], 1);
});
