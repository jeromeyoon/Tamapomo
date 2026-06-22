import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || ".next",
  outputFileTracingRoot: projectRoot,
  // Capacitor iOS 앱용 정적 빌드
  ...(process.env.NEXT_BUILD_STATIC === 'true' && {
    output: 'export',
    distDir: 'out',
  }),
};

export default nextConfig;
