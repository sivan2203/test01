"use client";

import { useActionState, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  getImportFormat,
  normalizeImportMapping,
  IMPORT_MAX_COLUMNS,
  IMPORT_MAX_FILE_BYTES,
  IMPORT_MAX_ROWS,
  IMPORT_MAX_SOURCE_ROWS,
  IMPORT_MAX_WORKSHEETS,
  type ImportColumnMapping,
  type ImportTargetField,
} from "./import-contract";
import { importProductDrafts, type ImportActionState } from "./actions";
import { parseImportFile, type ImportPreview } from "./import-parser";

const targetLabels: Record<ImportTargetField, string> = {
  title: "Название товара",
  price: "Цена или «по запросу»",
  description: "Описание",
  availability: "Наличие",
};

const targetFields: ImportTargetField[] = [
  "title",
  "price",
  "description",
  "availability",
];

const initialImportActionState: ImportActionState = {
  status: "idle",
  message: "",
};

function formatBytes(bytes: number) {
  return `${Math.round(bytes / 1024 / 1024)} МБ`;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Не удалось прочитать файл.";
}

export function ImportProductFlow() {
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [mapping, setMapping] = useState<ImportColumnMapping>({});
  const [parseError, setParseError] = useState("");
  const [mappingError, setMappingError] = useState("");
  const [idempotencyKey, setIdempotencyKey] = useState<string | null>(null);
  const selectionVersion = useRef(0);
  const [state, formAction, isPending] = useActionState(
    importProductDrafts,
    initialImportActionState,
  );

  async function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    const currentSelection = selectionVersion.current + 1;
    selectionVersion.current = currentSelection;
    setPreview(null);
    setSelectedFileName("");
    setMapping({});
    setMappingError("");
    setParseError("");
    setIdempotencyKey(null);
    if (!file) return;

    if (file.size > IMPORT_MAX_FILE_BYTES) {
      setParseError(`Файл слишком большой. Максимальный размер — ${formatBytes(IMPORT_MAX_FILE_BYTES)}.`);
      return;
    }
    if (!getImportFormat(file.name, file.type)) {
      setParseError("Поддерживаются только CSV, XLS и XLSX.");
      return;
    }

    try {
      const nextPreview = parseImportFile(file.name, await file.arrayBuffer());
      if (currentSelection !== selectionVersion.current) return;
      setPreview(nextPreview);
      setSelectedFileName(file.name);
      setMapping(nextPreview.inferredMapping);
      setIdempotencyKey(crypto.randomUUID());
    } catch (error) {
      if (currentSelection !== selectionVersion.current) return;
      setParseError(errorMessage(error));
    }
  }

  function updateMapping(field: ImportTargetField, value: string) {
    if (!preview) return;
    const nextMapping = { ...mapping, [field]: value === "" ? null : Number(value) };
    try {
      setMapping(normalizeImportMapping(nextMapping, preview.headers.length));
      setMappingError("");
    } catch (error) {
      setMappingError(errorMessage(error));
    }
  }

  const payload = preview
    ? JSON.stringify({
        fileName: selectedFileName,
        format: preview.format,
        headers: preview.headers,
        mapping,
        rows: preview.rows,
        idempotencyKey,
      })
    : "";
  const mappedColumns = new Set(
    Object.values(mapping).filter((value): value is number => Number.isInteger(value)),
  );

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-2xl border border-border bg-surface-raised p-5">
        <h2 className="text-xl font-semibold">Импорт из Excel или CSV</h2>
        <p className="mt-3 text-sm leading-6 text-foreground/70">
          Импорт создаёт только черновики. Товары не публикуются автоматически: после импорта проверьте данные, добавьте фото и используйте обычный редактор товара.
        </p>
        <p className="mt-3 text-xs leading-5 text-foreground/60">
          Поддерживаются CSV, XLS и XLSX: до {formatBytes(IMPORT_MAX_FILE_BYTES)}, {IMPORT_MAX_ROWS} непустых строк и {IMPORT_MAX_COLUMNS} колонок. В файле может быть до {IMPORT_MAX_SOURCE_ROWS} строк с учётом пустых; для Excel используется только первый из максимум {IMPORT_MAX_WORKSHEETS} листов.
        </p>
        <label className="mt-5 flex min-h-11 cursor-pointer items-center justify-center rounded-full border border-border bg-background px-5 text-center text-sm font-medium transition-colors hover:bg-muted focus-within:outline-none focus-within:ring-2 focus-within:ring-ring">
          Выбрать файл
          <input
            accept=".csv,.xls,.xlsx,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="sr-only"
            onChange={onFileChange}
            type="file"
          />
        </label>
        {parseError ? (
          <p className="mt-4 text-sm leading-6 text-destructive" role="alert">{parseError}</p>
        ) : null}
      </section>

      {preview ? (
        <>
          <section className="rounded-2xl border border-border bg-glass p-5 shadow-sm backdrop-blur-xl motion-reduce:backdrop-blur-none forced-colors:backdrop-blur-none">
            <h2 className="text-xl font-semibold">Сопоставьте колонки</h2>
            <p className="mt-2 text-sm leading-6 text-foreground/70">
              Проверьте, какие колонки заполняют поля товара. Ненужные колонки не попадут в карточки.
            </p>
            <div className="mt-4 flex flex-col gap-3">
              {targetFields.map((field) => (
                <label className="flex flex-col gap-2 text-sm" key={field}>
                  <span className="font-medium">{targetLabels[field]}</span>
                  <select
                    className="min-h-11 rounded-xl border border-border bg-background px-3 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onChange={(event) => updateMapping(field, event.target.value)}
                    value={mapping[field] ?? ""}
                  >
                    <option value="">Не использовать</option>
                    {preview.headers.map((header, index) => (
                      <option key={`${index}-${header}`} value={index}>
                        {index + 1}. {header || "Без названия"}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
            {mappingError ? <p className="mt-3 text-sm text-destructive" role="alert">{mappingError}</p> : null}
            {mapping.title === undefined || mapping.title === null ? (
              <p className="mt-3 text-sm leading-6 text-foreground/70" role="status">
                Колонка названия не выбрана. Строки будут показаны как ошибки, пока вы не выберете её.
              </p>
            ) : null}
            <p className="mt-3 text-sm leading-6 text-foreground/70" role="status">
              В предпросмотре у каждой колонки указано, импортируется она или остаётся без сопоставления.
            </p>
          </section>

          <section className="rounded-2xl border border-border bg-glass p-5 shadow-sm backdrop-blur-xl motion-reduce:backdrop-blur-none forced-colors:backdrop-blur-none">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">Предпросмотр строк</h2>
                <p className="mt-2 text-sm text-foreground/70">
                  Показаны первые {Math.min(preview.previewRows.length, preview.rows.length)} строк из {preview.rows.length}.
                </p>
              </div>
              <span className="shrink-0 rounded-full border border-border px-3 py-1 text-xs text-foreground/70">
                {preview.format.toUpperCase()}
              </span>
            </div>
            <div className="mt-4 flex flex-col gap-3" aria-label="Предпросмотр импорта">
              {preview.previewRows.map((row) => (
                <article className="rounded-xl border border-border bg-background p-3" key={row.rowNumber}>
                  <p className="text-xs font-medium text-foreground/60">Строка {row.rowNumber}</p>
                  <dl className="mt-2 grid gap-2 text-sm">
                    {preview.headers.slice(0, IMPORT_MAX_COLUMNS).map((header, index) => (
                      <div className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] gap-3" key={`${row.rowNumber}-${index}`}>
                        <dt className="break-words text-foreground/60">
                          {header || `Колонка ${index + 1}`}
                          <span className="mt-1 block text-xs">
                            {mappedColumns.has(index) ? "Импортируется" : "Не импортируется"}
                          </span>
                        </dt>
                        <dd className="break-words">{row.values[index] || "—"}</dd>
                      </div>
                    ))}
                  </dl>
                </article>
              ))}
            </div>
          </section>

          <form action={formAction} className="flex flex-col gap-3">
            <input name="payload" type="hidden" value={payload} />
            <Button disabled={isPending || Boolean(mappingError) || !idempotencyKey || state.status === "success"} type="submit">
              {isPending ? "Создаём черновики…" : "Создать черновики"}
            </Button>
            {state.message ? (
              <p className="rounded-xl border border-border bg-surface-raised p-4 text-sm leading-6" role={state.status === "error" ? "alert" : "status"}>
                {state.message}
              </p>
            ) : null}
            {state.result ? (
              <section className="rounded-2xl border border-border bg-surface-raised p-5" aria-label="Результат импорта">
                <h2 className="font-semibold">Результат импорта</h2>
                <p className="mt-2 text-sm leading-6 text-foreground/70">
                  Создано черновиков: {state.result.createdCount}. Отклонено строк: {state.result.rejectedCount}. Ошибок сохранения: {state.result.failedCount}.
                </p>
                {state.result.rows.some((row) => row.status !== "created") ? (
                  <ul className="mt-3 flex flex-col gap-2 text-sm" aria-label="Ошибки строк">
                    {state.result.rows.filter((row) => row.status !== "created").map((row) => (
                      <li key={row.rowNumber}>
                        Строка {row.rowNumber}: {Object.values(row.fieldErrors).join(" ") || "Не удалось создать черновик."}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ) : null}
          </form>
        </>
      ) : null}
    </div>
  );
}
