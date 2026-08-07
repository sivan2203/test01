import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function SellerNotFound() {
  return (
    <EmptyState
      action={<Link className={buttonVariants({ variant: "secondary" })} href="/seller/products">К списку товаров</Link>}
      description="Объект удалён, принадлежит другому магазину или ссылка устарела. Приватные данные не раскрываются."
      eyebrow="КАБИНЕТ / 404"
      title="Товар или раздел не найден"
      titleAs="h1"
    />
  );
}
