import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configuración optimizada para rendimiento
  reactStrictMode: true,
  
  // Configuración de plataforma modular - PROTEGE CÓDIGO EXISTENTE
  async rewrites() {
    return [
      // SECCIÓN RESTAURANTES (PROTEGIDA - NO TOCAR)
      {
        source: '/restaurants/:path*',
        destination: '/restaurants/:path*',
      },
      {
        source: '/admin/:path*',
        destination: '/admin/:path*',
      },
      {
        source: '/restaurant/:path*',
        destination: '/restaurant/:path*',
      },
      
      // NUEVAS SECCIONES (AISLADAS)
      {
        source: '/ai-automation/:path*',
        destination: '/ai-automation/:path*',
      },
      {
        source: '/business/:path*',
        destination: '/business/:path*',
      },
      {
        source: '/platform/:path*',
        destination: '/platform/:path*',
      },
      
      // APIs (SEPARADAS POR SECCIÓN)
      {
        source: '/api/restaurants/:path*',
        destination: '/api/restaurants/:path*',
      },
      {
        source: '/api/ai/:path*',
        destination: '/api/ai/:path*',
      },
      {
        source: '/api/platform/:path*',
        destination: '/api/platform/:path*',
      },
    ];
  },
  
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
        dns: false,
        child_process: false,
        crypto: false,
        stream: false,
        util: false,
        url: false,
        querystring: false,
        path: false,
        os: false,
      };
    }
    
    return config;
  },
};

export default nextConfig;
