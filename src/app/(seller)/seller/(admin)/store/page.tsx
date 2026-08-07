import type { Metadata } from "next";

import { Alert } from "@/components/ui/alert";
import { getInitialStoreProfileFormState } from "@/features/store/form-state";
import { getCurrentSellerStoreProfile } from "@/features/store/queries";
import { StoreProfileForm } from "@/features/store/store-profile-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Настройки магазина" };

export default async function SellerStorePage() {
  const storeResult = await getCurrentSellerStoreProfile();
  const store = storeResult.status === "found" ? storeResult.store : null;
  const initialState = getInitialStoreProfileFormState(store);
  const cannotLoadStore =
    storeResult.status === "error" || storeResult.status === "unauthenticated";

  return (
    <div className="min-w-0">
      <header className="border-b border-border-strong pb-6">
        <p className="font-mono text-[0.6875rem] tracking-wide text-ink-secondary">
          {store ? "Редактирование" : "Первичная настройка"}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          {store ? "Настройки магазина" : "Создайте витрину"}
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-ink-secondary sm:text-base">
          Настройте профиль, публичный адрес, Telegram и текст витрины. Живой
          предпросмотр показывает локальные изменения до сохранения.
        </p>
      </header>

      <div className="mt-8">
        {cannotLoadStore ? (
          <Alert title="Не удалось загрузить профиль" titleAs="h2" tone="danger">
            Мы не показываем пустую форму, чтобы случайно не заменить уже
            сохранённые данные. Обновите страницу или войдите в кабинет
            продавца заново.
          </Alert>
        ) : (
          <StoreProfileForm initialState={initialState} />
        )}
      </div>
    </div>
  );
}
