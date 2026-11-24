import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * The app is a single-route SOC portal (login or dashboard on "/"), so the
 * sitemap lists only the root. Everything under /api is machine-only.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${SITE_URL}/`,
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
