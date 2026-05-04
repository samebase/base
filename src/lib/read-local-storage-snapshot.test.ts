import { expect, test } from "vite-plus/test";
import { readLocalStorageEntries } from "./read-local-storage-snapshot";

type TestStorageEntry = readonly [key: string, value: string];

function createStorage(entries: readonly TestStorageEntry[]) {
  return {
    get length() {
      return entries.length;
    },
    key(index: number) {
      return entries[index]?.[0] ?? null;
    },
    getItem(key: string) {
      return entries.find((entry) => entry[0] === key)?.[1] ?? null;
    },
  };
}

test("reads localStorage values as exact strings", () => {
  expect(
    readLocalStorageEntries(
      createStorage([
        ["plain", "value"],
        ["json", '{"enabled":true}'],
        ["multiline", "first\nsecond"],
        ["empty", ""],
      ]),
    ),
  ).toEqual([
    { key: "plain", value: "value" },
    { key: "json", value: '{"enabled":true}' },
    { key: "multiline", value: "first\nsecond" },
    { key: "empty", value: "" },
  ]);
});

test("skips entries removed while localStorage is being read", () => {
  expect(
    readLocalStorageEntries({
      length: 1,
      key: () => "removed",
      getItem: () => null,
    }),
  ).toEqual([]);
});
