import type { Config } from '@netlify/functions'
import { getDb } from '../../db/index'
import { gyms } from '../../db/schema'
import { eq } from 'drizzle-orm'
import { getUser, requireUser, json, err, options, CORS } from './_helpers'

export default async function handler(req: Request): Promise<Response> {
  try {
    if (req.method === 'OPTIONS') return options()

    const url  = new URL(req.url)
    const user = requireUser(req)

    // GET /api/gyms — obtener el gym del usuario actual
    if (req.method === 'GET') {
      const db = getDb()
      const gymId = user.app_metadata?.gym_id
      if (gymId) {
        const [gym] = await db.select().from(gyms).where(eq(gyms.id, gymId))
        if (gym) return json(gym)
      }
      // Fallback: buscar por ownerId
      const [gymByOwner] = await db.select().from(gyms).where(eq(gyms.ownerId, user.sub))
      return json(gymByOwner ?? null)
    }

    // POST /api/gyms — crear gym para nuevo admin (llamado después del primer login)
    if (req.method === 'POST') {
      const body = await req.json()
      const { nombre, direccion, telefono } = body

      if (!nombre?.trim()) return err('El nombre es requerido')

      // Verificar si ya tiene gym
      if (user.app_metadata?.gym_id) {
        const db = getDb()
        const [existing] = await db.select().from(gyms).where(eq(gyms.id, user.app_metadata.gym_id))
        return json(existing)
      }

      const db = getDb()
      const [gym] = await db
        .insert(gyms)
        .values({ nombre, direccion, telefono, ownerId: user.sub })
        .returning()

      // Actualizar metadata del usuario en Netlify Identity
      await updateUserMeta(user.sub, { gym_id: gym.id, rol: 'admin' }, req)

      return json(gym, 201)
    }

    // PUT /api/gyms — actualizar datos del gym
    if (req.method === 'PUT') {
      const gymId = user.app_metadata?.gym_id
      if (!gymId) return err('Sin gimnasio', 403)

      const body = await req.json()
      const db = getDb()
      const [updated] = await db
        .update(gyms)
        .set({ nombre: body.nombre, direccion: body.direccion, telefono: body.telefono })
        .where(eq(gyms.id, gymId))
        .returning()
      return json(updated)
    }

    return err('Método no soportado', 405)
  } catch (e: any) {
    if (e instanceof Response) return e
    console.error('API Error:', e)
    return err(e.message || String(e), 500)
  }
}

// Actualiza app_metadata del usuario en Netlify Identity vía API de admin
async function updateUserMeta(userId: string, meta: Record<string, unknown>, req: Request) {
  const siteUrl = process.env.URL || new URL(req.url).origin
  const adminToken = req.headers.get('Authorization')

  try {
    await fetch(`${siteUrl}/.netlify/identity/admin/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: adminToken || '',
      },
      body: JSON.stringify({ app_metadata: meta }),
    })
  } catch (e) {
    console.error('Failed to update user meta:', e)
  }
}

export const config: Config = {
  path: '/api/gyms',
}
