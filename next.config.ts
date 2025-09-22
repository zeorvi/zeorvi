import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configuración optimizada para rendimiento
  reactStrictMode: true,
  
  // Optimizaciones de rendimiento compatibles con Vercel
  experimental: {
    // Deshabilitamos optimizeCss temporalmente para evitar conflictos con critters
    optimizePackageImports: ['lucide-react', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
  },
  
  // Compresión y optimización de imágenes
  compress: true,
  
  // Configuración de headers para cache
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          }
        ],
      },
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  
  // Webpack optimizado para compatibilidad con Vercel
  webpack: (config, { isServer, dev }) => {
    if (!isServer) {
      // Configuración optimizada para el cliente
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
