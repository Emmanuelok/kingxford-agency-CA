import test from 'node:test';
import assert from 'node:assert/strict';
import { makeTemplate, designTemplates } from '../lib/next/templates.ts';
import { products } from '../lib/presswerk/catalog.ts';
import { validateLocalDesign } from '../lib/next/workspace-store.ts';
import { layerBounds, preflightArtwork } from '../lib/next/artwork.ts';

function checkLayout(design, product) {
  assert.doesNotThrow(() => validateLocalDesign(design), `${design.name}: template must be saveable`);
  const bounds = design.layers.map(layer => layerBounds(layer, product));
  for (let i = 0; i < bounds.length; i++) {
    const box = bounds[i];
    assert.ok(box.x >= 3 && box.y >= 3, `${design.name}: layer ${i} starts outside the safe area`);
    assert.ok(box.x + box.width <= product.width - 3 + .001, `${design.name}: layer ${i} crosses the right safe margin`);
    assert.ok(box.y + box.height <= product.height - 3 + .001, `${design.name}: layer ${i} crosses the bottom safe margin`);
    if (i) assert.ok(bounds[i - 1].y + bounds[i - 1].height < box.y, `${design.name}: layers ${i - 1} and ${i} overlap`);
  }
}

test('every curated template fits every physical format with legible defaults', () => {
  for (const template of designTemplates) for (const product of products) {
    const design = makeTemplate(template.id, product.id);
    checkLayout(design, product);
    assert.deepEqual(preflightArtwork(design), [], `${template.id} / ${product.id} starts with a preflight problem`);
    assert.equal(design.layers[1].text.replace(/\s/g, ''), template.title.replace(/\s/g, ''));
  }
});

test('custom brand and campaign copy keep distinct text areas without losing words', () => {
  const headline = 'A wonderfully thoughtful collection made for extraordinary everyday moments.';
  const brand = { name: 'North & West', tagline: 'Made for the places you love.', primary: '#183e36', secondary: '#f4f2e8', accent: '#d8ed80', font: 'Georgia' };
  for (const product of products) {
    const design = makeTemplate('atelier', product.id, brand, headline);
    checkLayout(design, product);
    assert.equal(design.layers[1].text.replace(/\s/g, ''), headline.replace(/\s/g, ''));
    assert.equal(design.layers[1].font, 'Georgia');
    assert.equal(design.layers[1].weight, 400);
    assert.equal(design.layers[2].text.replace(/\s/g, ''), brand.name.toUpperCase().replace(/\s/g, ''));
    assert.equal(design.layers[3].text.replace(/\s/g, ''), brand.tagline.replace(/\s/g, ''));
    assert.equal(preflightArtwork(design).filter(issue => !issue.id.endsWith('-small')).length, 0);
  }
  const compact = makeTemplate('atelier', 'security', brand, 'W'.repeat(100));
  checkLayout(compact, products.find(product => product.id === 'security'));
  assert.equal(compact.layers[1].text.replace(/\s/g, ''), 'W'.repeat(100));
  assert.ok(preflightArtwork(compact).some(issue => issue.id.endsWith('-small')), 'Long copy on a small label must still disclose its physical readability limit');
});


test('excessive custom line breaks reflow above the shared minimum layer size', () => {
  const headline = 'W\n'.repeat(50).trim();
  const brand = { name: 'N\n'.repeat(30).trim(), tagline: 'T\n'.repeat(50).trim(), primary: '#183e36', secondary: '#f4f2e8', accent: '#d8ed80', font: 'Arial' };
  for (const template of designTemplates) for (const product of products) {
    const design = makeTemplate(template.id, product.id, brand, headline);
    checkLayout(design, product);
    assert.equal(design.layers[1].text.replace(/\s/g, ''), headline.replace(/\s/g, ''));
    assert.equal(design.layers[2].text.replace(/\s/g, ''), brand.name.replace(/\s/g, ''));
    assert.equal(design.layers[3].text.replace(/\s/g, ''), brand.tagline.replace(/\s/g, ''));
  }
});
