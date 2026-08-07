"use client";

import { useActionState, useRef, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { fieldControlClassName } from "@/components/ui/field";
import { StatusBadge } from "@/components/ui/status-badge";
import { StatusMessage } from "@/components/ui/status-message";
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
  const [parsing, setParsing] = useState(false);
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

    setParsing(true);
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
    } finally {
      if (currentSelection === selectionVersion.current) setParsing(false);
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
    <div className="flex flex-col gap-8">
      <section aria-busy={parsing} className="border-t border-border pt-6" aria-labelledby="import-source-title">
        <p className="font-mono text-xs text-primary">ШАГ 01 / ФАЙЛ</p>
        <h2 className="mt-2 text-xl font-semibold" id="import-source-title">Импорт из Excel или CSV</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-ink-secondary">
          Импорт создаёт только черновики. Товары не публикуются автоматически: после импорта проверьте данные, добавьте фото и используйте обычный редактор товара.
        </p>
        <p className="mt-3 max-w-3xl text-xs leading-5 text-ink-secondary" id="import-source-constraints">
          Поддерживаются CSV, XLS и XLSX: до {formatBytes(IMPORT_MAX_FILE_BYTES)}, {IMPORT_MAX_ROWS} непустых строк и {IMPORT_MAX_COLUMNS} колонок. В файле может быть до {IMPORT_MAX_SOURCE_ROWS} строк с учётом пустых; для Excel используется только первый из максимум {IMPORT_MAX_WORKSHEETS} листов.
        </p>
        <label aria-disabled={parsing} className="mt-5 inline-flex min-h-11 cursor-pointer items-center justify-center rounded-md border border-border-strong bg-surface-raised px-5 text-center text-sm font-semibold transition-colors hover:bg-surface-muted focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
          {parsing ? "Читаем файл…" : "Выбрать файл"}
          <input
            accept=".csv,.xls,.xlsx,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            aria-describedby="import-source-constraints import-file-status"
            className="sr-only"
            disabled={parsing}
            onChange={onFileChange}
            type="file"
          />
        </label>
        <p
          aria-live="polite"
          className={parsing || (selectedFileName && preview) ? "mt-3 text-sm text-ink-secondary" : "sr-only"}
          id="import-file-status"
          role="status"
        >
          {parsing
            ? "Читаем и проверяем выбранный файл."
            : selectedFileName && preview
              ? <>Файл <strong className="break-all text-foreground">{selectedFileName}</strong> прочитан. Найдено строк: {preview.rows.length}. Перейдите к сопоставлению колонок.</>
              : ""}
        </p>
        <StatusMessage className="mt-4" error>{parseError}</StatusMessage>
      </section>

      {preview ? (
        <>
          <section className="border-t border-border pt-6" aria-labelledby="import-mapping-title">
            <p className="font-mono text-xs text-primary">ШАГ 02 / ПОЛЯ</p>
            <h2 className="mt-2 text-xl font-semibold" id="import-mapping-title">Сопоставьте колонки</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-secondary">
              Проверьте, какие колонки заполняют поля товара. Ненужные колонки не попадут в карточки.
            </p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {targetFields.map((field) => (
                <label className="flex flex-col gap-2 text-sm" key={field}>
                  <span className="font-semibold">{targetLabels[field]}</span>
                  <select
                    className={fieldControlClassName}
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
            <StatusMessage className="mt-3" error>{mappingError}</StatusMessage>
            {mapping.title === undefined || mapping.title === null ? (
              <Alert className="mt-4" tone="warning">
                Колонка названия не выбрана. Строки будут показаны как ошибки, пока вы не выберете её.
              </Alert>
            ) : null}
            <p className="mt-3 text-sm leading-6 text-ink-secondary" role="status">
              В предпросмотре у каждой колонки указано, импортируется она или остаётся без сопоставления.
            </p>
          </section>

          <section className="border-t border-border pt-6" aria-labelledby="import-preview-title">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-xs text-primary">ШАГ 03 / ПРОВЕРКА</p>
                <h2 className="mt-2 text-xl font-semibold" id="import-preview-title">Предпросмотр строк</h2>
                <p className="mt-2 text-sm text-ink-secondary">
                  Показаны первые {Math.min(preview.previewRows.length, preview.rows.length)} строк из {preview.rows.length}.
                </p>
              </div>
              <StatusBadge>{preview.format.toUpperCase()}</StatusBadge>
            </div>
            <div className="mt-4 overflow-x-auto border border-border" aria-label="Предпросмотр импорта" tabIndex={0}>
              {preview.previewRows.map((row) => (
                <article className="border-b border-border bg-surface-raised p-4 last:border-b-0" key={row.rowNumber}>
                  <p className="font-mono text-xs text-ink-secondary">СТРОКА {row.rowNumber}</p>
                  <dl className="mt-2 grid gap-2 text-sm">
                    {preview.headers.slice(0, IMPORT_MAX_COLUMNS).map((header, index) => (
                      <div className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] gap-3" key={`${row.rowNumber}-${index}`}>
                        <dt className="break-words text-ink-secondary">
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

          <form action={formAction} className="flex flex-col gap-3 border-t border-border pt-6">
            <input name="payload" type="hidden" value={payload} />
            <Button className="w-full sm:w-fit" disabled={isPending || Boolean(mappingError) || !idempotencyKey || state.status === "success"} type="submit">
              {isPending ? "Создаём черновики…" : "Создать черновики"}
            </Button>
            <StatusMessage error={state.status === "error"}>{state.message}</StatusMessage>
            {state.result ? (
              <section className="rounded-lg border border-border bg-surface-raised p-5" aria-label="Результат импорта">
                <h2 className="font-semibold">Результат импорта</h2>
                <p className="mt-2 text-sm leading-6 text-ink-secondary">
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
