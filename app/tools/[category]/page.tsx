import { Metadata } from 'next'
import Script from 'next/script'
import { getCategoryBySlug, TOOL_CATEGORIES } from '@/constants/tools'
import { notFound } from 'next/navigation'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { CategoryView } from '@/components/category-view'

interface Props {
  params: Promise<{ category: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params
  const categoryData = getCategoryBySlug(resolvedParams.category)

  if (!categoryData) {
    return {
      title: 'Category Not Found | DigitalMix',
      description: 'The requested tool category could not be found.',
    }
  }

  return {
    title: `${categoryData.name} Tools | DigitalMix - Free Developer Utilities`,
    description: categoryData.description,
    keywords: [
      categoryData.name.toLowerCase(),
      'developer tools',
      'free web utilities',
      ...categoryData.tools.map((t) => t.name.toLowerCase()),
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
      title: `${categoryData.name} Tools | DigitalMix`,
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

export default async function ToolsCategoryPage({ params }: Props) {
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
              operatingSystem: 'Any',
            },
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
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Script
        id="category-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        suppressHydrationWarning
      />

      {/* Global Application Header */}
      <Header />

      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
        <CategoryView category={categoryData} />
      </main>

      {/* Global Application Footer */}
      <Footer />
    </div>
  )
}
