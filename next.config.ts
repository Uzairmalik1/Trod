import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["lh3.googleusercontent.com", "avatars.githubusercontent.com"], // ✅ Add trusted domains
  },
  /* config options here */
};

export default nextConfig;
