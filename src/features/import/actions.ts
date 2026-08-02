"use server";

import { revalidatePath } from "next/cache";

import { getCurrentSellerStoreForProducts } from "@/features/product/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getImportFormat,
  IMPORT_MAX_CELL_LENGTH,
  IMPORT_MAX_COLUMNS,
  IMPORT_MAX_ROWS,
  IMPORT_MAX_SOURCE_ROWS,
  IMPORT_MAX_SUBMISSION_CHARS,
  normalizeImportMapping,
  type ImportColumnMapping,
  type ImportFormat,
  type ImportResult,
} from "./import-contract.ts";
import { normalizeImportRows } from "./import-normalization.ts";
import type { ImportPreviewRow } from "./import-parser.ts";

export type ImportActionState = {
  status: "idle" | "success" | "error";
  message: string;
  result?: ImportResult;
};

type ImportSubmission = {
  fileName: string;
  format: ImportFormat;
  headers: string[];
  mapping: ImportColumnMapping;
  rows: ImportPreviewRow[];
  idempotencyKey: string;
};

type PersistedImportRow = {
  batch_id: string;
  row_number: number;
  outcome: ImportResult["rows"][number]["status"];
  field_errors: unknown;
  product_id: string | null;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function actionError(message: string): ImportActionState {
  return { status: "error", message };
}

function parseSubmission(formData: FormData): ImportSubmission {
  const rawPayload = formData.get("payload");
  if (
    typeof rawPayload !== "string" ||
    rawPayload.length > IMPORT_MAX_SUBMISSION_CHARS
  ) {
    throw new Error("Импорт не содержит корректных данных для обработки.");
  }

  let payload: Partial<ImportSubmission>;
  try {
    payload = JSON.parse(rawPayload) as Partial<ImportSubmission>;
  } catch {
    throw new Error("Не удалось прочитать данные импорта. Выберите файл ещё раз.");
  }

  const fileName = typeof payload.fileName === "string" ? payload.fileName : "";
  const format = getImportFormat(fileName);
  if (!format || payload.format !== format) {
    throw new Error("Формат файла больше не поддерживается. Выберите CSV или Excel.");
  }
  if (
    !Array.isArray(payload.headers) ||
    payload.headers.length === 0 ||
    payload.headers.length > IMPORT_MAX_COLUMNS
  ) {
    throw new Error(`В импорте должно быть от 1 до ${IMPORT_MAX_COLUMNS} колонок.`);
  }
  if (
    !payload.headers.every(
      (header) =>
        typeof header === "string" && header.length <= IMPORT_MAX_CELL_LENGTH,
    )
  ) {
    throw new Error("Название колонки слишком длинное.");
  }
  if (
    !Array.isArray(payload.rows) ||
    payload.rows.length === 0 ||
    payload.rows.length > IMPORT_MAX_ROWS
  ) {
    throw new Error(`В импорте должно быть от 1 до ${IMPORT_MAX_ROWS} непустых строк.`);
  }
  if (
    !payload.rows.every(
      (row) =>
        row &&
        Number.isInteger(row.rowNumber) &&
        row.rowNumber >= 2 &&
        row.rowNumber <= IMPORT_MAX_SOURCE_ROWS + 1 &&
        Array.isArray(row.values) &&
        row.values.length <= IMPORT_MAX_COLUMNS &&
        row.values.every(
          (value) =>
            typeof value === "string" &&
            value.length <= IMPORT_MAX_CELL_LENGTH,
        ),
    )
  ) {
    throw new Error("Строки импорта имеют неподдерживаемый формат.");
  }
  const rowNumbers = payload.rows.map((row) => row.rowNumber);
  if (new Set(rowNumbers).size !== rowNumbers.length) {
    throw new Error("В импорте обнаружены повторяющиеся номера строк.");
  }
  if (!payload.mapping || typeof payload.mapping !== "object") {
    throw new Error("Не удалось прочитать сопоставление колонок.");
  }
  const mapping = normalizeImportMapping(payload.mapping, payload.headers.length);
  const idempotencyKey =
    typeof payload.idempotencyKey === "string" ? payload.idempotencyKey : "";
  if (!UUID_PATTERN.test(idempotencyKey)) {
    throw new Error("Обновите страницу и выберите файл заново перед импортом.");
  }

  return {
    fileName: fileName.split(/[\\/]/).pop()?.slice(0, 160) ?? "catalog",
    format,
    headers: payload.headers,
    mapping,
    rows: payload.rows,
    idempotencyKey,
  };
}

function rowErrorsToRecord(fieldErrors: Record<string, string | undefined>) {
  return Object.fromEntries(
    Object.entries(fieldErrors).filter(([, message]) => typeof message === "string"),
  ) as Record<string, string>;
}

function persistedFieldErrors(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter(([, message]) => typeof message === "string"),
  ) as Record<string, string>;
}

export async function importProductDrafts(
  _previousState: ImportActionState,
  formData: FormData,
): Promise<ImportActionState> {
  let submission: ImportSubmission;
  try {
    submission = parseSubmission(formData);
  } catch (error) {
    return actionError(
      error instanceof Error ? error.message : "Не удалось проверить импорт.",
    );
  }

  const normalizedRows = normalizeImportRows(submission.rows, submission.mapping);
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return actionError("Войдите в кабинет продавца, чтобы импортировать товары.");
  }

  const storeResult = await getCurrentSellerStoreForProducts(supabase, user.id);
  if (storeResult.status !== "found") {
    return actionError(
      storeResult.status === "store_not_found"
        ? "Сначала создайте витрину, затем импортируйте товары."
        : "Не удалось определить вашу витрину. Попробуйте ещё раз.",
    );
  }

  const { data, error } = await supabase
    .rpc("import_product_drafts", {
      p_store_id: storeResult.storeId,
      p_source_filename: submission.fileName,
      p_source_format: submission.format,
      p_column_mapping: submission.mapping,
      p_source_headers: submission.headers,
      p_idempotency_key: submission.idempotencyKey,
      p_rows: normalizedRows.map((row) => ({
        rowNumber: row.rowNumber,
        status: row.status,
        values: row.values,
        fieldErrors: rowErrorsToRecord(row.fieldErrors),
      })),
    })
    .returns<PersistedImportRow[]>();

  const persistedRows = data as unknown as PersistedImportRow[] | null;
  if (error || !persistedRows || persistedRows.length !== normalizedRows.length) {
    return actionError(
      "Не удалось сохранить импорт целиком. Ничего не создано — попробуйте ещё раз.",
    );
  }

  const rowResults: ImportResult["rows"] = persistedRows.map((row) => ({
    rowNumber: row.row_number,
    status: row.outcome,
    fieldErrors: persistedFieldErrors(row.field_errors),
    ...(row.product_id ? { productId: row.product_id } : {}),
  }));
  const createdCount = rowResults.filter((row) => row.status === "created").length;
  const rejectedCount = rowResults.filter((row) => row.status === "invalid").length;
  const failedCount = rowResults.filter((row) => row.status === "failed").length;
  const batchId = persistedRows[0]?.batch_id;

  if (!batchId) {
    return actionError(
      "Импорт сохранён без идентификатора результата. Обновите страницу и проверьте черновики.",
    );
  }

  if (createdCount > 0) revalidatePath("/seller/products");
  const result: ImportResult = {
    batchId,
    createdCount,
    rejectedCount,
    failedCount,
    rows: rowResults,
  };

  if (failedCount > 0) {
    return {
      status: "error",
      message:
        "Часть строк не сохранилась. Исправьте их и повторите импорт после выбора файла заново.",
      result,
    };
  }

  return {
    status: "success",
    message: `Создано черновиков: ${createdCount}. Откройте список товаров, чтобы добавить фото и проверить публикацию.`,
    result,
  };
}
