import type { NextConfig } from "next";

/*
  The app is exported as static files and served by GitHub Pages from a hidden
  folder in the chapter site repo. BASE_PATH is that folder's name — change it here
  (and re-run `npm run build`) to move the secret URL.
*/
export const BASE_PATH = "/zr-orders-s4gsie1j";

const nextConfig: NextConfig = {
  output: "export",
  basePath: BASE_PATH,
  trailingSlash: true,
  env: { NEXT_PUBLIC_BASE_PATH: BASE_PATH },
  images: { unoptimized: true },
};

export default nextConfig;
