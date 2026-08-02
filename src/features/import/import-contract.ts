export const IMPORT_MAX_FILE_BYTES = 5 * 1024 * 1024;
export const IMPORT_MAX_ROWS = 100;
export const IMPORT_MAX_COLUMNS = 16;
export const IMPORT_MAX_PREVIEW_ROWS = 10;
export const IMPORT_MAX_CELL_LENGTH = 500;
export const IMPORT_MAX_SOURCE_ROWS = 10_000;
export const IMPORT_MAX_WORKSHEETS = 16;
export const IMPORT_MAX_XLSX_ARCHIVE_ENTRIES = 200;
export const IMPORT_MAX_XLSX_UNCOMPRESSED_BYTES = 20 * 1024 * 1024;
export const IMPORT_MAX_SUBMISSION_CHARS = 6 * 1024 * 1024;

export const IMPORT_FORMATS = ["csv", "xls", "xlsx"] as const;
export type ImportFormat = (typeof IMPORT_FORMATS)[number];

export const IMPORT_TARGET_FIELDS = [
  "title",
  "price",
  "description",
  "availability",
] as const;
export type ImportTargetField = (typeof IMPORT_TARGET_FIELDS)[number];

export type ImportColumnMapping = Partial<
  Record<ImportTargetField, number | null>
>;

export type ImportRowResult = {
  rowNumber: number;
  status: "invalid" | "created" | "failed";
  fieldErrors: Record<string, string>;
  productId?: string;
};

export type ImportResult = {
  batchId: string;
  createdCount: number;
  rejectedCount: number;
  failedCount: number;
  rows: ImportRowResult[];
};

const headerAliases: Record<ImportTargetField, readonly string[]> = {
  title: [
    "title",
    "name",
    "product",
    "product name",
    "наименование",
    "название",
    "товар",
  ],
  price: ["price", "cost", "amount", "цена", "стоимость"],
  description: ["description", "details", "описание"],
  availability: [
    "availability",
    "available",
    "stock",
    "in stock",
    "наличие",
    "остаток",
    "статус",
  ],
};

function normalizeHeader(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("ru-RU")
    .replace(/[\u0000-\u001f]/g, "")
    .replace(/[_.-]+/g, " ")
    .replace(/\s+/g, " ");
}

export function getImportFormat(
  fileName: string,
  mimeType?: string,
): ImportFormat | null {
  const extension = fileName.trim().toLocaleLowerCase("en-US").split(".").pop();
  if (IMPORT_FORMATS.includes(extension as ImportFormat)) {
    return extension as ImportFormat;
  }

  const mimeToFormat: Record<string, ImportFormat> = {
    "text/csv": "csv",
    "application/vnd.ms-excel": "xls",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  };
  return mimeType ? mimeToFormat[mimeType.toLocaleLowerCase("en-US")] ?? null : null;
}

export function inferImportMapping(headers: readonly string[]): ImportColumnMapping {
  const mapping: ImportColumnMapping = {};

  for (const field of IMPORT_TARGET_FIELDS) {
    const aliases = new Set(headerAliases[field]);
    const index = headers.findIndex((header) => aliases.has(normalizeHeader(header)));
    if (index >= 0) mapping[field] = index;
  }

  return mapping;
}

export function normalizeImportMapping(
  mapping: ImportColumnMapping,
  columnCount: number,
): ImportColumnMapping {
  if (!Number.isInteger(columnCount) || columnCount <= 0) {
    throw new Error("Column count must be a positive integer.");
  }

  const normalized: ImportColumnMapping = {};
  const usedColumns = new Set<number>();

  for (const field of IMPORT_TARGET_FIELDS) {
    const value = mapping[field];
    if (value === null || value === undefined) continue;
    if (!Number.isInteger(value) || value < 0 || value >= columnCount) {
      throw new Error(`Mapped column for ${field} is outside the available columns.`);
    }
    if (usedColumns.has(value)) {
      throw new Error("Each mapped field must use different columns.");
    }
    usedColumns.add(value);
    normalized[field] = value;
  }

  return normalized;
}
