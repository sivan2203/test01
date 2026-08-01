"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { saveStoreProfile } from "./actions";
import type { StoreProfileFormState } from "./form-state";

type StoreProfileFormProps = {
  initialState: StoreProfileFormState;
};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="text-sm leading-6 text-foreground/75" role="alert">
      {message}
    </p>
  );
}

export function StoreProfileForm({ initialState }: StoreProfileFormProps) {
  const [state, submitStoreProfile, isPending] = useActionState(
    saveStoreProfile,
    initialState,
  );
  const [slugDraft, setSlugDraft] = useState(state.values.slug);
  const [slugEditedAfterSubmit, setSlugEditedAfterSubmit] = useState(false);
  const [linkStatus, setLinkStatus] = useState("");

  const normalizedSlug = slugDraft.trim().toLowerCase();
  const publicPath = normalizedSlug ? `/${normalizedSlug}` : "";
  const savedPublicPath = state.values.slug ? `/${state.values.slug}` : "";
  const hasCurrentSlugError = Boolean(
    state.fieldErrors.slug && !slugEditedAfterSubmit,
  );
  const currentSlugError = hasCurrentSlugError
    ? state.fieldErrors.slug
    : undefined;
  const currentLinkStatus = slugEditedAfterSubmit ? "" : linkStatus;
  const canUsePublicLink = Boolean(
    state.values.slug &&
      normalizedSlug === state.values.slug &&
      !currentSlugError,
  );
  const hasSummary =
    state.values.name ||
    state.values.slug ||
    state.values.description ||
    state.values.additionalInfo ||
    state.avatarUrl;

  function getPublicUrl() {
    if (!publicPath) return "";
    return `${window.location.origin}${publicPath}`;
  }

  function submitForm(formData: FormData) {
    const submittedSlug = String(formData.get("slug") ?? "")
      .trim()
      .toLowerCase();
    setSlugDraft(submittedSlug);
    setSlugEditedAfterSubmit(false);
    setLinkStatus("");
    submitStoreProfile(formData);
  }

  async function copyPublicLink() {
    if (!canUsePublicLink || !savedPublicPath) {
      setLinkStatus("Сначала сохраните доступную ссылку магазина.");
      return;
    }

    try {
      const publicUrl = getPublicUrl();
      await navigator.clipboard.writeText(publicUrl);
      setLinkStatus("Ссылка скопирована.");
    } catch {
      setLinkStatus("Не удалось скопировать ссылку. Выделите её вручную.");
    }
  }

  async function sharePublicLink() {
    if (!canUsePublicLink || !savedPublicPath) {
      setLinkStatus("Сначала сохраните доступную ссылку магазина.");
      return;
    }

    try {
      const publicUrl = getPublicUrl();
      if (navigator.share) {
        await navigator.share({
          title: state.values.name || "Витрина",
          url: publicUrl,
        });
        setLinkStatus("Системное меню отправки открыто.");
        return;
      }

      await navigator.clipboard.writeText(publicUrl);
      setLinkStatus("Поделиться напрямую не получилось, ссылка скопирована.");
    } catch {
      setLinkStatus("Не удалось открыть отправку. Скопируйте ссылку вручную.");
    }
  }

  return (
    <form action={submitForm} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium" htmlFor="store-name">
          Название магазина
        </label>
        <input
          className="min-h-11 rounded-xl border border-border bg-surface-raised px-4 text-base text-foreground outline-none transition-colors placeholder:text-foreground/40 focus:border-ring"
          id="store-name"
          name="name"
          type="text"
          maxLength={80}
          defaultValue={state.values.name}
          required
          aria-describedby="store-name-help"
        />
        <p className="text-sm leading-6 text-foreground/60" id="store-name-help">
          Как покупатель узнает вашу витрину. До 80 символов.
        </p>
        <FieldError message={state.fieldErrors.name} />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium" htmlFor="store-slug">
          Публичная ссылка
        </label>
        <div className="flex min-h-11 items-center rounded-xl border border-border bg-surface-raised focus-within:border-ring">
          <span className="shrink-0 pl-4 text-base text-foreground/50">/</span>
          <input
            className="min-h-11 min-w-0 flex-1 bg-transparent px-1 pr-4 text-base text-foreground outline-none placeholder:text-foreground/40"
            id="store-slug"
            name="slug"
            type="text"
            value={slugDraft}
            onChange={(event) => {
              setSlugDraft(event.target.value);
              setSlugEditedAfterSubmit(true);
              setLinkStatus("");
            }}
            onBlur={() => setSlugDraft((value) => value.trim().toLowerCase())}
            minLength={3}
            maxLength={32}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            inputMode="url"
            aria-describedby="store-slug-help"
          />
        </div>
        <p className="text-sm leading-6 text-foreground/60" id="store-slug-help">
          Латинские буквы, цифры и дефис. Если поменять сохранённую ссылку,
          старая перестанет открываться.
        </p>
        {publicPath ? (
          <div
            className="rounded-2xl border border-border bg-surface-raised p-3"
            id="store-slug-preview"
          >
            <p className="text-sm text-foreground/60">Предпросмотр ссылки</p>
            <p className="mt-1 break-all text-sm font-medium text-foreground">
              {slugEditedAfterSubmit ? publicPath : savedPublicPath || publicPath}
            </p>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Button
                className="w-full"
                onClick={copyPublicLink}
                type="button"
                variant="secondary"
              >
                Скопировать
              </Button>
              <Button
                className="w-full"
                onClick={sharePublicLink}
                type="button"
                variant="secondary"
              >
                Поделиться
              </Button>
            </div>
            <div className="mt-2">
              {canUsePublicLink ? (
                <Link
                  className={cn(buttonVariants({ variant: "secondary" }), "w-full")}
                  href="/seller/store/preview"
                >
                  Посмотреть как покупатель
                </Link>
              ) : (
                <div
                  aria-disabled="true"
                  className="flex min-h-11 w-full items-center justify-center rounded-full border border-border bg-surface-raised px-5 text-center text-sm font-medium text-foreground/50"
                >
                  Сохраните публичную ссылку, чтобы открыть предпросмотр
                </div>
              )}
            </div>
            <p className="mt-2 text-sm leading-6 text-foreground/60" role="status">
              {currentLinkStatus ||
                (canUsePublicLink
                  ? "Ссылка сохранена и готова для профиля в соцсетях."
                  : "Сохраните магазин, чтобы ссылка стала текущей.")}
            </p>
          </div>
        ) : (
          <p className="text-sm leading-6 text-foreground/60">
            Можно оставить пустой и настроить позже.
          </p>
        )}
        <FieldError message={currentSlugError} />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium" htmlFor="store-avatar">
          Фото или аватар
        </label>
        <input
          className="min-h-11 rounded-xl border border-border bg-surface-raised px-4 py-3 text-sm text-foreground file:mr-3 file:rounded-full file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground"
          id="store-avatar"
          name="avatar"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          aria-describedby="store-avatar-help"
        />
        <p className="text-sm leading-6 text-foreground/60" id="store-avatar-help">
          JPG, PNG или WebP до 2 МБ. Можно добавить позже.
        </p>
        <FieldError message={state.fieldErrors.avatar} />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium" htmlFor="store-description">
          Описание
        </label>
        <textarea
          className="min-h-28 rounded-xl border border-border bg-surface-raised px-4 py-3 text-base text-foreground outline-none transition-colors placeholder:text-foreground/40 focus:border-ring"
          id="store-description"
          name="description"
          maxLength={500}
          defaultValue={state.values.description}
          aria-describedby="store-description-help"
        />
        <p
          className="text-sm leading-6 text-foreground/60"
          id="store-description-help"
        >
          Необязательный короткий текст о магазине. Пустое поле не будет показано
          покупателям.
        </p>
        <FieldError message={state.fieldErrors.description} />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium" htmlFor="store-additional-info">
          Дополнительная информация
        </label>
        <textarea
          className="min-h-24 rounded-xl border border-border bg-surface-raised px-4 py-3 text-base text-foreground outline-none transition-colors placeholder:text-foreground/40 focus:border-ring"
          id="store-additional-info"
          name="additionalInfo"
          maxLength={500}
          defaultValue={state.values.additionalInfo}
          aria-describedby="store-additional-info-help"
        />
        <p
          className="text-sm leading-6 text-foreground/60"
          id="store-additional-info-help"
        >
          Например, город, формат работы или важные условия. Можно оставить
          пустым.
        </p>
        <FieldError message={state.fieldErrors.additionalInfo} />
      </div>

      {state.message ? (
        <p
          className="text-sm leading-6 text-foreground/75"
          role={state.status === "error" ? "alert" : "status"}
        >
          {state.message}
        </p>
      ) : null}

      <Button className="w-full" disabled={isPending} type="submit">
        {isPending ? "Сохраняем…" : "Сохранить магазин"}
      </Button>

      {hasSummary ? (
        <section
          aria-label="Как профиль будет выглядеть в витрине"
          className="rounded-2xl border border-border bg-surface-raised p-4"
        >
          <p className="text-sm text-foreground/60">Профиль витрины</p>
          <div className="mt-3 flex items-start gap-3">
            {state.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt=""
                className="h-14 w-14 rounded-2xl border border-border object-cover"
                src={state.avatarUrl}
              />
            ) : null}
            <div className="min-w-0">
              {state.values.name ? (
                <h2 className="text-xl font-semibold">{state.values.name}</h2>
              ) : null}
              {state.values.slug ? (
                <p className="mt-1 break-all text-sm text-foreground/60">
                  /{state.values.slug}
                </p>
              ) : null}
              {state.values.description ? (
                <p className="mt-2 text-sm leading-6 text-foreground/70">
                  {state.values.description}
                </p>
              ) : null}
              {state.values.additionalInfo ? (
                <p className="mt-2 text-sm leading-6 text-foreground/60">
                  {state.values.additionalInfo}
                </p>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}
    </form>
  );
}
