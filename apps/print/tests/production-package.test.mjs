import test from 'node:test';
import assert from 'node:assert/strict';
import { crc32 } from 'node:zlib';
import { initialDesign } from '../lib/presswerk/catalog.ts';
import { artworkSvg, designForFace } from '../lib/next/artwork.ts';
import { buildProductionPackage, packageCrc32, packageSlug, quotationEmailHref, quoteBudget, quoteReadiness, storedZip } from '../lib/next/production-package.ts';

const shape = { id: 'shape', type: 'shape', text: 'Block', x: 20, y: 20, size: 10, color: '#2244dd', rotation: 0, opacity: 1, width: 40, height: 40 };
function quoteFixture() {
  const design = { ...initialDesign('cards'), name: 'Élan / identity', layers: [{ ...shape }], sides: 2, back: { background: '#ffffff', layers: [{ ...shape, color: '#f46532', width: 30 }] } };
  return { id: '86d6d5fb-3bf3-4e76-af61-d8eb16021f0d', name: 'Launch / September', lines: [{ id: '8c7a0a4f-76e2-42e8-8b18-70a45f4c134d', design }], customer: { name: 'Emmanuel', company: 'Avalon', email: 'client@example.com' }, delivery: { method: 'Delivery', city: 'Calgary', allowance: 15, notes: 'Please confirm timing.' }, notes: 'Keep front and back paired.', status: 'Draft', createdAt: '2026-09-12T10:00:00.000Z', updatedAt: '2026-09-12T10:00:00.000Z' };
}

function readStoredZip(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength), decoder = new TextDecoder();
  const end = bytes.length - 22;
  assert.equal(view.getUint32(end, true), 0x06054b50);
  assert.equal(view.getUint16(end + 4, true), 0);
  const count = view.getUint16(end + 10, true), start = view.getUint32(end + 16, true);
  assert.equal(start + view.getUint32(end + 12, true), end);
  const files = new Map();
  let position = start;
  for (let index = 0; index < count; index++) {
    assert.equal(view.getUint32(position, true), 0x02014b50);
    assert.equal(view.getUint16(position + 10, true), 0, 'stored compression method');
    const length = view.getUint32(position + 24, true), nameLength = view.getUint16(position + 28, true);
    const name = decoder.decode(bytes.subarray(position + 46, position + 46 + nameLength));
    const offset = view.getUint32(position + 42, true);
    assert.equal(view.getUint32(offset, true), 0x04034b50);
    assert.equal(view.getUint16(offset + 6, true), 0x0800, 'UTF-8 filename flag');
    assert.equal(view.getUint16(offset + 8, true), 0);
    assert.equal(view.getUint32(offset + 18, true), length);
    assert.equal(view.getUint32(offset + 22, true), length);
    assert.equal(decoder.decode(bytes.subarray(offset + 30, offset + 30 + nameLength)), name);
    const content = bytes.subarray(offset + 30 + nameLength, offset + 30 + nameLength + length);
    assert.equal(view.getUint32(position + 16, true), crc32(content), 'independent CRC matches central directory');
    assert.equal(view.getUint32(offset + 14, true), crc32(content), 'independent CRC matches local header');
    assert.equal(files.has(name), false);
    files.set(name, decoder.decode(content));
    position += 46 + nameLength + view.getUint16(position + 30, true) + view.getUint16(position + 32, true);
  }
  assert.equal(position, end);
  return files;
}

test('ZIP central directory, file offsets, UTF-8 contents and independent CRCs round trip', () => {
  const inputs = [{ name: 'README.txt', content: 'Élan · print \n 你好' }, { name: 'artwork/001-front.svg', content: '<svg></svg>' }, { name: 'empty.txt', content: '' }];
  const files = readStoredZip(storedZip(inputs));
  assert.deepEqual([...files], inputs.map(file => [file.name, file.content]));
  assert.equal(packageCrc32(new TextEncoder().encode('123456789')), 0xcbf43926);
});

test('package filenames are safe, deterministic and collision-free for repeated item names', () => {
  const quote = quoteFixture();
  quote.name = '../../Launch: <September> 🚀';
  quote.lines.push({ ...structuredClone(quote.lines[0]), id: crypto.randomUUID() });
  const result = buildProductionPackage(quote);
  assert.match(result.filename, /^launch-september-ap-[a-f0-9]+\.zip$/);
  assert.equal(packageSlug('../Élan / identity <>'), 'elan-identity');
  assert.equal(packageSlug('😄'), 'print-project');
  const names = result.files.map(file => file.name);
  assert.equal(new Set(names).size, 7);
  assert.ok(names.includes('artwork/001-elan-identity-front.svg'));
  assert.ok(names.includes('artwork/002-elan-identity-back.svg'));
  for (const name of ['../evil', '/absolute', 'C:/test', 'folder/../evil', 'folder//file', 'a\\b']) assert.throws(() => storedZip([{ name, content: '' }]), /filename/);
  assert.throws(() => storedZip([{ name: 'A.txt', content: '' }, { name: 'a.txt', content: '' }]), /duplicate/);
});

test('review package carries exact independent artwork faces, specs, checks and a complete archive', () => {
  const quote = quoteFixture(), before = structuredClone(quote), result = buildProductionPackage(quote);
  const files = readStoredZip(result.bytes), front = files.get('artwork/001-elan-identity-front.svg'), back = files.get('artwork/001-elan-identity-back.svg');
  assert.equal(front, artworkSvg(designForFace(quote.lines[0].design, 'front')));
  assert.equal(back, artworkSvg(designForFace(quote.lines[0].design, 'back')));
  assert.notEqual(front, back);
  assert.match(front, /width="89mm" height="51mm"/);
  const manifest = JSON.parse(files.get('quote.json'));
  assert.equal(manifest.lines[0].sides, 2);
  assert.equal(manifest.lines[0].faces.length, 2);
  assert.equal(manifest.lines[0].faces[1].file, 'artwork/001-elan-identity-back.svg');
  assert.equal(manifest.lines[0].quantity, 100);
  assert.equal(manifest.lines[0].finish, 'Standard');
  assert.match(files.get('README.txt'), /Please confirm timing/);
  assert.match(files.get('README.txt'), /Keep front and back paired/);
  assert.match(files.get('review.html'), /Back · Artwork v1/);
  assert.equal(manifest.review.status.includes('not production approval'), true);
  assert.deepEqual(quote, before, 'export never mutates the estimate');
});

test('one-sided output retains but never exports its saved reverse draft', () => {
  const quote = quoteFixture(); quote.lines[0].design.sides = 1;
  const result = buildProductionPackage(quote);
  assert.equal(result.files.filter(file => file.name.endsWith('.svg')).length, 1);
  assert.equal(result.manifest.lines[0].faces.length, 1);
  assert.equal(quote.lines[0].design.back.layers.length, 1);
});

test('blank or unavailable artwork on either face blocks review and package creation', () => {
  for (const missing of ['front', 'back']) {
    const quote = quoteFixture();
    if (missing === 'front') quote.lines[0].design.layers = [];
    else quote.lines[0].design.back.layers = [];
    assert.equal(quoteReadiness(quote).ready, false);
    assert.ok(quoteReadiness(quote).errors.some(error => error.includes(missing === 'front' ? 'Front' : 'Back')));
    assert.throws(() => buildProductionPackage(quote), /Complete the review/);
  }
  const quote = quoteFixture(); quote.lines[0].design.back.layers = [{ ...shape, type: 'image', src: 'https://example.test/missing.png' }];
  assert.equal(quoteReadiness(quote).ready, false);
  assert.throws(() => buildProductionPackage(quote), /Complete the review/);
  quote.lines[0].design.sides = 1; quote.customer.email = 'not-an-email';
  assert.ok(quoteReadiness(quote).errors.includes('Enter a valid contact email.'));
});

test('custom-price items stay unpriced in mixed requests and cannot be mistaken for a complete total', () => {
  const quote = quoteFixture();
  quote.lines.push({ id: crypto.randomUUID(), design: { ...initialDesign('box'), name: 'Packaging', layers: [{ ...shape }] } });
  const budget = quoteBudget(quote), result = buildProductionPackage(quote);
  assert.equal(budget.pending, 1);
  assert.equal(result.manifest.budget.completeEstimate, false);
  assert.equal(result.manifest.lines[1].pricing.subtotalCAD, null);
  assert.equal(result.manifest.lines[1].pricing.status, 'custom-pricing-pending');
  assert.equal(result.manifest.budget.knownAmountCAD, budget.calculated[0].value.subtotal + 15);
  assert.match(result.files.find(file => file.name === 'review.html').content, /Known amount, excluding custom-price items/);
});

test('review markup escapes customer content and keeps active markup out of SVG and HTML', () => {
  const quote = quoteFixture();
  const payload = '<script>alert("x")</script><img src=x onerror=alert(1)>';
  quote.name = payload; quote.customer.name = payload; quote.notes = '</style><iframe src="https://example.test"></iframe>';
  quote.lines[0].design.name = payload;
  quote.lines[0].design.layers = [{ ...shape, type: 'text', text: payload, size: 3, font: 'Arial' }];
  const result = buildProductionPackage(quote), html = result.files.find(file => file.name === 'review.html').content;
  assert.ok(!html.includes('<script>'));
  assert.ok(!html.includes('<iframe'));
  assert.ok(!html.includes('<img src=x'));
  assert.ok(html.includes('&lt;script&gt;'));
  assert.match(html, /Content-Security-Policy/);
  assert.match(html, /default-src 'none'/);
  const svg = result.files.find(file => file.name.endsWith('front.svg')).content;
  assert.ok(!svg.includes('<script>'));
  assert.ok(svg.includes('&lt;script&gt;'));
  quote.lines[0].design.layers[0].rotation = '1" onload="alert(1)';
  assert.throws(() => buildProductionPackage(quote), /Expected number/);
});

test('email draft targets Avalon explicitly, encodes headers and reminds user to attach the package', () => {
  const quote = quoteFixture(); quote.name = 'Review? &subject=other\r\nBcc: another@example.com';
  const url = new URL(quotationEmailHref(quote));
  assert.equal(url.protocol, 'mailto:');
  assert.equal(url.pathname, 'avalon@veridanth.com');
  assert.deepEqual([...url.searchParams.keys()], ['subject', 'body']);
  assert.match(url.searchParams.get('subject'), /^Quotation request · AP-/);
  assert.match(url.searchParams.get('body'), /I will attach the downloaded review package/);
  assert.match(url.searchParams.get('body'), /100 × Business cards/);
  assert.equal(url.searchParams.has('bcc'), false);
});
