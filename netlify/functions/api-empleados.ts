import type { Config } from '@netlify/functions'
import { requireUser, requireGym, isAdmin, json, err, options } from './_helpers'
import { getDb } from '../../db/index'
import { empleados } from '../../db/schema'
import { eq, and } from 'drizzle-orm'

export default async function handler(req: Request): Promise<Response> {
  try {
    if (req.method === 'OPTIONS') return options()

    const user  = requireUser(req)
    const gymId = await requireGym(user)

    // Solo admins pueden gestionar empleados
    const adminOk = await isAdmin(user)
    if (!adminOk) {
      return err('Solo los administradores pueden gestionar empleados', 403)
    }

    const db = getDb()

    // ── GET: listar empleados del gym ──────────────────────────
    if (req.method === 'GET') {
      const lista = await db
        .select()
        .from(empleados)
        .where(eq(empleados.gymId, gymId))

      return json(lista.map((e) => ({
        id:     e.id,
        email:  e.email,
        nombre: e.nombre || e.email,
        rol:    'empleado',
        creado: e.fechaCreacion,
      })))
    }

    // ── POST: registrar nuevo empleado ─────────────────────────
    if (req.method === 'POST') {
      const body = await req.json()
      const { email, nombre } = body

      if (!email?.trim()) return err('El email es requerido')

      // Verificar que no exista ya en este gym
      const [existing] = await db
        .select({ id: empleados.id })
        .from(empleados)
        .where(and(eq(empleados.gymId, gymId), eq(empleados.email, email.trim().toLowerCase())))

      if (existing) return err('Ya existe un empleado con ese email en tu gimnasio', 422)

      const [nuevo] = await db
        .insert(empleados)
        .values({
          gymId,
          email: email.trim().toLowerCase(),
          nombre: nombre?.trim() || null,
        })
        .returning()

      return json({
        id:     nuevo.id,
        email:  nuevo.email,
        nombre: nuevo.nombre || nuevo.email,
        rol:    'empleado',
        creado: nuevo.fechaCreacion,
      }, 201)
    }

    // ── DELETE: eliminar empleado ──────────────────────────────
    if (req.method === 'DELETE') {
      const url      = new URL(req.url)
      const empId    = url.searchParams.get('id')
      if (!empId) return err('Falta id del empleado')

      await db
        .delete(empleados)
        .where(and(eq(empleados.id, empId), eq(empleados.gymId, gymId)))

      return json({ ok: true })
    }

    return err('Método no soportado', 405)
  } catch (e: any) {
    if (e instanceof Response) return e
    console.error('API Empleados Error:', e)
    return err(e.message || String(e), 500)
  }
}

export const config: Config = { path: '/api/empleados' }
