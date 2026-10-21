// Crash-safe local persistence for recordings. Chunks are written while recording,
// so an interrupted session (tab closed, app killed, upload failed) can be recovered.
const DB_NAME = 'vts-recordings';
const DB_VERSION = 1;
const META = 'meta';
const CHUNKS = 'chunks';

export interface LocalRecordingMeta {
  id: string;
  mimeType: string;
  language: string;
  startedAt: number;
  durationSeconds: number;
  status: 'recording' | 'stopped';
}

const openDb = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not available'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      db.createObjectStore(META, { keyPath: 'id' });
      const chunks = db.createObjectStore(CHUNKS, { autoIncrement: true });
      chunks.createIndex('recordingId', 'recordingId');
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

const run = async <T,>(
  stores: string[],
  mode: IDBTransactionMode,
  fn: (tx: IDBTransaction) => IDBRequest<T> | void
): Promise<T | undefined> => {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(stores, mode);
    const request = fn(tx);
    tx.oncomplete = () => {
      db.close();
      resolve(request ? (request.result as T) : undefined);
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
    tx.onabort = () => {
      db.close();
      reject(tx.error);
    };
  });
};

export const recordingStore = {
  async create(meta: LocalRecordingMeta) {
    await run([META], 'readwrite', (tx) => tx.objectStore(META).put(meta));
  },

  async updateMeta(id: string, patch: Partial<LocalRecordingMeta>) {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction([META], 'readwrite');
      const store = tx.objectStore(META);
      const get = store.get(id);
      get.onsuccess = () => {
        if (get.result) store.put({ ...get.result, ...patch });
      };
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = tx.onabort = () => {
        db.close();
        reject(tx.error);
      };
    });
  },

  async appendChunk(id: string, data: Blob) {
    await run([CHUNKS], 'readwrite', (tx) => tx.objectStore(CHUNKS).add({ recordingId: id, data }));
  },

  async list(): Promise<LocalRecordingMeta[]> {
    const result = await run<LocalRecordingMeta[]>([META], 'readonly', (tx) => tx.objectStore(META).getAll());
    return (result || []).sort((a, b) => b.startedAt - a.startedAt);
  },

  async getBlob(id: string): Promise<Blob | null> {
    const db = await openDb();
    const meta: LocalRecordingMeta | undefined = await new Promise((resolve, reject) => {
      const req = db.transaction([META], 'readonly').objectStore(META).get(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    const parts: Blob[] = await new Promise((resolve, reject) => {
      const req = db.transaction([CHUNKS], 'readonly').objectStore(CHUNKS).index('recordingId').getAll(id);
      req.onsuccess = () => resolve((req.result || []).map((row: { data: Blob }) => row.data));
      req.onerror = () => reject(req.error);
    });
    db.close();
    if (!meta || parts.length === 0) return null;
    return new Blob(parts, { type: meta.mimeType });
  },

  async remove(id: string) {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction([META, CHUNKS], 'readwrite');
      tx.objectStore(META).delete(id);
      const index = tx.objectStore(CHUNKS).index('recordingId');
      const cursorReq = index.openKeyCursor(IDBKeyRange.only(id));
      cursorReq.onsuccess = () => {
        const cursor = cursorReq.result;
        if (cursor) {
          tx.objectStore(CHUNKS).delete(cursor.primaryKey);
          cursor.continue();
        }
      };
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = tx.onabort = () => {
        db.close();
        reject(tx.error);
      };
    });
  }
};
