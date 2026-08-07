"use client";

import Link from "next/link";
import {
  startTransition,
  useActionState,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { Alert } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { ErrorSummary } from "@/components/ui/error-summary";
import {
  Field,
  fieldControlClassName,
  getFieldDescriptionId,
} from "@/components/ui/field";
import { StatusMessage } from "@/components/ui/status-message";
import { validateTelegramUsername } from "@/features/contact/telegram";
import { cn } from "@/lib/utils";
import { checkStoreSlugAvailability, saveStoreProfile } from "./actions";
import { validateStoreAvatarFile } from "./avatar";
import {
  getStoreProfileSnapshot,
  getStoreProfileValuesFromSnapshot,
  isStoreProfileDirty,
  type StoreProfileFormState,
  type StoreSlugAvailabilityResult,
} from "./form-state";
import {
  normalizeStoreSlug,
  validateStoreSlug,
  type StoreProfileValues,
} from "./schema";
import { StoreDirtyBar } from "./store-dirty-bar";
import { StoreLivePreview } from "./store-live-preview";
import {
  StoreSettingsNav,
  type StoreSettingsSection,
} from "./store-settings-nav";

type StoreProfileFormProps = {
  initialState: StoreProfileFormState;
};

type PendingSlugChange = {
  previousSlug: string;
  nextSlug: string;
};

type PendingNavigation =
  | { kind: "href"; href: string }
  | { kind: "back" };

const SLUG_CHECK_DELAY_MS = 450;
const RETAINED_AVATAR_MESSAGE =
  "Выберите фото ещё раз после исправления полей.";
const STORE_DIRTY_HISTORY_KEY = "__storeSettingsDirtyGuard";

export function StoreProfileForm({ initialState }: StoreProfileFormProps) {
  const [values, setValues] = useState<StoreProfileValues>(() => ({
    ...initialState.values,
  }));
  const [snapshot, setSnapshot] = useState(() =>
    getStoreProfileSnapshot(initialState),
  );
  const [activeSection, setActiveSection] =
    useState<StoreSettingsSection>("profile");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarObjectUrl, setAvatarObjectUrl] = useState<string>();
  const [avatarClientError, setAvatarClientError] = useState<string>();
  const [avatarEditedAfterSubmit, setAvatarEditedAfterSubmit] = useState(false);
  const [editedFields, setEditedFields] = useState<
    Set<keyof StoreProfileValues>
  >(() => new Set());
  const [slugAvailability, setSlugAvailability] =
    useState<StoreSlugAvailabilityResult | null>(null);
  const [checkingSlug, setCheckingSlug] = useState<string | null>(null);
  const [linkStatus, setLinkStatus] = useState("");
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);
  const [pendingSlugChange, setPendingSlugChange] =
    useState<PendingSlugChange | null>(null);
  const [pendingNavigation, setPendingNavigation] =
    useState<PendingNavigation | null>(null);
  const [dismissedActionResult, setDismissedActionResult] = useState(false);
  const [errorFocusKey, setErrorFocusKey] = useState(0);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const pendingFormDataRef = useRef<FormData | null>(null);
  const slugRequestIdRef = useRef(0);
  const allowNavigationRef = useRef(false);
  const historyGuardRef = useRef(false);

  const runSaveAction = useCallback(
    async (previousState: StoreProfileFormState, formData: FormData) => {
      const result = await saveStoreProfile(previousState, formData);
      setDismissedActionResult(false);

      if (result.status === "success") {
        const nextSnapshot = getStoreProfileSnapshot(result);
        setSnapshot(nextSnapshot);
        setValues(getStoreProfileValuesFromSnapshot(nextSnapshot));
        setAvatarFile(null);
        setAvatarObjectUrl(undefined);
        setAvatarClientError(undefined);
        setAvatarEditedAfterSubmit(false);
        setEditedFields(new Set());
        setLinkStatus("");
        if (avatarInputRef.current) avatarInputRef.current.value = "";
        requestAnimationFrame(() => {
          document.getElementById("store-settings-profile-title")?.focus();
        });
      } else if (result.status === "error") {
        setErrorFocusKey((value) => value + 1);
      }

      return result;
    },
    [],
  );
  const [actionState, submitStoreProfile, isPending] = useActionState(
    runSaveAction,
    initialState,
  );

  const normalizedSlug = normalizeStoreSlug(values.slug);
  const previewTelegram = validateTelegramUsername(values.telegramUsername);
  const previewValues = {
    ...values,
    slug: normalizedSlug,
    telegramUsername: previewTelegram.isValid
      ? (previewTelegram.username ?? "")
      : values.telegramUsername,
  };
  const previewAvatarUrl = avatarObjectUrl ?? snapshot.avatarUrl;
  const dirty = isStoreProfileDirty(snapshot, values, Boolean(avatarFile));
  const savedPublicPath = snapshot.values.slug
    ? `/${snapshot.values.slug}`
    : "";
  const canUseSavedLink = Boolean(
    snapshot.values.slug && normalizedSlug === snapshot.values.slug,
  );

  useEffect(() => {
    if (!dirty) return;

    const currentHref = window.location.href;
    if (!window.history.state?.[STORE_DIRTY_HISTORY_KEY]) {
      window.history.pushState(
        {
          ...window.history.state,
          [STORE_DIRTY_HISTORY_KEY]: true,
        },
        "",
        currentHref,
      );
      historyGuardRef.current = true;
    }

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (allowNavigationRef.current) return;
      event.preventDefault();
      event.returnValue = "";
    }

    function handleDocumentClick(event: MouseEvent) {
      if (
        allowNavigationRef.current ||
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        !(event.target instanceof Element)
      ) {
        return;
      }

      const anchor = event.target.closest<HTMLAnchorElement>("a[href]");
      if (!anchor || anchor.download || (anchor.target && anchor.target !== "_self")) {
        return;
      }

      const targetUrl = new URL(anchor.href, window.location.href);
      const currentUrl = new URL(window.location.href);
      const staysOnSettingsSection =
        targetUrl.origin === currentUrl.origin &&
        targetUrl.pathname === currentUrl.pathname &&
        targetUrl.search === currentUrl.search &&
        Boolean(targetUrl.hash);
      if (staysOnSettingsSection || targetUrl.href === currentUrl.href) return;

      event.preventDefault();
      event.stopPropagation();
      setPendingNavigation({ kind: "href", href: targetUrl.href });
    }

    function handlePopState(event: PopStateEvent) {
      if (allowNavigationRef.current) return;
      event.stopImmediatePropagation();
      window.history.pushState(
        {
          ...window.history.state,
          [STORE_DIRTY_HISTORY_KEY]: true,
        },
        "",
        currentHref,
      );
      historyGuardRef.current = true;

      if (mobilePreviewOpen) {
        setMobilePreviewOpen(false);
        return;
      }
      if (pendingSlugChange) {
        closeSlugChangeDialog();
        return;
      }
      setPendingNavigation({ kind: "back" });
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("click", handleDocumentClick, true);
    window.addEventListener("popstate", handlePopState, true);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("click", handleDocumentClick, true);
      window.removeEventListener("popstate", handlePopState, true);
    };
  }, [dirty, mobilePreviewOpen, pendingSlugChange]);

  useEffect(() => {
    if (
      dirty ||
      !historyGuardRef.current ||
      !window.history.state?.[STORE_DIRTY_HISTORY_KEY]
    ) {
      return;
    }

    allowNavigationRef.current = true;
    historyGuardRef.current = false;
    window.history.back();
    const timer = window.setTimeout(() => {
      allowNavigationRef.current = false;
    }, 0);
    return () => window.clearTimeout(timer);
  }, [dirty]);

  useEffect(() => {
    if (!avatarObjectUrl) return;
    return () => URL.revokeObjectURL(avatarObjectUrl);
  }, [avatarObjectUrl]);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;

    const sectionIds: StoreSettingsSection[] = [
      "profile",
      "public-link",
      "contact",
      "about",
    ];
    const observer = new IntersectionObserver(
      (entries) => {
        const current = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (left, right) =>
              Math.abs(left.boundingClientRect.top) -
              Math.abs(right.boundingClientRect.top),
          )[0];
        const section = current?.target.id.replace(
          "store-settings-",
          "",
        ) as StoreSettingsSection | undefined;
        if (section && sectionIds.includes(section)) setActiveSection(section);
      },
      { rootMargin: "-12% 0px -68% 0px", threshold: [0, 0.2] },
    );

    for (const sectionId of sectionIds) {
      const section = document.getElementById(`store-settings-${sectionId}`);
      if (section) observer.observe(section);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const candidateSlug = normalizedSlug;
    const requestId = ++slugRequestIdRef.current;
    let cancelled = false;

    if (!candidateSlug) return;

    const localValidation = validateStoreSlug(candidateSlug, {
      allowEmpty: false,
    });
    if (!localValidation.isValid) return;

    const timer = window.setTimeout(() => {
      setCheckingSlug(candidateSlug);
      startTransition(() => {
        void checkStoreSlugAvailability(candidateSlug).then(
          (result) => {
            if (cancelled || slugRequestIdRef.current !== requestId) return;
            setSlugAvailability(result);
            setCheckingSlug(null);
          },
          () => {
            if (cancelled || slugRequestIdRef.current !== requestId) return;
            setSlugAvailability({
              status: "error",
              slug: candidateSlug,
              message: "Не удалось проверить ссылку. Попробуйте ещё раз.",
            });
            setCheckingSlug(null);
          },
        );
      });
    }, SLUG_CHECK_DELAY_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [normalizedSlug]);

  function updateValue<Key extends keyof StoreProfileValues>(
    key: Key,
    value: StoreProfileValues[Key],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
    setEditedFields((current) => new Set(current).add(key));
    if (key === "slug") setLinkStatus("");
    if (actionState.status === "success") setDismissedActionResult(true);
  }

  function prepareFormData(formData: FormData) {
    const telegramValidation = validateTelegramUsername(
      values.telegramUsername,
    );
    const submittedValues: StoreProfileValues = {
      ...values,
      slug: normalizeStoreSlug(values.slug),
      telegramUsername: telegramValidation.isValid
        ? (telegramValidation.username ?? "")
        : values.telegramUsername,
    };

    formData.set("name", submittedValues.name);
    formData.set("slug", submittedValues.slug);
    formData.set("telegramUsername", submittedValues.telegramUsername);
    formData.set("description", submittedValues.description);
    formData.set("additionalInfo", submittedValues.additionalInfo);
    if (avatarFile) formData.set("avatar", avatarFile);
    else formData.delete("avatar");

    return submittedValues;
  }

  function dispatchStoreProfile(formData: FormData, fromDialog = false) {
    setDismissedActionResult(false);
    setEditedFields(new Set());
    setAvatarEditedAfterSubmit(false);
    setLinkStatus("");

    if (fromDialog) {
      startTransition(() => submitStoreProfile(formData));
      return;
    }
    submitStoreProfile(formData);
  }

  function submitForm(formData: FormData) {
    const submittedValues = prepareFormData(formData);
    if (
      snapshot.values.slug &&
      submittedValues.slug !== snapshot.values.slug
    ) {
      pendingFormDataRef.current = formData;
      setPendingSlugChange({
        previousSlug: snapshot.values.slug,
        nextSlug: submittedValues.slug,
      });
      return;
    }

    dispatchStoreProfile(formData);
  }

  function closeSlugChangeDialog() {
    pendingFormDataRef.current = null;
    setPendingSlugChange(null);
  }

  function confirmSlugChange() {
    const formData = pendingFormDataRef.current;
    pendingFormDataRef.current = null;
    setPendingSlugChange(null);
    if (formData) dispatchStoreProfile(formData, true);
  }

  function discardChanges() {
    setValues(getStoreProfileValuesFromSnapshot(snapshot));
    setAvatarFile(null);
    setAvatarObjectUrl(undefined);
    setAvatarClientError(undefined);
    setAvatarEditedAfterSubmit(false);
    setEditedFields(new Set());
    setDismissedActionResult(true);
    setLinkStatus("");
    setPendingSlugChange(null);
    pendingFormDataRef.current = null;
    if (avatarInputRef.current) avatarInputRef.current.value = "";
    requestAnimationFrame(() => {
      document.getElementById("store-settings-profile-title")?.focus();
    });
  }

  function confirmPendingNavigation() {
    const navigation = pendingNavigation;
    if (!navigation) return;

    allowNavigationRef.current = true;
    historyGuardRef.current = false;
    setPendingNavigation(null);
    discardChanges();

    if (navigation.kind === "back") {
      if (window.history.length > 2) {
        window.history.go(-2);
      } else {
        window.location.replace("/seller");
      }
      return;
    }

    const nextHistoryState = { ...window.history.state };
    delete nextHistoryState[STORE_DIRTY_HISTORY_KEY];
    window.history.replaceState(
      nextHistoryState,
      "",
      window.location.href,
    );
    window.location.replace(navigation.href);
  }

  function selectAvatar(file: File | null) {
    setAvatarEditedAfterSubmit(true);
    if (actionState.status === "success") setDismissedActionResult(true);

    if (!file) {
      setAvatarFile(null);
      setAvatarObjectUrl(undefined);
      setAvatarClientError(undefined);
      return;
    }

    const validation = validateStoreAvatarFile(file);
    if (!validation.isValid) {
      setAvatarFile(null);
      setAvatarObjectUrl(undefined);
      setAvatarClientError(validation.error);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
      return;
    }

    setAvatarFile(file);
    setAvatarObjectUrl(URL.createObjectURL(file));
    setAvatarClientError(undefined);
  }

  function getSavedPublicUrl() {
    return snapshot.values.slug
      ? `${window.location.origin}/${snapshot.values.slug}`
      : "";
  }

  async function copyPublicLink() {
    if (!snapshot.values.slug) {
      setLinkStatus("Сначала сохраните публичную ссылку магазина.");
      return;
    }

    try {
      await navigator.clipboard.writeText(getSavedPublicUrl());
      setLinkStatus("Ссылка скопирована.");
    } catch {
      setLinkStatus("Не удалось скопировать ссылку. Выделите её вручную.");
    }
  }

  async function sharePublicLink() {
    if (!snapshot.values.slug) {
      setLinkStatus("Сначала сохраните публичную ссылку магазина.");
      return;
    }

    try {
      if (navigator.share) {
        await navigator.share({
          title: snapshot.values.name || "Витрина",
          url: getSavedPublicUrl(),
        });
        setLinkStatus("Системное меню отправки открыто.");
        return;
      }

      await navigator.clipboard.writeText(getSavedPublicUrl());
      setLinkStatus("Системная отправка недоступна — ссылка скопирована.");
    } catch (error) {
      setLinkStatus(
        error instanceof DOMException && error.name === "AbortError"
          ? "Отправка отменена."
          : "Не удалось открыть отправку. Скопируйте ссылку вручную.",
      );
    }
  }

  const actionErrorsVisible = !dismissedActionResult && !isPending;
  const fieldError = (key: keyof StoreProfileValues) =>
    actionErrorsVisible && !editedFields.has(key)
      ? actionState.fieldErrors[key]
      : undefined;
  const nameError = fieldError("name");
  const slugError = fieldError("slug");
  const telegramError = fieldError("telegramUsername");
  const descriptionError = fieldError("description");
  const additionalInfoError = fieldError("additionalInfo");
  const serverAvatarError =
    actionErrorsVisible && !avatarEditedAfterSubmit
      ? actionState.fieldErrors.avatar
      : undefined;
  const avatarError =
    avatarClientError ||
    (avatarFile && serverAvatarError === RETAINED_AVATAR_MESSAGE
      ? undefined
      : serverAvatarError);
  const summaryErrors = [
    nameError ? { id: "store-name", message: nameError } : null,
    slugError ? { id: "store-slug", message: slugError } : null,
    telegramError
      ? { id: "store-telegram-username", message: telegramError }
      : null,
    avatarError ? { id: "store-avatar", message: avatarError } : null,
    descriptionError
      ? { id: "store-description", message: descriptionError }
      : null,
    additionalInfoError
      ? { id: "store-additional-info", message: additionalInfoError }
      : null,
  ].filter((error): error is { id: string; message: string } => Boolean(error));
  const clientSlugValidation = normalizedSlug
    ? validateStoreSlug(normalizedSlug, { allowEmpty: false })
    : null;
  const clientSlugError =
    clientSlugValidation && !clientSlugValidation.isValid
      ? clientSlugValidation.error
      : undefined;
  const currentSlugAvailability =
    slugAvailability?.slug === normalizedSlug ? slugAvailability : null;
  const slugCheckMessage = slugError
    ? ""
    : clientSlugError
      ? clientSlugError
      : checkingSlug === normalizedSlug
      ? "Проверяем доступность…"
      : (currentSlugAvailability?.message ?? "");
  const slugCheckHasProblem = Boolean(
    clientSlugError ||
      (currentSlugAvailability &&
        ["invalid", "unavailable", "error"].includes(
          currentSlugAvailability.status,
        )),
  );

  return (
    <form
      action={submitForm}
      className={cn(
        "grid min-w-0 items-start gap-6 xl:grid-cols-[11rem_minmax(0,1fr)_minmax(17rem,22rem)]",
        dirty && "pb-52 sm:pb-40 lg:pb-24",
      )}
    >
      <StoreSettingsNav
        activeSection={activeSection}
        onNavigate={setActiveSection}
      />

      <div className="min-w-0">
        {actionErrorsVisible && actionState.status === "error" ? (
          <div className="mb-6">
            {summaryErrors.length > 0 ? (
              <ErrorSummary
                errors={summaryErrors}
                focusKey={errorFocusKey}
                title={actionState.message || "Проверьте настройки"}
              />
            ) : (
              <Alert title="Не удалось сохранить" tone="danger">
                {actionState.message}
              </Alert>
            )}
          </div>
        ) : null}

        {!dismissedActionResult &&
        !isPending &&
        actionState.status === "success" ? (
          <StatusMessage className="mb-6 text-success">
            {actionState.message}
          </StatusMessage>
        ) : null}

        <fieldset className="min-w-0 space-y-10" disabled={isPending}>
          <section
            aria-labelledby="store-settings-profile-title"
            className="scroll-mt-24 border-t border-border pt-6"
            id="store-settings-profile"
          >
            <p className="font-mono text-[0.6875rem] tracking-wide text-ink-secondary">
              01 / ПРОФИЛЬ
            </p>
            <h2
              className="mt-2 text-xl font-semibold tracking-tight outline-none"
              id="store-settings-profile-title"
              tabIndex={-1}
            >
              Как выглядит магазин
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-secondary">
              Название и аватар первыми встречают покупателя на витрине.
            </p>

            <div className="mt-6 space-y-6">
              <Field
                error={nameError}
                helper="Как покупатель узнает вашу витрину. До 80 символов."
                htmlFor="store-name"
                label="Название магазина"
              >
                <input
                  aria-describedby={getFieldDescriptionId(
                    "store-name",
                    nameError,
                  )}
                  aria-invalid={Boolean(nameError)}
                  className={fieldControlClassName}
                  id="store-name"
                  maxLength={80}
                  name="name"
                  onChange={(event) => updateValue("name", event.target.value)}
                  required
                  type="text"
                  value={values.name}
                />
              </Field>

              <Field
                error={avatarError}
                helper="JPG, PNG или WebP до 2 МБ. Можно добавить позже."
                htmlFor="store-avatar"
                label="Фото или аватар"
                optional
              >
                <input
                  accept="image/jpeg,image/png,image/webp"
                  aria-describedby={`${getFieldDescriptionId(
                    "store-avatar",
                    avatarError,
                  )}${avatarFile ? " store-avatar-selected" : ""}`}
                  aria-invalid={Boolean(avatarError)}
                  className={cn(
                    fieldControlClassName,
                    "h-auto py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-semibold file:text-primary-foreground",
                  )}
                  id="store-avatar"
                  name="avatar"
                  onChange={(event) =>
                    selectAvatar(event.currentTarget.files?.[0] ?? null)
                  }
                  ref={avatarInputRef}
                  type="file"
                />
              </Field>
              {avatarFile ? (
                <div
                  className="flex items-center gap-3 border-l-2 border-primary bg-surface-raised px-3 py-2"
                  id="store-avatar-selected"
                >
                  {avatarObjectUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      alt="Предпросмотр выбранного аватара"
                      className="h-12 w-12 rounded-md border border-border object-cover"
                      src={avatarObjectUrl}
                    />
                  ) : null}
                  <div className="min-w-0 text-sm">
                    <p className="truncate font-semibold">{avatarFile.name}</p>
                    <p className="text-ink-secondary">
                      {Math.max(1, Math.round(avatarFile.size / 1024))} КБ · файл
                      сохранён в форме до успешной отправки
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          </section>

          <section
            aria-labelledby="store-settings-public-link-title"
            className="scroll-mt-24 border-t border-border pt-6"
            id="store-settings-public-link"
          >
            <p className="font-mono text-[0.6875rem] tracking-wide text-ink-secondary">
              02 / ПУБЛИЧНАЯ ССЫЛКА
            </p>
            <h2
              className="mt-2 text-xl font-semibold tracking-tight"
              id="store-settings-public-link-title"
            >
              Адрес витрины
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-secondary">
              Сервер проверяет формат и доступность. При сохранении проверка
              уникальности выполняется ещё раз.
            </p>

            <div className="mt-6 space-y-4">
              <Field
                error={slugError}
                helper="Латинские буквы, цифры и дефис. От 3 до 32 символов."
                htmlFor="store-slug"
                label="Публичная ссылка"
                optional
              >
                <div
                  className={cn(
                    "flex min-h-11 items-center rounded-md border border-border-strong bg-surface-raised focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20",
                    slugError && "border-destructive",
                  )}
                >
                  <span className="shrink-0 pl-3.5 text-ink-secondary">/</span>
                  <input
                    aria-describedby={`${getFieldDescriptionId(
                      "store-slug",
                      slugError,
                    )} store-slug-availability`}
                    aria-invalid={Boolean(slugError || slugCheckHasProblem)}
                    autoCapitalize="none"
                    autoCorrect="off"
                    className="min-h-11 min-w-0 flex-1 bg-transparent px-1 pr-3.5 text-base text-foreground outline-none placeholder:text-ink-disabled"
                    id="store-slug"
                    inputMode="url"
                    maxLength={32}
                    minLength={3}
                    name="slug"
                    onBlur={() => updateValue("slug", normalizedSlug)}
                    onChange={(event) =>
                      updateValue("slug", event.target.value)
                    }
                    spellCheck={false}
                    type="text"
                    value={values.slug}
                  />
                </div>
              </Field>

              <StatusMessage
                className={cn(
                  slugCheckHasProblem && "text-destructive",
                  currentSlugAvailability?.status === "available" &&
                    "text-success",
                )}
                error={slugCheckHasProblem}
                id="store-slug-availability"
              >
                {slugCheckMessage}
              </StatusMessage>

              {snapshot.values.slug &&
              normalizedSlug !== snapshot.values.slug ? (
                <Alert title="Ссылка изменится после сохранения" tone="warning">
                  Старая ссылка /{snapshot.values.slug} сразу перестанет
                  открываться и будет возвращать 404. Перед отправкой попросим
                  подтверждение.
                </Alert>
              ) : null}

              {savedPublicPath ? (
                <div className="border border-border bg-surface-raised p-4">
                  <p className="text-sm text-ink-secondary">
                    Сохранённый публичный адрес
                  </p>
                  <p className="mt-1 break-all font-mono text-sm font-semibold">
                    {savedPublicPath}
                  </p>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    <Button
                      onClick={copyPublicLink}
                      type="button"
                      variant="secondary"
                    >
                      Скопировать
                    </Button>
                    <Button
                      onClick={sharePublicLink}
                      type="button"
                      variant="secondary"
                    >
                      Поделиться
                    </Button>
                  </div>
                  <Link
                    className={cn(
                      buttonVariants({ variant: "secondary" }),
                      "mt-2 w-full",
                    )}
                    href="/seller/store/preview"
                  >
                    Посмотреть сохранённую витрину
                  </Link>
                  <StatusMessage className="mt-2">{linkStatus}</StatusMessage>
                </div>
              ) : (
                <p className="text-sm leading-6 text-ink-secondary">
                  Ссылку можно настроить позже. До сохранения витрина не получит
                  публичный адрес.
                </p>
              )}

              {!canUseSavedLink && snapshot.values.slug ? (
                <p className="text-sm leading-6 text-ink-secondary">
                  Копирование и отдельный предпросмотр используют последнюю
                  сохранённую ссылку.
                </p>
              ) : null}
            </div>
          </section>

          <section
            aria-labelledby="store-settings-contact-title"
            className="scroll-mt-24 border-t border-border pt-6"
            id="store-settings-contact"
          >
            <p className="font-mono text-[0.6875rem] tracking-wide text-ink-secondary">
              03 / СВЯЗЬ
            </p>
            <h2
              className="mt-2 text-xl font-semibold tracking-tight"
              id="store-settings-contact-title"
            >
              Telegram продавца
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-secondary">
              Покупатель увидит контактное действие только после корректной
              настройки username.
            </p>

            <div className="mt-6">
              <Field
                error={telegramError}
                helper="Username, @username или HTTPS-ссылка на профиль. Сохраним только username."
                htmlFor="store-telegram-username"
                label="Telegram для связи"
                optional
              >
                <input
                  aria-describedby={getFieldDescriptionId(
                    "store-telegram-username",
                    telegramError,
                  )}
                  aria-invalid={Boolean(telegramError)}
                  autoCapitalize="none"
                  autoCorrect="off"
                  className={fieldControlClassName}
                  id="store-telegram-username"
                  inputMode="text"
                  name="telegramUsername"
                  onChange={(event) =>
                    updateValue("telegramUsername", event.target.value)
                  }
                  spellCheck={false}
                  type="text"
                  value={values.telegramUsername}
                />
              </Field>
              {!values.telegramUsername.trim() ? (
                <StatusMessage className="mt-3">
                  Контакт пока недоступен покупателям.
                </StatusMessage>
              ) : null}
            </div>
          </section>

          <section
            aria-labelledby="store-settings-about-title"
            className="scroll-mt-24 border-t border-border pt-6"
            id="store-settings-about"
          >
            <p className="font-mono text-[0.6875rem] tracking-wide text-ink-secondary">
              04 / О ВИТРИНЕ
            </p>
            <h2
              className="mt-2 text-xl font-semibold tracking-tight"
              id="store-settings-about-title"
            >
              Текст для покупателя
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-secondary">
              Коротко объясните, что продаёте и какие условия важно знать до
              связи.
            </p>

            <div className="mt-6 space-y-6">
              <Field
                error={descriptionError}
                helper="Короткий вводный текст. До 500 символов."
                htmlFor="store-description"
                label="Описание"
                optional
              >
                <textarea
                  aria-describedby={getFieldDescriptionId(
                    "store-description",
                    descriptionError,
                  )}
                  aria-invalid={Boolean(descriptionError)}
                  className={cn(fieldControlClassName, "min-h-32 py-3")}
                  id="store-description"
                  maxLength={500}
                  name="description"
                  onChange={(event) =>
                    updateValue("description", event.target.value)
                  }
                  value={values.description}
                />
              </Field>

              <Field
                error={additionalInfoError}
                helper="Например, город, формат работы или важные условия. До 500 символов."
                htmlFor="store-additional-info"
                label="Дополнительная информация"
                optional
              >
                <textarea
                  aria-describedby={getFieldDescriptionId(
                    "store-additional-info",
                    additionalInfoError,
                  )}
                  aria-invalid={Boolean(additionalInfoError)}
                  className={cn(fieldControlClassName, "min-h-28 py-3")}
                  id="store-additional-info"
                  maxLength={500}
                  name="additionalInfo"
                  onChange={(event) =>
                    updateValue("additionalInfo", event.target.value)
                  }
                  value={values.additionalInfo}
                />
              </Field>
            </div>
          </section>

          <div className="border-t border-border pt-6 xl:hidden">
            <Button
              aria-haspopup="dialog"
              className="w-full"
              onClick={() => setMobilePreviewOpen(true)}
              type="button"
              variant="secondary"
            >
              Открыть живой предпросмотр
            </Button>
          </div>
        </fieldset>
      </div>

      <aside
        aria-labelledby="store-live-preview-title"
        className="sticky top-8 hidden min-w-0 xl:block"
      >
        <h2
          className="mb-3 text-sm font-semibold"
          id="store-live-preview-title"
        >
          Живой предпросмотр
        </h2>
        <StoreLivePreview
          avatarUrl={previewAvatarUrl}
          unsaved={dirty}
          values={previewValues}
        />
      </aside>

      <StoreDirtyBar
        dirty={dirty}
        onDiscard={discardChanges}
        pending={isPending}
      />

      <Dialog
        actions={
          <Button
            data-dialog-initial-focus
            onClick={() => setMobilePreviewOpen(false)}
            type="button"
            variant="secondary"
          >
            Закрыть
          </Button>
        }
        className="max-h-[calc(100dvh-2rem)] overflow-y-auto"
        description="Предпросмотр использует введённые значения и не сохраняет их в базе."
        initialFocus="title"
        onOpenChange={setMobilePreviewOpen}
        open={mobilePreviewOpen}
        title="Предпросмотр витрины"
      >
        <StoreLivePreview
          avatarUrl={previewAvatarUrl}
          unsaved={dirty}
          values={previewValues}
        />
      </Dialog>

      <Dialog
        actions={
          <>
            <Button
              data-dialog-initial-focus
              onClick={closeSlugChangeDialog}
              type="button"
              variant="secondary"
            >
              Отмена
            </Button>
            <Button onClick={confirmSlugChange} type="button">
              Подтвердить и сохранить
            </Button>
          </>
        }
        description={
          pendingSlugChange ? (
            <>
              После сохранения ссылка /{pendingSlugChange.previousSlug}
              перестанет открываться и будет возвращать 404. {" "}
              {pendingSlugChange.nextSlug
                ? `Новый адрес — /${pendingSlugChange.nextSlug}.`
                : "Публичная ссылка будет отключена."}
            </>
          ) : undefined
        }
        onOpenChange={(open) => {
          if (!open) closeSlugChangeDialog();
        }}
        open={Boolean(pendingSlugChange)}
        title="Изменить публичную ссылку?"
      />

      <Dialog
        actions={
          <>
            <Button
              data-dialog-initial-focus
              onClick={() => setPendingNavigation(null)}
              type="button"
              variant="secondary"
            >
              Остаться
            </Button>
            <Button
              onClick={confirmPendingNavigation}
              type="button"
              variant="destructive"
            >
              Отменить изменения и уйти
            </Button>
          </>
        }
        description="Введённые значения и выбранный файл ещё не сохранены. Если уйти сейчас, восстановить их не получится."
        onOpenChange={(open) => {
          if (!open) setPendingNavigation(null);
        }}
        open={Boolean(pendingNavigation)}
        title="Уйти без сохранения?"
      />
    </form>
  );
}
