import { SignJWT, jwtVerify } from 'jose'

export interface SessionUser {
  id: string
  email: string
  name?: string | null
  avatarData?: string | null
  emailNotifications?: boolean
  themePreference?: string
  role: string
}

export interface SessionPayload {
  userId: string
  email: string
  name?: string | null
  role: string
}

const DEFAULT_SECRET = 'digitalmix-jwt-fallback-secret-min-32-chars-key-2026'
const AUTH_SECRET = process.env.AUTH_SECRET || DEFAULT_SECRET
const SECRET_KEY = new TextEncoder().encode(AUTH_SECRET)

const JWT_ALGORITHM = 'HS256'
const JWT_EXPIRES_IN = '7d'

/**
 * Sign a new JWT session token
 */
export async function createSessionToken(payload: SessionPayload): Promise<string> {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: JWT_ALGORITHM })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRES_IN)
    .sign(SECRET_KEY)

  return token
}

/**
 * Verify a JWT session token and return its payload if valid
 */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, SECRET_KEY, {
      algorithms: [JWT_ALGORITHM],
    })

    if (!payload || typeof payload !== 'object' || !payload.userId || !payload.email) {
      return null
    }

    return {
      userId: payload.userId as string,
      email: payload.email as string,
      name: (payload.name as string) || null,
      role: (payload.role as string) || 'USER',
    }
  } catch {
    return null
  }
}
