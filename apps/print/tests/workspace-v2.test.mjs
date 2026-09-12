import assert from 'node:assert/strict';
import { test } from 'node:test';
import { addDesignToQuote, createWorkspace, createQuote, mergeWorkspaceBackup, saveProject, validateLocalDesign, validateWorkspace } from '../lib/next/workspace-store.ts';
import { designFingerprint } from '../lib/presswerk/design-identity.ts';

const imageData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6fWkAAAAASUVORK5CYII=';
const imageLayer = () => ({ id: crypto.randomUUID(), type: 'image', text: 'Logo', x: 10, y: 10, size: 10, color: '#ffffff', rotation: 0, opacity: 1, width: 30, height: 30, naturalWidth: 100, naturalHeight: 100, src: imageData });

test('new workspaces validate and do not share project, artwork or quote state', () => {
  const first = createWorkspace();
  const second = createWorkspace();
  assert.notEqual(first.activeDesign.id, second.activeDesign.id);
  assert.deepEqual(validateWorkspace(first), first);
  first.activeDesign.layers[0].text = 'Private first workspace';
  assert.notEqual(first.activeDesign.layers[0].text, second.activeDesign.layers[0].text);
});

test('project saves preserve stable identity, immutable snapshots and exact local proof validity', () => {
  const initial = createWorkspace();
  const original = structuredClone(initial);
  const first = saveProject(initial, initial.activeDesign, 'First proof');
  assert.deepEqual(initial, original, 'Saving must not mutate caller state.');
  assert.equal(first.projects[0].id, initial.activeDesign.id);
  assert.equal(first.projects[0].design.version, 1);
  assert.equal(first.projects[0].revisions[0].label, 'First proof');
  assert.ok(!Number.isNaN(Date.parse(first.projects[0].revisions[0].createdAt)));
  first.projects[0].proof = { fingerprint: designFingerprint(first.projects[0].design), reviewedAt: new Date().toISOString() };
  const unchanged = saveProject(first, { ...first.activeDesign, version: 99, updatedAt: new Date().toISOString() });
  assert.equal(unchanged.projects[0].revisions.length, 1, 'Metadata alone should not create another revision.');
  assert.deepEqual(unchanged.projects[0].proof, first.projects[0].proof);
  const edited = structuredClone(first.activeDesign);
  edited.layers[0].text = 'Updated message';
  const next = saveProject(first, edited);
  assert.equal(next.projects.length, 1);
  assert.equal(next.projects[0].design.version, 2);
  assert.equal(next.projects[0].proof, undefined, 'Artwork changes invalidate the exact proof.');
  assert.notEqual(next.projects[0].revisions[0].id, next.projects[0].revisions[1].id);
  assert.equal(next.projects[0].revisions[0].design.layers[0].text, initial.activeDesign.layers[0].text);
  edited.layers[0].text = 'Later external mutation';
  assert.equal(next.projects[0].design.layers[0].text, 'Updated message');
  assert.equal(next.projects[0].revisions[1].design.layers[0].text, 'Updated message');
});

test('revision history caps at twenty while version numbers continue and restored artwork becomes a new revision', () => {
  let state = createWorkspace();
  for (let index = 1; index <= 25; index += 1) {
    state = saveProject(state, { ...state.activeDesign, name: `Revision ${index}` });
  }
  const project = state.projects[0];
  assert.equal(project.design.version, 25);
  assert.equal(project.revisions.length, 20);
  assert.equal(project.revisions[0].design.version, 6);
  assert.equal(new Set(project.revisions.map(item => item.id)).size, 20);
  const restored = saveProject(state, project.revisions[0].design, 'Restored version 6');
  assert.equal(restored.projects[0].design.version, 26);
  assert.equal(restored.projects[0].design.name, 'Revision 6');
  assert.deepEqual(validateWorkspace(restored), restored);
});

test('quotes capture independent specifications and remain drafts without invented orders or stored prices', () => {
  const initial = createWorkspace();
  const design = { ...initial.activeDesign, productId: 'box', name: 'Custom packaging' };
  const first = createQuote(initial, design);
  assert.equal(first.quotes.length, 1);
  assert.equal(initial.quotes.length, 0);
  assert.equal(first.quotes[0].status, 'Draft');
  assert.equal(first.quotes[0].delivery.city, design.city);
  assert.equal(first.quotes[0].delivery.allowance, 0);
  assert.equal('total' in first.quotes[0], false);
  assert.equal('orderId' in first.quotes[0], false);
  design.layers[0].text = 'Changed after quote';
  assert.notEqual(first.quotes[0].lines[0].design.layers[0].text, design.layers[0].text);
  const next = createQuote(first, initial.activeDesign);
  assert.notEqual(next.quotes[0].id, next.quotes[1].id);
  assert.deepEqual(validateWorkspace(next), next);
});

test('unsafe artwork URLs, missing cloud assets and invalid product combinations are rejected', () => {
  for (const src of ['https://example.com/private.png', 'javascript:alert(1)', 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=', 'blob:https://example.com/file', 'data:image/png;base64,####']) {
    const state = createWorkspace();
    state.activeDesign.layers.push({ ...imageLayer(), src });
    assert.throws(() => validateWorkspace(state), /embedded PNG/);
  }
  const missing = createWorkspace();
  const layer = imageLayer();
  delete layer.src;
  missing.activeDesign.layers.push({ ...layer, assetPath: 'other-workspace/private.png' });
  assert.throws(() => validateWorkspace(missing), /missing/);
  const external = createWorkspace();
  external.activeDesign.layers.push({ ...imageLayer(), assetPath: 'some-workspace/private.png' });
  const local = validateLocalDesign(external.activeDesign);
  assert.equal(local.layers.at(-1).assetPath, undefined);
  assert.equal(local.layers.at(-1).src, imageData);
  assert.throws(() => validateLocalDesign({ ...local, productId: 'tee', finish: 'Foil accent' }), /finish is not available/);
  assert.throws(() => saveProject(external, { ...local, quantity: 0 }));
});

test('imports reject corrupt nested data before callers can replace their current workspace', () => {
  const original = createQuote(saveProject(createWorkspace(), createWorkspace().activeDesign), createWorkspace().activeDesign);
  const mutations = [
    state => { state.schemaVersion = 1; },
    state => { state.projects[0].revisions[0].design.id = crypto.randomUUID(); },
    state => { state.projects.push(structuredClone(state.projects[0])); },
    state => { state.quotes[0].lines.push(structuredClone(state.quotes[0].lines[0])); },
    state => { state.quotes[0].delivery.allowance = -1; },
    state => { state.quotes[0].delivery.allowance = Infinity; },
    state => { state.quotes[0].customer.email = 'not-an-email'; state.quotes[0].status = 'Ready for review'; },
    state => { state.quotes[0].status = 'Paid'; },
    state => { state.brand.primary = 'url(https://example.com)'; },
    state => { state.activeDesign.layers.push(structuredClone(state.activeDesign.layers[0])); },
    state => { state.activeDesign.layers[0].rotation = NaN; },
    state => { state.favourites = ['not-a-product']; },
  ];
  const before = structuredClone(original);
  for (const mutate of mutations) {
    const invalid = structuredClone(original);
    mutate(invalid);
    assert.throws(() => validateWorkspace(invalid));
    assert.deepEqual(original, before);
  }
});

test('import strips unknown credentials and stale proof assertions without mutating the import', () => {
  let state = createWorkspace();
  state = saveProject(state, state.activeDesign);
  state.accessToken = 'should-never-persist';
  state.cloudWorkspaceId = 'unrelated-tenant';
  state.projects[0].proof = { fingerprint: 'stale', reviewedAt: new Date().toISOString() };
  const imported = validateWorkspace(state);
  assert.equal(imported.accessToken, undefined);
  assert.equal(imported.cloudWorkspaceId, undefined);
  assert.equal(imported.projects[0].proof, undefined);
  assert.equal(state.projects[0].proof.fingerprint, 'stale');
});

test('incomplete device drafts round-trip without losing in-progress input; ready estimates still require valid details', () => {
  let state = createWorkspace();
  state = createQuote(state, state.activeDesign);
  state.activeDesign.name = '';
  state.brand.name = '';
  state.quotes[0].name = '';
  state.quotes[0].delivery.city = '';
  state.quotes[0].customer.email = 'emmanuel@';
  state.quotes[0].lines = [];
  const roundTrip = validateWorkspace(JSON.parse(JSON.stringify(state)));
  assert.deepEqual(roundTrip, state);
  assert.throws(() => saveProject(roundTrip, roundTrip.activeDesign), 'An explicit saved project still requires a name.');
  state.quotes[0].status = 'Archived';
  assert.deepEqual(validateWorkspace(state), state);
  state.quotes[0].status = 'Ready for review';
  assert.throws(() => validateWorkspace(state), /print item/);
  const design = createWorkspace().activeDesign;
  state.quotes[0].lines = [{ id: crypto.randomUUID(), design }];
  assert.throws(() => validateWorkspace(state), /Name the estimate/);
  state.quotes[0].name = 'Launch campaign';
  assert.throws(() => validateWorkspace(state), /contact name/);
  state.quotes[0].customer.name = 'Emmanuel';
  assert.throws(() => validateWorkspace(state), /valid email/);
  state.quotes[0].customer.email = 'emmanuel@example.com';
  assert.throws(() => validateWorkspace(state), /fulfilment city/);
  state.quotes[0].delivery.city = 'Calgary';
  assert.deepEqual(validateWorkspace(state), state);
});

test('adding artwork to an estimate captures the newly saved revision rather than the caller’s stale version', () => {
  let state = createWorkspace();
  state = saveProject(state, state.activeDesign);
  const original = structuredClone(state);
  const changed = { ...structuredClone(state.activeDesign), name: 'Updated business cards', version: 1 };
  const added = addDesignToQuote(state, changed);
  assert.deepEqual(state, original);
  assert.equal(added.projects[0].design.version, 2);
  assert.equal(added.quotes[0].lines[0].design.version, 2);
  assert.deepEqual(added.quotes[0].lines[0].design, added.projects[0].design);
  const target = added.quotes[0];
  const more = addDesignToQuote(added, { ...changed, quantity: 500 }, target.id);
  assert.equal(more.quotes.length, 1);
  assert.equal(more.quotes[0].lines.length, 2);
  assert.equal(more.quotes[0].lines[1].design.version, 3);
  assert.equal(more.quotes[0].lines[0].design.version, 2, 'The first quoted revision stays immutable.');
  assert.equal(more.quotes[0].status, 'Draft');
  assert.throws(() => addDesignToQuote(more, changed, crypto.randomUUID()), /no longer exists/);
  more.quotes[0].status = 'Archived';
  assert.equal(addDesignToQuote(more, changed, target.id).quotes[0].status, 'Draft');
  const full = structuredClone(more);
  full.quotes[0].lines = Array.from({ length: 100 }, () => ({ id: crypto.randomUUID(), design: structuredClone(changed) }));
  const before = structuredClone(full);
  assert.throws(() => addDesignToQuote(full, changed, target.id), /maximum of 100/);
  assert.deepEqual(full, before);
});

test('backup import remaps one shared design identity across active artwork, projects, every revision and quote lines', () => {
  let state = createWorkspace();
  state = addDesignToQuote(state, state.activeDesign);
  state = saveProject(state, { ...state.activeDesign, name: 'New revision' });
  state.brand.name = 'Keep my current brand';
  state.favourites = ['cards'];
  const incoming = structuredClone(state);
  incoming.brand.name = 'Do not replace the current brand';
  incoming.favourites = ['tee'];
  incoming.projects[0].proof = { fingerprint: designFingerprint(incoming.projects[0].design), reviewedAt: new Date().toISOString() };
  const stateBefore = structuredClone(state);
  const incomingBefore = structuredClone(incoming);
  const merged = mergeWorkspaceBackup(state, incoming);
  assert.deepEqual(state, stateBefore);
  assert.deepEqual(incoming, incomingBefore);
  const importedProject = merged.projects[0];
  const importedQuote = merged.quotes[0];
  assert.notEqual(importedProject.id, state.projects[0].id);
  assert.equal(importedProject.design.id, importedProject.id);
  assert.ok(importedProject.revisions.every(revision => revision.design.id === importedProject.id));
  assert.equal(merged.activeDesign.id, importedProject.id);
  assert.equal(importedQuote.lines[0].design.id, importedProject.id);
  assert.notEqual(importedQuote.id, state.quotes[0].id);
  assert.notEqual(importedQuote.lines[0].id, state.quotes[0].lines[0].id);
  assert.notEqual(importedProject.revisions[0].id, state.projects[0].revisions[0].id);
  assert.equal(importedProject.proof, undefined, 'A copied identity needs its own local review.');
  assert.equal(importedQuote.lines[0].design.version, 1, 'A historical quoted revision keeps its artwork version.');
  assert.equal(importedProject.design.version, 2);
  assert.equal(merged.brand.name, state.brand.name);
  assert.deepEqual(new Set(merged.favourites), new Set(['cards', 'tee']));
  assert.deepEqual(merged.projects[1], state.projects[0]);
  assert.deepEqual(merged.quotes[1], state.quotes[0]);
  assert.deepEqual(validateWorkspace(merged), merged);
});

test('backup import remaps quote-only and unsaved active artwork collisions against all existing artwork', () => {
  let state = createWorkspace();
  state = createQuote(state, state.activeDesign);
  const existingQuoteOnly = state.quotes[0].lines[0].design.id;
  state.activeDesign = createWorkspace().activeDesign;
  let incoming = createWorkspace();
  incoming.activeDesign.id = existingQuoteOnly;
  incoming = createQuote(incoming, incoming.activeDesign);
  incoming.quotes[0].lines.push({ id: crypto.randomUUID(), design: structuredClone(state.activeDesign) });
  const merged = mergeWorkspaceBackup(state, incoming);
  assert.equal(merged.projects.length, 0);
  assert.notEqual(merged.activeDesign.id, existingQuoteOnly);
  assert.equal(merged.quotes[0].lines[0].design.id, merged.activeDesign.id);
  assert.notEqual(merged.quotes[0].lines[1].design.id, state.activeDesign.id);
  assert.equal(merged.quotes[1].lines[0].design.id, existingQuoteOnly);
  const repeat = mergeWorkspaceBackup(merged, incoming);
  assert.notEqual(repeat.activeDesign.id, merged.activeDesign.id);
  assert.equal(repeat.quotes.length, 3);
});

test('capacity and malformed-backup failures leave both workspaces unchanged', () => {
  const state = createWorkspace();
  for (let index = 0; index < 200; index += 1) {
    const design = createWorkspace().activeDesign;
    state.projects.push({ id: design.id, design, revisions: [], archived: false, createdAt: state.updatedAt, updatedAt: state.updatedAt });
  }
  let incoming = createWorkspace();
  incoming = saveProject(incoming, incoming.activeDesign);
  const before = structuredClone(state);
  assert.throws(() => mergeWorkspaceBackup(state, incoming), /maximum of 200 projects/);
  assert.deepEqual(state, before);
  assert.throws(() => saveProject(state, incoming.activeDesign), /maximum of 200 projects/);
  const invalid = structuredClone(incoming);
  invalid.projects[0].revisions[0].design.id = crypto.randomUUID();
  assert.throws(() => mergeWorkspaceBackup(createWorkspace(), invalid), /same project/);
  const fullQuotes = createWorkspace();
  for (let index = 0; index < 200; index += 1) {
    const quote = createQuote(createWorkspace(), createWorkspace().activeDesign).quotes[0];
    fullQuotes.quotes.push(quote);
  }
  const quoteImport = createQuote(createWorkspace(), createWorkspace().activeDesign);
  assert.throws(() => mergeWorkspaceBackup(fullQuotes, quoteImport), /maximum of 200 estimates/);
  assert.throws(() => createQuote(fullQuotes, fullQuotes.activeDesign), /maximum of 200 estimates/);
});
