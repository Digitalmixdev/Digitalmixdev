import { BLOG_POSTS } from "@/constants/posts";
import ReactMarkdown from "react-markdown";
import remarkGfm from 'remark-gfm'
import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import { ArrowLeft, BookOpen, Calendar, Clock } from "lucide-react";

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
    <main className="py-12 px-4 max-w-3xl mx-auto">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Return Button Top */}
      <div className="mb-8">
        <Link
          href="/blog"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition group"
        >
          <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Return to Blog Page
        </Link>
      </div>

      <article>
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono mb-4 text-muted-foreground">
          <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
            {post.category}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {post.date}
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-8 leading-tight">
          {post.title}
        </h1>

        <div className="prose dark:prose-invert text-lg leading-relaxed max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
        </div>

        {post.toolUrl && (
          <div className="my-10 p-6 bg-primary/10 rounded-xl border border-primary/20 text-center">
            <h3 className="font-bold text-lg">Ready to try it yourself?</h3>
            <Link
              href={post.toolUrl}
              className="mt-4 inline-block bg-primary text-primary-foreground font-semibold px-6 py-2.5 rounded-lg hover:bg-primary/90 transition-colors"
            >
              Use our {post.toolName || "Tool"} now
            </Link>
          </div>
        )}


      </article>

      {related.length > 0 && (
        <section className="mt-16 border-t pt-8">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Related Articles
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {related.map(r => (
              <Link
                key={r.slug}
                href={`/blog/${r.slug}`}
                className="p-4 border rounded-xl hover:border-primary transition-all hover:shadow-md bg-card"
              >
                <h3 className="font-semibold text-base mb-1">{r.title}</h3>
                <span className="text-xs text-muted-foreground font-mono">{r.category} • {r.date}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
