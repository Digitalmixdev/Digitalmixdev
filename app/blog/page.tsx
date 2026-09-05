import { Metadata } from 'next'
import Script from 'next/script'
import { BLOG_POSTS } from "@/constants/posts"
import Link from "next/link"
import { ArrowLeft, BookOpen } from "lucide-react"
import { BlogList } from "@/components/blog-list"

export const metadata: Metadata = {
  title: "Blog & Developer Guides | DigitalMix",
  description: "Explore expert guides, tutorials, and insights on data processing, SQL, color extraction, binary encoding, privacy-first developer tools, and file utilities.",
  keywords: ['developer blog', 'tech tutorials', 'programming guides', 'DigitalMix blog', 'database tutorials', 'json guides', 'sql tips', 'file converter guides', 'color extraction', 'binary translator'],
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

        <header className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-3">
            <BookOpen className="h-3.5 w-3.5" />
            <span>DigitalMix Knowledge Hub</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
            Guides & Developer Articles
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            In-depth technical guides, practical tutorials, and security overviews for developer tools, media utilities, calculators, and database management.
          </p>
        </header>

        {/* Interactive Blog List with Search & Category Filters */}
        <BlogList posts={BLOG_POSTS} />
      </div>
    </main>
  )
}

