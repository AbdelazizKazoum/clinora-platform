const nextConfig = {
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
