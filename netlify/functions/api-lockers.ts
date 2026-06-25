import type { Config } from '@netlify/functions'
import { getDb } from '../../db/index'
import { lockers, alquileres } from '../../db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { requireUser, requireGym, json, err, options } from './_helpers'

export default async function handler(req: Request): Promise<Response> {
  try {
    if (req.method === 'OPTIONS') return options()

    const user  = requireUser(req)
    const gymId = await requireGym(user)
    const url   = new URL(req.url)
    const id    = url.searchParams.get('id')

    const db = getDb()

    // GET /api/lockers — listar con alquiler activo incluido
    if (req.method === 'GET') {
      const rows = await db.query.lockers.findMany({
        where: eq(lockers.gymId, gymId),
        orderBy: lockers.numero,
        with: {
          alquileres: {
            where: eq(alquileres.estado, 'activo'),
            limit: 1,
            orderBy: desc(alquileres.fechaCreacion),
            with: { cliente: true },
          },
        },
      })

      // Detectar vencimientos automáticamente
      const now = new Date()
      const updates: Promise<unknown>[] = []
      for (const locker of rows) {
        const activo = locker.alquileres[0]
        if (activo && activo.fechaVencimiento < now && locker.estado !== 'vencido') {
          updates.push(
            db.update(lockers).set({ estado: 'vencido' }).where(eq(lockers.id, locker.id)),
            db.update(alquileres).set({ estado: 'vencido' }).where(eq(alquileres.id, activo.id)),
          )
        }
      }
      if (updates.length) await Promise.all(updates)

      return json(rows)
    }

    // POST /api/lockers — crear locker
    if (req.method === 'POST') {
      const body = await req.json()
      const [created] = await db
        .insert(lockers)
        .values({ gymId, numero: body.numero, estado: body.estado || 'libre', observaciones: body.observaciones })
        .returning()
      return json(created, 201)
    }

    // PUT /api/lockers?id=xxx — actualizar
    if (req.method === 'PUT') {
      if (!id) return err('Falta id')
      const body = await req.json()
      const [updated] = await db
        .update(lockers)
        .set({ numero: body.numero, estado: body.estado, observaciones: body.observaciones })
        .where(and(eq(lockers.id, id), eq(lockers.gymId, gymId)))
        .returning()
      return json(updated)
    }

    // DELETE /api/lockers?id=xxx
    if (req.method === 'DELETE') {
      if (!id) return err('Falta id')
      await db.delete(lockers).where(and(eq(lockers.id, id), eq(lockers.gymId, gymId)))
      return json({ ok: true })
    }

    return err('Método no soportado', 405)
  } catch (e: any) {
    if (e instanceof Response) return e
    console.error('API Error:', e)
    return err(e.message || String(e), 500)
  }
}

export const config: Config = { path: '/api/lockers' }
