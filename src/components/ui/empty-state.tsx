import type { ReactNode } from "react";

type EmptyStateProps = {
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
  titleAs?: "h1" | "h2" | "h3";
};

export function EmptyState({
  eyebrow,
  title,
  description,
  action,
  titleAs: Title = "h2",
}: EmptyStateProps) {
  return (
    <section className="border-y border-border py-8" aria-labelledby="empty-state-title">
      {eyebrow ? <p className="font-mono text-xs text-ink-secondary">{eyebrow}</p> : null}
      <Title className="mt-2 text-xl font-semibold tracking-tight" id="empty-state-title">
        {title}
      </Title>
      <p className="mt-2 max-w-xl text-sm leading-6 text-ink-secondary">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </section>
  );
}
