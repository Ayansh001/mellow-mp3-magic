
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure Next.js as needed
  reactStrictMode: true,
  swcMinify: true,
  // Enable standalone output for Vercel deployment
  output: 'standalone',
  // Handle TypeScript properly
  typescript: {
    ignoreBuildErrors: false,
  }
};

export default nextConfig;
