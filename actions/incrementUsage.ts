'use server'

import { auth } from '@clerk/nextjs/server'
import prisma from '@/lib/prisma'

export async function incrementToolUsage() {
  const { userId } = await auth()

  if (!userId) return

  await prisma.user.upsert({
    where: { clerkId: userId },
    update: {
      toolsUsedCount: {
        increment: 1,
      },
    },
    create: {
      clerkId: userId,
      toolsUsedCount: 1,
    },
  })
}