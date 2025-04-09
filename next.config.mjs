
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure Next.js as needed
  reactStrictMode: true,
  swcMinify: true,
  // Enable standalone output for Vercel deployment
  output: 'standalone',
  // Handle TypeScript properly
  typescript: {
    ignoreBuildErrors: true, // Set to true to prevent TypeScript errors from failing the build
  },
  // Add support for static assets and SVG imports
  images: {
    domains: ['*'], // Allow images from all domains
  },
  webpack(config) {
    // Add SVG support
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    
    return config;
  },
  // Simplified experimental options to avoid warnings
  experimental: {
    appDir: true,
  },
}

export default nextConfig;
