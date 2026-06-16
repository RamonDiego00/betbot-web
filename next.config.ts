import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    // Em produção, usa NEXT_PUBLIC_API_BASE_URL (ex: https://betbot-api.onrender.com).
    // Em dev local, deixa vazio para usar o proxy relativo (:3000 → :8080).
    const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";
    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
