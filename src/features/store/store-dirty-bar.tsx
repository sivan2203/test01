import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type StoreDirtyBarProps = {
  dirty: boolean;
  pending: boolean;
  onDiscard: () => void;
  className?: string;
};

export function StoreDirtyBar({
  dirty,
  pending,
  onDiscard,
  className,
}: StoreDirtyBarProps) {
  if (!dirty) return null;

  return (
    <div
      className={cn(
        "fixed inset-x-4 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-30 flex flex-col gap-3 rounded-lg border border-foreground/15 bg-surface-inverse p-3 text-white shadow-[0_12px_32px_rgb(23_23_22/0.16)] sm:flex-row sm:items-center sm:justify-between lg:bottom-4 lg:left-[17rem] lg:right-10",
        className,
      )}
      data-store-dirty-bar
    >
      <div>
        <p className="text-sm font-semibold">Есть несохранённые изменения</p>
        <p className="mt-0.5 text-xs text-white/70">
          Предпросмотр уже показывает локальную версию.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:flex">
        <Button
          disabled={pending}
          onClick={onDiscard}
          type="button"
          variant="secondary"
        >
          Отменить
        </Button>
        <Button
          className="border-button-primary-foreground"
          disabled={pending}
          type="submit"
        >
          {pending ? "Сохраняем…" : "Сохранить"}
        </Button>
      </div>
    </div>
  );
}
