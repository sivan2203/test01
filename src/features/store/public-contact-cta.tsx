"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { getPublicAttributionHints } from "@/features/analytics/source-attribution";

type PublicProductContactCtaProps = {
  storeSlug: string;
  productId: string;
  contactConfigured?: boolean;
  isPreview?: boolean;
  className?: string;
};

export function PublicProductContactCta({
  storeSlug,
  productId,
  contactConfigured = false,
  isPreview = false,
  className,
}: PublicProductContactCtaProps) {
  const [status, setStatus] = useState<
    "idle" | "pending" | "ready" | "copied" | "copy-error" | "error"
  >("idle");
  const [preparedMessage, setPreparedMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleContactClick() {
    if (!contactConfigured || status === "pending") return;

    setStatus("pending");
    setErrorMessage("");
    const telegramWindow = window.open("about:blank", "_blank");
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 15_000);

    try {
      const response = await fetch(
        isPreview ? "/api/contact/telegram/preview" : "/api/contact/telegram",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            storeSlug,
            productId,
            ...(isPreview
              ? {}
              : getPublicAttributionHints(
                  new URL(window.location.href),
                  document.referrer,
                )),
          }),
          signal: controller.signal,
        },
      );
      const payload = (await response.json()) as {
        message?: string;
        productUrl?: string;
        url?: string;
      };

      if (!response.ok || !payload.message || !payload.url) {
        throw new Error(payload.message ?? "Не удалось открыть Telegram.");
      }

      setPreparedMessage(payload.message);
      setStatus("ready");

      if (telegramWindow) {
        telegramWindow.opener = null;
        telegramWindow.location.href = payload.url;
      }
    } catch (error) {
      telegramWindow?.close();
      setErrorMessage(
        error instanceof DOMException && error.name === "AbortError"
          ? "Подготовка обращения заняла слишком много времени. Попробуйте ещё раз."
          : error instanceof Error
          ? error.message
          : "Не удалось подготовить обращение. Попробуйте ещё раз.",
      );
      setStatus("error");
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  async function handleCopyMessage() {
    if (!preparedMessage) return;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(preparedMessage);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = preparedMessage;
        textArea.setAttribute("readonly", "true");
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.append(textArea);
        textArea.select();
        let copied = false;
        try {
          copied = document.execCommand("copy");
        } finally {
          textArea.remove();
        }
        if (!copied) throw new Error("copy-failed");
      }
      setStatus("copied");
    } catch {
      setErrorMessage("Не удалось скопировать текст. Выделите его вручную.");
      setStatus("copy-error");
    }
  }

  return (
    <div className="space-y-2">
      <Button
        aria-label={
          contactConfigured
            ? "Связаться с продавцом в Telegram"
            : "Контакт продавца пока не настроен"
        }
        className={className}
        data-contact-product-id={productId}
        data-contact-store-slug={storeSlug}
        disabled={!contactConfigured || status === "pending"}
        onClick={handleContactClick}
        variant={contactConfigured ? "telegram" : "secondary"}
      >
        {status === "pending"
          ? "Готовим Telegram…"
          : contactConfigured
            ? "Связаться в Telegram"
            : "Контакт продавца пока не настроен"}
      </Button>

      {preparedMessage ? (
        <div className="space-y-2 rounded-2xl border border-border bg-surface-raised p-3 text-sm leading-6">
          <p>
            Telegram должен открыть чат с подготовленным текстом. Если этого не
            произошло, скопируйте сообщение:
          </p>
          <p className="whitespace-pre-wrap break-words text-foreground/75">
            {preparedMessage}
          </p>
          <Button
            aria-label="Скопировать текст сообщения"
            className="w-full"
            onClick={handleCopyMessage}
            variant="secondary"
          >
            Скопировать текст сообщения
          </Button>
          <p aria-live="polite" className="text-xs text-foreground/65">
            {status === "copied"
              ? "Сообщение скопировано."
              : status === "copy-error"
                ? errorMessage
                : ""}
          </p>
        </div>
      ) : null}

      {status === "error" ? (
        <p aria-live="polite" className="text-sm text-foreground/70">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
