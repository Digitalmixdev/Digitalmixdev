'use server'

import { auth } from '@clerk/nextjs/server'
import prisma from '@/lib/prisma'

export async function markToolUsed(toolSlug: string) {
  const { userId } = await auth()

  if (!userId) return

  await prisma.toolUsage.upsert({
    where: {
      userId_toolSlug: {
        userId,
        toolSlug,
      },
    },
    update: {},
    create: {
      userId,
      toolSlug,
    },
  })
}