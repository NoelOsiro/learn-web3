import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@cashflow/database", "@cashflow/auth", "@cashflow/shared", "@cashflow/ui", "@cashflow/farmers", "@cashflow/collections", "@cashflow/valuation", "@cashflow/wallets", "@cashflow/credit", "@cashflow/notifications"],
};

export default nextConfig;
