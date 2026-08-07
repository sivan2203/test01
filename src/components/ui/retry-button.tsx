"use client";

import { useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { Button } from "./button";

type RetryButtonProps = {
  children?: ReactNode;
  className?: string;
};

export function RetryButton({
  children = "Повторить",
  className,
}: RetryButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      className={className}
      disabled={pending}
      onClick={() => startTransition(() => router.refresh())}
      variant="secondary"
    >
      {pending ? "Обновляем…" : children}
    </Button>
  );
}
