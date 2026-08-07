import type { ReactNode } from "react";
import Link from "next/link";

import { getProductPriceLabel } from "@/features/product/schema";
import type { PublicProduct } from "./public-catalog";
import { PublicProductContactCta } from "./public-contact-cta";
import { PublicProductGallery } from "./public-product-gallery";

type PublicProductDetailProps = {
  product: PublicProduct;
  storeSlug: string;
  contactConfigured: boolean;
  isPreview?: boolean;
  analyticsBeacon?: ReactNode;
};

export function PublicProductDetail({
  product,
  storeSlug,
  contactConfigured,
  isPreview = false,
  analyticsBeacon,
}: PublicProductDetailProps) {
  const availabilityLabel = product.availabilityStatus === "out_of_stock" ? "Нет в наличии" : "В наличии";

  return (
    <main className="mx-auto min-h-dvh w-full max-w-[90rem] px-4 py-6 sm:px-8 sm:py-8" id="main-content" tabIndex={-1}>
      {analyticsBeacon}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <Link className="inline-flex min-h-11 items-center text-sm font-semibold text-ink-secondary underline-offset-4 hover:text-foreground hover:underline" href={`/${encodeURIComponent(storeSlug)}`}>
          ← К витрине
        </Link>
        {isPreview ? <span className="font-mono text-xs text-primary">ПРЕДПРОСМОТР · БЕЗ АНАЛИТИКИ</span> : null}
      </div>

      <div className="grid gap-8 py-7 lg:grid-cols-[minmax(0,1.25fr)_minmax(22rem,0.75fr)] lg:gap-12 lg:py-12">
        <PublicProductGallery media={product.media} productTitle={product.title} />

        <div className="min-w-0 lg:sticky lg:top-8 lg:self-start">
          <p className="font-mono text-xs text-primary">ТОВАР / {product.id.slice(0, 8).toUpperCase()}</p>
          <h1 className="mt-4 break-words text-[clamp(2.75rem,6vw,5.75rem)] font-bold leading-[0.92] tracking-[-0.06em]">
            {product.title}
          </h1>
          <div className="mt-7 flex flex-wrap items-baseline gap-x-4 gap-y-2 border-y border-border py-4">
            <p className="text-2xl font-semibold">{getProductPriceLabel(product.priceMode, product.priceAmount)}</p>
            <p className="font-mono text-xs text-ink-secondary">{availabilityLabel}</p>
          </div>

          {product.description ? (
            <section className="border-b border-border py-6" aria-labelledby="product-description">
              <h2 className="font-mono text-xs text-ink-secondary" id="product-description">ОПИСАНИЕ</h2>
              <p className="mt-3 whitespace-pre-wrap break-words text-base leading-7 text-ink-secondary">{product.description}</p>
            </section>
          ) : null}

          <div className="sticky bottom-0 z-10 -mx-4 mt-6 border-t border-border bg-background px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:mx-0 sm:px-0 lg:static lg:border-0 lg:bg-transparent lg:pb-0 lg:pt-0">
            <PublicProductContactCta
              className="w-full"
              contactConfigured={contactConfigured}
              isPreview={isPreview}
              productId={product.id}
              productTitle={product.title}
              storeSlug={storeSlug}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
