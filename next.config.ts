import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  redirects() {
    return [
      // The craftsmanship story moved when the store was renamed to Halden.
      { source: "/stories/atelier", destination: "/stories/workshop", permanent: true },
    ];
  },
};

export default nextConfig;
