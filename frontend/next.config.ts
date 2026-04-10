import type { NextConfig } from "next";

/**
 * Backend URL is read from BACKEND_URL at *build time* (server-side rewrites
 * are evaluated at build/start, not per-request). Set it to your deployed
 * FastAPI URL when deploying to Vercel/Netlify; defaults to local dev.
 *
 * Why a rewrite vs a direct fetch from the browser?
 * The frontend always calls /api/* on the same origin. Next.js proxies that
 * to the backend. This avoids CORS in dev and lets us put the API on the
 * same domain in production behind a single deployment.
 */
const BACKEND_URL = process.env.BACKEND_URL ?? "http://127.0.0.1:8000";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
