import type { MetadataRoute } from "next";

const SITE_URL = "https://ember.buzz";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Per-user session pages and the API have nothing to index.
      disallow: ["/api/", "/play/", "/sessions", "/setup"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
