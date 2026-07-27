import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // Ensure the private gallery images (outside /public) are bundled with the
  // serverless function that streams them.
  outputFileTracingIncludes: {
    "/api/gallery/[id]": ["./private/gallery/**"],
  },
};

export default nextConfig;
