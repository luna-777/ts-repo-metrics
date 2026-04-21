import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "adm-zip",
    "tree-sitter",
    "tree-sitter-typescript",
  ],
};

export default nextConfig;
