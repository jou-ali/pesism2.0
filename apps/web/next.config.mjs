/** @type {import('next').NextConfig} */
const nextConfig = {
  // @tournax/core ships TypeScript source, so Next compiles it.
  transpilePackages: ['@tournax/core'],
  // Share posters measure Furore with opentype.js — keep it on the Node server, not in the client bundle.
  serverExternalPackages: ['opentype.js'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;
