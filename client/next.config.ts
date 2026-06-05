import type { NextConfig } from "next";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8788";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/integrations/:path*",
        destination: `${apiUrl}/integrations/:path*`,
      },
      {
        source: "/tasks/:path*",
        destination: `${apiUrl}/tasks/:path*`,
      },
      {
        source: "/analytics/:path*",
        destination: `${apiUrl}/analytics/:path*`,
      },
      {
        source: "/users/:path*",
        destination: `${apiUrl}/users/:path*`,
      },
    ];
  },
};

export default nextConfig;
