import { GlassPanel } from "@/components/design-system";

export default function SellerStorePlaceholderPage() {
  return (
    <main>
      <GlassPanel className="p-5">
        <p className="text-sm text-foreground/60">Store</p>
        <h1 className="mt-2 text-2xl font-semibold">Магазин</h1>
        <p className="mt-3 text-sm leading-6 text-foreground/70">
          Профиль магазина будет создаваться в следующей истории. Этот экран
          закрепляет навигацию и защищённую seller-зону.
        </p>
      </GlassPanel>
    </main>
  );
}
