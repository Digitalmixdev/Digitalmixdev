import { PrismaClient } from '@prisma/client'

// In-memory mock store for when PostgreSQL database is not connected or in preview mode
interface MemoryUser {
  id: string
  email: string
  passwordHash: string
  name: string | null
  avatarData: string | null
  emailNotifications: boolean
  themePreference: string
  role: 'USER' | 'ADMIN' | 'EDITOR' | 'PRO'
  toolsUsedCount: number
  createdAt: Date
  updatedAt: Date
}

interface MemoryFavorite {
  id: string
  userId: string
  toolSlug: string
  createdAt: Date
}

interface MemoryToolUsage {
  id: string
  userId: string
  toolSlug: string
  createdAt: Date
}

interface MemoryActivity {
  id: string
  userId: string
  toolId: string
  toolName: string
  actionTitle: string
  details: string
  inputSnippet: string | null
  outputSnippet: string | null
  metadata: string | null
  createdAt: Date
}

declare global {
  var __memoryDb: {
    users: Map<string, MemoryUser>
    favorites: MemoryFavorite[]
    toolUsage: MemoryToolUsage[]
    activities: MemoryActivity[]
  } | undefined
}

if (!globalThis.__memoryDb) {
  globalThis.__memoryDb = {
    users: new Map<string, MemoryUser>(),
    favorites: [],
    toolUsage: [],
    activities: [],
  }
}

const memoryDb = globalThis.__memoryDb

function createMemoryPrisma() {
  let idCounter = 1

  return {
    user: {
      findUnique: async (args: { where: { email?: string; id?: string }; select?: any }) => {
        let user: MemoryUser | undefined
        if (args.where.id) {
          user = memoryDb.users.get(args.where.id)
        } else if (args.where.email) {
          const targetEmail = args.where.email.toLowerCase().trim()
          for (const u of memoryDb.users.values()) {
            if (u.email.toLowerCase().trim() === targetEmail) {
              user = u
              break
            }
          }
        }
        if (!user) return null
        return { ...user }
      },
      findFirst: async (args: { where?: { email?: string; id?: string }; select?: any }) => {
        if (!args.where) return memoryDb.users.values().next().value || null
        if (args.where.id) return memoryDb.users.get(args.where.id) || null
        if (args.where.email) {
          const targetEmail = args.where.email.toLowerCase().trim()
          for (const u of memoryDb.users.values()) {
            if (u.email.toLowerCase().trim() === targetEmail) {
              return { ...u }
            }
          }
        }
        return null
      },
      create: async (args: { data: Partial<MemoryUser> & { email: string; passwordHash: string } }) => {
        const id = `user_${Date.now()}_${idCounter++}`
        const now = new Date()
        const newUser: MemoryUser = {
          id,
          email: args.data.email.toLowerCase().trim(),
          passwordHash: args.data.passwordHash,
          name: args.data.name ?? null,
          avatarData: args.data.avatarData ?? null,
          emailNotifications: args.data.emailNotifications ?? true,
          themePreference: args.data.themePreference ?? 'dark',
          role: (args.data.role as any) ?? 'USER',
          toolsUsedCount: 0,
          createdAt: now,
          updatedAt: now,
        }
        memoryDb.users.set(id, newUser)
        return { ...newUser }
      },
      update: async (args: { where: { id: string }; data: any; select?: any }) => {
        const user = memoryDb.users.get(args.where.id)
        if (!user) {
          throw new Error(`Record to update not found: user with id ${args.where.id}`)
        }
        if (args.data.toolsUsedCount?.increment) {
          user.toolsUsedCount += args.data.toolsUsedCount.increment
        } else if (typeof args.data.toolsUsedCount === 'number') {
          user.toolsUsedCount = args.data.toolsUsedCount
        }
        if (args.data.name !== undefined) user.name = args.data.name
        if (args.data.avatarData !== undefined) user.avatarData = args.data.avatarData
        if (args.data.passwordHash !== undefined) user.passwordHash = args.data.passwordHash
        if (args.data.emailNotifications !== undefined) user.emailNotifications = args.data.emailNotifications
        if (args.data.themePreference !== undefined) user.themePreference = args.data.themePreference
        user.updatedAt = new Date()
        return { ...user }
      },
      delete: async (args: { where: { id: string } }) => {
        const user = memoryDb.users.get(args.where.id)
        if (user) {
          memoryDb.users.delete(args.where.id)
        }
        // Cascade delete favorites and tool usage and activities
        memoryDb.favorites = memoryDb.favorites.filter((f) => f.userId !== args.where.id)
        memoryDb.toolUsage = memoryDb.toolUsage.filter((t) => t.userId !== args.where.id)
        memoryDb.activities = memoryDb.activities.filter((a) => a.userId !== args.where.id)
        return user ? { ...user } : { id: args.where.id }
      },
    },
    favoriteTool: {
      findFirst: async (args: { where: { userId: string; OR?: Array<{ toolSlug: string }> } }) => {
        const slugs = args.where.OR ? args.where.OR.map((o) => o.toolSlug) : []
        const found = memoryDb.favorites.find(
          (f) => f.userId === args.where.userId && slugs.includes(f.toolSlug)
        )
        return found ? { ...found } : null
      },
      findMany: async (args: { where: { userId: string; OR?: Array<{ toolSlug: string }> } }) => {
        if (args.where.OR) {
          const slugs = args.where.OR.map((o) => o.toolSlug)
          return memoryDb.favorites
            .filter((f) => f.userId === args.where.userId && slugs.includes(f.toolSlug))
            .map((f) => ({ ...f }))
        }
        return memoryDb.favorites
          .filter((f) => f.userId === args.where.userId)
          .map((f) => ({ ...f }))
      },
      deleteMany: async (args: { where: { id: { in: string[] } } }) => {
        const idsToDelete = new Set(args.where.id.in)
        const initialLen = memoryDb.favorites.length
        memoryDb.favorites = memoryDb.favorites.filter((f) => !idsToDelete.has(f.id))
        return { count: initialLen - memoryDb.favorites.length }
      },
      create: async (args: { data: { userId: string; toolSlug: string } }) => {
        const fav: MemoryFavorite = {
          id: `fav_${Date.now()}_${idCounter++}`,
          userId: args.data.userId,
          toolSlug: args.data.toolSlug,
          createdAt: new Date(),
        }
        memoryDb.favorites.push(fav)
        return { ...fav }
      },
      count: async (args: { where: { userId: string } }) => {
        return memoryDb.favorites.filter((f) => f.userId === args.where.userId).length
      },
    },
    toolUsage: {
      upsert: async (args: {
        where: { userId_toolSlug: { userId: string; toolSlug: string } }
        update: any
        create: { userId: string; toolSlug: string }
      }) => {
        const existing = memoryDb.toolUsage.find(
          (t) =>
            t.userId === args.where.userId_toolSlug.userId &&
            t.toolSlug === args.where.userId_toolSlug.toolSlug
        )
        if (existing) return { ...existing }
        const item: MemoryToolUsage = {
          id: `usage_${Date.now()}_${idCounter++}`,
          userId: args.create.userId,
          toolSlug: args.create.toolSlug,
          createdAt: new Date(),
        }
        memoryDb.toolUsage.push(item)
        return { ...item }
      },
      count: async (args: { where: { userId: string } }) => {
        return memoryDb.toolUsage.filter((t) => t.userId === args.where.userId).length
      },
    },
    activityHistory: {
      findMany: async (args: {
        where?: { userId?: string; toolId?: string }
        orderBy?: { createdAt?: 'asc' | 'desc' }
        take?: number
      }) => {
        let list = [...memoryDb.activities]
        if (args.where?.userId) {
          list = list.filter((a) => a.userId === args.where?.userId)
        }
        if (args.where?.toolId) {
          list = list.filter((a) => a.toolId === args.where?.toolId)
        }
        list.sort((a, b) => {
          const order = args.orderBy?.createdAt === 'asc' ? 1 : -1
          return (a.createdAt.getTime() - b.createdAt.getTime()) * order
        })
        if (args.take) {
          list = list.slice(0, args.take)
        }
        return list.map((a) => ({ ...a }))
      },
      create: async (args: {
        data: {
          userId: string
          toolId: string
          toolName: string
          actionTitle: string
          details: string
          inputSnippet?: string | null
          outputSnippet?: string | null
          metadata?: string | null
        }
      }) => {
        const act: MemoryActivity = {
          id: `act_${Date.now()}_${idCounter++}`,
          userId: args.data.userId,
          toolId: args.data.toolId,
          toolName: args.data.toolName,
          actionTitle: args.data.actionTitle,
          details: args.data.details,
          inputSnippet: args.data.inputSnippet ?? null,
          outputSnippet: args.data.outputSnippet ?? null,
          metadata: args.data.metadata ?? null,
          createdAt: new Date(),
        }
        memoryDb.activities.unshift(act)
        // Keep max 200 items in memory per system
        if (memoryDb.activities.length > 200) {
          memoryDb.activities = memoryDb.activities.slice(0, 200)
        }
        return { ...act }
      },
      delete: async (args: { where: { id: string } }) => {
        const idx = memoryDb.activities.findIndex((a) => a.id === args.where.id)
        if (idx !== -1) {
          const removed = memoryDb.activities.splice(idx, 1)[0]
          return { ...removed }
        }
        return { id: args.where.id }
      },
      deleteMany: async (args: { where: { userId?: string; id?: { in: string[] } } }) => {
        const initLen = memoryDb.activities.length
        if (args.where?.id?.in) {
          const set = new Set(args.where.id.in)
          memoryDb.activities = memoryDb.activities.filter((a) => !set.has(a.id))
        } else if (args.where?.userId) {
          memoryDb.activities = memoryDb.activities.filter((a) => a.userId !== args.where.userId)
        }
        return { count: initLen - memoryDb.activities.length }
      },
      count: async (args?: { where?: { userId?: string } }) => {
        const uid = args?.where?.userId
        if (uid) {
          return memoryDb.activities.filter((a) => a.userId === uid).length
        }
        return memoryDb.activities.length
      },
    },
  }
}

const memoryPrisma = createMemoryPrisma()

let realPrisma: PrismaClient | null = null

try {
  const dbUrl = (process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL || '').trim()
  if (dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://')) {
    realPrisma = new PrismaClient()
  }
} catch {
  console.warn('[AI Studio] Database connection not initialized — active memory fallback')
}

// Proxy that forwards calls to real Prisma when database is configured or falls back gracefully to in-memory store
export const prisma: any = new Proxy(
  {},
  {
    get: (_target, prop: string) => {
      if (realPrisma && prop in realPrisma) {
        const model = (realPrisma as any)[prop]
        if (typeof model === 'object' && model !== null) {
          return new Proxy(model, {
            get: (mTarget, method: string) => {
              const originalMethod = mTarget[method]
              if (typeof originalMethod === 'function') {
                return async (...params: any[]) => {
                  try {
                    return await originalMethod.apply(mTarget, params)
                  } catch (err) {
                    console.warn(`[AI Studio] Real DB call failed for ${prop}.${method}, falling back to memory store`, err)
                    if ((memoryPrisma as any)[prop]?.[method]) {
                      return await (memoryPrisma as any)[prop][method](...params)
                    }
                    throw err
                  }
                }
              }
              return originalMethod
            },
          })
        }
        return model
      }

      if ((memoryPrisma as any)[prop]) {
        return (memoryPrisma as any)[prop]
      }

      // Default no-op for any unhandled model
      return {
        findMany: async () => [],
        findFirst: async () => null,
        findUnique: async () => null,
        create: async (d: any) => d?.data ?? {},
        update: async (d: any) => d?.data ?? {},
        delete: async () => ({}),
        deleteMany: async () => ({ count: 0 }),
        count: async () => 0,
        upsert: async (d: any) => d?.create ?? {},
      }
    },
  }
)

export default prisma
