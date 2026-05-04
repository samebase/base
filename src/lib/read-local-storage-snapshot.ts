export type LocalStorageEntry = {
  key: string;
  value: string;
};

export type LocalStorageSnapshot =
  | {
      status: "ready";
      entries: LocalStorageEntry[];
    }
  | {
      status: "error";
      message: string;
    };

type LocalStorageSource = {
  readonly length: number;
  key(index: number): string | null;
  getItem(key: string): string | null;
};

export function readLocalStorageEntries(storage: LocalStorageSource): LocalStorageEntry[] {
  const entries: LocalStorageEntry[] = [];

  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);

    if (key === null) {
      continue;
    }

    const value = storage.getItem(key);

    if (value === null) {
      continue;
    }

    entries.push({ key, value });
  }

  return entries;
}

export function readBrowserLocalStorageSnapshot(): LocalStorageSnapshot {
  try {
    return {
      status: "ready",
      entries: readLocalStorageEntries(window.localStorage),
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unable to read localStorage",
    };
  }
}
