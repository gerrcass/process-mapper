import type { NextConfig } from "next";

const isPagesBuild = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  // Local development and `next start` keep the normal server build. GitHub
  // Pages builds a fully static site into `out`.
  output: isPagesBuild ? "export" : undefined,
  basePath: process.env.PAGES_BASE_PATH || undefined,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
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
