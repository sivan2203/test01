"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const navigation = [
  { href: "/seller", label: "Сводка", index: "01" },
  { href: "/seller/products", label: "Товары", index: "02" },
  { href: "/seller/analytics", label: "Аналитика", index: "03" },
  { href: "/seller/store", label: "Магазин", index: "04" },
];

function isActivePath(pathname: string, href: string) {
  return href === "/seller" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

export function SellerNavigation({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Навигация кабинета продавца">
      <ul className={cn(mobile ? "grid grid-cols-4" : "space-y-1")}>
        {navigation.map((item) => {
          const active = isActivePath(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex min-h-11 items-center gap-3 px-3 text-sm font-medium text-ink-secondary transition-colors hover:bg-surface-raised hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                  mobile ? "flex-col justify-center gap-0.5 px-1 py-1 text-[0.6875rem]" : "rounded-sm",
                  active && "font-semibold text-foreground",
                  active && !mobile && "bg-surface-raised before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:bg-primary",
                  active && mobile && "after:absolute after:inset-x-3 after:top-0 after:h-0.5 after:bg-primary",
                )}
                href={item.href}
              >
                <span aria-hidden="true" className="font-mono text-[0.625rem] text-ink-secondary">
                  {item.index}
                </span>
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
