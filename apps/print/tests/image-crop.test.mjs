import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { initialDesign } from '../lib/presswerk/catalog.ts';
import { designSchema, imageCropSchema } from '../lib/presswerk/cloud.ts';
import { artworkFingerprint, artworkSvg, cropToFrame, designForFace, imageCrop, imagePpi, renderArtworkCanvas, replaceLayerImage } from '../lib/next/artwork.ts';
import { createWorkspace, createQuote, validateWorkspace } from '../lib/next/workspace-store.ts';

const source = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a9iQAAAAASUVORK5CYII=';
const image = { id: 'photo', type: 'image', text: 'Photo', src: source, naturalWidth: 2400, naturalHeight: 1200, x: 13, y: 22, width: 50, height: 50, size: 10, color: '#ffffff', rotation: 27, opacity: .85 };
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-7, `${a} differs from ${b}`);

test('fill crop preserves the photograph aspect across wide, tall and square physical frames', () => {
  for (const [nw, nh] of [[2400, 1200], [400, 1800], [1000, 1000]]) {
    for (const [fw, fh] of [[25, 25], [210, 297], [210, 90], [850, 2000]]) {
      for (const zoom of [1, 2.5, 8]) {
        for (const position of [{ x: 0, y: 0 }, { x: .5, y: .5 }, { x: 1, y: 1 }]) {
          const crop = cropToFrame(nw, nh, fw, fh, zoom, position);
          assert.ok(imageCropSchema.safeParse(crop).success);
          near(nw * crop.width / (nh * crop.height), fw / fh);
          assert.ok(crop.x >= 0 && crop.y >= 0 && crop.x + crop.width <= 1 + 1e-9 && crop.y + crop.height <= 1 + 1e-9);
        }
      }
    }
  }
  assert.deepEqual(cropToFrame(2400, 1200, 25, 25), { x: .25, y: 0, width: .5, height: 1 });
  assert.throws(() => cropToFrame(0, 1200, 25, 25), /positive finite/);
  assert.throws(() => cropToFrame(2400, 1200, 25, Infinity), /positive finite/);
  assert.throws(() => cropToFrame(60000, 1, 1, 60000), /too narrow/);
});

test('crop quality uses retained original pixels and untouched legacy images keep their quality', () => {
  const product = { width: 50.8, height: 50.8 };
  assert.deepEqual(imagePpi(image, product), { horizontal: 2400, vertical: 1200, minimum: 1200 });
  assert.deepEqual(imagePpi({ ...image, crop: { x: .25, y: .25, width: .25, height: .5 } }, product), { horizontal: 600, vertical: 600, minimum: 600 });
  assert.deepEqual(imageCrop(image), { x: 0, y: 0, width: 1, height: 1 });
});

test('replacement changes the source while preserving frame, transforms, identity and independent input', () => {
  const original = { ...image, assetPath: 'old/account-image.png', crop: { x: .25, y: 0, width: .5, height: 1 } };
  const before = structuredClone(original);
  const replaced = replaceLayerImage(original, { width: 100, height: 100 }, { src: source, naturalWidth: 1200, naturalHeight: 2400, name: 'Portrait' });
  for (const key of ['id', 'x', 'y', 'width', 'height', 'rotation', 'opacity']) assert.equal(replaced[key], original[key]);
  assert.deepEqual(replaced.crop, { x: 0, y: .25, width: 1, height: .5 });
  assert.equal(replaced.text, 'Portrait');
  assert.equal(replaced.assetPath, undefined, 'Replacement cannot save an outdated cloud source.');
  assert.deepEqual(original, before);
  assert.throws(() => replaceLayerImage(original, { width: 100, height: 100 }, { src: 'https://foreign.test/image.png', naturalWidth: 1200, naturalHeight: 2400 }), /supported image/);
});

test('saved crops survive both faces, quote snapshots and device workspace serialization', () => {
  const crop = { x: .25, y: 0, width: .5, height: 1 };
  const design = { ...initialDesign(), layers: [{ ...image, crop }], sides: 2, back: { background: '#ffffff', layers: [{ ...image, crop: { x: 0, y: .2, width: .5, height: .5 } }] } };
  const parsed = designSchema.parse(design);
  assert.deepEqual(parsed.layers[0].crop, crop);
  const workspace = validateWorkspace(JSON.parse(JSON.stringify(createQuote(createWorkspace(), design))));
  assert.deepEqual(workspace.quotes[0].lines[0].design.layers[0].crop, crop);
  assert.deepEqual(workspace.quotes[0].lines[0].design.back.layers[0].crop, design.back.layers[0].crop);
  const front = designForFace(design, 'front');
  front.layers[0].crop.x = 0;
  assert.equal(design.layers[0].crop.x, .25, 'Flattening cannot share mutable crop coordinates with the original face.');
  assert.notEqual(artworkFingerprint(design), artworkFingerprint({ ...design, layers: [{ ...image, crop: { ...crop, x: 0 } }] }));
});

const invalidCrops = [null, [], {}, { x: 0, y: 0, width: 0, height: 1 }, { x: 0, y: 0, width: .0001, height: 1 }, { x: -.1, y: 0, width: .5, height: 1 }, { x: .75, y: 0, width: .5, height: 1 }, { x: 0, y: .9, width: 1, height: .2 }, { x: '0', y: 0, width: 1, height: 1 }, { x: 0, y: 0, width: 1, height: 1, surprise: true }];
test('frontend schema rejects malformed, oversized and misplaced crop instructions', () => {
  for (const crop of [...invalidCrops, { x: NaN, y: 0, width: 1, height: 1 }, { x: 0, y: 0, width: Infinity, height: 1 }]) {
    assert.equal(designSchema.safeParse({ ...initialDesign(), layers: [{ ...image, crop }] }).success, false, JSON.stringify(crop));
  }
  assert.equal(designSchema.safeParse({ ...initialDesign(), layers: [{ ...image, type: 'text', crop: { x: 0, y: 0, width: 1, height: 1 } }] }).success, false);
});

test('SVG uses the same cropped source viewport while legacy vector markup remains unchanged', () => {
  const design = { ...initialDesign(), layers: [{ ...image, crop: { x: .25, y: .2, width: .5, height: .4 } }] };
  const svg = artworkSvg(design);
  assert.match(svg, /viewBox="250 200 500 400" preserveAspectRatio="none" overflow="hidden"/);
  assert.match(svg, /<image width="1000" height="1000"/);
  assert.match(svg, /rotate\(27\)/);
  const legacy = artworkSvg({ ...design, layers: [image] });
  assert.equal((legacy.match(/<svg\b/g) || []).length, 1);
  assert.throws(() => artworkSvg({ ...design, layers: [{ ...image, crop: { x: .9, y: 0, width: 1, height: 1 } }] }), /crop must remain/);
});

test('PNG and mockup canvas request precisely the cropped source pixels, then the unchanged print frame', async () => {
  const oldDocument = globalThis.document, oldImage = globalThis.Image, calls = [];
  const context = { save() {}, restore() {}, translate() {}, rotate() {}, fillRect() {}, drawImage(...args) { calls.push(args); } };
  const canvas = { width: 0, height: 0, getContext: () => context };
  globalThis.document = { fonts: { ready: Promise.resolve() }, createElement: () => canvas };
  globalThis.Image = class { naturalWidth = 2400; naturalHeight = 1200; async decode() {} };
  try {
    const design = { ...initialDesign(), layers: [{ ...image, crop: { x: .25, y: .2, width: .5, height: .4 } }] };
    const rendered = await renderArtworkCanvas(design, 1000);
    assert.equal(rendered, canvas);
    assert.deepEqual(calls[0].slice(1), [600, 240, 1200, 480, 0, 0, canvas.width * .5, canvas.height * .5]);
  } finally { if (oldDocument === undefined) delete globalThis.document; else globalThis.document = oldDocument; if (oldImage === undefined) delete globalThis.Image; else globalThis.Image = oldImage; }
});

test('Postgres face validation rejects the same malformed crop values and accepts small physical typography', async () => {
  const sql = await readFile(new URL('../database/schema.sql', import.meta.url), 'utf8');
  const functionSql = sql.slice(sql.indexOf('create function pw_private.valid_face('), sql.indexOf('revoke all on function pw_private.valid_face('));
  const db = new PGlite();
  try {
    await db.exec('create schema pw_private;');
    await db.exec(functionSql);
    const valid = async layers => (await db.query('select pw_private.valid_face($1::jsonb) as valid', [JSON.stringify({ background: '#ffffff', layers })])).rows[0].valid;
    assert.equal(await valid([image]), true);
    assert.equal(await valid([{ ...image, crop: { x: .25, y: 0, width: .5, height: 1 } }]), true);
    for (const crop of invalidCrops) assert.equal(await valid([{ ...image, crop }]), false, JSON.stringify(crop));
    assert.equal(await valid([{ ...image, type: 'shape', crop: { x: 0, y: 0, width: 1, height: 1 } }]), false);
    const text = { ...initialDesign('plans').layers[0], size: 10 * 25.4 / 72 / 841 * 100 };
    assert.equal(await valid([text]), true, '10 pt type on A1 is valid.');
    assert.equal(designSchema.safeParse({ ...initialDesign('plans'), layers: [text] }).success, true);
    assert.equal(await valid([{ ...text, size: .001 }]), false);
  } finally { await db.close(); }
});
