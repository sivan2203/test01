import { GlassPanel } from "@/components/design-system";

export default function SellerHomePlaceholderPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 py-6">
      <GlassPanel className="p-5">
        <p className="text-sm text-foreground/60">Seller admin route</p>
        <h1 className="mt-2 text-2xl font-semibold">Кабинет продавца</h1>
        <p className="mt-3 text-sm leading-6 text-foreground/70">
          Protected route placeholder. Authentication UI and Supabase session
          handling are implemented in Story 1.1.
        </p>
      </GlassPanel>
    </main>
  );
}
