/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@groupdrive/types", "@groupdrive/utils", "@groupdrive/api-client"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.groupdrive.in",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;

