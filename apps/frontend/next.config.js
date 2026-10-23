//@ts-check

const { networkInterfaces } = require('node:os');

const getLocalDevOrigins = () => {
  try {
    return Object.values(networkInterfaces())
      .flatMap((interfaces) => interfaces ?? [])
      .filter((address) => address.family === 'IPv4')
      .map((address) => address.address);
  } catch {
    // Sandboxed builds and tests may not have access to network interfaces.
    return ['127.0.0.1'];
  }
};

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Include this machine's LAN addresses when serving development on 0.0.0.0.
  allowedDevOrigins: getLocalDevOrigins(),
  sassOptions: {
    // Ubold 8's bundled Bootstrap SCSS still uses APIs deprecated by modern Sass.
    silenceDeprecations: ['import', 'global-builtin', 'color-functions', 'if-function'],
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/dashboard',
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
