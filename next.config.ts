import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configuración mínima y compatible
  reactStrictMode: true,
  
  // Configuración para evitar problemas de caché
  experimental: {
    optimizeCss: false,
  },
  
  // Solo webpack config básico
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Configuración mínima para el cliente
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    return config;
  },
};

export default nextConfig;
