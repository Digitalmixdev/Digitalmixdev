"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Database,
  Code,
  Calculator,
  FileText,
  ArrowRight,
  Rocket
} from "lucide-react"

interface Tool {
  name: string
  active: boolean
  href?: string
}

interface Category {
  name: string
  description: string
  icon: typeof Database
  toolCount: string
  href: string
  color: string
  borderColor: string
  iconColor: string
  tools: Tool[]
}

const categories: Category[] = [
  {
    name: "Database Tools",
    description: "SQL formatters, JSON beautifiers, CSV converters and more",
    icon: Database,
    toolCount: "3",
    href: "/tools/database",
    color: "from-blue-500/20 to-blue-600/5",
    borderColor: "hover:border-blue-500/50",
    iconColor: "text-blue-500",
    tools: [
      { name: "SQL Formatter", active: true, href: "/tools/sql-formatter" },
      { name: "JSON Formatter", active: true, href: "/tools/json-formatter" },
      { name: "CSV ↔ JSON", active: true, href: "/tools/csv-json" },
      { name: "JSON to SQL", active: false },
      { name: "Schema Generator", active: false },
    ]
  },
  {
    name: "Developer Utilities",
    description: "Regex testers, encoders, hash generators for developers",
    icon: Code,
    toolCount: "5",
    href: "/tools/developer",
    color: "from-emerald-500/20 to-emerald-600/5",
    borderColor: "hover:border-emerald-500/50",
    iconColor: "text-emerald-500",
    tools: [
      { name: "Regex Tester", active: true, href: "/tools/regex-tester" },
      { name: "Base64 Encoder/Decoder", active: true, href: "/tools/base64" },
      { name: "JWT Decoder/Encoder", active: true, href:"/tools/jwt"},
      { name: "Hash Generator", active: true, href: "/tools/hash-generator" },
      { name: "UUID Generator", active: true, href: "/tools/uuid-generator" },
    ]
  },
  {
    name: "Business KPI Calculators",
    description: "ROI, CAC, LTV and other business metrics calculators",
    icon: Calculator,
    toolCount: "3",
    href: "/tools/calculators",
    color: "from-amber-500/20 to-amber-600/5",
    borderColor: "hover:border-amber-500/50",
    iconColor: "text-amber-500",
    tools: [
      { name: "CAC & LTV Calculator", active: true, href: "/tools/kpi-calculator?tab=product" },
      { name: "Profit Margin Calculator", active: true, href: "/tools/kpi-calculator?tab=profit" },
      { name: "ROI Calculator", active: true, href: "/tools/kpi-calculator?tab=roi" },
    ]
  },
  {
    name: "File Utilities",
    description: "Convert, compress and transform files instantly",
    icon: FileText,
    toolCount: "4",
    href: "/tools/files",
    color: "from-rose-500/20 to-rose-600/5",
    borderColor: "hover:border-rose-500/50",
    iconColor: "text-rose-500",
    tools: [
      { name: "PDF Merger & Organizer", active: true, href: "/tools/pdf-merge" },
      { name: "Image Resizer", active: true, href: "/tools/image-resizer" },
      { name: "CSV Parser", active: false },
    ]
  },
]

function showComingSoon() {
  toast("Coming Soon!", {
    description: "We are working hard to build this tool for you.",
    icon: <Rocket className="h-4 w-4" />,
    duration: 3000,
  })
}

export function CategoriesGrid() {
  const router = useRouter()

  const handleToolClick = (tool: Tool, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (tool.active && tool.href) {
      router.push(tool.href)
    } else {
      showComingSoon()
    }
  }

  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground text-balance">
            Explore Our Tool Categories
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            Discover powerful utilities organized by category. All tools are free, fast, and privacy-focused.
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category) => (
            <Link
              key={category.name}
              href={category.href}
              className="group relative"
            >
              <div className={`relative h-full rounded-2xl border border-border/50 bg-card p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${category.borderColor}`}>
                {/* Background Gradient */}
                <div className={`absolute inset-0 rounded-2xl bg-linear-to-br ${category.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                <div className="relative">
                  {/* Icon and Tool Count */}
                  <div className="flex items-start justify-between mb-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-secondary ${category.iconColor}`}>
                      <category.icon className="h-6 w-6" />
                    </div>
                    <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                      {category.toolCount} tools
                    </span>
                  </div>

                  {/* Title and Description */}
                  <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {category.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                    {category.description}
                  </p>

                  {/* Tool Tags with Active/Soon States */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {category.tools.slice(0, 4).map((tool) => (
                      <button
                        key={tool.name}
                        onClick={(e) => handleToolClick(tool, e)}
                        className={`rounded-md px-2 py-0.5 text-xs transition-colors ${tool.active
                          ? "bg-primary/10 text-primary hover:bg-primary/20"
                          : "bg-secondary/80 text-muted-foreground/50 cursor-pointer"
                          }`}
                      >
                        <span className="flex items-center gap-1">
                          {tool.name}
                          {!tool.active && (
                            <span className="text-[9px] opacity-70">Soon</span>
                          )}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Arrow */}
                  <div className="flex items-center gap-1 text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">
                    <span>Explore tools</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
