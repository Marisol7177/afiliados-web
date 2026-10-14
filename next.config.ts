import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/afiliados-web",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
