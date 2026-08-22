import Link from "next/link"
import { Star, Code, FileCode, FileText, Layers, Binary, Shield, Key, Fingerprint, BarChart3, ArrowLeft} from "lucide-react"
import { getFavoriteTools } from "@/actions/favorites"
import { Arrow } from "@radix-ui/react-dropdown-menu"

const iconMap = {
  Code,
  FileCode,
  FileText,
  Layers,
  Binary,
  Shield,
  Key,
  Fingerprint,
  BarChart3,
}

export default async function FavoritesPage() {
  const favoriteTools = await getFavoriteTools()

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">

      <Link 
         href="/" 
         className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition mb-6">
         <ArrowLeft className="mr-2 h-4 w-4" />
         Back to Home
      </Link>   

      <div className="flex items-center gap-3 mb-8">
        <Star className="h-8 w-8 text-amber-500 fill-amber-500" />
        <h1 className="text-3xl font-bold">My Favorite Tools</h1>
      </div>

      {favoriteTools.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed rounded-xl">
          <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-semibold">No favorites yet</h3>
          <p className="text-muted-foreground mt-2 mb-6">
            Explore our tools and add them to your favorites for quick access!
          </p>
          <Link href="/" className="px-6 py-2 bg-primary text-white rounded-lg font-medium">
            Browse Tools
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favoriteTools.map((tool) => {
          const Icon = iconMap[tool.icon as keyof typeof iconMap] || Code

          return (
            <Link
              key={tool.slug}
              href={tool.href}
              className="group p-6 border border-border rounded-xl bg-card hover:border-primary transition-all duration-300"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                  <Icon className="h-6 w-6" />
                </div>

                <div>
                  <h2 className="font-semibold text-lg">{tool.name}</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {tool.description}
                  </p>
                </div>
              </div>
            </Link>
          )
        })}
        </div>
      )}
    </div>
  )
}
