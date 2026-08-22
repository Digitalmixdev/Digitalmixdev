import { Metadata } from 'next'
import Script from 'next/script'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getCategoryBySlug, TOOL_CATEGORIES } from '@/constants/toolCategories'
import { notFound } from 'next/navigation'

// تحديث الواجهة لتقبل الـ params كـ Promise أو ككائن عادي لتجنب أي تضارب
interface Props {
  params: Promise<{ category: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params
  const categoryData = getCategoryBySlug(resolvedParams.category)
  
  if (!categoryData) {
    return {
      title: 'Category Not Found',
      description: 'The requested tool category could not be found.',
    }
  }

  return {
    title: `${categoryData.name} | DigitalMix - Free Developer Tools`,
    description: categoryData.description,
    keywords: [
      categoryData.name.toLowerCase(),
      'tools',
      'free tools',
      ...categoryData.tools.map(t => t.name.toLowerCase()),
    ],
    alternates: {
      canonical: `https://www.digitalmix.dev/tools/${categoryData.slug}`,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },    
    openGraph: {
      title: `${categoryData.name} | DigitalMix`,
      description: categoryData.description,
      type: 'website',
      url: `https://www.digitalmix.dev/tools/${categoryData.slug}`,
      images: [
        {
          url: 'https://www.digitalmix.dev/og-image.png',
          width: 1200,
          height: 630,
          alt: `${categoryData.name} - DigitalMix Tools`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${categoryData.name} Tools`,
      description: categoryData.description,
      images: ['https://www.digitalmix.dev/og-image.png'],
    },
  }
}

export async function generateStaticParams() {
  return TOOL_CATEGORIES.map((cat) => ({
    category: cat.slug,
  }))
}

// تحويل المكون إلى دالة async لانتظار الـ params بشكل صحيح
export default async function ToolsCategoryPage({ params }: Props) {
  // فك الـ Promise هنا لحل مشكلة عدم التعرف على الروابط
  const resolvedParams = await params
  const categoryData = getCategoryBySlug(resolvedParams.category)

  if (!categoryData) {
    notFound()
  }

  const siteUrl = 'https://www.digitalmix.dev'
  const categoryUrl = `${siteUrl}/tools/${categoryData.slug}`

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${categoryUrl}#webpage`,
        name: categoryData.name,
        description: categoryData.description,
        url: categoryUrl,
        mainEntity: {
          '@type': 'ItemList',
          itemListElement: categoryData.tools.map((tool, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            item: {
              '@type': 'WebApplication',
              '@id': `${siteUrl}${tool.href}`,
              name: tool.name,
              url: `${siteUrl}${tool.href}`,
              description: tool.description,
              applicationCategory: 'DeveloperApplication',
              operatingSystem: 'Any'
            }
          })),
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
          { '@type': 'ListItem', position: 2, name: 'Tools', item: `${siteUrl}/tools` },
          { '@type': 'ListItem', position: 3, name: categoryData.name, item: categoryUrl },
        ],
      },
    ],
  }

  return (
    <>
      <Script
        id="category-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        suppressHydrationWarning
      />
      <main className="min-h-screen py-16 px-4 bg-background">
        <div className="max-w-6xl mx-auto">
          <Link 
            href="/" 
            className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition mb-8"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>

          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-balance">
              {categoryData.name}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              {categoryData.description}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categoryData.tools.map((tool) => (
              <Link
                key={tool.id}
                href={tool.href}
                className="group relative p-6 rounded-lg border border-border/50 hover:border-primary/50 transition-all duration-200 hover:shadow-lg hover:shadow-primary/10 bg-card hover:bg-card/80"
              >
                <div className="space-y-3">
                  <h3 className="text-xl font-semibold group-hover:text-primary transition">
                    {tool.name}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {tool.description}
                  </p>
                </div>
                <div className="pt-4 mt-4 border-t border-border/30">
                  <span className="inline-flex text-sm font-medium text-primary group-hover:translate-x-1 transition-transform">
                    Explore Tool →
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {categoryData.tools.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">
                No tools available in this category yet.
              </p>
            </div>
          )}

          <div className="mt-16 pt-8 border-t border-border/30">
            <h2 className="text-2xl font-bold mb-8">Other Categories</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {TOOL_CATEGORIES.filter(cat => cat.slug !== categoryData.slug).map((cat) => (
                <Link
                  key={cat.id}
                  href={`/tools/${cat.slug}`}
                  className="p-4 rounded-lg border border-border/50 hover:border-primary/50 hover:bg-primary/5 transition text-center"
                >
                  <div className="text-2xl mb-2">{cat.icon}</div>
                  <h3 className="font-semibold hover:text-primary transition">{cat.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {cat.tools.length} tool{cat.tools.length !== 1 ? 's' : ''}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>
    </>
  )
}