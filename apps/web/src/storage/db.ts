import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { ObservationRecord } from '../observation';

interface CompassDB extends DBSchema {
  observations: {
    key: string;
    value: ObservationRecord;
    indexes: { utc: string };
  };
}

let handle: Promise<IDBPDatabase<CompassDB>> | undefined;

function db(): Promise<IDBPDatabase<CompassDB>> {
  handle ??= openDB<CompassDB>('compass-error', 1, {
    upgrade(database) {
      const store = database.createObjectStore('observations', { keyPath: 'id' });
      store.createIndex('utc', 'utc');
    },
  });
  return handle;
}

export async function saveObservation(record: ObservationRecord): Promise<void> {
  await (await db()).put('observations', record);
}

/** Most recent observation first — the order the book is read in. */
export async function listObservations(): Promise<ObservationRecord[]> {
  const all = await (await db()).getAllFromIndex('observations', 'utc');
  return all.reverse();
}

export async function deleteObservation(id: string): Promise<void> {
  await (await db()).delete('observations', id);
}

export async function clearObservations(): Promise<void> {
  await (await db()).clear('observations');
}
