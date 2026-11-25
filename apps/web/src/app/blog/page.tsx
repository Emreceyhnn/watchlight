import type { Metadata } from "next";
import Link from "next/link";
import LandingHeader from "@/components/landing/LandingHeader";
import LandingFooter from "@/components/landing/LandingFooter";
import { card, container, eyebrow, h2, lead } from "@/components/landing/ui";
import { POSTS } from "@/lib/blog";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const TITLE = `Blog — ${SITE_NAME}`;
const DESCRIPTION =
  "Notes on building and running Watchlight: detection rules, MITRE ATT&CK mapping and self-hosting an open-source mini-SIEM.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/blog" },
  openGraph: {
    type: "website",
    url: "/blog",
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export default function BlogIndex() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "@id": `${SITE_URL}/blog#blog`,
    url: `${SITE_URL}/blog`,
    name: TITLE,
    description: DESCRIPTION,
    inLanguage: "en",
    blogPost: POSTS.map((p) => ({
      "@type": "BlogPosting",
      headline: p.title,
      url: `${SITE_URL}/blog/${p.slug}`,
      datePublished: p.published,
    })),
  };

  return (
    <div className="landing">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <LandingHeader />
      <main id="main-content" tabIndex={-1} className="py-16 md:py-24">
        <div className={container}>
          <p className={eyebrow}>Blog</p>
          <h1 className={`${h2} mt-4`}>Notes from building Watchlight</h1>
          <p className={`${lead} mt-4 max-w-2xl`}>{DESCRIPTION}</p>

          <ul className="mt-12 grid gap-6 md:grid-cols-2">
            {POSTS.map((post) => (
              <li key={post.slug}>
                <article className={`${card} flex h-full flex-col`}>
                  <p className="font-mono text-xs uppercase tracking-wider text-gray-500">
                    <time dateTime={post.published}>
                      {formatDate(post.published)}
                    </time>{" "}
                    · {post.readMinutes} min read
                  </p>
                  <h2 className="mt-3 font-heading text-xl font-bold text-white">
                    <Link
                      href={`/blog/${post.slug}`}
                      className="hover:text-soc-accent"
                    >
                      {post.title}
                    </Link>
                  </h2>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-gray-400">
                    {post.description}
                  </p>
                </article>
              </li>
            ))}
          </ul>
        </div>
      </main>
      <LandingFooter />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
    </div>
  );
}
