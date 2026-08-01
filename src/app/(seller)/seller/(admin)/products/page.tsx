import { GlassPanel } from "@/components/design-system";

export default function SellerProductsPlaceholderPage() {
  return (
    <main>
      <GlassPanel className="p-5">
        <p className="text-sm text-foreground/60">Products</p>
        <h1 className="mt-2 text-2xl font-semibold">Товары</h1>
        <p className="mt-3 text-sm leading-6 text-foreground/70">
          Список товаров появится в историях каталога. Пока это безопасная
          точка навигации внутри защищённого кабинета.
        </p>
      </GlassPanel>
    </main>
  );
}
