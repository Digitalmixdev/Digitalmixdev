import Fuse from "fuse.js"
import { TOOL_CATEGORIES } from "@/constants/toolCategories"

const allTools = TOOL_CATEGORIES.flatMap(cat =>
  cat.tools.map(tool => ({
    ...tool,
    active: tool.active !== false,
    categoryName: cat.name,
    categorySlug: cat.slug
  }))
)

export const toolsFuse = new Fuse(allTools, {
  keys: [
    { name: "name", weight: 0.5 },
    { name: "categoryName", weight: 0.3 }, // تفعيل البحث باسم القسم
    { name: "description", weight: 0.1 },
    { name: "href", weight: 0.1 } // تفعيل البحث بالرابط عشان يلقط ?tab=roi أو cac
  ],
  threshold: 0.4,
  minMatchCharLength: 1
})