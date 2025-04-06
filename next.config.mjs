
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure Next.js as needed
  reactStrictMode: true,
  swcMinify: true,
  // Enable static exports in production builds
  output: 'standalone',
  // Configure Next.js to handle TypeScript properly
  typescript: {
    // !! WARN !!
    // We're not ignoring TypeScript errors since we want to catch them,
    // but we need to make sure Next.js finds the correct type declarations
    ignoreBuildErrors: false,
  }
};

export default nextConfig;
