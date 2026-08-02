export type PublicAttributionQuery = {
  source?: string;
  utmSource?: string;
};

export function getPublicProductDetailHref(
  storeSlug: string,
  productId: string,
  isPreview = false,
  attributionQuery?: PublicAttributionQuery,
) {
  const href = `/${encodeURIComponent(storeSlug)}/products/${encodeURIComponent(productId)}`;
  const searchParams = new URLSearchParams();
  if (isPreview) {
    searchParams.set("preview", "1");
  } else {
    if (attributionQuery?.source !== undefined) {
      searchParams.set("source", attributionQuery.source);
    }
    if (attributionQuery?.utmSource !== undefined) {
      searchParams.set("utm_source", attributionQuery.utmSource);
    }
  }

  const query = searchParams.toString();
  return query ? `${href}?${query}` : href;
}
