import test from 'node:test';
import assert from 'node:assert/strict';
import { makeTemplate, designTemplates } from '../lib/next/templates.ts';
import { products } from '../lib/presswerk/catalog.ts';
import { validateLocalDesign } from '../lib/next/workspace-store.ts';
import { designForFace, layerBounds, preflightArtwork } from '../lib/next/artwork.ts';

function checkLayout(design, product) {
  assert.doesNotThrow(() => validateLocalDesign(design), `${design.name}: template must be saveable`);
  const bounds = design.layers.map(layer => layerBounds(layer, product));
  for (let i = 0; i < bounds.length; i++) {
    const box = bounds[i];
    assert.ok(box.x >= 3 && box.y >= 3, `${design.name}: layer ${i} starts outside the safe area`);
    assert.ok(box.x + box.width <= product.width - 3 + .001, `${design.name}: layer ${i} crosses the right safe margin`);
    assert.ok(box.y + box.height <= product.height - 3 + .001, `${design.name}: layer ${i} crosses the bottom safe margin`);

  }
  const text = design.layers.flatMap((layer, i) => layer.type === 'text' ? [{ layer, box: bounds[i] }] : []);
  for (let i = 0; i < text.length; i++) for (let j = i + 1; j < text.length; j++) {
    const a = text[i].box, b = text[j].box;
    const overlap = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x) > .01 && Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y) > .01;
    assert.ok(!overlap, `${design.name}: text overlaps: ${text[i].layer.text} / ${text[j].layer.text}`);
  }
}

test('every curated template fits every physical format with legible defaults', () => {
  for (const template of designTemplates) for (const product of products) {
    const design = makeTemplate(template.id, product.id);
    checkLayout(design, product);
    assert.deepEqual(preflightArtwork(design), [], `${template.id} / ${product.id} starts with a preflight problem`);
    if (design.back) {
      checkLayout(designForFace(design, 'back'), product);
      assert.deepEqual(preflightArtwork({...design, sides: 2}), [], `${template.id} back is ready to edit and print`);
    }
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


test('native templates contain the information needed for their actual print purpose', () => {
  const copy = id => makeTemplate(id).layers.filter(layer => layer.type === 'text').map(layer => layer.text.replace(/\s+/g, ' ')).join(' | ');
  assert.match(copy('terra'), /COFFEE/);
  assert.match(copy('terra'), /Your espresso/);
  assert.match(copy('terra'), /Your breakfast/);
  assert.equal((copy('terra').match(/\$0\.00/g) || []).length, 6);
  assert.match(copy('restaurant-menu'), /TO BEGIN/);
  assert.match(copy('restaurant-menu'), /SOMETHING SWEET/);
  assert.match(copy('electric'), /DAY \/ MONTH \/ YEAR/);
  assert.match(copy('electric'), /Your venue/);
  assert.match(copy('electric'), /Tickets:/);
  assert.match(copy('bloom'), /Name & Name/);
  assert.match(copy('bloom'), /RSVP/);
  assert.match(copy('studio-letterhead'), /Recipient organisation/);
  assert.match(copy('studio-letterhead'), /Write your message here/);
  assert.match(copy('studio-letterhead'), /Kind regards/);
  assert.match(copy('contact-card'), /hello@yourbrand.ca/);
  assert.match(copy('package-label'), /Ingredients:/);
  assert.match(copy('retail-sale'), /Your offer conditions/);
  assert.match(copy('signal'), /Your next chapter\./, 'An ordinary banner headline must not break a word into fragments');
  for (const template of designTemplates) {
    const design = makeTemplate(template.id);
    assert.ok(design.layers.length >= 5, `${template.id} retains its composed native layout`);
    assert.ok(design.layers.every(layer => layer.type === 'text' || layer.type === 'shape'), 'Every template element remains editable, without a baked-in image');
  }
});

test('card faces remain independent and do not silently change the print specification', () => {
  for (const id of ['atelier', 'linen', 'contact-card']) {
    const first = makeTemplate(id, 'cards');
    const second = makeTemplate(id, 'cards');
    assert.equal(first.sides, 1, 'A paired reverse is a draft until two-sided printing is selected');
    assert.ok(first.back);
    const originalBack = structuredClone(first.back);
    first.layers[1].text = 'A new front';
    assert.deepEqual(first.back, originalBack, 'Front changes never mutate the reverse');
    assert.notEqual(first.back.layers[0].id, second.back.layers[0].id, 'New projects receive independent layer identities');
    const text = first.back.layers.filter(layer => layer.type === 'text').map(layer => layer.text).join(' ');
    assert.match(text, /Your name/);
    assert.match(text, /hello@yourbrand.ca/);
    assert.match(text, /yourbrand.ca/);
    assert.equal(makeTemplate(id, 'tee').back, undefined, 'A garment does not inherit an unsupported card reverse');
  }
});

test('purpose-specific layouts use different spatial structures, beyond headline and palette changes', () => {
  const structures = new Set(designTemplates.map(template => {
    const design = makeTemplate(template.id);
    return JSON.stringify(design.layers.map(({type,x,y,width,height}) => ({type,x:Math.round(x),y:Math.round(y),width:width && Math.round(width),height:height && Math.round(height)})));
  }));
  assert.ok(structures.size >= 17, 'The collection needs materially different grids, hierarchy and compositions');
});

test('legacy template callers keep stable identifiers, format overrides and brand support', () => {
  const legacyIds = ['atelier','linen','electric','gallery','terra','mono','coffee','launch','bloom','outdoor','signal','signature'];
  for (const id of legacyIds) assert.ok(designTemplates.some(template => template.id === id));
  assert.equal(makeTemplate('unknown').productId, 'cards');
  const branded = makeTemplate('contact-card', 'cards', {name:'North & West',tagline:'Made with care.',primary:'#183e36',secondary:'#f4f2e8',accent:'#d8ed80',font:'Verdana'});
  assert.equal(branded.background, '#183e36');
  assert.ok(branded.layers.some(layer => layer.font === 'Verdana'));
  assert.match(branded.layers.map(layer => layer.text).join(' '), /NORTH & WEST/);
  assert.doesNotThrow(() => validateLocalDesign(branded));
});
