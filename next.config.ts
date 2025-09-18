import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    // Excluir winston del bundle del cliente
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        winston: false,
      };
      
      config.externals = config.externals || [];
      config.externals.push('winston');
    }
    
    return config;
  },
};

export default nextConfig;
