import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["paralyses-sequel-motion.ngrok-free.dev"],

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
};

export default nextConfig;
