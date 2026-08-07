"use client";

import { useEffect, useRef, type MouseEvent } from "react";

type ErrorSummaryProps = {
  title?: string;
  errors: Array<{ id: string; message: string }>;
  focusKey?: string | number;
};

export function ErrorSummary({
  title = "Проверьте заполнение",
  errors,
  focusKey,
}: ErrorSummaryProps) {
  const summaryRef = useRef<HTMLDivElement>(null);

  function focusErrorTarget(event: MouseEvent<HTMLAnchorElement>, id: string) {
    const target = document.getElementById(id);
    if (!target) return;

    event.preventDefault();
    const nestedControl = target.querySelector<HTMLElement>(
      "input:not(:disabled), select:not(:disabled), textarea:not(:disabled), button:not(:disabled), a[href], [tabindex]:not([tabindex='-1'])",
    );
    const focusTarget = nestedControl ?? target;
    if (!nestedControl && !focusTarget.hasAttribute("tabindex")) {
      focusTarget.setAttribute("tabindex", "-1");
    }
    focusTarget.focus({ preventScroll: true });
    focusTarget.scrollIntoView({ block: "center", behavior: "auto" });
  }

  useEffect(() => {
    if (errors.length > 0 && focusKey !== undefined) summaryRef.current?.focus();
  }, [errors.length, focusKey]);

  if (errors.length === 0) return null;
  return (
    <div
      className="rounded-sm border border-destructive/35 border-l-2 border-l-destructive bg-destructive-surface p-4"
      ref={summaryRef}
      role="alert"
      tabIndex={-1}
    >
      <p className="font-semibold text-foreground">{title}</p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-destructive">
        {errors.map((error) => (
          <li key={error.id}>
            <a
              className="underline underline-offset-2"
              href={`#${error.id}`}
              onClick={(event) => focusErrorTarget(event, error.id)}
            >
              {error.message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
