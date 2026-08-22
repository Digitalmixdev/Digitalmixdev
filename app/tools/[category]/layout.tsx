import { TOOL_CATEGORIES } from '@/constants/tools'

export async function generateStaticParams() {
  return TOOL_CATEGORIES.map((cat) => ({
    category: cat.slug,
  }))
}

export default function CategoryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
