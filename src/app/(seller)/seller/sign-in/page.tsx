import { GlassPanel } from "@/components/design-system";
import { Button } from "@/components/ui/button";

export default function SellerSignInPlaceholderPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-4 py-6">
      <GlassPanel className="p-5">
        <p className="text-sm text-foreground/60">Seller auth placeholder</p>
        <h1 className="mt-2 text-2xl font-semibold">Вход продавца</h1>
        <p className="mt-3 text-sm leading-6 text-foreground/70">
          Story 1.0 only verifies route separation. Real seller sign-in is
          implemented in Story 1.1.
        </p>
        <Button className="mt-5 w-full" disabled aria-disabled>
          Скоро
        </Button>
      </GlassPanel>
    </main>
  );
}
