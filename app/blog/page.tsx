import { Metadata } from 'next'
import Script from 'next/script'
import { BLOG_POSTS } from "@/constants/posts"
import Link from "next/link"
import { ArrowLeft, BookOpen, Calendar, Clock, Sparkles } from "lucide-react"

export const metadata: Metadata = {
  title: "Blog & Developer Guides | DigitalMix",
  description: "Explore expert guides, tutorials, and insights on data processing, SQL, privacy-first developer tools, and file utilities.",
  keywords: ['developer blog', 'tech tutorials', 'programming guides', 'DigitalMix blog', 'database tutorials', 'json guides', 'sql tips', 'file converter guides'],
  alternates: {
    canonical: 'https://www.digitalmix.dev/blog',
  },
  openGraph: {
    title: "Blog & Developer Guides | DigitalMix",
    description: "Explore expert guides, tutorials, and insights on data processing, SQL, and privacy-focused developer tools.",
    type: 'website',
    url: 'https://www.digitalmix.dev/blog',
  }
}

export default function BlogPage() {
  const siteUrl = 'https://www.digitalmix.dev'

  const blogCollectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'DigitalMix Developer & Utility Blog',
    description: 'Expert guides, tutorials, and architectural overviews for DigitalMix tools',
    url: `${siteUrl}/blog`,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: BLOG_POSTS.map((post, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: `${siteUrl}/blog/${post.slug}`,
        headline: post.title,
        description: post.description,
        datePublished: post.date,
      })),
    },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: `${siteUrl}/blog` },
      ],
    },
  }

  const firstPost = BLOG_POSTS[0]
  const remainingPosts = BLOG_POSTS.slice(1)

  return (
    <main className="min-h-screen py-16 px-4 bg-background">
      <Script
        id="blog-collection-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogCollectionSchema) }}
      />
      <div className="max-w-5xl mx-auto">
        <Link 
          href="/" 
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition mb-8 group"
        >
          <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back to Home
        </Link>

        <header className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-3">
            <BookOpen className="h-3.5 w-3.5" />
            <span>DigitalMix Knowledge Hub</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
            Guides & Developer Articles
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            In-depth guides, practical tutorials, and security overviews for developer tools, file utilities, calculators, and database management.
          </p>
        </header>

        {/* Featured Flagship First Post */}
        {firstPost && (
          <section className="mb-14">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span>Featured Platform Guide</span>
            </div>
            <Link 
              href={`/blog/${firstPost.slug}`}
              className="block group relative rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-primary/10 p-6 sm:p-8 hover:border-primary/60 transition-all shadow-sm hover:shadow-md"
            >
              <div className="flex flex-wrap items-center gap-3 text-xs font-mono mb-3">
                <span className="px-2.5 py-0.5 rounded-full bg-primary text-primary-foreground font-semibold">
                  {firstPost.category}
                </span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  {firstPost.date}
                </span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  10 min read
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold group-hover:text-primary transition-colors mb-3">
                {firstPost.title}
              </h2>
              <p className="text-muted-foreground text-base sm:text-lg mb-6 leading-relaxed">
                {firstPost.description}
              </p>
              <div className="inline-flex items-center text-sm font-semibold text-primary group-hover:translate-x-1 transition-transform">
                Read Full Platform Guide & Tool Manual →
              </div>
            </Link>
          </section>
        )}

        {/* Remaining Tool & Topic Posts */}
        <section>
          <h2 className="text-2xl font-bold mb-6">All Articles & Tool Tutorials</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {remainingPosts.map((post) => (
              <Link 
                key={post.slug} 
                href={`/blog/${post.slug}`} 
                className="group flex flex-col justify-between p-6 border rounded-xl hover:border-primary/50 hover:shadow-sm transition-all bg-card"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 text-xs font-mono mb-3">
                    <span className="px-2.5 py-0.5 rounded-full bg-secondary text-secondary-foreground font-medium">
                      {post.category}
                    </span>
                    <span className="text-muted-foreground text-xs flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {post.date}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold group-hover:text-primary transition-colors mb-2">
                    {post.title}
                  </h3>
                  <p className="text-muted-foreground text-sm line-clamp-3 mb-4">
                    {post.description}
                  </p>
                </div>
                <div className="text-xs font-semibold text-primary group-hover:translate-x-1 transition-transform">
                  Read article →
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
