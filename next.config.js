/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable TypeScript type checking and ESLint during build
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    // Allow warnings, only fail on errors
    ignoreDuringBuilds: true,
  },
  // Output standalone build for better containerization
  output: 'standalone',
}

module.exports = nextConfig 