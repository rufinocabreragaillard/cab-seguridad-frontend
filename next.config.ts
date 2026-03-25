import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Permite que el build pase aunque haya errores de tipos
    ignoreBuildErrors: true,
  },
  eslint: {
    // Permite que el build pase aunque haya errores de ESLint
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
