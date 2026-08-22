import { BLOG_POSTS } from "@/constants/posts"
import { TOOL_CATEGORIES, ALL_TOOLS } from "@/constants/tools"
import { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.digitalmix.dev'

  const staticRoutes = [
    '',
    '/about',
    '/privacy-policy',
    '/terms',
    '/blog',
    '/tools',
  ]

  const staticEntries = staticRoutes.map((route) => {
    const isHomePage = route === ''
    const isToolsIndex = route === '/tools'
    const isLegal = ['/about', '/privacy-policy', '/terms'].includes(route)

    return {
      url: `${baseUrl}${route}`,
      lastModified: new Date(),
      changeFrequency: isHomePage ? ('daily' as const) : isToolsIndex ? ('daily' as const) : ('monthly' as const),
      priority: isHomePage ? 1.0 : isToolsIndex ? 0.95 : isLegal ? 0.3 : 0.5,
    }
  })

  // Tool specific pages (deduplicated by path without query params)
  const uniqueToolPaths = Array.from(
    new Set(
      ALL_TOOLS.filter((t) => t.active).map((tool) => tool.href.split('?')[0])
    )
  )

  const toolEntries = uniqueToolPaths.map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  }))

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
    ...toolEntries,
    ...blogEntries,
  ]
}
