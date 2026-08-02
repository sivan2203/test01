import * as XLSX from "xlsx";

import {
  getImportFormat,
  IMPORT_MAX_CELL_LENGTH,
  IMPORT_MAX_COLUMNS,
  IMPORT_MAX_FILE_BYTES,
  IMPORT_MAX_PREVIEW_ROWS,
  IMPORT_MAX_ROWS,
  IMPORT_MAX_SOURCE_ROWS,
  IMPORT_MAX_WORKSHEETS,
  IMPORT_MAX_XLSX_ARCHIVE_ENTRIES,
  IMPORT_MAX_XLSX_UNCOMPRESSED_BYTES,
  inferImportMapping,
  type ImportColumnMapping,
  type ImportFormat,
} from "./import-contract.ts";

export type ImportPreviewRow = {
  rowNumber: number;
  values: string[];
};

export type ImportPreview = {
  format: ImportFormat;
  worksheetName: string;
  headers: string[];
  rows: ImportPreviewRow[];
  previewRows: ImportPreviewRow[];
  inferredMapping: ImportColumnMapping;
};

function asBytes(input: ArrayBuffer | ArrayLike<number>) {
  return input instanceof ArrayBuffer ? new Uint8Array(input) : Uint8Array.from(input);
}

function detectCsvDelimiter(input: string) {
  const firstDataLine = input
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .find((line) => line.trim().length > 0) ?? "";
  const candidates = [",", ";", "\t"];
  const delimiterCount = (candidate: string) => {
    let count = 0;
    let insideQuotes = false;

    for (let index = 0; index < firstDataLine.length; index += 1) {
      const character = firstDataLine[index];
      if (character === '"') {
        if (insideQuotes && firstDataLine[index + 1] === '"') {
          index += 1;
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (!insideQuotes && character === candidate) {
        count += 1;
      }
    }

    return count;
  };

  return candidates.reduce((best, candidate) =>
    delimiterCount(candidate) > delimiterCount(best) ? candidate : best,
  );
}

function decodeCsv(bytes: Uint8Array) {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes).replace(/^\uFEFF/, "");
  } catch {
    throw new Error("CSV-файл должен быть сохранён в кодировке UTF-8.");
  }
}

function readZipUint32(bytes: Uint8Array, offset: number) {
  if (offset < 0 || offset + 4 > bytes.byteLength) {
    throw new Error("Excel-файл имеет повреждённую ZIP-структуру.");
  }
  return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(offset, true);
}

function readZipUint16(bytes: Uint8Array, offset: number) {
  if (offset < 0 || offset + 2 > bytes.byteLength) {
    throw new Error("Excel-файл имеет повреждённую ZIP-структуру.");
  }
  return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint16(offset, true);
}

function verifyXlsxArchiveBounds(bytes: Uint8Array) {
  const endOfCentralDirectory = 0x06054b50;
  const centralDirectoryEntry = 0x02014b50;
  const minimumOffset = Math.max(0, bytes.byteLength - 65_557);
  let directoryEndOffset = -1;

  for (let offset = bytes.byteLength - 22; offset >= minimumOffset; offset -= 1) {
    if (readZipUint32(bytes, offset) === endOfCentralDirectory) {
      directoryEndOffset = offset;
      break;
    }
  }

  if (directoryEndOffset < 0) {
    throw new Error("Excel-файл имеет неподдерживаемую ZIP-структуру.");
  }

  const entryCount = readZipUint16(bytes, directoryEndOffset + 10);
  const directorySize = readZipUint32(bytes, directoryEndOffset + 12);
  let entryOffset = readZipUint32(bytes, directoryEndOffset + 16);
  if (entryCount > IMPORT_MAX_XLSX_ARCHIVE_ENTRIES || entryOffset + directorySize > bytes.byteLength) {
    throw new Error("Excel-файл содержит слишком много данных для безопасного импорта.");
  }

  let totalUncompressedBytes = 0;
  for (let index = 0; index < entryCount; index += 1) {
    if (readZipUint32(bytes, entryOffset) !== centralDirectoryEntry) {
      throw new Error("Excel-файл имеет повреждённую ZIP-структуру.");
    }
    const compressedSize = readZipUint32(bytes, entryOffset + 20);
    const uncompressedSize = readZipUint32(bytes, entryOffset + 24);
    const fileNameLength = readZipUint16(bytes, entryOffset + 28);
    const extraLength = readZipUint16(bytes, entryOffset + 30);
    const commentLength = readZipUint16(bytes, entryOffset + 32);
    if (compressedSize === 0xffffffff || uncompressedSize === 0xffffffff) {
      throw new Error("Excel-файлы ZIP64 пока не поддерживаются.");
    }
    totalUncompressedBytes += uncompressedSize;
    if (totalUncompressedBytes > IMPORT_MAX_XLSX_UNCOMPRESSED_BYTES) {
      throw new Error("Excel-файл распаковывается в слишком большой объём данных.");
    }
    entryOffset += 46 + fileNameLength + extraLength + commentLength;
  }
}

function cellToString(value: unknown) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") {
    if (value.length > IMPORT_MAX_CELL_LENGTH) {
      throw new Error(`Cell value exceeds ${IMPORT_MAX_CELL_LENGTH} characters.`);
    }
    return value;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  throw new Error("The workbook contains an unsupported cell value.");
}

function isBlankRow(values: readonly string[]) {
  return values.every((value) => value.trim().length === 0);
}

export function parseImportFile(
  fileName: string,
  input: ArrayBuffer | ArrayLike<number>,
): ImportPreview {
  const format = getImportFormat(fileName);
  if (!format) throw new Error("Поддерживаются только файлы CSV, XLS и XLSX.");

  const bytes = asBytes(input);
  const byteLength = bytes.byteLength;
  if (byteLength === 0) throw new Error("Выбранный файл пуст.");
  if (byteLength > IMPORT_MAX_FILE_BYTES) {
    throw new Error("Размер файла превышает допустимый лимит.");
  }

  if (format === "xlsx") verifyXlsxArchiveBounds(bytes);

  const csvText = format === "csv" ? decodeCsv(bytes) : null;

  const options =
    format === "csv"
      ? {
          type: "string" as const,
          FS: detectCsvDelimiter(csvText ?? ""),
          raw: false,
        }
      : { type: "array" as const, raw: false };
  const workbook = XLSX.read(
    format === "csv"
      ? csvText ?? ""
      : bytes,
    { ...options, bookVBA: true },
  );
  if (workbook.vbaraw) {
    throw new Error("Макросы в импортируемых книгах не поддерживаются.");
  }
  if (workbook.SheetNames.length > IMPORT_MAX_WORKSHEETS) {
    throw new Error(`В Excel-файле должно быть не больше ${IMPORT_MAX_WORKSHEETS} листов.`);
  }
  const worksheetName = workbook.SheetNames[0];
  if (!worksheetName) throw new Error("В файле не найден первый лист с данными.");

  const worksheet = workbook.Sheets[worksheetName];
  const formulaCell = Object.entries(worksheet).find(([key, cell]) =>
    !key.startsWith("!") &&
    typeof cell === "object" &&
    cell !== null &&
    "f" in cell,
  );
  if (formulaCell) {
    throw new Error("Формулы в импортируемых книгах не поддерживаются.");
  }
  const sourceRange = worksheet["!ref"];
  if (sourceRange && XLSX.utils.decode_range(sourceRange).e.r > IMPORT_MAX_SOURCE_ROWS) {
    throw new Error(`В файле слишком много строк до последней записи. Допустимо до ${IMPORT_MAX_SOURCE_ROWS}.`);
  }
  const table = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
    header: 1,
    raw: false,
    defval: "",
    blankrows: true,
  });
  if (table.length === 0) throw new Error("В файле не найдена строка заголовков.");

  const headers = table[0].map(cellToString);
  if (headers.length === 0 || isBlankRow(headers)) {
    throw new Error("Строка заголовков пуста или не подходит для импорта.");
  }
  if (headers.length > IMPORT_MAX_COLUMNS) {
    throw new Error(`В файле должно быть не больше ${IMPORT_MAX_COLUMNS} колонок.`);
  }

  const rows = table
    .slice(1)
    .map((row, index) => ({
      rowNumber: index + 2,
      values: Array.from({ length: headers.length }, (_, columnIndex) =>
        cellToString(row[columnIndex]),
      ),
    }))
    .filter((row) => !isBlankRow(row.values));

  if (rows.length > IMPORT_MAX_ROWS) {
    throw new Error(`В файле должно быть не больше ${IMPORT_MAX_ROWS} непустых строк с товарами.`);
  }

  return {
    format,
    worksheetName,
    headers,
    rows,
    previewRows: rows.slice(0, IMPORT_MAX_PREVIEW_ROWS),
    inferredMapping: inferImportMapping(headers),
  };
}
