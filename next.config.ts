import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow browser clients that send Origin (needed for client JS in this environment)
  allowedDevOrigins: ["127.0.0.1", "localhost"],
};

export default nextConfig;
