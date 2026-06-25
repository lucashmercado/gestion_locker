import type { Config } from '@netlify/functions'
import { getDb } from '../../db/index'
import { clientes } from '../../db/schema'
import { eq, and, ilike, or } from 'drizzle-orm'
import { requireUser, requireGym, json, err, options } from './_helpers'

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return options()

  const user  = requireUser(req)
  const gymId = await requireGym(user)
  const url   = new URL(req.url)
  const id    = url.searchParams.get('id')
  const q     = url.searchParams.get('q')

  const db = getDb()

  if (req.method === 'GET') {
    let rows
    if (q) {
      rows = await db.select().from(clientes)
        .where(and(
          eq(clientes.gymId, gymId),
          or(ilike(clientes.nombre, `%${q}%`), ilike(clientes.telefono ?? '', `%${q}%`))
        ))
    } else {
      rows = await db.select().from(clientes).where(eq(clientes.gymId, gymId))
    }
    return json(rows)
  }

  if (req.method === 'POST') {
    const body = await req.json()
    const [created] = await db
      .insert(clientes)
      .values({ gymId, nombre: body.nombre, telefono: body.telefono, email: body.email })
      .returning()
    return json(created, 201)
  }

  if (req.method === 'PUT') {
    if (!id) return err('Falta id')
    const body = await req.json()
    const [updated] = await db
      .update(clientes)
      .set({ nombre: body.nombre, telefono: body.telefono, email: body.email })
      .where(and(eq(clientes.id, id), eq(clientes.gymId, gymId)))
      .returning()
    return json(updated)
  }

  if (req.method === 'DELETE') {
    if (!id) return err('Falta id')
    await db.delete(clientes).where(and(eq(clientes.id, id), eq(clientes.gymId, gymId)))
    return json({ ok: true })
  }

  return err('Método no soportado', 405)
}

export const config: Config = { path: '/api/clientes' }
