import type { Config } from '@netlify/functions'
import { getDb } from '../../db/index'
import { alquileres, lockers } from '../../db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { requireUser, requireGym, json, err, options } from './_helpers'

export default async function handler(req: Request): Promise<Response> {
  try {
    if (req.method === 'OPTIONS') return options()

    const user  = requireUser(req)
    const gymId = await requireGym(user)
    const url   = new URL(req.url)
    const id    = url.searchParams.get('id')
    const action = url.searchParams.get('action') // renovar | finalizar

    const db = getDb()

    // GET — listar con locker y cliente
    if (req.method === 'GET') {
      const rows = await db.query.alquileres.findMany({
        where: eq(alquileres.gymId, gymId),
        orderBy: desc(alquileres.fechaCreacion),
        with: { locker: true, cliente: true },
      })
      return json(rows)
    }

    // POST — crear alquiler
    if (req.method === 'POST') {
      const body = await req.json()
      const { lockerId, clienteId, fechaInicio, fechaVencimiento, tipoAlquiler, montoPagado, metodoPago } = body

      // Marcar locker como ocupado
      await db.update(lockers).set({ estado: 'ocupado' }).where(eq(lockers.id, lockerId))

      const [created] = await db
        .insert(alquileres)
        .values({
          gymId, lockerId, clienteId,
          fechaInicio:      new Date(fechaInicio),
          fechaVencimiento: new Date(fechaVencimiento),
          tipoAlquiler, montoPagado, metodoPago,
          estado: 'activo',
        })
        .returning()

      return json(created, 201)
    }

    // PUT?action=renovar — renovar alquiler
    if (req.method === 'PUT' && action === 'renovar') {
      if (!id) return err('Falta id')
      const body = await req.json()

      const [updated] = await db
        .update(alquileres)
        .set({
          fechaVencimiento: new Date(body.fechaVencimiento),
          montoPagado: body.montoPagado,
          metodoPago:  body.metodoPago,
          estado: 'activo',
        })
        .where(and(eq(alquileres.id, id), eq(alquileres.gymId, gymId)))
        .returning()

      // Si el locker estaba vencido, vuelve a ocupado
      await db.update(lockers).set({ estado: 'ocupado' }).where(eq(lockers.id, updated.lockerId))

      return json(updated)
    }

    // PUT?action=finalizar — finalizar alquiler
    if (req.method === 'PUT' && action === 'finalizar') {
      if (!id) return err('Falta id')

      const [updated] = await db
        .update(alquileres)
        .set({ estado: 'finalizado' })
        .where(and(eq(alquileres.id, id), eq(alquileres.gymId, gymId)))
        .returning()

      // Liberar locker
      await db.update(lockers).set({ estado: 'libre' }).where(eq(lockers.id, updated.lockerId))

      return json(updated)
    }

    return err('Método no soportado', 405)
  } catch (e: any) {
    if (e instanceof Response) return e
    console.error('API Error:', e)
    return err(e.message || String(e), 500)
  }
}

export const config: Config = { path: '/api/alquileres' }
