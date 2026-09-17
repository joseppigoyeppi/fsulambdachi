/** The hidden folder the app is served from, e.g. "/zr-orders-xxxx". Empty in tests that mount at root. */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Prefixes an app-relative asset path ("/products/x.webp" or "products/x.webp"); leaves absolute URLs alone. */
export function asset(path: string): string {
  if (!path) return path;
  if (/^(https?:)?\/\//.test(path) || path.startsWith("data:") || path.startsWith("blob:")) return path;
  return `${BASE_PATH}/${path.replace(/^\/+/, "")}`;
}
