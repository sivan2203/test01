import assert from "node:assert/strict";
import test from "node:test";

import {
  normalizeImportRows,
} from "../src/features/import/import-normalization.ts";

test("normalization maps imported rows into the existing product draft contract", () => {
  const result = normalizeImportRows(
    [
      { rowNumber: 2, values: ["Чайник", "1 250,50", "Стальной", "В наличии"] },
      { rowNumber: 3, values: ["Чашка", "по запросу", "", ""] },
    ],
    { title: 0, price: 1, description: 2, availability: 3 },
  );

  assert.deepEqual(result, [
    {
      rowNumber: 2,
      status: "valid",
      values: {
        title: "Чайник",
        priceMode: "fixed",
        priceAmount: "1250.50",
        description: "Стальной",
        availabilityStatus: "in_stock",
      },
      fieldErrors: {},
    },
    {
      rowNumber: 3,
      status: "valid",
      values: {
        title: "Чашка",
        priceMode: "request",
        priceAmount: "",
        description: "",
        availabilityStatus: "in_stock",
      },
      fieldErrors: {},
    },
  ]);
});

test("normalization keeps invalid rows for partial success with field errors", () => {
  const [result] = normalizeImportRows(
    [{ rowNumber: 8, values: ["", "not-a-price", "Описание", "unknown"] }],
    { title: 0, price: 1, description: 2, availability: 3 },
  );

  assert.equal(result.status, "invalid");
  assert.equal(result.rowNumber, 8);
  assert.ok(result.fieldErrors.title);
  assert.ok(result.fieldErrors.priceAmount);
  assert.ok(result.fieldErrors.availabilityStatus);
});

test("normalization supports omitted optional mappings and rejects duplicate mappings", () => {
  const [result] = normalizeImportRows(
    [{ rowNumber: 2, values: ["Product"] }],
    { title: 0 },
  );
  assert.equal(result.status, "valid");
  assert.equal(result.values.priceMode, "request");
  assert.equal(result.values.availabilityStatus, "in_stock");

  assert.throws(
    () => normalizeImportRows([{ rowNumber: 2, values: ["Product"] }], { title: 0, price: 0 }),
    /different columns/i,
  );
});
