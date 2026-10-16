import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Photos are served straight from Supabase Storage with plain <img> tags,
  // so no remote image config is needed.
  poweredByHeader: false,
};

export default nextConfig;
