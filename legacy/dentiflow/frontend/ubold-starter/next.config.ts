import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  redirects: async () => {
    return [
      {
        source: '/',
        destination: '/dashboard/ecommerce',
        permanent: false,
      },
    ]
  },
}

export default nextConfig
