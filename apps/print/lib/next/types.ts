import type { Design } from '../presswerk/catalog.ts';

export type BrandKit = { name: string; tagline: string; primary: string; secondary: string; accent: string; font: string };
export type ProjectRevision = { id: string; createdAt: string; label: string; design: Design };
export type PrintProject = { id: string; design: Design; revisions: ProjectRevision[]; archived: boolean; createdAt: string; updatedAt: string; proof?: { fingerprint: string; reviewedAt: string } };
export type QuoteLine = { id: string; design: Design };
export type QuoteDraft = { id: string; name: string; lines: QuoteLine[]; customer: { name: string; company: string; email: string }; delivery: { method: 'Pickup' | 'Delivery'; city: string; notes: string; allowance: number }; notes: string; status: 'Draft' | 'Ready for review' | 'Archived'; createdAt: string; updatedAt: string };
export type StudioWorkspace = { schemaVersion: 2; activeDesign: Design; projects: PrintProject[]; quotes: QuoteDraft[]; brand: BrandKit; favourites: string[]; updatedAt: string };
export type WorkspaceView = 'home' | 'catalogue' | 'studio' | 'projects' | 'quotes' | 'templates' | 'brand' | 'planner' | 'pricing' | 'production' | 'developers';
