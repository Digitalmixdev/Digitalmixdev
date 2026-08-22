import Link from 'next/link'
import {
  FileQuestion,
  Home,
  Search,
  Database,
  FileCode,
  Key,
  Shield,
  Layers,
  ArrowRight,
  Code,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'

const popularTools = [
  {
    name: 'SQL Formatter',
    href: '/tools/sql-formatter',
    icon: Database,
    desc: 'Format, parse, and beautify queries with multi-dialect support.',
  },
  {
    name: 'JSON Formatter',
    href: '/tools/json-formatter',
    icon: FileCode,
    desc: 'Validate and format structured JSON payloads with tree depth metrics.',
  },
  {
    name: 'Regex Tester',
    href: '/tools/regex-tester',
    icon: Code,
    desc: 'Test regular expressions with real-time match group highlighting.',
  },
  {
    name: 'Hash Generator',
    href: '/tools/hash-generator',
    icon: Key,
    desc: 'Compute MD5, SHA-256, and SHA-512 cryptographic digests locally.',
  },
  {
    name: 'JWT Decoder',
    href: '/tools/jwt',
    icon: Shield,
    desc: 'Inspect header tokens, payload claims, and HMAC signatures.',
  },
  {
    name: 'PDF Merger',
    href: '/tools/pdf-merge',
    icon: Layers,
    desc: 'Merge, reorder, and assemble multi-page PDF documents.',
  },
]

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />

      <main className="flex-1 py-16 px-4 sm:px-6 lg:px-8 flex items-center">
        <div className="max-w-4xl mx-auto w-full space-y-12 text-center">
          {/* 404 Hero */}
          <div className="space-y-4 max-w-lg mx-auto">
            <div className="mx-auto w-16 h-16 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-inner">
              <FileQuestion className="h-8 w-8" />
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                404 • Page Not Found
              </span>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-foreground pt-2">
                Lost in the Matrix?
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                The developer tool or page you requested does not exist or may have been relocated.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Button asChild className="h-11 px-6 text-xs font-bold rounded-xl shadow-lg shadow-primary/20">
                <Link href="/" className="flex items-center gap-2">
                  <Home className="h-4 w-4" /> Return to Home
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-11 px-6 text-xs font-semibold rounded-xl border-border">
                <Link href="/tools" className="flex items-center gap-2">
                  <Search className="h-4 w-4" /> Browse Tools Directory
                </Link>
              </Button>
            </div>
          </div>

          {/* Suggested Popular Tools */}
          <div className="space-y-6 pt-6 border-t border-border/50 text-left">
            <div className="text-center sm:text-left">
              <h2 className="text-base font-bold text-foreground">
                Looking for one of our developer utilities?
              </h2>
              <p className="text-xs text-muted-foreground">
                Here are our most popular high-performance utilities:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {popularTools.map((tool) => {
                const Icon = tool.icon
                return (
                  <Link
                    key={tool.name}
                    href={tool.href}
                    className="p-5 rounded-2xl border border-border/70 bg-card hover:border-primary/40 hover:bg-secondary/40 transition-all flex flex-col justify-between group shadow-xs hover:-translate-y-0.5 duration-200"
                  >
                    <div className="space-y-2">
                      <div className="p-2.5 rounded-xl bg-primary/10 text-primary w-fit group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <Icon className="h-4 w-4" />
                      </div>
                      <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                        {tool.name}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {tool.desc}
                      </p>
                    </div>

                    <div className="pt-3 mt-3 border-t border-border/30 flex items-center justify-between text-xs font-semibold text-primary">
                      <span>Launch Tool</span>
                      <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
