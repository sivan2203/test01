"use client";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default function SellerError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <Alert titleAs="h1" tone="danger" title="Раздел кабинета временно недоступен">
      <p>Введённые в открытых формах данные могли остаться в браузере. Повторите загрузку этого раздела.</p>
      <Button className="mt-4" onClick={reset} variant="secondary">Повторить</Button>
    </Alert>
  );
}
