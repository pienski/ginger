import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    APP_NAME: process.env.APP_NAME || "Ginger",
  },
};

export default nextConfig;
