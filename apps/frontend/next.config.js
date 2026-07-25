//@ts-check

/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/',
        destination: '/dashboard/ecommerce',
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
