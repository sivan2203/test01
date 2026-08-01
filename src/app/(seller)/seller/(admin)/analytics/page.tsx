import { GlassPanel } from "@/components/design-system";

export default function SellerAnalyticsPlaceholderPage() {
  return (
    <main>
      <GlassPanel className="p-5">
        <p className="text-sm text-foreground/60">Analytics</p>
        <h1 className="mt-2 text-2xl font-semibold">Аналитика</h1>
        <p className="mt-3 text-sm leading-6 text-foreground/70">
          Метрики просмотров и переходов будут добавлены в аналитических
          историях. До этого экран остаётся пустым состоянием без фейковых
          данных.
        </p>
      </GlassPanel>
    </main>
  );
}
