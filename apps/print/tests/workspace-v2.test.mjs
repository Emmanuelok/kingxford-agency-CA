import assert from 'node:assert/strict';
import { test } from 'node:test';
import { addDesignToQuote, createWorkspace, createQuote, mergeWorkspaceBackup, openDesign, saveProject, updateQuoteArtwork, validateLocalDesign, validateWorkspace } from '../lib/next/workspace-store.ts';
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

test('switching designs preserves outgoing artwork and specifications as an independent saved project', () => {
  const state = createWorkspace();
  state.activeDesign.name = 'Calgary launch cards';
  state.activeDesign.layers[0].text = 'Work in progress';
  state.activeDesign.layers.push(imageLayer());
  state.activeDesign.quantity = 500;
  state.activeDesign.finish = 'Soft touch';
  state.activeDesign.sides = 2;
  const incoming = createWorkspace().activeDesign;
  const before = structuredClone(state);
  const incomingBefore = structuredClone(incoming);
  const opened = openDesign(state, incoming);
  assert.deepEqual(state, before, 'Opening artwork must not mutate the current workspace.');
  assert.deepEqual(incoming, incomingBefore);
  assert.deepEqual(opened.activeDesign, incoming);
  assert.equal(opened.projects.length, 1);
  const preserved = opened.projects[0];
  assert.equal(preserved.id, state.activeDesign.id);
  assert.equal(designFingerprint(preserved.design), designFingerprint(state.activeDesign));
  assert.equal(preserved.design.quantity, 500);
  assert.equal(preserved.design.finish, 'Soft touch');
  assert.equal(preserved.design.sides, 2);
  assert.equal(preserved.revisions.length, 1);
  assert.deepEqual(validateWorkspace(opened), opened);
  state.activeDesign.layers[0].text = 'Later mutation';
  incoming.layers[0].text = 'Incoming mutation';
  assert.equal(preserved.design.layers[0].text, 'Work in progress');
  assert.equal(opened.activeDesign.layers[0].text, incomingBefore.layers[0].text);
});

test('switching preserves named empty specifications, normalizes unnamed artwork, and skips only unnamed empty drafts', () => {
  for (const name of ['', '   ']) {
    const state = createWorkspace();
    state.activeDesign.name = name;
    const opened = openDesign(state, createWorkspace().activeDesign);
    assert.equal(opened.projects[0].design.name, 'Untitled project');
    assert.equal(opened.projects[0].revisions[0].design.name, 'Untitled project');
    assert.equal(state.activeDesign.name, name);
    assert.deepEqual(validateWorkspace(opened), opened);
  }
  const empty = createWorkspace();
  empty.activeDesign.layers = [];
  empty.activeDesign.name = '';
  assert.equal(openDesign(empty, createWorkspace().activeDesign).projects.length, 0);

  const named = createWorkspace();
  named.activeDesign.layers = [];
  named.activeDesign.name = 'Reserved launch cards';
  named.activeDesign.quantity = 750;
  named.activeDesign.background = '#234567';
  named.activeDesign.finish = 'Soft touch';
  const preservedBlank = openDesign(named, createWorkspace().activeDesign).projects[0].design;
  assert.equal(preservedBlank.name, 'Reserved launch cards');
  assert.equal(preservedBlank.quantity, 750);
  assert.equal(preservedBlank.background, '#234567');
  assert.equal(preservedBlank.finish, 'Soft touch');
  assert.deepEqual(preservedBlank.layers, []);

  let saved = createWorkspace();
  saved = saveProject(saved, saved.activeDesign);
  saved.activeDesign.layers = [];
  const opened = openDesign(saved, createWorkspace().activeDesign);
  assert.equal(opened.projects.length, 1);
  assert.equal(opened.projects[0].design.version, 2);
  assert.deepEqual(opened.projects[0].design.layers, []);
  assert.ok(opened.projects[0].revisions[0].design.layers.length > 0, 'Clearing artwork must preserve the earlier revision.');
});

test('opening the active project resumes unsaved edits and switching unchanged projects does not manufacture revisions', () => {
  let state = createWorkspace();
  state = saveProject(state, state.activeDesign);
  const staleCard = structuredClone(state.projects[0].design);
  state.activeDesign.layers[0].text = 'Keep my unsaved message';
  state.activeDesign.quantity = 750;
  const resumed = openDesign(state, staleCard);
  assert.equal(resumed, state);
  assert.equal(resumed.activeDesign.layers[0].text, 'Keep my unsaved message');
  assert.equal(resumed.activeDesign.quantity, 750);
  assert.equal(resumed.projects[0].revisions.length, 1);

  const other = createWorkspace().activeDesign;
  const switched = openDesign(resumed, other);
  assert.equal(switched.projects[0].design.version, 2);
  assert.equal(switched.projects[0].design.layers[0].text, 'Keep my unsaved message');
  const back = openDesign(switched, switched.projects[0].design);
  const away = openDesign(back, other);
  const original = away.projects.find(project => project.id === state.activeDesign.id);
  assert.equal(original.revisions.length, 2);
  assert.equal(original.design.version, 2);
  assert.equal(away.projects.length, 2);
});

test('cloud artwork copies retain their independent identity and embedded images without retaining account references', () => {
  const state = createWorkspace();
  const cloudSource = structuredClone(state.activeDesign);
  cloudSource.layers.push({ ...imageLayer(), assetPath: 'team-workspace/private.png' });
  const copied = { ...structuredClone(cloudSource), id: crypto.randomUUID(), version: 1, name: 'Team artwork (copy)' };
  const opened = openDesign(state, copied);
  assert.equal(opened.activeDesign.id, copied.id, 'The already independent cloud copy keeps one stable local identity.');
  assert.notEqual(opened.activeDesign.id, cloudSource.id);
  assert.equal(opened.activeDesign.layers.at(-1).src, imageData);
  assert.equal(opened.activeDesign.layers.at(-1).assetPath, undefined);
  assert.equal(copied.layers.at(-1).assetPath, 'team-workspace/private.png');
  const saved = saveProject(opened, opened.activeDesign);
  assert.equal(saved.projects.length, 2);
  assert.equal(saved.projects[0].id, copied.id);
  assert.equal(saved.projects[1].id, state.activeDesign.id);
});

test('invalid incoming designs and preservation capacity failures leave the active draft and projects unchanged', () => {
  const state = createWorkspace();
  state.activeDesign.layers[0].text = 'Irreplaceable draft';
  for (let index = 0; index < 200; index += 1) {
    const design = createWorkspace().activeDesign;
    state.projects.push({ id: design.id, design, revisions: [], archived: false, createdAt: state.updatedAt, updatedAt: state.updatedAt });
  }
  const before = structuredClone(state);
  const incoming = createWorkspace().activeDesign;
  assert.throws(() => openDesign(state, incoming), /maximum of 200 projects/);
  assert.deepEqual(state, before);
  const invalid = { ...incoming, quantity: 0 };
  assert.throws(() => openDesign(state, invalid), error => !/maximum of 200 projects/.test(error.message), 'Incoming validation must run before outgoing preservation.');
  assert.deepEqual(state, before);
  assert.throws(() => openDesign(state, { ...state.activeDesign, quantity: 0 }), 'Even a same-ID request must be validated.');
  const missing = { ...incoming, layers: [{ ...imageLayer(), src: undefined, assetPath: 'team-workspace/private.png' }] };
  assert.throws(() => openDesign(state, missing), /missing/);
  assert.deepEqual(state, before);

  // At capacity, an existing project can still save a changed draft and switch.
  const existing = { ...state, activeDesign: structuredClone(state.projects[0].design) };
  existing.activeDesign.layers[0].text = 'Updated at capacity';
  const opened = openDesign(existing, incoming);
  assert.equal(opened.projects.length, 200);
  assert.equal(opened.projects[0].design.layers[0].text, 'Updated at capacity');
  assert.equal(opened.activeDesign.id, incoming.id);
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
  assert.throws(() => addDesignToQuote(more, changed, ''), /no longer exists/);
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
  assert.equal(merged.projects.length, 1, 'The outgoing active draft becomes a recoverable project.');
  assert.equal(merged.projects[0].id, state.activeDesign.id);
  assert.notEqual(merged.activeDesign.id, existingQuoteOnly);
  assert.equal(merged.quotes[0].lines[0].design.id, merged.activeDesign.id);
  assert.notEqual(merged.quotes[0].lines[1].design.id, state.activeDesign.id);
  assert.equal(merged.quotes[1].lines[0].design.id, existingQuoteOnly);
  const repeat = mergeWorkspaceBackup(merged, incoming);
  assert.notEqual(repeat.activeDesign.id, merged.activeDesign.id);
  assert.equal(repeat.quotes.length, 3);
});

test('backup import preserves unnamed outgoing drafts and accounts for their saved project before accepting capacity', () => {
  const state = createWorkspace();
  state.activeDesign.name = '';
  state.activeDesign.layers[0].text = 'Do not lose this before importing';
  const incoming = createWorkspace();
  const before = structuredClone(state);
  const merged = mergeWorkspaceBackup(state, incoming);
  assert.deepEqual(state, before);
  const preserved = merged.projects.find(project => project.id === state.activeDesign.id);
  assert.equal(preserved.design.name, 'Untitled project');
  assert.equal(preserved.design.layers[0].text, state.activeDesign.layers[0].text);
  assert.equal(merged.activeDesign.id, incoming.activeDesign.id);

  for (let index = 0; index < 199; index += 1) {
    const design = createWorkspace().activeDesign;
    state.projects.push({ id: design.id, design, revisions: [], archived: false, createdAt: state.updatedAt, updatedAt: state.updatedAt });
  }
  const fullBefore = structuredClone(state);
  const withProject = saveProject(incoming, incoming.activeDesign);
  assert.throws(() => mergeWorkspaceBackup(state, withProject), /maximum of 200 projects/);
  assert.deepEqual(state, fullBefore, 'Failed imports must not partially save, rename, or replace the outgoing draft.');
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

test('reverse artwork validates each face independently and retains hydrated cloud images without account paths', () => {
  const state = createWorkspace();
  const frontImage = imageLayer();
  state.activeDesign.layers = [frontImage];
  state.activeDesign.back = { background: '#abcdef', layers: [{ ...frontImage, assetPath: 'private-team/reverse.png' }] };
  state.activeDesign.sides = 2;
  const local = validateLocalDesign(state.activeDesign);
  assert.equal(local.layers[0].id, local.back.layers[0].id, 'Layer identifiers are scoped to a face.');
  assert.equal(local.back.layers[0].src, imageData);
  assert.equal(local.back.layers[0].assetPath, undefined);
  assert.equal(state.activeDesign.back.layers[0].assetPath, 'private-team/reverse.png');
  const invalid = [
    back => { back.background = 'url(https://bad.test)'; },
    back => { back.layers[0].src = 'https://private.test/image.png'; },
    back => { delete back.layers[0].src; },
    back => { back.layers.push(structuredClone(back.layers[0])); },
    back => { back.layers[0].width = 101; },
    back => { back.layers = Array.from({ length: 101 }, () => imageLayer()); },
  ];
  for (const mutate of invalid) {
    const bad = structuredClone(state.activeDesign);
    mutate(bad.back);
    assert.throws(() => validateLocalDesign(bad));
  }
  const both = { ...local, layers: Array.from({ length: 100 }, () => imageLayer()), back: { ...local.back, layers: Array.from({ length: 100 }, () => imageLayer()) } };
  assert.equal(validateLocalDesign(both).back.layers.length, 100, 'Each face has its own layer limit.');
});

test('reverse-only untitled drafts survive switching and old single-face backups still round-trip', () => {
  const old = createWorkspace();
  assert.deepEqual(validateWorkspace(JSON.parse(JSON.stringify(old))), old);
  const state = createWorkspace();
  state.activeDesign.name = '';
  state.activeDesign.layers = [];
  state.activeDesign.back = { background: '#ffffff', layers: [imageLayer()] };
  const opened = openDesign(state, old.activeDesign);
  assert.equal(opened.projects.length, 1);
  assert.equal(opened.projects[0].design.name, 'Untitled project');
  assert.deepEqual(opened.projects[0].design.back, state.activeDesign.back);
  assert.equal(opened.projects[0].design.sides, 1, 'A preserved reverse draft does not silently enable two-side printing.');
  const legacy = createWorkspace();
  legacy.activeDesign.sides = 2;
  legacy.activeDesign.productId = 'mug';
  assert.deepEqual(validateWorkspace(legacy), legacy, 'Incomplete legacy specifications must remain recoverable; preflight blocks production.');
});

test('both faces survive quote snapshots, revisions and backup remapping and invalidate stale proof identities', () => {
  let state = createWorkspace();
  state.activeDesign.sides = 2;
  state.activeDesign.back = { background: '#fedcba', layers: [imageLayer()] };
  state = addDesignToQuote(state, state.activeDesign);
  const original = structuredClone(state);
  const originalFingerprint = designFingerprint(state.activeDesign);
  state.projects[0].proof = { fingerprint: originalFingerprint, reviewedAt: state.updatedAt };
  const edited = { ...state.activeDesign, back: { ...state.activeDesign.back, background: '#abcdef' } };
  assert.notEqual(designFingerprint(edited), originalFingerprint);
  state = saveProject(state, edited);
  assert.equal(state.projects[0].design.version, 2);
  assert.equal(state.projects[0].proof, undefined);
  assert.equal(state.projects[0].revisions[0].design.back.background, '#fedcba');
  assert.equal(state.quotes[0].lines[0].design.back.background, '#fedcba');
  const backup = validateWorkspace(JSON.parse(JSON.stringify(state)));
  assert.deepEqual(backup, state);
  const imported = mergeWorkspaceBackup(state, backup);
  assert.notEqual(imported.activeDesign.id, state.activeDesign.id);
  assert.deepEqual(imported.activeDesign.back, state.activeDesign.back);
  assert.deepEqual(imported.quotes[0].lines[0].design.back, original.quotes[0].lines[0].design.back);
  assert.equal(imported.quotes[0].lines[0].design.id, imported.activeDesign.id);
});

test('editing a quoted snapshot replaces exactly its line using an independent saved project and current specifications', () => {
  let state = createWorkspace();
  state = addDesignToQuote(state, state.activeDesign);
  state = addDesignToQuote(state, state.activeDesign, state.quotes[0].id);
  const quote = state.quotes[0];
  const line = quote.lines[0];
  const fingerprint = designFingerprint(line.design);
  state = saveProject(state, { ...state.activeDesign, name: 'Newer project version' });
  const originalProject = structuredClone(state.projects[0]);
  const otherLine = structuredClone(state.quotes[0].lines[1]);
  const edited = { ...structuredClone(line.design), id: crypto.randomUUID(), name: 'Edited estimate artwork', quantity: 750, finish: 'Soft touch', sides: 2, back: { background: '#ffffff', layers: [imageLayer()] } };
  state.activeDesign = edited;
  const before = structuredClone(state);
  const updated = updateQuoteArtwork(state, quote.id, line.id, edited, fingerprint);
  assert.deepEqual(state, before);
  assert.equal(updated.quotes.length, 1);
  assert.equal(updated.quotes[0].lines.length, 2);
  assert.equal(updated.quotes[0].lines[0].id, line.id);
  assert.equal(updated.quotes[0].lines[0].design.id, edited.id);
  assert.equal(updated.quotes[0].lines[0].design.quantity, 750);
  assert.equal(updated.quotes[0].lines[0].design.finish, 'Soft touch');
  assert.deepEqual(updated.quotes[0].lines[0].design.back, edited.back);
  assert.deepEqual(updated.quotes[0].lines[1], otherLine);
  assert.deepEqual(updated.projects.find(project => project.id === originalProject.id), originalProject);
  assert.deepEqual(updated.quotes[0].lines[0].design, updated.projects.find(project => project.id === edited.id).design);
  assert.equal(updated.quotes[0].status, 'Draft');
  edited.back.layers[0].text = 'External mutation';
  assert.notEqual(updated.quotes[0].lines[0].design.back.layers[0].text, 'External mutation');
});

test('quote artwork replacement rejects stale, removed, different-product and invalid targets atomically', () => {
  let state = createWorkspace();
  state = addDesignToQuote(state, state.activeDesign);
  const quote = state.quotes[0], line = quote.lines[0];
  const edited = { ...structuredClone(line.design), id: crypto.randomUUID() };
  const before = structuredClone(state);
  assert.throws(() => updateQuoteArtwork(state, crypto.randomUUID(), line.id, edited), /no longer exists/);
  assert.throws(() => updateQuoteArtwork(state, quote.id, crypto.randomUUID(), edited), /removed/);
  assert.throws(() => updateQuoteArtwork(state, quote.id, line.id, edited, 'stale-fingerprint'), /changed while/);
  assert.throws(() => updateQuoteArtwork(state, quote.id, line.id, { ...edited, productId: 'mug' }), /original product/);
  assert.throws(() => updateQuoteArtwork(state, quote.id, line.id, { ...edited, quantity: 0 }));
  assert.deepEqual(state, before);
  state.quotes[0].customer = { name: 'Emmanuel', company: 'Avalon', email: 'emmanuel@example.com' };
  state.quotes[0].status = 'Ready for review';
  assert.equal(updateQuoteArtwork(state, quote.id, line.id, edited).quotes[0].status, 'Draft');
  for (let index = state.projects.length; index < 200; index += 1) {
    const design = createWorkspace().activeDesign;
    state.projects.push({ id: design.id, design, revisions: [], archived: false, createdAt: state.updatedAt, updatedAt: state.updatedAt });
  }
  const fullBefore = structuredClone(state);
  assert.throws(() => updateQuoteArtwork(state, quote.id, line.id, edited), /maximum of 200 projects/);
  assert.deepEqual(state, fullBefore);
});

test('cloud save and hydration process both faces independently even when their layer IDs match', async () => {
  const { connectCloud, hydrateDesign, saveCloudProject } = await import('../lib/presswerk/cloud.ts');
  const client = connectCloud({ url: 'https://test-avalon.supabase.co', publishableKey: 'test-key' });
  const originalStorage = client.storage.from;
  const originalFrom = client.from;
  const uploads = new Map();
  let stored;
  client.storage.from = () => ({
    upload: async (path, blob) => { uploads.set(path, blob); return { error: null }; },
    download: async path => ({ data: uploads.get(path), error: null }),
  });
  client.from = () => ({
    insert: row => {
      stored = structuredClone(row.design);
      return { select: () => ({ maybeSingle: async () => ({ data: { design: stored }, error: null }) }) };
    },
  });
  const workspaceId = crypto.randomUUID();
  const source = createWorkspace().activeDesign;
  const reverseData = 'data:image/png;base64,YWJj';
  source.layers = [{ ...imageLayer(), id: 'shared-image-id' }];
  source.sides = 2;
  source.back = { background: '#abcdef', layers: [{ ...imageLayer(), id: 'shared-image-id', src: reverseData }] };
  try {
    const saved = await saveCloudProject(workspaceId, source, 0);
    assert.equal(uploads.size, 2);
    assert.ok(stored.layers[0].assetPath.startsWith(workspaceId + '/'));
    assert.ok(stored.back.layers[0].assetPath.startsWith(workspaceId + '/'));
    assert.notEqual(stored.layers[0].assetPath, stored.back.layers[0].assetPath);
    assert.equal(stored.layers[0].src, undefined);
    assert.equal(stored.back.layers[0].src, undefined);
    assert.equal(saved.layers[0].src, imageData);
    assert.equal(saved.back.layers[0].src, reverseData, 'The front source must never be restored onto a same-ID reverse layer.');
    // Node has no FileReader. Supply the browser-compatible adapter for this
    // isolated storage round trip; no service credentials or network are used.
    const OriginalReader = globalThis.FileReader;
    globalThis.FileReader = class {
      readAsDataURL(blob) { blob.arrayBuffer().then(buffer => { this.result = `data:${blob.type};base64,${Buffer.from(buffer).toString('base64')}`; this.onload(); }).catch(() => this.onerror()); }
    };
    try {
      const hydrated = await hydrateDesign(stored);
      assert.equal(hydrated.layers[0].src, imageData);
      assert.equal(hydrated.back.layers[0].src, reverseData);
      assert.equal(hydrated.back.background, '#abcdef');
    } finally { if (OriginalReader === undefined) delete globalThis.FileReader; else globalThis.FileReader = OriginalReader; }
  } finally {
    client.storage.from = originalStorage;
    client.from = originalFrom;
    await client.auth.stopAutoRefresh();
  }
});

test('configured 250-card front-and-back journey keeps its price and artwork through backup and exact estimate replacement', async () => {
  const { calculateQuote, initialDesign } = await import('../lib/presswerk/catalog.ts');
  const { preflightArtwork, printFaces } = await import('../lib/next/artwork.ts');
  const configuration = { productId: 'cards', quantity: 250, finish: 'Soft touch', tier: 'Value', sides: 2 };
  let state = createWorkspace();
  const configured = { ...initialDesign('cards'), ...configuration, name: 'Avalon launch cards', back: { background: '#ffffff', layers: [] } };
  state = openDesign(state, configured);
  assert.ok(preflightArtwork(state.activeDesign).some(issue => issue.id === 'back-empty'));
  state.activeDesign.back.layers = [{ ...structuredClone(state.activeDesign.layers[0]), text: 'Contact Avalon', color: '#123456', size: 5 }];
  assert.equal(preflightArtwork(state.activeDesign).filter(issue => issue.severity === 'error').length, 0);
  assert.equal(calculateQuote({ ...state.activeDesign, shipping: 0 }).subtotal, 34.43);
  state = addDesignToQuote(state, state.activeDesign);
  state = addDesignToQuote(state, { ...state.activeDesign, id: crypto.randomUUID(), name: 'Second recipient' }, state.quotes[0].id);
  state = validateWorkspace(JSON.parse(JSON.stringify(state)));
  const targetQuote = state.quotes[0], targetLine = targetQuote.lines[0];
  const otherBefore = structuredClone(targetQuote.lines[1]);
  const originalFingerprint = designFingerprint(targetLine.design);
  const editing = { ...structuredClone(targetLine.design), id: crypto.randomUUID(), version: 1 };
  state = openDesign(state, editing);
  state.activeDesign.back.layers[0].text = 'Updated contact information';
  const replaced = updateQuoteArtwork(state, targetQuote.id, targetLine.id, state.activeDesign, originalFingerprint);
  const item = replaced.quotes[0].lines[0];
  assert.equal(item.id, targetLine.id);
  assert.equal(replaced.quotes[0].lines.length, 2);
  assert.deepEqual(replaced.quotes[0].lines[1], otherBefore);
  for (const [key, value] of Object.entries(configuration)) assert.equal(item.design[key], value);
  assert.equal(item.design.back.layers[0].text, 'Updated contact information');
  assert.equal(calculateQuote({ ...item.design, shipping: 0 }).subtotal, 34.43);
  assert.deepEqual(printFaces(item.design).map(face => face.face), ['front', 'back']);
  assert.equal(preflightArtwork(item.design).filter(issue => issue.severity === 'error').length, 0);
  assert.deepEqual(validateWorkspace(JSON.parse(JSON.stringify(replaced))), replaced);
});
