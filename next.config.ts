import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export: every page, preview image, sitemap and robots.txt is written to ./out at build time.
  // Cloudflare serves these files as static assets, so no Worker code runs and there are no CPU limits.
  output: "export",
  // Icons are served as they are (the PNG files are already small); static export needs this anyway.
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
