//@ts-check

/** @type {import('next').NextConfig} */
const nextConfig = {
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
