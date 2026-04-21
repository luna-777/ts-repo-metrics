import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
        pathname: "/**",
      },
    ],
  },
  serverExternalPackages: [
    "adm-zip",
    "tree-sitter",
    "tree-sitter-typescript",
  ],
};

export default nextConfig;
