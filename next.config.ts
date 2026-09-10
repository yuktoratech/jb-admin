import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  allowedDevOrigins: ["192.168.1.28"],
  reactStrictMode: true,
};

export default nextConfig;
