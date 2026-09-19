import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "i.pinimg.com" },
      { protocol: "https", hostname: "*.cloudfront.net" },
      { protocol: "https", hostname: "salt.tikicdn.com" },
      { protocol: "https", hostname: "placehold.co" },
    ],
  },
  reactStrictMode: true,
  /**
   * @see https://nextjs.org/docs/pages/api-reference/config/next-config-js/output
   */
  output: "standalone",
};

export default nextConfig;
