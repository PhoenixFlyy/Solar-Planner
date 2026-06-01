import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Cesium ships ESM that Next must transpile; its runtime assets are served
  // from /public/cesium (see scripts/copy-cesium.mjs + cesium-config.ts).
  transpilePackages: ["cesium", "resium"],
};

export default withNextIntl(nextConfig);
