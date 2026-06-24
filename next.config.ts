import type { NextConfig } from "next";
// @ts-expect-error - next-pwa אין לו טיפוסי TypeScript רשמיים
import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  /* config options here */
};

export default withPWA(nextConfig);