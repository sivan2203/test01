import type { ReactNode } from "react";
import Link from "next/link";

import { GlassPanel } from "@/components/design-system";
import { getProductPriceLabel } from "@/features/product/schema";
import { cn } from "@/lib/utils";
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
  const availabilityLabel =
    product.availabilityStatus === "out_of_stock"
      ? "Нет в наличии"
      : "В наличии";
  const storefrontHref = "/" + encodeURIComponent(storeSlug);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-4 px-4 py-6 sm:px-6">
      {analyticsBeacon}
      <Link
        className={cn(
          "inline-flex min-h-11 items-center self-start rounded-full px-4 text-sm font-medium text-foreground/70 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        )}
        href={storefrontHref}
      >
        ← К витрине
      </Link>

      <GlassPanel className="p-4 sm:p-6">
        <PublicProductGallery media={product.media} productTitle={product.title} />

        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-foreground/60">Товар</p>
            <h1 className="break-words text-3xl font-semibold leading-tight">
              {product.title}
            </h1>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <p className="break-words text-xl font-semibold">
                {getProductPriceLabel(product.priceMode, product.priceAmount)}
              </p>
              <p className="text-sm text-foreground/65">{availabilityLabel}</p>
            </div>
          </div>

          {product.description ? (
            <section aria-labelledby="product-description">
              <h2 className="text-sm font-semibold" id="product-description">
                Описание
              </h2>
              <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-7 text-foreground/75">
                {product.description}
              </p>
            </section>
          ) : null}

          <div className="sticky bottom-4 z-10 rounded-2xl border border-border bg-glass p-2 shadow-sm backdrop-blur-xl motion-reduce:backdrop-blur-none forced-colors:bg-[Canvas]">
            <PublicProductContactCta
              className="w-full"
              contactConfigured={contactConfigured}
              isPreview={isPreview}
              productId={product.id}
              storeSlug={storeSlug}
            />
          </div>
        </div>
      </GlassPanel>
    </main>
  );
}
