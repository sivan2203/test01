"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

import { cn } from "@/lib/utils";

type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  actions: ReactNode;
  className?: string;
  initialFocus?: "action" | "title";
  fallbackFocusId?: string;
};

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  actions,
  className,
  initialFocus = "action",
  fallbackFocusId,
}: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      restoreFocusRef.current = document.activeElement as HTMLElement | null;
      dialog.showModal();
      requestAnimationFrame(() => {
        const focusTarget =
          initialFocus === "title"
            ? dialog.querySelector<HTMLElement>(`#${CSS.escape(titleId)}`)
            : dialog.querySelector<HTMLElement>("[data-dialog-initial-focus]");
        focusTarget?.focus();
      });
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [initialFocus, open, titleId]);

  useEffect(() => () => dialogRef.current?.close(), []);

  return (
    <dialog
      aria-describedby={description ? descriptionId : undefined}
      aria-labelledby={titleId}
      className={cn(
        "m-auto w-[min(30rem,calc(100%-2rem))] rounded-lg border border-border-strong bg-surface-raised p-0 text-foreground shadow-[0_18px_48px_rgb(23_23_22/0.18)]",
        className,
      )}
      onCancel={(event) => {
        event.preventDefault();
        onOpenChange(false);
      }}
      onClose={(event) => {
        const closedDialog = event.currentTarget;
        const restoreTarget = restoreFocusRef.current;
        restoreFocusRef.current = null;
        requestAnimationFrame(() => {
          const activeElement = document.activeElement as HTMLElement | null;
          const focusWasMoved =
            activeElement !== null &&
            activeElement !== document.body &&
            activeElement !== closedDialog &&
            !closedDialog.contains(activeElement);
          if (focusWasMoved) return;

          const targetIsAvailable =
            restoreTarget?.isConnected &&
            !restoreTarget.matches(":disabled, [aria-disabled='true']");
          const focusTarget = targetIsAvailable
            ? restoreTarget
            : fallbackFocusId
              ? document.getElementById(fallbackFocusId)
              : document.querySelector<HTMLElement>("#main-content");
          focusTarget?.focus();
        });
      }}
      ref={dialogRef}
    >
      <div className="border-b border-border px-5 py-4">
        <h2
          className="text-xl font-semibold tracking-tight outline-none"
          id={titleId}
          tabIndex={initialFocus === "title" ? -1 : undefined}
        >
          {title}
        </h2>
      </div>
      {description ? (
        <div className="px-5 pt-4 text-sm leading-6 text-ink-secondary" id={descriptionId}>
          {description}
        </div>
      ) : null}
      {children ? <div className="px-5 pt-4">{children}</div> : null}
      <div className="flex flex-col-reverse gap-2 px-5 py-5 sm:flex-row sm:justify-end">
        {actions}
      </div>
    </dialog>
  );
}
