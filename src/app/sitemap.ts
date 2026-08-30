import type { MetadataRoute } from "next";
import { TYPE_DISPLAY_ASSETS } from "@/app/diagnoses/[diagnosisId]/results/[typeId]/result-assets";

const TYPE_IDS = Object.keys(TYPE_DISPLAY_ASSETS);

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://human-os.site";
  const lastModified = new Date("2026-08-30");

  const typePages: MetadataRoute.Sitemap = TYPE_IDS.map((typeId) => ({
    url: `${base}/diagnoses/business-skills/types/${typeId}`,
    lastModified,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [
    {
      url: `${base}/`,
      lastModified,
      changeFrequency: "monthly",
      priority: 1.0,
    },
    {
      url: `${base}/diagnoses/business-skills`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${base}/diagnoses/business-skills/types`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    ...typePages,
    {
      url: `${base}/privacy`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${base}/terms`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
