import { getToken } from './auth'

const BASE = '/api'

async function request(method: string, path: string, body?: unknown) {
  const token = getToken()
  if (!token) {
    // Si no hay token de autenticación (modo demo), retornamos datos vacíos de forma segura
    if (method === 'GET') {
      if (path.includes('metrics')) {
        return {
          stats: { total: 0, ocupados: 0, disponibles: 0, vencidos: 0 },
          ingresosMensuales: 0,
          graficoIngresos: [],
          alquileresActivos: [],
          alquileresVencidos: [],
        }
      }
      return []
    }
    return {}
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  }

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `HTTP ${res.status}`)
  }

  return res.json()
}

export const api = {
  get:    (path: string)                 => request('GET',    path),
  post:   (path: string, body: unknown)  => request('POST',   path, body),
  put:    (path: string, body: unknown)  => request('PUT',    path, body),
  delete: (path: string)                 => request('DELETE', path),
}

