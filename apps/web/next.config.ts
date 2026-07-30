import type { NextConfig } from "next";
import path from "path";
// @ts-ignore - No types available for this plugin
import { PrismaPlugin } from "@prisma/nextjs-monorepo-workaround-plugin";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@cashflow/database", "@cashflow/auth", "@cashflow/shared", "@cashflow/ui", "@cashflow/farmers", "@cashflow/collections", "@cashflow/valuation", "@cashflow/wallets", "@cashflow/credit", "@cashflow/notifications"],
  outputFileTracingRoot: path.join(__dirname, "../../"),
  outputFileTracingIncludes: {
    "/*": ["../../packages/database/generated/prisma/**/*"],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.plugins = [...config.plugins, new PrismaPlugin()];
    }
    return config;
  },
};

export default nextConfig;
