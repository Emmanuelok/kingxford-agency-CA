'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createWorkspace, validateWorkspace } from './workspace-store.ts';
import type { StudioWorkspace } from './types.ts';

export type StorageStatus = 'loading' | 'saving' | 'saved' | 'error' | 'conflict';
type StoredWorkspace = { revision: string; workspace: StudioWorkspace };
const DATABASE = 'avalon-print-studio-v2';
const STORE = 'workspace';
const KEY = 'workspace';
const CHANNEL = `${DATABASE}:updates`;
const SAVE_DELAY = 650;

class WorkspaceConflict extends Error {
  constructor() { super('This workspace changed in another tab. Export your current work if needed, then reload the saved workspace.'); }
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!globalThis.indexedDB) {
      reject(new Error('This browser does not allow device storage. Export your work before closing this tab.'));
      return;
    }
    const request = indexedDB.open(DATABASE, 1);
    let blocked = false;
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE);
    };
    request.onerror = () => reject(request.error ?? new Error('Device storage could not be opened.'));
    request.onblocked = () => {
      blocked = true;
      reject(new Error('Another tab is blocking device storage. Close the other Avalon Print tab and reload.'));
    };
    request.onsuccess = () => {
      if (blocked) { request.result.close(); return; }
      resolve(request.result);
    };
  });
}

function readWorkspace(database: IDBDatabase): Promise<StoredWorkspace | undefined> {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE, 'readonly');
    const request = transaction.objectStore(STORE).get(KEY);
    request.onsuccess = () => resolve(request.result as StoredWorkspace | undefined);
    request.onerror = () => reject(request.error ?? new Error('The saved workspace could not be read.'));
    transaction.onabort = () => reject(transaction.error ?? new Error('Reading device storage was interrupted.'));
  });
}

/** Compare and replace in one read/write transaction, including across tabs. */
function writeWorkspace(database: IDBDatabase, workspace: StudioWorkspace, expectedRevision: string | null): Promise<string> {
  const validated = validateWorkspace(workspace);
  return new Promise((resolve, reject) => {
    const revision = crypto.randomUUID();
    const transaction = database.transaction(STORE, 'readwrite');
    const store = transaction.objectStore(STORE);
    const current = store.get(KEY);
    let failure: Error | null = null;
    current.onsuccess = () => {
      const saved = current.result as StoredWorkspace | undefined;
      if ((saved?.revision ?? null) !== expectedRevision) {
        failure = new WorkspaceConflict();
        transaction.abort();
        return;
      }
      store.put({ revision, workspace: validated } satisfies StoredWorkspace, KEY);
    };
    transaction.oncomplete = () => resolve(revision);
    transaction.onerror = () => { failure ??= transaction.error ?? new Error('Your workspace could not be saved.'); };
    transaction.onabort = () => reject(failure ?? transaction.error ?? new Error('Saving was interrupted. Your changes are still in this tab.'));
  });
}

function errorMessage(error: unknown): string {
  if (error instanceof DOMException && error.name === 'QuotaExceededError') {
    return 'Device storage is full. Export your workspace, then remove unused projects or artwork and try saving again.';
  }
  return error instanceof Error ? error.message : 'Your workspace could not be saved. Export your work before closing this tab.';
}

export function useWorkspace(): {
  workspace: StudioWorkspace;
  ready: boolean;
  storageStatus: StorageStatus;
  storageError: string;
  update: (updater: (previous: StudioWorkspace) => StudioWorkspace) => void;
  flush: () => Promise<void>;
  reload: () => Promise<void>;
} {
  const [workspace, setWorkspace] = useState(createWorkspace);
  const [ready, setReady] = useState(false);
  const [storageStatus, setStorageStatus] = useState<StorageStatus>('loading');
  const [storageError, setStorageError] = useState('');
  const current = useRef(workspace);
  const database = useRef<IDBDatabase | null>(null);
  const revision = useRef<string | null>(null);
  const channel = useRef<BroadcastChannel | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loading = useRef(true);
  const mounted = useRef(false);
  const conflict = useRef(false);
  const hydrationError = useRef(false);
  const editSerial = useRef(0);
  const savedSerial = useRef(0);
  const writing = useRef<Promise<void> | null>(null);
  const lifecycle = useRef(0);

  const report = useCallback((status: StorageStatus, message = '') => {
    if (!mounted.current) return;
    setStorageStatus(status);
    setStorageError(message);
  }, []);

  const flush = useCallback(async () => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    if (loading.current) throw new Error('Your saved workspace is still loading.');
    if (conflict.current) throw new WorkspaceConflict();
    if (hydrationError.current || !database.current) throw new Error('Device storage is unavailable. Export your current work, then reload to retry.');
    if (writing.current) return writing.current;
    const run = async () => {
      try {
        while (savedSerial.current < editSerial.current) {
          if (conflict.current) throw new WorkspaceConflict();
          const snapshot = current.current;
          const serial = editSerial.current;
          report('saving');
          revision.current = await writeWorkspace(database.current!, snapshot, revision.current);
          savedSerial.current = serial;
          channel.current?.postMessage({ revision: revision.current });
        }
        if (!conflict.current) report('saved');
      } catch (error) {
        if (error instanceof WorkspaceConflict) conflict.current = true;
        report(conflict.current ? 'conflict' : 'error', errorMessage(error));
        throw error;
      }
    };
    writing.current = run();
    try { await writing.current; } finally { writing.current = null; }
  }, [report]);

  const reload = useCallback(async () => {
    const generation = lifecycle.current;
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    loading.current = true;
    report('loading');
    if (mounted.current) setReady(false);
    try {
      if (writing.current) await writing.current.catch(() => undefined);
      if (!database.current) {
        const opened = await openDatabase();
        if (generation !== lifecycle.current) { opened.close(); return; }
        database.current = opened;
      }
      const record = await readWorkspace(database.current);
      if (generation !== lifecycle.current) return;
      const restored = record ? validateWorkspace(record.workspace) : createWorkspace();
      if (record && (typeof record.revision !== 'string' || !record.revision)) throw new Error('The saved workspace has an invalid revision.');
      current.current = restored;
      revision.current = record?.revision ?? null;
      editSerial.current = 0;
      savedSerial.current = 0;
      conflict.current = false;
      hydrationError.current = false;
      if (mounted.current) setWorkspace(restored);
      report('saved');
    } catch (error) {
      if (generation !== lifecycle.current) return;
      hydrationError.current = true;
      report('error', errorMessage(error));
      throw error;
    } finally {
      if (generation === lifecycle.current) {
        loading.current = false;
        if (mounted.current) setReady(true);
      }
    }
  }, [report]);

  const update = useCallback((updater: (previous: StudioWorkspace) => StudioWorkspace) => {
    if (loading.current) throw new Error('Wait for your saved workspace to load before making changes.');
    const next = updater(current.current);
    if (next === current.current) return;
    current.current = { ...next, updatedAt: new Date().toISOString() };
    editSerial.current += 1;
    setWorkspace(current.current);
    if (timer.current) clearTimeout(timer.current);
    // Keep current changes available for export even when storage is blocked.
    if (conflict.current || hydrationError.current || !database.current) return;
    report('saving');
    timer.current = setTimeout(() => { void flush().catch(() => undefined); }, SAVE_DELAY);
  }, [flush, report]);

  useEffect(() => {
    mounted.current = true;
    const generation = ++lifecycle.current;
    let opened: IDBDatabase | null = null;
    const receiveChange = () => {
      if (generation !== lifecycle.current) return;
      conflict.current = true;
      if (timer.current) { clearTimeout(timer.current); timer.current = null; }
      report('conflict', new WorkspaceConflict().message);
    };
    const checkForChanges = async () => {
      if (loading.current || !database.current || writing.current || conflict.current) return;
      const expected = revision.current;
      try {
        const record = await readWorkspace(database.current);
        if (generation !== lifecycle.current || loading.current || writing.current || expected !== revision.current) return;
        if ((record?.revision ?? null) !== expected) receiveChange();
      } catch (error) { report('error', errorMessage(error)); }
    };
    const initialize = async () => {
      try {
        opened = await openDatabase();
        if (generation !== lifecycle.current) { opened.close(); return; }
        database.current = opened;
        opened.onversionchange = () => { opened?.close(); database.current = null; receiveChange(); };
        await reload();
        if (generation !== lifecycle.current) return;
        if ('BroadcastChannel' in globalThis) {
          channel.current = new BroadcastChannel(CHANNEL);
          channel.current.onmessage = event => {
            const incoming = event.data as { revision?: unknown };
            if (typeof incoming?.revision === 'string' && incoming.revision !== revision.current) void checkForChanges();
          };
        }
      } catch (error) {
        if (generation !== lifecycle.current) return;
        loading.current = false;
        hydrationError.current = true;
        setReady(true);
        report('error', errorMessage(error));
      }
    };
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (editSerial.current > savedSerial.current) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    const saveWhenHidden = () => {
      if (document.visibilityState === 'hidden' && !loading.current && !conflict.current) void flush().catch(() => undefined);
    };
    void initialize();
    window.addEventListener('focus', checkForChanges);
    window.addEventListener('beforeunload', beforeUnload);
    document.addEventListener('visibilitychange', saveWhenHidden);
    return () => {
      mounted.current = false;
      lifecycle.current += 1;
      if (timer.current) clearTimeout(timer.current);
      channel.current?.close();
      channel.current = null;
      opened?.close();
      database.current = null;
      window.removeEventListener('focus', checkForChanges);
      window.removeEventListener('beforeunload', beforeUnload);
      document.removeEventListener('visibilitychange', saveWhenHidden);
    };
  }, [flush, reload, report]);

  return { workspace, ready, storageStatus, storageError, update, flush, reload };
}
