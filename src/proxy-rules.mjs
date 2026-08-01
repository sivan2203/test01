export const SELLER_SIGN_IN_PATH = "/seller/sign-in";

export function isDevSellerSessionCookie(value, nodeEnv = process.env.NODE_ENV) {
  return nodeEnv === "development" && value === "dev";
}

export function getSellerReturnPath(pathname, search = "") {
  return `${pathname}${search}`;
}
