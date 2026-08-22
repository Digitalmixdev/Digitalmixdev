import { Metadata } from 'next'
import Script from 'next/script'
import { BLOG_POSTS } from "@/constants/posts"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export const metadata: Metadata = {
  title: "Blog | DigitalMix - Tools & Guides",
  description: "Explore our expert guides and tutorials on data processing, SQL, and developer tools.",
  keywords: ['developer blog', 'tech tutorials', 'programming guides', 'DigitalMix blog', 'database tutorials', 'json guides', 'sql tips'],
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
    name: 'DigitalMix Developer Blog',
    description: 'Expert guides and tutorials on developer tools',
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
  };
  return (
    <main className="min-h-screen py-16 px-4 bg-background">
      <Script
        id="blog-collection-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogCollectionSchema) }}
      />
      <div className="max-w-4xl mx-auto">
        
        <Link 
          href="/" 
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>

        <h1 className="text-4xl font-bold mb-8">DigitalMix Blog</h1>
        
        <div className="grid gap-6">
          {BLOG_POSTS.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="block p-6 border rounded-lg hover:border-primary transition">
              <span className="text-xs font-mono text-primary">{post.category}</span>
              <h2 className="text-2xl font-semibold">{post.title}</h2>
              <p className="text-muted-foreground mt-2">{post.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
