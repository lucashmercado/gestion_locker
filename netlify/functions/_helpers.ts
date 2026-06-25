// Helper: extrae y decodifica el JWT de Netlify Identity
// Netlify valida la firma automáticamente en el CDN; aquí solo leemos el payload.
export interface NLUser {
  sub:      string          // user id
  email:    string
  app_metadata: {
    gym_id?: string
    rol?:    'admin' | 'empleado'
    roles?:  string[]
  }
  user_metadata: {
    nombre?: string
  }
}

export function getUser(req: Request): NLUser | null {
  const auth = req.headers.get('Authorization') || req.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) return null
  const token = auth.slice(7)
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString())
    return payload as NLUser
  } catch {
    return null
  }
}

export function requireUser(req: Request): NLUser {
  const user = getUser(req)
  if (!user) throw new Response('Unauthorized', { status: 401 })
  return user
}

import { getDb } from '../../db/index'
import { gyms } from '../../db/schema'
import { eq } from 'drizzle-orm'

export async function requireGym(user: NLUser): Promise<string> {
  const gymId = user.app_metadata?.gym_id
  if (gymId) return gymId

  try {
    const db = getDb()
    const [gym] = await db.select({ id: gyms.id }).from(gyms).where(eq(gyms.ownerId, user.sub))
    if (gym) return gym.id
  } catch (e) {
    console.error('Failed to resolve gym from DB:', e)
  }

  throw new Response('Gym not configured', { status: 403 })
}

export const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  })
}

export function err(message: string, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  })
}

export function options() {
  return new Response(null, { status: 204, headers: CORS })
}
