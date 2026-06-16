import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    // Em produção, usa NEXT_PUBLIC_API_BASE_URL (ex: https://betbot-api.onrender.com).
    // Em dev local, deixa vazio para usar o proxy relativo (:3000 → :8080).
    const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";
    return [
      // Endpoints REST da API
      {
        source: "/api/:path*",
        destination: `${apiUrl}/api/:path*`,
      },
      // OAuth2 (Google login): o browser precisa ser redirecionado para a URL da API,
      // mas em dev passamos pelo proxy para evitar problemas de CORS/port.
      {
        source: "/oauth2/:path*",
        destination: `${apiUrl}/oauth2/:path*`,
      },
      {
        source: "/login/oauth2/:path*",
        destination: `${apiUrl}/login/oauth2/:path*`,
      },
    ];
  },
};

export default nextConfig;
