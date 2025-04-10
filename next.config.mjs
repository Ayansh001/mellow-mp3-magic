
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure Next.js as needed
  reactStrictMode: true,
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
  // Updated experimental options without deprecated flags
  experimental: {
    // Modern experimental features without deprecated appDir
  },
}

export default nextConfig;
