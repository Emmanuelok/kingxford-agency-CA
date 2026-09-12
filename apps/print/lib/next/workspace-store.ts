import { z } from 'zod';
import { brandSchema, designSchema } from '../presswerk/cloud.ts';
import { calculateQuote, initialDesign, products, type Design } from '../presswerk/catalog.ts';
import { designFingerprint } from '../presswerk/design-identity.ts';
import type { PrintProject, QuoteDraft, StudioWorkspace } from './types.ts';

const MAX_REVISIONS = 20;
const uuid = () => crypto.randomUUID();
const timestamp = () => new Date().toISOString();
const dateSchema = z.string().refine(value => Number.isFinite(Date.parse(value)), 'Invalid date.');
const idSchema = z.string().uuid();
const productIds = new Set(products.map(product => product.id));
const supportedImage = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/;
const draftDesignSchema = designSchema.extend({ name: z.string().max(80) });

/** Only self-contained image data belongs to this device workspace. */
export function validateLocalDesign(value: unknown, allowUntitled = false): Design {
  const design = (allowUntitled ? draftDesignSchema : designSchema).parse(value);
  calculateQuote({ ...design, shipping: 0 });
  const seen = new Set<string>();
  design.layers = design.layers.map(layer => {
    if (seen.has(layer.id)) throw new Error('Each design layer needs a unique identifier.');
    seen.add(layer.id);
    if (layer.src) {
      const match = supportedImage.exec(layer.src);
      if (!match || match[2].length % 4 !== 0) {
        throw new Error('Artwork must be an embedded PNG, JPG or WebP image.');
      }
      const bytes = match[2].length * 3 / 4 - (match[2].endsWith('==') ? 2 : match[2].endsWith('=') ? 1 : 0);
      if (bytes > 12 * 1024 * 1024) throw new Error('Artwork files must be under 12MB.');
    }
    if (layer.type === 'image' && !layer.src) {
      throw new Error('An image is missing. Embed its artwork before importing this design.');
    }
    // A hydrated cloud export may have both fields. Retain the actual artwork,
    // never a storage reference that would require another account's credentials.
    const local = { ...layer };
    delete local.assetPath;
    return local;
  });
  return design;
}

const localDesignSchema = z.unknown().transform((value, context) => {
  try {
    return validateLocalDesign(value);
  } catch (error) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: error instanceof Error ? error.message : 'Invalid design.' });
    return z.NEVER;
  }
});

const activeDesignSchema = z.unknown().transform((value, context) => {
  try {
    return validateLocalDesign(value, true);
  } catch (error) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: error instanceof Error ? error.message : 'Invalid active design.' });
    return z.NEVER;
  }
});

const projectSchema = z.object({
  id: idSchema,
  design: localDesignSchema,
  revisions: z.array(z.object({
    id: idSchema,
    createdAt: dateSchema,
    label: z.string().min(1).max(120),
    design: localDesignSchema,
  })).max(MAX_REVISIONS),
  archived: z.boolean(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
  proof: z.object({ fingerprint: z.string(), reviewedAt: dateSchema }).optional(),
});

const quoteSchema = z.object({
  id: idSchema,
  name: z.string().max(160),
  lines: z.array(z.object({ id: idSchema, design: localDesignSchema })).max(100),
  customer: z.object({
    name: z.string().max(160),
    company: z.string().max(160),
    email: z.string().max(254),
  }),
  delivery: z.object({
    method: z.enum(['Pickup', 'Delivery']),
    city: z.string().max(160),
    notes: z.string().max(3000),
    allowance: z.number().finite().min(0).max(100000),
  }),
  notes: z.string().max(10000),
  status: z.enum(['Draft', 'Ready for review', 'Archived']),
  createdAt: dateSchema,
  updatedAt: dateSchema,
});

const workspaceSchema = z.object({
  schemaVersion: z.literal(2),
  activeDesign: activeDesignSchema,
  projects: z.array(projectSchema).max(200),
  quotes: z.array(quoteSchema).max(200),
  brand: brandSchema.extend({ name: z.string().max(60) }),
  favourites: z.array(z.string().refine(id => productIds.has(id), 'Unknown favourite product.')).max(products.length),
  updatedAt: dateSchema,
});

function uniqueIds(values: { id: string }[], label: string): void {
  if (new Set(values.map(value => value.id)).size !== values.length) {
    throw new Error(`Duplicate ${label} identifiers. The workspace was not imported.`);
  }
}

/** Parse into new objects; invalid imports never partially alter existing work. */
export function validateWorkspace(value: unknown): StudioWorkspace {
  const state = workspaceSchema.parse(value);
  uniqueIds(state.projects, 'project');
  uniqueIds(state.quotes, 'quote');
  for (const project of state.projects) {
    if (project.id !== project.design.id || project.revisions.some(revision => revision.design.id !== project.id)) {
      throw new Error('Project revisions must belong to the same project.');
    }
    uniqueIds(project.revisions, 'revision');
    if (project.revisions.some(revision => revision.design.version > project.design.version)) {
      throw new Error('A project cannot be older than its saved revisions.');
    }
    if (project.proof && project.proof.fingerprint !== designFingerprint(project.design)) {
      delete project.proof;
    }
  }
  for (const quote of state.quotes) {
    uniqueIds(quote.lines, 'quote line');
    if (quote.status === 'Ready for review') {
      if (!quote.lines.length) throw new Error('An estimate needs a print item before it is ready for review.');
      if (!quote.name.trim()) throw new Error('Name the estimate before marking it ready for review.');
      if (!quote.customer.name.trim()) throw new Error('Add a contact name before marking the estimate ready for review.');
      if (!z.string().email().safeParse(quote.customer.email.trim()).success) throw new Error('Add a valid email before marking the estimate ready for review.');
      if (quote.delivery.method === 'Delivery' && !quote.delivery.city.trim()) throw new Error('Add a fulfilment city before marking the estimate ready for review.');
    }
  }
  state.favourites = [...new Set(state.favourites)];
  return state;
}

export function createWorkspace(): StudioWorkspace {
  const activeDesign = initialDesign('cards');
  activeDesign.background = '#183e36';
  activeDesign.layers = activeDesign.layers.map(layer => ({ ...layer, color: '#f4f2e8' }));
  return {
    schemaVersion: 2,
    activeDesign,
    projects: [],
    quotes: [],
    brand: { name: 'Your brand', tagline: 'Make your mark.', primary: '#183e36', secondary: '#f4f2e8', accent: '#d8ed80', font: 'Arial' },
    favourites: [],
    updatedAt: timestamp(),
  };
}

/** A save is a new immutable revision only when artwork or specifications change. */
export function saveProject(state: StudioWorkspace, input: Design, label?: string): StudioWorkspace {
  const design = validateLocalDesign(input);
  const existing = state.projects.find(project => project.id === design.id);
  if (existing && designFingerprint(existing.design) === designFingerprint(design)) {
    return {
      ...state,
      activeDesign: state.activeDesign.id === design.id ? structuredClone(existing.design) : state.activeDesign,
    };
  }
  if (!existing && state.projects.length >= 200) throw new Error('This workspace has reached its maximum of 200 projects.');
  const now = timestamp();
  const saved: Design = { ...design, version: (existing?.design.version ?? 0) + 1, updatedAt: now };
  const revision = { id: uuid(), createdAt: now, label: (label?.trim() || `Version ${saved.version}`).slice(0, 120), design: structuredClone(saved) };
  const project: PrintProject = {
    id: saved.id,
    design: saved,
    revisions: [...(existing?.revisions ?? []), revision].slice(-MAX_REVISIONS),
    archived: existing?.archived ?? false,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  return {
    ...state,
    activeDesign: state.activeDesign.id === design.id ? structuredClone(saved) : state.activeDesign,
    projects: [project, ...state.projects.filter(item => item.id !== saved.id)],
    updatedAt: now,
  };
}

/** A quotation is a separate draft specification, never a paid or submitted job. */
export function createQuote(state: StudioWorkspace, input: Design): StudioWorkspace {
  const design = validateLocalDesign(input);
  if (state.quotes.length >= 200) throw new Error('This workspace has reached its maximum of 200 estimates.');
  const now = timestamp();
  const quote: QuoteDraft = {
    id: uuid(),
    name: `${design.name} · quote`,
    lines: [{ id: uuid(), design }],
    customer: { name: '', company: '', email: '' },
    delivery: { method: 'Delivery', city: design.city, notes: '', allowance: 0 },
    notes: '',
    status: 'Draft',
    createdAt: now,
    updatedAt: now,
  };
  return { ...state, quotes: [quote, ...state.quotes], updatedAt: now };
}

/** Save first so the estimate captures the exact revision that now exists. */
export function addDesignToQuote(state: StudioWorkspace, design: Design, targetId?: string): StudioWorkspace {
  const target = targetId ? state.quotes.find(quote => quote.id === targetId) : undefined;
  if (targetId && !target) throw new Error('The selected estimate no longer exists. Choose another estimate.');
  if (target && target.lines.length >= 100) throw new Error('An estimate can contain a maximum of 100 print items.');
  const saved = saveProject(state, design);
  const savedDesign = saved.projects.find(project => project.id === design.id)!.design;
  if (!target) return validateWorkspace(createQuote(saved, savedDesign));
  const now = timestamp();
  return validateWorkspace({
    ...saved,
    quotes: saved.quotes.map(quote => quote.id !== target.id ? quote : {
      ...quote,
      lines: [...quote.lines, { id: uuid(), design: structuredClone(savedDesign) }],
      status: 'Draft' as const,
      updatedAt: now,
    }),
    updatedAt: now,
  });
}

function allDesigns(state: StudioWorkspace): Design[] {
  return [
    state.activeDesign,
    ...state.projects.flatMap(project => [project.design, ...project.revisions.map(revision => revision.design)]),
    ...state.quotes.flatMap(quote => quote.lines.map(line => line.design)),
  ];
}

function allIdentifiers(state: StudioWorkspace): Set<string> {
  return new Set([
    ...allDesigns(state).map(design => design.id),
    ...state.projects.flatMap(project => [project.id, ...project.revisions.map(revision => revision.id)]),
    ...state.quotes.flatMap(quote => [quote.id, ...quote.lines.map(line => line.id)]),
  ]);
}

/** Import copies share a single ID map, including artwork that only lives in a quote. */
export function mergeWorkspaceBackup(state: StudioWorkspace, incoming: StudioWorkspace): StudioWorkspace {
  const current = validateWorkspace(state);
  const imported = validateWorkspace(incoming);
  if (current.projects.length + imported.projects.length > 200) throw new Error('This import would exceed the workspace maximum of 200 projects.');
  if (current.quotes.length + imported.quotes.length > 200) throw new Error('This import would exceed the workspace maximum of 200 estimates.');

  const currentIds = allIdentifiers(current);
  const reservedIds = new Set([...currentIds, ...allIdentifiers(imported)]);
  const freshId = () => {
    let value = uuid();
    while (reservedIds.has(value)) value = uuid();
    reservedIds.add(value);
    return value;
  };
  const designIds = new Map<string, string>();
  for (const design of allDesigns(imported)) {
    if (!designIds.has(design.id)) designIds.set(design.id, currentIds.has(design.id) ? freshId() : design.id);
  }
  const copyDesign = (design: Design): Design => ({ ...structuredClone(design), id: designIds.get(design.id)! });
  const usedEntityIds = new Set([...currentIds, ...designIds.values()]);
  const copyEntityId = (id: string): string => {
    const value = usedEntityIds.has(id) ? freshId() : id;
    usedEntityIds.add(value);
    return value;
  };
  const projects = imported.projects.map(project => {
    const copied: PrintProject = {
      ...project,
      id: designIds.get(project.id)!,
      design: copyDesign(project.design),
      revisions: project.revisions.map(revision => ({ ...revision, id: copyEntityId(revision.id), design: copyDesign(revision.design) })),
    };
    if (copied.id !== project.id) delete copied.proof;
    return copied;
  });
  const quotes = imported.quotes.map(quote => ({
    ...quote,
    id: copyEntityId(quote.id),
    lines: quote.lines.map(line => ({ id: copyEntityId(line.id), design: copyDesign(line.design) })),
  }));

  // Validation happens before the caller receives any replacement state. It
  // checks the combined limits and the identities of every nested revision.
  return validateWorkspace({
    ...current,
    activeDesign: copyDesign(imported.activeDesign),
    projects: [...projects, ...current.projects],
    quotes: [...quotes, ...current.quotes],
    favourites: [...new Set([...current.favourites, ...imported.favourites])],
    updatedAt: timestamp(),
  });
}
