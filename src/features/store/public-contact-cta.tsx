import { Button } from "@/components/ui/button";

type PublicProductContactCtaProps = {
  storeSlug: string;
  productId: string;
  contactConfigured?: boolean;
  className?: string;
};

export function PublicProductContactCta({
  storeSlug,
  productId,
  contactConfigured = false,
  className,
}: PublicProductContactCtaProps) {
  return (
    <Button
      aria-label={
        contactConfigured
          ? "Связаться с продавцом"
          : "Контакт продавца пока не настроен"
      }
      className={className}
      data-contact-product-id={productId}
      data-contact-store-slug={storeSlug}
      disabled={!contactConfigured}
      variant={contactConfigured ? "telegram" : "secondary"}
    >
      {contactConfigured
        ? "Связаться в Telegram"
        : "Контакт продавца пока не настроен"}
    </Button>
  );
}
