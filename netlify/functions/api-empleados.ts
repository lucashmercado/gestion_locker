import type { Config } from '@netlify/functions'
import { requireUser, requireGym, json, err, options } from './_helpers'

export default async function handler(req: Request): Promise<Response> {
  try {
    if (req.method === 'OPTIONS') return options()

    const user   = requireUser(req)
    const gymId  = await requireGym(user)
    const siteUrl = process.env.URL || new URL(req.url).origin
    const serviceToken = process.env.NETLIFY_IDENTITY_TOKEN

    // Solo admins pueden gestionar empleados
    if (user.app_metadata?.rol !== 'admin') {
      return err('Solo los administradores pueden gestionar empleados', 403)
    }

    if (!serviceToken) {
      return err('Configuración de servidor incompleta (NETLIFY_IDENTITY_TOKEN)', 500)
    }

    // GET /api/empleados — listar todos los usuarios del gym con rol empleado
    if (req.method === 'GET') {
      const res = await fetch(`${siteUrl}/.netlify/identity/admin/users`, {
        headers: { Authorization: `Bearer ${serviceToken}` },
      })
      if (!res.ok) {
        const text = await res.text()
        console.error('Identity list users error:', res.status, text)
        return err('Error al listar usuarios', 500)
      }
      const data = await res.json()
      // Filtrar usuarios que pertenecen a este gym
      const empleados = (data.users || [])
        .filter((u: any) =>
          u.app_metadata?.gym_id === gymId &&
          u.app_metadata?.rol === 'empleado'
        )
        .map((u: any) => ({
          id:     u.id,
          email:  u.email,
          nombre: u.user_metadata?.nombre || '',
          rol:    'empleado',
          creado: u.created_at,
        }))
      return json(empleados)
    }

    // POST /api/empleados — crear cuenta de empleado
    if (req.method === 'POST') {
      const body = await req.json()
      const { email, password, nombre } = body

      if (!email?.trim()) return err('El email es requerido')
      if (!password || password.length < 6) return err('La contraseña debe tener al menos 6 caracteres')

      // Crear usuario en Netlify Identity vía admin API
      const res = await fetch(`${siteUrl}/.netlify/identity/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          Authorization:   `Bearer ${serviceToken}`,
        },
        body: JSON.stringify({
          email,
          password,
          user_metadata:  { nombre: nombre || '' },
          app_metadata:   { rol: 'empleado', gym_id: gymId },
          confirm:        true, // Confirmar automáticamente sin email
        }),
      })

      if (!res.ok) {
        const text = await res.text()
        console.error('Identity create user error:', res.status, text)
        if (res.status === 422 || text.includes('already registered') || text.includes('already exists')) {
          return err('Ya existe un usuario con ese email', 422)
        }
        return err('Error al crear el empleado', 500)
      }

      const newUser = await res.json()
      return json({
        id:     newUser.id,
        email:  newUser.email,
        nombre: nombre || '',
        rol:    'empleado',
        creado: newUser.created_at,
      }, 201)
    }

    // DELETE /api/empleados?id=xxx — eliminar empleado
    if (req.method === 'DELETE') {
      const url = new URL(req.url)
      const userId = url.searchParams.get('id')
      if (!userId) return err('Falta id del empleado')

      // Verificar que el usuario a eliminar pertenece a este gym
      const checkRes = await fetch(`${siteUrl}/.netlify/identity/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${serviceToken}` },
      })
      if (checkRes.ok) {
        const u = await checkRes.json()
        if (u.app_metadata?.gym_id !== gymId) {
          return err('No tenés permiso para eliminar este empleado', 403)
        }
      }

      const res = await fetch(`${siteUrl}/.netlify/identity/admin/users/${userId}`, {
        method:  'DELETE',
        headers: { Authorization: `Bearer ${serviceToken}` },
      })
      if (!res.ok && res.status !== 404) {
        return err('Error al eliminar el empleado', 500)
      }
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
