import { BLOG_POSTS } from "@/constants/posts";
import { TOOL_CATEGORIES } from "@/constants/toolCategories";
import { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.digitalmix.dev'

  const staticRoutes = [
    '',
    '/about',
    '/privacy-policy',
    '/terms',
    '/blog',
    '/tools/sql-formatter',
    '/tools/json-formatter',
    '/tools/csv-json',
    '/tools/regex-tester',
    '/tools/base64',
    '/tools/jwt',
    '/tools/hash-generator',
    '/tools/uuid-generator',
    '/tools/kpi-calculator',
    '/tools/pdf-merge',
    '/tools/image-resizer',
    '/tools/qr-code-generator'
  ]

  // staticRoutes
  const staticEntries = staticRoutes.map((route) => {
    const isHomePage = route === '';
    const isTool = route.startsWith('/tools');
    const isLegal = ['/about', '/privacy-policy', '/terms'].includes(route);

    return {
      url: `${baseUrl}${route}`,
      lastModified: new Date(),
      changeFrequency: isHomePage ? ('daily' as const) : isTool ? ('weekly' as const) : ('monthly' as const),
      priority: isHomePage ? 1.0 : isTool ? 0.9 : isLegal ? 0.3 : 0.5,
    }
  })

  // Category pages
  const categoryEntries = TOOL_CATEGORIES.map((category) => ({
    url: `${baseUrl}/tools/${category.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  const blogEntries = BLOG_POSTS.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: post.date || new Date().toISOString().split('T')[0],
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  return [
    ...staticEntries,
    ...categoryEntries,
    ...blogEntries
  ]
}
