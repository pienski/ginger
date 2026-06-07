import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    APP_NAME: process.env.APP_NAME || "Recipe App",
  },
};

export default nextConfig;
