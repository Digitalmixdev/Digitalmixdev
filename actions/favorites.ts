'use server'

import { auth } from '@clerk/nextjs/server'
import prisma from '@/lib/prisma'

export async function isFavoriteTool(toolSlug: string) {
  const { userId } = await auth()

  if (!userId) return false

  const favorite = await prisma.favoriteTool.findUnique({
    where: {
      userId_toolSlug: {
        userId,
        toolSlug,
      },
    },
  })

  return Boolean(favorite)
}

export async function toggleFavoriteTool(toolSlug: string) {
  const { userId } = await auth()

  if (!userId) return false

  const existing = await prisma.favoriteTool.findUnique({
    where: {
      userId_toolSlug: {
        userId,
        toolSlug,
      },
    },
  })

  if (existing) {
    await prisma.favoriteTool.delete({
      where: { id: existing.id },
    })

    return false
  }

  await prisma.favoriteTool.create({
    data: {
      userId,
      toolSlug,
    },
  })

  return true
}

export async function getFavoriteTools() {
  const { userId } = await auth()

  if (!userId) return []

  const favorites = await prisma.favoriteTool.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })

  const tools = [
    {
      slug: "sql-formatter",
      name: "SQL Formatter",
      href: "/tools/sql-formatter",
      description: "Format And Beautify SQL Queries.",
      icon: "Code",
    },
    {
      slug: "json-formatter",
      name: "JSON Formatter",
      href: "/tools/json-formatter",
      description: "Format And Beautify JSON Files.",
      icon: "FileCode",
    },
    {
      slug: "csv-to-json-tool",
      name: "CSV TO JSON Converter",
      href: "/tools/csv-json",
      description: "Convert CSV Files To JSON.",
      icon: "FileText",
    },
    {
      slug: "regex-tool",
      name: "Regex Tester",
      href: "/tools/regex-tester",
      description: "Instantly Test, Debug, And Analyze Your RegEx Patterns",
      icon: "Code",
    },
    {
      slug: "base64-tool",
      name: "Base64 Encoder/Decoder",
      href: "/tools/base64",
      description: "Instantly Convert Plain Text Or Binary Structures Into Safe ASCII Strings",
      icon: "Binary",
    },
    {
      slug: "jwt-tool",
      name: "JWT Decoder/Encoder",
      href: "/tools/jwt",
      description: "Decode, Encode, Verify, And Generate JSON Web Tokens (JWT) Instantly",
      icon: "Shield",
    },
    {
      slug: "hash-tool",
      name: "Hash Generator",
      href: "/tools/hash-generator",
      description: "Compute Secure Message Digests Instantly",
      icon: "Key",
    },
    {
      slug: "uuid-tool",
      name: "UUID Generator",
      href: "/tools/uuid-generator",
      description: "Instantly Provision Cryptographically Secure Unique Identifier (UUID v4) Tokens",
      icon: "Fingerprint",
    },
    {
      slug: "kpi-calculator-tool",
      name: "KPI/Financial Calculators",
      href: "/tools/kpi-calculator",
      description: "Institutional KPI Calculator Suite",
      icon: "BarChart3",
    },
    {
      slug: "pdf-merge-tool",
      name: "PDF Merger & Organizer",
      href: "/tools/pdf-merge",
      description: "Merge And Organize Files",
      icon: "Layers",
    },
    {
      slug: "image-resizer-tool",
      name: "Image Resizer",
      href: "/tools/image-resizer",
      description: "Resize , Crop And Convert Images",
      icon: "Maximize2",
    },
  ]

  return favorites
    .map((favorite) => tools.find((tool) => tool.slug === favorite.toolSlug))
    .filter((tool): tool is NonNullable<typeof tool> => Boolean(tool))
}