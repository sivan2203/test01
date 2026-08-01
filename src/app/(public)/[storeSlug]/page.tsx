import { GlassPanel } from "@/components/design-system";
import { Button } from "@/components/ui/button";

export default async function PublicStoreSmokePage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 py-6">
      <GlassPanel className="p-5">
        <p className="text-sm text-foreground/60">Public storefront route</p>
        <h1 className="mt-2 text-2xl font-semibold">{storeSlug}</h1>
        <p className="mt-3 text-sm leading-6 text-foreground/70">
          Placeholder public store route. Real catalog data is added by later
          stories.
        </p>
        <Button className="mt-5 w-full" variant="telegram">
          Связаться в Telegram
        </Button>
      </GlassPanel>
    </main>
  );
}
