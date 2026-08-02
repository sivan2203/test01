import assert from "node:assert/strict";
import test from "node:test";

import * as XLSX from "xlsx";

import { parseImportFile } from "../src/features/import/import-parser.ts";
import {
  IMPORT_MAX_COLUMNS,
  IMPORT_MAX_ROWS,
} from "../src/features/import/import-contract.ts";

test("parser handles UTF-8 BOM CSV and preserves source row numbers", () => {
  const csv = "\ufeffНаименование;Цена;Описание\nЧайник;1 250,50;Стальной\n\nЧашка;по запросу;";
  const preview = parseImportFile("catalog.csv", new TextEncoder().encode(csv));

  assert.equal(preview.format, "csv");
  assert.equal(preview.headers[0], "Наименование");
  assert.equal(preview.rows.length, 2);
  assert.deepEqual(preview.rows[0], {
    rowNumber: 2,
    values: ["Чайник", "1 250,50", "Стальной"],
  });
  assert.deepEqual(preview.rows[1], {
    rowNumber: 4,
    values: ["Чашка", "по запросу", ""],
  });
});

test("parser reads only the first Excel worksheet and returns a bounded preview", () => {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.aoa_to_sheet([
      ["Title", "Price"],
      ["First", 10],
    ]),
    "Products",
  );
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.aoa_to_sheet([["Title"], ["Should not be read"]]),
    "Second",
  );

  const preview = parseImportFile(
    "catalog.xlsx",
    XLSX.write(workbook, { type: "array", bookType: "xlsx" }),
  );

  assert.equal(preview.format, "xlsx");
  assert.equal(preview.worksheetName, "Products");
  assert.deepEqual(preview.rows[0].values, ["First", "10"]);
});

test("parser rejects unsupported, empty, oversized, and too-wide files", () => {
  assert.throws(() => parseImportFile("catalog.pdf", new Uint8Array([1])), /CSV|XLS/i);
  assert.throws(() => parseImportFile("catalog.xlsm", new Uint8Array([1])), /CSV|XLS/i);
  assert.throws(() => parseImportFile("catalog.csv", new Uint8Array()), /пуст/i);

  const tooManyColumns = Array.from(
    { length: IMPORT_MAX_COLUMNS + 1 },
    (_, index) => `Column ${index}`,
  ).join(",");
  assert.throws(
    () => parseImportFile("catalog.csv", new TextEncoder().encode(tooManyColumns)),
    /колонок/i,
  );

  const tooManyRows = ["Title", ...Array.from({ length: IMPORT_MAX_ROWS + 1 }, (_, index) => `Product ${index}`)].join("\n");
  assert.throws(
    () => parseImportFile("catalog.csv", new TextEncoder().encode(tooManyRows)),
    /строк/i,
  );
});

test("parser keeps quoted delimiters in CSV cells and rejects invalid UTF-8", () => {
  const preview = parseImportFile(
    "catalog.csv",
    new TextEncoder().encode('"Name; extended",Price\n"Kettle; steel",1250'),
  );

  assert.deepEqual(preview.headers, ["Name; extended", "Price"]);
  assert.deepEqual(preview.rows[0]?.values, ["Kettle; steel", "1250"]);
  assert.throws(
    () => parseImportFile("catalog.csv", new Uint8Array([0xff])),
    /UTF-8/i,
  );
});

test("parser rejects formula cells instead of evaluating workbook logic", () => {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.aoa_to_sheet([
      ["Title", "Price"],
      ["Formula product", { f: "1+1", v: 2 }],
    ]),
    "Products",
  );

  assert.throws(
    () => parseImportFile("catalog.xlsx", XLSX.write(workbook, { type: "array", bookType: "xlsx" })),
    /formula|формул/i,
  );
});
