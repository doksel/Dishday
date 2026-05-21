/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@dishday/ui', '@dishday/types', '@dishday/utils', '@dishday/api-client'],
};

export default nextConfig;
