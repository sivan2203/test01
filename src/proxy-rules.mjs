export const SELLER_SIGN_IN_PATH = "/seller/sign-in";

export function isSellerPath(pathname) {
  return pathname === "/seller" || pathname.startsWith("/seller/");
}

export function getSellerReturnPath(pathname, search = "") {
  return `${pathname}${search}`;
}

export function getSafeSellerRedirectPath(value, fallback = "/seller") {
  if (!value || typeof value !== "string") {
    return fallback;
  }

  if (value.startsWith("//") || /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(value)) {
    return fallback;
  }

  const [pathWithSearch] = value.split("#");
  const [pathname] = pathWithSearch.split("?");

  if (
    !isSellerPath(pathname) ||
    pathname === SELLER_SIGN_IN_PATH ||
    pathname.startsWith(`${SELLER_SIGN_IN_PATH}/`)
  ) {
    return fallback;
  }

  return pathWithSearch;
}
