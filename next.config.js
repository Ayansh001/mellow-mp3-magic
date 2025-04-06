
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure Next.js as needed
  reactStrictMode: true,
  swcMinify: true,
  // Enable standalone output for better Vercel compatibility
  output: 'standalone',
  // Handle TypeScript properly
  typescript: {
    ignoreBuildErrors: false,
  }
};

module.exports = nextConfig;
