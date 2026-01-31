
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  async rewrites() {
    return [
      {
        source: "/image-generation/:path*",
        destination: "/api/serve-image/:path*",
      },
    ];
  },

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "placeholder.com" },
    ],
  },
};

module.exports = nextConfig;
