import {
  normalizeImportMapping,
  type ImportColumnMapping,
} from "./import-contract.ts";
import type {
  ProductDraftFieldErrors,
  ProductDraftValues,
} from "../product/schema.ts";
import { validateProductDraftValues } from "../product/schema.ts";
import type { ImportPreviewRow } from "./import-parser.ts";

export type NormalizedImportRow = {
  rowNumber: number;
  status: "valid" | "invalid";
  values: ProductDraftValues;
  fieldErrors: ProductDraftFieldErrors;
};

function getMappedValue(
  row: ImportPreviewRow,
  mapping: ImportColumnMapping,
  field: keyof ImportColumnMapping,
) {
  const index = mapping[field];
  return index === null || index === undefined ? "" : row.values[index] ?? "";
}

function normalizePriceInput(value: string) {
  const compact = value.trim().replace(/[\s\u00a0]/g, "");
  if (!compact) return "";
  if (compact.includes(",") && compact.includes(".")) {
    return compact.replace(/\./g, "").replace(",", ".");
  }
  return compact.replace(",", ".");
}

function isRequestPrice(value: string) {
  return ["", "request", "по запросу", "по-запросу", "по_запросу"].includes(
    value.trim().toLocaleLowerCase("ru-RU"),
  );
}

function normalizeAvailability(value: string) {
  const normalized = value.trim().toLocaleLowerCase("ru-RU");
  if (!normalized) return "in_stock";
  if (["in_stock", "in stock", "available", "есть", "в наличии", "да", "yes"].includes(normalized)) {
    return "in_stock";
  }
  if (["out_of_stock", "out of stock", "unavailable", "нет", "нет в наличии", "no"].includes(normalized)) {
    return "out_of_stock";
  }
  return normalized;
}

function getDraftValues(
  row: ImportPreviewRow,
  mapping: ImportColumnMapping,
): ProductDraftValues {
  const priceInput = getMappedValue(row, mapping, "price");
  const priceMode = isRequestPrice(priceInput) ? "request" : "fixed";

  return {
    title: getMappedValue(row, mapping, "title"),
    priceMode,
    priceAmount: priceMode === "fixed" ? normalizePriceInput(priceInput) : "",
    description: getMappedValue(row, mapping, "description"),
    availabilityStatus: normalizeAvailability(
      getMappedValue(row, mapping, "availability"),
    ) as ProductDraftValues["availabilityStatus"],
  };
}

export function normalizeImportRows(
  rows: readonly ImportPreviewRow[],
  mapping: ImportColumnMapping,
): NormalizedImportRow[] {
  const columnCount = Math.max(
    1,
    ...rows.map((row) => row.values.length),
    ...Object.values(mapping).map((value) => (value ?? 0) + 1),
  );
  const normalizedMapping = normalizeImportMapping(mapping, columnCount);

  return rows.map((row) => {
    const values = getDraftValues(row, normalizedMapping);
    const validation = validateProductDraftValues(values);

    return {
      rowNumber: row.rowNumber,
      status: validation.isValid ? "valid" : "invalid",
      values: validation.values,
      fieldErrors: validation.fieldErrors,
    };
  });
}
