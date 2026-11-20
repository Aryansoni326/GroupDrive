/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@groupdrive/types", "@groupdrive/utils"],
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

