import Fuse from 'fuse.js'
import { ALL_TOOLS, getCategoryById } from '@/constants/tools'

const searchableTools = ALL_TOOLS.map((tool) => {
  const category = getCategoryById(tool.categoryId)
  return {
    ...tool,
    categoryName: category?.name || '',
    categorySlug: category?.slug || '',
  }
})

export const toolsFuse = new Fuse(searchableTools, {
  keys: [
    { name: 'name', weight: 0.4 },
    { name: 'keywords', weight: 0.3 },
    { name: 'categoryName', weight: 0.15 },
    { name: 'description', weight: 0.1 },
    { name: 'href', weight: 0.05 },
  ],
  threshold: 0.35,
  minMatchCharLength: 1,
})