import type { NextConfig } from "next";
import { assertEnv } from "./src/env";

// Vercel builds (production and preview) fail early on a misconfigured environment. Local builds are not checked.
if (process.env.VERCEL_ENV) assertEnv();

const isProd = process.env.NODE_ENV === "production";

/**
 * Content-Security-Policy. Next.js injects inline bootstrap scripts, so without nonces 'unsafe-inline' is needed
 * for scripts (dev also needs 'unsafe-eval' for React refresh). Fonts are self-hosted by next/font.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isProd ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self'${isProd ? "" : " ws: wss:"}`,
  "object-src 'none'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  ...(isProd ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  ...(isProd ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }] : []),
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // The social image reads its fonts from node_modules at runtime (src/lib/brand/og-fonts.ts); ship them with it.
  outputFileTracingIncludes: {
    "/opengraph-image": ["./node_modules/@fontsource/source-serif-4/files/*-latin-{500,600}-normal.woff", "./node_modules/@fontsource/public-sans/files/*-latin-{400,600}-normal.woff"],
  },
  experimental: {
    // Set by `next upgrade --agent=security` (16.4.0 → 16.4.2, security advisory).
    agentUpgrade: "security",
    // Documents are uploaded through Server Actions. Storage caps files at 4 MB and Vercel Functions reject bodies
    // over 4.5 MB; the public inquiry form allows up to 3 files of 4 MB in total.
    serverActions: { bodySizeLimit: "5mb" },
    // Vercel restores .next/cache between builds; with Turbopack's build cache on, a CSS edit in globals.css shipped
    // the previous stylesheet (the Tailwind loader's output was reused). Builds take ~40 s without it.
    turbopackFileSystemCacheForBuild: false,
  },
  turbopack: {
    root: __dirname,
    rules: {
      "*.css": { loaders: ["@tailwindcss/turbopack"], as: "*.css" },
    },
  },
  async redirects() {
    return [
      // Addresses used by the prototype and the draft sitemap.
      { source: "/article/:slug", destination: "/news/:slug", permanent: true },
      { source: "/members", destination: "/directory", permanent: true },
      { source: "/login", destination: "/portal/sign-in", permanent: false },
    ];
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/((?!api/).*)", headers: [{ key: "Content-Security-Policy", value: csp }] },
    ];
  },
};

export default nextConfig;
