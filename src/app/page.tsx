import { GlassPanel } from "@/components/design-system";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <GlassPanel className="w-full max-w-md p-6">
        <p className="mb-3 text-sm text-foreground/60">
          Story 1.0 foundation smoke route
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Персональная витрина
        </h1>
        <p className="mt-4 text-base leading-7 text-foreground/75">
          Greenfield Next.js foundation is ready for public storefront and
          seller admin stories.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button>Public route OK</Button>
          <Button variant="secondary">Mobile-first shell</Button>
        </div>
      </GlassPanel>
    </main>
  );
}
