import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  env: {
    BACKEND_URL: process.env.BACKEND_URL,
  },
  async redirects() {
    return [
      {
        source: '/problems/:slug',
        destination: '/problems/:slug/description',
        permanent: true,
      },
    ]
  },
}

export default nextConfig;