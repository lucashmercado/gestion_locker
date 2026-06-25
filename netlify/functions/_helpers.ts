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
import { gyms, empleados } from '../../db/schema'
import { eq, and } from 'drizzle-orm'

export async function requireGym(user: NLUser): Promise<string> {
  const gymId = user.app_metadata?.gym_id
  if (gymId) return gymId

  try {
    const db = getDb()

    // Es owner del gym?
    const [gym] = await db.select({ id: gyms.id }).from(gyms).where(eq(gyms.ownerId, user.sub))
    if (gym) return gym.id

    // Es empleado registrado por email?
    if (user.email) {
      const [emp] = await db
        .select({ gymId: empleados.gymId })
        .from(empleados)
        .where(eq(empleados.email, user.email.toLowerCase()))
      if (emp) return emp.gymId
    }
  } catch (e) {
    console.error('Failed to resolve gym from DB:', e)
  }

  throw new Response('Gym not configured', { status: 403 })
}

/** Verifica si el usuario es admin comprobando ownership en la DB */
export async function isAdmin(user: NLUser): Promise<boolean> {
  // Si está explícitamente marcado como empleado en la DB, no es admin
  if (user.email) {
    try {
      const db = getDb()
      const [emp] = await db
        .select({ id: empleados.id })
        .from(empleados)
        .where(eq(empleados.email, user.email.toLowerCase()))
      if (emp) return false // es empleado
    } catch { /* ignorar */ }
  }
  // Es owner del gym?
  try {
    const db = getDb()
    const [gym] = await db.select({ id: gyms.id }).from(gyms).where(eq(gyms.ownerId, user.sub))
    return !!gym
  } catch {
    return false
  }
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
