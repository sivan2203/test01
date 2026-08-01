import Link from "next/link";

import { Button } from "@/components/ui/button";
import { signOutSeller } from "@/features/seller-auth/actions";

const sellerNavItems = [
  { href: "/seller", label: "Home" },
  { href: "/seller/products", label: "Products" },
  { href: "/seller/analytics", label: "Analytics" },
  { href: "/seller/store", label: "Store" },
];

export default function SellerAdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 pb-24 pt-6 md:max-w-3xl md:pb-8">
      <header className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-foreground/50">
            Витрина
          </p>
          <p className="mt-1 text-lg font-semibold">Кабинет продавца</p>
        </div>
        <form action={signOutSeller}>
          <Button size="compact" variant="secondary" type="submit">
            Выйти
          </Button>
        </form>
      </header>

      <div className="flex-1">{children}</div>

      <nav
        aria-label="Навигация кабинета продавца"
        className="fixed inset-x-0 bottom-0 border-t border-border bg-glass px-3 py-2 backdrop-blur-xl forced-colors:bg-background forced-colors:backdrop-blur-none md:static md:mt-8 md:rounded-full md:border md:bg-surface-raised md:px-2"
      >
        <ul className="mx-auto grid max-w-md grid-cols-4 gap-1 md:max-w-none">
          {sellerNavItems.map((item) => (
            <li key={item.href}>
              <Link
                className="flex min-h-11 items-center justify-center rounded-full px-2 text-center text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                href={item.href}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
