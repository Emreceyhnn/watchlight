import type { MetadataRoute } from "next";
import { POSTS } from "@/lib/blog";
import { SITE_URL } from "@/lib/site";

/**
 * Public, indexable URLs: the landing page, the blog index and each post.
 * The dashboard and everything under /api stay out of the sitemap.
 * lastModified values are fixed dates from the content, not build time, so
 * crawlers only see a change when the content actually changes.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const latestPost = POSTS.reduce(
    (max, p) => (p.updated > max ? p.updated : max),
    POSTS[0]?.updated ?? "2026-11-24"
  );

  return [
    {
      url: `${SITE_URL}/`,
      lastModified: new Date("2026-11-24T13:54:10Z"),
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/blog`,
      lastModified: new Date(`${latestPost}T00:00:00Z`),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...POSTS.map((p) => ({
      url: `${SITE_URL}/blog/${p.slug}`,
      lastModified: new Date(`${p.updated}T00:00:00Z`),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
