import { Metadata } from 'next'
import Script from 'next/script'
import Link from 'next/link'
import {
  Database,
  Code,
  Calculator,
  FileText,
  FileCode,
  FileSpreadsheet,
  Binary,
  Shield,
  Fingerprint,
  Key,
  BarChart3,
  TrendingUp,
  Layers,
  Maximize2,
  QrCode,
  FileArchive,
  File,
  ArrowRight,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react'
import { getCategoryBySlug, TOOL_CATEGORIES } from '@/constants/tools'
import { notFound } from 'next/navigation'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'

interface Props {
  params: Promise<{ category: string }>
}

const categoryIcons: Record<string, LucideIcon> = {
  database: Database,
  developer: Code,
  calculators: Calculator,
  files: FileText,
}

const toolIcons: Record<string, LucideIcon> = {
  Database,
  Code,
  FileCode,
  FileSpreadsheet,
  FileText,
  FileArchive,
  File,
  Binary,
  Shield,
  Fingerprint,
  Key,
  BarChart3,
  Calculator,
  TrendingUp,
  Layers,
  Maximize2,
  QrCode,
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
  const CategoryIcon = categoryIcons[categoryData.id] || Layers

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
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center text-xs font-medium text-muted-foreground gap-1.5" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
            <ChevronRight className="h-3 w-3 opacity-50" />
            <Link href="/tools" className="hover:text-foreground transition-colors">
              Tools Directory
            </Link>
            <ChevronRight className="h-3 w-3 opacity-50" />
            <span className="text-foreground font-semibold">{categoryData.name}</span>
          </nav>

          {/* Category Hero Section */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-8 rounded-3xl border border-border/70 bg-card shadow-xs">
            <div className="p-4 rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-inner shrink-0">
              <CategoryIcon className="h-8 w-8" />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-widest text-primary px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                  {categoryData.tools.length} Available Tools
                </span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                {categoryData.name}
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground max-w-3xl leading-relaxed">
                {categoryData.description}
              </p>
            </div>
          </div>

          {/* Tools Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categoryData.tools.map((tool) => {
              const isActive = tool.active !== false
              const ToolIcon = toolIcons[tool.icon] || Code
              return (
                <Link
                  key={tool.id}
                  href={isActive ? tool.href : '#'}
                  className={`group relative p-6 rounded-2xl border border-border/70 bg-card hover:border-primary/40 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between ${
                    !isActive ? 'opacity-60 cursor-not-allowed' : ''
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                        <ToolIcon className="h-5 w-5" />
                      </div>
                      {!isActive && (
                        <span className="text-[10px] font-bold bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                          Coming Soon
                        </span>
                      )}
                    </div>

                    <h2 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                      {tool.name}
                    </h2>
                    <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                      {tool.description}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-border/40 flex items-center justify-between text-xs font-semibold text-primary">
                    <span>{isActive ? 'Launch Utility' : 'In Development'}</span>
                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              )
            })}
          </div>

          {categoryData.tools.length === 0 && (
            <div className="text-center py-16 p-8 rounded-2xl border border-dashed border-border/80 bg-card/40">
              <p className="text-muted-foreground text-sm font-medium">
                No tools are currently published in this category. Check back shortly.
              </p>
            </div>
          )}

          {/* Explore Other Categories */}
          <div className="pt-8 border-t border-border/60 space-y-6">
            <h2 className="text-lg font-bold text-foreground">Explore Other Categories</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {TOOL_CATEGORIES.filter((cat) => cat.slug !== categoryData.slug).map((cat) => {
                const CatIcon = categoryIcons[cat.id] || Layers
                return (
                  <Link
                    key={cat.id}
                    href={`/tools/${cat.slug}`}
                    className="p-5 rounded-2xl border border-border/70 bg-card hover:border-primary/40 hover:bg-secondary/40 transition-all flex items-center gap-4 group shadow-xs"
                  >
                    <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:scale-105 transition-transform shrink-0">
                      <CatIcon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate">
                        {cat.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {cat.tools.length} tool{cat.tools.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </main>

      {/* Global Application Footer */}
      <Footer />
    </div>
  )
}