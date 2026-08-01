import Link from "next/link";

import { GlassPanel } from "@/components/design-system";
import { buttonVariants } from "@/components/ui/button";

export default function SellerHomePage() {
  return (
    <main className="flex flex-col gap-4">
      <GlassPanel className="p-5">
        <p className="text-sm text-foreground/60">Первый вход</p>
        <h1 className="mt-2 text-2xl font-semibold">Начните с витрины</h1>
        <p className="mt-3 text-sm leading-6 text-foreground/70">
          Здесь появится краткая аналитика, когда магазин и товары будут
          опубликованы. Сейчас главный шаг — создать базовую витрину.
        </p>
        <Link className={buttonVariants({ className: "mt-5 w-full" })} href="/seller/store">
          Создать витрину
        </Link>
      </GlassPanel>
    </main>
  );
}
