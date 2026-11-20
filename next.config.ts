import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The catalog is static: every page is rendered at build time (generateStaticParams).
  // cacheComponents and partialPrefetching are off: they need the Node.js runtime, and Workers is not Node.js.
  // Icons are served as they are (the PNG files are already small), so image optimization is not needed.
  images: { unoptimized: true },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

import('@opennextjs/cloudflare').then(m => m.initOpenNextCloudflareForDev());
