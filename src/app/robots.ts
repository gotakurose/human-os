import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: "https://human-os.site/sitemap.xml",
    host: "https://human-os.site",
  };
}
