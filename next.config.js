/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },
  productionBrowserSourceMaps: false,
  compress: true,
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
