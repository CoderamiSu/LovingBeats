
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* Note: output: 'export' is required for Capacitor builds. */
  output: 'export',
  experimental: {
    /* Allow the specific cloud workstation origin to prevent CORS/HMR issues */
    allowedDevOrigins: [
      '6000-firebase-studio-1773194783285.cluster-fsmcisrvfbb5cr5mvra3hr3qyg.cloudworkstations.dev'
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    /* Required for Capacitor/Static export compatibility */
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
