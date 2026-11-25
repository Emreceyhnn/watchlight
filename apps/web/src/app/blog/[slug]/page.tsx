import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import LandingHeader from "@/components/landing/LandingHeader";
import LandingFooter from "@/components/landing/LandingFooter";
import { container, eyebrow, h2 } from "@/components/landing/ui";
import { POSTS, getPost, type Block } from "@/lib/blog";
import { SITE_NAME, SITE_URL } from "@/lib/site";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return { title: "Post not found" };

  const path = `/blog/${post.slug}`;
  return {
    title: { absolute: `${post.title} — ${SITE_NAME}` },
    description: post.description,
    alternates: { canonical: path },
    openGraph: {
      type: "article",
      url: path,
      siteName: SITE_NAME,
      title: post.title,
      description: post.description,
      publishedTime: post.published,
      modifiedTime: post.updated,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
  };
}

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

function Renderer({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((b, i) => {
        switch (b.type) {
          case "h2":
            return (
              <h2 key={i} className="mt-12 font-heading text-2xl font-bold text-white">
                {b.text}
              </h2>
            );
          case "p":
            return (
              <p key={i} className="mt-4 leading-relaxed text-gray-300">
                {b.text}
              </p>
            );
          case "ul":
            return (
              <ul key={i} className="mt-4 list-disc space-y-2 pl-6 text-gray-300">
                {b.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            );
          case "code":
            return (
              <pre
                key={i}
                className="mt-6 overflow-x-auto rounded-lg border border-soc-border bg-soc-card p-4 font-mono text-sm text-gray-200"
              >
                <code data-lang={b.lang}>{b.code}</code>
              </pre>
            );
        }
      })}
    </>
  );
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${SITE_URL}/blog/${post.slug}#post`,
    headline: post.title,
    description: post.description,
    url: `${SITE_URL}/blog/${post.slug}`,
    mainEntityOfPage: `${SITE_URL}/blog/${post.slug}`,
    datePublished: post.published,
    dateModified: post.updated,
    inLanguage: "en",
    author: { "@type": "Organization", name: SITE_NAME },
    publisher: { "@type": "Organization", name: SITE_NAME },
  };

  return (
    <div className="landing">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <LandingHeader />
      <main id="main-content" tabIndex={-1} className="py-16 md:py-24">
        <article className={`${container} max-w-3xl`}>
          <Link href="/blog" className="text-sm text-gray-400 hover:text-white">
            ← All posts
          </Link>
          <p className={`${eyebrow} mt-8`}>
            <time dateTime={post.published}>{formatDate(post.published)}</time>{" "}
            · {post.readMinutes} min read
          </p>
          <h1 className={`${h2} mt-4`}>{post.title}</h1>
          <p className="mt-4 text-lg leading-relaxed text-gray-400">
            {post.description}
          </p>
          <div className="mt-10">
            <Renderer blocks={post.body} />
          </div>
        </article>
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
