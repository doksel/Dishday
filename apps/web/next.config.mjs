/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@dishday/ui', '@dishday/types', '@dishday/utils', '@dishday/api-client'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.s3.amazonaws.com' },
      { protocol: 'https', hostname: 'cdn.dishday.app' },
    ],
  },
};

export default nextConfig;
