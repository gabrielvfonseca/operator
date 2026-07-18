import type { NextConfig } from "next";

/**
 * Standalone output so the app ships as a self-contained Node server
 * (`apps/console/server.js`) behind the gateway proxy at `/control-ui`.
 *
 * `basePath` must mirror the gateway proxy mount (`gateway.controlUi.basePath`,
 * default `/control-ui`). Keep them in sync when the mount changes.
 *
 * Rewrites forward console-origin `/api` and `/ws` traffic to the Gateway
 * (same host/port in production; override `CONSOLE_GATEWAY_URL` for dev against
 * a remote gateway). The gateway serves these at the host root, so the basePath
 * prefix is stripped on the way out.
 */
const basePath = process.env.CONSOLE_BASE_PATH || "/control-ui";
const gatewayUrl = (process.env.CONSOLE_GATEWAY_URL || "http://localhost:18789").replace(
  /\/+$/,
  "",
);

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  basePath,
  env: {
    CONSOLE_BASE_PATH: basePath,
    CONSOLE_GATEWAY_URL: gatewayUrl,
  },
  async rewrites() {
    return [
      {
        source: `${basePath}/api/:path*`,
        destination: `${gatewayUrl}/api/:path*`,
      },
      {
        source: `${basePath}/ws/:path*`,
        destination: `${gatewayUrl}/ws/:path*`,
      },
    ];
  },
};

export default nextConfig;
