import { GlassPanel } from "@/components/design-system";
import { getInitialStoreProfileFormState } from "@/features/store/form-state";
import { getCurrentSellerStoreProfile } from "@/features/store/queries";
import { StoreProfileForm } from "@/features/store/store-profile-form";

export const dynamic = "force-dynamic";

export default async function SellerStorePage() {
  const storeResult = await getCurrentSellerStoreProfile();
  const store = storeResult.status === "found" ? storeResult.store : null;
  const initialState = getInitialStoreProfileFormState(store);
  const cannotLoadStore =
    storeResult.status === "error" || storeResult.status === "unauthenticated";

  return (
    <main className="flex flex-col gap-4">
      <GlassPanel className="p-5">
        <p className="text-sm text-foreground/60">
          {store ? "Редактирование" : "Первичная настройка"}
        </p>
        <h1 className="mt-2 text-2xl font-semibold">
          {store ? "Профиль магазина" : "Создайте витрину"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-foreground/70">
          Заполните базовую информацию, которую позже увидит покупатель в
          шапке витрины. Публичная ссылка и Telegram настраиваются в следующих
          шагах.
        </p>
      </GlassPanel>
      <GlassPanel className="p-5">
        {cannotLoadStore ? (
          <div role="alert">
            <h2 className="text-xl font-semibold">Не удалось загрузить профиль</h2>
            <p className="mt-3 text-sm leading-6 text-foreground/70">
              Мы не будем показывать пустую форму, чтобы случайно не заменить
              уже сохранённые данные. Обновите страницу или войдите в кабинет
              продавца заново.
            </p>
          </div>
        ) : (
          <StoreProfileForm initialState={initialState} />
        )}
      </GlassPanel>
    </main>
  );
}
