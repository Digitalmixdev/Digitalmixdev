import { BLOG_POSTS } from "@/constants/posts";
import ReactMarkdown from "react-markdown";
import remarkGfm from 'remark-gfm'
import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const post = BLOG_POSTS.find((p) => p.slug === slug);

  if (!post) return {};

  const siteUrl = "https://www.digitalmix.dev";

  return {
    title: `${post.title} | DigitalMix`,
    description: post.description,
    alternates: {
      canonical: `${siteUrl}/blog/${post.slug}`,
    },
  };
}

export default async function BlogPostPage({ params }: { params: Params }) {
  const { slug } = await params;
  const post = BLOG_POSTS.find((p) => p.slug === slug);

  if (!post) {
    notFound();
  }

  const siteUrl = "https://www.digitalmix.dev";

  const related = BLOG_POSTS.filter(p =>
    post.relatedSlugs?.includes(p.slug) ||
    (p.category === post.category && p.slug !== post.slug)
  ).slice(0, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": `${siteUrl}/blog/${post.slug}/#article`,
        "headline": post.title,
        "description": post.description,
        "datePublished": post.date,
        "dateModified": post.date,
        "url": `${siteUrl}/blog/${post.slug}`,
        "author": {
          "@type": "Organization",
          "name": "DigitalMix",
          "url": siteUrl,
        },
        "publisher": {
          "@type": "Organization",
          "name": "DigitalMix",
          "logo": { "@type": "ImageObject", "url": `${siteUrl}/digitalmix.png` }
        },
        "image": {
          "@type": "ImageObject",
          "url": `${siteUrl}/og-image.png`,
          "width": 1200,
          "height": 630,
        },
        "isPartOf": {
          "@id": `${siteUrl}/blog/#website`,
        },
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": siteUrl },
          { "@type": "ListItem", "position": 2, "name": "Blog", "item": `${siteUrl}/blog` },
          { "@type": "ListItem", "position": 3, "name": post.title, "item": `${siteUrl}/blog/${post.slug}` }
        ]
      },
      {
        "@type": "WebPage",
        "@id": `${siteUrl}/blog/${post.slug}/#webpage`,
        "name": post.title,
        "description": post.description,
        "url": `${siteUrl}/blog/${post.slug}`,
      }
    ]
  };

  return (
    <main className="py-16 px-4 max-w-3xl mx-auto">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article>
        <h1 className="text-4xl font-bold mb-8">{post.title}</h1>

        <div className="prose dark:prose-invert text-lg leading-relaxed max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
        </div>

        {post.toolUrl && (
          <div className="my-10 p-6 bg-primary/10 rounded-xl border border-primary/20 text-center">
            <h3 className="font-bold text-lg">Ready to try it yourself?</h3>
            <Link
              href={post.toolUrl}
              className="mt-4 inline-block bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors"
            >
              Use our {post.toolName || "Tool"} now
            </Link>
          </div>
        )}

      </article>

      {related.length > 0 && (
        <section className="mt-16 border-t pt-8">
          <h2 className="text-xl font-bold mb-4">Related Articles</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {related.map(r => (
              <Link
                key={r.slug}
                href={`/blog/${r.slug}`}
                className="p-4 border rounded-xl hover:border-primary transition-all hover:shadow-md"
              >
                <h3 className="font-semibold">{r.title}</h3>
                <span className="text-xs text-muted-foreground">{r.category}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
