import assert from "node:assert/strict";
import test from "node:test";

import {
  IMPORT_MAX_COLUMNS,
  IMPORT_MAX_FILE_BYTES,
  IMPORT_MAX_ROWS,
  IMPORT_MAX_PREVIEW_ROWS,
  IMPORT_MAX_SOURCE_ROWS,
  IMPORT_MAX_SUBMISSION_CHARS,
  IMPORT_MAX_WORKSHEETS,
  getImportFormat,
  inferImportMapping,
  normalizeImportMapping,
} from "../src/features/import/import-contract.ts";

test("import contract exposes bounded supported formats", () => {
  assert.equal(getImportFormat("catalog.csv", "text/csv"), "csv");
  assert.equal(getImportFormat("catalog.XLS", "application/vnd.ms-excel"), "xls");
  assert.equal(
    getImportFormat(
      "catalog.xlsx",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ),
    "xlsx",
  );
  assert.equal(getImportFormat("catalog.pdf", "application/pdf"), null);
  assert.equal(getImportFormat("catalog.csv", "application/pdf"), "csv");
  assert.ok(IMPORT_MAX_FILE_BYTES > 0);
  assert.ok(IMPORT_MAX_ROWS > 0);
  assert.ok(IMPORT_MAX_COLUMNS > 0);
  assert.ok(IMPORT_MAX_PREVIEW_ROWS > 0);
  assert.ok(IMPORT_MAX_SOURCE_ROWS >= IMPORT_MAX_ROWS);
  assert.ok(IMPORT_MAX_WORKSHEETS > 0);
  assert.ok(IMPORT_MAX_SUBMISSION_CHARS > IMPORT_MAX_FILE_BYTES);
});

test("import contract infers canonical product mappings from Russian and English headers", () => {
  const headers = ["Наименование", "Цена", "Описание", "Наличие", "Артикул"];
  const mapping = inferImportMapping(headers);

  assert.deepEqual(mapping, {
    title: 0,
    price: 1,
    description: 2,
    availability: 3,
  });
});

test("import mapping rejects duplicate columns and out-of-range indexes", () => {
  assert.deepEqual(
    normalizeImportMapping({ title: 0, price: 1, description: 2, availability: 3 }, 4),
    { title: 0, price: 1, description: 2, availability: 3 },
  );
  assert.throws(
    () => normalizeImportMapping({ title: 0, price: 0 }, 2),
    /different columns/i,
  );
  assert.throws(
    () => normalizeImportMapping({ title: 4 }, 4),
    /column/i,
  );
});
